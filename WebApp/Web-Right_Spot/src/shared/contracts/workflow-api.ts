export const WORKFLOW_REQUEST_STATES = [
  "TENANT_DRAFT",
  "REQUEST_SUBMITTED",
  "AGENT_REVIEWING",
  "SLOT_PROPOSED",
  "VIEWING_CONFIRMED",
  "TENANT_DECLINED",
  "EXPIRED",
  "AGENT_DECLINED",
] as const;

export type WorkflowRequestState = (typeof WORKFLOW_REQUEST_STATES)[number];

export const WORKFLOW_RESPONSE_KINDS = [
  "SLOT_PROPOSAL",
  "AGENT_DECLINE",
] as const;

export type WorkflowResponseKind = (typeof WORKFLOW_RESPONSE_KINDS)[number];

export const WORKFLOW_AVAILABILITY_STATUSES = [
  "AVAILABLE",
  "HELD_FOR_PROPOSAL",
  "CONFIRMED",
] as const;

export type WorkflowAvailabilityStatus = (typeof WORKFLOW_AVAILABILITY_STATUSES)[number];

export const WORKFLOW_TIMELINE_OPERATIONS = [
  "CREATE_REQUEST_DRAFT",
  "UPDATE_REQUEST_DRAFT",
  "SUBMIT_REQUEST",
  "START_AGENT_REVIEW",
  "PREPARE_AGENT_RESPONSE",
  "SEND_SLOT_PROPOSAL",
  "SEND_AGENT_DECLINE",
  "CONFIRM_VIEWING",
  "DECLINE_VIEWING",
  "EXPIRE_PROPOSAL",
] as const;

export type WorkflowTimelineOperation = (typeof WORKFLOW_TIMELINE_OPERATIONS)[number];

export type WorkflowListingDto = {
  id: string;
  version: number;
  title: string;
  address: string;
  area: string;
  monthlyRentGbp: number;
  bedrooms: number;
  sizeSqM: number;
  availableFrom: string;
  description: string;
  imageKey: string;
};

export type AgentListingDto = WorkflowListingDto & {
  status: "PUBLISHED" | "UNPUBLISHED";
};

export type WorkflowResponseDto =
  | {
      kind: "SLOT_PROPOSAL";
      slotId: string;
      tenantNote?: string;
    }
  | {
      kind: "AGENT_DECLINE";
      tenantNote?: string;
    };

export type WorkflowAvailabilitySlotDto = {
  id: string;
  listingId: string;
  startsAt: string;
  endsAt: string;
  status: WorkflowAvailabilityStatus;
};

export type WorkflowTimelineEntryDto = {
  sequence: number;
  operation: WorkflowTimelineOperation;
  fromState: WorkflowRequestState | null;
  toState: WorkflowRequestState;
  requestVersion: number;
};

export type TenantRequestDto = {
  id: string;
  listingId: string;
  preferredTimes: string[];
  tenantNote?: string;
  state: WorkflowRequestState;
  version: number;
  response?: WorkflowResponseDto;
  proposalExpiresAt?: string;
};

export type TenantRequestResponse = {
  fixtureGeneration: number;
  request: TenantRequestDto | null;
  listing: WorkflowListingDto | null;
  timeline: WorkflowTimelineEntryDto[];
};

export type AgentRequestDto = {
  id: string;
  listingId: string;
  preferredTimes: string[];
  tenantNote?: string;
  state: WorkflowRequestState;
  version: number;
  preparedResponse?: WorkflowResponseDto;
  sentResponse?: WorkflowResponseDto;
  proposalExpiresAt?: string;
  internalReviewNote?: string;
};

export type AgentRequestResponse = {
  fixtureGeneration: number;
  request: AgentRequestDto;
  listing: AgentListingDto;
  availability: WorkflowAvailabilitySlotDto[];
};

export type AgentQueueItemDto = {
  id: string;
  listingId: string;
  state: WorkflowRequestState;
  version: number;
};

export type AgentQueueResponse = {
  fixtureGeneration: number;
  requests: AgentQueueItemDto[];
  counts: Record<WorkflowRequestState, number>;
};

export type WorkflowCommandResultDto = {
  state: WorkflowRequestState;
  version: number;
  slotId?: string;
  idempotent?: boolean;
};

export type TenantWorkflowMutationResponse = TenantRequestResponse & {
  result: WorkflowCommandResultDto;
};

export type AgentWorkflowMutationResponse = AgentRequestResponse & {
  result: WorkflowCommandResultDto;
};

export type CreateRequestDraftBody = {
  commandId: string;
  fixtureGeneration: number;
  listingId: string;
  expectedListingVersion: number;
  preferredTimes: string[];
  tenantNote?: string;
};

export type UpdateRequestDraftBody = {
  commandId: string;
  fixtureGeneration: number;
  expectedRequestVersion: number;
  expectedListingVersion: number;
  preferredTimes: string[];
  tenantNote?: string;
};

export type SubmitRequestBody = {
  commandId: string;
  fixtureGeneration: number;
  expectedRequestVersion: number;
  expectedListingVersion: number;
};

export type TenantDecisionBody = {
  commandId: string;
  fixtureGeneration: number;
  expectedRequestVersion: number;
};

export type StartAgentReviewBody = {
  commandId: string;
  fixtureGeneration: number;
  expectedRequestVersion: number;
};

export type ResponsePreparationBody = {
  commandId: string;
  fixtureGeneration: number;
  expectedRequestVersion: number;
  preparation: WorkflowResponseDto;
  internalReviewNote?: string;
};

export type SendAgentResponseBody = {
  commandId: string;
  fixtureGeneration: number;
  expectedRequestVersion: number;
};

export const WORKFLOW_ERROR_CODES = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_FAILED",
  "STALE_VERSION",
  "FIXTURE_GENERATION_CONFLICT",
  "INVALID_TRANSITION",
  "SLOT_UNAVAILABLE",
  "EXPIRED",
  "COMMAND_CONFLICT",
  "PERSISTENCE_ERROR",
] as const;

export type WorkflowErrorCode = (typeof WORKFLOW_ERROR_CODES)[number];

export type WorkflowErrorResponse = {
  error: {
    code: WorkflowErrorCode;
    message: string;
  };
};
