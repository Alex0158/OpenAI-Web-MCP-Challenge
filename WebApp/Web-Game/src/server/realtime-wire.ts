import type { IncomingMessage } from "node:http";
import type { Socket } from "node:net";

import { WebSocketServer, WebSocket, type RawData } from "ws";

import type { RealtimeResyncRequest } from "../client/realtime-projection";
import {
  parseMovementIntentCommandEnvelope,
  type MovementIntentCommandEnvelope,
  type MovementIntentResultFrame,
} from "../shared/movement-intent-command";
import type { WorkerCommandGateway } from "./worker-command-gateway";
import type { MovementCadenceFailure } from "./player-movement-cadence";
import {
  RealtimeSnapshotHub,
  RealtimeTransportError,
  type RealtimeConnection,
  type RealtimeSnapshotSink,
  type RealtimeTransportErrorCode,
  type ServerBoundRealtimeContext,
} from "./realtime-snapshot";

export type RealtimeRuntimeAdmission = "starting" | "ready" | "degraded" | "draining" | "stopped" | "failed";

export type RealtimeWireErrorCode =
  | "REALTIME_AUTH_REQUIRED"
  | "REALTIME_INVALID_MESSAGE"
  | "REALTIME_CONNECTION_MISMATCH"
  | "REALTIME_UNAVAILABLE"
  | "REALTIME_NOT_READY"
  | "REALTIME_DRAINING"
  | "REALTIME_CLOSED"
  | "REALTIME_SINK_FAILED";

export interface RealtimeWireErrorFrame {
  readonly kind: "realtime_error";
  readonly error_code: RealtimeWireErrorCode;
  readonly connection_id?: string;
}

/**
 * Authentication is deliberately an injected server boundary. The adapter
 * does not parse credentials or derive a player scope from request input.
 */
export interface RealtimeSessionResolver {
  resolve(request: IncomingMessage): ServerBoundRealtimeContext | null | Promise<ServerBoundRealtimeContext | null>;
}

export interface RealtimeWireAdapterOptions {
  hub: RealtimeSnapshotHub;
  sessionResolver: RealtimeSessionResolver;
  admission: () => RealtimeRuntimeAdmission;
  maxInboundPayloadBytes?: number;
  movement?: Pick<WorkerCommandGateway, "setMovementIntentForSession" | "stopMovementIntentForSession" | "revokeMovementIntentOwner" | "fullSnapshot">
    & Partial<Pick<WorkerCommandGateway, "onMovementIntentFailure">>;
  contractVersion?: string;
}

export interface RealtimeWireAdapterContract {
  readonly state: "READY" | "DRAINING" | "CLOSED" | "UNSUPPORTED";
  handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer): void;
  /** Optional entrypoint-owned projection publication seam. */
  publishCurrentSnapshots?(): Promise<void>;
  drain(reason?: string): Promise<void>;
  close(reason?: string): Promise<void>;
}

interface ActiveConnection {
  readonly socket: WebSocket;
  readonly connection: RealtimeConnection;
}

