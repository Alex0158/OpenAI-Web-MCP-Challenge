import { randomUUID } from "node:crypto";
import { createServer, type Server, type ServerResponse, type IncomingMessage } from "node:http";
import { Socket } from "node:net";

import next from "next";

import {
  ASSIGN_SOLDIER_MISSION_COMMAND_MAX_BODY_BYTES,
  ASSIGN_SOLDIER_MISSION_COMMAND_PATH,
  parseAssignSoldierMissionCommandEnvelope,
  type AssignSoldierMissionOwnedFailureCode,
} from "../shared/assign-soldier-mission-command";
import {
  MOVE_PLAYER_COMMAND_MAX_BODY_BYTES,
  MOVE_PLAYER_COMMAND_PATH,
  parseMovePlayerCommandEnvelope,
} from "../shared/move-player-command";
import { loadRuntimeConfig, type RuntimeConfig } from "./config";
import { createPersistenceStore, PersistenceError, PersistenceStore } from "./persistence/store";
import {
  LOCAL_FIXTURE_COOKIE_NAME,
  LocalFixtureSessionResolver,
  prepareLocalFixture,
  toLocalFixtureBootstrapPayload,
  type LocalFixtureBootstrapPayload,
  type LocalFixtureResolution,
} from "./fixture-session";
import { handleHealthRequest } from "./health";
import { JsonLogger, writeBootstrapError } from "./logging";
import { createScopedCommandAdmission } from "./scoped-command-admission";
import {
  createRuntimeStartController,
  RuntimeLifecycleError,
  RuntimeRegistry,
  type HealthStatus,
  type StartOutcome,
} from "./runtime";
import { WorldWorkerModule, type WorkerPersistence, type WorldWorker } from "./world-worker";
import { RealtimeSnapshotHub } from "./realtime-snapshot";
import {
  RealtimeWireAdapter,
  rejectRealtimeUpgrade,
  type RealtimeRuntimeAdmission,
  type RealtimeSessionResolver,
  type RealtimeWireAdapterContract,
} from "./realtime-wire";
import { WorkerGatewayError } from "./worker-command-gateway";
import type { MonsterCombatSignalEligibilityProvider } from "./monster-combat-service";
import {
  PAGE_TOOLS_EXECUTE_PATH,
  PAGE_TOOLS_MAX_BODY_BYTES,
  parsePageToolExecutionRequest,
  type ForceRecallSoldierInput as PageRecallInput,
  type PageToolExecutionRequest,
} from "../shared/page-tool-contract";

interface NextApplication {
  prepare(): Promise<void>;
  getRequestHandler(): (req: IncomingMessage, res: ServerResponse) => void;
  getUpgradeHandler?: () => (req: IncomingMessage, socket: Socket, head: Buffer) => void;
  close?: () => Promise<void> | void;
}

export interface EntrypointDependencies {
  config: RuntimeConfig;
  createNextApp?: (options: { dev: boolean; hostname: string; port: number }) => NextApplication;
  createWorker?: (options?: {
    store?: WorkerPersistence;
    autonomous?: boolean;
    signalEligibilityProvider?: MonsterCombatSignalEligibilityProvider;
  }) => WorldWorker;
  createHttpServer?: (handler: (req: IncomingMessage, res: ServerResponse) => void) => Server;
  logger?: JsonLogger;
  realtime?: RealtimeWireAdapterContract;
  realtimeSessionResolver?: RealtimeSessionResolver;
}

const localFixtureSignalEligibilityProvider: MonsterCombatSignalEligibilityProvider = ({ shelterId }) => {
  const opaqueBinding = shelterId === "shelter-a"
    ? "fixture-binding-a"
    : shelterId === "shelter-b"
      ? "fixture-binding-b"
      : null;
  if (opaqueBinding === null) {
    return undefined;
  }
  return {
    shelterId,
    opaqueBinding,
    grantId: `local-fixture-reentry-grant:${shelterId}`,
    boundedAction: "force_recall_soldier",
    severity: "warning",
    cooldownWorldSeconds: 60,
  };
};

export interface Entrypoint {
  readonly registry: RuntimeRegistry;
  readonly server: Server | null;
  start(): Promise<StartOutcome>;
  shutdown(signal: "SIGTERM" | "SIGINT" | "test"): Promise<ShutdownResult>;
  address(): ReturnType<Server["address"]>;
}

export interface ShutdownResult {
  timedOut: boolean;
  errorCode: string | null;
}

function pathOf(url: string | undefined): string {
  if (!url) {
    return "/";
  }
  try {
    return new URL(url, "http://sleepless-kingdom.local").pathname;
  } catch {
    return url.split("?", 1)[0] ?? "/";
  }
}

function errorCode(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message && /^[A-Z0-9_]+$/.test(error.message)) {
    return error.message;
  }
  return fallback;
}

function listen(server: Server, config: RuntimeConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(config.port, config.host);
  });
}

interface ServerCloseResult {
  timedOut: boolean;
  errorCode: string | null;
}

function closeServer(server: Server, sockets: Set<Socket>, timeoutMs: number): Promise<ServerCloseResult> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (result: ServerCloseResult) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };
    const timeout = setTimeout(() => {
      for (const socket of sockets) {
        socket.destroy();
      }
      settle({ timedOut: true, errorCode: null });
    }, timeoutMs);
    timeout.unref();
    try {
      server.close((error) => settle({ timedOut: false, errorCode: error ? "HTTP_CLOSE_FAILED" : null }));
    } catch {
      settle({ timedOut: false, errorCode: "HTTP_CLOSE_FAILED" });
    }
  });
}

