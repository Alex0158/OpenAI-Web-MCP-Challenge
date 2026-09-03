import { createHash } from "node:crypto";

import { classifyPersistenceError, PersistenceError } from "./persistence/errors";
import { canonicalJson } from "./persistence/json";
import type {
  CommitTransitionResult,
  EncounterRecord,
  GridCoordinate,
  MissionAttemptRecord,
  MissionPhase,
  MissionRecord,
  MissionRole,
  MissionRoutePlan,
  MissionTool,
  PersistedDomainEvent,
  SoldierRecord,
} from "./persistence/types";
import { PersistenceStore } from "./persistence/store";
import { G2_CARGO_CAPACITY_SLOTS } from "./mission-extraction-service";
import { SHELTER_RESOURCE_SENSING_RADIUS_TILES } from "./mission-service";
import { deriveRoutePosition } from "./mission-travel-service";
import { reverseMissionRoute } from "./mission-return-service";
import {
  G2_PLAYER_FOG_REVEAL_RADIUS_TILES,
  loadPersistedG2Fixture,
  type WorldFixtureManifest,
} from "./world-fixture";
import {
  PAGE_TOOL_HISTORY_DEFAULT_LIMIT,
  PAGE_TOOL_HISTORY_MAX_LIMIT,
  type AgentSnapshotV1,
  type InspectClientSnapshotResult,
  type InspectMissionHistoryResult,
  type InspectMissionsResult,
  type InspectShelterStateResult,
  type PageToolContinuationSummary,
  type PageToolHistoryEvent,
  type PageToolMissionSummary,
  type PageToolScope,
} from "../shared/page-tool-contract";

export type PlayerMoveDirection = "up" | "down" | "left" | "right";

export interface MovePlayerInput {
  worldId: string;
  playerId: string;
  binding: string;
  commandId: string;
  direction: PlayerMoveDirection;
  expectedRevision: number;
  idempotencyKey: string;
}

export interface PlayerMoveResult {
  contractVersion: string;
  worldId: string;
  playerId: string;
  commandId: string;
  effect: "moved";
  duplicate?: boolean;
  eventId: string;
  revision: number;
  position: GridCoordinate;
}

export interface FullSnapshotInput {
  worldId: string;
  playerId: string;
  binding: string;
}

export interface ClientSnapshotActor {
  kind: "player" | "shelter" | "soldier" | "monster";
  playerId?: string;
  shelterId?: string;
  soldierId?: string;
  monsterId?: string;
  missionId?: string | null;
  encounterId?: string;
  state?: string;
  phase?: MissionPhase | null;
  role?: MissionRole | null;
  tool?: MissionTool | null;
  cargoCapacityUsed?: number;
  position: GridCoordinate;
  revision: number;
}

export type ClientResourceAvailability = "AVAILABLE" | "DEPLETED";

export interface ClientSnapshotResourceNode {
  resourceNodeId: string;
  resourceType: "wood" | "rock";
  position: GridCoordinate;
  availability: ClientResourceAvailability;
  observedWorldTime: number;
  revision: number;
}

export interface ClientSnapshotCargoSummary {
  quantity: number;
  capacityUsed: number;
  capacity: number;
  resourceTypes: string[];
}

export interface ClientSnapshotEncounter {
  encounterId: string;
  monsterId: string;
  state: "LOCKED" | "RESOLVING" | "RESOLVED";
  soldierHp: number;
  monsterHp: number;
  roundNumber: number;
  engagementPosition: GridCoordinate;
  contactWorldTime: number;
  nextDueWorldTime: number | null;
  terminalCause: "GATHERER_LOST" | "MONSTER_DEFEATED" | null;
  revision: number;
}

export type ClientMissionNextAction = "DISPATCH" | "MONITOR" | "DEPOSIT" | "REVIEW";

export interface ClientSnapshotMission {
  missionId: string | null;
  soldierId: string;
  soldierState: string;
  missionState: string | null;
  missionAttemptId: string | null;
  attemptRevision: number | null;
  phase: MissionPhase;
  role: MissionRole | null;
  tool: MissionTool | null;
  equipmentTier: number | null;
  targetId: string | null;
  returnPolicy: "WHEN_FULL" | "ON_TARGET_DEPLETED" | "ON_RECALL" | null;
  route: MissionRoutePlan | null;
  position: GridCoordinate;
  nextDueWorldTime: number | null;
  cargo: ClientSnapshotCargoSummary;
  encounter: ClientSnapshotEncounter | null;
  reissue: {
    budget: 0 | 1;
    dangerCell: GridCoordinate | null;
    waitingReviewReason: "NO_SAFE_REISSUE_ROUTE" | "REPEATED_MONSTER_DEATH" | null;
  };
  nextAction: ClientMissionNextAction;
  revision: number;
}

export interface ClientSnapshotEvent {
  eventId: string;
  eventType: string;
  worldEventCursor: number;
  worldTime: number;
  aggregateType: string;
  aggregateId: string;
}

export interface ClientSnapshot {
  clientSnapshotId: string;
  baseClientSnapshotId: null;
  full: true;
  contractVersion: string;
  worldId: string;
  worldTime: number;
  playerScope: {
    playerId: string;
    shelterId: string;
  };
  entityRevisions: Record<string, number>;
  map: {
    width: number;
    height: number;
    generationVersion: string;
    blockedCells: GridCoordinate[];
  };
  worldEventCursor: number;
  player: {
    playerId: string;
    position: GridCoordinate;
    revision: number;
    exploredCells: GridCoordinate[];
  };
  shelter: {
    shelterId: string;
    playerId: string;
    revision: number;
    coins: number;
  };
  soldiers: Array<{
    soldierId: string;
    shelterId: string;
    state: string;
    role: string | null;
    tool: string | null;
    position: GridCoordinate;
    missionId: string | null;
    phase: MissionPhase | null;
    cargoCapacityUsed: number;
    revision: number;
  }>;
  resourceNodes: ClientSnapshotResourceNode[];
  missions: ClientSnapshotMission[];
  visibleActors: ClientSnapshotActor[];
  recentEvents: ClientSnapshotEvent[];
}

