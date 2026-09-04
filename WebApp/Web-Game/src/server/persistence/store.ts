import { DatabaseSync, type StatementSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { classifyPersistenceError, isPersistenceErrorCode, PersistenceError, type PersistenceErrorCode } from "./errors";
import { canonicalJson, parseJson } from "./json";
import { SCHEMA_SQL } from "./schema";
import { resolveMonsterGathererRound, resolveMonsterHunterRound } from "../combat-rules";
import {
  CURRENT_EVENT_VERSION,
  CURRENT_MIGRATION_ID,
  CURRENT_SCHEMA_VERSION,
  CURRENT_SNAPSHOT_VERSION,
  DEFAULT_CONTRACT_VERSION,
  type CommitMissionDepositInput,
  type CommitMissionDepositResult,
  type CommitMissionDispatchInput,
  type CommitMissionDispatchResult,
  type CommitMissionExtractionInput,
  type CommitMissionExtractionResult,
  type CommitMissionHomeArrivalInput,
  type CommitMissionHomeArrivalResult,
  type CommitMissionRecallInput,
  type CommitMissionRecallResult,
  type CommitMissionTargetDepletedReturnInput,
  type CommitMissionTargetDepletedReturnResult,
  type CommitMonsterContactInput,
  type CommitMonsterContactResult,
  type CommitMonsterCombatRoundInput,
  type CommitMonsterCombatRoundResult,
  type CommitTransitionInput,
  type CommitTransitionResult,
  type CreateMonsterInput,
  type CreatePlayerInput,
  type CreateResourceNodeInput,
  type CreateShelterInput,
  type CreateSoldierInput,
  type CreateWorldInput,
  type CreateWorldFixtureInput,
  type CreateWorldFixtureResult,
  type CargoRecord,
  type DeliveryAckInput,
  type DeliveryClaimInput,
  type DeliveryResult,
  type DomainEventInput,
  type EntityType,
  type GridCoordinate,
  type IdempotencyInput,
  type IdempotencyRecord,
  type OutboxDeliveryRecord,
  type ReentryEventContext,
  type ReentryEventContextInput,
  type PersistedDomainEvent,
  type PersistenceStoreOptions,
  type PlayerRecord,
  type RecoveryResult,
  type SchemaMetadata,
  type SignalEligibilityInput,
  type SignalSeverity,
  type SignalSlotRecord,
  type SnapshotInput,
  type ShelterRecord,
  type SoldierRecord,
  type ResourceNodeRecord,
  type MonsterRecord,
  type EncounterRecord,
  type EncounterState,
  type EncounterTerminalCause,
  type CombatRoundResolution,
  type HunterCombatRoundResolution,
  type MonsterCombatRoundResolution,
  type MissionAttemptRecord,
  type MissionPhase,
  type MissionRecord,
  type MissionReturnPolicy,
  type MissionRole,
  type MissionRoutePlan,
  type MissionRoutePosition,
  type MissionTool,
  type ReissueReviewReason,
  type MonsterReissuePlan,
  type StateMutationInput,
  type WorldRecord,
  type WorldSnapshotRecord,
} from "./types";

type SqlValue = string | number | bigint | Uint8Array | null;
type Row = Record<string, unknown>;

export function deterministicCargoId(worldId: string, missionAttemptId: string, resourceNodeId: string): string {
  if (worldId.trim() === "" || missionAttemptId.trim() === "" || resourceNodeId.trim() === "") {
    throw new PersistenceError("INVALID_INPUT");
  }
  const digest = createHash("sha256")
    .update(`${worldId}\u0000${missionAttemptId}\u0000${resourceNodeId}`)
    .digest("hex")
    .slice(0, 24);
  return `cargo-${digest}`;
}

interface EntityDefinition {
  table: string;
  keyColumn: string;
  mutableColumns: readonly string[];
}

const ENTITY_DEFINITIONS: Record<EntityType, EntityDefinition> = {
  world: {
    table: "world",
    keyColumn: "world_id",
    mutableColumns: ["world_seed", "generation_version", "map_fingerprint"],
  },
  player: { table: "player", keyColumn: "player_id", mutableColumns: ["binding", "position_x", "position_y", "explored_cells_json"] },
  shelter: { table: "shelter", keyColumn: "shelter_id", mutableColumns: ["coins"] },
  soldier: {
    table: "soldier",
    keyColumn: "soldier_id",
    mutableColumns: ["shelter_id", "state", "role", "tool", "work_id", "next_due_world_time", "claim_id", "claim_attempt", "lease_expires_at_wall_ms"],
  },
  mission: {
    table: "mission",
    keyColumn: "mission_id",
    mutableColumns: ["soldier_id", "state", "phase", "role", "tool", "target_id", "return_policy", "active_attempt_id", "encounter_id", "encounter_status", "monster_reissue_budget", "danger_cell_json", "waiting_review_reason", "work_id", "next_due_world_time", "claim_id", "claim_attempt", "lease_expires_at_wall_ms"],
  },
  mission_attempt: {
    table: "mission_attempt",
    keyColumn: "mission_attempt_id",
    mutableColumns: ["mission_id", "state", "phase", "role", "tool", "equipment_tier", "target_id", "route_json", "home_anchor_json", "return_policy", "encounter_id", "encounter_status", "terminal_cause", "start_world_time", "last_transition_world_time", "work_id", "next_due_world_time", "claim_id", "claim_attempt", "lease_expires_at_wall_ms"],
  },
  cargo: { table: "cargo", keyColumn: "cargo_id", mutableColumns: ["soldier_id", "resource_type", "quantity", "capacity_used"] },
  resource_node: {
    table: "resource_node",
    keyColumn: "resource_node_id",
    mutableColumns: ["resource_type", "quantity", "work_id", "next_due_world_time", "claim_id", "claim_attempt", "lease_expires_at_wall_ms"],
  },
  monster: {
    table: "monster",
    keyColumn: "monster_id",
    mutableColumns: ["state", "work_id", "next_due_world_time", "claim_id", "claim_attempt", "lease_expires_at_wall_ms"],
  },
  encounter: {
    table: "encounter",
    keyColumn: "encounter_id",
    mutableColumns: ["state", "soldier_hp", "monster_hp", "round_number", "terminal_cause", "work_id", "next_due_world_time", "claim_id", "claim_attempt", "lease_expires_at_wall_ms"],
  },
};

const SEVERITY_RANK: Record<SignalSeverity, number> = { info: 1, warning: 2, critical: 3 };
const REQUIRED_TABLE_COLUMNS: Record<string, readonly string[]> = {
  world: ["world_id", "world_time", "in_progress_world_time", "server_time_anchor_ms", "world_event_cursor", "world_seed", "generation_version", "map_fingerprint", "revision"],
  player: ["world_id", "player_id", "binding", "revision", "position_x", "position_y", "explored_cells_json"],
  shelter: ["world_id", "shelter_id", "player_id", "revision", "coins"],
  soldier: ["world_id", "soldier_id", "shelter_id", "revision", "work_id", "next_due_world_time", "claim_id", "claim_attempt", "lease_expires_at_wall_ms"],
  mission: ["world_id", "mission_id", "soldier_id", "phase", "tool", "return_policy", "active_attempt_id", "encounter_id", "encounter_status", "monster_reissue_budget", "danger_cell_json", "waiting_review_reason", "revision", "work_id", "next_due_world_time", "claim_id", "claim_attempt", "lease_expires_at_wall_ms"],
  mission_attempt: ["world_id", "mission_attempt_id", "mission_id", "phase", "role", "tool", "equipment_tier", "target_id", "route_json", "home_anchor_json", "return_policy", "encounter_id", "encounter_status", "terminal_cause", "start_world_time", "last_transition_world_time", "revision", "work_id", "next_due_world_time", "claim_id", "claim_attempt", "lease_expires_at_wall_ms"],
  cargo: ["world_id", "cargo_id", "soldier_id", "mission_attempt_id", "source_node_id", "resource_type", "quantity", "acquired_world_time", "capacity_used", "revision"],
  resource_node: ["world_id", "resource_node_id", "resource_type", "quantity", "revision", "work_id", "next_due_world_time", "claim_id", "claim_attempt", "lease_expires_at_wall_ms"],
  monster: ["world_id", "monster_id", "state", "revision", "work_id", "next_due_world_time", "claim_id", "claim_attempt", "lease_expires_at_wall_ms"],
  encounter: ["world_id", "encounter_id", "state", "mission_id", "mission_attempt_id", "soldier_id", "monster_id", "soldier_hp", "monster_hp", "round_number", "contact_world_time", "engagement_x", "engagement_y", "terminal_cause", "revision", "work_id", "next_due_world_time", "claim_id", "claim_attempt", "lease_expires_at_wall_ms"],
  world_snapshot: ["world_snapshot_id", "world_id", "snapshot_version", "contract_version", "world_time", "last_world_event_cursor", "entity_revisions_json", "state_json", "state_hash"],
  domain_event: ["event_id", "event_version", "contract_version", "event_type", "world_id", "world_event_cursor", "world_time", "causation_id", "idempotency_key", "aggregate_type", "aggregate_id", "aggregate_revision", "visibility_scope_json", "typed_payload_json", "affected_entity_revisions_json"],
  idempotency_record: ["world_id", "idempotency_key", "binding", "request_fingerprint", "contract_version", "outcome", "result_json", "event_ids_json"],
  agent_signal_slot: ["world_id", "shelter_id", "opaque_binding", "signal_id", "grant_id", "bounded_action", "status", "cursor_start", "cursor_end", "eligible_event_count", "event_types_json", "severity", "latest_event_id", "latest_event_type", "latest_world_time", "deferred_cursor_start", "deferred_cursor_end", "deferred_eligible_event_count", "deferred_event_types_json", "deferred_severity", "deferred_latest_event_id", "deferred_latest_event_type", "deferred_latest_world_time", "cooldown_until_world_time", "lease_id", "lease_expires_at_wall_ms", "attempt_count", "last_error_code"],
  outbox_delivery: ["delivery_id", "world_id", "shelter_id", "opaque_binding", "signal_id", "status", "attempt_count", "lease_id", "lease_expires_at_wall_ms", "last_outcome"],
  reentry_binding_sequence: ["world_id", "opaque_binding", "next_event_sequence", "created_at", "updated_at"],
  reentry_event_context: ["world_id", "signal_id", "opaque_binding", "event_sequence", "occurred_at", "state_version", "created_at"],
  schema_meta: ["schema_meta_id", "schema_version", "contract_version", "supported_event_version", "supported_snapshot_version", "migration_id"],
};
const RECORDABLE_COMMAND_REJECTIONS = new Set<PersistenceErrorCode>([
  "WORLD_TIME_REGRESSION",
  "STALE_REVISION",
  "ENTITY_NOT_FOUND",
  "OWNERSHIP_DENIED",
  "MOVEMENT_BLOCKED",
  "ROLE_LOCKED",
  "NOT_AT_SHELTER",
  "TARGET_UNAVAILABLE",
  "CARGO_FULL",
  "TOOL_INCOMPATIBLE",
  "MISSION_ACTIVE",
  "ROLE_UNAVAILABLE",
  "ALREADY_AT_SHELTER",
  "IN_COMBAT",
]);

function sqlValue(value: unknown): SqlValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "bigint" || value instanceof Uint8Array) {
    return value;
  }
  throw new PersistenceError("INVALID_INPUT");
}

function rowOf<T extends Row = Row>(value: unknown): T | null {
  return value && typeof value === "object" ? (value as T) : null;
}