const DEFAULT_MAX_INBOUND_PAYLOAD_BYTES = 16 * 1024;
const VALID_RESYNC_REASONS = new Set<RealtimeResyncRequest["reason"]>([
  "STALE_FRAME",
  "CONNECTION_LOST",
  "EXPLICIT",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function statusText(status: number): string {
  return status === 400
    ? "Bad Request"
    : status === 401
      ? "Unauthorized"
      : status === 503
        ? "Service Unavailable"
        : "Error";
}

function writeUpgradeError(socket: Socket, status: number, code: RealtimeWireErrorCode): void {
  if (socket.destroyed) {
    return;
  }
  const body = JSON.stringify({ error_code: code });
  const response = [
    `HTTP/1.1 ${status} ${statusText(status)}`,
    "Content-Type: application/json; charset=utf-8",
    "Cache-Control: no-store",
    "Connection: close",
    `Content-Length: ${Buffer.byteLength(body)}`,
    "",
    body,
  ].join("\r\n");
  socket.end(response);
}

export function rejectRealtimeUpgrade(socket: Socket, code: RealtimeWireErrorCode): void {
  const status = code === "REALTIME_AUTH_REQUIRED"
    ? 401
    : code === "REALTIME_INVALID_MESSAGE" || code === "REALTIME_CONNECTION_MISMATCH"
      ? 400
      : 503;
  writeUpgradeError(socket, status, code);
}

function admissionError(admission: RealtimeRuntimeAdmission): { status: number; code: RealtimeWireErrorCode } | null {
  switch (admission) {
    case "ready":
      return null;
    case "draining":
      return { status: 503, code: "REALTIME_DRAINING" };
    case "stopped":
    case "failed":
      return { status: 503, code: "REALTIME_CLOSED" };
    case "starting":
    case "degraded":
      return { status: 503, code: "REALTIME_NOT_READY" };
  }
}

function hubErrorCode(error: unknown): RealtimeWireErrorCode {
  if (error instanceof RealtimeTransportError) {
    return error.code === "REALTIME_INVALID_SCOPE"
      ? "REALTIME_AUTH_REQUIRED"
      : error.code;
  }
  return "REALTIME_UNAVAILABLE";
}

function wireFailureCode(code: RealtimeTransportErrorCode): RealtimeWireErrorCode {
  return code === "REALTIME_INVALID_SCOPE" ? "REALTIME_AUTH_REQUIRED" : code;
}

function movementFailureCode(error: unknown): MovementIntentResultFrame["error_code"] {
  const candidate = error as { code?: unknown; message?: unknown };
  const code = typeof error === "string"
    ? error
    : typeof candidate.code === "string"
      ? candidate.code
      : typeof candidate.message === "string"
        ? candidate.message
        : "";
  const allowed = new Set<NonNullable<MovementIntentResultFrame["error_code"]>>([
    "INVALID_INPUT",
    "WORLD_NOT_FOUND",
    "ENTITY_NOT_FOUND",
    "OWNERSHIP_DENIED",
    "STALE_REVISION",
    "DUPLICATE_COMMAND",
    "MOVEMENT_BLOCKED",
    "MOVEMENT_INTENT_SESSION_CLOSED",
    "WORKER_NOT_READY",
    "GATEWAY_CLOSED",
    "RECOVERY_REQUIRED",
    "REALTIME_UNAVAILABLE",
    "REALTIME_NOT_READY",
    "REALTIME_DRAINING",
    "REALTIME_CLOSED",
  ]);
  return allowed.has(code as NonNullable<MovementIntentResultFrame["error_code"]>)
    ? code as NonNullable<MovementIntentResultFrame["error_code"]>
    : "RECOVERY_REQUIRED";
}

function rawText(data: RawData): string {
  if (typeof data === "string") {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString("utf8");
  }
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString("utf8");
  }
  return data.toString("utf8");
}

function isResyncRequest(value: unknown): value is RealtimeResyncRequest {
  if (!isRecord(value)) {
    return false;
  }
  const keys = Object.keys(value).sort();
  if (keys.length !== 4 || keys.join("\u0000") !== ["connectionId", "kind", "lastAcceptedSequence", "reason"].join("\u0000")) {
    return false;
  }
  return value.kind === "resync_request"
    && validString(value.connectionId)
    && typeof value.lastAcceptedSequence === "number"
    && Number.isSafeInteger(value.lastAcceptedSequence)
    && value.lastAcceptedSequence >= 0
    && typeof value.reason === "string"
    && VALID_RESYNC_REASONS.has(value.reason as RealtimeResyncRequest["reason"]);
}

function sendSocket(socket: WebSocket, value: unknown): Promise<void> {
  if (socket.readyState !== WebSocket.OPEN) {
    return Promise.reject(new Error("SINK_NOT_OPEN"));
  }
  const payload = JSON.stringify(value);
  return new Promise((resolve, reject) => {
    socket.send(payload, (error?: Error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function closeSocket(socket: WebSocket, reason: string): Promise<void> {
  if (socket.readyState === WebSocket.CLOSED) {
    return Promise.resolve();
  }
  if (socket.readyState === WebSocket.CONNECTING) {
    socket.terminate();
    return Promise.resolve();
  }
  socket.close(1001, reason.slice(0, 123));
  return Promise.resolve();
}

/**
 * The one local wire adapter owned by the CP-04 entrypoint. It adapts a
 * `noServer` ws instance to the already verified hub and has no listener,
 * worker, clock, persistence, or application queue of its own.
 */
export class RealtimeWireAdapter implements RealtimeWireAdapterContract {
  private readonly hub: RealtimeSnapshotHub;
  private readonly sessionResolver: RealtimeSessionResolver;
  private readonly admission: () => RealtimeRuntimeAdmission;
  private readonly movement?: RealtimeWireAdapterOptions["movement"];
  private readonly contractVersion: string;
  private readonly server: WebSocketServer;
  private readonly connections = new Map<string, ActiveConnection>();
  private currentState: "READY" | "DRAINING" | "CLOSED" | "UNSUPPORTED";
  private closePromise: Promise<void> | null = null;

  constructor(options: RealtimeWireAdapterOptions) {
    if (!options.hub || !options.sessionResolver || typeof options.sessionResolver.resolve !== "function" || typeof options.admission !== "function") {
      throw new Error("REALTIME_UNAVAILABLE");
    }
    this.hub = options.hub;
    this.sessionResolver = options.sessionResolver;
    this.admission = options.admission;
    this.movement = options.movement;
    this.contractVersion = options.contractVersion ?? "SK-MVP-0.2";
    this.movement?.onMovementIntentFailure?.((failure) => this.publishMovementFailure(failure));
    this.currentState = this.hub.capability === "supported" ? "READY" : "UNSUPPORTED";
    this.server = new WebSocketServer({
      noServer: true,
      maxPayload: options.maxInboundPayloadBytes ?? DEFAULT_MAX_INBOUND_PAYLOAD_BYTES,
    });
    // A noServer instance can still emit protocol/transport errors. Keep the
    // error typed at the connection boundary instead of leaking an unhandled
    // exception or request data into process output.
    this.server.on("error", () => undefined);
  }

  get state(): "READY" | "DRAINING" | "CLOSED" | "UNSUPPORTED" {
    return this.currentState;
  }

  handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer): void {
    const initial = this.admissionFailure();
    if (initial) {
      rejectRealtimeUpgrade(socket, initial.code);
      return;
    }
    if (this.currentState === "UNSUPPORTED") {
      rejectRealtimeUpgrade(socket, "REALTIME_UNAVAILABLE");
      return;
    }
    if (this.currentState === "DRAINING") {
      rejectRealtimeUpgrade(socket, "REALTIME_DRAINING");
      return;
    }
    if (this.currentState === "CLOSED") {
      rejectRealtimeUpgrade(socket, "REALTIME_CLOSED");
      return;
    }

    void this.resolveAndUpgrade(request, socket, head);
  }

  publishCurrentSnapshots(): Promise<void> {
    return this.hub.publishCurrentSnapshots();
  }

  async drain(reason = "RUNTIME_DRAINING"): Promise<void> {
    if (this.currentState === "CLOSED") {
      return;
    }
    this.currentState = "DRAINING";
    this.revokeAllMovementOwners();
    await this.hub.drain(reason);
  }

  async close(reason = "RUNTIME_STOPPED"): Promise<void> {
    if (this.closePromise) {
      return this.closePromise;
    }
    this.currentState = "CLOSED";
    this.revokeAllMovementOwners();
    this.closePromise = (async () => {
      await this.hub.close(reason);
      await new Promise<void>((resolve) => {
        this.server.close(() => resolve());
      });
    })();
    return this.closePromise;
  }

  private admissionFailure(): { status: number; code: RealtimeWireErrorCode } | null {
    if (this.currentState === "UNSUPPORTED") {
      return { status: 503, code: "REALTIME_UNAVAILABLE" };
    }
    if (this.currentState === "DRAINING") {
      return { status: 503, code: "REALTIME_DRAINING" };
    }
    if (this.currentState === "CLOSED") {
      return { status: 503, code: "REALTIME_CLOSED" };
    }
    return admissionError(this.admission());
  }

  private async resolveAndUpgrade(request: IncomingMessage, socket: Socket, head: Buffer): Promise<void> {
    let context: ServerBoundRealtimeContext | null;
    try {
      context = await this.sessionResolver.resolve(request);
    } catch {
      rejectRealtimeUpgrade(socket, "REALTIME_AUTH_REQUIRED");
      return;
    }
    if (!context) {
      rejectRealtimeUpgrade(socket, "REALTIME_AUTH_REQUIRED");
      return;
    }
    const afterAuth = this.admissionFailure();
    if (afterAuth) {
      rejectRealtimeUpgrade(socket, afterAuth.code);
      return;
    }

    try {
      this.server.handleUpgrade(request, socket, head, (webSocket) => {
        void this.attach(webSocket, context as ServerBoundRealtimeContext);
      });
    } catch {
      rejectRealtimeUpgrade(socket, "REALTIME_UNAVAILABLE");
    }
  }

  private async attach(socket: WebSocket, context: ServerBoundRealtimeContext): Promise<void> {
    let handle: RealtimeConnection | null = null;
    let closed = false;
    const sink: RealtimeSnapshotSink = {
      send: (frame) => sendSocket(socket, frame),
      close: (reason) => closeSocket(socket, reason ?? "RUNTIME_STOPPED"),
      notifyFailure: async (code) => {
        await this.sendError(socket, wireFailureCode(code), handle?.connectionId);
        if (socket.readyState === WebSocket.OPEN) {
          socket.close(1011, code);
        }
      },
    };
    socket.once("close", () => {
      closed = true;
      const connection = handle;
      if (connection) {
        this.movement?.revokeMovementIntentOwner(connection.connectionId);
        this.connections.delete(connection.connectionId);
        void connection.close("CLIENT_CLOSED").catch(() => undefined);
      }
    });
    socket.on("error", () => {
      const connection = handle;
      if (connection) {
        connection.markStale();
      }
    });
    socket.on("message", (data) => {
      void this.handleMessage(socket, handle, context, data).catch(() => undefined);
    });
    try {
      handle = await this.hub.connect(context, sink);
      if (closed || socket.readyState !== WebSocket.OPEN) {
        await handle.close("CLIENT_CLOSED");
        return;
      }
      this.connections.set(handle.connectionId, { socket, connection: handle });
    } catch (error) {
      if (socket.readyState === WebSocket.OPEN) {
        await this.sendError(socket, hubErrorCode(error));
        socket.close(1013, "REALTIME_UNAVAILABLE");
      }
    }
  }

  private async handleMessage(socket: WebSocket, handle: RealtimeConnection | null, context: ServerBoundRealtimeContext, data: RawData): Promise<void> {
    if (!handle || handle.state === "CLOSED") {
      return;
    }
    let value: unknown;
    try {
      value = JSON.parse(rawText(data));
    } catch {
      await this.protocolError(socket, "REALTIME_INVALID_MESSAGE", handle.connectionId);
      return;
    }
    if (isResyncRequest(value)) {
      if (value.connectionId !== handle.connectionId) {
        await this.protocolError(socket, "REALTIME_CONNECTION_MISMATCH", handle.connectionId);
        return;
      }
      if (value.lastAcceptedSequence > handle.lastSequence) {
        await this.protocolError(socket, "REALTIME_INVALID_MESSAGE", handle.connectionId);
        return;
      }
      try {
        await handle.requestResync();
      } catch (error) {
        await this.sendError(socket, hubErrorCode(error), handle.connectionId);
      }
      return;
    }
    let command: MovementIntentCommandEnvelope;
    try {
      command = parseMovementIntentCommandEnvelope(value);
    } catch {
      await this.protocolError(socket, "REALTIME_INVALID_MESSAGE", handle.connectionId);
      return;
    }
    await this.handleMovementCommand(socket, handle, context, command);
  }

  private async handleMovementCommand(
    socket: WebSocket,
    handle: RealtimeConnection,
    context: ServerBoundRealtimeContext,
    command: MovementIntentCommandEnvelope,
  ): Promise<void> {
    const unavailable = this.admissionFailure();
    if (unavailable) {
      await sendSocket(socket, {
        kind: "movement_intent_result",
        action: command.action,
        command_id: command.command_id,
        contract_version: this.contractVersion,
        effect: "rejected",
        duplicate: false,
        current_entity_revisions: { player: command.expected_entity_revisions.player },
        error_code: movementFailureCode(unavailable.code),
      } satisfies MovementIntentResultFrame);
      return;
    }
    if (!this.movement) {
      await this.sendError(socket, "REALTIME_UNAVAILABLE", handle.connectionId);
      return;
    }
    if (command.contract_version !== this.contractVersion) {
      await sendSocket(socket, {
        kind: "movement_intent_result",
        action: command.action,
        command_id: command.command_id,
        contract_version: this.contractVersion,
        effect: "rejected",
        duplicate: false,
        current_entity_revisions: { player: command.expected_entity_revisions.player },
        error_code: "INVALID_INPUT",
      } satisfies MovementIntentResultFrame);
      return;
    }
    try {
      const result = command.action === "start"
        ? await this.movement.setMovementIntentForSession({
          worldId: context.worldId,
          playerId: context.playerId,
          binding: context.binding,
          direction: command.typed_arguments.direction as "up" | "down" | "left" | "right",
          expectedRevision: command.expected_entity_revisions.player,
          idempotencyKey: command.idempotency_key,
          commandId: command.command_id,
          ownerId: handle.connectionId,
        })
        : await this.movement.stopMovementIntentForSession({
          worldId: context.worldId,
          playerId: context.playerId,
          binding: context.binding,
          expectedRevision: command.expected_entity_revisions.player,
          idempotencyKey: command.idempotency_key,
          commandId: command.command_id,
          ownerId: handle.connectionId,
        });
      const frame: MovementIntentResultFrame = {
        kind: "movement_intent_result",
        action: command.action,
        command_id: command.command_id,
        contract_version: result.contractVersion,
        effect: result.effect,
        duplicate: result.duplicate ?? false,
        current_entity_revisions: { player: result.currentRevision ?? command.expected_entity_revisions.player },
        ...(result.intentId ? { intent_id: result.intentId } : {}),
        ...(result.ownerStatus ? { owner_status: result.ownerStatus } : {}),
        ...(result.replaced ? { replaced: true } : {}),
      };
      await sendSocket(socket, frame);
    } catch (error) {
      let currentRevision = command.expected_entity_revisions.player;
      try {
        const snapshot = await this.movement.fullSnapshot(context);
        currentRevision = snapshot.player.revision;
      } catch {
        // Keep the client's expected revision when the worker is unavailable.
      }
      const code = movementFailureCode(error);
      const frame: MovementIntentResultFrame = {
        kind: "movement_intent_result",
        action: command.action,
        command_id: command.command_id,
        contract_version: this.contractVersion,
        effect: "rejected",
        duplicate: false,
        current_entity_revisions: { player: currentRevision },
        error_code: code,
      };
      await sendSocket(socket, frame);
    }
  }

  private revokeAllMovementOwners(): void {
    if (!this.movement) {
      return;
    }
    for (const { connection } of this.connections.values()) {
      this.movement.revokeMovementIntentOwner(connection.connectionId);
    }
  }

  private publishMovementFailure(failure: MovementCadenceFailure): void {
    if (!failure.ownerId || !failure.commandId) {
      return;
    }
    const active = this.connections.get(failure.ownerId);
    if (!active || active.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    const frame: MovementIntentResultFrame = {
      kind: "movement_intent_result",
      action: "start",
      command_id: failure.commandId,
      contract_version: this.contractVersion,
      effect: "rejected",
      duplicate: false,
      current_entity_revisions: { player: failure.currentRevision ?? 0 },
      error_code: movementFailureCode(failure.code),
    };
    void sendSocket(active.socket, frame).catch(() => undefined);
  }

  private async protocolError(socket: WebSocket, code: "REALTIME_INVALID_MESSAGE" | "REALTIME_CONNECTION_MISMATCH", connectionId?: string): Promise<void> {
    await this.sendError(socket, code, connectionId);
    if (socket.readyState === WebSocket.OPEN) {
      socket.close(1008, code);
    }
  }

  private async sendError(socket: WebSocket, code: RealtimeWireErrorCode, connectionId?: string): Promise<void> {
    const frame: RealtimeWireErrorFrame = {
      kind: "realtime_error",
      error_code: code,
      ...(connectionId ? { connection_id: connectionId } : {}),
    };
    try {
      await sendSocket(socket, frame);
    } catch {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1011, "REALTIME_SINK_FAILED");
      }
    }
  }
}
