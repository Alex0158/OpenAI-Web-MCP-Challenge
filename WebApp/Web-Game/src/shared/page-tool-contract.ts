export const PAGE_TOOLS_EXECUTE_PATH = "/api/local-fixture/page-tools/execute";
export const PAGE_TOOLS_MAX_BODY_BYTES = 8_192;
export const PAGE_TOOL_HISTORY_DEFAULT_LIMIT = 20;
export const PAGE_TOOL_HISTORY_MAX_LIMIT = 50;

export const PAGE_TOOL_NAMES = [
  "inspect_shelter_state",
  "inspect_client_snapshot",
  "inspect_missions",
  "inspect_mission_history",
  "force_recall_soldier",
] as const;

export type PageToolName = (typeof PAGE_TOOL_NAMES)[number];
export type PageReadToolName = Exclude<PageToolName, "force_recall_soldier">;

export interface PageToolScope {
  readonly world_id: string;
  readonly player_id: string;
  readonly shelter_id: string;
}

export interface PageToolReadEnvelope<TTool extends PageReadToolName> {
  readonly contract_version: string;
  readonly status: "ok";
  readonly tool: TTool;
  readonly request_id: string;
  readonly scope: PageToolScope;
  readonly world_time: number;
}

export interface PageToolContinuationSummary {
  readonly signal_id: string;
  readonly status: "pending" | "in_flight" | "acknowledged";
  readonly bounded_action: "force_recall_soldier";
  readonly cursor_start: number;
  readonly cursor_end: number;
  readonly eligible_event_count: number;
  readonly event_types: readonly string[];
  readonly latest_event_id: string;
  readonly latest_event_type: string;
  readonly latest_world_time: number;
}

export interface InspectShelterStateResult extends PageToolReadEnvelope<"inspect_shelter_state"> {
  readonly entity_revisions: {
    readonly world: number;
    readonly shelter: number;
  };
  readonly shelter: {
    readonly shelter_id: string;
    readonly player_id: string;
    readonly revision: number;
    readonly coins: number;
    readonly resident_soldier_count: number;
    readonly active_mission_count: number;
  };
  readonly sensed_resources: {
    readonly wood: number;
    readonly rock: number;
  };
  readonly continuation: PageToolContinuationSummary | null;
}

export interface AgentSnapshotV1 {
  readonly snapshot_version: "agent_snapshot_v1";
  readonly snapshot_id: string;
  readonly contract_version: string;
  readonly world_time: number;
  readonly scope: PageToolScope;
  readonly player: {
    readonly position: { readonly x: number; readonly y: number };
    readonly revision: number;
  };
  readonly shelter: {
    readonly revision: number;
    readonly coins: number;
  };
  readonly world_event_cursor: number;
  readonly counts: {
    readonly missions: number;
    readonly active_missions: number;
    readonly visible_actors: number;
    readonly sensed_resource_nodes: number;
  };
}

export interface InspectClientSnapshotResult extends PageToolReadEnvelope<"inspect_client_snapshot"> {
  readonly snapshot: AgentSnapshotV1;
}

export interface PageToolMissionEncounterSummary {
  readonly encounter_id: string;
  readonly state: "LOCKED" | "RESOLVING" | "RESOLVED";
  readonly terminal_cause: "GATHERER_LOST" | "MONSTER_DEFEATED" | null;
  readonly round_number: number;
}

export interface PageToolMissionSummary {
  readonly mission_id: string | null;
  readonly soldier_id: string;
  readonly mission_attempt_id: string | null;
  readonly phase: string;
  readonly role: string | null;
  readonly tool: string | null;
  readonly equipment_tier: number | null;
  readonly target_id: string | null;
  readonly return_policy: string | null;
  readonly position: { readonly x: number; readonly y: number };
  readonly next_due_world_time: number | null;
  readonly cargo: {
    readonly quantity: number;
    readonly capacity_used: number;
    readonly capacity: number;
    readonly resource_types: readonly string[];
  };
  readonly encounter: PageToolMissionEncounterSummary | null;
  readonly next_action: string;
  readonly revisions: {
    readonly soldier: number;
    readonly mission: number | null;
    readonly mission_attempt: number | null;
  };
}

