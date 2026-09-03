import type {
  ClientSnapshot,
  ClientSnapshotActor,
  ClientSnapshotMission,
  ClientSnapshotResourceNode,
} from "../server/world-projection";
import type { GridCoordinate, MissionPhase, MissionRole, MissionTool } from "../server/persistence/types";
import type { RealtimeCapability, RealtimeConnectionState } from "./realtime-projection";

export type ProjectionSnapshotStatus = "READY" | "WAITING_FOR_SNAPSHOT" | "STALE" | "INVALID_FRAME";

export interface ProjectionInput {
  snapshot: unknown | null;
  connectionState: RealtimeConnectionState;
  capability: RealtimeCapability;
}

export interface ProjectionViewModel {
  snapshotStatus: ProjectionSnapshotStatus;
  connectionState: RealtimeConnectionState;
  capability: RealtimeCapability;
  statusMessage: string;
  worldTime: number | null;
  player: ClientSnapshot["player"] | null;
  shelter: ClientSnapshot["shelter"] | null;
  map: ClientSnapshot["map"] | null;
  actors: ClientSnapshotActor[];
  resourceNodes: ClientSnapshotResourceNode[];
  missions: ClientSnapshotMission[];
  recentEvents: ClientSnapshot["recentEvents"];
}

export interface AccessibleMissionRow {
  soldierId: string;
  text: string;
}

