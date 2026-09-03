export const MOVE_PLAYER_COMMAND_PATH = "/api/local-fixture/commands/move-player";
export const MOVE_PLAYER_COMMAND_MAX_BODY_BYTES = 2048;

export type MovePlayerDirection = "up" | "down" | "left" | "right";

export interface MovePlayerCommandEnvelope {
  readonly command_id: string;
  readonly command_type: "move_player";
  readonly contract_version: string;
  readonly expected_entity_revisions: { readonly player: number };
  readonly idempotency_key: string;
  readonly typed_arguments: { readonly direction: MovePlayerDirection };
}

export interface MovePlayerCommandSuccess {
  readonly command_id: string;
  readonly command_type: "move_player";
  readonly contract_version: string;
  readonly effect: "moved";
  readonly duplicate: boolean;
  readonly event_id: string;
  readonly current_entity_revisions: { readonly player: number };
}

export type MovePlayerCommandFailureCode = "MOVEMENT_BLOCKED" | "STALE_REVISION" | "DUPLICATE_COMMAND";

export interface MovePlayerCommandFailure {
  readonly command_id: string;
  readonly command_type: "move_player";
  readonly contract_version: string;
  readonly effect: "rejected";
  readonly error_code: MovePlayerCommandFailureCode;
  readonly current_entity_revisions: { readonly player: number };
}

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const DIRECTIONS = new Set<MovePlayerDirection>(["up", "down", "left", "right"]);
const FAILURE_CODES = new Set<MovePlayerCommandFailureCode>([
  "MOVEMENT_BLOCKED",
  "STALE_REVISION",
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
  throw new Error("MOVE_PLAYER_COMMAND_INVALID");
}

export function parseMovePlayerCommandEnvelope(value: unknown): MovePlayerCommandEnvelope {
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
    || value.command_type !== "move_player"
    || !validIdentifier(value.contract_version)
    || !validIdentifier(value.idempotency_key)
    || value.command_id === value.idempotency_key
    || !isRecord(value.expected_entity_revisions)
    || !hasExactKeys(value.expected_entity_revisions, ["player"])
    || !validRevision(value.expected_entity_revisions.player)
    || !isRecord(value.typed_arguments)
    || !hasExactKeys(value.typed_arguments, ["direction"])
    || typeof value.typed_arguments.direction !== "string"
    || !DIRECTIONS.has(value.typed_arguments.direction as MovePlayerDirection)) {
    return invalid();
  }
  return structuredClone(value) as unknown as MovePlayerCommandEnvelope;
}

export function parseMovePlayerCommandSuccess(
  value: unknown,
  expected: { readonly commandId: string; readonly contractVersion: string },
): MovePlayerCommandSuccess {
  if (!isRecord(value)
    || !hasExactKeys(value, [
      "command_id",
      "command_type",
      "contract_version",
      "effect",
      "duplicate",
      "event_id",
      "current_entity_revisions",
    ])
    || value.command_id !== expected.commandId
    || value.command_type !== "move_player"
    || value.contract_version !== expected.contractVersion
    || value.effect !== "moved"
    || typeof value.duplicate !== "boolean"
    || !validIdentifier(value.event_id)
    || !isRecord(value.current_entity_revisions)
    || !hasExactKeys(value.current_entity_revisions, ["player"])
    || !validRevision(value.current_entity_revisions.player)) {
    return invalid();
  }
  return structuredClone(value) as unknown as MovePlayerCommandSuccess;
}

export function parseMovePlayerCommandFailure(
  value: unknown,
  expected: { readonly commandId: string; readonly contractVersion: string },
): MovePlayerCommandFailure {
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
    || value.command_type !== "move_player"
    || value.contract_version !== expected.contractVersion
    || value.effect !== "rejected"
    || typeof value.error_code !== "string"
    || !FAILURE_CODES.has(value.error_code as MovePlayerCommandFailureCode)
    || !isRecord(value.current_entity_revisions)
    || !hasExactKeys(value.current_entity_revisions, ["player"])
    || !validRevision(value.current_entity_revisions.player)) {
    return invalid();
  }
  return structuredClone(value) as unknown as MovePlayerCommandFailure;
}