function realtimeAdmission(registry: RuntimeRegistry): RealtimeRuntimeAdmission {
  switch (registry.state) {
    case "ready":
      return "ready";
    case "degraded":
      return "degraded";
    case "draining":
      return "draining";
    case "stopped":
      return "stopped";
    case "failed":
      return "failed";
    case "created":
    case "starting":
      return "starting";
  }
}

function writeJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
  headers: Record<string, string> = {},
): void {
  const body = JSON.stringify(payload);
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Vary", "Cookie");
  for (const [name, value] of Object.entries(headers)) {
    response.setHeader(name, value);
  }
  response.setHeader("Content-Length", String(Buffer.byteLength(body)));
  response.end(body);
}

function fixtureReadinessError(state: RuntimeRegistry["state"]): string {
  switch (state) {
    case "starting":
    case "created":
      return "LOCAL_FIXTURE_NOT_READY";
    case "degraded":
      return "LOCAL_FIXTURE_DEGRADED";
    case "draining":
      return "LOCAL_FIXTURE_DRAINING";
    case "stopped":
    case "failed":
      return "LOCAL_FIXTURE_CLOSED";
    case "ready":
      return "";
  }
}

function fixtureResolutionError(resolution: Extract<LocalFixtureResolution, { kind: "rejected" }>): { status: number; code: string } {
  const code = resolution.reason === "MISSING_SESSION"
    ? "LOCAL_FIXTURE_SESSION_REQUIRED"
    : resolution.reason === "UNKNOWN_SESSION"
      ? "LOCAL_FIXTURE_SESSION_UNKNOWN"
      : "LOCAL_FIXTURE_SESSION_MALFORMED";
  return {
    status: 401,
    code,
  };
}

type BoundedJsonResult =
  | { readonly kind: "value"; readonly value: unknown }
  | { readonly kind: "invalid" }
  | { readonly kind: "too_large" };

function hasJsonMediaType(request: IncomingMessage): boolean {
  const header = request.headers["content-type"];
  if (typeof header !== "string") {
    return false;
  }
  return (header.split(";", 1)[0] ?? "").trim().toLowerCase() === "application/json";
}

function declaredBodyLength(request: IncomingMessage): number | null | "invalid" {
  const header = request.headers["content-length"];
  if (header === undefined) {
    return null;
  }
  if (typeof header !== "string" || !/^(0|[1-9][0-9]*)$/.test(header)) {
    return "invalid";
  }
  const length = Number(header);
  return Number.isSafeInteger(length) ? length : "invalid";
}

function readBoundedJson(request: IncomingMessage, maxBodyBytes: number): Promise<BoundedJsonResult> {
  const declared = declaredBodyLength(request);
  if (declared === "invalid") {
    request.resume();
    return Promise.resolve({ kind: "invalid" });
  }
  if (declared !== null && declared > maxBodyBytes) {
    request.resume();
    return Promise.resolve({ kind: "too_large" });
  }

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let bytes = 0;
    let settled = false;

    const cleanup = () => {
      request.off("data", onData);
      request.off("end", onEnd);
      request.off("error", onFailure);
      request.off("aborted", onFailure);
    };
    const settle = (result: BoundedJsonResult) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(result);
    };
    const onData = (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buffer.byteLength;
      if (bytes > maxBodyBytes) {
        settle({ kind: "too_large" });
        request.resume();
        return;
      }
      chunks.push(buffer);
    };
    const onEnd = () => {
      try {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
        settle({ kind: "value", value: JSON.parse(text) as unknown });
      } catch {
        settle({ kind: "invalid" });
      }
    };
    const onFailure = () => settle({ kind: "invalid" });

    request.on("data", onData);
    request.once("end", onEnd);
    request.once("error", onFailure);
    request.once("aborted", onFailure);
  });
}

function hasQueryComponent(url: string | undefined): boolean {
  return typeof url === "string" && url.includes("?");
}

function movementCommandFailure(error: unknown): {
  readonly status: number;
  readonly code: string;
  readonly definitive: boolean;
} {
  if (error instanceof WorkerGatewayError) {
    return { status: 503, code: error.code, definitive: false };
  }
  if (!(error instanceof PersistenceError)) {
    return { status: 500, code: "RECOVERY_REQUIRED", definitive: false };
  }
  switch (error.code) {
    case "INVALID_INPUT":
      return { status: 400, code: "MOVE_PLAYER_COMMAND_INVALID", definitive: false };
    case "OWNERSHIP_DENIED":
      return { status: 401, code: "NOT_OWNER", definitive: false };
    case "MOVEMENT_BLOCKED":
    case "STALE_REVISION":
    case "DUPLICATE_COMMAND":
      return { status: 409, code: error.code, definitive: true };
    case "BUSY_RETRYABLE":
    case "STORE_NOT_OPEN":
      return { status: 503, code: error.code, definitive: false };
    default:
      return { status: 500, code: "RECOVERY_REQUIRED", definitive: false };
  }
}

type MissionCommandFailure =
  | { readonly kind: "owned"; readonly code: AssignSoldierMissionOwnedFailureCode }
  | { readonly kind: "ownership" }
  | { readonly kind: "private" }
  | { readonly kind: "transport"; readonly status: number; readonly code: string };

function missionCommandFailure(error: unknown): MissionCommandFailure {
  if (error instanceof WorkerGatewayError) {
    return { kind: "transport", status: 503, code: error.code };
  }
  if (!(error instanceof PersistenceError)) {
    return { kind: "transport", status: 500, code: "RECOVERY_REQUIRED" };
  }
  switch (error.code) {
    case "STALE_REVISION":
    case "ROLE_LOCKED":
    case "NOT_AT_SHELTER":
    case "TARGET_UNAVAILABLE":
    case "TOOL_INCOMPATIBLE":
    case "MISSION_ACTIVE":
    case "DUPLICATE_COMMAND":
      return { kind: "owned", code: error.code };
    case "OWNERSHIP_DENIED":
      return { kind: "ownership" };
    case "ENTITY_NOT_FOUND":
      return { kind: "private" };
    case "BUSY_RETRYABLE":
    case "STORE_NOT_OPEN":
      return { kind: "transport", status: 503, code: error.code };
    default:
      return { kind: "transport", status: 500, code: "RECOVERY_REQUIRED" };
  }
}