const DIRECTIONS: Record<PlayerMoveDirection, GridCoordinate> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function assertInput(input: MovePlayerInput): void {
  if (input.worldId.trim() === "" || input.playerId.trim() === "" || input.binding.trim() === ""
    || input.commandId.trim() === "" || input.commandId.length > 128
    || input.idempotencyKey.trim() === "" || input.idempotencyKey.length > 128
    || input.commandId === input.idempotencyKey) {
    throw new PersistenceError("INVALID_INPUT");
  }
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0 || !DIRECTIONS[input.direction]) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function assertCoordinate(point: GridCoordinate, manifest: WorldFixtureManifest): void {
  if (!Number.isSafeInteger(point.x) || !Number.isSafeInteger(point.y)
    || point.x < 0 || point.x >= manifest.dimensions.width
    || point.y < 0 || point.y >= manifest.dimensions.height) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
}

function assertExploredCells(cells: GridCoordinate[], manifest: WorldFixtureManifest): void {
  for (const cell of cells) {
    if (!Number.isSafeInteger(cell.x) || !Number.isSafeInteger(cell.y)
      || cell.x < 0 || cell.x >= manifest.dimensions.width
      || cell.y < 0 || cell.y >= manifest.dimensions.height) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
  }
}

function coordinateKey(point: GridCoordinate): string {
  return `${point.x},${point.y}`;
}

function sortedCells(cells: GridCoordinate[]): GridCoordinate[] {
  return [...cells].sort((left, right) => left.y - right.y || left.x - right.x);
}

function revealAround(position: GridCoordinate, existing: GridCoordinate[], manifest: WorldFixtureManifest): GridCoordinate[] {
  const cells = new Map(existing.map((cell) => [coordinateKey(cell), { ...cell }]));
  const radius = G2_PLAYER_FOG_REVEAL_RADIUS_TILES;
  for (let y = position.y - radius; y <= position.y + radius; y += 1) {
    for (let x = position.x - radius; x <= position.x + radius; x += 1) {
      const cell = { x, y };
      if (x >= 0 && x < manifest.dimensions.width && y >= 0 && y < manifest.dimensions.height
        && Math.hypot(x - position.x, y - position.y) <= radius) {
        cells.set(coordinateKey(cell), cell);
      }
    }
  }
  return sortedCells([...cells.values()]);
}

function movementEventId(worldId: string, playerId: string, idempotencyKey: string): string {
  const digest = createHash("sha256")
    .update(`${worldId}\u0000${playerId}\u0000${idempotencyKey}`)
    .digest("hex")
    .slice(0, 24);
  return `player-moved-${digest}`;
}

function playerMovedPosition(event: PersistedDomainEvent | undefined, playerId: string): GridCoordinate | null {
  if (!event || event.eventType !== "PlayerMoved" || event.aggregateType !== "player"
    || event.aggregateId !== playerId
    || !event.typedPayload || typeof event.typedPayload !== "object") {
    return null;
  }
  const to = (event.typedPayload as { to?: unknown }).to;
  if (!to || typeof to !== "object" || Array.isArray(to)) {
    return null;
  }
  const point = to as { x?: unknown; y?: unknown };
  return Number.isSafeInteger(point.x) && Number.isSafeInteger(point.y)
    ? { x: point.x as number, y: point.y as number }
    : null;
}

function playerResult(
  store: PersistenceStore,
  input: MovePlayerInput,
  transition: CommitTransitionResult,
  duplicate: boolean,
): PlayerMoveResult {
  const eventId = transition.eventIds[0];
  if (!eventId) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const event = store.events(input.worldId).find((candidate) => candidate.eventId === eventId);
  const position = playerMovedPosition(event, input.playerId);
  if (!position || event?.causationId !== input.commandId || event.idempotencyKey !== input.idempotencyKey) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const player = store.getPlayer(input.worldId, input.playerId);
  if (!player) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return {
    contractVersion: store.contractVersion,
    worldId: input.worldId,
    playerId: input.playerId,
    commandId: input.commandId,
    effect: "moved",
    ...(duplicate ? { duplicate: true } : {}),
    eventId,
    revision: duplicate ? (transition.entityRevisions[`player:${input.playerId}`] ?? player.revision) : player.revision,
    position,
  };
}

function visibleToPlayer(event: PersistedDomainEvent, playerId: string, shelterId: string): boolean {
  const scope = event.visibilityScope;
  return scope.kind === "world"
    || (scope.kind === "player" && scope.playerId === playerId)
    || (scope.kind === "shelter" && scope.shelterId === shelterId);
}

function copyCoordinate(point: GridCoordinate): GridCoordinate {
  return { x: point.x, y: point.y };
}

function samePoint(left: GridCoordinate, right: GridCoordinate): boolean {
  return left.x === right.x && left.y === right.y;
}

function assertProjectionCoordinate(point: GridCoordinate, manifest: WorldFixtureManifest): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)
    || point.x < 0 || point.x >= manifest.dimensions.width
    || point.y < 0 || point.y >= manifest.dimensions.height) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
}

function assertRouteForProjection(route: MissionRoutePlan, homeAnchor: GridCoordinate, manifest: WorldFixtureManifest): void {
  if (route.walkabilityVersion !== manifest.mapFingerprint
    || !samePoint(route.source, homeAnchor)
    || !Number.isSafeInteger(route.estimatedTravelWorldSeconds)
    || route.estimatedTravelWorldSeconds < 0
    || route.status !== "PLANNED"
    || route.waypoints.length === 0) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  for (const point of route.waypoints) {
    if (!Number.isSafeInteger(point.x) || !Number.isSafeInteger(point.y)) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    assertCoordinate(point, manifest);
  }
}