function requiredString(row: Row, key: string): string {
  const value = row[key];
  if (typeof value !== "string") {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return value;
}

function requiredNumber(row: Row, key: string): number {
  const value = row[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return value;
}

function requiredInteger(row: Row, key: string): number {
  const value = requiredNumber(row, key);
  if (!Number.isSafeInteger(value)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return value;
}

function optionalInteger(row: Row, key: string): number | null {
  const value = row[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return value;
}

function validateCoordinate(value: unknown, code: "INVALID_INPUT" | "RECOVERY_REQUIRED"): GridCoordinate {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PersistenceError(code);
  }
  const point = value as { x?: unknown; y?: unknown };
  if (!Number.isSafeInteger(point.x) || !Number.isSafeInteger(point.y)) {
    throw new PersistenceError(code);
  }
  return { x: point.x as number, y: point.y as number };
}

function isMissionPhase(value: unknown): value is MissionPhase {
  return value === "AT_SHELTER" || value === "TRAVELLING" || value === "WORKING" || value === "RETURNING"
    || value === "DEPOSITING" || value === "WAITING_REVIEW" || value === "TERMINAL";
}

function isMissionRole(value: unknown): value is MissionRole {
  return value === "GATHERER" || value === "HUNTER" || value === "SIEGE" || value === "GUARD";
}

function isMissionTool(value: unknown): value is MissionTool {
  return value === "AXE" || value === "PICKAXE" || value === "SWORD" || value === "HAMMER" || value === "SIEGE_KIT";
}

function isMissionReturnPolicy(value: unknown): value is MissionReturnPolicy {
  return value === "WHEN_FULL" || value === "ON_TARGET_DEPLETED" || value === "ON_RECALL";
}

function isEncounterState(value: unknown): value is EncounterState {
  return value === "LOCKED" || value === "RESOLVING" || value === "RESOLVED";
}

function isEncounterTerminalCause(value: unknown): value is EncounterTerminalCause {
  return value === "GATHERER_LOST" || value === "MONSTER_DEFEATED";
}

function isReissueReviewReason(value: unknown): value is ReissueReviewReason {
  return value === "NO_SAFE_REISSUE_ROUTE" || value === "REPEATED_MONSTER_DEATH";
}

function optionalString(row: Row, key: string): string | null {
  const value = row[key];
  if (value === null || typeof value === "string") {
    return value;
  }
  throw new PersistenceError("RECOVERY_REQUIRED");
}

function optionalMissionPhase(row: Row, key: string): MissionPhase {
  const value = row[key];
  if (!isMissionPhase(value)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return value;
}

function optionalMissionRole(row: Row, key: string): MissionRole | null {
  const value = row[key];
  if (value === null) {
    return null;
  }
  if (!isMissionRole(value)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return value;
}

function optionalMissionTool(row: Row, key: string): MissionTool | null {
  const value = row[key];
  if (value === null) {
    return null;
  }
  if (!isMissionTool(value)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return value;
}

function optionalMissionReturnPolicy(row: Row, key: string): MissionReturnPolicy | null {
  const value = row[key];
  if (value === null) {
    return null;
  }
  if (!isMissionReturnPolicy(value)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return value;
}

function optionalEncounterState(row: Row, key: string): EncounterState | null {
  const value = row[key];
  if (value === null) {
    return null;
  }
  if (!isEncounterState(value)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return value;
}

function missionReissueBudgetFromRow(row: Row, key = "monster_reissue_budget"): 0 | 1 {
  const value = row[key];
  if (value === 0 || value === 1) {
    return value;
  }
  throw new PersistenceError("RECOVERY_REQUIRED");
}

function optionalReviewReason(row: Row, key: string): ReissueReviewReason | null {
  const value = row[key];
  if (value === null) {
    return null;
  }
  if (!isReissueReviewReason(value)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return value;
}

function optionalTerminalCause(row: Row, key: string): EncounterTerminalCause | null {
  const value = row[key];
  if (value === null) {
    return null;
  }
  if (!isEncounterTerminalCause(value)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return value;
}

function routeFromValue(value: unknown, code: "INVALID_INPUT" | "RECOVERY_REQUIRED"): MissionRoutePlan {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PersistenceError(code);
  }
  const route = value as Record<string, unknown>;
  const source = validateCoordinate(route.source, code);
  const target = validateCoordinate(route.target, code);
  if (typeof route.walkabilityVersion !== "string" || route.walkabilityVersion.trim() === "" || !Array.isArray(route.waypoints)
    || route.waypoints.length === 0
    || !route.waypoints.every((point) => {
      try {
        validateCoordinate(point, code);
        return true;
      } catch {
        return false;
      }
    }) || !Number.isSafeInteger(route.estimatedTravelWorldSeconds) || (route.estimatedTravelWorldSeconds as number) < 0
    || route.status !== "PLANNED") {
    throw new PersistenceError(code);
  }
  const waypoints = (route.waypoints as unknown[]).map((point) => validateCoordinate(point, code));
  const same = (left: GridCoordinate, right: GridCoordinate): boolean => left.x === right.x && left.y === right.y;
  if (!same(waypoints[0] as GridCoordinate, source) || !same(waypoints[waypoints.length - 1] as GridCoordinate, target)) {
    throw new PersistenceError(code);
  }
  for (let index = 1; index < waypoints.length; index += 1) {
    const step = Math.abs(waypoints[index]!.x - waypoints[index - 1]!.x) + Math.abs(waypoints[index]!.y - waypoints[index - 1]!.y);
    if (step !== 1) {
      throw new PersistenceError(code);
    }
  }
  return {
    source,
    target,
    walkabilityVersion: route.walkabilityVersion,
    waypoints,
    estimatedTravelWorldSeconds: route.estimatedTravelWorldSeconds as number,
    status: "PLANNED",
  };
}

function optionalRoute(row: Row, key: string): MissionRoutePlan | null {
  const value = row[key];
  if (value === null) {
    return null;
  }
  return routeFromValue(parseJson<unknown>(String(value), "RECOVERY_REQUIRED"), "RECOVERY_REQUIRED");
}

function optionalAnchor(row: Row, key: string): GridCoordinate | null {
  const value = row[key];
  if (value === null) {
    return null;
  }
  return validateCoordinate(parseJson<unknown>(String(value), "RECOVERY_REQUIRED"), "RECOVERY_REQUIRED");
}

/**
 * Re-project an immutable mission route at a durable world timestamp. This
 * intentionally mirrors the fixed G2 movement contract (three tiles per
 * world second) without importing the mission service into persistence.
 */
function routePositionAt(route: MissionRoutePlan, startWorldTime: number, worldTime: number): MissionRoutePosition {
  if (!Number.isSafeInteger(startWorldTime) || startWorldTime < 0
    || !Number.isSafeInteger(worldTime) || worldTime < startWorldTime) {
    throw new PersistenceError(worldTime < startWorldTime ? "WORLD_TIME_REGRESSION" : "RECOVERY_REQUIRED");
  }
  const finalIndex = route.waypoints.length - 1;
  const progressTiles = Math.min(finalIndex, (worldTime - startWorldTime) * 3);
  if (!Number.isSafeInteger(progressTiles)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const waypointIndex = Math.min(finalIndex, Math.floor(progressTiles));
  if (waypointIndex >= finalIndex) {
    const target = route.waypoints[finalIndex] as GridCoordinate;
    return {
      x: target.x,
      y: target.y,
      waypointIndex: finalIndex,
      progressTiles: finalIndex,
      arrived: true,
    };
  }
  const from = route.waypoints[waypointIndex] as GridCoordinate;
  const to = route.waypoints[waypointIndex + 1] as GridCoordinate;
  const fraction = progressTiles - waypointIndex;
  return {
    x: from.x + (to.x - from.x) * fraction,
    y: from.y + (to.y - from.y) * fraction,
    waypointIndex,
    progressTiles,
    arrived: false,
  };
}

function validateRoutePosition(value: unknown, code: "INVALID_INPUT" | "RECOVERY_REQUIRED"): MissionRoutePosition {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PersistenceError(code);
  }
  const position = value as Record<string, unknown>;
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)
    || !Number.isSafeInteger(position.waypointIndex) || (position.waypointIndex as number) < 0
    || !Number.isSafeInteger(position.progressTiles) || (position.progressTiles as number) < 0
    || typeof position.arrived !== "boolean") {
    throw new PersistenceError(code);
  }
  return {
    x: position.x as number,
    y: position.y as number,
    waypointIndex: position.waypointIndex as number,
    progressTiles: position.progressTiles as number,
    arrived: position.arrived as boolean,
  };
}

function validateMonsterReissuePlan(plan: MonsterReissuePlan, budgetBefore: 0 | 1): MissionRoutePlan | null {
  if (!plan || (plan.outcome !== "REISSUED" && plan.outcome !== "WAITING_REVIEW")) {
    throw new PersistenceError("INVALID_INPUT");
  }
  validateCoordinate(plan.dangerCell, "INVALID_INPUT");
  if (plan.outcome === "REISSUED") {
    if (budgetBefore !== 1 || plan.reason !== null || typeof plan.newMissionAttemptId !== "string"
      || plan.newMissionAttemptId.trim() === "" || plan.route === null) {
      throw new PersistenceError("INVALID_INPUT");
    }
    return routeFromValue(plan.route, "INVALID_INPUT");
  }
  if (plan.newMissionAttemptId !== null || plan.route !== null || !isReissueReviewReason(plan.reason)
    || (plan.reason === "NO_SAFE_REISSUE_ROUTE" && budgetBefore !== 1)
    || (plan.reason === "REPEATED_MONSTER_DEATH" && budgetBefore !== 0)) {
    throw new PersistenceError("INVALID_INPUT");
  }
  return null;
}

function missionRecordFromRow(row: Row): MissionRecord {
  return {
    worldId: requiredString(row, "world_id"),
    missionId: requiredString(row, "mission_id"),
    soldierId: requiredString(row, "soldier_id"),
    state: requiredString(row, "state"),
    phase: optionalMissionPhase(row, "phase"),
    role: optionalMissionRole(row, "role"),
    tool: optionalMissionTool(row, "tool"),
    targetId: optionalString(row, "target_id"),
    returnPolicy: optionalMissionReturnPolicy(row, "return_policy"),
    activeAttemptId: optionalString(row, "active_attempt_id"),
    encounterId: optionalString(row, "encounter_id"),
    encounterStatus: optionalEncounterState(row, "encounter_status"),
    nextDueWorldTime: optionalInteger(row, "next_due_world_time"),
    monsterReissueBudget: missionReissueBudgetFromRow(row),
    dangerCell: optionalAnchor(row, "danger_cell_json"),
    waitingReviewReason: optionalReviewReason(row, "waiting_review_reason"),
    revision: requiredInteger(row, "revision"),
  };
}

function missionAttemptRecordFromRow(row: Row): MissionAttemptRecord {
  const equipmentTier = requiredInteger(row, "equipment_tier");
  if (equipmentTier < 0) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return {
    worldId: requiredString(row, "world_id"),
    missionAttemptId: requiredString(row, "mission_attempt_id"),
    missionId: requiredString(row, "mission_id"),
    state: requiredString(row, "state"),
    phase: optionalMissionPhase(row, "phase"),
    role: optionalMissionRole(row, "role"),
    tool: optionalMissionTool(row, "tool"),
    equipmentTier,
    targetId: optionalString(row, "target_id"),
    route: optionalRoute(row, "route_json"),
    homeAnchor: optionalAnchor(row, "home_anchor_json"),
    returnPolicy: optionalMissionReturnPolicy(row, "return_policy"),
    encounterId: optionalString(row, "encounter_id"),
    encounterStatus: optionalEncounterState(row, "encounter_status"),
    terminalCause: optionalTerminalCause(row, "terminal_cause"),
    startWorldTime: requiredInteger(row, "start_world_time"),
    lastTransitionWorldTime: requiredInteger(row, "last_transition_world_time"),
    nextDueWorldTime: optionalInteger(row, "next_due_world_time"),
    revision: requiredInteger(row, "revision"),
  };
}

function encounterRecordFromRow(row: Row): EncounterRecord {
  const state = row.state;
  if (!isEncounterState(state)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const terminalCause = row.terminal_cause === null ? null : row.terminal_cause;
  if (terminalCause !== null && !isEncounterTerminalCause(terminalCause)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const engagementX = row.engagement_x;
  const engagementY = row.engagement_y;
  if (typeof engagementX !== "number" || !Number.isSafeInteger(engagementX)
    || typeof engagementY !== "number" || !Number.isSafeInteger(engagementY)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const soldierHp = requiredInteger(row, "soldier_hp");
  const monsterHp = requiredInteger(row, "monster_hp");
  const roundNumber = requiredInteger(row, "round_number");
  const contactWorldTime = requiredInteger(row, "contact_world_time");
  if (soldierHp < 0 || monsterHp < 0 || roundNumber < 0 || contactWorldTime < 0) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return {
    worldId: requiredString(row, "world_id"),
    encounterId: requiredString(row, "encounter_id"),
    state,
    missionId: requiredString(row, "mission_id"),
    missionAttemptId: requiredString(row, "mission_attempt_id"),
    soldierId: requiredString(row, "soldier_id"),
    monsterId: requiredString(row, "monster_id"),
    soldierHp,
    monsterHp,
    roundNumber,
    contactWorldTime,
    engagementPosition: { x: engagementX, y: engagementY },
    nextDueWorldTime: optionalInteger(row, "next_due_world_time"),
    terminalCause,
    revision: requiredInteger(row, "revision"),
  };
}

function cargoRecordFromRow(row: Row): CargoRecord {
  const quantity = requiredInteger(row, "quantity");
  const capacityUsed = requiredInteger(row, "capacity_used");
  if (quantity < 0 || capacityUsed < 0 || capacityUsed !== quantity) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const acquiredWorldTime = optionalInteger(row, "acquired_world_time");
  if (acquiredWorldTime !== null && acquiredWorldTime < 0) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return {
    worldId: requiredString(row, "world_id"),
    cargoId: requiredString(row, "cargo_id"),
    soldierId: requiredString(row, "soldier_id"),
    missionAttemptId: optionalString(row, "mission_attempt_id"),
    sourceNodeId: optionalString(row, "source_node_id"),
    resourceType: requiredString(row, "resource_type"),
    quantity,
    acquiredWorldTime,
    capacityUsed,
    revision: requiredInteger(row, "revision"),
  };
}

function cargoRecordsFor(database: DatabaseSync, worldId: string, filter: { soldierId?: string; missionAttemptId?: string }): CargoRecord[] {
  let rows: unknown[];
  if (filter.soldierId !== undefined && filter.missionAttemptId !== undefined) {
    rows = database.prepare("SELECT world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision FROM cargo WHERE world_id = ? AND soldier_id = ? AND mission_attempt_id = ? ORDER BY cargo_id ASC").all(worldId, filter.soldierId, filter.missionAttemptId);
  } else if (filter.soldierId !== undefined) {
    rows = database.prepare("SELECT world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision FROM cargo WHERE world_id = ? AND soldier_id = ? ORDER BY cargo_id ASC").all(worldId, filter.soldierId);
  } else if (filter.missionAttemptId !== undefined) {
    rows = database.prepare("SELECT world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision FROM cargo WHERE world_id = ? AND mission_attempt_id = ? ORDER BY cargo_id ASC").all(worldId, filter.missionAttemptId);
  } else {
    rows = database.prepare("SELECT world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision FROM cargo WHERE world_id = ? ORDER BY cargo_id ASC").all(worldId);
  }
  return (rows as Row[]).map(cargoRecordFromRow);
}

function extractionPayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PersistenceError("INVALID_INPUT");
  }
  return value as Record<string, unknown>;
}

function requireExtractionPayload(payload: Record<string, unknown>, key: string, expected: string | number): void {
  if (payload[key] !== expected) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function coordinateKey(point: GridCoordinate): string {
  return `${point.x},${point.y}`;
}

function validateExploredCells(value: unknown, code: "INVALID_INPUT" | "RECOVERY_REQUIRED"): GridCoordinate[] {
  if (!Array.isArray(value)) {
    throw new PersistenceError(code);
  }
  const seen = new Set<string>();
  const cells = value.map((cell) => validateCoordinate(cell, code));
  for (const cell of cells) {
    const key = coordinateKey(cell);
    if (seen.has(key)) {
      throw new PersistenceError(code);
    }
    seen.add(key);
  }
  return cells.sort((left, right) => left.y - right.y || left.x - right.x);
}

function playerPosition(input: CreatePlayerInput): GridCoordinate {
  return validateCoordinate(input.position ?? { x: 0, y: 0 }, "INVALID_INPUT");
}

function playerExploredCells(input: CreatePlayerInput): GridCoordinate[] {
  return validateExploredCells(input.exploredCells ?? [], "INVALID_INPUT");
}

function exploredCellsFromRow(row: Row): GridCoordinate[] {
  const raw = parseJson<unknown>(requiredString(row, "explored_cells_json"), "RECOVERY_REQUIRED");
  return validateExploredCells(raw, "RECOVERY_REQUIRED");
}

function playerRecordFromRow(row: Row): PlayerRecord {
  return {
    worldId: requiredString(row, "world_id"),
    playerId: requiredString(row, "player_id"),
    binding: requiredString(row, "binding"),
    revision: requiredInteger(row, "revision"),
    position: {
      x: requiredInteger(row, "position_x"),
      y: requiredInteger(row, "position_y"),
    },
    exploredCells: exploredCellsFromRow(row),
  };
}

function validatePlayerMutationPatch(patch: Record<string, string | number | boolean | null>): void {
  for (const column of ["position_x", "position_y"]) {
    if (column in patch && !Number.isSafeInteger(patch[column])) {
      throw new PersistenceError("INVALID_INPUT");
    }
  }
  if ("explored_cells_json" in patch) {
    if (typeof patch.explored_cells_json !== "string") {
      throw new PersistenceError("INVALID_INPUT");
    }
    validateExploredCells(parseJson<unknown>(patch.explored_cells_json, "INVALID_INPUT"), "INVALID_INPUT");
  }
}

function validateMissionMutationPatch(patch: Record<string, string | number | boolean | null>): void {
  if ("monster_reissue_budget" in patch
    && patch.monster_reissue_budget !== 0
    && patch.monster_reissue_budget !== 1) {
    throw new PersistenceError("INVALID_INPUT");
  }
  if ("danger_cell_json" in patch) {
    if (patch.danger_cell_json !== null && typeof patch.danger_cell_json !== "string") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (typeof patch.danger_cell_json === "string") {
      validateCoordinate(parseJson<unknown>(patch.danger_cell_json, "INVALID_INPUT"), "INVALID_INPUT");
    }
  }
  if ("waiting_review_reason" in patch
    && patch.waiting_review_reason !== null
    && !isReissueReviewReason(patch.waiting_review_reason)) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function validateMissionAttemptMutationPatch(patch: Record<string, string | number | boolean | null>): void {
  if ("terminal_cause" in patch
    && patch.terminal_cause !== null
    && !isEncounterTerminalCause(patch.terminal_cause)) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function maxSeverity(left: SignalSeverity, right: SignalSeverity): SignalSeverity {
  return SEVERITY_RANK[left] >= SEVERITY_RANK[right] ? left : right;
}

function resolveCombatRoundForPersistence(encounter: EncounterRecord, role: "GATHERER" | "HUNTER"): MonsterCombatRoundResolution {
  if (role === "HUNTER") {
    return resolveMonsterHunterRound({
      roundNumber: encounter.roundNumber + 1,
      hunterHp: encounter.soldierHp,
      monsterHp: encounter.monsterHp,
    });
  }
  return resolveMonsterGathererRound({
    roundNumber: encounter.roundNumber + 1,
    gathererHp: encounter.soldierHp,
    monsterHp: encounter.monsterHp,
  });
}

function deterministicSignalId(worldId: string, shelterId: string, binding: string, cursorStart: number, worldTime: number): string {
  const digest = createHash("sha256")
    .update(`${worldId}\u0000${shelterId}\u0000${binding}\u0000${cursorStart}\u0000${worldTime}`)
    .digest("hex")
    .slice(0, 24);
  return `signal-${digest}`;
}

function isSignalStatus(value: unknown): value is SignalSlotRecord["status"] {
  return value === "pending" || value === "in_flight" || value === "acknowledged" || value === "terminally_rejected";
}

function assertNonEmpty(value: string, code: "INVALID_INPUT" | "WORLD_NOT_FOUND" = "INVALID_INPUT"): void {
  if (value.trim() === "") {
    throw new PersistenceError(code);
  }
}

function assertNonNegativeSafeInteger(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function assertCanonicalIsoTimestamp(value: string): void {
  try {
    if (typeof value !== "string" || value !== new Date(value).toISOString()) {
      throw new Error("timestamp is not canonical");
    }
  } catch {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function withTransaction<T>(database: DatabaseSync, run: () => T): T {
  try {
    database.exec("BEGIN IMMEDIATE");
    const result = run();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch {
      // Preserve the original typed failure. SQLite rolls back a failed transaction on close.
    }
    throw classifyPersistenceError(error, "STORE_OPEN_FAILED");
  }
}

function addColumnIfMissing(database: DatabaseSync, table: string, column: string, definition: string): void {
  const columns = new Set((database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name?: unknown }>)
    .map((row) => row.name)
    .filter((name): name is string => typeof name === "string"));
  if (!columns.has(column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export class PersistenceStore {
  readonly databasePath: string;
  readonly contractVersion: string;
  readonly schemaVersion: number;
  private database: DatabaseSync | null = null;

  constructor(options: PersistenceStoreOptions) {
    this.databasePath = options.dbPath;
    this.contractVersion = options.contractVersion ?? DEFAULT_CONTRACT_VERSION;
    this.schemaVersion = options.schemaVersion ?? CURRENT_SCHEMA_VERSION;
  }

  get isOpen(): boolean {
    return this.database?.isOpen === true;
  }

  open(): void {
    if (this.isOpen) {
      return;
    }
    if (this.databasePath === ":memory:" || this.databasePath.trim() === "") {
      throw new PersistenceError("INVALID_DB_PATH");
    }

    try {
      mkdirSync(dirname(this.databasePath), { recursive: true });
      const database = new DatabaseSync(this.databasePath);
      this.database = database;
      database.exec("PRAGMA busy_timeout = 100;");
      database.exec("PRAGMA journal_mode = WAL;");
      database.exec("PRAGMA foreign_keys = ON;");

      // A first-run database has no schema_meta table yet. Probe sqlite_master
      // before reading it so bootstrap is deterministic instead of surfacing a
      // misleading STORE_OPEN_FAILED / "no such table" error.
      const metadataTable = rowOf(database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_meta'").get());
      if (!metadataTable) {
        withTransaction(database, () => {
          database.exec(SCHEMA_SQL);
          database.prepare("INSERT INTO schema_meta (schema_meta_id, schema_version, contract_version, supported_event_version, supported_snapshot_version, migration_id) VALUES (?, ?, ?, ?, ?, ?)").run(
            "singleton",
            this.schemaVersion,
            this.contractVersion,
            CURRENT_EVENT_VERSION,
            CURRENT_SNAPSHOT_VERSION,
            CURRENT_MIGRATION_ID,
          );
          // Keep first-run bootstrap atomic. An existing partial table must not
          // receive a committed metadata row before the shape check succeeds.
          this.assertSchemaShape(database);
        });
      } else {
        const existing = rowOf(database.prepare("SELECT schema_version, contract_version, supported_event_version, supported_snapshot_version, migration_id FROM schema_meta WHERE schema_meta_id = 'singleton'").get());
        if (!existing) {
          throw new PersistenceError("SCHEMA_INCOMPATIBLE");
        }
        this.migrateSchema(database, existing);
        const current = rowOf(database.prepare("SELECT schema_version, contract_version, supported_event_version, supported_snapshot_version, migration_id FROM schema_meta WHERE schema_meta_id = 'singleton'").get());
        if (!current) {
          throw new PersistenceError("SCHEMA_INCOMPATIBLE");
        }
        this.assertCompatibleMetadata(current);
      }
      if (metadataTable) {
        this.assertSchemaShape(database);
      }
    } catch (error) {
      const typed = classifyPersistenceError(error, "STORE_OPEN_FAILED");
      const database = this.database;
      this.database = null;
      try {
        if (database?.isOpen) {
          database.close();
        }
      } catch {
        // A failed open is already represented by the typed result.
      }
      throw typed;
    }
  }

  private migrateSchema(database: DatabaseSync, existing: Row): void {
    const schemaVersion = requiredInteger(existing, "schema_version");
    if (schemaVersion === this.schemaVersion) {
      return;
    }
    if ((schemaVersion < 1 || schemaVersion > CURRENT_SCHEMA_VERSION - 1) || this.schemaVersion !== CURRENT_SCHEMA_VERSION
      || requiredString(existing, "contract_version") !== this.contractVersion
      || requiredInteger(existing, "supported_event_version") !== CURRENT_EVENT_VERSION
      || requiredInteger(existing, "supported_snapshot_version") !== CURRENT_SNAPSHOT_VERSION) {
      throw new PersistenceError("SCHEMA_INCOMPATIBLE");
    }

    try {
      withTransaction(database, () => {
        addColumnIfMissing(database, "world", "in_progress_world_time", "INTEGER");
        addColumnIfMissing(database, "world", "server_time_anchor_ms", "INTEGER");
        addColumnIfMissing(database, "player", "position_x", "INTEGER NOT NULL DEFAULT 0");
        addColumnIfMissing(database, "player", "position_y", "INTEGER NOT NULL DEFAULT 0");
        addColumnIfMissing(database, "player", "explored_cells_json", "TEXT NOT NULL DEFAULT '[]'");
        addColumnIfMissing(database, "mission", "phase", "TEXT NOT NULL DEFAULT 'AT_SHELTER'");
        addColumnIfMissing(database, "mission", "tool", "TEXT");
        addColumnIfMissing(database, "mission", "return_policy", "TEXT");
        addColumnIfMissing(database, "mission", "active_attempt_id", "TEXT");
        addColumnIfMissing(database, "mission", "encounter_id", "TEXT");
        addColumnIfMissing(database, "mission", "encounter_status", "TEXT");
        addColumnIfMissing(database, "mission", "monster_reissue_budget", "INTEGER NOT NULL DEFAULT 1");
        addColumnIfMissing(database, "mission", "danger_cell_json", "TEXT");
        addColumnIfMissing(database, "mission", "waiting_review_reason", "TEXT");
        addColumnIfMissing(database, "mission", "next_due_world_time", "INTEGER");
        addColumnIfMissing(database, "mission_attempt", "phase", "TEXT NOT NULL DEFAULT 'TERMINAL'");
        addColumnIfMissing(database, "mission_attempt", "role", "TEXT");
        addColumnIfMissing(database, "mission_attempt", "tool", "TEXT");
        addColumnIfMissing(database, "mission_attempt", "equipment_tier", "INTEGER NOT NULL DEFAULT 1");
        addColumnIfMissing(database, "mission_attempt", "target_id", "TEXT");
        addColumnIfMissing(database, "mission_attempt", "route_json", "TEXT");
        addColumnIfMissing(database, "mission_attempt", "home_anchor_json", "TEXT");
        addColumnIfMissing(database, "mission_attempt", "return_policy", "TEXT");
        addColumnIfMissing(database, "mission_attempt", "encounter_id", "TEXT");
        addColumnIfMissing(database, "mission_attempt", "encounter_status", "TEXT");
        addColumnIfMissing(database, "mission_attempt", "terminal_cause", "TEXT");
        addColumnIfMissing(database, "mission_attempt", "start_world_time", "INTEGER NOT NULL DEFAULT 0");
        addColumnIfMissing(database, "mission_attempt", "last_transition_world_time", "INTEGER NOT NULL DEFAULT 0");
        addColumnIfMissing(database, "mission_attempt", "next_due_world_time", "INTEGER");
        addColumnIfMissing(database, "cargo", "mission_attempt_id", "TEXT");
        addColumnIfMissing(database, "cargo", "source_node_id", "TEXT");
        addColumnIfMissing(database, "cargo", "acquired_world_time", "INTEGER");
        addColumnIfMissing(database, "cargo", "capacity_used", "INTEGER NOT NULL DEFAULT 0");
        database.prepare("UPDATE cargo SET capacity_used = quantity WHERE capacity_used = 0 AND quantity > 0").run();
        addColumnIfMissing(database, "encounter", "mission_id", "TEXT");
        addColumnIfMissing(database, "encounter", "mission_attempt_id", "TEXT");
        addColumnIfMissing(database, "encounter", "soldier_id", "TEXT");
        addColumnIfMissing(database, "encounter", "monster_id", "TEXT");
        addColumnIfMissing(database, "encounter", "soldier_hp", "INTEGER NOT NULL DEFAULT 100");
        addColumnIfMissing(database, "encounter", "monster_hp", "INTEGER NOT NULL DEFAULT 80");
        addColumnIfMissing(database, "encounter", "round_number", "INTEGER NOT NULL DEFAULT 0");
        addColumnIfMissing(database, "encounter", "contact_world_time", "INTEGER NOT NULL DEFAULT 0");
        addColumnIfMissing(database, "encounter", "engagement_x", "REAL NOT NULL DEFAULT 0");
        addColumnIfMissing(database, "encounter", "engagement_y", "REAL NOT NULL DEFAULT 0");
        addColumnIfMissing(database, "encounter", "terminal_cause", "TEXT");
        database.exec("CREATE UNIQUE INDEX IF NOT EXISTS encounter_active_soldier_idx ON encounter(world_id, soldier_id) WHERE state IN ('LOCKED', 'RESOLVING')");
        database.exec("CREATE UNIQUE INDEX IF NOT EXISTS encounter_active_monster_idx ON encounter(world_id, monster_id) WHERE state IN ('LOCKED', 'RESOLVING')");
        database.exec("CREATE UNIQUE INDEX IF NOT EXISTS encounter_attempt_monster_idx ON encounter(world_id, mission_attempt_id, monster_id)");
        database.exec(`
          CREATE TABLE IF NOT EXISTS reentry_binding_sequence (
            world_id TEXT NOT NULL,
            opaque_binding TEXT NOT NULL,
            next_event_sequence INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (world_id, opaque_binding),
            FOREIGN KEY (world_id) REFERENCES world(world_id),
            CHECK (next_event_sequence >= 1)
          );
          CREATE TABLE IF NOT EXISTS reentry_event_context (
            world_id TEXT NOT NULL,
            signal_id TEXT NOT NULL,
            opaque_binding TEXT NOT NULL,
            event_sequence INTEGER NOT NULL,
            occurred_at TEXT NOT NULL,
            state_version INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (world_id, signal_id),
            UNIQUE (world_id, opaque_binding, event_sequence),
            FOREIGN KEY (world_id) REFERENCES world(world_id),
            CHECK (event_sequence >= 1),
            CHECK (state_version >= 0)
          );
          CREATE INDEX IF NOT EXISTS reentry_event_context_binding_idx
            ON reentry_event_context(world_id, opaque_binding, event_sequence);
        `);
        database.prepare("UPDATE schema_meta SET schema_version = ?, migration_id = ?, updated_at = CURRENT_TIMESTAMP WHERE schema_meta_id = 'singleton'").run(CURRENT_SCHEMA_VERSION, CURRENT_MIGRATION_ID);
      });
    } catch (error) {
      if (error instanceof PersistenceError) {
        throw error;
      }
      throw new PersistenceError("MIGRATION_FAILED", { cause: error });
    }
  }

  close(): void {
    const database = this.database;
    if (!database) {
      return;
    }
    this.database = null;
    try {
      if (database.isOpen) {
        database.close();
      }
    } catch (error) {
      throw new PersistenceError("STORE_CLOSE_FAILED", { cause: error });
    }
  }

  metadata(): SchemaMetadata {
    const row = rowOf(this.db().prepare("SELECT schema_version, contract_version, supported_event_version, supported_snapshot_version, migration_id FROM schema_meta WHERE schema_meta_id = 'singleton'").get());
    if (!row) {
      throw new PersistenceError("SCHEMA_INCOMPATIBLE");
    }
    return {
      schemaVersion: requiredNumber(row, "schema_version"),
      contractVersion: requiredString(row, "contract_version"),
      supportedEventVersion: requiredNumber(row, "supported_event_version"),
      supportedSnapshotVersion: requiredNumber(row, "supported_snapshot_version"),
      migrationId: requiredString(row, "migration_id"),
    };
  }

  pragmas(): { journalMode: string; foreignKeys: number } {
    const database = this.db();
    const journal = rowOf(database.prepare("PRAGMA journal_mode").get());
    const foreignKeys = rowOf(database.prepare("PRAGMA foreign_keys").get());
    return {
      journalMode: typeof journal?.journal_mode === "string" ? journal.journal_mode.toLowerCase() : "",
      foreignKeys: typeof foreignKeys?.foreign_keys === "number" ? foreignKeys.foreign_keys : 0,
    };
  }

  createWorld(input: CreateWorldInput): WorldRecord {
    assertNonEmpty(input.worldId);
    if (!Number.isInteger(input.worldTime) || input.worldTime < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    return withTransaction(this.db(), () => {
      try {
        this.db().prepare("INSERT INTO world (world_id, world_time, world_event_cursor, world_seed, generation_version, map_fingerprint, revision) VALUES (?, ?, 0, ?, ?, ?, ?)").run(
          input.worldId,
          input.worldTime,
          input.worldSeed ?? null,
          input.generationVersion ?? null,
          input.mapFingerprint ?? null,
          input.revision ?? 0,
        );
      } catch (error) {
        throw classifyPersistenceError(error, "STORE_OPEN_FAILED");
      }
      return this.getWorld(input.worldId) as WorldRecord;
    });
  }

  createWorldFixture(input: CreateWorldFixtureInput): CreateWorldFixtureResult {
    const { world, snapshot } = input;
    assertNonEmpty(world.worldId);
    if (!Number.isSafeInteger(world.worldTime) || world.worldTime < 0 || !Number.isSafeInteger(world.revision ?? 0) || (world.revision ?? 0) < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (snapshot.worldId !== world.worldId || snapshot.worldTime !== world.worldTime || snapshot.lastWorldEventCursor !== 0) {
      throw new PersistenceError("SNAPSHOT_INVALID");
    }

    const seen = new Set<string>();
    const assertWorldScopedId = (worldId: string, entityId: string): void => {
      if (worldId !== world.worldId) {
        throw new PersistenceError("INVALID_INPUT");
      }
      assertNonEmpty(entityId);
      if (seen.has(entityId)) {
        throw new PersistenceError("DUPLICATE_COMMAND");
      }
      seen.add(entityId);
    };
    for (const player of input.players) {
      assertWorldScopedId(player.worldId, player.playerId);
      assertNonEmpty(player.binding);
      playerPosition(player);
      playerExploredCells(player);
      if (!Number.isSafeInteger(player.revision ?? 0) || (player.revision ?? 0) < 0) {
        throw new PersistenceError("INVALID_INPUT");
      }
    }
    seen.clear();
    for (const shelter of input.shelters) {
      assertWorldScopedId(shelter.worldId, shelter.shelterId);
      assertNonEmpty(shelter.playerId);
      if (!Number.isSafeInteger(shelter.revision ?? 0) || (shelter.revision ?? 0) < 0 || !Number.isSafeInteger(shelter.coins ?? 0) || (shelter.coins ?? 0) < 0) {
        throw new PersistenceError("INVALID_INPUT");
      }
    }
    seen.clear();
    for (const soldier of input.soldiers) {
      assertWorldScopedId(soldier.worldId, soldier.soldierId);
      assertNonEmpty(soldier.shelterId);
      if (!Number.isSafeInteger(soldier.revision ?? 0) || (soldier.revision ?? 0) < 0) {
        throw new PersistenceError("INVALID_INPUT");
      }
    }
    seen.clear();
    for (const node of input.resourceNodes) {
      assertWorldScopedId(node.worldId, node.resourceNodeId);
      assertNonEmpty(node.resourceType);
      if (!Number.isSafeInteger(node.quantity) || node.quantity < 0 || !Number.isSafeInteger(node.revision ?? 0) || (node.revision ?? 0) < 0) {
        throw new PersistenceError("INVALID_INPUT");
      }
    }
    seen.clear();
    for (const monster of input.monsters) {
      assertWorldScopedId(monster.worldId, monster.monsterId);
      if (!Number.isSafeInteger(monster.revision ?? 0) || (monster.revision ?? 0) < 0) {
        throw new PersistenceError("INVALID_INPUT");
      }
    }

    const database = this.db();
    return withTransaction(database, () => {
      if (this.getWorld(world.worldId)) {
        throw new PersistenceError("DUPLICATE_COMMAND");
      }
      try {
        database.prepare("INSERT INTO world (world_id, world_time, world_event_cursor, world_seed, generation_version, map_fingerprint, revision) VALUES (?, ?, 0, ?, ?, ?, ?)").run(
          world.worldId,
          world.worldTime,
          world.worldSeed ?? null,
          world.generationVersion ?? null,
          world.mapFingerprint ?? null,
          world.revision ?? 0,
        );
        for (const player of input.players) {
          const position = playerPosition(player);
          const exploredCells = playerExploredCells(player);
          database.prepare("INSERT INTO player (world_id, player_id, binding, revision, position_x, position_y, explored_cells_json) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
            player.worldId,
            player.playerId,
            player.binding,
            player.revision ?? 0,
            position.x,
            position.y,
            canonicalJson(exploredCells),
          );
        }
        for (const shelter of input.shelters) {
          database.prepare("INSERT INTO shelter (world_id, shelter_id, player_id, revision, coins) VALUES (?, ?, ?, ?, ?)").run(shelter.worldId, shelter.shelterId, shelter.playerId, shelter.revision ?? 0, shelter.coins ?? 0);
        }
        for (const soldier of input.soldiers) {
          database.prepare("INSERT INTO soldier (world_id, soldier_id, shelter_id, state, role, tool, revision) VALUES (?, ?, ?, ?, ?, ?, ?)").run(soldier.worldId, soldier.soldierId, soldier.shelterId, soldier.state ?? "resident", soldier.role ?? null, soldier.tool ?? null, soldier.revision ?? 0);
        }
        for (const node of input.resourceNodes) {
          database.prepare("INSERT INTO resource_node (world_id, resource_node_id, resource_type, quantity, revision) VALUES (?, ?, ?, ?, ?)").run(node.worldId, node.resourceNodeId, node.resourceType, node.quantity, node.revision ?? 0);
        }
        for (const monster of input.monsters) {
          database.prepare("INSERT INTO monster (world_id, monster_id, state, revision) VALUES (?, ?, ?, ?)").run(monster.worldId, monster.monsterId, monster.state ?? "patrol", monster.revision ?? 0);
        }
      } catch (error) {
        throw classifyPersistenceError(error, "INVALID_INPUT");
      }
      const persistedSnapshot = this.insertSnapshot(database, snapshot);
      return {
        world: this.getWorld(world.worldId) as WorldRecord,
        snapshot: persistedSnapshot,
      };
    });
  }

  createPlayer(input: CreatePlayerInput): PlayerRecord {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.playerId);
    assertNonEmpty(input.binding);
    const position = playerPosition(input);
    const exploredCells = playerExploredCells(input);
    return withTransaction(this.db(), () => {
      this.requireWorld(input.worldId);
      try {
        this.db().prepare("INSERT INTO player (world_id, player_id, binding, revision, position_x, position_y, explored_cells_json) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
          input.worldId,
          input.playerId,
          input.binding,
          input.revision ?? 0,
          position.x,
          position.y,
          canonicalJson(exploredCells),
        );
      } catch (error) {
        throw classifyPersistenceError(error, "STORE_OPEN_FAILED");
      }
      return this.getPlayer(input.worldId, input.playerId) as PlayerRecord;
    });
  }

  createShelter(input: CreateShelterInput): ShelterRecord {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.shelterId);
    assertNonEmpty(input.playerId);
    return withTransaction(this.db(), () => {
      this.requireWorld(input.worldId);
      try {
        this.db().prepare("INSERT INTO shelter (world_id, shelter_id, player_id, revision, coins) VALUES (?, ?, ?, ?, ?)").run(input.worldId, input.shelterId, input.playerId, input.revision ?? 0, input.coins ?? 0);
      } catch (error) {
        throw classifyPersistenceError(error, "STORE_OPEN_FAILED");
      }
      return this.getShelter(input.worldId, input.shelterId) as ShelterRecord;
    });
  }

  getWorld(worldId: string): WorldRecord | null {
    const row = rowOf(this.db().prepare("SELECT world_id, world_time, in_progress_world_time, server_time_anchor_ms, world_event_cursor, world_seed, generation_version, map_fingerprint, revision FROM world WHERE world_id = ?").get(worldId));
    if (!row) {
      return null;
    }
    const inProgressWorldTime = optionalInteger(row, "in_progress_world_time");
    const serverTimeAnchorMs = optionalInteger(row, "server_time_anchor_ms");
    return {
      worldId: requiredString(row, "world_id"),
      worldTime: requiredNumber(row, "world_time"),
      inProgressWorldTime,
      serverTimeAnchorMs,
      worldEventCursor: requiredNumber(row, "world_event_cursor"),
      worldSeed: row.world_seed === null || typeof row.world_seed === "string" ? row.world_seed : null,
      generationVersion: row.generation_version === null || typeof row.generation_version === "string" ? row.generation_version : null,
      mapFingerprint: row.map_fingerprint === null || typeof row.map_fingerprint === "string" ? row.map_fingerprint : null,
      revision: requiredNumber(row, "revision"),
    };
  }

  /**
   * Return the complete persisted world inventory for startup admission.
   * Fixture bootstrap uses this read-only proof to distinguish an empty
   * database from a database that already belongs to another world.
   */
  listWorldIds(): string[] {
    const rows = this.db().prepare("SELECT world_id FROM world ORDER BY world_id ASC").all() as Row[];
    return rows.map((row) => requiredString(row, "world_id"));
  }

  listPlayers(worldId: string): PlayerRecord[] {
    this.requireWorld(worldId);
    const rows = this.db().prepare("SELECT world_id, player_id, binding, revision, position_x, position_y, explored_cells_json FROM player WHERE world_id = ? ORDER BY player_id ASC").all(worldId) as Row[];
    return rows.map(playerRecordFromRow);
  }

  listShelters(worldId: string): ShelterRecord[] {
    this.requireWorld(worldId);
    const rows = this.db().prepare("SELECT world_id, shelter_id, player_id, revision, coins FROM shelter WHERE world_id = ? ORDER BY shelter_id ASC").all(worldId) as Row[];
    return rows.map((row) => ({
      worldId: requiredString(row, "world_id"),
      shelterId: requiredString(row, "shelter_id"),
      playerId: requiredString(row, "player_id"),
      revision: requiredNumber(row, "revision"),
      coins: requiredNumber(row, "coins"),
    }));
  }

  listSoldiers(worldId: string): SoldierRecord[] {
    this.requireWorld(worldId);
    const rows = this.db().prepare("SELECT world_id, soldier_id, shelter_id, state, role, tool, revision FROM soldier WHERE world_id = ? ORDER BY soldier_id ASC").all(worldId) as Row[];
    return rows.map((row) => ({
      worldId: requiredString(row, "world_id"),
      soldierId: requiredString(row, "soldier_id"),
      shelterId: requiredString(row, "shelter_id"),
      state: requiredString(row, "state"),
      role: row.role === null || typeof row.role === "string" ? row.role : null,
      tool: row.tool === null || typeof row.tool === "string" ? row.tool : null,
      revision: requiredNumber(row, "revision"),
    }));
  }

  listResourceNodes(worldId: string): ResourceNodeRecord[] {
    this.requireWorld(worldId);
    const rows = this.db().prepare("SELECT world_id, resource_node_id, resource_type, quantity, next_due_world_time, revision FROM resource_node WHERE world_id = ? ORDER BY resource_node_id ASC").all(worldId) as Row[];
    return rows.map((row) => ({
      worldId: requiredString(row, "world_id"),
      resourceNodeId: requiredString(row, "resource_node_id"),
      resourceType: requiredString(row, "resource_type"),
      quantity: requiredNumber(row, "quantity"),
      nextDueWorldTime: optionalInteger(row, "next_due_world_time"),
      revision: requiredNumber(row, "revision"),
    }));
  }

  listCargo(worldId: string, soldierId?: string, missionAttemptId?: string): CargoRecord[] {
    this.requireWorld(worldId);
    if (soldierId !== undefined) {
      assertNonEmpty(soldierId);
    }
    if (missionAttemptId !== undefined) {
      assertNonEmpty(missionAttemptId);
    }
    let rows: unknown[];
    if (soldierId !== undefined && missionAttemptId !== undefined) {
      rows = this.db().prepare("SELECT world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision FROM cargo WHERE world_id = ? AND soldier_id = ? AND mission_attempt_id = ? ORDER BY cargo_id ASC").all(worldId, soldierId, missionAttemptId);
    } else if (soldierId !== undefined) {
      rows = this.db().prepare("SELECT world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision FROM cargo WHERE world_id = ? AND soldier_id = ? ORDER BY cargo_id ASC").all(worldId, soldierId);
    } else if (missionAttemptId !== undefined) {
      rows = this.db().prepare("SELECT world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision FROM cargo WHERE world_id = ? AND mission_attempt_id = ? ORDER BY cargo_id ASC").all(worldId, missionAttemptId);
    } else {
      rows = this.db().prepare("SELECT world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision FROM cargo WHERE world_id = ? ORDER BY cargo_id ASC").all(worldId);
    }
    return (rows as Row[]).map(cargoRecordFromRow);
  }

  getCargo(worldId: string, cargoId: string): CargoRecord | null {
    assertNonEmpty(worldId);
    assertNonEmpty(cargoId);
    const row = rowOf(this.db().prepare("SELECT world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision FROM cargo WHERE world_id = ? AND cargo_id = ?").get(worldId, cargoId));
    return row ? cargoRecordFromRow(row) : null;
  }

  listMonsters(worldId: string): MonsterRecord[] {
    this.requireWorld(worldId);
    const rows = this.db().prepare("SELECT world_id, monster_id, state, revision FROM monster WHERE world_id = ? ORDER BY monster_id ASC").all(worldId) as Row[];
    return rows.map((row) => ({
      worldId: requiredString(row, "world_id"),
      monsterId: requiredString(row, "monster_id"),
      state: requiredString(row, "state"),
      revision: requiredNumber(row, "revision"),
    }));
  }

  listEncounters(worldId: string): EncounterRecord[] {
    this.requireWorld(worldId);
    const rows = this.db().prepare("SELECT world_id, encounter_id, state, mission_id, mission_attempt_id, soldier_id, monster_id, soldier_hp, monster_hp, round_number, contact_world_time, engagement_x, engagement_y, terminal_cause, next_due_world_time, revision FROM encounter WHERE world_id = ? ORDER BY encounter_id ASC").all(worldId) as Row[];
    return rows.map(encounterRecordFromRow);
  }

  getEncounter(worldId: string, encounterId: string): EncounterRecord | null {
    assertNonEmpty(worldId);
    assertNonEmpty(encounterId);
    const row = rowOf(this.db().prepare("SELECT world_id, encounter_id, state, mission_id, mission_attempt_id, soldier_id, monster_id, soldier_hp, monster_hp, round_number, contact_world_time, engagement_x, engagement_y, terminal_cause, next_due_world_time, revision FROM encounter WHERE world_id = ? AND encounter_id = ?").get(worldId, encounterId));
    return row ? encounterRecordFromRow(row) : null;
  }

  commitMonsterContact(input: CommitMonsterContactInput): CommitMonsterContactResult {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.encounterId);
    assertNonEmpty(input.missionId);
    assertNonEmpty(input.missionAttemptId);
    assertNonEmpty(input.soldierId);
    assertNonEmpty(input.monsterId);
    assertNonEmpty(input.idempotency.key);
    assertNonEmpty(input.idempotency.binding);
    if (!Number.isSafeInteger(input.worldTime) || input.worldTime < 0
      || !Number.isSafeInteger(input.expectedMissionRevision) || input.expectedMissionRevision < 0
      || !Number.isSafeInteger(input.expectedMissionAttemptRevision) || input.expectedMissionAttemptRevision < 0
      || !Number.isSafeInteger(input.expectedSoldierRevision) || input.expectedSoldierRevision < 0
      || !Number.isSafeInteger(input.expectedMonsterRevision) || input.expectedMonsterRevision < 0
      || !Number.isSafeInteger(input.engagementPosition.x) || !Number.isSafeInteger(input.engagementPosition.y)
      || !Array.isArray(input.events) || input.events.length !== 2) {
      throw new PersistenceError("INVALID_INPUT");
    }

    const database = this.db();
    try {
      return withTransaction(database, () => {
        const world = this.requireWorld(input.worldId);
        const requestFingerprint = canonicalJson(input.idempotency.request);
        const existing = rowOf(database.prepare("SELECT binding, request_fingerprint, contract_version, outcome, result_json FROM idempotency_record WHERE world_id = ? AND idempotency_key = ?").get(input.worldId, input.idempotency.key));
        if (existing) {
          if (existing.binding !== input.idempotency.binding || existing.request_fingerprint !== requestFingerprint || existing.contract_version !== this.contractVersion) {
            throw new PersistenceError("DUPLICATE_COMMAND");
          }
          if (existing.outcome === "rejected") {
            const rejection = parseJson<{ errorCode?: unknown }>(String(existing.result_json), "RECOVERY_REQUIRED");
            if (!isPersistenceErrorCode(rejection.errorCode)) {
              throw new PersistenceError("RECOVERY_REQUIRED");
            }
            throw new PersistenceError(rejection.errorCode);
          }
          if (existing.outcome !== "committed") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          const storedResult = parseJson<CommitMonsterContactResult>(String(existing.result_json), "RECOVERY_REQUIRED");
          if (!storedResult || storedResult.effect !== "encounter_locked") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          return { ...storedResult, duplicate: true };
        }

        if (input.worldTime < world.worldTime) {
          throw new PersistenceError("WORLD_TIME_REGRESSION");
        }
        if (input.worldTime > world.worldTime) {
          database.prepare("UPDATE world SET world_time = ? WHERE world_id = ? AND in_progress_world_time IS NULL AND world_time <= ?").run(input.worldTime, input.worldId, input.worldTime);
        }

        const missionRow = rowOf(database.prepare("SELECT world_id, mission_id, soldier_id, state, phase, role, tool, target_id, return_policy, active_attempt_id, encounter_id, encounter_status, revision, work_id, next_due_world_time FROM mission WHERE world_id = ? AND mission_id = ?").get(input.worldId, input.missionId));
        const attemptRow = rowOf(database.prepare("SELECT world_id, mission_attempt_id, mission_id, state, phase, role, tool, equipment_tier, target_id, encounter_id, encounter_status, revision, work_id, next_due_world_time FROM mission_attempt WHERE world_id = ? AND mission_attempt_id = ?").get(input.worldId, input.missionAttemptId));
        const soldierRow = rowOf(database.prepare("SELECT world_id, soldier_id, shelter_id, state, role, tool, revision FROM soldier WHERE world_id = ? AND soldier_id = ?").get(input.worldId, input.soldierId));
        const monsterRow = rowOf(database.prepare("SELECT world_id, monster_id, state, revision FROM monster WHERE world_id = ? AND monster_id = ?").get(input.worldId, input.monsterId));
        if (!missionRow || !attemptRow || !soldierRow || !monsterRow) {
          throw new PersistenceError("ENTITY_NOT_FOUND");
        }
        const shelterId = requiredString(soldierRow, "shelter_id");
        if (requiredInteger(soldierRow, "revision") !== input.expectedSoldierRevision
          || requiredInteger(missionRow, "revision") !== input.expectedMissionRevision
          || requiredInteger(attemptRow, "revision") !== input.expectedMissionAttemptRevision
          || requiredInteger(monsterRow, "revision") !== input.expectedMonsterRevision) {
          throw new PersistenceError("STALE_REVISION");
        }
        const missionRole = optionalString(missionRow, "role");
        const attemptRole = optionalString(attemptRow, "role");
        const soldierRole = optionalString(soldierRow, "role");
        const missionTool = optionalString(missionRow, "tool");
        const attemptTool = optionalString(attemptRow, "tool");
        const soldierTool = optionalString(soldierRow, "tool");
        if (requiredString(missionRow, "soldier_id") !== input.soldierId
          || requiredString(attemptRow, "mission_id") !== input.missionId
          || requiredString(missionRow, "active_attempt_id") !== input.missionAttemptId
          || !["ACTIVE", "active"].includes(requiredString(missionRow, "state"))
          || !["ACTIVE", "active"].includes(requiredString(attemptRow, "state"))
          || requiredString(missionRow, "phase") !== "WORKING"
          || requiredString(attemptRow, "phase") !== "WORKING"
          || (missionRole !== "GATHERER" && missionRole !== "HUNTER")
          || attemptRole !== missionRole
          || requiredString(soldierRow, "state") !== "FIELD"
          || soldierRole !== missionRole
          || missionTool !== attemptTool
          || attemptTool !== soldierTool
          || optionalString(missionRow, "encounter_id") !== null
          || optionalString(missionRow, "encounter_status") !== null
          || optionalString(attemptRow, "encounter_id") !== null
          || optionalString(attemptRow, "encounter_status") !== null
          || requiredString(monsterRow, "state").toUpperCase() !== "PATROL") {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        if (missionRole === "HUNTER"
          && (requiredString(missionRow, "target_id") !== input.monsterId
            || requiredString(attemptRow, "target_id") !== input.monsterId
            || missionTool !== "SWORD"
            || requiredInteger(attemptRow, "equipment_tier") !== 1)) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        if (database.prepare("SELECT 1 FROM encounter WHERE world_id = ? AND encounter_id = ?").get(input.worldId, input.encounterId)
          || database.prepare("SELECT 1 FROM encounter WHERE world_id = ? AND mission_attempt_id = ? AND monster_id = ?").get(input.worldId, input.missionAttemptId, input.monsterId)
          || database.prepare("SELECT 1 FROM encounter WHERE world_id = ? AND soldier_id = ? AND state IN ('LOCKED', 'RESOLVING')").get(input.worldId, input.soldierId)
          || database.prepare("SELECT 1 FROM encounter WHERE world_id = ? AND monster_id = ? AND state IN ('LOCKED', 'RESOLVING')").get(input.worldId, input.monsterId)) {
          throw new PersistenceError("EVENT_CONFLICT");
        }

        const roleFields = missionRole === "HUNTER" ? { role: missionRole, tool: missionTool } : {};
        const actorObservedPayload = {
          encounterId: input.encounterId,
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          soldierId: input.soldierId,
          monsterId: input.monsterId,
          ...roleFields,
          observerType: "MONSTER",
          engagementPosition: input.engagementPosition,
          contactRadiusTiles: 1,
          worldTime: input.worldTime,
        };
        const lockedPayload = {
          encounterId: input.encounterId,
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          soldierId: input.soldierId,
          monsterId: input.monsterId,
          ...roleFields,
          state: "LOCKED",
          soldierHp: 100,
          monsterHp: 80,
          roundNumber: 0,
          nextDueWorldTime: input.worldTime,
          engagementPosition: input.engagementPosition,
          worldTime: input.worldTime,
        };
        const expectedEvents = [
          { eventId: `encounter-observed:${input.encounterId}`, eventType: "ActorObserved", payload: actorObservedPayload },
          { eventId: `encounter-locked:${input.encounterId}`, eventType: "EncounterLocked", payload: lockedPayload },
        ];
        for (const [index, expected] of expectedEvents.entries()) {
          const event = input.events[index];
          if (!event || event.eventId !== expected.eventId || event.eventType !== expected.eventType
            || event.aggregateType !== "encounter" || event.aggregateId !== input.encounterId
            || event.causationId !== input.idempotency.key || event.idempotencyKey !== input.idempotency.key
            || !event.visibilityScope || event.visibilityScope.kind !== "shelter" || event.visibilityScope.shelterId !== shelterId
            || canonicalJson(event.typedPayload) !== canonicalJson(expected.payload)) {
            if (event?.visibilityScope?.kind === "shelter" && event.visibilityScope.shelterId !== shelterId) {
              throw new PersistenceError("OWNERSHIP_DENIED");
            }
            throw new PersistenceError("INVALID_INPUT");
          }
        }

        const missionRevision = this.applyMutation(database, input.worldId, {
          entityType: "mission",
          entityId: input.missionId,
          expectedRevision: input.expectedMissionRevision,
          patch: { encounter_id: input.encounterId, encounter_status: "LOCKED", next_due_world_time: null },
        });
        const attemptRevision = this.applyMutation(database, input.worldId, {
          entityType: "mission_attempt",
          entityId: input.missionAttemptId,
          expectedRevision: input.expectedMissionAttemptRevision,
          patch: { encounter_id: input.encounterId, encounter_status: "LOCKED", next_due_world_time: null },
        });
        database.prepare("INSERT INTO encounter (world_id, encounter_id, state, mission_id, mission_attempt_id, soldier_id, monster_id, soldier_hp, monster_hp, round_number, contact_world_time, engagement_x, engagement_y, terminal_cause, revision, next_due_world_time) VALUES (?, ?, 'LOCKED', ?, ?, ?, ?, 100, 80, 0, ?, ?, ?, NULL, 0, ?)").run(
          input.worldId,
          input.encounterId,
          input.missionId,
          input.missionAttemptId,
          input.soldierId,
          input.monsterId,
          input.worldTime,
          input.engagementPosition.x,
          input.engagementPosition.y,
          input.worldTime,
        );
        if (input.injectFailureAt === "after_state") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        const entityRevisions: Record<string, number> = {
          [`mission:${input.missionId}`]: missionRevision,
          [`mission_attempt:${input.missionAttemptId}`]: attemptRevision,
          [`encounter:${input.encounterId}`]: 0,
        };
        const eventIds: string[] = [];
        for (const event of input.events) {
          const cursor = this.allocateCursor(database, input.worldId);
          eventIds.push(this.persistEvent(database, input.worldId, input.worldTime, cursor, event, entityRevisions, input.idempotency.key).eventId);
        }
        if (input.injectFailureAt === "after_events") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        const encounter = this.getEncounter(input.worldId, input.encounterId);
        if (!encounter) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const result: CommitMonsterContactResult = {
          effect: "encounter_locked",
          contractVersion: this.contractVersion,
          worldId: input.worldId,
          encounterId: input.encounterId,
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          soldierId: input.soldierId,
          monsterId: input.monsterId,
          eventIds,
          encounter,
          worldTime: input.worldTime,
        };
        database.prepare("INSERT INTO idempotency_record (world_id, idempotency_key, binding, request_fingerprint, contract_version, outcome, result_json, event_ids_json) VALUES (?, ?, ?, ?, ?, 'committed', ?, ?)").run(
          input.worldId,
          input.idempotency.key,
          input.idempotency.binding,
          requestFingerprint,
          this.contractVersion,
          canonicalJson(result),
          canonicalJson(eventIds),
        );
        if (input.injectFailureAt === "before_commit") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        return result;
      });
    } catch (error) {
      throw classifyPersistenceError(error, "STORE_OPEN_FAILED");
    }
  }

  commitMonsterCombatRound(input: CommitMonsterCombatRoundInput): CommitMonsterCombatRoundResult {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.encounterId);
    assertNonEmpty(input.missionId);
    assertNonEmpty(input.missionAttemptId);
    assertNonEmpty(input.soldierId);
    assertNonEmpty(input.monsterId);
    assertNonEmpty(input.idempotency.key);
    assertNonEmpty(input.idempotency.binding);
    if (!Number.isSafeInteger(input.worldTime) || input.worldTime < 0
      || !Number.isSafeInteger(input.expectedEncounterRevision) || input.expectedEncounterRevision < 0
      || !Number.isSafeInteger(input.expectedMissionRevision) || input.expectedMissionRevision < 0
      || !Number.isSafeInteger(input.expectedMissionAttemptRevision) || input.expectedMissionAttemptRevision < 0
      || !Number.isSafeInteger(input.expectedSoldierRevision) || input.expectedSoldierRevision < 0
      || !Number.isSafeInteger(input.expectedMonsterRevision) || input.expectedMonsterRevision < 0
      || !Array.isArray(input.events) || (input.events.length !== 1 && input.events.length !== 3 && input.events.length !== 5 && input.events.length !== 6)) {
      throw new PersistenceError("INVALID_INPUT");
    }

    const database = this.db();
    try {
      return withTransaction(database, () => {
        const world = this.requireWorld(input.worldId);
        const requestFingerprint = canonicalJson(input.idempotency.request);
        const existing = rowOf(database.prepare("SELECT binding, request_fingerprint, contract_version, outcome, result_json FROM idempotency_record WHERE world_id = ? AND idempotency_key = ?").get(input.worldId, input.idempotency.key));
        if (existing) {
          if (existing.binding !== input.idempotency.binding || existing.request_fingerprint !== requestFingerprint || existing.contract_version !== this.contractVersion) {
            throw new PersistenceError("DUPLICATE_COMMAND");
          }
          if (existing.outcome === "rejected") {
            const rejection = parseJson<{ errorCode?: unknown }>(String(existing.result_json), "RECOVERY_REQUIRED");
            if (!isPersistenceErrorCode(rejection.errorCode)) {
              throw new PersistenceError("RECOVERY_REQUIRED");
            }
            throw new PersistenceError(rejection.errorCode);
          }
          if (existing.outcome !== "committed") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          const storedResult = parseJson<CommitMonsterCombatRoundResult>(String(existing.result_json), "RECOVERY_REQUIRED");
          if (!storedResult || storedResult.effect !== "combat_round_resolved") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          return { ...storedResult, duplicate: true };
        }
        if (input.worldTime < world.worldTime) {
          throw new PersistenceError("WORLD_TIME_REGRESSION");
        }
        if (input.worldTime > world.worldTime) {
          database.prepare("UPDATE world SET world_time = ? WHERE world_id = ? AND in_progress_world_time IS NULL AND world_time <= ?").run(input.worldTime, input.worldId, input.worldTime);
        }

        const encounterRow = rowOf(database.prepare("SELECT world_id, encounter_id, state, mission_id, mission_attempt_id, soldier_id, monster_id, soldier_hp, monster_hp, round_number, contact_world_time, engagement_x, engagement_y, terminal_cause, revision, next_due_world_time FROM encounter WHERE world_id = ? AND encounter_id = ?").get(input.worldId, input.encounterId));
        const missionRow = rowOf(database.prepare("SELECT world_id, mission_id, soldier_id, state, phase, role, tool, target_id, return_policy, active_attempt_id, encounter_id, encounter_status, monster_reissue_budget, danger_cell_json, waiting_review_reason, revision, work_id, next_due_world_time FROM mission WHERE world_id = ? AND mission_id = ?").get(input.worldId, input.missionId));
        const attemptRow = rowOf(database.prepare("SELECT world_id, mission_attempt_id, mission_id, state, phase, role, tool, equipment_tier, target_id, route_json, home_anchor_json, return_policy, encounter_id, encounter_status, terminal_cause, revision, work_id, next_due_world_time FROM mission_attempt WHERE world_id = ? AND mission_attempt_id = ?").get(input.worldId, input.missionAttemptId));
        const soldierRow = rowOf(database.prepare("SELECT world_id, soldier_id, shelter_id, state, role, tool, revision FROM soldier WHERE world_id = ? AND soldier_id = ?").get(input.worldId, input.soldierId));
        const monsterRow = rowOf(database.prepare("SELECT world_id, monster_id, state, revision FROM monster WHERE world_id = ? AND monster_id = ?").get(input.worldId, input.monsterId));
        if (!encounterRow || !missionRow || !attemptRow || !soldierRow || !monsterRow) {
          throw new PersistenceError("ENTITY_NOT_FOUND");
        }
        const encounter = encounterRecordFromRow(encounterRow);
        const shelterId = requiredString(soldierRow, "shelter_id");
        if (encounter.revision !== input.expectedEncounterRevision
          || requiredInteger(missionRow, "revision") !== input.expectedMissionRevision
          || requiredInteger(attemptRow, "revision") !== input.expectedMissionAttemptRevision
          || requiredInteger(soldierRow, "revision") !== input.expectedSoldierRevision
          || requiredInteger(monsterRow, "revision") !== input.expectedMonsterRevision) {
          throw new PersistenceError("STALE_REVISION");
        }
        const missionRole = optionalString(missionRow, "role");
        const attemptRole = optionalString(attemptRow, "role");
        const soldierRole = optionalString(soldierRow, "role");
        const missionTool = optionalString(missionRow, "tool");
        const attemptTool = optionalString(attemptRow, "tool");
        const soldierTool = optionalString(soldierRow, "tool");
        if (!(encounter.state === "LOCKED" || encounter.state === "RESOLVING")
          || encounter.missionId !== input.missionId
          || encounter.missionAttemptId !== input.missionAttemptId
          || encounter.soldierId !== input.soldierId
          || encounter.monsterId !== input.monsterId
          || requiredString(missionRow, "soldier_id") !== input.soldierId
          || optionalString(missionRow, "encounter_id") !== input.encounterId
          || optionalString(missionRow, "encounter_status") !== encounter.state
          || optionalString(attemptRow, "encounter_id") !== input.encounterId
          || optionalString(attemptRow, "encounter_status") !== encounter.state
          || requiredString(soldierRow, "state") !== "FIELD"
          || (missionRole !== "GATHERER" && missionRole !== "HUNTER")
          || attemptRole !== missionRole
          || soldierRole !== missionRole
          || missionTool !== attemptTool
          || attemptTool !== soldierTool
          || requiredString(monsterRow, "state").toUpperCase() !== "PATROL") {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        if (missionRole === "HUNTER"
          && (encounter.monsterId !== optionalString(missionRow, "target_id")
            || encounter.monsterId !== optionalString(attemptRow, "target_id")
            || missionTool !== "SWORD"
            || requiredInteger(attemptRow, "equipment_tier") !== 1)) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const expectedRound = resolveCombatRoundForPersistence(encounter, missionRole);
        if (canonicalJson(input.resolution) !== canonicalJson(expectedRound)) {
          throw new PersistenceError("INVALID_INPUT");
        }
        const terminal = input.resolution.terminalCause !== null;
        if (terminal && ((missionRole === "GATHERER" && input.resolution.terminalCause !== "GATHERER_LOST")
          || (missionRole === "HUNTER" && input.resolution.terminalCause !== "MONSTER_DEFEATED"))) {
          throw new PersistenceError("ROLE_UNAVAILABLE");
        }
        const budgetBefore = missionReissueBudgetFromRow(missionRow);
        const normalizedReissueRoute = input.reissue
          ? validateMonsterReissuePlan(input.reissue, budgetBefore)
          : null;
        if (input.reissue && (!terminal || missionRole !== "GATHERER")) {
          throw new PersistenceError("INVALID_INPUT");
        }
        if (terminal && missionRole === "GATHERER" && !input.reissue) {
          throw new PersistenceError("INVALID_INPUT");
        }
        if (!input.reissue && input.events.length === 6) {
          throw new PersistenceError("INVALID_INPUT");
        }
        const expectedTerminalEventCount = missionRole === "HUNTER" ? 3 : 6;
        if ((terminal && input.events.length !== expectedTerminalEventCount) || (!terminal && input.events.length !== 1)) {
          throw new PersistenceError("INVALID_INPUT");
        }
        const cargo = missionRole === "GATHERER" && terminal ? cargoRecordsFor(database, input.worldId, { soldierId: input.soldierId }) : [];
        if (missionRole === "GATHERER" && terminal) {
          const attemptCargo = cargoRecordsFor(database, input.worldId, { missionAttemptId: input.missionAttemptId });
          if (attemptCargo.length !== cargo.length || cargo.some((item) => item.missionAttemptId !== input.missionAttemptId)
            || cargo.some((item) => item.worldId !== input.worldId || item.soldierId !== input.soldierId || item.missionAttemptId !== input.missionAttemptId
              || item.resourceType !== "wood" && item.resourceType !== "rock" || item.sourceNodeId === null || item.quantity <= 0
              || item.capacityUsed !== item.quantity || item.acquiredWorldTime === null || item.acquiredWorldTime > input.worldTime)) {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          for (const item of cargo) {
            const source = rowOf(database.prepare("SELECT resource_type FROM resource_node WHERE world_id = ? AND resource_node_id = ?").get(input.worldId, item.sourceNodeId));
            if (!source || requiredString(source, "resource_type") !== item.resourceType) {
              throw new PersistenceError("RECOVERY_REQUIRED");
            }
          }
        }
        const currentRoute = optionalRoute(attemptRow, "route_json");
        const currentHomeAnchor = optionalAnchor(attemptRow, "home_anchor_json");
        if (input.reissue && normalizedReissueRoute
          && (!currentRoute || !currentHomeAnchor
            || normalizedReissueRoute.source.x !== currentHomeAnchor.x
            || normalizedReissueRoute.source.y !== currentHomeAnchor.y
            || normalizedReissueRoute.target.x !== currentRoute.target.x
            || normalizedReissueRoute.target.y !== currentRoute.target.y)) {
          throw new PersistenceError("INVALID_INPUT");
        }
        const roleFields = missionRole === "HUNTER" ? { role: missionRole, tool: missionTool } : {};
        const expectedEventIds = terminal
          ? missionRole === "HUNTER"
            ? [
              `combat-round:${input.encounterId}:${input.resolution.roundNumber}`,
              `encounter-resolved:${input.encounterId}`,
              `monster-defeated:${input.encounterId}`,
            ]
            : [
              `combat-round:${input.encounterId}:${input.resolution.roundNumber}`,
              `encounter-resolved:${input.encounterId}`,
              `cargo-lost-to-monster:${input.encounterId}`,
              `soldier-died:${input.encounterId}`,
              `soldier-respawned:${input.encounterId}`,
              ...(input.reissue ? [`mission-reissued:${input.missionAttemptId}`] : []),
            ]
          : [`combat-round:${input.encounterId}:${input.resolution.roundNumber}`];
        const cargoItems = cargo.map((item) => ({
          cargoId: item.cargoId,
          sourceNodeId: item.sourceNodeId,
          resourceType: item.resourceType,
          quantity: item.quantity,
          capacityUsed: item.capacityUsed,
          acquiredWorldTime: item.acquiredWorldTime,
        }));
        const cargoLostQuantity = cargo.reduce((total, item) => total + item.quantity, 0);
        const cargoLostCapacityUsed = cargo.reduce((total, item) => total + item.capacityUsed, 0);
        const expectedPayloads: unknown[] = [
          {
            encounterId: input.encounterId,
            missionId: input.missionId,
            missionAttemptId: input.missionAttemptId,
            soldierId: input.soldierId,
            monsterId: input.monsterId,
            ...roleFields,
            round: input.resolution,
            worldTime: input.worldTime,
          },
        ];
        if (terminal) {
          if (missionRole === "HUNTER") {
            expectedPayloads.push(
              { encounterId: input.encounterId, missionId: input.missionId, missionAttemptId: input.missionAttemptId, soldierId: input.soldierId, monsterId: input.monsterId, ...roleFields, state: "RESOLVED", terminalCause: "MONSTER_DEFEATED", worldTime: input.worldTime },
              { encounterId: input.encounterId, missionId: input.missionId, missionAttemptId: input.missionAttemptId, soldierId: input.soldierId, monsterId: input.monsterId, ...roleFields, state: "DEAD", reason: "HUNTER_VICTORY", worldTime: input.worldTime },
            );
          } else {
            expectedPayloads.push(
              { encounterId: input.encounterId, missionId: input.missionId, missionAttemptId: input.missionAttemptId, soldierId: input.soldierId, monsterId: input.monsterId, state: "RESOLVED", terminalCause: "GATHERER_LOST", worldTime: input.worldTime },
              { encounterId: input.encounterId, missionId: input.missionId, missionAttemptId: input.missionAttemptId, soldierId: input.soldierId, monsterId: input.monsterId, items: cargoItems, totalQuantity: cargoLostQuantity, totalCapacityUsed: cargoLostCapacityUsed, reason: "MONSTER_KILLED_SOLDIER", worldTime: input.worldTime },
              { encounterId: input.encounterId, missionId: input.missionId, missionAttemptId: input.missionAttemptId, soldierId: input.soldierId, monsterId: input.monsterId, cause: "MONSTER", cargoQuantityLost: cargoLostQuantity, worldTime: input.worldTime },
              { encounterId: input.encounterId, missionId: input.missionId, missionAttemptId: input.missionAttemptId, soldierId: input.soldierId, monsterId: input.monsterId, shelterId, cause: "MONSTER", worldTime: input.worldTime },
            );
            if (input.reissue) {
              expectedPayloads.push({
                missionId: input.missionId,
                missionAttemptId: input.missionAttemptId,
                soldierId: input.soldierId,
                role: missionRole,
                tool: missionTool,
                targetId: optionalString(missionRow, "target_id"),
                previousAttemptId: input.missionAttemptId,
                newAttemptId: input.reissue.newMissionAttemptId,
                budgetBefore,
                budgetAfter: 0,
                dangerCell: input.reissue.dangerCell,
                route: normalizedReissueRoute,
                outcome: input.reissue.outcome,
                reason: input.reissue.reason,
                worldTime: input.worldTime,
              });
            }
          }
        }
        const expectedEventTypes = terminal
          ? missionRole === "HUNTER"
            ? ["BattleRoundResolved", "EncounterResolved", "MonsterDefeated"]
            : ["BattleRoundResolved", "EncounterResolved", "CargoLostToMonster", "SoldierDied", "SoldierRespawned", ...(input.reissue ? ["MissionReissued"] : [])]
          : ["BattleRoundResolved"];
        for (let index = 0; index < input.events.length; index += 1) {
          const event = input.events[index];
          if (!event || event.eventId !== expectedEventIds[index] || event.eventType !== expectedEventTypes[index]
            || event.causationId !== input.idempotency.key || event.idempotencyKey !== input.idempotency.key
            || !event.visibilityScope || event.visibilityScope.kind !== "shelter" || event.visibilityScope.shelterId !== shelterId
            || canonicalJson(event.typedPayload) !== canonicalJson(expectedPayloads[index])) {
            if (event?.visibilityScope?.kind === "shelter" && event.visibilityScope.shelterId !== shelterId) {
              throw new PersistenceError("OWNERSHIP_DENIED");
            }
            throw new PersistenceError("INVALID_INPUT");
          }
          const expectedAggregate = expectedEventTypes[index] === "BattleRoundResolved" || expectedEventTypes[index] === "EncounterResolved"
            ? { type: "encounter", id: input.encounterId }
            : expectedEventTypes[index] === "CargoLostToMonster" || expectedEventTypes[index] === "MissionReissued"
              ? { type: "mission", id: input.missionId }
              : expectedEventTypes[index] === "MonsterDefeated"
                ? { type: "monster", id: input.monsterId }
                : { type: "soldier", id: input.soldierId };
          if (event.aggregateType !== expectedAggregate.type || event.aggregateId !== expectedAggregate.id) {
            throw new PersistenceError("INVALID_INPUT");
          }
        }

        if (terminal) {
          for (const item of cargo) {
            const deleted = database.prepare("DELETE FROM cargo WHERE world_id = ? AND cargo_id = ? AND revision = ?").run(input.worldId, item.cargoId, item.revision);
            if (deleted.changes !== 1) {
              throw new PersistenceError("STALE_REVISION");
            }
          }
          if (input.injectFailureAt === "after_cargo") {
            throw new PersistenceError("INJECTED_FAILURE");
          }
        }
        const soldierHpAfter = missionRole === "HUNTER"
          ? (input.resolution as HunterCombatRoundResolution).hunterHpAfter
          : (input.resolution as CombatRoundResolution).gathererHpAfter;
        const monsterHpAfter = input.resolution.monsterHpAfter;
        const encounterRevision = this.applyMutation(database, input.worldId, {
          entityType: "encounter",
          entityId: input.encounterId,
          expectedRevision: input.expectedEncounterRevision,
          patch: {
            state: terminal ? "RESOLVED" : "RESOLVING",
            soldier_hp: soldierHpAfter,
            monster_hp: monsterHpAfter,
            round_number: input.resolution.roundNumber,
            terminal_cause: terminal ? input.resolution.terminalCause : null,
            next_due_world_time: terminal ? null : input.worldTime + 1,
          },
        });
        let missionRevision = input.expectedMissionRevision;
        let missionAttemptRevision = input.expectedMissionAttemptRevision;
        let newMissionAttemptRevision: number | null = null;
        let soldierRevision = input.expectedSoldierRevision;
        let monsterRevision = input.expectedMonsterRevision;
        let reissueResult: CommitMonsterCombatRoundResult["reissue"] = null;
        if (!terminal && encounter.state === "LOCKED") {
          missionRevision = this.applyMutation(database, input.worldId, {
            entityType: "mission",
            entityId: input.missionId,
            expectedRevision: input.expectedMissionRevision,
            patch: { encounter_status: "RESOLVING" },
          });
          missionAttemptRevision = this.applyMutation(database, input.worldId, {
            entityType: "mission_attempt",
            entityId: input.missionAttemptId,
            expectedRevision: input.expectedMissionAttemptRevision,
            patch: { encounter_status: "RESOLVING" },
          });
        } else if (terminal && missionRole === "GATHERER") {
          const reissue = input.reissue;
          const terminalAttemptPatch = {
            state: "COMPLETED",
            phase: "TERMINAL",
            encounter_id: null,
            encounter_status: null,
            terminal_cause: "GATHERER_LOST",
            work_id: null,
            next_due_world_time: null,
            claim_id: null,
            lease_expires_at_wall_ms: null,
          } as const;
          missionAttemptRevision = this.applyMutation(database, input.worldId, {
            entityType: "mission_attempt",
            entityId: input.missionAttemptId,
            expectedRevision: input.expectedMissionAttemptRevision,
            patch: terminalAttemptPatch,
          });
          if (reissue?.outcome === "REISSUED") {
            const route = normalizedReissueRoute;
            const newMissionAttemptId = reissue.newMissionAttemptId;
            const returnPolicy = optionalMissionReturnPolicy(missionRow, "return_policy");
            const targetId = optionalString(missionRow, "target_id");
            if (!route || !currentHomeAnchor || !returnPolicy || !targetId || !newMissionAttemptId
              || database.prepare("SELECT 1 FROM mission_attempt WHERE world_id = ? AND mission_attempt_id = ?").get(input.worldId, newMissionAttemptId)) {
              throw new PersistenceError("RECOVERY_REQUIRED");
            }
            const nextDueWorldTime = input.worldTime + route.estimatedTravelWorldSeconds;
            if (!Number.isSafeInteger(nextDueWorldTime)) {
              throw new PersistenceError("INVALID_INPUT");
            }
            soldierRevision = this.applyMutation(database, input.worldId, {
              entityType: "soldier",
              entityId: input.soldierId,
              expectedRevision: input.expectedSoldierRevision,
              patch: { state: "FIELD", role: "GATHERER", tool: missionTool, work_id: `mission-attempt:${newMissionAttemptId}`, next_due_world_time: null, claim_id: null, lease_expires_at_wall_ms: null },
            });
            missionRevision = this.applyMutation(database, input.worldId, {
              entityType: "mission",
              entityId: input.missionId,
              expectedRevision: input.expectedMissionRevision,
              patch: {
                state: "ACTIVE",
                phase: "TRAVELLING",
                role: "GATHERER",
                tool: missionTool,
                target_id: targetId,
                return_policy: returnPolicy,
                active_attempt_id: newMissionAttemptId,
                encounter_id: null,
                encounter_status: null,
                monster_reissue_budget: 0,
                danger_cell_json: canonicalJson(reissue.dangerCell),
                waiting_review_reason: null,
                work_id: `mission-attempt:${newMissionAttemptId}`,
                next_due_world_time: nextDueWorldTime,
                claim_id: null,
                lease_expires_at_wall_ms: null,
              },
            });
            database.prepare("INSERT INTO mission_attempt (world_id, mission_attempt_id, mission_id, state, phase, role, tool, equipment_tier, target_id, route_json, home_anchor_json, return_policy, encounter_id, encounter_status, terminal_cause, start_world_time, last_transition_world_time, revision, work_id, next_due_world_time) VALUES (?, ?, ?, 'ACTIVE', 'TRAVELLING', ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, 0, ?, ?)").run(
              input.worldId,
              newMissionAttemptId,
              input.missionId,
              "GATHERER",
              missionTool,
              requiredInteger(attemptRow, "equipment_tier"),
              targetId,
              canonicalJson(route),
              canonicalJson(currentHomeAnchor),
              returnPolicy,
              input.worldTime,
              input.worldTime,
              `mission-attempt:${newMissionAttemptId}`,
              nextDueWorldTime,
            );
            newMissionAttemptRevision = 0;
          } else {
            soldierRevision = this.applyMutation(database, input.worldId, {
              entityType: "soldier",
              entityId: input.soldierId,
              expectedRevision: input.expectedSoldierRevision,
              patch: { state: "AT_SHELTER", role: null, tool: null, work_id: null, next_due_world_time: null, claim_id: null, lease_expires_at_wall_ms: null },
            });
            missionRevision = this.applyMutation(database, input.worldId, {
              entityType: "mission",
              entityId: input.missionId,
              expectedRevision: input.expectedMissionRevision,
              patch: {
                state: "COMPLETED",
                phase: reissue?.outcome === "WAITING_REVIEW" ? "WAITING_REVIEW" : "AT_SHELTER",
                role: null,
                tool: null,
                target_id: null,
                return_policy: null,
                active_attempt_id: null,
                encounter_id: null,
                encounter_status: null,
                monster_reissue_budget: reissue ? 0 : budgetBefore,
                danger_cell_json: reissue ? canonicalJson(reissue.dangerCell) : null,
                waiting_review_reason: reissue?.reason ?? null,
                work_id: null,
                next_due_world_time: null,
                claim_id: null,
                lease_expires_at_wall_ms: null,
              },
            });
          }
          if (reissue) {
            reissueResult = {
              outcome: reissue.outcome,
              dangerCell: { ...reissue.dangerCell },
              reason: reissue.reason,
              previousMissionAttemptId: input.missionAttemptId,
              newMissionAttemptId: reissue.newMissionAttemptId,
              budgetBefore,
              budgetAfter: 0,
              route: normalizedReissueRoute,
            };
          }
        } else if (terminal && missionRole === "HUNTER") {
          monsterRevision = this.applyMutation(database, input.worldId, {
            entityType: "monster",
            entityId: input.monsterId,
            expectedRevision: input.expectedMonsterRevision,
            patch: { state: "DEAD", next_due_world_time: null, work_id: null, claim_id: null, lease_expires_at_wall_ms: null },
          });
          missionRevision = this.applyMutation(database, input.worldId, {
            entityType: "mission",
            entityId: input.missionId,
            expectedRevision: input.expectedMissionRevision,
            patch: { phase: "RETURNING", encounter_id: null, encounter_status: null, next_due_world_time: null },
          });
          missionAttemptRevision = this.applyMutation(database, input.worldId, {
            entityType: "mission_attempt",
            entityId: input.missionAttemptId,
            expectedRevision: input.expectedMissionAttemptRevision,
            patch: { phase: "RETURNING", last_transition_world_time: input.worldTime, encounter_id: null, encounter_status: null, terminal_cause: "MONSTER_DEFEATED", next_due_world_time: null },
          });
        }
        if (input.injectFailureAt === "after_state") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        const entityRevisions: Record<string, number> = {
          [`encounter:${input.encounterId}`]: encounterRevision,
          [`mission:${input.missionId}`]: missionRevision,
          [`mission_attempt:${input.missionAttemptId}`]: missionAttemptRevision,
          [`soldier:${input.soldierId}`]: soldierRevision,
          ...(reissueResult?.newMissionAttemptId
            ? { [`mission_attempt:${reissueResult.newMissionAttemptId}`]: newMissionAttemptRevision ?? 0 }
            : {}),
          ...(missionRole === "HUNTER" && terminal ? { [`monster:${input.monsterId}`]: monsterRevision } : {}),
        };
        const eventIds: string[] = [];
        const cursors: number[] = [];
        const persistedEvents: PersistedDomainEvent[] = [];
        for (const event of input.events) {
          const cursor = this.allocateCursor(database, input.worldId);
          const persisted = this.persistEvent(database, input.worldId, input.worldTime, cursor, event, entityRevisions, input.idempotency.key);
          eventIds.push(persisted.eventId);
          cursors.push(cursor);
          persistedEvents.push(persisted);
        }
        if (input.injectFailureAt === "after_events") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        if (input.signalEligibility) {
          this.upsertSignal(database, input.worldId, input.worldTime, input.signalEligibility, persistedEvents, cursors);
        }
        if (input.injectFailureAt === "after_signal") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        const persistedEncounter = this.getEncounter(input.worldId, input.encounterId);
        if (!persistedEncounter) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const result: CommitMonsterCombatRoundResult = {
          effect: "combat_round_resolved",
          contractVersion: this.contractVersion,
          worldId: input.worldId,
          encounterId: input.encounterId,
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          soldierId: input.soldierId,
          monsterId: input.monsterId,
          eventIds,
          round: input.resolution,
          encounter: persistedEncounter,
          cargoLostQuantity,
          cargoLostCapacityUsed,
          reissue: reissueResult,
          worldTime: input.worldTime,
        };
        database.prepare("INSERT INTO idempotency_record (world_id, idempotency_key, binding, request_fingerprint, contract_version, outcome, result_json, event_ids_json) VALUES (?, ?, ?, ?, ?, 'committed', ?, ?)").run(
          input.worldId,
          input.idempotency.key,
          input.idempotency.binding,
          requestFingerprint,
          this.contractVersion,
          canonicalJson(result),
          canonicalJson(eventIds),
        );
        if (input.injectFailureAt === "before_commit") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        return result;
      });
    } catch (error) {
      throw classifyPersistenceError(error, "STORE_OPEN_FAILED");
    }
  }

  listMissions(worldId: string): MissionRecord[] {
    this.requireWorld(worldId);
    const rows = this.db().prepare("SELECT world_id, mission_id, soldier_id, state, phase, role, tool, target_id, return_policy, active_attempt_id, encounter_id, encounter_status, next_due_world_time, monster_reissue_budget, danger_cell_json, waiting_review_reason, revision FROM mission WHERE world_id = ? ORDER BY mission_id ASC").all(worldId) as Row[];
    return rows.map(missionRecordFromRow);
  }

  getMission(worldId: string, missionId: string): MissionRecord | null {
    const row = rowOf(this.db().prepare("SELECT world_id, mission_id, soldier_id, state, phase, role, tool, target_id, return_policy, active_attempt_id, encounter_id, encounter_status, next_due_world_time, monster_reissue_budget, danger_cell_json, waiting_review_reason, revision FROM mission WHERE world_id = ? AND mission_id = ?").get(worldId, missionId));
    return row ? missionRecordFromRow(row) : null;
  }

  listMissionAttempts(worldId: string, missionId?: string): MissionAttemptRecord[] {
    this.requireWorld(worldId);
    const rows = missionId === undefined
      ? this.db().prepare("SELECT world_id, mission_attempt_id, mission_id, state, phase, role, tool, equipment_tier, target_id, route_json, home_anchor_json, return_policy, encounter_id, encounter_status, terminal_cause, start_world_time, last_transition_world_time, next_due_world_time, revision FROM mission_attempt WHERE world_id = ? ORDER BY mission_attempt_id ASC").all(worldId)
      : this.db().prepare("SELECT world_id, mission_attempt_id, mission_id, state, phase, role, tool, equipment_tier, target_id, route_json, home_anchor_json, return_policy, encounter_id, encounter_status, terminal_cause, start_world_time, last_transition_world_time, next_due_world_time, revision FROM mission_attempt WHERE world_id = ? AND mission_id = ? ORDER BY mission_attempt_id ASC").all(worldId, missionId);
    return (rows as Row[]).map(missionAttemptRecordFromRow);
  }

  getMissionAttempt(worldId: string, missionAttemptId: string): MissionAttemptRecord | null {
    const row = rowOf(this.db().prepare("SELECT world_id, mission_attempt_id, mission_id, state, phase, role, tool, equipment_tier, target_id, route_json, home_anchor_json, return_policy, encounter_id, encounter_status, terminal_cause, start_world_time, last_transition_world_time, next_due_world_time, revision FROM mission_attempt WHERE world_id = ? AND mission_attempt_id = ?").get(worldId, missionAttemptId));
    return row ? missionAttemptRecordFromRow(row) : null;
  }

  listDueMissionAttempts(worldId: string, worldTime: number): MissionAttemptRecord[] {
    assertNonEmpty(worldId);
    if (!Number.isSafeInteger(worldTime) || worldTime < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    this.requireWorld(worldId);
    const rows = this.db().prepare("SELECT world_id, mission_attempt_id, mission_id, state, phase, role, tool, equipment_tier, target_id, route_json, home_anchor_json, return_policy, encounter_id, encounter_status, terminal_cause, start_world_time, last_transition_world_time, next_due_world_time, revision FROM mission_attempt WHERE world_id = ? AND state IN ('ACTIVE', 'active') AND phase = 'TRAVELLING' AND next_due_world_time IS NOT NULL AND next_due_world_time <= ? ORDER BY next_due_world_time ASC, mission_attempt_id ASC").all(worldId, worldTime) as Row[];
    return rows.map(missionAttemptRecordFromRow);
  }

  listDueMissionExtractionAttempts(worldId: string, worldTime: number): MissionAttemptRecord[] {
    assertNonEmpty(worldId);
    if (!Number.isSafeInteger(worldTime) || worldTime < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    this.requireWorld(worldId);
    const rows = this.db().prepare("SELECT world_id, mission_attempt_id, mission_id, state, phase, role, tool, equipment_tier, target_id, route_json, home_anchor_json, return_policy, encounter_id, encounter_status, terminal_cause, start_world_time, last_transition_world_time, next_due_world_time, revision FROM mission_attempt WHERE world_id = ? AND state IN ('ACTIVE', 'active') AND phase = 'WORKING' AND next_due_world_time IS NOT NULL AND next_due_world_time <= ? ORDER BY next_due_world_time ASC, mission_attempt_id ASC").all(worldId, worldTime) as Row[];
    return rows.map(missionAttemptRecordFromRow);
  }

  advanceWorldTime(worldId: string, worldTime: number): WorldRecord {
    assertNonEmpty(worldId);
    if (!Number.isSafeInteger(worldTime) || worldTime < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }

    const database = this.db();
    return withTransaction(database, () => {
      const world = this.requireWorld(worldId);
      if (world.inProgressWorldTime !== null) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      if (worldTime < world.worldTime) {
        throw new PersistenceError("WORLD_TIME_REGRESSION");
      }
      if (worldTime > world.worldTime) {
        const result = database.prepare("UPDATE world SET world_time = ? WHERE world_id = ? AND world_time <= ?").run(worldTime, worldId, worldTime);
        if (result.changes !== 1) {
          const latest = this.getWorld(worldId);
          if (!latest) {
            throw new PersistenceError("WORLD_NOT_FOUND");
          }
          if (worldTime < latest.worldTime) {
            throw new PersistenceError("WORLD_TIME_REGRESSION");
          }
        }
      }
      return this.getWorld(worldId) as WorldRecord;
    });
  }

  beginWorldBoundary(worldId: string, worldTime: number): WorldRecord {
    assertNonEmpty(worldId);
    if (!Number.isSafeInteger(worldTime) || worldTime < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    return withTransaction(this.db(), () => {
      const world = this.requireWorld(worldId);
      if (world.inProgressWorldTime !== null) {
        if (world.inProgressWorldTime !== worldTime) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        return world;
      }
      if (worldTime !== world.worldTime + 1) {
        throw new PersistenceError(worldTime <= world.worldTime ? "WORLD_TIME_REGRESSION" : "RECOVERY_REQUIRED");
      }
      const result = this.db().prepare("UPDATE world SET in_progress_world_time = ? WHERE world_id = ? AND world_time = ? AND in_progress_world_time IS NULL").run(worldTime, worldId, world.worldTime);
      if (result.changes !== 1) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      return this.getWorld(worldId) as WorldRecord;
    });
  }

  /**
   * Initialize the one trusted server-time anchor for an autonomous world.
   * A world that already has an anchor is returned unchanged so a repeated
   * startup attempt cannot move the anchor backwards or double-count downtime.
   */
  initializeServerTimeAnchor(worldId: string, serverTimeAnchorMs: number): WorldRecord {
    assertNonEmpty(worldId);
    if (!Number.isSafeInteger(serverTimeAnchorMs) || serverTimeAnchorMs < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    return withTransaction(this.db(), () => {
      const world = this.requireWorld(worldId);
      if (world.serverTimeAnchorMs !== null) {
        return world;
      }
      const result = this.db().prepare("UPDATE world SET server_time_anchor_ms = ? WHERE world_id = ? AND server_time_anchor_ms IS NULL").run(serverTimeAnchorMs, worldId);
      if (result.changes !== 1) {
        const latest = this.requireWorld(worldId);
        if (latest.serverTimeAnchorMs === null) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        return latest;
      }
      const initialized = this.getWorld(worldId);
      if (!initialized || initialized.serverTimeAnchorMs !== serverTimeAnchorMs) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      return initialized;
    });
  }

  completeWorldBoundary(worldId: string, worldTime: number, serverTimeAnchorMs?: number): WorldRecord {
    assertNonEmpty(worldId);
    if (!Number.isSafeInteger(worldTime) || worldTime < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (serverTimeAnchorMs !== undefined && (!Number.isSafeInteger(serverTimeAnchorMs) || serverTimeAnchorMs < 0)) {
      throw new PersistenceError("INVALID_INPUT");
    }
    return withTransaction(this.db(), () => {
      const world = this.requireWorld(worldId);
      if (world.inProgressWorldTime !== worldTime || worldTime !== world.worldTime + 1) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      if (serverTimeAnchorMs !== undefined && world.serverTimeAnchorMs !== null && serverTimeAnchorMs < world.serverTimeAnchorMs) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const result = serverTimeAnchorMs === undefined
        ? this.db().prepare("UPDATE world SET world_time = ?, in_progress_world_time = NULL WHERE world_id = ? AND world_time = ? AND in_progress_world_time = ?").run(worldTime, worldId, world.worldTime, worldTime)
        : this.db().prepare("UPDATE world SET world_time = ?, in_progress_world_time = NULL, server_time_anchor_ms = ? WHERE world_id = ? AND world_time = ? AND in_progress_world_time = ?").run(worldTime, serverTimeAnchorMs, worldId, world.worldTime, worldTime);
      if (result.changes !== 1) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      return this.getWorld(worldId) as WorldRecord;
    });
  }

  getPlayer(worldId: string, playerId: string): PlayerRecord | null {
    const row = rowOf(this.db().prepare("SELECT world_id, player_id, binding, revision, position_x, position_y, explored_cells_json FROM player WHERE world_id = ? AND player_id = ?").get(worldId, playerId));
    if (!row) {
      return null;
    }
    return playerRecordFromRow(row);
  }

  getShelter(worldId: string, shelterId: string): ShelterRecord | null {
    const row = rowOf(this.db().prepare("SELECT world_id, shelter_id, player_id, revision, coins FROM shelter WHERE world_id = ? AND shelter_id = ?").get(worldId, shelterId));
    if (!row) {
      return null;
    }
    return { worldId: requiredString(row, "world_id"), shelterId: requiredString(row, "shelter_id"), playerId: requiredString(row, "player_id"), revision: requiredNumber(row, "revision"), coins: requiredNumber(row, "coins") };
  }

  events(worldId: string): PersistedDomainEvent[] {
    this.requireWorld(worldId);
    const rows = this.db().prepare("SELECT event_id, event_version, contract_version, event_type, world_id, world_event_cursor, world_time, causation_id, idempotency_key, aggregate_type, aggregate_id, aggregate_revision, visibility_scope_json, typed_payload_json, affected_entity_revisions_json FROM domain_event WHERE world_id = ? ORDER BY world_event_cursor ASC").all(worldId) as Row[];
    return rows.map((row) => this.parseEventRow(row));
  }

  /** Return the authoritative world cursor for one persisted event identity. */
  eventCursor(worldId: string, eventId: string): number | null {
    assertNonEmpty(worldId);
    assertNonEmpty(eventId);
    this.requireWorld(worldId);
    const row = rowOf(this.db().prepare(
      "SELECT world_event_cursor FROM domain_event WHERE world_id = ? AND event_id = ?",
    ).get(worldId, eventId));
    return row ? requiredInteger(row, "world_event_cursor") : null;
  }

  reentryEventContext(worldId: string, signalId: string): ReentryEventContext | null {
    assertNonEmpty(worldId);
    assertNonEmpty(signalId);
    this.requireWorld(worldId);
    const row = rowOf(this.db().prepare(
      "SELECT world_id, signal_id, opaque_binding, event_sequence, occurred_at, state_version FROM reentry_event_context WHERE world_id = ? AND signal_id = ?",
    ).get(worldId, signalId));
    return row ? this.parseReentryEventContext(row) : null;
  }

  /**
   * Allocate or replay the external sequence for one Game signal. The caller
   * supplies the durable signal identity and occurrence snapshot; this method
   * owns the only transaction that advances a binding's sequence.
   */
  prepareReentryEventContext(input: ReentryEventContextInput): ReentryEventContext {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.signalId);
    assertNonEmpty(input.opaqueBinding);
    assertCanonicalIsoTimestamp(input.occurredAt);
    assertNonNegativeSafeInteger(input.stateVersion);

    return withTransaction(this.db(), () => {
      this.requireWorld(input.worldId);
      const existingRow = rowOf(this.db().prepare(
        "SELECT world_id, signal_id, opaque_binding, event_sequence, occurred_at, state_version FROM reentry_event_context WHERE world_id = ? AND signal_id = ?",
      ).get(input.worldId, input.signalId));
      if (existingRow) {
        const existing = this.parseReentryEventContext(existingRow);
        if (existing.opaqueBinding !== input.opaqueBinding
          || existing.occurredAt !== input.occurredAt
          || existing.stateVersion !== input.stateVersion) {
          throw new PersistenceError("EVENT_CONFLICT");
        }
        return existing;
      }

      this.db().prepare(
        "INSERT OR IGNORE INTO reentry_binding_sequence (world_id, opaque_binding, next_event_sequence) VALUES (?, ?, 1)",
      ).run(input.worldId, input.opaqueBinding);
      const sequenceRow = rowOf(this.db().prepare(
        "SELECT next_event_sequence FROM reentry_binding_sequence WHERE world_id = ? AND opaque_binding = ?",
      ).get(input.worldId, input.opaqueBinding));
      if (!sequenceRow) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const eventSequence = requiredInteger(sequenceRow, "next_event_sequence");
      if (eventSequence < 1) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const nextSequence = eventSequence + 1;
      if (!Number.isSafeInteger(nextSequence)) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const advanced = this.db().prepare(
        "UPDATE reentry_binding_sequence SET next_event_sequence = ?, updated_at = CURRENT_TIMESTAMP WHERE world_id = ? AND opaque_binding = ? AND next_event_sequence = ?",
      ).run(nextSequence, input.worldId, input.opaqueBinding, eventSequence);
      if (advanced.changes !== 1) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      try {
        this.db().prepare(
          "INSERT INTO reentry_event_context (world_id, signal_id, opaque_binding, event_sequence, occurred_at, state_version) VALUES (?, ?, ?, ?, ?, ?)",
        ).run(input.worldId, input.signalId, input.opaqueBinding, eventSequence, input.occurredAt, input.stateVersion);
      } catch (error) {
        throw new PersistenceError("EVENT_CONFLICT", { cause: error });
      }
      return {
        worldId: input.worldId,
        signalId: input.signalId,
        opaqueBinding: input.opaqueBinding,
        eventSequence,
        occurredAt: input.occurredAt,
        stateVersion: input.stateVersion,
      };
    });
  }

  idempotency(worldId: string, key: string): IdempotencyRecord | null {
    const row = rowOf(this.db().prepare("SELECT world_id, idempotency_key, binding, request_fingerprint, contract_version, outcome, result_json, event_ids_json FROM idempotency_record WHERE world_id = ? AND idempotency_key = ?").get(worldId, key));
    if (!row) {
      return null;
    }
    const outcome = row.outcome === "committed" || row.outcome === "rejected" ? row.outcome : null;
    if (!outcome) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    return {
      worldId: requiredString(row, "world_id"),
      key: requiredString(row, "idempotency_key"),
      binding: requiredString(row, "binding"),
      requestFingerprint: requiredString(row, "request_fingerprint"),
      contractVersion: requiredString(row, "contract_version"),
      outcome,
      result: parseJson(row.result_json as string, "RECOVERY_REQUIRED"),
      eventIds: parseJson<string[]>(row.event_ids_json as string, "RECOVERY_REQUIRED"),
    };
  }

  commitTransition(input: CommitTransitionInput): CommitTransitionResult {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.idempotency.key);
    assertNonEmpty(input.idempotency.binding);
    if (!Number.isInteger(input.worldTime) || input.worldTime < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }

    const database = this.db();
    try {
      return withTransaction(database, () => {
      const world = this.requireWorld(input.worldId);
      const requestFingerprint = canonicalJson(input.idempotency.request);
      const existing = rowOf(database.prepare("SELECT binding, request_fingerprint, contract_version, outcome, result_json, event_ids_json FROM idempotency_record WHERE world_id = ? AND idempotency_key = ?").get(input.worldId, input.idempotency.key));
      if (existing) {
        if (existing.binding !== input.idempotency.binding || existing.request_fingerprint !== requestFingerprint || existing.contract_version !== this.contractVersion) {
          throw new PersistenceError("DUPLICATE_COMMAND");
        }
        if (existing.outcome === "rejected") {
          const rejection = parseJson<{ errorCode?: unknown }>(existing.result_json as string, "RECOVERY_REQUIRED");
          if (!isPersistenceErrorCode(rejection.errorCode)) {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          throw new PersistenceError(rejection.errorCode);
        }
        if (existing.outcome !== "committed") {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const storedResult = parseJson<CommitTransitionResult>(existing.result_json as string, "RECOVERY_REQUIRED");
        return { ...storedResult, duplicate: true };
      }

      if (input.worldTime < world.worldTime) {
        throw new PersistenceError("WORLD_TIME_REGRESSION");
      }
      if (input.worldTime > world.worldTime) {
        database.prepare("UPDATE world SET world_time = ? WHERE world_id = ? AND in_progress_world_time IS NULL AND world_time <= ?").run(input.worldTime, input.worldId, input.worldTime);
      }

      const entityRevisions: Record<string, number> = {};
      for (const mutation of input.stateMutations) {
        const revision = this.applyMutation(database, input.worldId, mutation);
        entityRevisions[`${mutation.entityType}:${mutation.entityId}`] = revision;
      }
      if (input.injectFailureAt === "after_state") {
        throw new PersistenceError("INJECTED_FAILURE");
      }

      const eventIds: string[] = [];
      const cursors: number[] = [];
      const persistedEvents: PersistedDomainEvent[] = [];
      const seenEventIds = new Set<string>();
      for (const event of input.events) {
        const duplicateInCommand = seenEventIds.has(event.eventId);
        const existingEvent = this.findEvent(database, event.eventId);
        if (existingEvent) {
          if (!duplicateInCommand && input.stateMutations.length > 0) {
            throw new PersistenceError("EVENT_CONFLICT");
          }
          this.assertEventMatches(existingEvent, input.worldId, input.worldTime, event, input.idempotency.key, entityRevisions);
          if (duplicateInCommand) {
            continue;
          }
          seenEventIds.add(event.eventId);
          eventIds.push(existingEvent.eventId);
          cursors.push(existingEvent.worldEventCursor);
          persistedEvents.push(existingEvent);
          continue;
        }
        const cursor = this.allocateCursor(database, input.worldId);
        const persisted = this.persistEvent(database, input.worldId, input.worldTime, cursor, event, entityRevisions, input.idempotency.key);
        seenEventIds.add(event.eventId);
        eventIds.push(persisted.eventId);
        cursors.push(cursor);
        persistedEvents.push(persisted);
      }
      if (input.injectFailureAt === "after_events") {
        throw new PersistenceError("INJECTED_FAILURE");
      }

      const signalId = input.signalEligibility ? this.upsertSignal(database, input.worldId, input.worldTime, input.signalEligibility, persistedEvents, cursors) : null;
      if (input.injectFailureAt === "after_signal") {
        throw new PersistenceError("INJECTED_FAILURE");
      }
      const result: CommitTransitionResult = {
        eventIds,
        worldEventCursorStart: cursors.length > 0 ? Math.min(...cursors) : null,
        worldEventCursorEnd: cursors.length > 0 ? Math.max(...cursors) : null,
        entityRevisions,
        signalId,
      };

      database.prepare("INSERT INTO idempotency_record (world_id, idempotency_key, binding, request_fingerprint, contract_version, outcome, result_json, event_ids_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
        input.worldId,
        input.idempotency.key,
        input.idempotency.binding,
        requestFingerprint,
        this.contractVersion,
        "committed",
        canonicalJson(result),
        canonicalJson(eventIds),
      );
      if (input.injectFailureAt === "before_commit") {
        throw new PersistenceError("INJECTED_FAILURE");
      }
      return result;
      });
    } catch (error) {
      const typed = classifyPersistenceError(error, "STORE_OPEN_FAILED");
      if (RECORDABLE_COMMAND_REJECTIONS.has(typed.code)) {
        try {
          this.recordRejectedCommand(database, input, typed);
        } catch {
          // Preserve the original command rejection if the diagnostic record cannot be written.
        }
      }
      throw typed;
    }
  }

  commitMissionDispatch(input: CommitMissionDispatchInput): CommitMissionDispatchResult {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.commandId);
    assertNonEmpty(input.idempotency.key);
    assertNonEmpty(input.idempotency.binding);
    assertNonEmpty(input.soldierId);
    assertNonEmpty(input.missionId);
    assertNonEmpty(input.missionAttemptId);
    assertNonEmpty(input.targetId);
    if (!Number.isSafeInteger(input.worldTime) || input.worldTime < 0
      || !Number.isSafeInteger(input.expectedSoldierRevision) || input.expectedSoldierRevision < 0
      || !Number.isSafeInteger(input.equipmentTier) || input.equipmentTier < 0
      || !isMissionRole(input.role) || !isMissionTool(input.tool) || !isMissionReturnPolicy(input.returnPolicy)) {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (input.commandId === input.idempotency.key) {
      throw new PersistenceError("INVALID_INPUT");
    }
    const route = routeFromValue(input.route, "INVALID_INPUT");
    const homeAnchor = validateCoordinate(input.homeAnchor, "INVALID_INPUT");
    const nextDueWorldTime = input.worldTime + route.estimatedTravelWorldSeconds;
    if (!Number.isSafeInteger(nextDueWorldTime)) {
      throw new PersistenceError("INVALID_INPUT");
    }
    const request = rowOf(input.idempotency.request);
    const expectedEventPayload = {
      missionId: input.missionId,
      missionAttemptId: input.missionAttemptId,
      soldierId: input.soldierId,
      role: input.role,
      tool: input.tool,
      equipmentTier: input.equipmentTier,
      targetId: input.targetId,
      route,
      homeAnchor,
      returnPolicy: input.returnPolicy,
      phase: "TRAVELLING",
    };
    if (!request || request.commandId !== input.commandId
      || input.event.eventType !== "MissionDispatched"
      || input.event.causationId !== input.commandId
      || input.event.idempotencyKey !== input.idempotency.key
      || input.event.aggregateType !== "mission"
      || input.event.aggregateId !== input.missionId
      || canonicalJson(input.event.typedPayload) !== canonicalJson(expectedEventPayload)) {
      throw new PersistenceError("INVALID_INPUT");
    }

    const database = this.db();
    try {
      return withTransaction(database, () => {
        const world = this.requireWorld(input.worldId);
        const requestFingerprint = canonicalJson(input.idempotency.request);
        const existing = rowOf(database.prepare("SELECT binding, request_fingerprint, contract_version, outcome, result_json FROM idempotency_record WHERE world_id = ? AND idempotency_key = ?").get(input.worldId, input.idempotency.key));
        if (existing) {
          if (existing.binding !== input.idempotency.binding || existing.request_fingerprint !== requestFingerprint || existing.contract_version !== this.contractVersion) {
            throw new PersistenceError("DUPLICATE_COMMAND");
          }
          if (existing.outcome === "rejected") {
            const rejection = parseJson<{ errorCode?: unknown }>(String(existing.result_json), "RECOVERY_REQUIRED");
            if (!isPersistenceErrorCode(rejection.errorCode)) {
              throw new PersistenceError("RECOVERY_REQUIRED");
            }
            throw new PersistenceError(rejection.errorCode);
          }
          if (existing.outcome !== "committed") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          const storedResult = parseJson<CommitMissionDispatchResult>(String(existing.result_json), "RECOVERY_REQUIRED");
          if (!storedResult || storedResult.effect !== "mission_dispatched") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          return { ...storedResult, duplicate: true };
        }

        if (input.worldTime < world.worldTime) {
          throw new PersistenceError("WORLD_TIME_REGRESSION");
        }
        if (input.worldTime > world.worldTime) {
          database.prepare("UPDATE world SET world_time = ? WHERE world_id = ? AND in_progress_world_time IS NULL AND world_time <= ?").run(input.worldTime, input.worldId, input.worldTime);
        }

        const soldierRow = rowOf(database.prepare("SELECT world_id, soldier_id, shelter_id, state, role, tool, revision FROM soldier WHERE world_id = ? AND soldier_id = ?").get(input.worldId, input.soldierId));
        if (!soldierRow) {
          throw new PersistenceError("ENTITY_NOT_FOUND");
        }
        const shelterId = requiredString(soldierRow, "shelter_id");
        const owner = rowOf(database.prepare("SELECT shelter.player_id AS player_id, player.binding AS binding FROM shelter JOIN player ON player.world_id = shelter.world_id AND player.player_id = shelter.player_id WHERE shelter.world_id = ? AND shelter.shelter_id = ?").get(input.worldId, shelterId));
        if (!owner) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        if (requiredString(owner, "binding") !== input.idempotency.binding) {
          throw new PersistenceError("OWNERSHIP_DENIED");
        }
        if (requiredInteger(soldierRow, "revision") !== input.expectedSoldierRevision) {
          throw new PersistenceError("STALE_REVISION");
        }
        if (input.role === "GATHERER") {
          const targetRow = rowOf(database.prepare("SELECT quantity FROM resource_node WHERE world_id = ? AND resource_node_id = ?").get(input.worldId, input.targetId));
          if (!targetRow || requiredInteger(targetRow, "quantity") <= 0) {
            throw new PersistenceError("TARGET_UNAVAILABLE");
          }
        } else if (input.role === "HUNTER") {
          const targetRow = rowOf(database.prepare("SELECT state FROM monster WHERE world_id = ? AND monster_id = ?").get(input.worldId, input.targetId));
          if (!targetRow || requiredString(targetRow, "state").toUpperCase() !== "PATROL") {
            throw new PersistenceError("TARGET_UNAVAILABLE");
          }
          const activeHunter = database.prepare("SELECT 1 FROM mission_attempt WHERE world_id = ? AND role = 'HUNTER' AND target_id = ? AND state IN ('ACTIVE', 'active')").get(input.worldId, input.targetId);
          if (activeHunter) {
            throw new PersistenceError("TARGET_UNAVAILABLE");
          }
          if (input.tool !== "SWORD" || input.equipmentTier !== 1 || input.returnPolicy !== "ON_RECALL") {
            throw new PersistenceError("TOOL_INCOMPATIBLE");
          }
        } else {
          throw new PersistenceError("ROLE_UNAVAILABLE");
        }
        if (route.source.x !== homeAnchor.x || route.source.y !== homeAnchor.y) {
          throw new PersistenceError("INVALID_INPUT");
        }
        if (requiredString(soldierRow, "state") !== "AT_SHELTER") {
          throw new PersistenceError("ROLE_LOCKED");
        }
        const activeMission = database.prepare("SELECT mission_id FROM mission WHERE world_id = ? AND soldier_id = ? AND active_attempt_id IS NOT NULL AND state IN ('ACTIVE', 'active')").get(input.worldId, input.soldierId);
        if (activeMission) {
          throw new PersistenceError("MISSION_ACTIVE");
        }
        const existingMissionRow = rowOf(database.prepare("SELECT world_id, mission_id, soldier_id, state, phase, role, tool, target_id, return_policy, active_attempt_id, encounter_id, encounter_status, monster_reissue_budget, danger_cell_json, waiting_review_reason, revision, work_id, next_due_world_time, claim_id, lease_expires_at_wall_ms FROM mission WHERE world_id = ? AND mission_id = ?").get(input.worldId, input.missionId));
        if (existingMissionRow) {
          const existingMissionState = requiredString(existingMissionRow, "state");
          const existingMissionPhase = requiredString(existingMissionRow, "phase");
          if (requiredString(existingMissionRow, "soldier_id") !== input.soldierId
            || !(["COMPLETED", "completed"] as string[]).includes(existingMissionState)
            || (existingMissionPhase !== "AT_SHELTER" && existingMissionPhase !== "WAITING_REVIEW")
            || optionalString(existingMissionRow, "role") !== null
            || optionalString(existingMissionRow, "tool") !== null
            || optionalString(existingMissionRow, "target_id") !== null
            || optionalString(existingMissionRow, "return_policy") !== null
            || optionalString(existingMissionRow, "active_attempt_id") !== null
            || optionalString(existingMissionRow, "encounter_id") !== null
            || optionalString(existingMissionRow, "encounter_status") !== null
            || optionalString(existingMissionRow, "work_id") !== null
            || optionalInteger(existingMissionRow, "next_due_world_time") !== null
            || optionalString(existingMissionRow, "claim_id") !== null
            || optionalInteger(existingMissionRow, "lease_expires_at_wall_ms") !== null) {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
        }
        if (database.prepare("SELECT 1 FROM mission_attempt WHERE world_id = ? AND mission_attempt_id = ?").get(input.worldId, input.missionAttemptId)) {
          throw new PersistenceError("DUPLICATE_COMMAND");
        }
        if (input.event.visibilityScope.kind !== "shelter" || input.event.visibilityScope.shelterId !== shelterId) {
          throw new PersistenceError("OWNERSHIP_DENIED");
        }

        const soldierRevision = this.applyMutation(database, input.worldId, {
          entityType: "soldier",
          entityId: input.soldierId,
          expectedRevision: input.expectedSoldierRevision,
          patch: { role: input.role, state: "FIELD", tool: input.tool, work_id: `mission-attempt:${input.missionAttemptId}` },
        });
        const missionRevision = existingMissionRow
          ? this.applyMutation(database, input.worldId, {
            entityType: "mission",
            entityId: input.missionId,
            expectedRevision: requiredInteger(existingMissionRow, "revision"),
            patch: {
              state: "ACTIVE",
              phase: "TRAVELLING",
              role: input.role,
              tool: input.tool,
              target_id: input.targetId,
              return_policy: input.returnPolicy,
              active_attempt_id: input.missionAttemptId,
              work_id: `mission-attempt:${input.missionAttemptId}`,
              next_due_world_time: nextDueWorldTime,
              claim_id: null,
              lease_expires_at_wall_ms: null,
              encounter_id: null,
              encounter_status: null,
              monster_reissue_budget: 1,
              danger_cell_json: null,
              waiting_review_reason: null,
            },
          })
          : (() => {
            database.prepare("INSERT INTO mission (world_id, mission_id, soldier_id, state, phase, role, tool, target_id, return_policy, active_attempt_id, encounter_id, encounter_status, monster_reissue_budget, danger_cell_json, waiting_review_reason, revision, work_id, next_due_world_time) VALUES (?, ?, ?, 'ACTIVE', 'TRAVELLING', ?, ?, ?, ?, ?, NULL, NULL, 1, NULL, NULL, 0, ?, ?)").run(
              input.worldId,
              input.missionId,
              input.soldierId,
              input.role,
              input.tool,
              input.targetId,
              input.returnPolicy,
              input.missionAttemptId,
              `mission-attempt:${input.missionAttemptId}`,
              nextDueWorldTime,
            );
            return 0;
          })();
        database.prepare("INSERT INTO mission_attempt (world_id, mission_attempt_id, mission_id, state, phase, role, tool, equipment_tier, target_id, route_json, home_anchor_json, return_policy, encounter_id, encounter_status, terminal_cause, start_world_time, last_transition_world_time, revision, work_id, next_due_world_time) VALUES (?, ?, ?, 'ACTIVE', 'TRAVELLING', ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, 0, ?, ?)").run(
          input.worldId,
          input.missionAttemptId,
          input.missionId,
          input.role,
          input.tool,
          input.equipmentTier,
          input.targetId,
          canonicalJson(route),
          canonicalJson(homeAnchor),
          input.returnPolicy,
          input.worldTime,
          input.worldTime,
          `mission-attempt:${input.missionAttemptId}`,
          nextDueWorldTime,
        );

        const entityRevisions: Record<string, number> = {
          [`soldier:${input.soldierId}`]: soldierRevision,
          [`mission:${input.missionId}`]: missionRevision,
          [`mission_attempt:${input.missionAttemptId}`]: 0,
        };
        const cursor = this.allocateCursor(database, input.worldId);
        const event = this.persistEvent(database, input.worldId, input.worldTime, cursor, input.event, entityRevisions, input.idempotency.key);
        const result: CommitMissionDispatchResult = {
          effect: "mission_dispatched",
          contractVersion: this.contractVersion,
          worldId: input.worldId,
          soldierId: input.soldierId,
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          eventId: event.eventId,
          role: input.role,
          tool: input.tool,
          equipmentTier: input.equipmentTier,
          targetId: input.targetId,
          phase: "TRAVELLING",
          soldierState: "FIELD",
          soldierRevision,
          missionRevision,
          missionAttemptRevision: 0,
          route,
          homeAnchor,
          returnPolicy: input.returnPolicy,
        };
        database.prepare("INSERT INTO idempotency_record (world_id, idempotency_key, binding, request_fingerprint, contract_version, outcome, result_json, event_ids_json) VALUES (?, ?, ?, ?, ?, 'committed', ?, ?)").run(
          input.worldId,
          input.idempotency.key,
          input.idempotency.binding,
          requestFingerprint,
          this.contractVersion,
          canonicalJson(result),
          canonicalJson([event.eventId]),
        );
        return result;
      });
    } catch (error) {
      const typed = classifyPersistenceError(error, "STORE_OPEN_FAILED");
      if (RECORDABLE_COMMAND_REJECTIONS.has(typed.code)) {
        try {
          this.recordRejectedIdempotency(input.worldId, input.idempotency, typed);
        } catch (recordError) {
          // Do not expose a definitive rejection whose retry outcome is not durable.
          throw classifyPersistenceError(recordError, "STORE_OPEN_FAILED");
        }
      }
      throw typed;
    }
  }

  commitMissionExtraction(input: CommitMissionExtractionInput): CommitMissionExtractionResult {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.idempotency.key);
    assertNonEmpty(input.idempotency.binding);
    assertNonEmpty(input.soldierId);
    assertNonEmpty(input.missionId);
    assertNonEmpty(input.missionAttemptId);
    assertNonEmpty(input.resourceNodeId);
    if (!Number.isSafeInteger(input.worldTime) || input.worldTime < 0
      || !Number.isSafeInteger(input.expectedSoldierRevision) || input.expectedSoldierRevision < 0
      || !Number.isSafeInteger(input.expectedMissionRevision) || input.expectedMissionRevision < 0
      || !Number.isSafeInteger(input.expectedMissionAttemptRevision) || input.expectedMissionAttemptRevision < 0
      || !Number.isSafeInteger(input.expectedResourceNodeRevision) || input.expectedResourceNodeRevision < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (input.expectedCargoRevision !== undefined
      && input.expectedCargoRevision !== null
      && (!Number.isSafeInteger(input.expectedCargoRevision) || input.expectedCargoRevision < 0)) {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (input.nextDueWorldTime === undefined || input.returnReason === undefined || input.resourceRespawnDueWorldTime === undefined) {
      throw new PersistenceError("INVALID_INPUT");
    }
    const nextDueWorldTime = input.nextDueWorldTime;
    if (nextDueWorldTime !== null
      && (!Number.isSafeInteger(nextDueWorldTime) || nextDueWorldTime <= input.worldTime)) {
      throw new PersistenceError("INVALID_INPUT");
    }
    const returnReason = input.returnReason;
    const resourceRespawnDueWorldTime = input.resourceRespawnDueWorldTime;
    if (returnReason !== null && returnReason !== "CAPACITY_FULL" && returnReason !== "TARGET_DEPLETED") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (resourceRespawnDueWorldTime !== null
      && (!Number.isSafeInteger(resourceRespawnDueWorldTime) || resourceRespawnDueWorldTime <= input.worldTime)) {
      throw new PersistenceError("INVALID_INPUT");
    }
    if ((returnReason === null) !== (input.returnEvent === undefined)
      || (resourceRespawnDueWorldTime !== null) !== (input.resourceDepletedEvent !== undefined)) {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (input.event.eventType !== "CargoExtracted" || input.event.aggregateType !== "mission" || input.event.aggregateId !== input.missionId) {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (input.returnEvent
      && (input.returnEvent.eventType !== "MissionAutoReturned"
        || input.returnEvent.aggregateType !== "mission"
        || input.returnEvent.aggregateId !== input.missionId)) {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (input.resourceDepletedEvent
      && (input.resourceDepletedEvent.eventType !== "ResourceDepleted"
        || input.resourceDepletedEvent.aggregateType !== "resource_node"
        || input.resourceDepletedEvent.aggregateId !== input.resourceNodeId)) {
      throw new PersistenceError("INVALID_INPUT");
    }

    const database = this.db();
    const cargoId = deterministicCargoId(input.worldId, input.missionAttemptId, input.resourceNodeId);
    try {
      return withTransaction(database, () => {
        const world = this.requireWorld(input.worldId);
        const requestFingerprint = canonicalJson(input.idempotency.request);
        const existing = rowOf(database.prepare("SELECT binding, request_fingerprint, contract_version, outcome, result_json FROM idempotency_record WHERE world_id = ? AND idempotency_key = ?").get(input.worldId, input.idempotency.key));
        if (existing) {
          if (existing.binding !== input.idempotency.binding || existing.request_fingerprint !== requestFingerprint || existing.contract_version !== this.contractVersion) {
            throw new PersistenceError("DUPLICATE_COMMAND");
          }
          if (existing.outcome === "rejected") {
            const rejection = parseJson<{ errorCode?: unknown }>(String(existing.result_json), "RECOVERY_REQUIRED");
            if (!isPersistenceErrorCode(rejection.errorCode)) {
              throw new PersistenceError("RECOVERY_REQUIRED");
            }
            throw new PersistenceError(rejection.errorCode);
          }
          if (existing.outcome !== "committed") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          const storedResult = parseJson<CommitMissionExtractionResult>(String(existing.result_json), "RECOVERY_REQUIRED");
          if (!storedResult || storedResult.effect !== "cargo_extracted") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          return { ...storedResult, duplicate: true };
        }

        if (input.worldTime < world.worldTime) {
          throw new PersistenceError("WORLD_TIME_REGRESSION");
        }
        if (input.worldTime > world.worldTime) {
          database.prepare("UPDATE world SET world_time = ? WHERE world_id = ? AND in_progress_world_time IS NULL AND world_time <= ?").run(input.worldTime, input.worldId, input.worldTime);
        }

        const missionRow = rowOf(database.prepare("SELECT world_id, mission_id, soldier_id, state, phase, role, tool, target_id, active_attempt_id, encounter_id, encounter_status, next_due_world_time, revision FROM mission WHERE world_id = ? AND mission_id = ?").get(input.worldId, input.missionId));
        const attemptRow = rowOf(database.prepare("SELECT world_id, mission_attempt_id, mission_id, state, phase, role, tool, target_id, encounter_id, encounter_status, next_due_world_time, revision FROM mission_attempt WHERE world_id = ? AND mission_attempt_id = ?").get(input.worldId, input.missionAttemptId));
        const soldierRow = rowOf(database.prepare("SELECT world_id, soldier_id, shelter_id, state, role, tool, revision FROM soldier WHERE world_id = ? AND soldier_id = ?").get(input.worldId, input.soldierId));
        const nodeRow = rowOf(database.prepare("SELECT world_id, resource_node_id, resource_type, quantity, revision FROM resource_node WHERE world_id = ? AND resource_node_id = ?").get(input.worldId, input.resourceNodeId));
        if (!missionRow || !attemptRow || !soldierRow || !nodeRow) {
          throw new PersistenceError("ENTITY_NOT_FOUND");
        }

        const missionSoldierId = requiredString(missionRow, "soldier_id");
        const attemptMissionId = requiredString(attemptRow, "mission_id");
        const missionRole = optionalString(missionRow, "role");
        const attemptRole = optionalString(attemptRow, "role");
        const soldierRole = optionalString(soldierRow, "role");
        const missionTool = optionalString(missionRow, "tool");
        const attemptTool = optionalString(attemptRow, "tool");
        const soldierTool = optionalString(soldierRow, "tool");
        if (missionSoldierId !== input.soldierId || attemptMissionId !== input.missionId
          || requiredString(missionRow, "active_attempt_id") !== input.missionAttemptId
          || !["ACTIVE", "active"].includes(requiredString(missionRow, "state"))
          || !["ACTIVE", "active"].includes(requiredString(attemptRow, "state"))
          || requiredString(missionRow, "phase") !== "WORKING"
          || requiredString(attemptRow, "phase") !== "WORKING"
          || requiredString(soldierRow, "state") !== "FIELD"
          || requiredString(missionRow, "role") !== "GATHERER"
          || requiredString(attemptRow, "role") !== "GATHERER"
          || requiredString(soldierRow, "role") !== "GATHERER"
          || requiredString(missionRow, "target_id") !== input.resourceNodeId
          || requiredString(attemptRow, "target_id") !== input.resourceNodeId
          || requiredInteger(soldierRow, "revision") !== input.expectedSoldierRevision
          || requiredInteger(missionRow, "revision") !== input.expectedMissionRevision
          || requiredInteger(attemptRow, "revision") !== input.expectedMissionAttemptRevision
          || requiredInteger(nodeRow, "revision") !== input.expectedResourceNodeRevision) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const missionDue = optionalInteger(missionRow, "next_due_world_time");
        const attemptDue = optionalInteger(attemptRow, "next_due_world_time");
        if (missionDue === null || attemptDue === null || missionDue !== attemptDue || attemptDue > input.worldTime) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }

        const expectedWorkId = `mission-extraction:${input.missionAttemptId}:${attemptDue}`;
        if (input.idempotency.key !== expectedWorkId
          || input.event.eventId !== `cargo-extracted:${input.missionAttemptId}:${attemptDue}`
          || input.event.causationId !== input.idempotency.key
          || input.event.idempotencyKey !== input.idempotency.key) {
          throw new PersistenceError("INVALID_INPUT");
        }

        const shelterId = requiredString(soldierRow, "shelter_id");
        if (input.event.visibilityScope.kind !== "shelter" || input.event.visibilityScope.shelterId !== shelterId) {
          throw new PersistenceError("OWNERSHIP_DENIED");
        }
        const resourceType = requiredString(nodeRow, "resource_type");
        const expectedTool = resourceType === "wood" ? "AXE" : resourceType === "rock" ? "PICKAXE" : null;
        if (!expectedTool || requiredString(missionRow, "tool") !== expectedTool
          || requiredString(attemptRow, "tool") !== expectedTool || requiredString(soldierRow, "tool") !== expectedTool) {
          throw new PersistenceError("TOOL_INCOMPATIBLE");
        }
        const nodeQuantity = requiredInteger(nodeRow, "quantity");
        if (nodeQuantity <= 0) {
          throw new PersistenceError("TARGET_UNAVAILABLE");
        }

        const cargoRows = database.prepare("SELECT quantity, capacity_used FROM cargo WHERE world_id = ? AND soldier_id = ? ORDER BY cargo_id ASC").all(input.worldId, input.soldierId) as Row[];
        let capacityUsed = 0;
        for (const row of cargoRows) {
          const quantity = requiredInteger(row, "quantity");
          const used = requiredInteger(row, "capacity_used");
          if (quantity < 0 || used !== quantity) {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          capacityUsed += used;
        }
        if (capacityUsed > 5) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        if (capacityUsed >= 5 || capacityUsed + 1 > 5) {
          throw new PersistenceError("CARGO_FULL");
        }
        const existingCargoRow = rowOf(database.prepare("SELECT world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision FROM cargo WHERE world_id = ? AND cargo_id = ?").get(input.worldId, cargoId));
        const existingCargo = existingCargoRow ? cargoRecordFromRow(existingCargoRow) : null;
        if (existingCargo && input.expectedCargoRevision === undefined) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        if (input.expectedCargoRevision !== undefined
          && (existingCargo?.revision ?? null) !== input.expectedCargoRevision) {
          throw new PersistenceError("STALE_REVISION");
        }
        if (existingCargo
          && (existingCargo.worldId !== input.worldId
            || existingCargo.soldierId !== input.soldierId
            || existingCargo.missionAttemptId !== input.missionAttemptId
            || existingCargo.sourceNodeId !== input.resourceNodeId
            || existingCargo.resourceType !== resourceType)) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const resultingCapacityUsed = capacityUsed + 1;
        const resultingQuantity = (existingCargo?.quantity ?? 0) + 1;
        if (resultingCapacityUsed > 5 || resultingQuantity < 1) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const nodeDepleted = nodeQuantity === 1;
        const expectedReturnReason = resultingCapacityUsed >= 5
          ? "CAPACITY_FULL"
          : nodeDepleted
            ? "TARGET_DEPLETED"
            : null;
        if (returnReason !== expectedReturnReason) {
          throw new PersistenceError("INVALID_INPUT");
        }
        const shouldReturn = expectedReturnReason !== null;
        const expectedNextDueWorldTime = shouldReturn ? null : attemptDue + 2;
        if ((!shouldReturn && !Number.isSafeInteger(expectedNextDueWorldTime))
          || nextDueWorldTime !== expectedNextDueWorldTime) {
          throw new PersistenceError("INVALID_INPUT");
        }
        const expectedResourceRespawnDueWorldTime = nodeDepleted ? input.worldTime + 30 : null;
        if ((nodeDepleted && !Number.isSafeInteger(expectedResourceRespawnDueWorldTime))
          || resourceRespawnDueWorldTime !== expectedResourceRespawnDueWorldTime) {
          throw new PersistenceError("INVALID_INPUT");
        }
        if (shouldReturn !== (returnReason !== null) || shouldReturn !== (input.returnEvent !== undefined)) {
          throw new PersistenceError("INVALID_INPUT");
        }

        const extractionEventPayload = extractionPayload(input.event.typedPayload);
        requireExtractionPayload(extractionEventPayload, "cargoId", cargoId);
        requireExtractionPayload(extractionEventPayload, "missionId", input.missionId);
        requireExtractionPayload(extractionEventPayload, "missionAttemptId", input.missionAttemptId);
        requireExtractionPayload(extractionEventPayload, "soldierId", input.soldierId);
        requireExtractionPayload(extractionEventPayload, "sourceNodeId", input.resourceNodeId);
        requireExtractionPayload(extractionEventPayload, "resourceType", resourceType);
        requireExtractionPayload(extractionEventPayload, "quantity", 1);
        requireExtractionPayload(extractionEventPayload, "capacityUsed", 1);
        requireExtractionPayload(extractionEventPayload, "remainingNodeQuantity", nodeQuantity - 1);
        requireExtractionPayload(extractionEventPayload, "worldTime", input.worldTime);
        if (existingCargo) {
          requireExtractionPayload(extractionEventPayload, "cargoQuantity", resultingQuantity);
          requireExtractionPayload(extractionEventPayload, "cargoCapacityUsed", existingCargo.capacityUsed + 1);
        } else if ("cargoQuantity" in extractionEventPayload || "cargoCapacityUsed" in extractionEventPayload) {
          throw new PersistenceError("INVALID_INPUT");
        }
        if (shouldReturn && expectedReturnReason !== null) {
          requireExtractionPayload(extractionEventPayload, "returnReason", expectedReturnReason);
        } else if ("returnReason" in extractionEventPayload) {
          throw new PersistenceError("INVALID_INPUT");
        }

        if (input.returnEvent) {
          if (input.returnEvent.eventId !== `mission-auto-returned:${input.missionAttemptId}:${attemptDue}`
            || input.returnEvent.causationId !== input.idempotency.key
            || input.returnEvent.idempotencyKey !== input.idempotency.key
            || input.returnEvent.visibilityScope.kind !== "shelter"
            || input.returnEvent.visibilityScope.shelterId !== shelterId) {
            throw new PersistenceError("INVALID_INPUT");
          }
          const returnPayload = extractionPayload(input.returnEvent.typedPayload);
          requireExtractionPayload(returnPayload, "missionId", input.missionId);
          requireExtractionPayload(returnPayload, "missionAttemptId", input.missionAttemptId);
          requireExtractionPayload(returnPayload, "soldierId", input.soldierId);
          if (expectedReturnReason === null) {
            throw new PersistenceError("INVALID_INPUT");
          }
          requireExtractionPayload(returnPayload, "reason", expectedReturnReason);
          requireExtractionPayload(returnPayload, "cargoQuantity", resultingQuantity);
          requireExtractionPayload(returnPayload, "cargoCapacityUsed", resultingCapacityUsed);
          requireExtractionPayload(returnPayload, "resourceNodeId", input.resourceNodeId);
          requireExtractionPayload(returnPayload, "worldTime", input.worldTime);
        }
        if (input.resourceDepletedEvent) {
          if (input.resourceDepletedEvent.eventId !== `resource-depleted:${input.resourceNodeId}:${attemptDue}`
            || input.resourceDepletedEvent.causationId !== input.idempotency.key
            || input.resourceDepletedEvent.idempotencyKey !== input.idempotency.key
            || input.resourceDepletedEvent.visibilityScope.kind !== "world") {
            throw new PersistenceError("INVALID_INPUT");
          }
          const depletedPayload = extractionPayload(input.resourceDepletedEvent.typedPayload);
          requireExtractionPayload(depletedPayload, "missionAttemptId", input.missionAttemptId);
          requireExtractionPayload(depletedPayload, "resourceNodeId", input.resourceNodeId);
          requireExtractionPayload(depletedPayload, "resourceType", resourceType);
          if (expectedResourceRespawnDueWorldTime === null) {
            throw new PersistenceError("INVALID_INPUT");
          }
          requireExtractionPayload(depletedPayload, "respawnDueWorldTime", expectedResourceRespawnDueWorldTime);
          requireExtractionPayload(depletedPayload, "worldTime", input.worldTime);
        }

        const resourceNodeRevision = this.applyMutation(database, input.worldId, {
          entityType: "resource_node",
          entityId: input.resourceNodeId,
          expectedRevision: input.expectedResourceNodeRevision,
          patch: {
            quantity: nodeQuantity - 1,
            ...(nodeDepleted ? { next_due_world_time: resourceRespawnDueWorldTime } : {}),
          },
        });
        const missionRevision = this.applyMutation(database, input.worldId, {
          entityType: "mission",
          entityId: input.missionId,
          expectedRevision: input.expectedMissionRevision,
          patch: {
            phase: shouldReturn ? "RETURNING" : "WORKING",
            next_due_world_time: nextDueWorldTime,
          },
        });
        const missionAttemptRevision = this.applyMutation(database, input.worldId, {
          entityType: "mission_attempt",
          entityId: input.missionAttemptId,
          expectedRevision: input.expectedMissionAttemptRevision,
          patch: {
            phase: shouldReturn ? "RETURNING" : "WORKING",
            last_transition_world_time: input.worldTime,
            next_due_world_time: nextDueWorldTime,
          },
        });
        if (input.injectFailureAt === "after_state") {
          throw new PersistenceError("INJECTED_FAILURE");
        }

        let cargoRevision: number;
        if (existingCargo) {
          cargoRevision = this.applyMutation(database, input.worldId, {
            entityType: "cargo",
            entityId: cargoId,
            expectedRevision: existingCargo.revision,
            patch: { quantity: resultingQuantity, capacity_used: existingCargo.capacityUsed + 1 },
          });
        } else {
          database.prepare("INSERT INTO cargo (world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
            input.worldId,
            cargoId,
            input.soldierId,
            input.missionAttemptId,
            input.resourceNodeId,
            resourceType,
            1,
            input.worldTime,
            1,
            0,
          );
          cargoRevision = 0;
        }
        if (input.injectFailureAt === "after_cargo") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        const cargo = this.getCargo(input.worldId, cargoId);
        if (!cargo || cargo.revision !== cargoRevision) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const entityRevisions: Record<string, number> = {
          [`resource_node:${input.resourceNodeId}`]: resourceNodeRevision,
          [`mission:${input.missionId}`]: missionRevision,
          [`mission_attempt:${input.missionAttemptId}`]: missionAttemptRevision,
          [`cargo:${cargoId}`]: cargo.revision,
        };
        const persistedEvents: PersistedDomainEvent[] = [];
        for (const eventInput of [input.event, input.resourceDepletedEvent, input.returnEvent]) {
          if (!eventInput) {
            continue;
          }
          const cursor = this.allocateCursor(database, input.worldId);
          persistedEvents.push(this.persistEvent(database, input.worldId, input.worldTime, cursor, eventInput, entityRevisions, input.idempotency.key));
        }
        if (input.injectFailureAt === "after_events") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        const event = persistedEvents[0];
        if (!event) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const result: CommitMissionExtractionResult = {
          effect: "cargo_extracted",
          contractVersion: this.contractVersion,
          worldId: input.worldId,
          soldierId: input.soldierId,
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          resourceNodeId: input.resourceNodeId,
          eventId: event.eventId,
          cargo,
          quantity: 1,
          capacityUsed: 1,
          remainingNodeQuantity: nodeQuantity - 1,
          missionRevision,
          missionAttemptRevision,
          resourceNodeRevision,
          cargoRevision: cargo.revision,
          phase: shouldReturn ? "RETURNING" : "WORKING",
          nextDueWorldTime,
          returned: shouldReturn,
          returnReason,
          resourceNodeDepleted: nodeDepleted,
          resourceRespawnDueWorldTime: nodeDepleted ? resourceRespawnDueWorldTime : null,
          eventIds: persistedEvents.map((persisted) => persisted.eventId),
          returnEventId: persistedEvents.find((persisted) => persisted.eventType === "MissionAutoReturned")?.eventId ?? null,
          resourceDepletedEventId: persistedEvents.find((persisted) => persisted.eventType === "ResourceDepleted")?.eventId ?? null,
          worldTime: input.worldTime,
        };
        database.prepare("INSERT INTO idempotency_record (world_id, idempotency_key, binding, request_fingerprint, contract_version, outcome, result_json, event_ids_json) VALUES (?, ?, ?, ?, ?, 'committed', ?, ?)").run(
          input.worldId,
          input.idempotency.key,
          input.idempotency.binding,
          requestFingerprint,
          this.contractVersion,
          canonicalJson(result),
          canonicalJson(result.eventIds),
        );
        if (input.injectFailureAt === "before_commit") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        return result;
      });
    } catch (error) {
      const typed = classifyPersistenceError(error, "STORE_OPEN_FAILED");
      if (RECORDABLE_COMMAND_REJECTIONS.has(typed.code)) {
        try {
          this.recordRejectedIdempotency(input.worldId, input.idempotency, typed);
        } catch {
          // Preserve the original extraction rejection if diagnostics cannot be persisted.
        }
      }
      throw typed;
    }
  }

  commitMissionTargetDepletedReturn(input: CommitMissionTargetDepletedReturnInput): CommitMissionTargetDepletedReturnResult {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.idempotency.key);
    assertNonEmpty(input.idempotency.binding);
    assertNonEmpty(input.soldierId);
    assertNonEmpty(input.missionId);
    assertNonEmpty(input.missionAttemptId);
    assertNonEmpty(input.resourceNodeId);
    if (!Number.isSafeInteger(input.worldTime) || input.worldTime < 0
      || !Number.isSafeInteger(input.dueWorldTime) || input.dueWorldTime < 0 || input.dueWorldTime > input.worldTime
      || !Number.isSafeInteger(input.expectedSoldierRevision) || input.expectedSoldierRevision < 0
      || !Number.isSafeInteger(input.expectedMissionRevision) || input.expectedMissionRevision < 0
      || !Number.isSafeInteger(input.expectedMissionAttemptRevision) || input.expectedMissionAttemptRevision < 0
      || !Number.isSafeInteger(input.expectedResourceNodeRevision) || input.expectedResourceNodeRevision < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    const expectedWorkId = `mission-extraction-contest-loss:${input.missionAttemptId}:${input.dueWorldTime}`;
    const expectedEventId = `mission-auto-returned:${input.missionAttemptId}:${input.dueWorldTime}:target-depleted`;
    if (input.idempotency.key !== expectedWorkId
      || input.idempotency.binding !== `worker:${input.worldId}`
      || input.event.eventId !== expectedEventId
      || input.event.eventType !== "MissionAutoReturned"
      || input.event.aggregateType !== "mission"
      || input.event.aggregateId !== input.missionId) {
      throw new PersistenceError("INVALID_INPUT");
    }

    const database = this.db();
    try {
      return withTransaction(database, () => {
        const world = this.requireWorld(input.worldId);
        const requestFingerprint = canonicalJson(input.idempotency.request);
        const existing = rowOf(database.prepare("SELECT binding, request_fingerprint, contract_version, outcome, result_json FROM idempotency_record WHERE world_id = ? AND idempotency_key = ?").get(input.worldId, input.idempotency.key));
        if (existing) {
          if (existing.binding !== input.idempotency.binding || existing.request_fingerprint !== requestFingerprint || existing.contract_version !== this.contractVersion) {
            throw new PersistenceError("DUPLICATE_COMMAND");
          }
          if (existing.outcome === "rejected") {
            const rejection = parseJson<{ errorCode?: unknown }>(String(existing.result_json), "RECOVERY_REQUIRED");
            if (!isPersistenceErrorCode(rejection.errorCode)) {
              throw new PersistenceError("RECOVERY_REQUIRED");
            }
            throw new PersistenceError(rejection.errorCode);
          }
          if (existing.outcome !== "committed") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          const storedResult = parseJson<CommitMissionTargetDepletedReturnResult>(String(existing.result_json), "RECOVERY_REQUIRED");
          if (!storedResult || storedResult.effect !== "mission_auto_returned") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          return { ...storedResult, duplicate: true };
        }

        if (input.worldTime < world.worldTime) {
          throw new PersistenceError("WORLD_TIME_REGRESSION");
        }
        if (input.worldTime > world.worldTime) {
          database.prepare("UPDATE world SET world_time = ? WHERE world_id = ? AND in_progress_world_time IS NULL AND world_time <= ?").run(input.worldTime, input.worldId, input.worldTime);
        }

        const missionRow = rowOf(database.prepare("SELECT world_id, mission_id, soldier_id, state, phase, role, target_id, active_attempt_id, encounter_id, encounter_status, next_due_world_time, revision FROM mission WHERE world_id = ? AND mission_id = ?").get(input.worldId, input.missionId));
        const attemptRow = rowOf(database.prepare("SELECT world_id, mission_attempt_id, mission_id, state, phase, role, target_id, encounter_id, encounter_status, next_due_world_time, revision FROM mission_attempt WHERE world_id = ? AND mission_attempt_id = ?").get(input.worldId, input.missionAttemptId));
        const soldierRow = rowOf(database.prepare("SELECT world_id, soldier_id, shelter_id, state, role, revision FROM soldier WHERE world_id = ? AND soldier_id = ?").get(input.worldId, input.soldierId));
        const nodeRow = rowOf(database.prepare("SELECT world_id, resource_node_id, quantity, revision FROM resource_node WHERE world_id = ? AND resource_node_id = ?").get(input.worldId, input.resourceNodeId));
        if (!missionRow || !attemptRow || !soldierRow || !nodeRow) {
          throw new PersistenceError("ENTITY_NOT_FOUND");
        }
        const missionSoldierId = requiredString(missionRow, "soldier_id");
        const attemptMissionId = requiredString(attemptRow, "mission_id");
        if (missionSoldierId !== input.soldierId || attemptMissionId !== input.missionId
          || requiredString(missionRow, "active_attempt_id") !== input.missionAttemptId
          || !["ACTIVE", "active"].includes(requiredString(missionRow, "state"))
          || !["ACTIVE", "active"].includes(requiredString(attemptRow, "state"))
          || requiredString(missionRow, "phase") !== "WORKING"
          || requiredString(attemptRow, "phase") !== "WORKING"
          || requiredString(soldierRow, "state") !== "FIELD"
          || requiredString(missionRow, "role") !== "GATHERER"
          || requiredString(attemptRow, "role") !== "GATHERER"
          || requiredString(soldierRow, "role") !== "GATHERER"
          || requiredString(missionRow, "target_id") !== input.resourceNodeId
          || requiredString(attemptRow, "target_id") !== input.resourceNodeId
          || requiredInteger(soldierRow, "revision") !== input.expectedSoldierRevision
          || requiredInteger(missionRow, "revision") !== input.expectedMissionRevision
          || requiredInteger(attemptRow, "revision") !== input.expectedMissionAttemptRevision
          || requiredInteger(nodeRow, "revision") !== input.expectedResourceNodeRevision) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const missionDue = optionalInteger(missionRow, "next_due_world_time");
        const attemptDue = optionalInteger(attemptRow, "next_due_world_time");
        if (missionDue === null || attemptDue === null || missionDue !== attemptDue || attemptDue !== input.dueWorldTime || attemptDue > input.worldTime) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const nodeQuantity = requiredInteger(nodeRow, "quantity");
        if (nodeQuantity < 0) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        if (nodeQuantity !== 0) {
          throw new PersistenceError("TARGET_UNAVAILABLE");
        }
        const shelterId = requiredString(soldierRow, "shelter_id");
        if (input.event.causationId !== input.idempotency.key
          || input.event.idempotencyKey !== input.idempotency.key
          || input.event.visibilityScope.kind !== "shelter"
          || input.event.visibilityScope.shelterId !== shelterId) {
          throw new PersistenceError("OWNERSHIP_DENIED");
        }

        const cargoRows = database.prepare("SELECT world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision FROM cargo WHERE world_id = ? AND soldier_id = ? ORDER BY cargo_id ASC").all(input.worldId, input.soldierId) as Row[];
        let cargoQuantity = 0;
        let cargoCapacityUsed = 0;
        for (const row of cargoRows) {
          const cargo = cargoRecordFromRow(row);
          if (cargo.soldierId !== input.soldierId) {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          cargoQuantity += cargo.quantity;
          cargoCapacityUsed += cargo.capacityUsed;
        }
        if (cargoQuantity < 0 || cargoCapacityUsed < 0 || cargoCapacityUsed > 5) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const expectedPayload = {
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          soldierId: input.soldierId,
          reason: "TARGET_DEPLETED",
          cargoQuantity,
          cargoCapacityUsed,
          resourceNodeId: input.resourceNodeId,
          worldTime: input.worldTime,
        };
        if (canonicalJson(extractionPayload(input.event.typedPayload)) !== canonicalJson(expectedPayload)) {
          throw new PersistenceError("INVALID_INPUT");
        }

        const missionRevision = this.applyMutation(database, input.worldId, {
          entityType: "mission",
          entityId: input.missionId,
          expectedRevision: input.expectedMissionRevision,
          patch: { phase: "RETURNING", next_due_world_time: null },
        });
        const missionAttemptRevision = this.applyMutation(database, input.worldId, {
          entityType: "mission_attempt",
          entityId: input.missionAttemptId,
          expectedRevision: input.expectedMissionAttemptRevision,
          patch: { phase: "RETURNING", last_transition_world_time: input.worldTime, next_due_world_time: null },
        });
        if (input.injectFailureAt === "after_state") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        const resourceNodeRevision = requiredInteger(nodeRow, "revision");
        const soldierRevision = requiredInteger(soldierRow, "revision");
        const entityRevisions: Record<string, number> = {
          [`soldier:${input.soldierId}`]: soldierRevision,
          [`mission:${input.missionId}`]: missionRevision,
          [`mission_attempt:${input.missionAttemptId}`]: missionAttemptRevision,
          [`resource_node:${input.resourceNodeId}`]: resourceNodeRevision,
        };
        const cursor = this.allocateCursor(database, input.worldId);
        const event = this.persistEvent(database, input.worldId, input.worldTime, cursor, input.event, entityRevisions, input.idempotency.key);
        if (input.injectFailureAt === "after_events") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        const result: CommitMissionTargetDepletedReturnResult = {
          effect: "mission_auto_returned",
          contractVersion: this.contractVersion,
          worldId: input.worldId,
          soldierId: input.soldierId,
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          resourceNodeId: input.resourceNodeId,
          eventId: event.eventId,
          eventIds: [event.eventId],
          cargoQuantity,
          cargoCapacityUsed,
          missionRevision,
          missionAttemptRevision,
          soldierRevision,
          resourceNodeRevision,
          phase: "RETURNING",
          nextDueWorldTime: null,
          returnReason: "TARGET_DEPLETED",
          worldTime: input.worldTime,
        };
        database.prepare("INSERT INTO idempotency_record (world_id, idempotency_key, binding, request_fingerprint, contract_version, outcome, result_json, event_ids_json) VALUES (?, ?, ?, ?, ?, 'committed', ?, ?)").run(
          input.worldId,
          input.idempotency.key,
          input.idempotency.binding,
          requestFingerprint,
          this.contractVersion,
          canonicalJson(result),
          canonicalJson(result.eventIds),
        );
        if (input.injectFailureAt === "before_commit") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        return result;
      });
    } catch (error) {
      const typed = classifyPersistenceError(error, "STORE_OPEN_FAILED");
      if (RECORDABLE_COMMAND_REJECTIONS.has(typed.code)) {
        try {
          this.recordRejectedIdempotency(input.worldId, input.idempotency, typed);
        } catch {
          // Preserve the original contest-return rejection if the diagnostic write cannot complete.
        }
      }
      throw typed;
    }
  }

  commitMissionHomeArrival(input: CommitMissionHomeArrivalInput): CommitMissionHomeArrivalResult {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.idempotency.key);
    assertNonEmpty(input.idempotency.binding);
    assertNonEmpty(input.soldierId);
    assertNonEmpty(input.missionId);
    assertNonEmpty(input.missionAttemptId);
    if (!Number.isSafeInteger(input.worldTime) || input.worldTime < 0
      || !Number.isSafeInteger(input.returnDueWorldTime) || input.returnDueWorldTime < 0
      || input.returnDueWorldTime > input.worldTime
      || !Number.isSafeInteger(input.expectedSoldierRevision) || input.expectedSoldierRevision < 0
      || !Number.isSafeInteger(input.expectedMissionRevision) || input.expectedMissionRevision < 0
      || !Number.isSafeInteger(input.expectedMissionAttemptRevision) || input.expectedMissionAttemptRevision < 0
      || !input.event || typeof input.event !== "object") {
      throw new PersistenceError("INVALID_INPUT");
    }
    const expectedWorkId = `mission-return-home:${input.missionAttemptId}:${input.returnDueWorldTime}`;
    const expectedEventId = `mission-home-reached:${input.missionAttemptId}:${input.returnDueWorldTime}`;
    if (input.idempotency.key !== expectedWorkId
      || input.idempotency.binding !== `worker:${input.worldId}`
      || input.event.eventId !== expectedEventId
      || input.event.eventType !== "MissionHomeReached"
      || input.event.aggregateType !== "mission"
      || input.event.aggregateId !== input.missionId
      || !input.event.visibilityScope
      || typeof input.event.visibilityScope !== "object"
      || Array.isArray(input.event.visibilityScope)) {
      throw new PersistenceError("INVALID_INPUT");
    }

    const database = this.db();
    try {
      return withTransaction(database, () => {
        const world = this.requireWorld(input.worldId);
        const requestFingerprint = canonicalJson(input.idempotency.request);
        const existing = rowOf(database.prepare("SELECT binding, request_fingerprint, contract_version, outcome, result_json FROM idempotency_record WHERE world_id = ? AND idempotency_key = ?").get(input.worldId, input.idempotency.key));
        if (existing) {
          if (existing.binding !== input.idempotency.binding || existing.request_fingerprint !== requestFingerprint || existing.contract_version !== this.contractVersion) {
            throw new PersistenceError("DUPLICATE_COMMAND");
          }
          if (existing.outcome === "rejected") {
            const rejection = parseJson<{ errorCode?: unknown }>(String(existing.result_json), "RECOVERY_REQUIRED");
            if (!isPersistenceErrorCode(rejection.errorCode)) {
              throw new PersistenceError("RECOVERY_REQUIRED");
            }
            throw new PersistenceError(rejection.errorCode);
          }
          if (existing.outcome !== "committed") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          const storedResult = parseJson<CommitMissionHomeArrivalResult>(String(existing.result_json), "RECOVERY_REQUIRED");
          if (!storedResult || storedResult.effect !== "mission_home_reached") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          return { ...storedResult, duplicate: true };
        }

        if (input.worldTime < world.worldTime) {
          throw new PersistenceError("WORLD_TIME_REGRESSION");
        }
        if (input.worldTime > world.worldTime) {
          database.prepare("UPDATE world SET world_time = ? WHERE world_id = ? AND in_progress_world_time IS NULL AND world_time <= ?").run(input.worldTime, input.worldId, input.worldTime);
        }

        const missionRow = rowOf(database.prepare("SELECT world_id, mission_id, soldier_id, state, phase, role, tool, target_id, active_attempt_id, encounter_id, encounter_status, next_due_world_time, revision FROM mission WHERE world_id = ? AND mission_id = ?").get(input.worldId, input.missionId));
        const attemptRow = rowOf(database.prepare("SELECT world_id, mission_attempt_id, mission_id, state, phase, role, tool, target_id, route_json, home_anchor_json, return_policy, encounter_id, encounter_status, start_world_time, last_transition_world_time, next_due_world_time, revision FROM mission_attempt WHERE world_id = ? AND mission_attempt_id = ?").get(input.worldId, input.missionAttemptId));
        const soldierRow = rowOf(database.prepare("SELECT world_id, soldier_id, shelter_id, state, role, tool, revision FROM soldier WHERE world_id = ? AND soldier_id = ?").get(input.worldId, input.soldierId));
        if (!missionRow || !attemptRow || !soldierRow) {
          throw new PersistenceError("ENTITY_NOT_FOUND");
        }

        const missionSoldierId = requiredString(missionRow, "soldier_id");
        const attemptMissionId = requiredString(attemptRow, "mission_id");
        const activeAttemptId = optionalString(missionRow, "active_attempt_id");
        const missionTargetId = optionalString(missionRow, "target_id");
        const attemptTargetId = optionalString(attemptRow, "target_id");
        const missionRole = optionalString(missionRow, "role");
        const attemptRole = optionalString(attemptRow, "role");
        const soldierRole = optionalString(soldierRow, "role");
        const missionTool = optionalString(missionRow, "tool");
        const attemptTool = optionalString(attemptRow, "tool");
        const soldierTool = optionalString(soldierRow, "tool");
        if (missionSoldierId !== input.soldierId || attemptMissionId !== input.missionId
          || activeAttemptId !== input.missionAttemptId
          || !["ACTIVE", "active"].includes(requiredString(missionRow, "state"))
          || !["ACTIVE", "active"].includes(requiredString(attemptRow, "state"))
          || requiredString(missionRow, "phase") !== "RETURNING"
          || requiredString(attemptRow, "phase") !== "RETURNING"
          || requiredString(soldierRow, "state") !== "FIELD"
          || (missionRole !== "GATHERER" && missionRole !== "HUNTER")
          || attemptRole !== missionRole
          || soldierRole !== missionRole
          || missionTool !== attemptTool
          || soldierTool !== attemptTool
          || missionTargetId === null
          || attemptTargetId === null
          || missionTargetId !== attemptTargetId
          || requiredInteger(soldierRow, "revision") !== input.expectedSoldierRevision
          || requiredInteger(missionRow, "revision") !== input.expectedMissionRevision
          || requiredInteger(attemptRow, "revision") !== input.expectedMissionAttemptRevision) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const missionDue = optionalInteger(missionRow, "next_due_world_time");
        const attemptDue = optionalInteger(attemptRow, "next_due_world_time");
        if (missionDue !== null || attemptDue !== null) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }

        const route = optionalRoute(attemptRow, "route_json");
        const homeAnchor = optionalAnchor(attemptRow, "home_anchor_json");
        if (!route || !homeAnchor
          || route.source.x !== homeAnchor.x || route.source.y !== homeAnchor.y) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const returnStartWorldTime = requiredInteger(attemptRow, "last_transition_world_time");
        if (returnStartWorldTime > input.worldTime) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const outboundPosition = routePositionAt(route, requiredInteger(attemptRow, "start_world_time"), returnStartWorldTime);
        if (!Number.isSafeInteger(outboundPosition.progressTiles)
          || !Number.isSafeInteger(outboundPosition.waypointIndex)) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const currentWaypoint = route.waypoints[outboundPosition.waypointIndex];
        if (!currentWaypoint || outboundPosition.x !== currentWaypoint.x || outboundPosition.y !== currentWaypoint.y) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const returnTravelWorldSeconds = Math.ceil(outboundPosition.waypointIndex / 3);
        const derivedDueWorldTime = returnStartWorldTime + returnTravelWorldSeconds;
        if (!Number.isSafeInteger(derivedDueWorldTime) || derivedDueWorldTime !== input.returnDueWorldTime) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }

        const shelterId = requiredString(soldierRow, "shelter_id");
        if (input.event.causationId !== input.idempotency.key
          || input.event.idempotencyKey !== input.idempotency.key
          || input.event.visibilityScope.kind !== "shelter"
          || input.event.visibilityScope.shelterId !== shelterId) {
          throw new PersistenceError("OWNERSHIP_DENIED");
        }
        const finalIndex = outboundPosition.waypointIndex;
        const arrivalPosition = {
          x: homeAnchor.x,
          y: homeAnchor.y,
          waypointIndex: finalIndex,
          progressTiles: finalIndex,
          arrived: true,
        };
        const roleFields = missionRole === "HUNTER" ? { role: missionRole, tool: missionTool } : {};
        const expectedPayload = {
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          soldierId: input.soldierId,
          ...roleFields,
          homeAnchor,
          returnDueWorldTime: input.returnDueWorldTime,
          previousPhase: "RETURNING",
          phase: "DEPOSITING",
          arrivalPosition,
          worldTime: input.worldTime,
        };
        if (canonicalJson(extractionPayload(input.event.typedPayload)) !== canonicalJson(expectedPayload)) {
          throw new PersistenceError("INVALID_INPUT");
        }

        const missionRevision = this.applyMutation(database, input.worldId, {
          entityType: "mission",
          entityId: input.missionId,
          expectedRevision: input.expectedMissionRevision,
          patch: { phase: "DEPOSITING", next_due_world_time: null },
        });
        const missionAttemptRevision = this.applyMutation(database, input.worldId, {
          entityType: "mission_attempt",
          entityId: input.missionAttemptId,
          expectedRevision: input.expectedMissionAttemptRevision,
          patch: { phase: "DEPOSITING", last_transition_world_time: input.worldTime, next_due_world_time: null },
        });
        if (input.injectFailureAt === "after_state") {
          throw new PersistenceError("INJECTED_FAILURE");
        }

        const soldierRevision = requiredInteger(soldierRow, "revision");
        const entityRevisions: Record<string, number> = {
          [`soldier:${input.soldierId}`]: soldierRevision,
          [`mission:${input.missionId}`]: missionRevision,
          [`mission_attempt:${input.missionAttemptId}`]: missionAttemptRevision,
        };
        const cursor = this.allocateCursor(database, input.worldId);
        const event = this.persistEvent(database, input.worldId, input.worldTime, cursor, input.event, entityRevisions, input.idempotency.key);
        if (input.injectFailureAt === "after_events") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        const result: CommitMissionHomeArrivalResult = {
          effect: "mission_home_reached",
          contractVersion: this.contractVersion,
          worldId: input.worldId,
          soldierId: input.soldierId,
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          eventId: event.eventId,
          eventIds: [event.eventId],
          missionRevision,
          missionAttemptRevision,
          soldierRevision,
          phase: "DEPOSITING",
          returnDueWorldTime: input.returnDueWorldTime,
          homeAnchor,
          arrivalPosition,
          worldTime: input.worldTime,
        };
        database.prepare("INSERT INTO idempotency_record (world_id, idempotency_key, binding, request_fingerprint, contract_version, outcome, result_json, event_ids_json) VALUES (?, ?, ?, ?, ?, 'committed', ?, ?)").run(
          input.worldId,
          input.idempotency.key,
          input.idempotency.binding,
          requestFingerprint,
          this.contractVersion,
          canonicalJson(result),
          canonicalJson(result.eventIds),
        );
        if (input.injectFailureAt === "before_commit") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        return result;
      });
    } catch (error) {
      const typed = classifyPersistenceError(error, "STORE_OPEN_FAILED");
      if (RECORDABLE_COMMAND_REJECTIONS.has(typed.code)) {
        try {
          this.recordRejectedIdempotency(input.worldId, input.idempotency, typed);
        } catch {
          // Preserve the original home-arrival rejection if diagnostics cannot be persisted.
        }
      }
      throw typed;
    }
  }

  commitMissionRecall(input: CommitMissionRecallInput): CommitMissionRecallResult {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.commandId);
    assertNonEmpty(input.idempotency.key);
    assertNonEmpty(input.idempotency.binding);
    assertNonEmpty(input.soldierId);
    assertNonEmpty(input.missionId);
    assertNonEmpty(input.missionAttemptId);
    if (!Number.isSafeInteger(input.worldTime) || input.worldTime < 0
      || !Number.isSafeInteger(input.expectedSoldierRevision) || input.expectedSoldierRevision < 0
      || !Number.isSafeInteger(input.expectedMissionRevision) || input.expectedMissionRevision < 0
      || !Number.isSafeInteger(input.expectedMissionAttemptRevision) || input.expectedMissionAttemptRevision < 0
      || !isMissionRole(input.role) || (input.role !== "GATHERER" && input.role !== "HUNTER")
      || !isMissionTool(input.tool) || !isMissionReturnPolicy(input.returnPolicy)
      || (input.previousPhase !== "TRAVELLING" && input.previousPhase !== "WORKING")
      || !Number.isSafeInteger(input.returnTravelWorldSeconds) || input.returnTravelWorldSeconds < 0
      || !input.event || typeof input.event !== "object") {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (input.commandId === input.idempotency.key) {
      throw new PersistenceError("INVALID_INPUT");
    }
    const recallPosition = validateRoutePosition(input.recallPosition, "INVALID_INPUT");
    const homeAnchor = validateCoordinate(input.homeAnchor, "INVALID_INPUT");
    const request = rowOf(input.idempotency.request);
    const expectedEventPayload = {
      missionId: input.missionId,
      missionAttemptId: input.missionAttemptId,
      soldierId: input.soldierId,
      ...(input.role === "HUNTER" ? { role: input.role, tool: input.tool } : {}),
      previousPhase: input.previousPhase,
      phase: "RETURNING",
      recallPosition,
      homeAnchor,
      returnTravelWorldSeconds: input.returnTravelWorldSeconds,
      returnPolicy: input.returnPolicy,
      worldTime: input.worldTime,
    };
    if (!request || request.kind !== "force_recall_soldier" || request.commandId !== input.commandId
      || input.event.eventType !== "MissionRecalled"
      || input.event.causationId !== input.commandId
      || input.event.idempotencyKey !== input.idempotency.key
      || input.event.aggregateType !== "mission"
      || input.event.aggregateId !== input.missionId
      || canonicalJson(input.event.typedPayload) !== canonicalJson(expectedEventPayload)) {
      throw new PersistenceError("INVALID_INPUT");
    }

    const database = this.db();
    try {
      return withTransaction(database, () => {
        const world = this.requireWorld(input.worldId);
        const requestFingerprint = canonicalJson(input.idempotency.request);
        const existing = rowOf(database.prepare("SELECT binding, request_fingerprint, contract_version, outcome, result_json FROM idempotency_record WHERE world_id = ? AND idempotency_key = ?").get(input.worldId, input.idempotency.key));
        if (existing) {
          if (existing.binding !== input.idempotency.binding || existing.request_fingerprint !== requestFingerprint || existing.contract_version !== this.contractVersion) {
            throw new PersistenceError("DUPLICATE_COMMAND");
          }
          if (existing.outcome === "rejected") {
            const rejection = parseJson<{ errorCode?: unknown }>(String(existing.result_json), "RECOVERY_REQUIRED");
            if (!isPersistenceErrorCode(rejection.errorCode)) {
              throw new PersistenceError("RECOVERY_REQUIRED");
            }
            throw new PersistenceError(rejection.errorCode);
          }
          if (existing.outcome !== "committed") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          const storedResult = parseJson<CommitMissionRecallResult>(String(existing.result_json), "RECOVERY_REQUIRED");
          if (!storedResult || storedResult.effect !== "mission_recalled") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          return { ...storedResult, duplicate: true };
        }

        if (input.worldTime < world.worldTime) {
          throw new PersistenceError("WORLD_TIME_REGRESSION");
        }
        if (input.worldTime > world.worldTime) {
          database.prepare("UPDATE world SET world_time = ? WHERE world_id = ? AND in_progress_world_time IS NULL AND world_time <= ?").run(input.worldTime, input.worldId, input.worldTime);
        }

        const missionRow = rowOf(database.prepare("SELECT world_id, mission_id, soldier_id, state, phase, role, tool, target_id, return_policy, active_attempt_id, encounter_id, encounter_status, next_due_world_time, revision FROM mission WHERE world_id = ? AND mission_id = ?").get(input.worldId, input.missionId));
        const attemptRow = rowOf(database.prepare("SELECT world_id, mission_attempt_id, mission_id, state, phase, role, tool, target_id, route_json, home_anchor_json, return_policy, encounter_id, encounter_status, start_world_time, last_transition_world_time, next_due_world_time, revision FROM mission_attempt WHERE world_id = ? AND mission_attempt_id = ?").get(input.worldId, input.missionAttemptId));
        const soldierRow = rowOf(database.prepare("SELECT world_id, soldier_id, shelter_id, state, role, tool, revision FROM soldier WHERE world_id = ? AND soldier_id = ?").get(input.worldId, input.soldierId));
        if (!missionRow || !attemptRow || !soldierRow) {
          throw new PersistenceError("ENTITY_NOT_FOUND");
        }

        const missionSoldierId = requiredString(missionRow, "soldier_id");
        const attemptMissionId = requiredString(attemptRow, "mission_id");
        const activeAttemptId = optionalString(missionRow, "active_attempt_id");
        const missionRole = optionalMissionRole(missionRow, "role");
        const attemptRole = optionalMissionRole(attemptRow, "role");
        const soldierRole = optionalMissionRole(soldierRow, "role");
        const missionTool = optionalMissionTool(missionRow, "tool");
        const attemptTool = optionalMissionTool(attemptRow, "tool");
        const soldierTool = optionalMissionTool(soldierRow, "tool");
        const missionPhase = optionalMissionPhase(missionRow, "phase");
        const attemptPhase = optionalMissionPhase(attemptRow, "phase");
        if (missionSoldierId !== input.soldierId || attemptMissionId !== input.missionId
          || activeAttemptId !== input.missionAttemptId) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }

        const soldierRevision = requiredInteger(soldierRow, "revision");
        const missionRevisionBefore = requiredInteger(missionRow, "revision");
        const attemptRevisionBefore = requiredInteger(attemptRow, "revision");
        if (soldierRevision !== input.expectedSoldierRevision
          || missionRevisionBefore !== input.expectedMissionRevision
          || attemptRevisionBefore !== input.expectedMissionAttemptRevision) {
          throw new PersistenceError("STALE_REVISION");
        }

        const shelterId = requiredString(soldierRow, "shelter_id");
        const owner = rowOf(database.prepare("SELECT player.binding AS binding FROM shelter JOIN player ON player.world_id = shelter.world_id AND player.player_id = shelter.player_id WHERE shelter.world_id = ? AND shelter.shelter_id = ?").get(input.worldId, shelterId));
        if (!owner) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        if (requiredString(owner, "binding") !== input.idempotency.binding) {
          throw new PersistenceError("OWNERSHIP_DENIED");
        }
        if (!input.event.visibilityScope || input.event.visibilityScope.kind !== "shelter"
          || input.event.visibilityScope.shelterId !== shelterId) {
          if (input.event.visibilityScope?.kind === "shelter" && input.event.visibilityScope.shelterId !== shelterId) {
            throw new PersistenceError("OWNERSHIP_DENIED");
          }
          throw new PersistenceError("INVALID_INPUT");
        }

        if (missionPhase === "AT_SHELTER" || attemptPhase === "AT_SHELTER") {
          throw new PersistenceError("ALREADY_AT_SHELTER");
        }
        if (missionPhase === "RETURNING" || attemptPhase === "RETURNING"
          || missionPhase === "DEPOSITING" || attemptPhase === "DEPOSITING") {
          throw new PersistenceError("MISSION_ACTIVE");
        }
        if (missionPhase !== input.previousPhase || attemptPhase !== input.previousPhase) {
          throw new PersistenceError("ROLE_LOCKED");
        }
        if (!(["ACTIVE", "active"] as string[]).includes(requiredString(missionRow, "state"))
          || !(["ACTIVE", "active"] as string[]).includes(requiredString(attemptRow, "state"))
          || requiredString(soldierRow, "state") !== "FIELD"
          || (missionRole !== "GATHERER" && missionRole !== "HUNTER")
          || missionRole !== input.role
          || attemptRole !== missionRole
          || soldierRole !== missionRole
          || missionTool !== input.tool
          || attemptTool !== missionTool
          || soldierTool !== missionTool
          || optionalString(missionRow, "target_id") === null
          || optionalString(attemptRow, "target_id") === null
          || optionalString(missionRow, "target_id") !== optionalString(attemptRow, "target_id")
          || optionalMissionReturnPolicy(missionRow, "return_policy") !== input.returnPolicy
          || optionalMissionReturnPolicy(attemptRow, "return_policy") !== input.returnPolicy) {
          throw new PersistenceError("ROLE_LOCKED");
        }

        const missionEncounterStatus = optionalEncounterState(missionRow, "encounter_status");
        const attemptEncounterStatus = optionalEncounterState(attemptRow, "encounter_status");
        if (missionEncounterStatus !== attemptEncounterStatus) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        if (missionEncounterStatus === "LOCKED" || missionEncounterStatus === "RESOLVING") {
          throw new PersistenceError("IN_COMBAT");
        }
        if (missionEncounterStatus === "RESOLVED") {
          throw new PersistenceError("ROLE_LOCKED");
        }

        const route = optionalRoute(attemptRow, "route_json");
        const persistedHomeAnchor = optionalAnchor(attemptRow, "home_anchor_json");
        if (!route || !persistedHomeAnchor
          || persistedHomeAnchor.x !== homeAnchor.x || persistedHomeAnchor.y !== homeAnchor.y
          || route.source.x !== homeAnchor.x || route.source.y !== homeAnchor.y) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const startWorldTime = requiredInteger(attemptRow, "start_world_time");
        const derivedPosition = routePositionAt(route, startWorldTime, input.worldTime);
        if (canonicalJson(derivedPosition) !== canonicalJson(recallPosition)) {
          throw new PersistenceError("INVALID_INPUT");
        }
        const expectedReturnTravelWorldSeconds = Math.ceil(recallPosition.waypointIndex / 3);
        if (expectedReturnTravelWorldSeconds !== input.returnTravelWorldSeconds) {
          throw new PersistenceError("INVALID_INPUT");
        }

        const expectedPayload = {
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          soldierId: input.soldierId,
          ...(input.role === "HUNTER" ? { role: input.role, tool: input.tool } : {}),
          previousPhase: input.previousPhase,
          phase: "RETURNING",
          recallPosition,
          homeAnchor,
          returnTravelWorldSeconds: input.returnTravelWorldSeconds,
          returnPolicy: input.returnPolicy,
          worldTime: input.worldTime,
        };
        if (canonicalJson(input.event.typedPayload) !== canonicalJson(expectedPayload)) {
          throw new PersistenceError("INVALID_INPUT");
        }

        const missionRevision = this.applyMutation(database, input.worldId, {
          entityType: "mission",
          entityId: input.missionId,
          expectedRevision: input.expectedMissionRevision,
          patch: { phase: "RETURNING", next_due_world_time: null },
        });
        const missionAttemptRevision = this.applyMutation(database, input.worldId, {
          entityType: "mission_attempt",
          entityId: input.missionAttemptId,
          expectedRevision: input.expectedMissionAttemptRevision,
          patch: { phase: "RETURNING", last_transition_world_time: input.worldTime, next_due_world_time: null },
        });
        if (input.injectFailureAt === "after_state") {
          throw new PersistenceError("INJECTED_FAILURE");
        }

        const entityRevisions: Record<string, number> = {
          [`soldier:${input.soldierId}`]: soldierRevision,
          [`mission:${input.missionId}`]: missionRevision,
          [`mission_attempt:${input.missionAttemptId}`]: missionAttemptRevision,
        };
        const cursor = this.allocateCursor(database, input.worldId);
        const event = this.persistEvent(database, input.worldId, input.worldTime, cursor, input.event, entityRevisions, input.idempotency.key);
        if (input.injectFailureAt === "after_events") {
          throw new PersistenceError("INJECTED_FAILURE");
        }

        const result: CommitMissionRecallResult = {
          effect: "mission_recalled",
          contractVersion: this.contractVersion,
          worldId: input.worldId,
          soldierId: input.soldierId,
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          eventId: event.eventId,
          eventIds: [event.eventId],
          role: input.role,
          tool: input.tool,
          previousPhase: input.previousPhase,
          phase: "RETURNING",
          returnPolicy: input.returnPolicy,
          recallPosition,
          homeAnchor,
          returnTravelWorldSeconds: input.returnTravelWorldSeconds,
          soldierRevision,
          missionRevision,
          missionAttemptRevision,
          worldTime: input.worldTime,
        };
        database.prepare("INSERT INTO idempotency_record (world_id, idempotency_key, binding, request_fingerprint, contract_version, outcome, result_json, event_ids_json) VALUES (?, ?, ?, ?, ?, 'committed', ?, ?)").run(
          input.worldId,
          input.idempotency.key,
          input.idempotency.binding,
          requestFingerprint,
          this.contractVersion,
          canonicalJson(result),
          canonicalJson(result.eventIds),
        );
        if (input.injectFailureAt === "before_commit") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        return result;
      });
    } catch (error) {
      const typed = classifyPersistenceError(error, "STORE_OPEN_FAILED");
      if (RECORDABLE_COMMAND_REJECTIONS.has(typed.code)) {
        try {
          this.recordRejectedIdempotency(input.worldId, input.idempotency, typed);
        } catch {
          // Preserve the authoritative recall rejection if diagnostics cannot be written.
        }
      }
      throw typed;
    }
  }

  commitMissionDeposit(input: CommitMissionDepositInput): CommitMissionDepositResult {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.idempotency.key);
    assertNonEmpty(input.idempotency.binding);
    assertNonEmpty(input.soldierId);
    assertNonEmpty(input.missionId);
    assertNonEmpty(input.missionAttemptId);
    assertNonEmpty(input.shelterId);
    if (!Number.isSafeInteger(input.worldTime) || input.worldTime < 0
      || !Number.isSafeInteger(input.homeCrossingWorldTime) || input.homeCrossingWorldTime < 0
      || !Number.isSafeInteger(input.expectedSoldierRevision) || input.expectedSoldierRevision < 0
      || !Number.isSafeInteger(input.expectedMissionRevision) || input.expectedMissionRevision < 0
      || !Number.isSafeInteger(input.expectedMissionAttemptRevision) || input.expectedMissionAttemptRevision < 0
      || !Number.isSafeInteger(input.expectedShelterRevision) || input.expectedShelterRevision < 0
      || !Array.isArray(input.expectedCargo)) {
      throw new PersistenceError("INVALID_INPUT");
    }

    const database = this.db();
    try {
      return withTransaction(database, () => {
        const world = this.requireWorld(input.worldId);
        const requestFingerprint = canonicalJson(input.idempotency.request);
        const existing = rowOf(database.prepare("SELECT binding, request_fingerprint, contract_version, outcome, result_json FROM idempotency_record WHERE world_id = ? AND idempotency_key = ?").get(input.worldId, input.idempotency.key));
        if (existing) {
          if (existing.binding !== input.idempotency.binding || existing.request_fingerprint !== requestFingerprint || existing.contract_version !== this.contractVersion) {
            throw new PersistenceError("DUPLICATE_COMMAND");
          }
          if (existing.outcome === "rejected") {
            const rejection = parseJson<{ errorCode?: unknown }>(String(existing.result_json), "RECOVERY_REQUIRED");
            if (!isPersistenceErrorCode(rejection.errorCode)) {
              throw new PersistenceError("RECOVERY_REQUIRED");
            }
            throw new PersistenceError(rejection.errorCode);
          }
          if (existing.outcome !== "committed") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          const storedResult = parseJson<CommitMissionDepositResult>(String(existing.result_json), "RECOVERY_REQUIRED");
          if (!storedResult || storedResult.effect !== "mission_deposited") {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          return { ...storedResult, duplicate: true };
        }

        if (input.worldTime < world.worldTime) {
          throw new PersistenceError("WORLD_TIME_REGRESSION");
        }
        if (input.worldTime > world.worldTime) {
          database.prepare("UPDATE world SET world_time = ? WHERE world_id = ? AND in_progress_world_time IS NULL AND world_time <= ?").run(input.worldTime, input.worldId, input.worldTime);
        }

        const missionRow = rowOf(database.prepare("SELECT world_id, mission_id, soldier_id, state, phase, role, tool, target_id, return_policy, active_attempt_id, encounter_id, encounter_status, revision, work_id, next_due_world_time, claim_id, lease_expires_at_wall_ms FROM mission WHERE world_id = ? AND mission_id = ?").get(input.worldId, input.missionId));
        const attemptRow = rowOf(database.prepare("SELECT world_id, mission_attempt_id, mission_id, state, phase, role, tool, target_id, return_policy, encounter_id, encounter_status, last_transition_world_time, revision, work_id, next_due_world_time, claim_id, lease_expires_at_wall_ms FROM mission_attempt WHERE world_id = ? AND mission_attempt_id = ?").get(input.worldId, input.missionAttemptId));
        const soldierRow = rowOf(database.prepare("SELECT world_id, soldier_id, shelter_id, state, role, tool, revision, work_id, next_due_world_time, claim_id, lease_expires_at_wall_ms FROM soldier WHERE world_id = ? AND soldier_id = ?").get(input.worldId, input.soldierId));
        if (!missionRow || !attemptRow || !soldierRow) {
          throw new PersistenceError("ENTITY_NOT_FOUND");
        }

        const soldierShelterId = requiredString(soldierRow, "shelter_id");
        if (soldierShelterId !== input.shelterId) {
          throw new PersistenceError("OWNERSHIP_DENIED");
        }
        const shelterRow = rowOf(database.prepare("SELECT world_id, shelter_id, player_id, revision, coins FROM shelter WHERE world_id = ? AND shelter_id = ?").get(input.worldId, soldierShelterId));
        if (!shelterRow) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }

        const missionState = requiredString(missionRow, "state");
        const attemptState = requiredString(attemptRow, "state");
        const missionPhase = requiredString(missionRow, "phase");
        const attemptPhase = requiredString(attemptRow, "phase");
        const missionRole = optionalString(missionRow, "role");
        const attemptRole = optionalString(attemptRow, "role");
        const soldierRole = optionalString(soldierRow, "role");
        const missionTool = optionalString(missionRow, "tool");
        const attemptTool = optionalString(attemptRow, "tool");
        const soldierTool = optionalString(soldierRow, "tool");
        const missionTargetId = optionalString(missionRow, "target_id");
        const attemptTargetId = optionalString(attemptRow, "target_id");
        const missionActiveAttemptId = optionalString(missionRow, "active_attempt_id");
        const missionWorkId = optionalString(missionRow, "work_id");
        const attemptWorkId = optionalString(attemptRow, "work_id");
        const soldierWorkId = optionalString(soldierRow, "work_id");
        const missionDue = optionalInteger(missionRow, "next_due_world_time");
        const attemptDue = optionalInteger(attemptRow, "next_due_world_time");
        const soldierDue = optionalInteger(soldierRow, "next_due_world_time");
        if (requiredInteger(soldierRow, "revision") !== input.expectedSoldierRevision
          || requiredInteger(missionRow, "revision") !== input.expectedMissionRevision
          || requiredInteger(attemptRow, "revision") !== input.expectedMissionAttemptRevision
          || requiredInteger(shelterRow, "revision") !== input.expectedShelterRevision) {
          throw new PersistenceError("STALE_REVISION");
        }
        if (!(["ACTIVE", "active"] as string[]).includes(missionState)
          || !(["ACTIVE", "active"] as string[]).includes(attemptState)
          || missionPhase !== "DEPOSITING"
          || attemptPhase !== "DEPOSITING"
          || requiredString(soldierRow, "state") !== "FIELD"
          || (missionRole !== "GATHERER" && missionRole !== "HUNTER")
          || attemptRole !== missionRole
          || soldierRole !== missionRole
          || missionTool === null
          || missionTool !== attemptTool
          || attemptTool !== soldierTool
          || missionTargetId === null
          || missionTargetId !== attemptTargetId
          || missionActiveAttemptId !== input.missionAttemptId
          || missionWorkId !== `mission-attempt:${input.missionAttemptId}`
          || attemptWorkId !== `mission-attempt:${input.missionAttemptId}`
          || soldierWorkId !== `mission-attempt:${input.missionAttemptId}`
          || missionDue !== null
          || attemptDue !== null
          || soldierDue !== null
          || requiredString(missionRow, "soldier_id") !== input.soldierId
          || requiredString(attemptRow, "mission_id") !== input.missionId) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }

        const homeCrossingWorldTime = requiredInteger(attemptRow, "last_transition_world_time");
        if (homeCrossingWorldTime !== input.homeCrossingWorldTime || homeCrossingWorldTime > input.worldTime) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }

        const soldierCargo = cargoRecordsFor(database, input.worldId, { soldierId: input.soldierId });
        const attemptCargo = cargoRecordsFor(database, input.worldId, { missionAttemptId: input.missionAttemptId });
        const activeCargo = cargoRecordsFor(database, input.worldId, { soldierId: input.soldierId, missionAttemptId: input.missionAttemptId });
        if (attemptCargo.length !== activeCargo.length
          || attemptCargo.some((cargo) => cargo.soldierId !== input.soldierId)
          || soldierCargo.length !== activeCargo.length
          || soldierCargo.some((cargo) => cargo.missionAttemptId !== input.missionAttemptId)) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }

        const expectedCargo = input.expectedCargo;
        const actualCargoJson = canonicalJson(activeCargo);
        let expectedCargoJson: string;
        try {
          expectedCargoJson = canonicalJson(expectedCargo);
        } catch (error) {
          throw error instanceof PersistenceError ? error : new PersistenceError("INVALID_INPUT", { cause: error });
        }
        if (expectedCargo.length !== activeCargo.length
          || expectedCargo.some((cargo) => !cargo || typeof cargo !== "object" || Array.isArray(cargo))) {
          throw new PersistenceError("INVALID_INPUT");
        }
        const actualById = new Map(activeCargo.map((cargo) => [cargo.cargoId, cargo]));
        const expectedById = new Map(expectedCargo.map((cargo) => [cargo.cargoId, cargo]));
        const sameIds = expectedById.size === actualById.size && [...actualById.keys()].every((cargoId) => expectedById.has(cargoId));
        if (sameIds && expectedCargo.some((cargo) => actualById.get(cargo.cargoId)?.revision !== cargo.revision)) {
          throw new PersistenceError("STALE_REVISION");
        }
        if (expectedCargoJson !== actualCargoJson) {
          throw new PersistenceError("INVALID_INPUT");
        }
        if (missionRole === "HUNTER" && activeCargo.length !== 0) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }

        let cargoQuantity = 0;
        let cargoCapacityUsed = 0;
        let coinDelta = 0;
        for (const cargo of activeCargo) {
          if (cargo.worldId !== input.worldId
            || cargo.soldierId !== input.soldierId
            || cargo.missionAttemptId !== input.missionAttemptId
            || (cargo.resourceType !== "wood" && cargo.resourceType !== "rock")
            || cargo.sourceNodeId === null
            || cargo.quantity <= 0
            || cargo.capacityUsed !== cargo.quantity
            || cargo.acquiredWorldTime === null
            || cargo.acquiredWorldTime > homeCrossingWorldTime) {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          const source = rowOf(database.prepare("SELECT resource_type FROM resource_node WHERE world_id = ? AND resource_node_id = ?").get(input.worldId, cargo.sourceNodeId));
          if (!source || requiredString(source, "resource_type") !== cargo.resourceType) {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          if (cargo.quantity > Number.MAX_SAFE_INTEGER - cargoQuantity
            || cargo.capacityUsed > Number.MAX_SAFE_INTEGER - cargoCapacityUsed) {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          const rate = cargo.resourceType === "wood" ? 1 : 3;
          if (cargo.quantity > Math.floor(Number.MAX_SAFE_INTEGER / rate)) {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          const value = cargo.quantity * rate;
          if (!Number.isSafeInteger(value) || value > Number.MAX_SAFE_INTEGER - coinDelta) {
            throw new PersistenceError("RECOVERY_REQUIRED");
          }
          cargoQuantity += cargo.quantity;
          cargoCapacityUsed += cargo.capacityUsed;
          coinDelta += value;
        }

        const previousCoins = requiredInteger(shelterRow, "coins");
        if (previousCoins < 0 || coinDelta > Number.MAX_SAFE_INTEGER - previousCoins) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const newCoins = previousCoins + coinDelta;
        const workId = `mission-deposit:${input.missionAttemptId}:${input.homeCrossingWorldTime}`;
        const cargoEventId = `mission-cargo-deposited:${input.missionAttemptId}:${input.homeCrossingWorldTime}`;
        const items = activeCargo.map((cargo) => ({
          cargoId: cargo.cargoId,
          sourceNodeId: cargo.sourceNodeId,
          resourceType: cargo.resourceType,
          quantity: cargo.quantity,
          capacityUsed: cargo.capacityUsed,
          acquiredWorldTime: cargo.acquiredWorldTime,
        }));
        const roleFields = missionRole === "HUNTER" ? { role: missionRole, tool: missionTool, settlementReason: "HUNTER_VICTORY" } : {};
        const expectedCargoPayload = {
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          soldierId: input.soldierId,
          shelterId: input.shelterId,
          ...roleFields,
          items,
          totalQuantity: cargoQuantity,
          totalCapacityUsed: cargoCapacityUsed,
          coinDelta,
          previousPhase: "DEPOSITING",
          phase: "AT_SHELTER",
          homeCrossingWorldTime: input.homeCrossingWorldTime,
          worldTime: input.worldTime,
        };
        const cargoEvent = input.cargoDepositedEvent;
        if (!cargoEvent || typeof cargoEvent !== "object"
          || cargoEvent.eventId !== cargoEventId
          || cargoEvent.eventType !== "CargoDeposited"
          || cargoEvent.aggregateType !== "mission"
          || cargoEvent.aggregateId !== input.missionId
          || cargoEvent.causationId !== workId
          || cargoEvent.idempotencyKey !== workId
          || !cargoEvent.visibilityScope
          || cargoEvent.visibilityScope.kind !== "shelter"
          || cargoEvent.visibilityScope.shelterId !== input.shelterId) {
          if (cargoEvent?.visibilityScope?.kind === "shelter" && cargoEvent.visibilityScope.shelterId !== input.shelterId) {
            throw new PersistenceError("OWNERSHIP_DENIED");
          }
          throw new PersistenceError("INVALID_INPUT");
        }
        if (canonicalJson(cargoEvent.typedPayload) !== canonicalJson(expectedCargoPayload)) {
          throw new PersistenceError("INVALID_INPUT");
        }

        let coinsCreditedEventId: string | null = null;
        const coinsEvent = input.coinsCreditedEvent;
        if (coinDelta > 0) {
          coinsCreditedEventId = `shelter-coins-credited:${input.shelterId}:${input.missionAttemptId}:${input.homeCrossingWorldTime}`;
          const expectedCoinsPayload = {
            shelterId: input.shelterId,
            missionId: input.missionId,
            missionAttemptId: input.missionAttemptId,
            soldierId: input.soldierId,
            cargoEventId,
            coinDelta,
            previousCoins,
            newCoins,
            worldTime: input.worldTime,
          };
          if (!coinsEvent || typeof coinsEvent !== "object"
            || coinsEvent.eventId !== coinsCreditedEventId
            || coinsEvent.eventType !== "CoinsCredited"
            || coinsEvent.aggregateType !== "shelter"
            || coinsEvent.aggregateId !== input.shelterId
            || coinsEvent.causationId !== workId
            || coinsEvent.idempotencyKey !== workId
            || !coinsEvent.visibilityScope
            || coinsEvent.visibilityScope.kind !== "shelter"
            || coinsEvent.visibilityScope.shelterId !== input.shelterId) {
            if (coinsEvent?.visibilityScope?.kind === "shelter" && coinsEvent.visibilityScope.shelterId !== input.shelterId) {
              throw new PersistenceError("OWNERSHIP_DENIED");
            }
            throw new PersistenceError("INVALID_INPUT");
          }
          if (canonicalJson(coinsEvent.typedPayload) !== canonicalJson(expectedCoinsPayload)) {
            throw new PersistenceError("INVALID_INPUT");
          }
        } else if (coinsEvent !== undefined) {
          throw new PersistenceError("INVALID_INPUT");
        }

        for (const cargo of activeCargo) {
          const deleted = database.prepare("DELETE FROM cargo WHERE world_id = ? AND cargo_id = ? AND revision = ?").run(input.worldId, cargo.cargoId, cargo.revision);
          if (deleted.changes !== 1) {
            throw new PersistenceError("STALE_REVISION");
          }
        }
        if (input.injectFailureAt === "after_cargo") {
          throw new PersistenceError("INJECTED_FAILURE");
        }

        const shelterRevision = this.applyMutation(database, input.worldId, {
          entityType: "shelter",
          entityId: input.shelterId,
          expectedRevision: input.expectedShelterRevision,
          patch: { coins: newCoins },
        });
        const soldierRevision = this.applyMutation(database, input.worldId, {
          entityType: "soldier",
          entityId: input.soldierId,
          expectedRevision: input.expectedSoldierRevision,
          patch: { state: "AT_SHELTER", role: null, tool: null, work_id: null, next_due_world_time: null, claim_id: null, lease_expires_at_wall_ms: null },
        });
        const missionRevision = this.applyMutation(database, input.worldId, {
          entityType: "mission",
          entityId: input.missionId,
          expectedRevision: input.expectedMissionRevision,
          patch: { state: "COMPLETED", phase: "AT_SHELTER", role: null, tool: null, target_id: null, return_policy: null, active_attempt_id: null, encounter_id: null, encounter_status: null, monster_reissue_budget: 1, danger_cell_json: null, waiting_review_reason: null, work_id: null, next_due_world_time: null, claim_id: null, lease_expires_at_wall_ms: null },
        });
        const missionAttemptRevision = this.applyMutation(database, input.worldId, {
          entityType: "mission_attempt",
          entityId: input.missionAttemptId,
          expectedRevision: input.expectedMissionAttemptRevision,
          patch: { state: "COMPLETED", phase: "TERMINAL", encounter_id: null, encounter_status: null, work_id: null, next_due_world_time: null, claim_id: null, lease_expires_at_wall_ms: null },
        });
        if (input.injectFailureAt === "after_state") {
          throw new PersistenceError("INJECTED_FAILURE");
        }

        const entityRevisions: Record<string, number> = {
          [`shelter:${input.shelterId}`]: shelterRevision,
          [`soldier:${input.soldierId}`]: soldierRevision,
          [`mission:${input.missionId}`]: missionRevision,
          [`mission_attempt:${input.missionAttemptId}`]: missionAttemptRevision,
        };
        const eventIds: string[] = [];
        const cursor = this.allocateCursor(database, input.worldId);
        const cargoEventPersisted = this.persistEvent(database, input.worldId, input.worldTime, cursor, cargoEvent, entityRevisions, input.idempotency.key);
        eventIds.push(cargoEventPersisted.eventId);
        if (coinsEvent) {
          const coinCursor = this.allocateCursor(database, input.worldId);
          const coinsEventPersisted = this.persistEvent(database, input.worldId, input.worldTime, coinCursor, coinsEvent, entityRevisions, input.idempotency.key);
          eventIds.push(coinsEventPersisted.eventId);
        }
        if (input.injectFailureAt === "after_events") {
          throw new PersistenceError("INJECTED_FAILURE");
        }

        const result: CommitMissionDepositResult = {
          effect: "mission_deposited",
          contractVersion: this.contractVersion,
          worldId: input.worldId,
          soldierId: input.soldierId,
          missionId: input.missionId,
          missionAttemptId: input.missionAttemptId,
          shelterId: input.shelterId,
          cargoEventId,
          coinsCreditedEventId,
          eventIds,
          cargoQuantity,
          cargoCapacityUsed,
          coinDelta,
          previousCoins,
          newCoins,
          missionRevision,
          missionAttemptRevision,
          soldierRevision,
          shelterRevision,
          phase: "AT_SHELTER",
          homeCrossingWorldTime: input.homeCrossingWorldTime,
          worldTime: input.worldTime,
        };
        database.prepare("INSERT INTO idempotency_record (world_id, idempotency_key, binding, request_fingerprint, contract_version, outcome, result_json, event_ids_json) VALUES (?, ?, ?, ?, ?, 'committed', ?, ?)").run(
          input.worldId,
          input.idempotency.key,
          input.idempotency.binding,
          requestFingerprint,
          this.contractVersion,
          canonicalJson(result),
          canonicalJson(eventIds),
        );
        if (input.injectFailureAt === "before_commit") {
          throw new PersistenceError("INJECTED_FAILURE");
        }
        return result;
      });
    } catch (error) {
      // Deposit is a worker-owned retry boundary. Do not persist a rejected
      // idempotency result: a fresh revision read must be able to retry the
      // same logical crossing after a transient recovery fault.
      throw classifyPersistenceError(error, "STORE_OPEN_FAILED");
    }
  }

  saveSnapshot(input: SnapshotInput): WorldSnapshotRecord {
    return withTransaction(this.db(), () => this.insertSnapshot(this.db(), input));
  }

  private insertSnapshot(database: DatabaseSync, input: SnapshotInput): WorldSnapshotRecord {
    const snapshotVersion = input.snapshotVersion ?? CURRENT_SNAPSHOT_VERSION;
    const contractVersion = input.contractVersion ?? this.contractVersion;
    if (!input.worldSnapshotId.trim() || snapshotVersion !== CURRENT_SNAPSHOT_VERSION || contractVersion !== this.contractVersion || !Number.isSafeInteger(input.worldTime) || input.worldTime < 0 || !Number.isSafeInteger(input.lastWorldEventCursor) || input.lastWorldEventCursor < 0 || !Object.entries(input.entityRevisions).every(([key, revision]) => key.trim() !== "" && Number.isSafeInteger(revision) && revision >= 0)) {
      throw new PersistenceError("SNAPSHOT_INVALID");
    }
    const world = this.requireWorld(input.worldId);
    if (input.lastWorldEventCursor > world.worldEventCursor || input.worldTime > world.worldTime) {
      throw new PersistenceError("SNAPSHOT_INVALID");
    }
    const entityRevisionsJson = canonicalJson(input.entityRevisions);
    const stateJson = canonicalJson(input.state);
    const stateHash = this.hash(stateJson);
    try {
      database.prepare("INSERT INTO world_snapshot (world_snapshot_id, world_id, snapshot_version, contract_version, world_time, last_world_event_cursor, entity_revisions_json, state_json, state_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(input.worldSnapshotId, input.worldId, snapshotVersion, contractVersion, input.worldTime, input.lastWorldEventCursor, entityRevisionsJson, stateJson, stateHash);
    } catch (error) {
      throw classifyPersistenceError(error, "SNAPSHOT_INVALID");
    }
    return { ...input, snapshotVersion, contractVersion, stateHash };
  }

  recoverWorld(worldId: string): RecoveryResult {
    const database = this.db();
    const world = this.requireWorld(worldId);
    const rows = database.prepare("SELECT event_id, event_version, contract_version, event_type, world_id, world_event_cursor, world_time, causation_id, idempotency_key, aggregate_type, aggregate_id, aggregate_revision, visibility_scope_json, typed_payload_json, affected_entity_revisions_json FROM domain_event WHERE world_id = ? ORDER BY world_event_cursor ASC").all(worldId) as Row[];
    const events = rows.map((row) => this.parseEventRow(row));
    for (let index = 0; index < events.length; index += 1) {
      if (events[index]?.worldEventCursor !== index + 1) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
    }
    if (events.length !== world.worldEventCursor) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }

    const snapshotRows = database.prepare("SELECT world_snapshot_id, world_id, snapshot_version, contract_version, world_time, last_world_event_cursor, entity_revisions_json, state_json, state_hash FROM world_snapshot WHERE world_id = ? ORDER BY rowid DESC").all(worldId) as Row[];
    let snapshot: WorldSnapshotRecord | null = null;
    const latest = snapshotRows[0];
    if (latest) {
      const snapshotVersion = requiredNumber(latest, "snapshot_version");
      const contractVersion = requiredString(latest, "contract_version");
      if (snapshotVersion !== CURRENT_SNAPSHOT_VERSION || contractVersion !== this.contractVersion) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const entityRevisions = parseJson<Record<string, number>>(requiredString(latest, "entity_revisions_json"), "RECOVERY_REQUIRED");
      if (!entityRevisions || typeof entityRevisions !== "object" || Array.isArray(entityRevisions)) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const stateJson = requiredString(latest, "state_json");
      const stateHash = requiredString(latest, "state_hash");
      if (stateHash !== this.hash(stateJson)) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      snapshot = {
        worldSnapshotId: requiredString(latest, "world_snapshot_id"),
        worldId: requiredString(latest, "world_id"),
        snapshotVersion,
        contractVersion,
        worldTime: requiredNumber(latest, "world_time"),
        lastWorldEventCursor: requiredNumber(latest, "last_world_event_cursor"),
        entityRevisions,
        state: parseJson(stateJson, "RECOVERY_REQUIRED"),
        stateHash,
      };
      if (snapshot.lastWorldEventCursor > world.worldEventCursor || snapshot.worldTime > world.worldTime) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      this.validateSnapshotRevisions(snapshot, events);
    } else if (events.length > 0) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }

    const replayEvents = events.filter((event) => event.worldEventCursor > (snapshot?.lastWorldEventCursor ?? 0));
    return { world, snapshot, events: replayEvents };
  }

  signalSlot(worldId: string, shelterId: string, opaqueBinding: string): SignalSlotRecord | null {
    const row = rowOf(this.db().prepare("SELECT * FROM agent_signal_slot WHERE world_id = ? AND shelter_id = ? AND opaque_binding = ?").get(worldId, shelterId, opaqueBinding));
    return row ? this.parseSignalSlot(row) : null;
  }

  outboxDelivery(worldId: string, signalId: string): OutboxDeliveryRecord | null {
    const row = rowOf(this.db().prepare("SELECT delivery_id, world_id, shelter_id, opaque_binding, signal_id, status, attempt_count, lease_id, lease_expires_at_wall_ms, last_outcome FROM outbox_delivery WHERE world_id = ? AND signal_id = ?").get(worldId, signalId));
    return row ? this.parseDelivery(row) : null;
  }

  /**
   * Return one deterministic delivery candidate for the game-side adapter.
   * Only pending records and in-flight records whose wall-time lease has
   * expired are eligible. This read does not claim or mutate the record; the
   * caller must immediately use claimDelivery with an explicit lease identity.
   */
  nextDeliveryCandidate(worldId: string, nowWallTimeMs: number): OutboxDeliveryRecord | null {
    assertNonEmpty(worldId);
    if (!Number.isFinite(nowWallTimeMs) || nowWallTimeMs < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    this.requireWorld(worldId);
    const row = rowOf(this.db().prepare(
      "SELECT delivery_id, world_id, shelter_id, opaque_binding, signal_id, status, attempt_count, lease_id, lease_expires_at_wall_ms, last_outcome "
      + "FROM outbox_delivery WHERE world_id = ? AND (status = 'pending' OR (status = 'in_flight' AND lease_expires_at_wall_ms IS NOT NULL AND lease_expires_at_wall_ms <= ?)) "
      + "ORDER BY updated_at ASC, signal_id ASC LIMIT 1",
    ).get(worldId, nowWallTimeMs));
    return row ? this.parseDelivery(row) : null;
  }

  claimDelivery(input: DeliveryClaimInput): OutboxDeliveryRecord {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.signalId);
    assertNonEmpty(input.leaseId);
    if (!Number.isFinite(input.nowWallTimeMs) || !Number.isFinite(input.leaseDurationMs) || input.leaseDurationMs <= 0 || !Number.isFinite(input.nowWallTimeMs + input.leaseDurationMs)) {
      throw new PersistenceError("INVALID_INPUT");
    }
    return withTransaction(this.db(), () => {
      const row = rowOf(this.db().prepare("SELECT delivery_id, world_id, shelter_id, opaque_binding, signal_id, status, attempt_count, lease_id, lease_expires_at_wall_ms, last_outcome FROM outbox_delivery WHERE world_id = ? AND signal_id = ?").get(input.worldId, input.signalId));
      if (!row) {
        throw new PersistenceError("SIGNAL_NOT_FOUND");
      }
      const status = row.status;
      if (!isSignalStatus(status)) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      if (status === "acknowledged" || status === "terminally_rejected") {
        return this.parseDelivery(row);
      }
      this.requireDeliverySlot(input.worldId, row);
      if (status === "in_flight" && typeof row.lease_expires_at_wall_ms === "number" && row.lease_expires_at_wall_ms > input.nowWallTimeMs) {
        throw new PersistenceError("LEASE_CONFLICT");
      }
      const attemptCount = requiredNumber(row, "attempt_count") + 1;
      const expires = input.nowWallTimeMs + input.leaseDurationMs;
      this.db().prepare("UPDATE outbox_delivery SET status = 'in_flight', attempt_count = ?, lease_id = ?, lease_expires_at_wall_ms = ?, updated_at = CURRENT_TIMESTAMP WHERE world_id = ? AND signal_id = ?").run(attemptCount, input.leaseId, expires, input.worldId, input.signalId);
      this.db().prepare("UPDATE agent_signal_slot SET status = 'in_flight', attempt_count = ?, lease_id = ?, lease_expires_at_wall_ms = ?, updated_at = CURRENT_TIMESTAMP WHERE world_id = ? AND signal_id = ?").run(attemptCount, input.leaseId, expires, input.worldId, input.signalId);
      return this.outboxDelivery(input.worldId, input.signalId) as OutboxDeliveryRecord;
    });
  }

  acknowledgeDelivery(input: DeliveryAckInput): DeliveryResult {
    this.assertDeliveryInput(input);
    if (input.deliveryBoundary !== undefined
      && input.deliveryBoundary !== "transport_accepted"
      && input.deliveryBoundary !== "receiver_queue_accepted") {
      throw new PersistenceError("INVALID_INPUT");
    }
    return withTransaction(this.db(), () => {
      const row = rowOf(this.db().prepare("SELECT delivery_id, world_id, shelter_id, opaque_binding, signal_id, status, attempt_count, lease_id, lease_expires_at_wall_ms, last_outcome FROM outbox_delivery WHERE world_id = ? AND signal_id = ?").get(input.worldId, input.signalId));
      if (!row) {
        throw new PersistenceError("SIGNAL_NOT_FOUND");
      }
      if (row.status === "acknowledged" || row.status === "terminally_rejected") {
        return { signalId: input.signalId, status: row.status, eventId: typeof row.last_outcome === "string" ? row.last_outcome : null, duplicate: true };
      }
      if (!isSignalStatus(row.status)) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      if (row.status !== "in_flight" || row.lease_id !== input.leaseId) {
        throw new PersistenceError("LEASE_CONFLICT");
      }
      this.requireDeliverySlot(input.worldId, row);
      if (typeof row.lease_expires_at_wall_ms === "number" && row.lease_expires_at_wall_ms <= input.nowWallTimeMs) {
        throw new PersistenceError("LEASE_CONFLICT");
      }
      const world = this.requireWorld(input.worldId);
      const slot = this.signalSlot(input.worldId, requiredString(row, "shelter_id"), requiredString(row, "opaque_binding"));
      if (!slot) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const eventId = `continuation-delivered:${input.signalId}`;
      const cursor = this.allocateCursor(this.db(), input.worldId);
      this.persistEvent(this.db(), input.worldId, world.worldTime, cursor, {
        eventId,
        eventType: "ContinuationDelivered",
        causationId: input.signalId,
        aggregateType: "shelter",
        aggregateId: slot.shelterId,
        aggregateRevision: this.getShelter(input.worldId, slot.shelterId)?.revision ?? null,
        visibilityScope: { kind: "shelter", shelterId: slot.shelterId },
        typedPayload: {
          signalId: input.signalId,
          cursorStart: slot.cursorStart,
          cursorEnd: slot.cursorEnd,
          deliveryBoundary: input.deliveryBoundary ?? "transport_accepted",
        },
      }, {}, null);
      this.db().prepare("UPDATE outbox_delivery SET status = 'acknowledged', lease_id = NULL, lease_expires_at_wall_ms = NULL, last_outcome = ?, updated_at = CURRENT_TIMESTAMP WHERE world_id = ? AND signal_id = ?").run(eventId, input.worldId, input.signalId);
      this.db().prepare("UPDATE agent_signal_slot SET status = 'acknowledged', lease_id = NULL, lease_expires_at_wall_ms = NULL, updated_at = CURRENT_TIMESTAMP WHERE world_id = ? AND signal_id = ?").run(input.worldId, input.signalId);
      return { signalId: input.signalId, status: "acknowledged" as const, eventId };
    });
  }

  retryDelivery(input: DeliveryAckInput, outcome = "RETRYABLE_FAILURE"): DeliveryResult {
    this.assertDeliveryInput(input);
    return withTransaction(this.db(), () => {
      const row = rowOf(this.db().prepare("SELECT signal_id, shelter_id, opaque_binding, status, lease_id FROM outbox_delivery WHERE world_id = ? AND signal_id = ?").get(input.worldId, input.signalId));
      if (!row) {
        throw new PersistenceError("SIGNAL_NOT_FOUND");
      }
      if (row.status === "acknowledged" || row.status === "terminally_rejected") {
        return { signalId: input.signalId, status: row.status, eventId: null, duplicate: true };
      }
      if (!isSignalStatus(row.status)) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      if (row.status !== "in_flight" || row.lease_id !== input.leaseId) {
        throw new PersistenceError("LEASE_CONFLICT");
      }
      this.requireDeliverySlot(input.worldId, row);
      this.db().prepare("UPDATE outbox_delivery SET status = 'pending', lease_id = NULL, lease_expires_at_wall_ms = NULL, last_outcome = ?, updated_at = CURRENT_TIMESTAMP WHERE world_id = ? AND signal_id = ?").run(outcome, input.worldId, input.signalId);
      this.db().prepare("UPDATE agent_signal_slot SET status = 'pending', lease_id = NULL, lease_expires_at_wall_ms = NULL, last_error_code = ?, updated_at = CURRENT_TIMESTAMP WHERE world_id = ? AND signal_id = ?").run(outcome, input.worldId, input.signalId);
      return { signalId: input.signalId, status: "pending" as const, eventId: null };
    });
  }

  terminalRejectDelivery(input: DeliveryAckInput, outcome = "TERMINAL_REJECTED"): DeliveryResult {
    this.assertDeliveryInput(input);
    return withTransaction(this.db(), () => {
      const row = rowOf(this.db().prepare("SELECT signal_id, shelter_id, opaque_binding, status, lease_id, lease_expires_at_wall_ms FROM outbox_delivery WHERE world_id = ? AND signal_id = ?").get(input.worldId, input.signalId));
      if (!row) {
        throw new PersistenceError("SIGNAL_NOT_FOUND");
      }
      if (row.status === "acknowledged" || row.status === "terminally_rejected") {
        return { signalId: input.signalId, status: row.status, eventId: null, duplicate: true };
      }
      if (!isSignalStatus(row.status)) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      if (row.status !== "in_flight" || row.lease_id !== input.leaseId) {
        throw new PersistenceError("LEASE_CONFLICT");
      }
      this.requireDeliverySlot(input.worldId, row);
      if (typeof row.lease_expires_at_wall_ms === "number" && row.lease_expires_at_wall_ms <= input.nowWallTimeMs) {
        throw new PersistenceError("LEASE_CONFLICT");
      }
      this.db().prepare("UPDATE outbox_delivery SET status = 'terminally_rejected', lease_id = NULL, lease_expires_at_wall_ms = NULL, last_outcome = ?, updated_at = CURRENT_TIMESTAMP WHERE world_id = ? AND signal_id = ?").run(outcome, input.worldId, input.signalId);
      this.db().prepare("UPDATE agent_signal_slot SET status = 'terminally_rejected', lease_id = NULL, lease_expires_at_wall_ms = NULL, last_error_code = ?, updated_at = CURRENT_TIMESTAMP WHERE world_id = ? AND signal_id = ?").run(outcome, input.worldId, input.signalId);
      return { signalId: input.signalId, status: "terminally_rejected" as const, eventId: null };
    });
  }

  private db(): DatabaseSync {
    if (!this.database?.isOpen) {
      throw new PersistenceError("STORE_NOT_OPEN");
    }
    return this.database;
  }

  private recordRejectedCommand(database: DatabaseSync, input: CommitTransitionInput, error: PersistenceError): void {
    this.recordRejectedIdempotencyWithDatabase(database, input.worldId, input.idempotency, error);
  }

  recordRejectedIdempotency(worldId: string, idempotency: IdempotencyInput, error: PersistenceError): void {
    this.recordRejectedIdempotencyWithDatabase(this.db(), worldId, idempotency, error);
  }

  private recordRejectedIdempotencyWithDatabase(database: DatabaseSync, worldId: string, idempotency: IdempotencyInput, error: PersistenceError): void {
    const requestFingerprint = canonicalJson(idempotency.request);
    withTransaction(database, () => {
      const existing = rowOf(database.prepare("SELECT binding, request_fingerprint, contract_version, outcome, result_json FROM idempotency_record WHERE world_id = ? AND idempotency_key = ?").get(worldId, idempotency.key));
      if (existing) {
        if (existing.binding !== idempotency.binding
          || existing.request_fingerprint !== requestFingerprint
          || existing.contract_version !== this.contractVersion) {
          throw new PersistenceError("DUPLICATE_COMMAND");
        }
        if (existing.outcome !== "rejected") {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        const result = rowOf(parseJson<unknown>(requiredString(existing, "result_json"), "RECOVERY_REQUIRED"));
        if (!result || Object.keys(result).length !== 1 || result.errorCode !== error.code) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        return;
      }
      database.prepare("INSERT INTO idempotency_record (world_id, idempotency_key, binding, request_fingerprint, contract_version, outcome, result_json, event_ids_json) VALUES (?, ?, ?, ?, ?, 'rejected', ?, '[]')").run(
        worldId,
        idempotency.key,
        idempotency.binding,
        requestFingerprint,
        this.contractVersion,
        canonicalJson({ errorCode: error.code }),
      );
    });
  }

  private assertDeliveryInput(input: DeliveryAckInput): void {
    assertNonEmpty(input.worldId);
    assertNonEmpty(input.signalId);
    assertNonEmpty(input.leaseId);
    if (!Number.isFinite(input.nowWallTimeMs)) {
      throw new PersistenceError("INVALID_INPUT");
    }
  }

  private requireDeliverySlot(worldId: string, row: Row): SignalSlotRecord {
    const slot = this.signalSlot(worldId, requiredString(row, "shelter_id"), requiredString(row, "opaque_binding"));
    const deliveryStatus = row.status;
    if (!slot || slot.signalId !== requiredString(row, "signal_id")
      || ((deliveryStatus === "pending" || deliveryStatus === "in_flight") && slot.status !== deliveryStatus)) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    return slot;
  }

  private assertCompatibleMetadata(row: Row): void {
    const schemaVersion = requiredNumber(row, "schema_version");
    const contractVersion = requiredString(row, "contract_version");
    const eventVersion = requiredNumber(row, "supported_event_version");
    const snapshotVersion = requiredNumber(row, "supported_snapshot_version");
    if (schemaVersion !== this.schemaVersion || schemaVersion > CURRENT_SCHEMA_VERSION || contractVersion !== this.contractVersion || eventVersion !== CURRENT_EVENT_VERSION || snapshotVersion !== CURRENT_SNAPSHOT_VERSION) {
      throw new PersistenceError("SCHEMA_INCOMPATIBLE");
    }
  }

  private assertSchemaShape(database: DatabaseSync): void {
    for (const [table, requiredColumns] of Object.entries(REQUIRED_TABLE_COLUMNS)) {
      const rows = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name?: unknown }>;
      const columns = new Set(rows.map((row) => row.name).filter((name): name is string => typeof name === "string"));
      if (!requiredColumns.every((column) => columns.has(column))) {
        throw new PersistenceError("SCHEMA_INCOMPATIBLE");
      }
    }
  }

  private hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  private requireWorld(worldId: string): WorldRecord {
    const world = this.getWorld(worldId);
    if (!world) {
      throw new PersistenceError("WORLD_NOT_FOUND");
    }
    return world;
  }

  private applyMutation(database: DatabaseSync, worldId: string, mutation: StateMutationInput): number {
    const definition = ENTITY_DEFINITIONS[mutation.entityType];
    if (!definition || Object.keys(mutation.patch).length === 0 || !Number.isInteger(mutation.expectedRevision) || mutation.expectedRevision < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    const columns = Object.keys(mutation.patch).sort();
    for (const column of columns) {
      if (!definition.mutableColumns.includes(column)) {
        throw new PersistenceError("INVALID_INPUT");
      }
    }
    if (mutation.entityType === "player") {
      validatePlayerMutationPatch(mutation.patch);
    } else if (mutation.entityType === "mission") {
      validateMissionMutationPatch(mutation.patch);
    } else if (mutation.entityType === "mission_attempt") {
      validateMissionAttemptMutationPatch(mutation.patch);
    }
    const setClause = columns.map((column) => `${column} = ?`).join(", ");
    const values: SqlValue[] = columns.map((column) => sqlValue(mutation.patch[column]));
    const keyPredicate = mutation.entityType === "world" ? "world_id = ?" : `world_id = ? AND ${definition.keyColumn} = ?`;
    const parameters: SqlValue[] = [...values, worldId];
    if (mutation.entityType !== "world") {
      parameters.push(mutation.entityId);
    }
    parameters.push(mutation.expectedRevision);
    const result = database.prepare(`UPDATE ${definition.table} SET ${setClause}, revision = revision + 1 WHERE ${keyPredicate} AND revision = ?`).run(...parameters);
    if (result.changes !== 1) {
      const exists = database.prepare(`SELECT revision FROM ${definition.table} WHERE ${keyPredicate}`).get(...parameters.slice(values.length, values.length + (mutation.entityType === "world" ? 1 : 2)));
      if (!exists) {
        throw new PersistenceError("ENTITY_NOT_FOUND");
      }
      throw new PersistenceError("STALE_REVISION");
    }
    const row = rowOf(database.prepare(`SELECT revision FROM ${definition.table} WHERE ${keyPredicate}`).get(...parameters.slice(values.length, values.length + (mutation.entityType === "world" ? 1 : 2))));
    return row ? requiredNumber(row, "revision") : mutation.expectedRevision + 1;
  }

  private allocateCursor(database: DatabaseSync, worldId: string): number {
    const result = database.prepare("UPDATE world SET world_event_cursor = world_event_cursor + 1 WHERE world_id = ?").run(worldId);
    if (result.changes !== 1) {
      throw new PersistenceError("WORLD_NOT_FOUND");
    }
    const row = rowOf(database.prepare("SELECT world_event_cursor FROM world WHERE world_id = ?").get(worldId));
    return row ? requiredNumber(row, "world_event_cursor") : 0;
  }

  private persistEvent(
    database: DatabaseSync,
    worldId: string,
    worldTime: number,
    cursor: number,
    event: DomainEventInput,
    entityRevisions: Record<string, number>,
    idempotencyKey: string | null,
  ): PersistedDomainEvent {
    this.validateEventInput(event);
    this.validateVisibility(database, worldId, event.visibilityScope);
    const eventVersion = event.eventVersion ?? CURRENT_EVENT_VERSION;
    if (eventVersion !== CURRENT_EVENT_VERSION) {
      throw new PersistenceError("SCHEMA_INCOMPATIBLE");
    }
    const affectedEntityRevisions: Record<string, number> = { ...(event.affectedEntityRevisions ?? {}) };
    for (const [key, revision] of Object.entries(entityRevisions)) {
      const declaredRevision = affectedEntityRevisions[key];
      if (declaredRevision !== undefined && declaredRevision !== revision) {
        throw new PersistenceError("EVENT_CONFLICT");
      }
      affectedEntityRevisions[key] = revision;
    }
    const aggregateKey = `${event.aggregateType}:${event.aggregateId}`;
    const actualAggregateRevision = entityRevisions[aggregateKey];
    if (event.aggregateRevision !== null && event.aggregateRevision !== undefined
      && actualAggregateRevision !== undefined && event.aggregateRevision !== actualAggregateRevision) {
      throw new PersistenceError("EVENT_CONFLICT");
    }
    const aggregateRevision = event.aggregateRevision ?? actualAggregateRevision ?? null;
    if (aggregateRevision !== null) {
      const declaredRevision = affectedEntityRevisions[aggregateKey];
      if (declaredRevision !== undefined && declaredRevision !== aggregateRevision) {
        throw new PersistenceError("EVENT_CONFLICT");
      }
      affectedEntityRevisions[aggregateKey] = aggregateRevision;
    }
    const persisted: PersistedDomainEvent = {
      ...event,
      eventVersion,
      contractVersion: this.contractVersion,
      worldId,
      worldTime,
      worldEventCursor: cursor,
      idempotencyKey: event.idempotencyKey ?? idempotencyKey,
      aggregateRevision,
      affectedEntityRevisions,
    };
    try {
      database.prepare("INSERT INTO domain_event (event_id, event_version, contract_version, event_type, world_id, world_event_cursor, world_time, causation_id, idempotency_key, aggregate_type, aggregate_id, aggregate_revision, visibility_scope_json, typed_payload_json, affected_entity_revisions_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        persisted.eventId,
        persisted.eventVersion,
        persisted.contractVersion,
        persisted.eventType,
        persisted.worldId,
        persisted.worldEventCursor,
        persisted.worldTime,
        persisted.causationId ?? null,
        persisted.idempotencyKey ?? null,
        persisted.aggregateType,
        persisted.aggregateId,
        persisted.aggregateRevision ?? null,
        canonicalJson(persisted.visibilityScope),
        canonicalJson(persisted.typedPayload),
        canonicalJson(persisted.affectedEntityRevisions),
      );
    } catch (error) {
      throw classifyPersistenceError(error, "EVENT_CONFLICT");
    }
    return persisted;
  }

  private findEvent(database: DatabaseSync, eventId: string): PersistedDomainEvent | null {
    const row = rowOf(database.prepare("SELECT event_id, event_version, contract_version, event_type, world_id, world_event_cursor, world_time, causation_id, idempotency_key, aggregate_type, aggregate_id, aggregate_revision, visibility_scope_json, typed_payload_json, affected_entity_revisions_json FROM domain_event WHERE event_id = ?").get(eventId));
    return row ? this.parseEventRow(row) : null;
  }

  private assertEventMatches(
    existing: PersistedDomainEvent,
    worldId: string,
    worldTime: number,
    event: DomainEventInput,
    idempotencyKey: string,
    derivedEntityRevisions: Record<string, number> = {},
  ): void {
    this.validateEventInput(event);
    const expectedAffected: Record<string, number> = { ...(event.affectedEntityRevisions ?? {}) };
    for (const [key, revision] of Object.entries(derivedEntityRevisions)) {
      const declaredRevision = expectedAffected[key];
      if (declaredRevision !== undefined && declaredRevision !== revision) {
        throw new PersistenceError("EVENT_CONFLICT");
      }
      expectedAffected[key] = revision;
    }
    const aggregateKey = `${event.aggregateType}:${event.aggregateId}`;
    const expectedAggregateRevision = event.aggregateRevision ?? derivedEntityRevisions[aggregateKey] ?? null;
    if (expectedAggregateRevision !== null) {
      const declaredRevision = expectedAffected[aggregateKey];
      if (declaredRevision !== undefined && declaredRevision !== expectedAggregateRevision) {
        throw new PersistenceError("EVENT_CONFLICT");
      }
      expectedAffected[aggregateKey] = expectedAggregateRevision;
    }
    const matches = existing.worldId === worldId
      && existing.worldTime === worldTime
      && existing.eventVersion === (event.eventVersion ?? CURRENT_EVENT_VERSION)
      && existing.contractVersion === this.contractVersion
      && existing.eventType === event.eventType
      && existing.causationId === (event.causationId ?? null)
      && existing.idempotencyKey === (event.idempotencyKey ?? idempotencyKey)
      && existing.aggregateType === event.aggregateType
      && existing.aggregateId === event.aggregateId
      && existing.aggregateRevision === expectedAggregateRevision
      && canonicalJson(existing.visibilityScope) === canonicalJson(event.visibilityScope)
      && canonicalJson(existing.typedPayload) === canonicalJson(event.typedPayload)
      && canonicalJson(existing.affectedEntityRevisions) === canonicalJson(expectedAffected);
    if (!matches) {
      throw new PersistenceError("EVENT_CONFLICT");
    }
  }

  private validateEventInput(event: DomainEventInput): void {
    assertNonEmpty(event.eventId);
    assertNonEmpty(event.eventType);
    assertNonEmpty(event.aggregateType);
    assertNonEmpty(event.aggregateId);
    if (event.causationId !== undefined && event.causationId !== null) {
      assertNonEmpty(event.causationId);
    }
    if (event.idempotencyKey !== undefined && event.idempotencyKey !== null) {
      assertNonEmpty(event.idempotencyKey);
    }
    if (event.eventVersion !== undefined && event.eventVersion !== CURRENT_EVENT_VERSION) {
      throw new PersistenceError("SCHEMA_INCOMPATIBLE");
    }
    if (event.aggregateRevision !== undefined && event.aggregateRevision !== null
      && (!Number.isInteger(event.aggregateRevision) || event.aggregateRevision < 0)) {
      throw new PersistenceError("INVALID_INPUT");
    }
    const affected = event.affectedEntityRevisions;
    if (affected !== undefined && (typeof affected !== "object" || affected === null || Array.isArray(affected))) {
      throw new PersistenceError("INVALID_INPUT");
    }
    for (const [key, revision] of Object.entries(affected ?? {})) {
      if (key.trim() === "" || !Number.isInteger(revision) || revision < 0) {
        throw new PersistenceError("INVALID_INPUT");
      }
    }
    if (!event.visibilityScope || typeof event.visibilityScope !== "object") {
      throw new PersistenceError("INVALID_INPUT");
    }
  }

  private validateVisibility(database: DatabaseSync, worldId: string, visibility: DomainEventInput["visibilityScope"]): void {
    if (visibility.kind === "world") {
      if (visibility.playerId !== undefined || visibility.shelterId !== undefined) {
        throw new PersistenceError("INVALID_INPUT");
      }
      return;
    }
    if (visibility.kind === "player") {
      if (!visibility.playerId || visibility.shelterId !== undefined) {
        throw new PersistenceError("INVALID_INPUT");
      }
      const player = database.prepare("SELECT 1 FROM player WHERE world_id = ? AND player_id = ?").get(worldId, visibility.playerId);
      if (!player) {
        throw new PersistenceError("ENTITY_NOT_FOUND");
      }
      return;
    }
    if (visibility.kind === "shelter") {
      if (!visibility.shelterId || visibility.playerId !== undefined) {
        throw new PersistenceError("INVALID_INPUT");
      }
      const shelter = database.prepare("SELECT 1 FROM shelter WHERE world_id = ? AND shelter_id = ?").get(worldId, visibility.shelterId);
      if (!shelter) {
        throw new PersistenceError("ENTITY_NOT_FOUND");
      }
      return;
    }
    throw new PersistenceError("INVALID_INPUT");
  }

  private validateSnapshotRevisions(snapshot: WorldSnapshotRecord, events: PersistedDomainEvent[]): void {
    const expected = new Map<string, number>();
    for (const event of events) {
      if (event.worldEventCursor > snapshot.lastWorldEventCursor) {
        continue;
      }
      for (const [key, revision] of Object.entries(event.affectedEntityRevisions)) {
        if (!key.trim() || !Number.isInteger(revision) || revision < 0) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        expected.set(key, revision);
      }
    }
    for (const [key, revision] of Object.entries(snapshot.entityRevisions)) {
      if (!key.trim() || !Number.isInteger(revision) || revision < 0) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const eventRevision = expected.get(key);
      if (eventRevision !== undefined && eventRevision !== revision) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
    }
    for (const [key, revision] of expected) {
      if (snapshot.entityRevisions[key] !== revision) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
    }
  }

  private parseEventRow(row: Row): PersistedDomainEvent {
    const contractVersion = requiredString(row, "contract_version");
    const eventVersion = requiredNumber(row, "event_version");
    if (contractVersion !== this.contractVersion || eventVersion !== CURRENT_EVENT_VERSION) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    return {
      eventId: requiredString(row, "event_id"),
      eventVersion,
      contractVersion,
      eventType: requiredString(row, "event_type"),
      worldId: requiredString(row, "world_id"),
      worldTime: requiredNumber(row, "world_time"),
      worldEventCursor: requiredNumber(row, "world_event_cursor"),
      causationId: row.causation_id === null || typeof row.causation_id === "string" ? row.causation_id : null,
      idempotencyKey: row.idempotency_key === null || typeof row.idempotency_key === "string" ? row.idempotency_key : null,
      aggregateType: requiredString(row, "aggregate_type"),
      aggregateId: requiredString(row, "aggregate_id"),
      aggregateRevision: row.aggregate_revision === null || typeof row.aggregate_revision === "number" ? row.aggregate_revision : null,
      visibilityScope: parseJson(row.visibility_scope_json as string, "RECOVERY_REQUIRED"),
      typedPayload: parseJson(row.typed_payload_json as string, "RECOVERY_REQUIRED"),
      affectedEntityRevisions: parseJson(row.affected_entity_revisions_json as string, "RECOVERY_REQUIRED"),
    };
  }

  private upsertSignal(
    database: DatabaseSync,
    worldId: string,
    worldTime: number,
    eligibility: SignalEligibilityInput,
    events: PersistedDomainEvent[],
    cursors: number[],
  ): string | null {
    assertNonEmpty(eligibility.shelterId);
    assertNonEmpty(eligibility.opaqueBinding);
    assertNonEmpty(eligibility.grantId);
    assertNonEmpty(eligibility.boundedAction);
    const boundOwner = database.prepare("SELECT 1 FROM shelter JOIN player ON player.world_id = shelter.world_id AND player.player_id = shelter.player_id WHERE shelter.world_id = ? AND shelter.shelter_id = ? AND player.binding = ?").get(worldId, eligibility.shelterId, eligibility.opaqueBinding);
    if (!boundOwner) {
      throw new PersistenceError("OWNERSHIP_DENIED");
    }
    const eligible = events.filter((event) => event.eventType === "CargoLostToMonster" && this.eventVisibleToShelter(database, worldId, event, eligibility.shelterId));
    if (eligible.length === 0) {
      return null;
    }
    const severity = eligibility.severity ?? "warning";
    const cooldown = eligibility.cooldownWorldSeconds ?? 60;
    if (!Number.isInteger(cooldown) || cooldown < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    const existing = rowOf(database.prepare("SELECT * FROM agent_signal_slot WHERE world_id = ? AND shelter_id = ? AND opaque_binding = ?").get(worldId, eligibility.shelterId, eligibility.opaqueBinding));
    const cursorStart = Math.min(...cursors);
    const cursorEnd = Math.max(...cursors);
    const latest = eligible[eligible.length - 1] as PersistedDomainEvent;
    if (existing && (existing.status === "pending" || existing.status === "in_flight")) {
      const activeStatus = existing.status;
      if (activeStatus === "pending") {
        const eventTypes = new Set<string>([
          ...parseJson<string[]>(requiredString(existing, "event_types_json"), "RECOVERY_REQUIRED"),
          ...eligible.map((event) => event.eventType),
        ]);
        database.prepare("UPDATE agent_signal_slot SET cursor_start = ?, cursor_end = ?, eligible_event_count = eligible_event_count + ?, event_types_json = ?, severity = ?, latest_event_id = ?, latest_event_type = ?, latest_world_time = ?, updated_at = CURRENT_TIMESTAMP WHERE world_id = ? AND shelter_id = ? AND opaque_binding = ?").run(
          Math.min(requiredNumber(existing, "cursor_start"), cursorStart),
          Math.max(requiredNumber(existing, "cursor_end"), cursorEnd),
          eligible.length,
          canonicalJson([...eventTypes].sort()),
          maxSeverity((existing.severity as SignalSeverity) ?? "info", severity),
          latest.eventId,
          latest.eventType,
          latest.worldTime,
          worldId,
          eligibility.shelterId,
          eligibility.opaqueBinding,
        );
      } else {
        const deferredTypes = new Set<string>([
          ...parseJson<string[]>(requiredString(existing, "deferred_event_types_json"), "RECOVERY_REQUIRED"),
          ...eligible.map((event) => event.eventType),
        ]);
        database.prepare("UPDATE agent_signal_slot SET deferred_cursor_start = COALESCE(MIN(deferred_cursor_start, ?), ?), deferred_cursor_end = COALESCE(MAX(deferred_cursor_end, ?), ?), deferred_eligible_event_count = deferred_eligible_event_count + ?, deferred_event_types_json = ?, deferred_severity = ?, deferred_latest_event_id = ?, deferred_latest_event_type = ?, deferred_latest_world_time = ?, updated_at = CURRENT_TIMESTAMP WHERE world_id = ? AND shelter_id = ? AND opaque_binding = ?").run(
          cursorStart,
          cursorStart,
          cursorEnd,
          cursorEnd,
          eligible.length,
          canonicalJson([...deferredTypes].sort()),
          maxSeverity((existing.deferred_severity as SignalSeverity) ?? "info", severity),
          latest.eventId,
          latest.eventType,
          latest.worldTime,
          worldId,
          eligibility.shelterId,
          eligibility.opaqueBinding,
        );
      }
      return requiredString(existing, "signal_id");
    }
    if (existing && (existing.status === "acknowledged" || existing.status === "terminally_rejected")) {
      if (worldTime < requiredNumber(existing, "cooldown_until_world_time")) {
        return null;
      }

      // Reuse the one logical slot after cooldown while issuing a new signal
      // identity. Deferred events from an in-flight attempt are folded into
      // the next envelope instead of being silently discarded.
      const deferredCount = requiredNumber(existing, "deferred_eligible_event_count");
      const deferredStart = existing.deferred_cursor_start === null ? null : requiredNumber(existing, "deferred_cursor_start");
      const deferredEnd = existing.deferred_cursor_end === null ? null : requiredNumber(existing, "deferred_cursor_end");
      const nextCursorStart = deferredStart === null ? cursorStart : Math.min(deferredStart, cursorStart);
      const nextCursorEnd = deferredEnd === null ? cursorEnd : Math.max(deferredEnd, cursorEnd);
      const deferredTypes = parseJson<string[]>(requiredString(existing, "deferred_event_types_json"), "RECOVERY_REQUIRED");
      const eventTypes = [...new Set([...deferredTypes, ...eligible.map((event) => event.eventType)])].sort();
      const deferredLatestTime = existing.deferred_latest_world_time === null ? null : requiredNumber(existing, "deferred_latest_world_time");
      const useDeferredLatest = deferredLatestTime !== null && deferredLatestTime > latest.worldTime;
      const latestEventId = useDeferredLatest ? requiredString(existing, "deferred_latest_event_id") : latest.eventId;
      const latestEventType = useDeferredLatest ? requiredString(existing, "deferred_latest_event_type") : latest.eventType;
      const latestWorldTime = useDeferredLatest ? deferredLatestTime : latest.worldTime;
      const nextSeverity = maxSeverity(
        severity,
        (existing.deferred_severity === "critical" || existing.deferred_severity === "warning" || existing.deferred_severity === "info")
          ? existing.deferred_severity
          : "info",
      );
      const signalId = deterministicSignalId(worldId, eligibility.shelterId, eligibility.opaqueBinding, nextCursorStart, worldTime);
      database.prepare("UPDATE agent_signal_slot SET signal_id = ?, grant_id = ?, bounded_action = ?, status = 'pending', cursor_start = ?, cursor_end = ?, eligible_event_count = ?, event_types_json = ?, severity = ?, latest_event_id = ?, latest_event_type = ?, latest_world_time = ?, cooldown_until_world_time = ?, lease_id = NULL, lease_expires_at_wall_ms = NULL, last_error_code = NULL, deferred_cursor_start = NULL, deferred_cursor_end = NULL, deferred_eligible_event_count = 0, deferred_event_types_json = '[]', deferred_severity = 'info', deferred_latest_event_id = NULL, deferred_latest_event_type = NULL, deferred_latest_world_time = NULL, updated_at = CURRENT_TIMESTAMP WHERE world_id = ? AND shelter_id = ? AND opaque_binding = ?").run(
        signalId,
        eligibility.grantId,
        eligibility.boundedAction,
        nextCursorStart,
        nextCursorEnd,
        eligible.length + deferredCount,
        canonicalJson(eventTypes),
        nextSeverity,
        latestEventId,
        latestEventType,
        latestWorldTime,
        worldTime + cooldown,
        worldId,
        eligibility.shelterId,
        eligibility.opaqueBinding,
      );
      database.prepare("INSERT INTO outbox_delivery (delivery_id, world_id, shelter_id, opaque_binding, signal_id, status) VALUES (?, ?, ?, ?, ?, 'pending')").run(signalId, worldId, eligibility.shelterId, eligibility.opaqueBinding, signalId);
      return signalId;
    }

    const signalId = deterministicSignalId(worldId, eligibility.shelterId, eligibility.opaqueBinding, cursorStart, worldTime);
    const eventTypes = [...new Set(eligible.map((event) => event.eventType))].sort();
    database.prepare("INSERT INTO agent_signal_slot (world_id, shelter_id, opaque_binding, signal_id, grant_id, bounded_action, status, cursor_start, cursor_end, eligible_event_count, event_types_json, severity, latest_event_id, latest_event_type, latest_world_time, cooldown_until_world_time, deferred_event_types_json) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]')").run(
      worldId,
      eligibility.shelterId,
      eligibility.opaqueBinding,
      signalId,
      eligibility.grantId,
      eligibility.boundedAction,
      cursorStart,
      cursorEnd,
      eligible.length,
      canonicalJson(eventTypes),
      severity,
      latest.eventId,
      latest.eventType,
      latest.worldTime,
      worldTime + cooldown,
    );
    database.prepare("INSERT INTO outbox_delivery (delivery_id, world_id, shelter_id, opaque_binding, signal_id, status) VALUES (?, ?, ?, ?, ?, 'pending')").run(signalId, worldId, eligibility.shelterId, eligibility.opaqueBinding, signalId);
    return signalId;
  }

  private parseReentryEventContext(row: Row): ReentryEventContext {
    const occurredAt = requiredString(row, "occurred_at");
    try {
      assertCanonicalIsoTimestamp(occurredAt);
    } catch {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    const eventSequence = requiredInteger(row, "event_sequence");
    const stateVersion = requiredInteger(row, "state_version");
    if (eventSequence < 1 || stateVersion < 0) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    return {
      worldId: requiredString(row, "world_id"),
      signalId: requiredString(row, "signal_id"),
      opaqueBinding: requiredString(row, "opaque_binding"),
      eventSequence,
      occurredAt,
      stateVersion,
    };
  }

  private eventVisibleToShelter(database: DatabaseSync, worldId: string, event: PersistedDomainEvent, shelterId: string): boolean {
    const scope = event.visibilityScope as { kind?: unknown; shelterId?: unknown };
    if (scope.kind === "world") {
      return true;
    }
    if (scope.kind === "shelter") {
      return scope.shelterId === shelterId;
    }
    if (scope.kind === "player") {
      const playerScope = event.visibilityScope as { playerId?: unknown };
      const owner = database.prepare("SELECT player_id FROM shelter WHERE world_id = ? AND shelter_id = ?").get(worldId, shelterId) as { player_id?: unknown } | undefined;
      return typeof playerScope.playerId === "string" && owner?.player_id === playerScope.playerId;
    }
    return false;
  }

  private parseSignalSlot(row: Row): SignalSlotRecord {
    const status = row.status;
    if (!isSignalStatus(status)) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    return {
      worldId: requiredString(row, "world_id"),
      shelterId: requiredString(row, "shelter_id"),
      opaqueBinding: requiredString(row, "opaque_binding"),
      signalId: requiredString(row, "signal_id"),
      grantId: requiredString(row, "grant_id"),
      boundedAction: requiredString(row, "bounded_action"),
      status,
      cursorStart: requiredNumber(row, "cursor_start"),
      cursorEnd: requiredNumber(row, "cursor_end"),
      eligibleEventCount: requiredNumber(row, "eligible_event_count"),
      eventTypes: parseJson<string[]>(requiredString(row, "event_types_json"), "RECOVERY_REQUIRED"),
      severity: row.severity === "critical" || row.severity === "warning" || row.severity === "info" ? row.severity : "info",
      latestEventId: requiredString(row, "latest_event_id"),
      latestEventType: requiredString(row, "latest_event_type"),
      latestWorldTime: requiredNumber(row, "latest_world_time"),
      deferredCursorStart: row.deferred_cursor_start === null || typeof row.deferred_cursor_start === "number" ? row.deferred_cursor_start : null,
      deferredCursorEnd: row.deferred_cursor_end === null || typeof row.deferred_cursor_end === "number" ? row.deferred_cursor_end : null,
      deferredEligibleEventCount: requiredNumber(row, "deferred_eligible_event_count"),
      deferredEventTypes: parseJson<string[]>(requiredString(row, "deferred_event_types_json"), "RECOVERY_REQUIRED"),
      deferredSeverity: row.deferred_severity === "critical" || row.deferred_severity === "warning" || row.deferred_severity === "info" ? row.deferred_severity : "info",
      deferredLatestEventId: row.deferred_latest_event_id === null || typeof row.deferred_latest_event_id === "string" ? row.deferred_latest_event_id : null,
      deferredLatestEventType: row.deferred_latest_event_type === null || typeof row.deferred_latest_event_type === "string" ? row.deferred_latest_event_type : null,
      deferredLatestWorldTime: row.deferred_latest_world_time === null || typeof row.deferred_latest_world_time === "number" ? row.deferred_latest_world_time : null,
      cooldownUntilWorldTime: requiredNumber(row, "cooldown_until_world_time"),
      leaseId: row.lease_id === null || typeof row.lease_id === "string" ? row.lease_id : null,
      leaseExpiresAtWallMs: row.lease_expires_at_wall_ms === null || typeof row.lease_expires_at_wall_ms === "number" ? row.lease_expires_at_wall_ms : null,
      attemptCount: requiredNumber(row, "attempt_count"),
      lastErrorCode: row.last_error_code === null || typeof row.last_error_code === "string" ? row.last_error_code as SignalSlotRecord["lastErrorCode"] : null,
    };
  }

  private parseDelivery(row: Row): OutboxDeliveryRecord {
    const status = row.status;
    if (!isSignalStatus(status)) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    return {
      deliveryId: requiredString(row, "delivery_id"),
      worldId: requiredString(row, "world_id"),
      shelterId: requiredString(row, "shelter_id"),
      opaqueBinding: requiredString(row, "opaque_binding"),
      signalId: requiredString(row, "signal_id"),
      status,
      attemptCount: requiredNumber(row, "attempt_count"),
      leaseId: row.lease_id === null || typeof row.lease_id === "string" ? row.lease_id : null,
      leaseExpiresAtWallMs: row.lease_expires_at_wall_ms === null || typeof row.lease_expires_at_wall_ms === "number" ? row.lease_expires_at_wall_ms : null,
      lastOutcome: row.last_outcome === null || typeof row.last_outcome === "string" ? row.last_outcome : null,
    };
  }
}

export function createPersistenceStore(options: PersistenceStoreOptions): PersistenceStore {
  return new PersistenceStore(options);
}

export type { PersistenceStoreOptions } from "./types";
export { PersistenceError } from "./errors";