function pageToolFailure(error: unknown): { readonly status: number; readonly code: string } {
  if (error instanceof WorkerGatewayError) {
    return { status: 503, code: "WEBMCP_UNAVAILABLE" };
  }
  if (!(error instanceof PersistenceError)) {
    return { status: 500, code: "RECOVERY_REQUIRED" };
  }
  switch (error.code) {
    case "INVALID_INPUT":
      return { status: 400, code: "PAGE_TOOL_INPUT_INVALID" };
    case "OWNERSHIP_DENIED":
      return { status: 403, code: "NOT_OWNER" };
    case "STALE_REVISION":
    case "STALE_REENTRY_CONTEXT":
    case "DUPLICATE_COMMAND":
    case "ALREADY_AT_SHELTER":
    case "IN_COMBAT":
    case "ROLE_LOCKED":
    case "MISSION_ACTIVE":
      return { status: 409, code: error.code };
    case "SIGNAL_NOT_FOUND":
      return { status: 409, code: "STALE_REENTRY_CONTEXT" };
    case "BUSY_RETRYABLE":
    case "STORE_NOT_OPEN":
      return { status: 503, code: "RECOVERY_REQUIRED" };
    default:
      return { status: 500, code: "RECOVERY_REQUIRED" };
  }
}

function pageToolScope(context: LocalFixtureResolution & { kind: "resolved" }): {
  readonly world_id: string;
  readonly player_id: string;
  readonly shelter_id: string;
} {
  return {
    world_id: context.context.worldId,
    player_id: context.context.playerId,
    shelter_id: context.context.shelterId,
  };
}

