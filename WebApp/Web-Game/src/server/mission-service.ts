import { createHash } from "node:crypto";

import { classifyPersistenceError, isPersistenceErrorCode, PersistenceError } from "./persistence/errors";
import { canonicalJson } from "./persistence/json";
import { PersistenceStore } from "./persistence/store";
import type {
  CommitMissionDispatchResult,
  CommitMissionRecallResult,
  GridCoordinate,
  MissionAttemptRecord,
  MissionReturnPolicy,
  MissionRole,
  MissionRoutePlan,
  MissionTool,
} from "./persistence/types";
import { deriveRoutePosition } from "./mission-travel-service";
import { reverseMissionRoute } from "./mission-return-service";
import { loadPersistedG2Fixture, type FixtureResourceNodeManifest, type WorldFixtureManifest } from "./world-fixture";

export const SHELTER_RESOURCE_SENSING_RADIUS_TILES = 24;
export const GATHERER_EQUIPMENT_TIER = 1;
export const HUNTER_EQUIPMENT_TIER = 1;

export interface AssignSoldierMissionInput {
  worldId: string;
  playerId: string;
  binding: string;
  commandId: string;
  soldierId: string;
  role: MissionRole;
  tool: MissionTool;
  equipmentTier: number;
  targetId: string;
  expectedSoldierRevision: number;
  returnPolicy?: MissionReturnPolicy;
  idempotencyKey: string;
}

export type AssignSoldierMissionResult = CommitMissionDispatchResult;

export interface ForceRecallSoldierInput {
  worldId: string;
  playerId: string;
  binding: string;
  commandId: string;
  soldierId: string;
  missionId: string;
  missionAttemptId: string;
  expectedSoldierRevision: number;
  expectedMissionRevision: number;
  expectedMissionAttemptRevision: number;
  idempotencyKey: string;
  /** Optional Agent provenance. Human-owned recalls may omit these fields. */
  signalId?: string;
  causalEventId?: string;
}

export type ForceRecallSoldierResult = CommitMissionRecallResult;

function assertInput(input: AssignSoldierMissionInput): void {
  for (const value of [input.worldId, input.playerId, input.binding, input.commandId, input.soldierId, input.targetId, input.idempotencyKey]) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new PersistenceError("INVALID_INPUT");
    }
  }
  if (input.commandId === input.idempotencyKey) {
    throw new PersistenceError("INVALID_INPUT");
  }
  if (!Number.isSafeInteger(input.expectedSoldierRevision) || input.expectedSoldierRevision < 0
    || !Number.isSafeInteger(input.equipmentTier) || input.equipmentTier < 0) {
    throw new PersistenceError("INVALID_INPUT");
  }
  if (input.returnPolicy !== undefined && input.returnPolicy !== "WHEN_FULL"
    && input.returnPolicy !== "ON_TARGET_DEPLETED" && input.returnPolicy !== "ON_RECALL") {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function assertRecallInput(input: ForceRecallSoldierInput): void {
  for (const value of [
    input.worldId,
    input.playerId,
    input.binding,
    input.commandId,
    input.soldierId,
    input.missionId,
    input.missionAttemptId,
    input.idempotencyKey,
  ]) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new PersistenceError("INVALID_INPUT");
    }
  }
  if (input.commandId === input.idempotencyKey
    || !Number.isSafeInteger(input.expectedSoldierRevision) || input.expectedSoldierRevision < 0
    || !Number.isSafeInteger(input.expectedMissionRevision) || input.expectedMissionRevision < 0
    || !Number.isSafeInteger(input.expectedMissionAttemptRevision) || input.expectedMissionAttemptRevision < 0) {
    throw new PersistenceError("INVALID_INPUT");
  }
  for (const value of [input.signalId, input.causalEventId]) {
    if (value !== undefined && (typeof value !== "string" || value.trim() === "" || value.length > 128)) {
      throw new PersistenceError("INVALID_INPUT");
    }
  }
}

function deterministicId(prefix: string, ...parts: string[]): string {
  const digest = createHash("sha256").update(parts.join("\u0000")).digest("hex").slice(0, 24);
  return `${prefix}-${digest}`;
}