export interface ProjectionViewport {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type CanvasDrawCommand =
  | { kind: "clear"; color: string }
  | { kind: "tile"; x: number; y: number; explored: boolean; blocked: boolean }
  | { kind: "resource"; resourceNodeId: string; resourceType: "wood" | "rock"; availability: "AVAILABLE" | "DEPLETED"; x: number; y: number }
  | { kind: "route"; missionId: string; points: GridCoordinate[] }
  | { kind: "actor"; actorKind: ClientSnapshotActor["kind"]; entityId: string; x: number; y: number; state: string; role: MissionRole | null; tool: MissionTool | null; cargoCapacityUsed: number };

const MISSION_PHASES: readonly MissionPhase[] = ["AT_SHELTER", "TRAVELLING", "WORKING", "RETURNING", "DEPOSITING", "WAITING_REVIEW", "TERMINAL"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isFiniteCoordinate(value: unknown, width: number, height: number): value is GridCoordinate {
  if (!isRecord(value) || typeof value.x !== "number" || typeof value.y !== "number"
    || !Number.isFinite(value.x) || !Number.isFinite(value.y)) {
    return false;
  }
  return value.x >= 0 && value.x < width && value.y >= 0 && value.y < height;
}

function isIntegerCoordinate(value: unknown, width: number, height: number): value is GridCoordinate {
  return isFiniteCoordinate(value, width, height)
    && Number.isSafeInteger(value.x) && Number.isSafeInteger(value.y);
}

function pointKey(value: GridCoordinate): string {
  return `${value.x},${value.y}`;
}

function uniqueCoordinates(values: unknown[], width: number, height: number, integerOnly: boolean): boolean {
  const keys = new Set<string>();
  for (const value of values) {
    const valid = integerOnly ? isIntegerCoordinate(value, width, height) : isFiniteCoordinate(value, width, height);
    if (!valid) {
      return false;
    }
    const key = pointKey(value as GridCoordinate);
    if (keys.has(key)) {
      return false;
    }
    keys.add(key);
  }
  return true;
}

function isRole(value: unknown): value is MissionRole {
  return value === "GATHERER" || value === "HUNTER" || value === "SIEGE" || value === "GUARD";
}

function isTool(value: unknown): value is MissionTool {
  return value === "AXE" || value === "PICKAXE" || value === "SWORD" || value === "HAMMER" || value === "SIEGE_KIT";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isNullableInteger(value: unknown): value is number | null {
  return value === null || isNonNegativeInteger(value);
}

function validRoute(value: unknown, width: number, height: number): value is ClientSnapshotMission["route"] {
  if (value === null) {
    return true;
  }
  if (!isRecord(value) || !isIntegerCoordinate(value.source, width, height)
    || !isIntegerCoordinate(value.target, width, height)
    || !isNonEmptyString(value.walkabilityVersion)
    || value.status !== "PLANNED"
    || !isNonNegativeInteger(value.estimatedTravelWorldSeconds)
    || !Array.isArray(value.waypoints) || value.waypoints.length === 0
    || !uniqueCoordinates(value.waypoints, width, height, true)) {
    return false;
  }
  const first = value.waypoints[0];
  const last = value.waypoints.at(-1);
  if (!isIntegerCoordinate(first, width, height) || !isIntegerCoordinate(last, width, height)
    || !isIntegerCoordinate(value.source, width, height) || !isIntegerCoordinate(value.target, width, height)
    || first.x !== value.source.x || first.y !== value.source.y
    || last.x !== value.target.x || last.y !== value.target.y) {
    return false;
  }
  for (let index = 1; index < value.waypoints.length; index += 1) {
    const previous = value.waypoints[index - 1];
    const current = value.waypoints[index];
    if (!isIntegerCoordinate(previous, width, height) || !isIntegerCoordinate(current, width, height)
      || Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y) !== 1) {
      return false;
    }
  }
  return true;
}

function validCargo(value: unknown): boolean {
  if (!isRecord(value) || !isNonNegativeInteger(value.quantity) || !isNonNegativeInteger(value.capacityUsed)
    || value.capacity !== 5 || value.quantity !== value.capacityUsed || value.capacityUsed > value.capacity
    || !Array.isArray(value.resourceTypes) || !value.resourceTypes.every((resourceType) => resourceType === "wood" || resourceType === "rock")
    || [...new Set(value.resourceTypes)].length !== value.resourceTypes.length) {
    return false;
  }
  return true;
}

function validEncounter(value: unknown, width: number, height: number, worldTime: number): boolean {
  if (value === null) {
    return true;
  }
  if (!isRecord(value) || !isNonEmptyString(value.encounterId) || !isNonEmptyString(value.monsterId)
    || (value.state !== "LOCKED" && value.state !== "RESOLVING" && value.state !== "RESOLVED")
    || !isNonNegativeInteger(value.soldierHp) || !isNonNegativeInteger(value.monsterHp)
    || !isNonNegativeInteger(value.roundNumber) || !isNonNegativeInteger(value.contactWorldTime)
    || value.contactWorldTime > worldTime || !isIntegerCoordinate(value.engagementPosition, width, height)
    || !isNullableInteger(value.nextDueWorldTime) || (value.nextDueWorldTime !== null && value.nextDueWorldTime < worldTime)
    || (value.terminalCause !== null && value.terminalCause !== "GATHERER_LOST" && value.terminalCause !== "MONSTER_DEFEATED")
    || !isNonNegativeInteger(value.revision)) {
    return false;
  }
  return true;
}

function validMission(value: unknown, width: number, height: number, worldTime: number): value is ClientSnapshotMission {
  if (!isRecord(value) || !isNullableString(value.missionId) || !isNonEmptyString(value.soldierId)
    || !isNonEmptyString(value.soldierState) || !isNullableString(value.missionState)
    || !isNullableString(value.missionAttemptId) || !isNullableInteger(value.attemptRevision)
    || typeof value.phase !== "string" || !MISSION_PHASES.includes(value.phase as MissionPhase)
    || (value.role !== null && !isRole(value.role)) || (value.tool !== null && !isTool(value.tool))
    || (value.equipmentTier !== null && !isNonNegativeInteger(value.equipmentTier))
    || !isNullableString(value.targetId)
    || (value.returnPolicy !== null && value.returnPolicy !== "WHEN_FULL" && value.returnPolicy !== "ON_TARGET_DEPLETED" && value.returnPolicy !== "ON_RECALL")
    || !validRoute(value.route, width, height)
    || !isFiniteCoordinate(value.position, width, height)
    || !isNullableInteger(value.nextDueWorldTime)
    || (value.nextDueWorldTime !== null && value.nextDueWorldTime < worldTime)
    || !validCargo(value.cargo) || !validEncounter(value.encounter, width, height, worldTime)
    || !isRecord(value.reissue) || (value.reissue.budget !== 0 && value.reissue.budget !== 1)
    || (value.reissue.dangerCell !== null && !isIntegerCoordinate(value.reissue.dangerCell, width, height))
    || (value.reissue.waitingReviewReason !== null && value.reissue.waitingReviewReason !== "NO_SAFE_REISSUE_ROUTE" && value.reissue.waitingReviewReason !== "REPEATED_MONSTER_DEATH")
    || (value.nextAction !== "DISPATCH" && value.nextAction !== "MONITOR" && value.nextAction !== "DEPOSIT" && value.nextAction !== "REVIEW")
    || !isNonNegativeInteger(value.revision)) {
    return false;
  }
  const missionId = value.missionId;
  const missionState = value.missionState;
  const cargo = value.cargo as ClientSnapshotMission["cargo"];
  const encounter = value.encounter as ClientSnapshotMission["encounter"];
  const reissue = value.reissue as ClientSnapshotMission["reissue"];
  const activePhase = value.phase === "TRAVELLING" || value.phase === "WORKING"
    || value.phase === "RETURNING" || value.phase === "DEPOSITING";
  if (missionId === null) {
    return value.phase === "AT_SHELTER" && missionState === null
      && value.missionAttemptId === null && value.attemptRevision === null
      && value.role === null && value.tool === null && value.targetId === null
      && value.returnPolicy === null && value.route === null && value.encounter === null
      && value.nextDueWorldTime === null && reissue.budget === 1
      && reissue.dangerCell === null && reissue.waitingReviewReason === null
      && value.nextAction === "DISPATCH" && value.soldierState === "AT_SHELTER"
      && cargo.quantity === 0 && cargo.capacityUsed === 0;
  }
  if (value.phase === "WAITING_REVIEW") {
    return missionState === "COMPLETED" && value.soldierState === "AT_SHELTER"
      && value.missionAttemptId !== null && value.attemptRevision !== null
      && value.role === "GATHERER" && (value.tool === "AXE" || value.tool === "PICKAXE")
      && value.targetId !== null && value.returnPolicy !== null && value.route !== null
      && value.nextDueWorldTime === null && encounter !== null
      && encounter.state === "RESOLVED" && encounter.terminalCause === "GATHERER_LOST"
      && reissue.budget === 0 && reissue.waitingReviewReason !== null
      && value.nextAction === "REVIEW";
  }
  if (value.phase === "AT_SHELTER") {
    return missionState === "COMPLETED" && value.soldierState === "AT_SHELTER"
      && value.missionAttemptId !== null && value.attemptRevision !== null
      && value.role === null && value.tool === null && value.targetId === null
      && value.returnPolicy === null && value.route === null && value.encounter === null
      && value.nextDueWorldTime === null && reissue.budget === 1
      && reissue.dangerCell === null && reissue.waitingReviewReason === null
      && value.nextAction === "DISPATCH" && cargo.quantity === 0
      && cargo.capacityUsed === 0;
  }
  if (activePhase) {
    return missionState === "ACTIVE" && value.soldierState === "FIELD"
      && value.missionAttemptId !== null && value.attemptRevision !== null
      && value.role !== null && value.tool !== null && value.targetId !== null
      && value.returnPolicy !== null && value.route !== null
      && reissue.waitingReviewReason === null
      && value.nextAction === (value.phase === "DEPOSITING" ? "DEPOSIT" : "MONITOR");
  }
  return false;
}

function validActor(value: unknown, width: number, height: number): value is ClientSnapshotActor {
  if (!isRecord(value) || (value.kind !== "player" && value.kind !== "shelter" && value.kind !== "soldier" && value.kind !== "monster")
    || !isFiniteCoordinate(value.position, width, height) || !isNonNegativeInteger(value.revision)) {
    return false;
  }
  if (value.kind === "player") {
    return isNonEmptyString(value.playerId);
  }
  if (value.kind === "shelter") {
    return isNonEmptyString(value.shelterId) && isNonEmptyString(value.playerId);
  }
  if (value.kind === "soldier") {
    return isNonEmptyString(value.soldierId) && isNonEmptyString(value.shelterId)
      && isNullableString(value.missionId) && isNonEmptyString(value.state)
      && (value.phase === null || value.phase === undefined || (typeof value.phase === "string" && MISSION_PHASES.includes(value.phase as MissionPhase)))
      && (value.role === null || value.role === undefined || isRole(value.role))
      && (value.tool === null || value.tool === undefined || isTool(value.tool))
      && (value.cargoCapacityUsed === undefined || (isNonNegativeInteger(value.cargoCapacityUsed) && value.cargoCapacityUsed <= 5));
  }
  return isNonEmptyString(value.monsterId) && isNonEmptyString(value.encounterId) && isNonEmptyString(value.state);
}

/**
 * Strictly checks the transport shape before the browser stores or renders it.
 * This is a trust boundary, not a gameplay validator; it never mutates state.
 */
export function isRenderableClientSnapshot(value: unknown): value is ClientSnapshot {
  if (!isRecord(value) || value.full !== true || value.baseClientSnapshotId !== null
    || !isNonEmptyString(value.clientSnapshotId) || !isNonEmptyString(value.contractVersion)
    || !isNonEmptyString(value.worldId) || !isNonNegativeInteger(value.worldTime)
    || !isRecord(value.playerScope) || !isNonEmptyString(value.playerScope.playerId)
    || !isNonEmptyString(value.playerScope.shelterId) || !isNonNegativeInteger(value.worldEventCursor)
    || !isRecord(value.map) || !isNonNegativeInteger(value.map.width) || value.map.width <= 0
    || !isNonNegativeInteger(value.map.height) || value.map.height <= 0
    || value.map.width > 512 || value.map.height > 512 || !isNonEmptyString(value.map.generationVersion)
    || !Array.isArray(value.map.blockedCells) || !uniqueCoordinates(value.map.blockedCells, value.map.width, value.map.height, true)
    || !isRecord(value.player) || value.player.playerId !== value.playerScope.playerId
    || !isFiniteCoordinate(value.player.position, value.map.width, value.map.height)
    || !isNonNegativeInteger(value.player.revision) || !Array.isArray(value.player.exploredCells)
    || !uniqueCoordinates(value.player.exploredCells, value.map.width, value.map.height, true)
    || !isRecord(value.shelter) || value.shelter.playerId !== value.playerScope.playerId
    || value.shelter.shelterId !== value.playerScope.shelterId
    || !isNonNegativeInteger(value.shelter.revision) || !isNonNegativeInteger(value.shelter.coins)
    || !Array.isArray(value.soldiers) || !Array.isArray(value.resourceNodes)
    || !Array.isArray(value.missions) || !Array.isArray(value.visibleActors) || !Array.isArray(value.recentEvents)
    || !isRecord(value.entityRevisions)) {
    return false;
  }
  const playerScope = value.playerScope as Record<string, unknown>;
  const width = value.map.width;
  const height = value.map.height;
  const worldTime = value.worldTime;
  const exploredKeys = new Set((value.player.exploredCells as unknown[]).map((cell) => pointKey(cell as GridCoordinate)));
  if (value.map.blockedCells.some((cell) => !exploredKeys.has(pointKey(cell as GridCoordinate)))) {
    return false;
  }
  if (!value.soldiers.every((soldier) => isRecord(soldier)
    && isNonEmptyString(soldier.soldierId) && soldier.shelterId === playerScope.shelterId
    && isNonEmptyString(soldier.state) && isNullableString(soldier.role) && (soldier.role === null || isRole(soldier.role))
    && isNullableString(soldier.tool) && (soldier.tool === null || isTool(soldier.tool))
    && isFiniteCoordinate(soldier.position, width, height) && isNullableString(soldier.missionId)
    && (soldier.phase === null || (typeof soldier.phase === "string" && MISSION_PHASES.includes(soldier.phase as MissionPhase)))
    && isNonNegativeInteger(soldier.cargoCapacityUsed) && soldier.cargoCapacityUsed <= 5
    && isNonNegativeInteger(soldier.revision))) {
    return false;
  }
  if (new Set(value.soldiers.map((soldier) => (soldier as unknown as Record<string, unknown>).soldierId)).size !== value.soldiers.length
    || !value.resourceNodes.every((node) => isRecord(node)
      && isNonEmptyString(node.resourceNodeId) && (node.resourceType === "wood" || node.resourceType === "rock")
      && isIntegerCoordinate(node.position, width, height)
      && (node.availability === "AVAILABLE" || node.availability === "DEPLETED")
      && isNonNegativeInteger(node.observedWorldTime) && node.observedWorldTime <= worldTime
      && isNonNegativeInteger(node.revision) && !("quantity" in node))
    || new Set(value.resourceNodes.map((node) => (node as unknown as Record<string, unknown>).resourceNodeId)).size !== value.resourceNodes.length
    || !value.missions.every((mission) => validMission(mission, width, height, worldTime))) {
    return false;
  }
  const soldierIds = new Set(value.soldiers.map((soldier) => (soldier as unknown as Record<string, unknown>).soldierId));
  const missions = value.missions as ClientSnapshotMission[];
  if (new Set(missions.map((mission) => mission.soldierId)).size !== missions.length
    || missions.some((mission) => !soldierIds.has(mission.soldierId))
    || !value.visibleActors.every((actor) => validActor(actor, width, height))
    || !value.recentEvents.every((event) => isRecord(event)
      && isNonEmptyString(event.eventId) && isNonEmptyString(event.eventType)
      && isNonNegativeInteger(event.worldEventCursor) && isNonNegativeInteger(event.worldTime)
      && event.worldTime <= worldTime && isNonEmptyString(event.aggregateType) && isNonEmptyString(event.aggregateId))
    || new Set(value.recentEvents.map((event) => (event as unknown as Record<string, unknown>).eventId)).size !== value.recentEvents.length) {
    return false;
  }
  const actors = value.visibleActors as ClientSnapshotActor[];
  if (actors.some((actor) => actor.kind === "soldier"
    && (actor.shelterId !== playerScope.shelterId || !soldierIds.has(actor.soldierId)))) {
    return false;
  }
  for (const [key, revision] of Object.entries(value.entityRevisions)) {
    if (!isNonEmptyString(key) || !isNonNegativeInteger(revision)) {
      return false;
    }
  }
  return true;
}

function statusFor(input: ProjectionInput, snapshot: ClientSnapshot | null): ProjectionSnapshotStatus {
  if (!snapshot) {
    return input.connectionState === "STALE" ? "STALE" : "WAITING_FOR_SNAPSHOT";
  }
  return input.connectionState === "READY" ? "READY" : "STALE";
}

function statusMessage(status: ProjectionSnapshotStatus, input: ProjectionInput, snapshot: ClientSnapshot | null): string {
  if (status === "INVALID_FRAME") {
    return "The server snapshot is invalid; waiting for a full replacement.";
  }
  if (status === "WAITING_FOR_SNAPSHOT") {
    if (input.connectionState === "CLOSED") {
      return "Realtime connection is closed; reconnect to request a server snapshot. No game state is assumed.";
    }
    return "Waiting for a server snapshot. No game state is assumed.";
  }
  if (status === "STALE") {
    if (!snapshot) {
      return input.connectionState === "CONNECTING"
        ? "Reconnecting to the server; no accepted snapshot is available yet."
        : "Realtime connection is stale; reconnect to request a full snapshot. No game state is assumed.";
    }
    if (input.connectionState === "CONNECTING") {
      return "Reconnecting to the server; the last snapshot remains readable until a full replacement arrives.";
    }
    return "The last server snapshot is stale; reconnect to request a full replacement.";
  }
  const capability = input.capability === "unsupported" ? " Realtime capability unavailable; human controls remain available." : "";
  return `Authoritative server snapshot at world time ${snapshot?.worldTime ?? 0}.${capability}`;
}

export function buildProjectionViewModel(input: ProjectionInput): ProjectionViewModel {
  const snapshot = input.snapshot !== null && isRenderableClientSnapshot(input.snapshot)
    ? input.snapshot
    : null;
  const invalid = input.snapshot !== null && snapshot === null;
  const snapshotStatus: ProjectionSnapshotStatus = invalid ? "INVALID_FRAME" : statusFor(input, snapshot);
  return {
    snapshotStatus,
    connectionState: input.connectionState,
    capability: input.capability,
    statusMessage: statusMessage(snapshotStatus, input, snapshot),
    worldTime: snapshotStatus === "INVALID_FRAME" || !snapshot ? null : snapshot.worldTime,
    player: snapshotStatus === "INVALID_FRAME" || !snapshot ? null : snapshot.player,
    shelter: snapshotStatus === "INVALID_FRAME" || !snapshot ? null : snapshot.shelter,
    map: snapshotStatus === "INVALID_FRAME" || !snapshot ? null : snapshot.map,
    actors: snapshotStatus === "INVALID_FRAME" || !snapshot ? [] : snapshot.visibleActors,
    resourceNodes: snapshotStatus === "INVALID_FRAME" || !snapshot ? [] : snapshot.resourceNodes,
    missions: snapshotStatus === "INVALID_FRAME" || !snapshot ? [] : snapshot.missions,
    recentEvents: snapshotStatus === "INVALID_FRAME" || !snapshot ? [] : snapshot.recentEvents,
  };
}

export function buildAccessibleMissionRows(view: ProjectionViewModel): AccessibleMissionRow[] {
  return view.missions.map((mission) => {
    const role = mission.role ?? "UNASSIGNED";
    const tool = mission.tool ?? "NONE";
    const cargo = `${mission.cargo.quantity}/${mission.cargo.capacity}`;
    const risk = mission.cargo.capacityUsed > 0 ? "cargo at risk" : "no exposed cargo";
    const cause = mission.encounter?.terminalCause ? `; cause ${mission.encounter.terminalCause}` : "";
    const review = mission.reissue.waitingReviewReason ? `; review ${mission.reissue.waitingReviewReason}` : "";
    return {
      soldierId: mission.soldierId,
      text: `${mission.soldierId}: ${mission.phase}; role ${role}; tool ${tool}; target ${mission.targetId ?? "NONE"}; cargo ${cargo} (${risk}); next ${mission.nextAction}${cause}${review}`,
    };
  });
}

export function getProjectionViewport(view: ProjectionViewModel): ProjectionViewport | null {
  if (!view.map || !view.player) {
    return null;
  }
  const width = Math.min(32, view.map.width);
  const height = Math.min(20, view.map.height);
  const centerX = Math.floor(view.player.position.x);
  const centerY = Math.floor(view.player.position.y);
  const left = Math.max(0, Math.min(view.map.width - width, centerX - Math.floor(width / 2)));
  const top = Math.max(0, Math.min(view.map.height - height, centerY - Math.floor(height / 2)));
  return { left, top, width, height };
}

export function buildCanvasDrawCommands(view: ProjectionViewModel): CanvasDrawCommand[] {
  const viewport = getProjectionViewport(view);
  if (!viewport || !view.player || !view.map) {
    return [];
  }
  const explored = new Set(view.player.exploredCells.map(pointKey));
  const blocked = new Set(view.map.blockedCells.map(pointKey));
  const commands: CanvasDrawCommand[] = [{ kind: "clear", color: "#08130f" }];
  for (let y = viewport.top; y < viewport.top + viewport.height; y += 1) {
    for (let x = viewport.left; x < viewport.left + viewport.width; x += 1) {
      const key = `${x},${y}`;
      commands.push({ kind: "tile", x, y, explored: explored.has(key), blocked: blocked.has(key) });
    }
  }
  for (const node of [...view.resourceNodes].sort((left, right) => left.resourceNodeId.localeCompare(right.resourceNodeId))) {
    if (node.position.x >= viewport.left && node.position.x < viewport.left + viewport.width
      && node.position.y >= viewport.top && node.position.y < viewport.top + viewport.height) {
      commands.push({ kind: "resource", resourceNodeId: node.resourceNodeId, resourceType: node.resourceType, availability: node.availability, x: node.position.x, y: node.position.y });
    }
  }
  for (const mission of [...view.missions].sort((left, right) => left.soldierId.localeCompare(right.soldierId))) {
    if (mission.missionId && mission.route && mission.phase !== "AT_SHELTER") {
      commands.push({ kind: "route", missionId: mission.missionId, points: mission.route.waypoints.map((point) => ({ ...point })) });
    }
  }
  const actorOrder: Record<ClientSnapshotActor["kind"], number> = { shelter: 0, player: 1, soldier: 2, monster: 3 };
  for (const actor of [...view.actors].sort((left, right) => actorOrder[left.kind] - actorOrder[right.kind]
    || (left.soldierId ?? left.monsterId ?? left.shelterId ?? left.playerId ?? "").localeCompare(right.soldierId ?? right.monsterId ?? right.shelterId ?? right.playerId ?? ""))) {
    const entityId = actor.soldierId ?? actor.monsterId ?? actor.shelterId ?? actor.playerId;
    if (!entityId) {
      continue;
    }
    commands.push({
      kind: "actor",
      actorKind: actor.kind,
      entityId,
      x: actor.position.x,
      y: actor.position.y,
      state: actor.state ?? "VISIBLE",
      role: actor.role ?? null,
      tool: actor.tool ?? null,
      cargoCapacityUsed: actor.cargoCapacityUsed ?? 0,
    });
  }
  return commands;
}