export function createEntrypoint(dependencies: EntrypointDependencies): Entrypoint {
  const { config } = dependencies;
  const fixtureEnabled = config.localFixtureMode && config.nodeEnv !== "production";
  const fixtureStore: PersistenceStore | null = fixtureEnabled
    ? createPersistenceStore({ dbPath: config.gameDbPath })
    : null;
  const createWorker = dependencies.createWorker
    ?? ((options?: {
      store?: WorkerPersistence;
      autonomous?: boolean;
      signalEligibilityProvider?: MonsterCombatSignalEligibilityProvider;
    }) => options?.store
      ? new WorldWorkerModule({
          store: options.store,
          autonomous: options.autonomous,
          signalEligibilityProvider: options.signalEligibilityProvider,
        })
      : new WorldWorkerModule({
          dbPath: config.gameDbPath,
          autonomous: options?.autonomous,
          signalEligibilityProvider: options?.signalEligibilityProvider,
        }));
  const worker = createWorker({
    ...(fixtureStore ? { store: fixtureStore } : {}),
    autonomous: config.autonomousWorldMode,
    ...(fixtureEnabled ? { signalEligibilityProvider: localFixtureSignalEligibilityProvider } : {}),
  });
  const registry = new RuntimeRegistry(undefined, worker.instanceId);
  const createRealtimeAdapter = (resolver: RealtimeSessionResolver): RealtimeWireAdapter => new RealtimeWireAdapter({
    hub: new RealtimeSnapshotHub({ gateway: worker.gateway as NonNullable<WorldWorker["gateway"]> }),
    sessionResolver: resolver,
    admission: () => realtimeAdmission(registry),
    movement: worker.gateway,
    ...(fixtureStore ? { contractVersion: fixtureStore.contractVersion } : {}),
  });
  let fixtureResolver: LocalFixtureSessionResolver | null = null;
  let realtimeAdapter = dependencies.realtime
    ?? (dependencies.realtimeSessionResolver && worker.gateway
      ? createRealtimeAdapter(dependencies.realtimeSessionResolver)
      : null);
  let realtimeProgressWired = false;
  const observedRealtimePublications = new WeakSet<Promise<void>>();
  const wireRealtimeProgress = (): void => {
    const adapter = realtimeAdapter;
    if (
      realtimeProgressWired
      || !adapter
      || typeof worker.onAdvance !== "function"
      || typeof adapter.publishCurrentSnapshots !== "function"
    ) {
      return;
    }
    worker.onAdvance(() => {
      // Projection publication is deliberately detached from the authoritative
      // advance promise. A slow or failed sink cannot delay or fault gameplay.
      try {
        // The hub owns a stable single pump and contains per-connection
        // failures; the entrypoint does not create one waiting promise per wake.
        const publication = adapter.publishCurrentSnapshots?.();
        if (!publication || observedRealtimePublications.has(publication)) {
          return;
        }
        // Observe each distinct returned promise once. The real hub returns a
        // stable pump while work is active; an injected adapter that alternates
        // promises cannot create one rejection reaction per worker wake.
        observedRealtimePublications.add(publication);
        void publication.then(
          () => undefined,
          () => undefined,
        );
      } catch {
        // An injected adapter is outside the worker authority boundary.
      }
    });
    realtimeProgressWired = true;
  };
  wireRealtimeProgress();
  const logger = dependencies.logger ?? new JsonLogger({
    level: config.logLevel,
    processInstanceId: registry.processInstanceId,
    workerInstanceId: registry.workerInstanceId,
  });
  const createNextApp = dependencies.createNextApp ?? ((options) => next(options));
  const createHttpServer = dependencies.createHttpServer ?? ((handler) => createServer(handler));
  const startController = createRuntimeStartController(registry, config);
  const commandAdmission = createScopedCommandAdmission();
  const sockets = new Set<Socket>();
  let nextApp: NextApplication | null = null;
  let httpServer: Server | null = null;
  let nextPrepared = false;
  let startPromise: Promise<StartOutcome> | null = null;
  let shutdownPromise: Promise<ShutdownResult> | null = null;

  const handleFixtureBootstrap = (req: IncomingMessage, res: ServerResponse): void => {
    if (req.method !== "GET") {
      writeJson(res, 405, { error_code: "LOCAL_FIXTURE_METHOD_NOT_ALLOWED" }, { Allow: "GET" });
      return;
    }
    if (!fixtureEnabled) {
      writeJson(res, 503, { error_code: "LOCAL_FIXTURE_UNAVAILABLE" });
      return;
    }
    const readinessError = fixtureReadinessError(registry.state);
    if (readinessError !== "") {
      writeJson(res, 503, { error_code: readinessError });
      return;
    }
    if (!fixtureResolver || !fixtureStore?.isOpen) {
      writeJson(res, 503, { error_code: "LOCAL_FIXTURE_UNAVAILABLE" });
      return;
    }
    const resolution = fixtureResolver.resolveBootstrap(req);
    if (resolution.kind === "rejected") {
      const rejected = fixtureResolutionError(resolution);
      writeJson(res, rejected.status, { error_code: rejected.code });
      return;
    }
    const payload: LocalFixtureBootstrapPayload = toLocalFixtureBootstrapPayload(
      resolution.context,
      fixtureStore.contractVersion,
    );
    const headers: Record<string, string> = {};
    if (resolution.issueCookie) {
      headers["Set-Cookie"] = `${LOCAL_FIXTURE_COOKIE_NAME}=${resolution.handle}; Path=/; HttpOnly; SameSite=Lax`;
    }
    writeJson(res, 200, payload, headers);
  };

  const handleMovePlayerCommand = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method !== "POST") {
      req.resume();
      writeJson(res, 405, { error_code: "MOVE_PLAYER_METHOD_NOT_ALLOWED" }, { Allow: "POST" });
      return;
    }
    if (!fixtureEnabled) {
      req.resume();
      writeJson(res, 503, { error_code: "LOCAL_FIXTURE_UNAVAILABLE" });
      return;
    }
    const readinessError = fixtureReadinessError(registry.state);
    if (readinessError !== "") {
      req.resume();
      writeJson(res, 503, { error_code: readinessError });
      return;
    }
    const gateway = worker.gateway;
    if (!fixtureResolver || !fixtureStore?.isOpen || !gateway) {
      req.resume();
      writeJson(res, 503, { error_code: "LOCAL_FIXTURE_UNAVAILABLE" });
      return;
    }
    const resolution = fixtureResolver.resolveExistingSession(req);
    if (resolution.kind === "rejected") {
      req.resume();
      const rejected = fixtureResolutionError(resolution);
      writeJson(res, rejected.status, { error_code: rejected.code });
      return;
    }
    if (!hasJsonMediaType(req)) {
      req.resume();
      writeJson(res, 415, { error_code: "MOVE_PLAYER_UNSUPPORTED_MEDIA_TYPE" });
      return;
    }

    const body = await readBoundedJson(req, MOVE_PLAYER_COMMAND_MAX_BODY_BYTES);
    if (body.kind === "too_large") {
      writeJson(res, 413, { error_code: "MOVE_PLAYER_PAYLOAD_TOO_LARGE" });
      return;
    }
    if (body.kind === "invalid") {
      writeJson(res, 400, { error_code: "MOVE_PLAYER_COMMAND_INVALID" });
      return;
    }

    let command;
    try {
      command = parseMovePlayerCommandEnvelope(body.value);
    } catch {
      writeJson(res, 400, { error_code: "MOVE_PLAYER_COMMAND_INVALID" });
      return;
    }
    if (command.contract_version !== fixtureStore.contractVersion) {
      writeJson(res, 400, { error_code: "MOVE_PLAYER_CONTRACT_UNSUPPORTED" });
      return;
    }

    const postParseReadinessError = fixtureReadinessError(registry.state);
    if (postParseReadinessError !== "") {
      writeJson(res, 503, { error_code: postParseReadinessError });
      return;
    }

    const admission = commandAdmission.begin(`${resolution.context.worldId}\u0000${resolution.context.playerId}`);
    if (!admission) {
      writeJson(res, 429, { error_code: "MOVE_PLAYER_COMMAND_IN_FLIGHT" });
      return;
    }

    try {
      const result = await gateway.movePlayer({
        worldId: resolution.context.worldId,
        playerId: resolution.context.playerId,
        binding: resolution.context.binding,
        commandId: command.command_id,
        direction: command.typed_arguments.direction,
        expectedRevision: command.expected_entity_revisions.player,
        idempotencyKey: command.idempotency_key,
      });
      writeJson(res, 200, {
        command_id: command.command_id,
        command_type: "move_player",
        contract_version: result.contractVersion,
        effect: result.effect,
        duplicate: result.duplicate ?? false,
        event_id: result.eventId,
        current_entity_revisions: { player: result.revision },
      });
    } catch (error) {
      const failure = movementCommandFailure(error);
      if (failure.definitive) {
        const currentPlayer = fixtureStore.getPlayer(resolution.context.worldId, resolution.context.playerId);
        if (!currentPlayer) {
          writeJson(res, 500, { error_code: "RECOVERY_REQUIRED" });
        } else {
          writeJson(res, failure.status, {
            command_id: command.command_id,
            command_type: "move_player",
            contract_version: fixtureStore.contractVersion,
            effect: "rejected",
            error_code: failure.code,
            current_entity_revisions: { player: currentPlayer.revision },
          });
        }
      } else {
        writeJson(res, failure.status, { error_code: failure.code });
      }
    } finally {
      commandAdmission.complete(admission);
    }
  };

  const handleAssignSoldierMissionCommand = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method !== "POST") {
      req.resume();
      writeJson(res, 405, { error_code: "ASSIGN_SOLDIER_MISSION_METHOD_NOT_ALLOWED" }, { Allow: "POST" });
      return;
    }
    if (!fixtureEnabled) {
      req.resume();
      writeJson(res, 503, { error_code: "LOCAL_FIXTURE_UNAVAILABLE" });
      return;
    }
    const readinessError = fixtureReadinessError(registry.state);
    if (readinessError !== "") {
      req.resume();
      writeJson(res, 503, { error_code: readinessError });
      return;
    }
    const gateway = worker.gateway;
    if (!fixtureResolver || !fixtureStore?.isOpen || !gateway) {
      req.resume();
      writeJson(res, 503, { error_code: "LOCAL_FIXTURE_UNAVAILABLE" });
      return;
    }
    const resolution = fixtureResolver.resolveExistingSession(req);
    if (resolution.kind === "rejected") {
      req.resume();
      const rejected = fixtureResolutionError(resolution);
      writeJson(res, rejected.status, { error_code: rejected.code });
      return;
    }
    if (hasQueryComponent(req.url)) {
      req.resume();
      writeJson(res, 400, { error_code: "ASSIGN_SOLDIER_MISSION_COMMAND_INVALID" });
      return;
    }
    if (!hasJsonMediaType(req)) {
      req.resume();
      writeJson(res, 415, { error_code: "ASSIGN_SOLDIER_MISSION_UNSUPPORTED_MEDIA_TYPE" });
      return;
    }

    const body = await readBoundedJson(req, ASSIGN_SOLDIER_MISSION_COMMAND_MAX_BODY_BYTES);
    if (body.kind === "too_large") {
      writeJson(res, 413, { error_code: "ASSIGN_SOLDIER_MISSION_PAYLOAD_TOO_LARGE" });
      return;
    }
    if (body.kind === "invalid") {
      writeJson(res, 400, { error_code: "ASSIGN_SOLDIER_MISSION_COMMAND_INVALID" });
      return;
    }

    let command;
    try {
      command = parseAssignSoldierMissionCommandEnvelope(body.value);
    } catch {
      writeJson(res, 400, { error_code: "ASSIGN_SOLDIER_MISSION_COMMAND_INVALID" });
      return;
    }
    if (command.contract_version !== fixtureStore.contractVersion) {
      writeJson(res, 400, { error_code: "ASSIGN_SOLDIER_MISSION_CONTRACT_UNSUPPORTED" });
      return;
    }

    const postParseReadinessError = fixtureReadinessError(registry.state);
    if (postParseReadinessError !== "") {
      writeJson(res, 503, { error_code: postParseReadinessError });
      return;
    }

    const admission = commandAdmission.begin(`${resolution.context.worldId}\u0000${resolution.context.playerId}`);
    if (!admission) {
      writeJson(res, 429, { error_code: "ASSIGN_SOLDIER_MISSION_COMMAND_IN_FLIGHT" });
      return;
    }

    const writePrivateFailure = (): void => {
      writeJson(res, 403, {
        command_id: command.command_id,
        command_type: "assign_soldier_mission",
        contract_version: fixtureStore.contractVersion,
        effect: "rejected",
        error_code: "NOT_OWNER",
        current_entity_revisions: {},
      });
    };

    try {
      const result = await gateway.assignSoldierMission({
        worldId: resolution.context.worldId,
        playerId: resolution.context.playerId,
        binding: resolution.context.binding,
        commandId: command.command_id,
        soldierId: command.typed_arguments.soldier_id,
        role: command.typed_arguments.role,
        tool: command.typed_arguments.tool,
        equipmentTier: command.typed_arguments.equipment_tier,
        targetId: command.typed_arguments.target_id,
        expectedSoldierRevision: command.expected_entity_revisions.soldier,
        returnPolicy: command.typed_arguments.return_policy,
        idempotencyKey: command.idempotency_key,
      });
      writeJson(res, 200, {
        command_id: command.command_id,
        command_type: "assign_soldier_mission",
        contract_version: result.contractVersion,
        effect: result.effect,
        duplicate: result.duplicate ?? false,
        soldier_id: result.soldierId,
        mission_id: result.missionId,
        mission_attempt_id: result.missionAttemptId,
        event_id: result.eventId,
        committed_entity_revisions: {
          soldier: result.soldierRevision,
          mission: result.missionRevision,
          mission_attempt: result.missionAttemptRevision,
        },
      });
    } catch (error) {
      const failure = missionCommandFailure(error);
      if (failure.kind === "private") {
        writePrivateFailure();
      } else if (failure.kind === "transport") {
        writeJson(res, failure.status, { error_code: failure.code });
      } else {
        try {
          const snapshot = await gateway.fullSnapshot({
            worldId: resolution.context.worldId,
            playerId: resolution.context.playerId,
            binding: resolution.context.binding,
          });
          const soldier = snapshot.soldiers.find(
            (candidate) => candidate.soldierId === command.typed_arguments.soldier_id,
          );
          if (!soldier) {
            writePrivateFailure();
          } else {
            writeJson(res, 409, {
              command_id: command.command_id,
              command_type: "assign_soldier_mission",
              contract_version: fixtureStore.contractVersion,
              effect: "rejected",
              error_code: failure.kind === "ownership" ? "TARGET_UNAVAILABLE" : failure.code,
              current_entity_revisions: { soldier: soldier.revision },
            });
          }
        } catch {
          writeJson(res, 500, { error_code: "RECOVERY_REQUIRED" });
        }
      }
    } finally {
      commandAdmission.complete(admission);
    }
  };

  const handlePageToolExecute = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method !== "POST") {
      req.resume();
      writeJson(res, 405, { error_code: "PAGE_TOOL_METHOD_NOT_ALLOWED" }, { Allow: "POST" });
      return;
    }
    if (!fixtureEnabled) {
      req.resume();
      writeJson(res, 503, { error_code: "WEBMCP_UNAVAILABLE" });
      return;
    }
    const readinessError = fixtureReadinessError(registry.state);
    if (readinessError !== "") {
      req.resume();
      writeJson(res, 503, { error_code: "WEBMCP_UNAVAILABLE" });
      return;
    }
    const gateway = worker.gateway;
    if (!fixtureResolver || !fixtureStore?.isOpen || !gateway) {
      req.resume();
      writeJson(res, 503, { error_code: "WEBMCP_UNAVAILABLE" });
      return;
    }
    const resolution = fixtureResolver.resolveExistingSession(req);
    if (resolution.kind === "rejected") {
      req.resume();
      const rejected = fixtureResolutionError(resolution);
      writeJson(res, rejected.status, { error_code: rejected.code });
      return;
    }
    if (hasQueryComponent(req.url)) {
      req.resume();
      writeJson(res, 400, { error_code: "PAGE_TOOL_INPUT_INVALID" });
      return;
    }
    if (!hasJsonMediaType(req)) {
      req.resume();
      writeJson(res, 415, { error_code: "PAGE_TOOL_UNSUPPORTED_MEDIA_TYPE" });
      return;
    }

    const body = await readBoundedJson(req, PAGE_TOOLS_MAX_BODY_BYTES);
    if (body.kind === "too_large") {
      writeJson(res, 413, { error_code: "PAGE_TOOL_PAYLOAD_TOO_LARGE" });
      return;
    }
    if (body.kind === "invalid") {
      writeJson(res, 400, { error_code: "PAGE_TOOL_INPUT_INVALID" });
      return;
    }

    let command: PageToolExecutionRequest;
    try {
      command = parsePageToolExecutionRequest(body.value);
    } catch {
      writeJson(res, 400, { error_code: "PAGE_TOOL_INPUT_INVALID" });
      return;
    }

    const requestId = `page-tool-request:${randomUUID()}`;
    const base = {
      worldId: resolution.context.worldId,
      playerId: resolution.context.playerId,
      binding: resolution.context.binding,
    };
    try {
      switch (command.tool) {
        case "inspect_shelter_state":
          writeJson(res, 200, await gateway.inspectShelterState({ ...base, requestId }));
          return;
        case "inspect_client_snapshot":
          writeJson(res, 200, await gateway.inspectClientSnapshot({ ...base, requestId }));
          return;
        case "inspect_missions":
          writeJson(res, 200, await gateway.inspectMissions({ ...base, requestId }));
          return;
        case "inspect_mission_history": {
          const input = command.input as { readonly cursor?: string; readonly limit?: number };
          writeJson(res, 200, await gateway.inspectMissionHistory({
            ...base,
            requestId,
            ...(input.cursor === undefined ? {} : { cursor: input.cursor }),
            ...(input.limit === undefined ? {} : { limit: input.limit }),
          }));
          return;
        }
        case "force_recall_soldier": {
          const input = command.input as PageRecallInput;
          const result = await gateway.forceRecallSoldier({
            ...base,
            commandId: input.command_id,
            soldierId: input.soldier_id,
            missionId: input.mission_id,
            missionAttemptId: input.mission_attempt_id,
            expectedSoldierRevision: input.expected_entity_revisions.soldier,
            expectedMissionRevision: input.expected_entity_revisions.mission,
            expectedMissionAttemptRevision: input.expected_entity_revisions.mission_attempt,
            idempotencyKey: input.idempotency_key,
            signalId: input.signal_id,
            ...(input.causal_event_id === undefined ? {} : { causalEventId: input.causal_event_id }),
          });
          writeJson(res, 200, {
            contract_version: result.contractVersion,
            status: "committed",
            tool: "force_recall_soldier",
            request_id: requestId,
            scope: pageToolScope(resolution),
            command_id: input.command_id,
            effect: result.effect,
            duplicate: result.duplicate ?? false,
            soldier_id: result.soldierId,
            mission_id: result.missionId,
            mission_attempt_id: result.missionAttemptId,
            event_id: result.eventId,
            previous_phase: result.previousPhase,
            phase: result.phase,
            committed_entity_revisions: {
              soldier: result.soldierRevision,
              mission: result.missionRevision,
              mission_attempt: result.missionAttemptRevision,
            },
            full_snapshot_required: true,
          });
          return;
        }
      }
    } catch (error) {
      const failure = pageToolFailure(error);
      if (command.tool !== "force_recall_soldier") {
        writeJson(res, failure.status, { error_code: failure.code });
        return;
      }
      const input = command.input as PageRecallInput;
      const soldier = fixtureStore.listSoldiers(resolution.context.worldId)
        .find((candidate) => candidate.soldierId === input.soldier_id && candidate.shelterId === resolution.context.shelterId);
      const mission = fixtureStore.getMission(resolution.context.worldId, input.mission_id);
      const attempt = fixtureStore.getMissionAttempt(resolution.context.worldId, input.mission_attempt_id);
      const revisions = soldier && mission?.soldierId === soldier.soldierId && attempt?.missionId === mission.missionId
        ? {
            soldier: soldier.revision,
            mission: mission.revision,
            mission_attempt: attempt.revision,
          }
        : {};
      writeJson(res, failure.status, {
        contract_version: fixtureStore.contractVersion,
        status: "rejected",
        tool: "force_recall_soldier",
        request_id: requestId,
        scope: pageToolScope(resolution),
        command_id: input.command_id,
        effect: "rejected",
        error_code: failure.code,
        current_entity_revisions: revisions,
      });
    }
  };

  const handleRequest = (req: IncomingMessage, res: ServerResponse): void => {
    if (handleHealthRequest(req, res, () => registry.health())) {
      return;
    }
    if (pathOf(req.url) === "/api/local-fixture/bootstrap") {
      handleFixtureBootstrap(req, res);
      return;
    }
    if (pathOf(req.url) === MOVE_PLAYER_COMMAND_PATH) {
      void handleMovePlayerCommand(req, res).catch(() => {
        if (!res.headersSent && !res.writableEnded && !res.destroyed) {
          writeJson(res, 500, { error_code: "RECOVERY_REQUIRED" });
        } else if (!res.writableEnded) {
          res.destroy();
        }
      });
      return;
    }
    if (pathOf(req.url) === ASSIGN_SOLDIER_MISSION_COMMAND_PATH) {
      void handleAssignSoldierMissionCommand(req, res).catch(() => {
        if (!res.headersSent && !res.writableEnded && !res.destroyed) {
          writeJson(res, 500, { error_code: "RECOVERY_REQUIRED" });
        } else if (!res.writableEnded) {
          res.destroy();
        }
      });
      return;
    }
    if (pathOf(req.url) === PAGE_TOOLS_EXECUTE_PATH) {
      void handlePageToolExecute(req, res).catch(() => {
        if (!res.headersSent && !res.writableEnded && !res.destroyed) {
          writeJson(res, 500, { error_code: "RECOVERY_REQUIRED" });
        } else if (!res.writableEnded) {
          res.destroy();
        }
      });
      return;
    }
    if (!nextApp) {
      res.statusCode = 503;
      res.end("starting");
      return;
    }
    nextApp.getRequestHandler()(req, res);
  };

  const handleUpgrade = (req: IncomingMessage, socket: Socket, head: Buffer): void => {
    const pathname = pathOf(req.url);
    if (pathname === "/realtime") {
      if (!realtimeAdapter) {
        rejectRealtimeUpgrade(socket, "REALTIME_UNAVAILABLE");
        return;
      }
      realtimeAdapter.handleUpgrade(req, socket, head);
      return;
    }

    if (config.nodeEnv !== "production") {
      const nextUpgrade = nextApp?.getUpgradeHandler?.();
      if (nextUpgrade) {
        nextUpgrade(req, socket, head);
        return;
      }
    }
    socket.destroy();
  };

  const start = (): Promise<StartOutcome> => {
    if (registry.state === "draining" || registry.state === "stopped") {
      return Promise.reject(new RuntimeLifecycleError("RUNTIME_STOPPED"));
    }
    if (registry.state === "failed") {
      return Promise.reject(new RuntimeLifecycleError("RUNTIME_FAILED"));
    }
    if (startPromise) {
      return startPromise.then((result) => ({ kind: "already_started" as const, status: result.status }));
    }

    startPromise = (async () => {
      registry.beginStarting();
      try {
        if (registry.state !== "starting") {
          throw new RuntimeLifecycleError("RUNTIME_STOPPED");
        }
        nextApp = createNextApp({
          dev: config.nodeEnv !== "production",
          hostname: config.host,
          port: config.port,
        });
        await nextApp.prepare();
        nextPrepared = true;
        if (registry.state !== "starting") {
          throw new RuntimeLifecycleError("RUNTIME_STOPPED");
        }

        if (fixtureStore) {
          if (dependencies.realtime || dependencies.realtimeSessionResolver) {
            throw new Error("FIXTURE_CUSTOM_REALTIME_UNSUPPORTED");
          }
          fixtureStore.open();
          try {
            const prepared = prepareLocalFixture(fixtureStore);
            fixtureResolver = prepared.resolver;
          } catch (error) {
            try {
              fixtureStore.close();
            } catch {
              // Preserve the typed fixture preparation failure.
            }
            throw error;
          }
          if (worker.persistence !== fixtureStore) {
            throw new Error("FIXTURE_STORE_NOT_SHARED");
          }
          if (!worker.gateway) {
            throw new Error("FIXTURE_REALTIME_UNAVAILABLE");
          }
          if (!realtimeAdapter) {
            realtimeAdapter = createRealtimeAdapter(fixtureResolver);
          }
        }
        wireRealtimeProgress();

        httpServer = createHttpServer(handleRequest);
        httpServer.on("connection", (socket) => {
          sockets.add(socket);
          socket.once("close", () => sockets.delete(socket));
        });
        httpServer.on("upgrade", handleUpgrade);
        await listen(httpServer, config);
        logger.info("http_bound");

        worker.onFault((code) => {
          registry.markDegraded(code);
          logger.error("runtime_degraded", code);
        });

        const outcome = await startController.start(worker);
        if (outcome.kind === "degraded") {
          logger.error("worker_start_failed", outcome.errorCode);
          return outcome;
        }

        registry.markReady();
        logger.info("runtime_ready");
        return outcome.kind === "already_started"
          ? { kind: "started" as const, status: outcome.status as HealthStatus }
          : outcome;
      } catch (error) {
        if (error instanceof RuntimeLifecycleError) {
          throw error;
        }
        if (fixtureStore?.isOpen) {
          try {
            fixtureStore.close();
          } catch {
            // Preserve the startup failure; shutdown remains idempotent.
          }
        }
        if (httpServer && httpServer.listening) {
          const code = errorCode(error, "WORKER_START_FAILED");
          registry.markDegraded(code);
          logger.error("runtime_degraded", code);
          return { kind: "degraded" as const, status: "degraded" as const, errorCode: code };
        }
        registry.markFailed();
        const code = errorCode(error, nextPrepared ? "HTTP_BIND_FAILED" : "NEXT_PREPARE_FAILED");
        logger.error("startup_failed", code);
        throw error;
      }
    })();

    return startPromise;
  };

  const shutdown = (signal: "SIGTERM" | "SIGINT" | "test"): Promise<ShutdownResult> => {
    if (shutdownPromise) {
      return shutdownPromise;
    }

    shutdownPromise = (async () => {
      registry.beginDraining();
      logger.info(`runtime_draining_${signal}`);
      const startedAt = Date.now();
      const remaining = Math.max(1, config.shutdownTimeoutMs - (Date.now() - startedAt));

      // Begin listener closure before invoking worker.stop(). The entrypoint
      // remains the sole production shutdown orchestrator.
      const adapter = realtimeAdapter;
      const realtimeLifecyclePromise = adapter
        ? Promise.resolve()
            .then(() => adapter.drain("RUNTIME_DRAINING"))
            .then(() => adapter.close("RUNTIME_STOPPED"))
            .then(() => ({ errorCode: null as string | null }))
            .catch(() => ({ errorCode: "REALTIME_CLOSE_FAILED" }))
        : Promise.resolve({ errorCode: null as string | null });
      const serverClosePromise = httpServer?.listening
        ? closeServer(httpServer, sockets, remaining)
        : Promise.resolve<ServerCloseResult>({ timedOut: false, errorCode: null });
      const nextClosePromise = nextApp?.close
        ? serverClosePromise
            .then(() => nextApp?.close?.())
            .then(() => ({ errorCode: null as string | null }))
            .catch(() => ({ errorCode: "NEXT_CLOSE_FAILED" }))
        : Promise.resolve({ errorCode: null as string | null });
      const workerStopPromise = Promise.resolve()
        .then(() => worker.stop())
        .then(() => {
          if (fixtureStore?.isOpen) {
            fixtureStore.close();
          }
        })
        .then(() => ({ errorCode: null as string | null }))
        .catch((error: unknown) => ({ errorCode: errorCode(error, "WORKER_STOP_FAILED") }));
      const allClosePromise = Promise.all([
        serverClosePromise,
        workerStopPromise,
        realtimeLifecyclePromise,
        nextClosePromise,
      ]);
      let timedOut = false;
      const settled = await Promise.race([
        allClosePromise,
        new Promise<null>((resolve) => {
          const timer = setTimeout(() => resolve(null), remaining);
          timer.unref();
        }),
      ]);

      if (settled === null) {
        timedOut = true;
        void allClosePromise.then(([serverResult, workerResult, realtimeResult, nextResult]) => {
          if (serverResult.errorCode) {
            logger.error("http_close_failed", serverResult.errorCode);
          }
          if (workerResult.errorCode) {
            logger.error("worker_stop_failed", workerResult.errorCode);
          }
          if (realtimeResult.errorCode) {
            logger.error("realtime_close_failed", realtimeResult.errorCode);
          }
          if (nextResult.errorCode) {
            logger.error("next_close_failed", nextResult.errorCode);
          }
        });
        registry.markStopped();
        logger.error("shutdown_timeout", "SHUTDOWN_TIMEOUT");
        logger.info("runtime_stopped");
        return { timedOut: true, errorCode: "SHUTDOWN_TIMEOUT" };
      } else {
        const [serverResult, workerResult, realtimeResult, nextResult] = settled;
        timedOut = serverResult.timedOut;
        let shutdownErrorCode = serverResult.errorCode;
        if (serverResult.errorCode) {
          logger.error("http_close_failed", serverResult.errorCode);
        }
        if (workerResult.errorCode) {
          logger.error("worker_stop_failed", workerResult.errorCode);
          shutdownErrorCode ??= workerResult.errorCode;
        }
        if (realtimeResult.errorCode) {
          logger.error("realtime_close_failed", realtimeResult.errorCode);
          shutdownErrorCode ??= realtimeResult.errorCode;
        }
        if (nextResult.errorCode) {
          logger.error("next_close_failed", nextResult.errorCode);
          shutdownErrorCode ??= nextResult.errorCode;
        }
        if (timedOut) {
          shutdownErrorCode ??= "SHUTDOWN_TIMEOUT";
        }
        registry.markStopped();
        if (timedOut) {
          logger.error("shutdown_timeout", "SHUTDOWN_TIMEOUT");
        }
        logger.info("runtime_stopped");
        return { timedOut, errorCode: shutdownErrorCode };
      }
    })();

    return shutdownPromise;
  };

  return {
    registry,
    get server() {
      return httpServer;
    },
    start,
    shutdown,
    address: () => httpServer?.address() ?? null,
  };
}

export async function main(): Promise<void> {
  let config: RuntimeConfig;
  try {
    config = loadRuntimeConfig();
  } catch (error) {
    writeBootstrapError(error instanceof Error && "code" in error ? String(error.code) : "CONFIG_INVALID");
    process.exitCode = 1;
    return;
  }

  const entrypoint = createEntrypoint({ config });
  let shuttingDown = false;
  const handleSignal = (signal: "SIGTERM" | "SIGINT") => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    void entrypoint.shutdown(signal).then(({ timedOut }) => {
      // Next's development and production internals may retain framework
      // handles after their close promise settles. The entrypoint owns the
      // process boundary, so terminate only after the coordinated shutdown
      // result has been logged and preserve its failure status.
      process.exit(timedOut ? 1 : 0);
    });
  };
  process.once("SIGTERM", () => handleSignal("SIGTERM"));
  process.once("SIGINT", () => handleSignal("SIGINT"));

  try {
    await entrypoint.start();
  } catch {
    process.exitCode = 1;
  }
}

const invokedScript = process.argv[1] ?? "";
if (invokedScript.endsWith("/entrypoint.ts") || invokedScript.endsWith("/entrypoint.js")) {
  void main();
}