export interface InspectMissionsResult extends PageToolReadEnvelope<"inspect_missions"> {
  readonly missions: readonly PageToolMissionSummary[];
}

export interface PageToolHistoryEvent {
  readonly event_id: string;
  readonly event_type: string;
  readonly world_event_cursor: number;
  readonly world_time: number;
  readonly aggregate_type: string;
  readonly aggregate_id: string;
}

export interface InspectMissionHistoryResult extends PageToolReadEnvelope<"inspect_mission_history"> {
  readonly history: {
    readonly cursor: string | null;
    readonly next_cursor: string | null;
    readonly events: readonly PageToolHistoryEvent[];
  };
}

export interface ForceRecallSoldierInput {
  readonly command_id: string;
  readonly idempotency_key: string;
  readonly soldier_id: string;
  readonly mission_id: string;
  readonly mission_attempt_id: string;
  readonly expected_entity_revisions: {
    readonly soldier: number;
    readonly mission: number;
    readonly mission_attempt: number;
  };
  readonly signal_id: string;
  readonly causal_event_id?: string;
}

export interface PageToolMutationBase {
  readonly contract_version: string;
  readonly status: "committed" | "rejected";
  readonly tool: "force_recall_soldier";
  readonly request_id: string;
  readonly scope: PageToolScope;
}

export interface ForceRecallSoldierSuccess extends PageToolMutationBase {
  readonly status: "committed";
  readonly command_id: string;
  readonly effect: "mission_recalled";
  readonly duplicate: boolean;
  readonly soldier_id: string;
  readonly mission_id: string;
  readonly mission_attempt_id: string;
  readonly event_id: string;
  readonly previous_phase: "TRAVELLING" | "WORKING";
  readonly phase: "RETURNING";
  readonly committed_entity_revisions: {
    readonly soldier: number;
    readonly mission: number;
    readonly mission_attempt: number;
  };
  readonly full_snapshot_required: true;
}

export type PageToolRecallFailureCode =
  | "NOT_OWNER"
  | "STALE_REVISION"
  | "DUPLICATE_COMMAND"
  | "ALREADY_AT_SHELTER"
  | "STALE_REENTRY_CONTEXT"
  | "IN_COMBAT"
  | "MISSION_ACTIVE"
  | "ROLE_LOCKED"
  | "RECOVERY_REQUIRED"
  | "WEBMCP_UNAVAILABLE";

export interface ForceRecallSoldierFailure extends PageToolMutationBase {
  readonly status: "rejected";
  readonly command_id: string;
  readonly effect: "rejected";
  readonly error_code: PageToolRecallFailureCode;
  readonly current_entity_revisions: {
    readonly soldier?: number;
    readonly mission?: number;
    readonly mission_attempt?: number;
  };
}

export type PageToolResult =
  | InspectShelterStateResult
  | InspectClientSnapshotResult
  | InspectMissionsResult
  | InspectMissionHistoryResult
  | ForceRecallSoldierSuccess
  | ForceRecallSoldierFailure;

export interface PageToolExecutionRequest {
  readonly tool: PageToolName;
  readonly input: PageToolInput;
}

export type PageToolInput =
  | Record<string, never>
  | { readonly cursor?: string; readonly limit?: number }
  | ForceRecallSoldierInput;