function coordinateDistance(left: GridCoordinate, right: GridCoordinate): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

export function planOpenGridRoute(source: GridCoordinate, target: GridCoordinate, walkabilityVersion: string): MissionRoutePlan {
  if (!Number.isSafeInteger(source.x) || !Number.isSafeInteger(source.y)
    || !Number.isSafeInteger(target.x) || !Number.isSafeInteger(target.y)
    || typeof walkabilityVersion !== "string" || walkabilityVersion.trim() === "") {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const waypoints: GridCoordinate[] = [{ ...source }];
  let x = source.x;
  let y = source.y;
  const xStep = Math.sign(target.x - x);
  while (x !== target.x) {
    x += xStep;
    waypoints.push({ x, y });
  }
  const yStep = Math.sign(target.y - y);
  while (y !== target.y) {
    y += yStep;
    waypoints.push({ x, y });
  }
  return {
    source: { ...source },
    target: { ...target },
    walkabilityVersion,
    waypoints,
    estimatedTravelWorldSeconds: Math.ceil((waypoints.length - 1) / 3),
    status: "PLANNED",
  };
}

export interface OpenGridRouteAvoidingOptions {
  width: number;
  height: number;
  blockedCells: readonly GridCoordinate[];
  dangerCell: GridCoordinate;
}

/**
 * Plans a deterministic shortest route while keeping the whole path outside
 * the danger cell's Chebyshev-one exclusion. The target is deliberately not
 * exempted: an unsafe target is an explicit no-route outcome for recovery.
 */
export function planOpenGridRouteAvoiding(
  source: GridCoordinate,
  target: GridCoordinate,
  walkabilityVersion: string,
  options: OpenGridRouteAvoidingOptions,
): MissionRoutePlan | null {
  const validCoordinate = (point: unknown): point is GridCoordinate => Boolean(point)
    && typeof point === "object"
    && !Array.isArray(point)
    && Number.isSafeInteger((point as GridCoordinate).x)
    && Number.isSafeInteger((point as GridCoordinate).y);
  if (!validCoordinate(source) || !validCoordinate(target) || !validCoordinate(options.dangerCell)
    || typeof walkabilityVersion !== "string" || walkabilityVersion.trim() === ""
    || !Number.isSafeInteger(options.width) || options.width <= 0
    || !Number.isSafeInteger(options.height) || options.height <= 0
    || options.width > 512 || options.height > 512 || options.width * options.height > 262_144
    || !Array.isArray(options.blockedCells) || !options.blockedCells.every(validCoordinate)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const inBounds = (point: GridCoordinate): boolean => point.x >= 0 && point.x < options.width
    && point.y >= 0 && point.y < options.height;
  if (!inBounds(source) || !inBounds(target) || !inBounds(options.dangerCell)) {
    return null;
  }
  const key = (point: GridCoordinate): string => `${point.x},${point.y}`;
  const blocked = new Set(options.blockedCells.map(key));
  const danger = options.dangerCell;
  const forbidden = (point: GridCoordinate): boolean => Math.max(
    Math.abs(point.x - danger.x),
    Math.abs(point.y - danger.y),
  ) <= 1;
  if (blocked.has(key(source)) || blocked.has(key(target)) || forbidden(source) || forbidden(target)) {
    return null;
  }
  const neighbors = (point: GridCoordinate): GridCoordinate[] => [
    { x: point.x + 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y - 1 },
  ].filter((candidate) => inBounds(candidate) && !blocked.has(key(candidate)) && !forbidden(candidate));
  const queue: GridCoordinate[] = [{ ...source }];
  let queueIndex = 0;
  const visited = new Set([key(source)]);
  const previous = new Map<string, GridCoordinate>();
  while (queueIndex < queue.length) {
    const current = queue[queueIndex] as GridCoordinate;
    queueIndex += 1;
    if (key(current) === key(target)) {
      const reversed: GridCoordinate[] = [];
      let cursor = current;
      while (true) {
        reversed.push({ ...cursor });
        if (key(cursor) === key(source)) {
          break;
        }
        const parent = previous.get(key(cursor));
        if (!parent) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        cursor = parent;
      }
      const waypoints = reversed.reverse();
      return {
        source: { ...source },
        target: { ...target },
        walkabilityVersion,
        waypoints,
        estimatedTravelWorldSeconds: Math.ceil((waypoints.length - 1) / 3),
        status: "PLANNED",
      };
    }
    for (const next of neighbors(current)) {
      const nextKey = key(next);
      if (visited.has(nextKey)) {
        continue;
      }
      visited.add(nextKey);
      previous.set(nextKey, current);
      queue.push(next);
    }
  }
  return null;
}

function expectedGathererTool(node: FixtureResourceNodeManifest): MissionTool {
  return node.resourceType === "wood" ? "AXE" : "PICKAXE";
}

function commandRequest(input: AssignSoldierMissionInput, returnPolicy: MissionReturnPolicy): Record<string, unknown> {
  return {
    kind: "assign_soldier_mission",
    playerId: input.playerId,
    commandId: input.commandId,
    soldierId: input.soldierId,
    role: input.role,
    tool: input.tool,
    equipmentTier: input.equipmentTier,
    targetId: input.targetId,
    expectedSoldierRevision: input.expectedSoldierRevision,
    returnPolicy,
  };
}

function recallRequest(input: ForceRecallSoldierInput): Record<string, unknown> {
  return {
    kind: "force_recall_soldier",
    playerId: input.playerId,
    commandId: input.commandId,
    soldierId: input.soldierId,
    missionId: input.missionId,
    missionAttemptId: input.missionAttemptId,
    expectedSoldierRevision: input.expectedSoldierRevision,
    expectedMissionRevision: input.expectedMissionRevision,
    expectedMissionAttemptRevision: input.expectedMissionAttemptRevision,
    ...(input.signalId ? { signalId: input.signalId } : {}),
    ...(input.causalEventId ? { causalEventId: input.causalEventId } : {}),
  };
}

function validateRecallProvenance(options: {
  store: PersistenceStore;
  input: ForceRecallSoldierInput;
  shelterId: string;
}): void {
  const { input } = options;
  if (input.signalId === undefined && input.causalEventId === undefined) {
    return;
  }
  // An Agent-shaped recall must identify the durable continuation slot. The
  // slot is looked up through the server-bound shelter and binding; the page
  // cannot submit a substitute binding or grant.
  if (input.signalId === undefined) {
    throw new PersistenceError("STALE_REENTRY_CONTEXT");
  }
  const slot = options.store.signalSlot(input.worldId, options.shelterId, input.binding);
  if (!slot
    || slot.signalId !== input.signalId
    || slot.boundedAction !== "force_recall_soldier"
    || (slot.status !== "pending" && slot.status !== "in_flight" && slot.status !== "acknowledged")) {
    throw new PersistenceError("STALE_REENTRY_CONTEXT");
  }
  const eligibleEvents = options.store.events(input.worldId).filter((event) => event.eventType === "CargoLostToMonster"
    && event.worldEventCursor >= slot.cursorStart
    && event.worldEventCursor <= slot.cursorEnd
    && event.visibilityScope.kind === "shelter"
    && event.visibilityScope.shelterId === options.shelterId);
  if (eligibleEvents.length === 0) {
    throw new PersistenceError("STALE_REENTRY_CONTEXT");
  }
  if (input.causalEventId !== undefined) {
    const event = eligibleEvents.find((candidate) => candidate.eventId === input.causalEventId);
    if (!event
      || event.eventType !== "CargoLostToMonster"
      || !event.typedPayload
      || typeof event.typedPayload !== "object"
      || Array.isArray(event.typedPayload)
      || (event.typedPayload as { soldierId?: unknown }).soldierId !== input.soldierId) {
      throw new PersistenceError("STALE_REENTRY_CONTEXT");
    }
    return;
  }
  if (!eligibleEvents.some((event) => event.typedPayload && typeof event.typedPayload === "object"
    && !Array.isArray(event.typedPayload)
    && (event.typedPayload as { soldierId?: unknown }).soldierId === input.soldierId)) {
    throw new PersistenceError("STALE_REENTRY_CONTEXT");
  }
}

function replayResult(
  store: PersistenceStore,
  input: AssignSoldierMissionInput,
  request: Record<string, unknown>,
): AssignSoldierMissionResult | null {
  const existing = store.idempotency(input.worldId, input.idempotencyKey);
  if (!existing) {
    return null;
  }
  if (existing.binding !== input.binding || existing.contractVersion !== store.contractVersion
    || existing.requestFingerprint !== canonicalJson(request)) {
    throw new PersistenceError("DUPLICATE_COMMAND");
  }
  if (existing.outcome === "rejected") {
    const rejection = existing.result as { errorCode?: unknown };
    if (!isPersistenceErrorCode(rejection?.errorCode)) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    throw new PersistenceError(rejection.errorCode);
  }
  const result = existing.result as Partial<AssignSoldierMissionResult>;
  if (result.effect !== "mission_dispatched") {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return { ...(existing.result as AssignSoldierMissionResult), duplicate: true };
}

function replayRecallResult(
  store: PersistenceStore,
  input: ForceRecallSoldierInput,
  request: Record<string, unknown>,
): ForceRecallSoldierResult | null {
  const existing = store.idempotency(input.worldId, input.idempotencyKey);
  if (!existing) {
    return null;
  }
  if (existing.binding !== input.binding || existing.contractVersion !== store.contractVersion
    || existing.requestFingerprint !== canonicalJson(request)) {
    throw new PersistenceError("DUPLICATE_COMMAND");
  }
  if (existing.outcome === "rejected") {
    const rejection = existing.result as { errorCode?: unknown };
    if (!isPersistenceErrorCode(rejection?.errorCode)) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    throw new PersistenceError(rejection.errorCode);
  }
  const result = existing.result as Partial<ForceRecallSoldierResult>;
  if (result.effect !== "mission_recalled") {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return { ...(existing.result as ForceRecallSoldierResult), duplicate: true };
}

function manifestNode(manifest: WorldFixtureManifest, targetId: string): FixtureResourceNodeManifest {
  const node = manifest.resourceNodes.find((candidate) => candidate.resourceNodeId === targetId);
  if (!node) {
    throw new PersistenceError("TARGET_UNAVAILABLE");
  }
  return node;
}

export class MissionService {
  private readonly store: PersistenceStore;

  constructor(options: { store: PersistenceStore }) {
    this.store = options.store;
  }

  assignSoldierMission(input: AssignSoldierMissionInput): AssignSoldierMissionResult {
    assertInput(input);
    const returnPolicy = input.returnPolicy ?? (input.role === "HUNTER" ? "ON_RECALL" : "WHEN_FULL");
    const request = commandRequest(input, returnPolicy);
    const idempotency = { key: input.idempotencyKey, binding: input.binding, request };
    const replay = replayResult(this.store, input, request);
    if (replay) {
      return replay;
    }

    try {
      const world = this.store.getWorld(input.worldId);
      if (!world) {
        throw new PersistenceError("WORLD_NOT_FOUND");
      }
      const player = this.store.getPlayer(input.worldId, input.playerId);
      if (!player) {
        throw new PersistenceError("ENTITY_NOT_FOUND");
      }
      if (player.binding !== input.binding) {
        throw new PersistenceError("OWNERSHIP_DENIED");
      }
      const shelter = this.store.listShelters(input.worldId).find((candidate) => candidate.playerId === input.playerId);
      if (!shelter) {
        throw new PersistenceError("ENTITY_NOT_FOUND");
      }
      const soldier = this.store.listSoldiers(input.worldId).find((candidate) => candidate.soldierId === input.soldierId);
      if (!soldier) {
        throw new PersistenceError("ENTITY_NOT_FOUND");
      }
      if (soldier.shelterId !== shelter.shelterId) {
        throw new PersistenceError("OWNERSHIP_DENIED");
      }
      if (soldier.revision !== input.expectedSoldierRevision) {
        throw new PersistenceError("STALE_REVISION");
      }
      if (soldier.state !== "AT_SHELTER") {
        throw new PersistenceError("ROLE_LOCKED");
      }
      const fixture = loadPersistedG2Fixture(this.store, input.worldId);
      const shelterManifest = fixture.manifest.shelters.find((candidate) => candidate.shelterId === shelter.shelterId);
      if (!shelterManifest) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      let route: MissionRoutePlan;
      if (input.role === "GATHERER") {
        const node = manifestNode(fixture.manifest, input.targetId);
        if (node.ownerShelterId !== shelter.shelterId) {
          throw new PersistenceError("TARGET_UNAVAILABLE");
        }
        const persistedNode = this.store.listResourceNodes(input.worldId).find((candidate) => candidate.resourceNodeId === node.resourceNodeId);
        if (!persistedNode || persistedNode.quantity <= 0) {
          throw new PersistenceError("TARGET_UNAVAILABLE");
        }
        if (persistedNode.resourceType !== node.resourceType) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        if (coordinateDistance(shelterManifest.position, node.position) > SHELTER_RESOURCE_SENSING_RADIUS_TILES) {
          throw new PersistenceError("TARGET_UNAVAILABLE");
        }
        if (input.equipmentTier !== GATHERER_EQUIPMENT_TIER || input.tool !== expectedGathererTool(node)) {
          throw new PersistenceError("TOOL_INCOMPATIBLE");
        }
        route = planOpenGridRoute(shelterManifest.position, node.position, fixture.manifest.mapFingerprint);
      } else if (input.role === "HUNTER") {
        if (input.equipmentTier !== HUNTER_EQUIPMENT_TIER || input.tool !== "SWORD") {
          throw new PersistenceError("TOOL_INCOMPATIBLE");
        }
        if (returnPolicy !== "ON_RECALL") {
          throw new PersistenceError("INVALID_INPUT");
        }
        const monster = fixture.manifest.monster;
        if (input.targetId !== monster.monsterId) {
          throw new PersistenceError("TARGET_UNAVAILABLE");
        }
        const persistedMonster = this.store.listMonsters(input.worldId).find((candidate) => candidate.monsterId === monster.monsterId);
        if (!persistedMonster || persistedMonster.state.toUpperCase() !== "PATROL") {
          throw new PersistenceError("TARGET_UNAVAILABLE");
        }
        const activeHunter = this.store.listMissionAttempts(input.worldId)
          .some((attempt) => ["ACTIVE", "active"].includes(attempt.state)
            && attempt.role === "HUNTER"
            && attempt.targetId === monster.monsterId);
        if (activeHunter) {
          throw new PersistenceError("TARGET_UNAVAILABLE");
        }
        route = planOpenGridRoute(shelterManifest.position, monster.position, fixture.manifest.mapFingerprint);
      } else {
        throw new PersistenceError("ROLE_UNAVAILABLE");
      }
      const missionId = deterministicId("mission", input.worldId, input.soldierId);
      const missionAttemptId = deterministicId("mission-attempt", input.worldId, input.soldierId, input.idempotencyKey);
      const eventId = deterministicId("mission-dispatched", input.worldId, input.soldierId, input.idempotencyKey);
      return this.store.commitMissionDispatch({
        worldId: input.worldId,
        worldTime: world.worldTime,
        commandId: input.commandId,
        idempotency,
        soldierId: input.soldierId,
        expectedSoldierRevision: input.expectedSoldierRevision,
        missionId,
        missionAttemptId,
        role: input.role,
        tool: input.tool,
        equipmentTier: input.equipmentTier,
        targetId: input.targetId,
        route,
        homeAnchor: shelterManifest.position,
        returnPolicy,
        event: {
          eventId,
          eventType: "MissionDispatched",
          causationId: input.commandId,
          idempotencyKey: input.idempotencyKey,
          aggregateType: "mission",
          aggregateId: missionId,
          // Persistence derives the current mission revision. This is zero
          // on first dispatch and advances when a completed resident row is
          // reused after deposit.
          aggregateRevision: null,
          visibilityScope: { kind: "shelter", shelterId: shelter.shelterId },
          typedPayload: {
            missionId,
            missionAttemptId,
            soldierId: input.soldierId,
            role: input.role,
            tool: input.tool,
            equipmentTier: input.equipmentTier,
            targetId: input.targetId,
            route,
            homeAnchor: shelterManifest.position,
            returnPolicy,
            phase: "TRAVELLING",
          },
        },
      });
    } catch (error) {
      const typed = classifyPersistenceError(error, "STORE_OPEN_FAILED");
      if (["WORLD_TIME_REGRESSION", "STALE_REVISION", "ENTITY_NOT_FOUND", "OWNERSHIP_DENIED", "ROLE_LOCKED", "NOT_AT_SHELTER", "TARGET_UNAVAILABLE", "TOOL_INCOMPATIBLE", "MISSION_ACTIVE", "ROLE_UNAVAILABLE"].includes(typed.code)) {
        try {
          this.store.recordRejectedIdempotency(input.worldId, idempotency, typed);
        } catch (recordError) {
          // A definitive rejection is authoritative only after its retry outcome is durable.
          throw classifyPersistenceError(recordError, "STORE_OPEN_FAILED");
        }
      }
      throw typed;
    }
  }

  forceRecallSoldier(input: ForceRecallSoldierInput): ForceRecallSoldierResult {
    assertRecallInput(input);
    const request = recallRequest(input);
    const idempotency = { key: input.idempotencyKey, binding: input.binding, request };
    const replay = replayRecallResult(this.store, input, request);
    if (replay) {
      return replay;
    }

    try {
      const world = this.store.getWorld(input.worldId);
      if (!world) {
        throw new PersistenceError("WORLD_NOT_FOUND");
      }
      const player = this.store.getPlayer(input.worldId, input.playerId);
      if (!player) {
        throw new PersistenceError("ENTITY_NOT_FOUND");
      }
      if (player.binding !== input.binding) {
        throw new PersistenceError("OWNERSHIP_DENIED");
      }
      const shelter = this.store.listShelters(input.worldId).find((candidate) => candidate.playerId === input.playerId);
      const soldier = this.store.listSoldiers(input.worldId).find((candidate) => candidate.soldierId === input.soldierId);
      const mission = this.store.getMission(input.worldId, input.missionId);
      const attempt = this.store.getMissionAttempt(input.worldId, input.missionAttemptId);
      if (!shelter || !soldier || !mission || !attempt) {
        throw new PersistenceError("ENTITY_NOT_FOUND");
      }
      if (soldier.shelterId !== shelter.shelterId) {
        throw new PersistenceError("OWNERSHIP_DENIED");
      }
      validateRecallProvenance({ store: this.store, input, shelterId: shelter.shelterId });
      if (soldier.revision !== input.expectedSoldierRevision
        || mission.revision !== input.expectedMissionRevision
        || attempt.revision !== input.expectedMissionAttemptRevision) {
        throw new PersistenceError("STALE_REVISION");
      }

      // These outcomes are deliberately explicit so a stale dashboard action
      // cannot look like a successful recall after the mission has already
      // crossed the home boundary or entered another return phase.
      if (mission.phase === "AT_SHELTER" || attempt.phase === "AT_SHELTER") {
        throw new PersistenceError("ALREADY_AT_SHELTER");
      }
      if (mission.phase === "RETURNING" || attempt.phase === "RETURNING"
        || mission.phase === "DEPOSITING" || attempt.phase === "DEPOSITING") {
        throw new PersistenceError("MISSION_ACTIVE");
      }
      if (mission.phase !== "TRAVELLING" && mission.phase !== "WORKING") {
        throw new PersistenceError("ROLE_LOCKED");
      }
      if (attempt.phase !== mission.phase) {
        throw new PersistenceError("ROLE_LOCKED");
      }
      if (mission.soldierId !== input.soldierId || attempt.missionId !== input.missionId
        || mission.activeAttemptId !== input.missionAttemptId
        || !["ACTIVE", "active"].includes(mission.state)
        || !["ACTIVE", "active"].includes(attempt.state)
        || soldier.state !== "FIELD"
        || (mission.role !== "GATHERER" && mission.role !== "HUNTER")
        || attempt.role !== mission.role
        || soldier.role !== mission.role
        || mission.tool !== attempt.tool
        || soldier.tool !== attempt.tool
        || mission.targetId === null
        || attempt.targetId === null
        || mission.targetId !== attempt.targetId
        || mission.returnPolicy === null
        || attempt.returnPolicy !== mission.returnPolicy) {
        throw new PersistenceError("ROLE_LOCKED");
      }
      const encounterStatus = mission.encounterStatus ?? attempt.encounterStatus;
      if (mission.encounterStatus !== attempt.encounterStatus) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      if (encounterStatus === "LOCKED" || encounterStatus === "RESOLVING") {
        throw new PersistenceError("IN_COMBAT");
      }
      if (encounterStatus === "RESOLVED") {
        throw new PersistenceError("ROLE_LOCKED");
      }
      if (mission.role === "HUNTER" && mission.returnPolicy !== "ON_RECALL") {
        throw new PersistenceError("ROLE_LOCKED");
      }

      const route = attempt.route;
      const homeAnchor = attempt.homeAnchor;
      if (!route || !homeAnchor) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const recallPosition = deriveRoutePosition(route, attempt.startWorldTime, world.worldTime);
      const returningAttempt: MissionAttemptRecord = {
        ...attempt,
        // reverseMissionRoute treats the transition timestamp as the outbound
        // cursor. It is intentionally supplied as a projection here; the
        // persisted attempt keeps only the new transition time.
        lastTransitionWorldTime: world.worldTime,
      };
      const returnRoute = reverseMissionRoute(returningAttempt);
      const eventId = deterministicId("mission-recalled", input.worldId, input.missionAttemptId, input.idempotencyKey);
      const eventPayload = {
        missionId: mission.missionId,
        missionAttemptId: attempt.missionAttemptId,
        soldierId: soldier.soldierId,
        ...(mission.role === "HUNTER" ? { role: mission.role, tool: mission.tool } : {}),
        previousPhase: mission.phase,
        phase: "RETURNING" as const,
        recallPosition,
        homeAnchor,
        returnTravelWorldSeconds: returnRoute.estimatedTravelWorldSeconds,
        returnPolicy: mission.returnPolicy,
        worldTime: world.worldTime,
      };
      return this.store.commitMissionRecall({
        worldId: input.worldId,
        worldTime: world.worldTime,
        commandId: input.commandId,
        idempotency,
        soldierId: soldier.soldierId,
        expectedSoldierRevision: input.expectedSoldierRevision,
        missionId: mission.missionId,
        expectedMissionRevision: input.expectedMissionRevision,
        missionAttemptId: attempt.missionAttemptId,
        expectedMissionAttemptRevision: input.expectedMissionAttemptRevision,
        role: mission.role,
        tool: mission.tool as MissionTool,
        previousPhase: mission.phase,
        recallPosition,
        homeAnchor,
        returnTravelWorldSeconds: returnRoute.estimatedTravelWorldSeconds,
        returnPolicy: mission.returnPolicy,
        event: {
          eventId,
          eventType: "MissionRecalled",
          causationId: input.commandId,
          idempotencyKey: input.idempotencyKey,
          aggregateType: "mission",
          aggregateId: mission.missionId,
          aggregateRevision: null,
          visibilityScope: { kind: "shelter", shelterId: shelter.shelterId },
          typedPayload: eventPayload,
        },
      });
    } catch (error) {
      const typed = classifyPersistenceError(error, "STORE_OPEN_FAILED");
      if (["WORLD_TIME_REGRESSION", "STALE_REVISION", "ENTITY_NOT_FOUND", "OWNERSHIP_DENIED", "ROLE_LOCKED", "ALREADY_AT_SHELTER", "STALE_REENTRY_CONTEXT", "IN_COMBAT", "MISSION_ACTIVE", "ROLE_UNAVAILABLE"].includes(typed.code)) {
        try {
          this.store.recordRejectedIdempotency(input.worldId, idempotency, typed);
        } catch (recordError) {
          throw classifyPersistenceError(recordError, "STORE_OPEN_FAILED");
        }
      }
      throw typed;
    }
  }
}