function validMissionRole(value: string | null): MissionRole | null {
  if (value === null) {
    return null;
  }
  if (value === "GATHERER" || value === "HUNTER" || value === "SIEGE" || value === "GUARD") {
    return value;
  }
  throw new PersistenceError("RECOVERY_REQUIRED");
}

function validMissionTool(value: string | null): MissionTool | null {
  if (value === null) {
    return null;
  }
  if (value === "AXE" || value === "PICKAXE" || value === "SWORD" || value === "HAMMER" || value === "SIEGE_KIT") {
    return value;
  }
  throw new PersistenceError("RECOVERY_REQUIRED");
}

function validateRevision(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return value;
}

function validateWorldTime(value: number | null): number | null {
  if (value === null) {
    return null;
  }
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return value;
}

function latestAttempt(attempts: MissionAttemptRecord[]): MissionAttemptRecord | null {
  if (attempts.length === 0) {
    return null;
  }
  return [...attempts].sort((left, right) => right.startWorldTime - left.startWorldTime
    || right.lastTransitionWorldTime - left.lastTransitionWorldTime
    || right.missionAttemptId.localeCompare(left.missionAttemptId))[0] ?? null;
}

function nextActionForPhase(phase: MissionPhase): ClientMissionNextAction {
  switch (phase) {
    case "AT_SHELTER":
      return "DISPATCH";
    case "DEPOSITING":
      return "DEPOSIT";
    case "WAITING_REVIEW":
      return "REVIEW";
    default:
      return "MONITOR";
  }
}

function cargoSummary(
  store: PersistenceStore,
  worldId: string,
  soldierId: string,
  activeAttemptId: string | null,
): ClientSnapshotCargoSummary {
  const cargo = activeAttemptId === null
    ? []
    : store.listCargo(worldId, soldierId, activeAttemptId);
  let quantity = 0;
  let capacityUsed = 0;
  const resourceTypes = new Set<string>();
  for (const item of cargo) {
    if (item.worldId !== worldId || item.soldierId !== soldierId || item.missionAttemptId !== activeAttemptId
      || (item.resourceType !== "wood" && item.resourceType !== "rock")
      || !Number.isSafeInteger(item.quantity) || item.quantity <= 0
      || !Number.isSafeInteger(item.capacityUsed) || item.capacityUsed <= 0
      || item.capacityUsed !== item.quantity
      || !Number.isSafeInteger(item.revision) || item.revision < 0) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    if (quantity > Number.MAX_SAFE_INTEGER - item.quantity || capacityUsed > Number.MAX_SAFE_INTEGER - item.capacityUsed) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    quantity += item.quantity;
    capacityUsed += item.capacityUsed;
    resourceTypes.add(item.resourceType);
  }
  if (capacityUsed > G2_CARGO_CAPACITY_SLOTS) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return {
    quantity,
    capacityUsed,
    capacity: G2_CARGO_CAPACITY_SLOTS,
    resourceTypes: [...resourceTypes].sort(),
  };
}

function encounterProjection(encounter: EncounterRecord | null): ClientSnapshotEncounter | null {
  if (!encounter) {
    return null;
  }
  if (!Number.isSafeInteger(encounter.soldierHp) || encounter.soldierHp < 0
    || !Number.isSafeInteger(encounter.monsterHp) || encounter.monsterHp < 0
    || !Number.isSafeInteger(encounter.roundNumber) || encounter.roundNumber < 0
    || !Number.isSafeInteger(encounter.contactWorldTime) || encounter.contactWorldTime < 0
    || !Number.isSafeInteger(encounter.engagementPosition.x) || !Number.isSafeInteger(encounter.engagementPosition.y)
    || !Number.isSafeInteger(encounter.revision) || encounter.revision < 0) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return {
    encounterId: encounter.encounterId,
    monsterId: encounter.monsterId,
    state: encounter.state,
    soldierHp: encounter.soldierHp,
    monsterHp: encounter.monsterHp,
    roundNumber: encounter.roundNumber,
    engagementPosition: copyCoordinate(encounter.engagementPosition),
    contactWorldTime: encounter.contactWorldTime,
    nextDueWorldTime: validateWorldTime(encounter.nextDueWorldTime),
    terminalCause: encounter.terminalCause,
    revision: validateRevision(encounter.revision),
  };
}