export const PAGE_TOOL_INPUT_SCHEMAS: Readonly<Record<PageToolName, Readonly<Record<string, unknown>>>> = {
  inspect_shelter_state: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  inspect_client_snapshot: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  inspect_missions: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  inspect_mission_history: {
    type: "object",
    properties: {
      cursor: { type: "string", maxLength: 256 },
      limit: { type: "integer", minimum: 1, maximum: PAGE_TOOL_HISTORY_MAX_LIMIT },
    },
    additionalProperties: false,
  },
  force_recall_soldier: {
    type: "object",
    properties: {
      command_id: { type: "string", minLength: 1, maxLength: 128 },
      idempotency_key: { type: "string", minLength: 1, maxLength: 128 },
      soldier_id: { type: "string", minLength: 1, maxLength: 128 },
      mission_id: { type: "string", minLength: 1, maxLength: 128 },
      mission_attempt_id: { type: "string", minLength: 1, maxLength: 128 },
      expected_entity_revisions: {
        type: "object",
        properties: {
          soldier: { type: "integer", minimum: 0 },
          mission: { type: "integer", minimum: 0 },
          mission_attempt: { type: "integer", minimum: 0 },
        },
        required: ["soldier", "mission", "mission_attempt"],
        additionalProperties: false,
      },
      signal_id: { type: "string", minLength: 1, maxLength: 128 },
      causal_event_id: { type: "string", minLength: 1, maxLength: 128 },
    },
    required: [
      "command_id",
      "idempotency_key",
      "soldier_id",
      "mission_id",
      "mission_attempt_id",
      "expected_entity_revisions",
      "signal_id",
    ],
    additionalProperties: false,
  },
};

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const CURSOR_PATTERN = /^[A-Za-z0-9._~-]{1,256}$/;

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
  throw new Error("PAGE_TOOL_INPUT_INVALID");
}

function parseReadInput(value: unknown): Record<string, never> {
  if (!isRecord(value) || !hasExactKeys(value, [])) {
    return invalid();
  }
  return {};
}

function parseHistoryInput(value: unknown): { readonly cursor?: string; readonly limit?: number } {
  if (!isRecord(value) || !Object.keys(value).every((key) => key === "cursor" || key === "limit")
    || ("cursor" in value && (typeof value.cursor !== "string" || !CURSOR_PATTERN.test(value.cursor)))
    || ("limit" in value && (typeof value.limit !== "number"
      || !Number.isSafeInteger(value.limit)
      || value.limit < 1
      || value.limit > PAGE_TOOL_HISTORY_MAX_LIMIT))) {
    return invalid();
  }
  return structuredClone(value) as { readonly cursor?: string; readonly limit?: number };
}

function parseRecallInput(value: unknown): ForceRecallSoldierInput {
  if (!isRecord(value)
    || !hasExactKeys(value, [
      "command_id",
      "idempotency_key",
      "soldier_id",
      "mission_id",
      "mission_attempt_id",
      "expected_entity_revisions",
      "signal_id",
      ...(Object.prototype.hasOwnProperty.call(value, "causal_event_id") ? ["causal_event_id"] : []),
    ])
    || !validIdentifier(value.command_id)
    || !validIdentifier(value.idempotency_key)
    || value.command_id === value.idempotency_key
    || !validIdentifier(value.soldier_id)
    || !validIdentifier(value.mission_id)
    || !validIdentifier(value.mission_attempt_id)
    || !validIdentifier(value.signal_id)
    || ("causal_event_id" in value && !validIdentifier(value.causal_event_id))
    || !isRecord(value.expected_entity_revisions)
    || !hasExactKeys(value.expected_entity_revisions, ["soldier", "mission", "mission_attempt"])
    || !validRevision(value.expected_entity_revisions.soldier)
    || !validRevision(value.expected_entity_revisions.mission)
    || !validRevision(value.expected_entity_revisions.mission_attempt)) {
    return invalid();
  }
  return structuredClone(value) as unknown as ForceRecallSoldierInput;
}

export function parsePageToolExecutionRequest(value: unknown): PageToolExecutionRequest {
  if (!isRecord(value) || !hasExactKeys(value, ["tool", "input"]) || typeof value.tool !== "string"
    || !(PAGE_TOOL_NAMES as readonly string[]).includes(value.tool)) {
    return invalid();
  }
  const tool = value.tool as PageToolName;
  const input = tool === "inspect_mission_history"
    ? parseHistoryInput(value.input)
    : tool === "force_recall_soldier"
      ? parseRecallInput(value.input)
      : parseReadInput(value.input);
  return { tool, input } as PageToolExecutionRequest;
}
