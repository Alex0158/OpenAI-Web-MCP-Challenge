export const ASSIGN_SOLDIER_MISSION_COMMAND_PATH = "/api/local-fixture/commands/assign-soldier-mission";
export const ASSIGN_SOLDIER_MISSION_COMMAND_MAX_BODY_BYTES = 2048;

export type GathererMissionTool = "AXE" | "PICKAXE";

export interface AssignSoldierMissionCommandEnvelope {
  readonly command_id: string;
  readonly command_type: "assign_soldier_mission";
  readonly contract_version: string;
  readonly expected_entity_revisions: { readonly soldier: number };
  readonly idempotency_key: string;
  readonly typed_arguments: {
    readonly soldier_id: string;
    readonly role: "GATHERER";
    readonly tool: GathererMissionTool;
    readonly equipment_tier: 1;
    readonly target_id: string;
    readonly return_policy: "WHEN_FULL";
  };
}

export interface AssignSoldierMissionCommandSuccess {
  readonly command_id: string;
  readonly command_type: "assign_soldier_mission";
  readonly contract_version: string;
  readonly effect: "mission_dispatched";
  readonly duplicate: boolean;
  readonly soldier_id: string;
  readonly mission_id: string;
  readonly mission_attempt_id: string;
  readonly event_id: string;
  readonly committed_entity_revisions: {
    readonly soldier: number;
    readonly mission: number;
    readonly mission_attempt: number;
  };
}

export type AssignSoldierMissionOwnedFailureCode =
  | "STALE_REVISION"
  | "ROLE_LOCKED"
  | "NOT_AT_SHELTER"
  | "TARGET_UNAVAILABLE"
  | "TOOL_INCOMPATIBLE"
  | "MISSION_ACTIVE"
  | "DUPLICATE_COMMAND";

export type AssignSoldierMissionCommandFailureCode = AssignSoldierMissionOwnedFailureCode | "NOT_OWNER";

interface AssignSoldierMissionCommandFailureBase {
  readonly command_id: string;
  readonly command_type: "assign_soldier_mission";
  readonly contract_version: string;
  readonly effect: "rejected";
}

export type AssignSoldierMissionCommandFailure = AssignSoldierMissionCommandFailureBase & (
  | {
      readonly error_code: AssignSoldierMissionOwnedFailureCode;
      readonly current_entity_revisions: { readonly soldier: number };
    }
  | {
      readonly error_code: "NOT_OWNER";
      readonly current_entity_revisions: Record<string, never>;
    }
);

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const GATHERER_TOOLS = new Set<GathererMissionTool>(["AXE", "PICKAXE"]);
const OWNED_FAILURE_CODES = new Set<AssignSoldierMissionOwnedFailureCode>([
  "STALE_REVISION",
  "ROLE_LOCKED",
  "NOT_AT_SHELTER",
  "TARGET_UNAVAILABLE",
  "TOOL_INCOMPATIBLE",
  "MISSION_ACTIVE",
  "DUPLICATE_COMMAND",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).sort().join("\u0000") === [...keys].sort().join("\u0000");
}

function validIdentifier(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER_PATTERN.test(value);
}

function validRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function invalid(): never {
  throw new Error("ASSIGN_SOLDIER_MISSION_COMMAND_INVALID");
}

export function parseAssignSoldierMissionCommandEnvelope(value: unknown): AssignSoldierMissionCommandEnvelope {
  if (!isRecord(value)
    || !hasExactKeys(value, [
      "command_id",
      "command_type",
      "contract_version",
      "expected_entity_revisions",
      "idempotency_key",
      "typed_arguments",
    ])
    || !validIdentifier(value.command_id)
    || value.command_type !== "assign_soldier_mission"
    || !validIdentifier(value.contract_version)
    || !validIdentifier(value.idempotency_key)
    || value.command_id === value.idempotency_key
    || !isRecord(value.expected_entity_revisions)
    || !hasExactKeys(value.expected_entity_revisions, ["soldier"])
    || !validRevision(value.expected_entity_revisions.soldier)
    || !isRecord(value.typed_arguments)
    || !hasExactKeys(value.typed_arguments, [
      "soldier_id",
      "role",
      "tool",
      "equipment_tier",
      "target_id",
      "return_policy",
    ])
    || !validIdentifier(value.typed_arguments.soldier_id)
    || value.typed_arguments.role !== "GATHERER"
    || typeof value.typed_arguments.tool !== "string"
    || !GATHERER_TOOLS.has(value.typed_arguments.tool as GathererMissionTool)
    || value.typed_arguments.equipment_tier !== 1
    || !validIdentifier(value.typed_arguments.target_id)
    || value.typed_arguments.return_policy !== "WHEN_FULL") {
    return invalid();
  }
  return structuredClone(value) as unknown as AssignSoldierMissionCommandEnvelope;
}

export function parseAssignSoldierMissionCommandSuccess(
  value: unknown,
  expected: { readonly commandId: string; readonly contractVersion: string },
): AssignSoldierMissionCommandSuccess {
  if (!isRecord(value)
    || !hasExactKeys(value, [
      "command_id",
      "command_type",
      "contract_version",
      "effect",
      "duplicate",
      "soldier_id",
      "mission_id",
      "mission_attempt_id",
      "event_id",
      "committed_entity_revisions",
    ])
    || value.command_id !== expected.commandId
    || value.command_type !== "assign_soldier_mission"
    || value.contract_version !== expected.contractVersion
    || value.effect !== "mission_dispatched"
    || typeof value.duplicate !== "boolean"
    || !validIdentifier(value.soldier_id)
    || !validIdentifier(value.mission_id)
    || !validIdentifier(value.mission_attempt_id)
    || !validIdentifier(value.event_id)
    || !isRecord(value.committed_entity_revisions)
    || !hasExactKeys(value.committed_entity_revisions, ["soldier", "mission", "mission_attempt"])
    || !validRevision(value.committed_entity_revisions.soldier)
    || !validRevision(value.committed_entity_revisions.mission)
    || !validRevision(value.committed_entity_revisions.mission_attempt)) {
    return invalid();
  }
  return structuredClone(value) as unknown as AssignSoldierMissionCommandSuccess;
}

export function parseAssignSoldierMissionCommandFailure(
  value: unknown,
  expected: { readonly commandId: string; readonly contractVersion: string },
): AssignSoldierMissionCommandFailure {
  if (!isRecord(value)
    || !hasExactKeys(value, [
      "command_id",
      "command_type",
      "contract_version",
      "effect",
      "error_code",
      "current_entity_revisions",
    ])
    || value.command_id !== expected.commandId
    || value.command_type !== "assign_soldier_mission"
    || value.contract_version !== expected.contractVersion
    || value.effect !== "rejected"
    || !isRecord(value.current_entity_revisions)) {
    return invalid();
  }
  if (value.error_code === "NOT_OWNER") {
    if (!hasExactKeys(value.current_entity_revisions, [])) {
      return invalid();
    }
  } else if (typeof value.error_code !== "string"
    || !OWNED_FAILURE_CODES.has(value.error_code as AssignSoldierMissionOwnedFailureCode)
    || !hasExactKeys(value.current_entity_revisions, ["soldier"])
    || !validRevision(value.current_entity_revisions.soldier)) {
    return invalid();
  }
  return structuredClone(value) as unknown as AssignSoldierMissionCommandFailure;
}
