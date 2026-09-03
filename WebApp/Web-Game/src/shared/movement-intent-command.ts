import type { MovePlayerDirection } from "./move-player-command";

export const MOVEMENT_INTENT_COMMAND_TYPE = "movement_intent_command" as const;
export const MOVEMENT_INTENT_RESULT_TYPE = "movement_intent_result" as const;
export const MOVEMENT_INTENT_MAX_FRAME_BYTES = 2048;

export type MovementIntentAction = "start" | "stop";

export interface MovementIntentCommandEnvelope {
  readonly kind: typeof MOVEMENT_INTENT_COMMAND_TYPE;
  readonly action: MovementIntentAction;
  readonly command_id: string;
  readonly contract_version: string;
  readonly expected_entity_revisions: { readonly player: number };
  readonly idempotency_key: string;
  readonly typed_arguments: { readonly direction: MovePlayerDirection } | Record<string, never>;
}

export type MovementIntentOwnerStatus = "owned" | "no_active" | "not_owner" | "duplicate";

export type MovementIntentFailureCode =
  | "INVALID_INPUT"
  | "WORLD_NOT_FOUND"
  | "ENTITY_NOT_FOUND"
  | "OWNERSHIP_DENIED"
  | "STALE_REVISION"
  | "DUPLICATE_COMMAND"
  | "MOVEMENT_BLOCKED"
  | "MOVEMENT_INTENT_SESSION_CLOSED"
  | "WORKER_NOT_READY"
  | "GATEWAY_CLOSED"
  | "RECOVERY_REQUIRED"
  | "REALTIME_UNAVAILABLE"
  | "REALTIME_NOT_READY"
  | "REALTIME_DRAINING"
  | "REALTIME_CLOSED";

export interface MovementIntentResultFrame {
  readonly kind: typeof MOVEMENT_INTENT_RESULT_TYPE;
  readonly action: MovementIntentAction;
  readonly command_id: string;
  readonly contract_version: string;
  readonly effect: "intent_set" | "intent_stopped" | "rejected";
  readonly duplicate: boolean;
  readonly current_entity_revisions: { readonly player: number };
  readonly intent_id?: string;
  readonly owner_status?: MovementIntentOwnerStatus;
  readonly replaced?: boolean;
  readonly error_code?: MovementIntentFailureCode;
}

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const DIRECTIONS = new Set<MovePlayerDirection>(["up", "down", "left", "right"]);
const ACTIONS = new Set<MovementIntentAction>(["start", "stop"]);
const EFFECTS = new Set<MovementIntentResultFrame["effect"]>(["intent_set", "intent_stopped", "rejected"]);
const OWNER_STATUSES = new Set<MovementIntentOwnerStatus>(["owned", "no_active", "not_owner", "duplicate"]);
const FAILURE_CODES = new Set<MovementIntentFailureCode>([
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
  throw new Error("MOVEMENT_INTENT_COMMAND_INVALID");
}

export function parseMovementIntentCommandEnvelope(value: unknown): MovementIntentCommandEnvelope {
  if (!isRecord(value)
    || !hasExactKeys(value, [
      "kind",
      "action",
      "command_id",
      "contract_version",
      "expected_entity_revisions",
      "idempotency_key",
      "typed_arguments",
    ])
    || value.kind !== MOVEMENT_INTENT_COMMAND_TYPE
    || typeof value.action !== "string"
    || !ACTIONS.has(value.action as MovementIntentAction)
    || !validIdentifier(value.command_id)
    || !validIdentifier(value.contract_version)
    || !validIdentifier(value.idempotency_key)
    || value.command_id === value.idempotency_key
    || !isRecord(value.expected_entity_revisions)
    || !hasExactKeys(value.expected_entity_revisions, ["player"])
    || !validRevision(value.expected_entity_revisions.player)
    || !isRecord(value.typed_arguments)) {
    return invalid();
  }

  const action = value.action as MovementIntentAction;
  if (action === "start") {
    if (!hasExactKeys(value.typed_arguments, ["direction"])
      || typeof value.typed_arguments.direction !== "string"
      || !DIRECTIONS.has(value.typed_arguments.direction as MovePlayerDirection)) {
      return invalid();
    }
  } else if (!hasExactKeys(value.typed_arguments, [])) {
    return invalid();
  }
  return structuredClone(value) as unknown as MovementIntentCommandEnvelope;
}

export function movementIntentResultFrame(input: MovementIntentResultFrame): MovementIntentResultFrame {
  return structuredClone(input);
}

export function parseMovementIntentResultFrame(
  value: unknown,
  expected?: { readonly commandId?: string; readonly contractVersion?: string },
): MovementIntentResultFrame {
  if (!isRecord(value)
    || !hasExactKeys(value, [
      "action",
      "command_id",
      "contract_version",
      "current_entity_revisions",
      "duplicate",
      "effect",
      "kind",
      ...(value.intent_id !== undefined ? ["intent_id"] : []),
      ...(value.owner_status !== undefined ? ["owner_status"] : []),
      ...(value.replaced !== undefined ? ["replaced"] : []),
      ...(value.error_code !== undefined ? ["error_code"] : []),
    ])
    || value.kind !== MOVEMENT_INTENT_RESULT_TYPE
    || typeof value.action !== "string"
    || !ACTIONS.has(value.action as MovementIntentAction)
    || !validIdentifier(value.command_id)
    || (expected?.commandId !== undefined && value.command_id !== expected.commandId)
    || !validIdentifier(value.contract_version)
    || (expected?.contractVersion !== undefined && value.contract_version !== expected.contractVersion)
    || typeof value.effect !== "string"
    || !EFFECTS.has(value.effect as MovementIntentResultFrame["effect"])
    || typeof value.duplicate !== "boolean"
    || !isRecord(value.current_entity_revisions)
    || !hasExactKeys(value.current_entity_revisions, ["player"])
    || !validRevision(value.current_entity_revisions.player)) {
    return invalid();
  }
  if (value.intent_id !== undefined && !validIdentifier(value.intent_id)) {
    return invalid();
  }
  if (value.owner_status !== undefined
    && (typeof value.owner_status !== "string" || !OWNER_STATUSES.has(value.owner_status as MovementIntentOwnerStatus))) {
    return invalid();
  }
  if (value.replaced !== undefined && typeof value.replaced !== "boolean") {
    return invalid();
  }
  if (value.error_code !== undefined
    && (typeof value.error_code !== "string" || !FAILURE_CODES.has(value.error_code as MovementIntentFailureCode))) {
    return invalid();
  }
  if (value.effect === "rejected" && value.error_code === undefined) {
    return invalid();
  }
  return structuredClone(value) as unknown as MovementIntentResultFrame;
}

export function isMovementIntentResultFrame(value: unknown): value is MovementIntentResultFrame {
  try {
    parseMovementIntentResultFrame(value);
    return true;
  } catch {
    return false;
  }
}