function positionForMission(
  phase: MissionPhase,
  attempt: MissionAttemptRecord | null,
  encounter: EncounterRecord | null,
  shelterPosition: GridCoordinate,
  worldTime: number,
  manifest: WorldFixtureManifest,
): GridCoordinate {
  if (!attempt || phase === "AT_SHELTER" || phase === "WAITING_REVIEW" || phase === "TERMINAL") {
    return copyCoordinate(shelterPosition);
  }
  if (!attempt.homeAnchor || !samePoint(attempt.homeAnchor, shelterPosition)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  if (attempt.route) {
    assertRouteForProjection(attempt.route, attempt.homeAnchor, manifest);
  }
  switch (phase) {
    case "TRAVELLING":
      if (!attempt.route) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      {
        const position = deriveRoutePosition(attempt.route, attempt.startWorldTime, worldTime);
        return { x: position.x, y: position.y };
      }
    case "WORKING":
      if (encounter && (encounter.state === "LOCKED" || encounter.state === "RESOLVING")) {
        return copyCoordinate(encounter.engagementPosition);
      }
      if (!attempt.route) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      return copyCoordinate(attempt.route.target);
    case "RETURNING":
      if (!attempt.route) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      {
        const position = deriveRoutePosition(reverseMissionRoute(attempt), attempt.lastTransitionWorldTime, worldTime);
        return { x: position.x, y: position.y };
      }
    case "DEPOSITING":
      return copyCoordinate(shelterPosition);
    default:
      throw new PersistenceError("RECOVERY_REQUIRED");
  }
}

function missionRowForSoldier(options: {
  store: PersistenceStore;
  worldId: string;
  worldTime: number;
  soldier: SoldierRecord;
  mission: MissionRecord | null;
  attempts: MissionAttemptRecord[];
  encounters: Map<string, EncounterRecord>;
  shelterPosition: GridCoordinate;
  manifest: WorldFixtureManifest;
}): ClientSnapshotMission {
  const { store, worldId, worldTime, soldier, mission, attempts, encounters, shelterPosition, manifest } = options;
  const soldierRole = validMissionRole(soldier.role);
  const soldierTool = validMissionTool(soldier.tool);
  if (mission === null) {
    if (soldier.state !== "AT_SHELTER" || soldierRole !== null || soldierTool !== null) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    return {
      missionId: null,
      soldierId: soldier.soldierId,
      soldierState: soldier.state,
      missionState: null,
      missionAttemptId: null,
      attemptRevision: null,
      phase: "AT_SHELTER",
      role: null,
      tool: null,
      equipmentTier: null,
      targetId: null,
      returnPolicy: null,
      route: null,
      position: copyCoordinate(shelterPosition),
      nextDueWorldTime: null,
      cargo: cargoSummary(store, worldId, soldier.soldierId, null),
      encounter: null,
      reissue: { budget: 1, dangerCell: null, waitingReviewReason: null },
      nextAction: "DISPATCH",
      revision: validateRevision(soldier.revision),
    };
  }

  if (mission.worldId !== worldId || mission.soldierId !== soldier.soldierId
    || !Number.isSafeInteger(mission.revision) || mission.revision < 0
    || (mission.monsterReissueBudget !== 0 && mission.monsterReissueBudget !== 1)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const role = validMissionRole(mission.role);
  const tool = validMissionTool(mission.tool);
  const attemptsForMission = attempts.filter((attempt) => attempt.missionId === mission.missionId);
  if (attemptsForMission.length !== attempts.length) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const latest = latestAttempt(attemptsForMission);
  const active = mission.activeAttemptId === null
    ? null
    : attemptsForMission.find((attempt) => attempt.missionAttemptId === mission.activeAttemptId) ?? null;
  if (mission.activeAttemptId !== null && active === null) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const displayAttempt = active ?? latest;
  const encounterForAttempt = (attempt: MissionAttemptRecord | null): EncounterRecord | null => {
    if (!attempt) {
      return null;
    }
    if (attempt.encounterId) {
      return encounters.get(attempt.encounterId) ?? null;
    }
    return [...encounters.values()].find((candidate) => candidate.missionAttemptId === attempt.missionAttemptId) ?? null;
  };
  const activeEncounter = encounterForAttempt(active);
  const historicalEncounter = encounterForAttempt(latest);
  for (const encounter of [activeEncounter, historicalEncounter]) {
    if (encounter && (encounter.missionId !== mission.missionId || encounter.soldierId !== soldier.soldierId
      || (displayAttempt && encounter.missionAttemptId !== displayAttempt.missionAttemptId))) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
  }

  if (active) {
    const attemptRole = validMissionRole(active.role);
    const attemptTool = validMissionTool(active.tool);
    if (mission.state.toUpperCase() !== "ACTIVE" || active.state.toUpperCase() !== "ACTIVE"
      || mission.phase !== active.phase || mission.role !== attemptRole || mission.tool !== attemptTool
      || soldier.state !== "FIELD" || soldierRole !== attemptRole || soldierTool !== attemptTool
      || mission.targetId !== active.targetId
      || mission.returnPolicy !== active.returnPolicy
      || mission.nextDueWorldTime !== active.nextDueWorldTime
      || active.homeAnchor === null) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    if (active.encounterId !== null && activeEncounter === null) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    if (active.encounterId === null && active.encounterStatus !== null) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
  } else if (mission.phase === "WAITING_REVIEW") {
    if (mission.state.toUpperCase() !== "COMPLETED" || soldier.state !== "AT_SHELTER"
      || soldierRole !== null || soldierTool !== null || !latest
      || latest.state.toUpperCase() !== "COMPLETED" || latest.phase !== "TERMINAL"
      || latest.terminalCause !== "GATHERER_LOST") {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
  } else if (mission.phase === "AT_SHELTER") {
    if (mission.state.toUpperCase() !== "COMPLETED"
      || soldier.state !== "AT_SHELTER" || soldierRole !== null || soldierTool !== null
      || mission.activeAttemptId !== null || mission.role !== null || mission.tool !== null
      || mission.targetId !== null || mission.returnPolicy !== null) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
  } else {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }

  const phase = mission.phase;
  const displayRole = role ?? (phase === "WAITING_REVIEW" ? validMissionRole(latest?.role ?? null) : null);
  const displayTool = tool ?? (phase === "WAITING_REVIEW" ? validMissionTool(latest?.tool ?? null) : null);
  const displayTargetId = mission.targetId ?? (phase === "WAITING_REVIEW" ? latest?.targetId ?? null : null);
  const displayReturnPolicy = mission.returnPolicy ?? (phase === "WAITING_REVIEW" ? latest?.returnPolicy ?? null : null);
  const route = active?.route ?? (phase === "WAITING_REVIEW" ? latest?.route ?? null : null);
  const encounter = encounterProjection(activeEncounter ?? historicalEncounter);
  const position = positionForMission(phase, active ?? (phase === "WAITING_REVIEW" ? latest : null), activeEncounter, shelterPosition, worldTime, manifest);
  assertProjectionCoordinate(position, manifest);
  if (route && latest?.homeAnchor) {
    assertRouteForProjection(route, latest.homeAnchor, manifest);
  }
  const nextDueWorldTime = validateWorldTime(active?.nextDueWorldTime ?? null);
  const dangerCell = mission.dangerCell ? copyCoordinate(mission.dangerCell) : null;
  if (dangerCell) {
    assertCoordinate(dangerCell, manifest);
  }
  const waitingReviewReason = mission.waitingReviewReason;
  if (phase === "WAITING_REVIEW" && waitingReviewReason === null) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  if (phase !== "WAITING_REVIEW" && waitingReviewReason !== null) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return {
    missionId: mission.missionId,
    soldierId: soldier.soldierId,
    soldierState: soldier.state,
    missionState: mission.state,
    missionAttemptId: displayAttempt?.missionAttemptId ?? null,
    attemptRevision: displayAttempt ? validateRevision(displayAttempt.revision) : null,
    phase,
    role: displayRole,
    tool: displayTool,
    equipmentTier: active?.equipmentTier ?? (phase === "WAITING_REVIEW" ? latest?.equipmentTier ?? null : null),
    targetId: displayTargetId,
    returnPolicy: displayReturnPolicy,
    route: route ? structuredClone(route) : null,
    position,
    nextDueWorldTime,
    cargo: cargoSummary(store, worldId, soldier.soldierId, active?.missionAttemptId ?? null),
    encounter,
    reissue: {
      budget: mission.monsterReissueBudget,
      dangerCell,
      waitingReviewReason,
    },
    nextAction: nextActionForPhase(phase),
    revision: validateRevision(mission.revision),
  };
}

export class PlayerMovementService {
  private readonly store: PersistenceStore;

  constructor(options: { store: PersistenceStore }) {
    this.store = options.store;
  }

  move(input: MovePlayerInput): PlayerMoveResult {
    assertInput(input);
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

    const request = {
      kind: "move_player",
      playerId: input.playerId,
      commandId: input.commandId,
      direction: input.direction,
      expectedRevision: input.expectedRevision,
    };
    const idempotency = {
      key: input.idempotencyKey,
      binding: input.binding,
      request,
    };
    const existing = this.store.idempotency(input.worldId, input.idempotencyKey);
    if (existing) {
      const replay = this.store.commitTransition({
        worldId: input.worldId,
        worldTime: world.worldTime,
        idempotency,
        stateMutations: [],
        events: [],
      });
      return playerResult(this.store, input, replay, true);
    }

    const rejectDurably = (code: "STALE_REVISION" | "MOVEMENT_BLOCKED"): never => {
      const rejection = new PersistenceError(code);
      try {
        this.store.recordRejectedIdempotency(input.worldId, idempotency, rejection);
      } catch (error) {
        // A rejection is authoritative only after its retry outcome is durable.
        throw classifyPersistenceError(error, "STORE_OPEN_FAILED");
      }
      throw rejection;
    };
    if (player.revision !== input.expectedRevision) {
      return rejectDurably("STALE_REVISION");
    }

    const fixture = loadPersistedG2Fixture(this.store, input.worldId);
    assertCoordinate(player.position, fixture.manifest);
    assertExploredCells(player.exploredCells, fixture.manifest);
    const delta = DIRECTIONS[input.direction];
    const nextPosition = { x: player.position.x + delta.x, y: player.position.y + delta.y };
    const blocked = fixture.manifest.walkability.blockedCells.some((cell) => cell.x === nextPosition.x && cell.y === nextPosition.y);
    if (nextPosition.x < 0 || nextPosition.x >= fixture.manifest.dimensions.width
      || nextPosition.y < 0 || nextPosition.y >= fixture.manifest.dimensions.height || blocked) {
      return rejectDurably("MOVEMENT_BLOCKED");
    }

    const exploredCells = revealAround(nextPosition, player.exploredCells, fixture.manifest);
    const transition = this.store.commitTransition({
      worldId: input.worldId,
      worldTime: world.worldTime,
      idempotency,
      stateMutations: [{
        entityType: "player",
        entityId: input.playerId,
        expectedRevision: input.expectedRevision,
        patch: {
          position_x: nextPosition.x,
          position_y: nextPosition.y,
          explored_cells_json: canonicalJson(exploredCells),
        },
      }],
      events: [{
        eventId: movementEventId(input.worldId, input.playerId, input.idempotencyKey),
        eventType: "PlayerMoved",
        causationId: input.commandId,
        idempotencyKey: input.idempotencyKey,
        aggregateType: "player",
        aggregateId: input.playerId,
        visibilityScope: { kind: "player", playerId: input.playerId },
        typedPayload: {
          kind: "player_moved",
          playerId: input.playerId,
          direction: input.direction,
          from: player.position,
          to: nextPosition,
        },
      }],
    });
    return playerResult(this.store, input, transition, false);
  }
}

export class ClientSnapshotService {
  private readonly store: PersistenceStore;

  constructor(options: { store: PersistenceStore }) {
    this.store = options.store;
  }

  full(input: FullSnapshotInput): ClientSnapshot {
    if (input.worldId.trim() === "" || input.playerId.trim() === "" || input.binding.trim() === "") {
      throw new PersistenceError("INVALID_INPUT");
    }
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
    const fixture = loadPersistedG2Fixture(this.store, input.worldId);
    assertCoordinate(player.position, fixture.manifest);
    assertExploredCells(player.exploredCells, fixture.manifest);
    const shelter = this.store.listShelters(input.worldId).find((candidate) => candidate.playerId === input.playerId);
    if (!shelter) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    const soldiers = this.store.listSoldiers(input.worldId).filter((candidate) => candidate.shelterId === shelter.shelterId);
    const recentEvents = this.store.events(input.worldId)
      .filter((event) => visibleToPlayer(event, input.playerId, shelter.shelterId))
      .slice(-20)
      .map((event): ClientSnapshotEvent => ({
        eventId: event.eventId,
        eventType: event.eventType,
        worldEventCursor: event.worldEventCursor,
        worldTime: event.worldTime,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
      }));
    const shelterManifest = fixture.manifest.shelters.find((candidate) => candidate.shelterId === shelter.shelterId);
    if (!shelterManifest) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    const allMissions = this.store.listMissions(input.worldId);
    const ownSoldierIds = new Set(soldiers.map((soldier) => soldier.soldierId));
    const ownMissions = allMissions.filter((mission) => ownSoldierIds.has(mission.soldierId));
    const missionBySoldier = new Map<string, MissionRecord>();
    for (const mission of ownMissions) {
      if (missionBySoldier.has(mission.soldierId)) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      missionBySoldier.set(mission.soldierId, mission);
    }
    const allAttempts = this.store.listMissionAttempts(input.worldId);
    const attemptsByMission = new Map<string, MissionAttemptRecord[]>();
    for (const attempt of allAttempts) {
      const current = attemptsByMission.get(attempt.missionId) ?? [];
      current.push(attempt);
      attemptsByMission.set(attempt.missionId, current);
    }
    const encountersById = new Map(this.store.listEncounters(input.worldId).map((encounter) => [encounter.encounterId, encounter]));
    const missionRows = soldiers.map((soldier): ClientSnapshotMission => missionRowForSoldier({
      store: this.store,
      worldId: input.worldId,
      worldTime: world.worldTime,
      soldier,
      mission: missionBySoldier.get(soldier.soldierId) ?? null,
      attempts: missionBySoldier.has(soldier.soldierId)
        ? (attemptsByMission.get(missionBySoldier.get(soldier.soldierId)?.missionId ?? "") ?? [])
        : [],
      encounters: encountersById,
      shelterPosition: shelterManifest.position,
      manifest: fixture.manifest,
    }));
    const exploredKeys = new Set(player.exploredCells.map(coordinateKey));
    const resourceRecords = new Map(this.store.listResourceNodes(input.worldId).map((node) => [node.resourceNodeId, node]));
    const resourceNodes: ClientSnapshotResourceNode[] = [];
    for (const manifestNode of fixture.manifest.resourceNodes) {
      const node = resourceRecords.get(manifestNode.resourceNodeId);
      if (!node || node.worldId !== input.worldId || (node.resourceType !== "wood" && node.resourceType !== "rock")
        || node.resourceType !== manifestNode.resourceType
        || !Number.isSafeInteger(node.quantity) || node.quantity < 0) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const sensed = Math.hypot(manifestNode.position.x - shelterManifest.position.x, manifestNode.position.y - shelterManifest.position.y)
        <= SHELTER_RESOURCE_SENSING_RADIUS_TILES;
      if (!sensed) {
        continue;
      }
      resourceNodes.push({
        resourceNodeId: node.resourceNodeId,
        resourceType: node.resourceType,
        position: copyCoordinate(manifestNode.position),
        availability: node.quantity > 0 ? "AVAILABLE" : "DEPLETED",
        observedWorldTime: validateWorldTime(world.worldTime) as number,
        revision: validateRevision(node.revision),
      });
    }
    resourceNodes.sort((left, right) => left.resourceNodeId.localeCompare(right.resourceNodeId));
    const entityRevisions: Record<string, number> = {
      [`world:${input.worldId}`]: validateRevision(world.revision),
      [`player:${player.playerId}`]: validateRevision(player.revision),
      [`shelter:${shelter.shelterId}`]: validateRevision(shelter.revision),
      ...Object.fromEntries(soldiers.map((soldier) => [`soldier:${soldier.soldierId}`, validateRevision(soldier.revision)])),
      ...Object.fromEntries(resourceNodes.map((node) => [`resource_node:${node.resourceNodeId}`, node.revision])),
      ...Object.fromEntries(missionRows
        .filter((row) => row.missionId !== null)
        .map((row) => [`mission:${row.missionId}`, row.revision])),
      ...Object.fromEntries(missionRows
        .filter((row) => row.missionAttemptId !== null && row.attemptRevision !== null)
        .map((row) => [`mission_attempt:${row.missionAttemptId}`, row.attemptRevision as number])),
    };
    const visibleActors: ClientSnapshotActor[] = [
      {
        kind: "player",
        playerId: player.playerId,
        position: copyCoordinate(player.position),
        revision: player.revision,
      },
      {
        kind: "shelter",
        playerId: shelter.playerId,
        shelterId: shelter.shelterId,
        position: copyCoordinate(shelterManifest.position),
        revision: shelter.revision,
      },
      ...missionRows.map((row, index): ClientSnapshotActor => {
        const soldier = soldiers[index];
        if (!soldier) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        return {
          kind: "soldier",
          soldierId: soldier.soldierId,
          shelterId: soldier.shelterId,
          missionId: row.missionId,
          state: soldier.state,
          phase: row.phase,
          role: row.role,
          tool: row.tool,
          cargoCapacityUsed: row.cargo.capacityUsed,
          position: copyCoordinate(row.position),
          revision: soldier.revision,
        };
      }),
    ];
    const monsters = new Map(this.store.listMonsters(input.worldId).map((monster) => [monster.monsterId, monster]));
    const activeEncounterIds = new Set<string>();
    for (const row of missionRows) {
      if (!row.encounter || (row.encounter.state !== "LOCKED" && row.encounter.state !== "RESOLVING")) {
        continue;
      }
      if (activeEncounterIds.has(row.encounter.encounterId)) {
        continue;
      }
      activeEncounterIds.add(row.encounter.encounterId);
      const monster = monsters.get(row.encounter.monsterId);
      if (!monster || monster.state.toUpperCase() !== "PATROL") {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      entityRevisions[`encounter:${row.encounter.encounterId}`] = row.encounter.revision;
      entityRevisions[`monster:${monster.monsterId}`] = validateRevision(monster.revision);
      visibleActors.push({
        kind: "monster",
        monsterId: monster.monsterId,
        encounterId: row.encounter.encounterId,
        state: row.encounter.state,
        position: copyCoordinate(row.encounter.engagementPosition),
        revision: row.encounter.revision,
      });
    }
    const map = {
      width: fixture.manifest.dimensions.width,
      height: fixture.manifest.dimensions.height,
      generationVersion: fixture.manifest.generationVersion,
      blockedCells: fixture.manifest.walkability.blockedCells
        .filter((cell) => exploredKeys.has(coordinateKey(cell)))
        .map(copyCoordinate),
    };
    const snapshotBody = {
      contractVersion: this.store.contractVersion,
      worldId: input.worldId,
      worldTime: validateRevision(world.worldTime),
      playerScope: { playerId: input.playerId, shelterId: shelter.shelterId },
      entityRevisions,
      player: { playerId: player.playerId, position: copyCoordinate(player.position), revision: player.revision, exploredCells: player.exploredCells.map(copyCoordinate) },
      shelter: { shelterId: shelter.shelterId, playerId: shelter.playerId, revision: shelter.revision, coins: shelter.coins },
      soldiers: soldiers.map((soldier, index) => ({
        soldierId: soldier.soldierId,
        shelterId: soldier.shelterId,
        state: soldier.state,
        role: soldier.role,
        tool: soldier.tool,
        position: copyCoordinate(missionRows[index]?.position ?? shelterManifest.position),
        missionId: missionRows[index]?.missionId ?? null,
        phase: missionRows[index]?.phase ?? null,
        cargoCapacityUsed: missionRows[index]?.cargo.capacityUsed ?? 0,
        revision: soldier.revision,
      })),
      resourceNodes,
      missions: missionRows,
      visibleActors,
      recentEvents,
      map,
      worldEventCursor: validateRevision(world.worldEventCursor),
    };
    const clientSnapshotId = `client-snapshot-${createHash("sha256").update(canonicalJson(snapshotBody)).digest("hex").slice(0, 24)}`;
    return {
      clientSnapshotId,
      baseClientSnapshotId: null,
      full: true,
      ...snapshotBody,
    };
  }

  inspectShelterState(input: FullSnapshotInput & { readonly requestId: string }): InspectShelterStateResult {
    const snapshot = this.full(input);
    const activePhases = new Set(["TRAVELLING", "WORKING", "RETURNING", "DEPOSITING"]);
    const continuation = this.continuationSummary(input.worldId, snapshot.playerScope.shelterId, input.binding);
    return {
      contract_version: snapshot.contractVersion,
      status: "ok",
      tool: "inspect_shelter_state",
      request_id: input.requestId,
      scope: this.toolScope(snapshot),
      world_time: snapshot.worldTime,
      entity_revisions: {
        world: this.requiredEntityRevision(snapshot, `world:${input.worldId}`),
        shelter: snapshot.shelter.revision,
      },
      shelter: {
        shelter_id: snapshot.shelter.shelterId,
        player_id: snapshot.shelter.playerId,
        revision: snapshot.shelter.revision,
        coins: snapshot.shelter.coins,
        resident_soldier_count: snapshot.soldiers.length,
        active_mission_count: snapshot.missions.filter((mission) => activePhases.has(mission.phase)).length,
      },
      sensed_resources: {
        wood: snapshot.resourceNodes.filter((node) => node.resourceType === "wood").length,
        rock: snapshot.resourceNodes.filter((node) => node.resourceType === "rock").length,
      },
      continuation,
    };
  }

  inspectClientSnapshot(input: FullSnapshotInput & { readonly requestId: string }): InspectClientSnapshotResult {
    const snapshot = this.full(input);
    const activePhases = new Set(["TRAVELLING", "WORKING", "RETURNING", "DEPOSITING"]);
    const scope = this.toolScope(snapshot);
    const agentSnapshot: AgentSnapshotV1 = {
      snapshot_version: "agent_snapshot_v1",
      snapshot_id: snapshot.clientSnapshotId,
      contract_version: snapshot.contractVersion,
      world_time: snapshot.worldTime,
      scope,
      player: {
        position: { x: snapshot.player.position.x, y: snapshot.player.position.y },
        revision: snapshot.player.revision,
      },
      shelter: {
        revision: snapshot.shelter.revision,
        coins: snapshot.shelter.coins,
      },
      world_event_cursor: snapshot.worldEventCursor,
      counts: {
        missions: snapshot.missions.length,
        active_missions: snapshot.missions.filter((mission) => activePhases.has(mission.phase)).length,
        visible_actors: snapshot.visibleActors.length,
        sensed_resource_nodes: snapshot.resourceNodes.length,
      },
    };
    return {
      contract_version: snapshot.contractVersion,
      status: "ok",
      tool: "inspect_client_snapshot",
      request_id: input.requestId,
      scope,
      world_time: snapshot.worldTime,
      snapshot: agentSnapshot,
    };
  }

  inspectMissions(input: FullSnapshotInput & { readonly requestId: string }): InspectMissionsResult {
    const snapshot = this.full(input);
    if (snapshot.missions.length > 5) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    const soldierRevision = new Map(snapshot.soldiers.map((soldier) => [soldier.soldierId, soldier.revision]));
    const missions: PageToolMissionSummary[] = snapshot.missions.map((mission) => ({
      mission_id: mission.missionId,
      soldier_id: mission.soldierId,
      mission_attempt_id: mission.missionAttemptId,
      phase: mission.phase,
      role: mission.role,
      tool: mission.tool,
      equipment_tier: mission.equipmentTier,
      target_id: mission.targetId,
      return_policy: mission.returnPolicy,
      position: { x: mission.position.x, y: mission.position.y },
      next_due_world_time: mission.nextDueWorldTime,
      cargo: {
        quantity: mission.cargo.quantity,
        capacity_used: mission.cargo.capacityUsed,
        capacity: mission.cargo.capacity,
        resource_types: [...mission.cargo.resourceTypes],
      },
      encounter: mission.encounter === null
        ? null
        : {
            encounter_id: mission.encounter.encounterId,
            state: mission.encounter.state,
            terminal_cause: mission.encounter.terminalCause,
            round_number: mission.encounter.roundNumber,
          },
      next_action: mission.nextAction,
      revisions: {
        soldier: this.requiredMapRevision(soldierRevision, mission.soldierId),
        mission: mission.missionId === null ? null : mission.revision,
        mission_attempt: mission.attemptRevision,
      },
    }));
    return {
      contract_version: snapshot.contractVersion,
      status: "ok",
      tool: "inspect_missions",
      request_id: input.requestId,
      scope: this.toolScope(snapshot),
      world_time: snapshot.worldTime,
      missions,
    };
  }

  inspectMissionHistory(input: FullSnapshotInput & {
    readonly requestId: string;
    readonly cursor?: string;
    readonly limit?: number;
  }): InspectMissionHistoryResult {
    const snapshot = this.full(input);
    const limit = input.limit ?? PAGE_TOOL_HISTORY_DEFAULT_LIMIT;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > PAGE_TOOL_HISTORY_MAX_LIMIT) {
      throw new PersistenceError("INVALID_INPUT");
    }
    const afterCursor = input.cursor === undefined
      ? 0
      : this.parseHistoryCursor(input.cursor, input.worldId, snapshot.playerScope.shelterId, input.playerId);
    if (afterCursor > snapshot.worldEventCursor) {
      throw new PersistenceError("STALE_REENTRY_CONTEXT");
    }
    const events = this.store.events(input.worldId)
      .filter((event) => visibleToPlayer(event, input.playerId, snapshot.playerScope.shelterId))
      .filter((event) => event.worldEventCursor > afterCursor);
    const page = events.slice(0, limit).map((event): PageToolHistoryEvent => ({
      event_id: event.eventId,
      event_type: event.eventType,
      world_event_cursor: event.worldEventCursor,
      world_time: event.worldTime,
      aggregate_type: event.aggregateType,
      aggregate_id: event.aggregateId,
    }));
    const last = page.at(-1);
    const hasMore = page.length === limit && events.length > page.length;
    return {
      contract_version: snapshot.contractVersion,
      status: "ok",
      tool: "inspect_mission_history",
      request_id: input.requestId,
      scope: this.toolScope(snapshot),
      world_time: snapshot.worldTime,
      history: {
        cursor: input.cursor ?? null,
        next_cursor: hasMore && last
          ? this.historyCursor(input.worldId, snapshot.playerScope.shelterId, input.playerId, last.world_event_cursor)
          : null,
        events: page,
      },
    };
  }

  private toolScope(snapshot: ClientSnapshot): PageToolScope {
    return {
      world_id: snapshot.worldId,
      player_id: snapshot.playerScope.playerId,
      shelter_id: snapshot.playerScope.shelterId,
    };
  }

  private requiredEntityRevision(snapshot: ClientSnapshot, key: string): number {
    const revision = snapshot.entityRevisions[key];
    if (typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 0) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    return revision as number;
  }

  private requiredMapRevision(values: Map<string, number>, key: string): number {
    const revision = values.get(key);
    if (typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 0) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    return revision as number;
  }

  private continuationSummary(worldId: string, shelterId: string, binding: string): PageToolContinuationSummary | null {
    const slot = this.store.signalSlot(worldId, shelterId, binding);
    if (!slot || (slot.status !== "pending" && slot.status !== "in_flight" && slot.status !== "acknowledged")
      || slot.boundedAction !== "force_recall_soldier") {
      return null;
    }
    return {
      signal_id: slot.signalId,
      status: slot.status,
      bounded_action: "force_recall_soldier",
      cursor_start: slot.cursorStart,
      cursor_end: slot.cursorEnd,
      eligible_event_count: slot.eligibleEventCount,
      event_types: slot.eventTypes.slice(0, 8),
      latest_event_id: slot.latestEventId,
      latest_event_type: slot.latestEventType,
      latest_world_time: slot.latestWorldTime,
    };
  }

  private historyCursor(worldId: string, shelterId: string, playerId: string, worldEventCursor: number): string {
    const scopeDigest = createHash("sha256")
      .update(`${worldId}\u0000${playerId}\u0000${shelterId}`)
      .digest("hex")
      .slice(0, 16);
    return `h1.${worldEventCursor}.${scopeDigest}`;
  }

  private parseHistoryCursor(cursor: string, worldId: string, shelterId: string, playerId: string): number {
    if (typeof cursor !== "string" || !/^h1\.[0-9]+\.[a-f0-9]{16}$/.test(cursor)) {
      throw new PersistenceError("INVALID_INPUT");
    }
    const [, rawCursor, digest] = cursor.split(".");
    const expected = this.historyCursor(worldId, shelterId, playerId, Number(rawCursor)).split(".").at(-1);
    const parsed = Number(rawCursor);
    if (expected !== digest || !Number.isSafeInteger(parsed) || parsed < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    return parsed;
  }
}
