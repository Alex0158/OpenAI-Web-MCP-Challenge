import { domainError, DomainError } from "./errors";
import {
  REQUEST_STATES,
  type Actor,
  type ActorRole,
  type AuditEntry,
  type AvailabilitySlot,
  type CommandOutcome,
  type DomainCommandResult,
  type Listing,
  type PreparedResponse,
  type RequestState,
  type ResponsePreparationInput,
  type SentResponse,
  type ViewingRequest,
  type WorkflowCommand,
  type WorkflowState,
} from "./types";

export const MAX_IDENTIFIER_LENGTH = 100;
export const MAX_NOTE_LENGTH = 500;
export const MAX_TENANT_NOTE_LENGTH = 500;
export const PROPOSAL_WINDOW_HOURS = 24;

const TERMINAL_STATES: ReadonlySet<RequestState> = new Set([
  "VIEWING_CONFIRMED",
  "TENANT_DECLINED",
  "EXPIRED",
  "AGENT_DECLINED",
]);

const ISO_IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]+$/;

export function createInitialWorkflowState(
  overrides: Partial<Pick<WorkflowState, "fixtureGeneration" | "tenantId" | "agentId" | "listings" | "slots">> = {},
): WorkflowState {
  const tenantId = overrides.tenantId ?? "tenant-demo";
  const agentId = overrides.agentId ?? "agent-demo";
  const listings = overrides.listings ?? createDefaultListings(agentId);
  const slots = overrides.slots ?? createDefaultSlots(listings[0]?.id ?? "listing-primary");

  const state: WorkflowState = {
    fixtureGeneration: overrides.fixtureGeneration ?? 1,
    tenantId,
    agentId,
    listings,
    slots,
    request: null,
    audit: [],
    processedCommands: [],
  };

  validateWorkflowState(state);
  return clone(state);
}

export function executeCommand(
  state: WorkflowState,
  command: WorkflowCommand,
  now: string,
): CommandOutcome {
  const source = clone(state);

  try {
    validateNow(now);
    validateCommandMetadata(command);
    validateWorkflowState(source);
  } catch (error) {
    return failure(source, asDomainError(error, "VALIDATION_FAILED", "Invalid workflow command"));
  }

  const fingerprint = fingerprintCommand(command);
  const processed = source.processedCommands.find(
    (entry) => entry.commandId === command.commandId,
  );
  if (processed) {
    if (processed.fingerprint !== fingerprint) {
      return failure(
        source,
        domainError("COMMAND_CONFLICT", "Command identifier was already used with different input"),
      );
    }

    return {
      ok: true,
      state: source,
      result: { ...processed.result, idempotent: true },
    };
  }

  const evaluated = evaluateExpiry(source, now);

  try {
    const next = executeNewCommand(evaluated, command, now);
    validateWorkflowState(next.state);
    return next;
  } catch (error) {
    return failure(
      evaluated.state,
      asDomainError(error, "VALIDATION_FAILED", "Workflow command was rejected"),
    );
  }
}

export function evaluateExpiry(
  state: WorkflowState,
  now: string,
): { state: WorkflowState; changed: boolean } {
  validateNow(now);
  const next = clone(state);
  validateWorkflowState(next);

  if (
    !next.request ||
    next.request.state !== "SLOT_PROPOSED" ||
    !next.request.proposalExpiresAt ||
    Date.parse(now) < Date.parse(next.request.proposalExpiresAt)
  ) {
    return { state: next, changed: false };
  }

  const request = next.request;
  const priorState = request.state;
  request.state = "EXPIRED";
  request.version += 1;

  const sentResponse = request.sentResponse;
  const heldSlot = sentResponse?.kind === "SLOT_PROPOSAL"
    ? next.slots.find(
        (slot) => slot.id === sentResponse.slotId && slot.heldByRequestId === request.id,
      )
    : undefined;
  if (heldSlot) {
    heldSlot.status = "AVAILABLE";
    delete heldSlot.heldByRequestId;
  }

  appendAudit(next, {
    operation: "EXPIRE_PROPOSAL",
    requestId: request.id,
    fromState: priorState,
    toState: request.state,
    requestVersion: request.version,
  });
  return { state: next, changed: true };
}

function executeNewCommand(
  source: { state: WorkflowState; changed: boolean },
  command: WorkflowCommand,
  now: string,
): { ok: true; state: WorkflowState; result: DomainCommandResult } {
  const state = source.state;
  if (source.changed && state.request?.state === "EXPIRED") {
    throw domainError("EXPIRED", "Viewing request proposal has expired");
  }

  switch (command.type) {
    case "CREATE_REQUEST_DRAFT":
      return createDraft(state, command);
    case "UPDATE_REQUEST_DRAFT":
      return updateDraft(state, command);
    case "SUBMIT_REQUEST":
      return submitRequest(state, command);
    case "START_AGENT_REVIEW":
      return startAgentReview(state, command);
    case "PREPARE_AGENT_RESPONSE":
      return prepareAgentResponse(state, command);
    case "SEND_SLOT_PROPOSAL":
      return sendSlotProposal(state, command, now);
    case "SEND_AGENT_DECLINE":
      return sendAgentDecline(state, command);
    case "CONFIRM_VIEWING":
      return confirmViewing(state, command);
    case "DECLINE_VIEWING":
      return declineViewing(state, command);
  }
}

function createDraft(
  state: WorkflowState,
  command: Extract<WorkflowCommand, { type: "CREATE_REQUEST_DRAFT" }>,
): { ok: true; state: WorkflowState; result: DomainCommandResult } {
  assertTenant(command.actor, state);
  assertFixtureGeneration(state, command.fixtureGeneration);
  assertExpectedVersion(0, command.expectedRequestVersion);
  if (state.request) {
    throw domainError("INVALID_TRANSITION", "The fixture already contains a viewing request");
  }

  const listing = getPublishedListing(state, command.listingId);
  assertExpectedVersion(listing.version, command.expectedListingVersion);
  validateDraftInput(command.preferredTimes, command.tenantNote);

  const request: ViewingRequest = {
    id: command.requestId,
    listingId: listing.id,
    listingVersion: listing.version,
    tenantId: state.tenantId,
    agentId: listing.assignedAgentId,
    preferredTimes: [...command.preferredTimes],
    tenantNote: command.tenantNote,
    state: "TENANT_DRAFT",
    version: 1,
    fixtureGeneration: state.fixtureGeneration,
  };
  state.request = request;
  appendAudit(state, auditForCommand(command, null, request.state, request.version));
  return success(state, command, request);
}

function updateDraft(
  state: WorkflowState,
  command: Extract<WorkflowCommand, { type: "UPDATE_REQUEST_DRAFT" }>,
): { ok: true; state: WorkflowState; result: DomainCommandResult } {
  assertTenant(command.actor, state);
  const request = requireRequest(state);
  assertRequestIdentity(request, command);
  assertExpectedVersion(request.version, command.expectedRequestVersion);
  assertExpectedVersion(request.listingVersion, command.expectedListingVersion);
  assertRequestState(request, "TENANT_DRAFT");
  const listing = getPublishedListing(state, command.listingId);
  if (listing.id !== request.listingId) {
    throw domainError("VALIDATION_FAILED", "Draft listing does not match the request");
  }
  validateDraftInput(command.preferredTimes, command.tenantNote);

  request.preferredTimes = [...command.preferredTimes];
  request.tenantNote = command.tenantNote;
  request.version += 1;
  appendAudit(state, auditForCommand(command, "TENANT_DRAFT", request.state, request.version));
  return success(state, command, request);
}

function submitRequest(
  state: WorkflowState,
  command: Extract<WorkflowCommand, { type: "SUBMIT_REQUEST" }>,
): { ok: true; state: WorkflowState; result: DomainCommandResult } {
  assertTenant(command.actor, state);
  const request = requireRequest(state);
  assertRequestIdentity(request, command);
  assertExpectedVersion(request.version, command.expectedRequestVersion);
  assertExpectedVersion(request.listingVersion, command.expectedListingVersion);
  assertRequestState(request, "TENANT_DRAFT");
  const listing = getPublishedListing(state, command.listingId);
  if (listing.id !== request.listingId) {
    throw domainError("VALIDATION_FAILED", "Submission listing does not match the request");
  }
  validateDraftInput(request.preferredTimes, request.tenantNote);

  request.state = "REQUEST_SUBMITTED";
  request.version += 1;
  appendAudit(state, auditForCommand(command, "TENANT_DRAFT", request.state, request.version));
  return success(state, command, request);
}

function startAgentReview(
  state: WorkflowState,
  command: Extract<WorkflowCommand, { type: "START_AGENT_REVIEW" }>,
): { ok: true; state: WorkflowState; result: DomainCommandResult } {
  assertAgent(command.actor, state);
  const request = requireRequest(state);
  assertRequestIdentity(request, command);
  assertExpectedVersion(request.version, command.expectedRequestVersion);
  assertRequestState(request, "REQUEST_SUBMITTED");

  request.state = "AGENT_REVIEWING";
  request.version += 1;
  appendAudit(state, auditForCommand(command, "REQUEST_SUBMITTED", request.state, request.version));
  return success(state, command, request);
}

function prepareAgentResponse(
  state: WorkflowState,
  command: Extract<WorkflowCommand, { type: "PREPARE_AGENT_RESPONSE" }>,
): { ok: true; state: WorkflowState; result: DomainCommandResult } {
  assertAgent(command.actor, state);
  const request = requireRequest(state);
  assertRequestIdentity(request, command);
  assertExpectedVersion(request.version, command.expectedRequestVersion);
  assertRequestState(request, "AGENT_REVIEWING");
  validatePreparation(command.preparation, command.internalReviewNote);

  if (command.preparation.kind === "SLOT_PROPOSAL") {
    const slot = getSlot(state, command.preparation.slotId);
    if (slot.listingId !== request.listingId) {
      throw domainError("VALIDATION_FAILED", "Prepared slot does not belong to the request listing");
    }
    if (slot.status !== "AVAILABLE") {
      throw domainError("SLOT_UNAVAILABLE", "Prepared slot is not available");
    }
  }

  request.preparedResponse = clone(command.preparation);
  request.internalReviewNote = command.internalReviewNote;
  request.version += 1;
  appendAudit(state, auditForCommand(command, "AGENT_REVIEWING", request.state, request.version));
  return success(state, command, request, command.preparation.kind === "SLOT_PROPOSAL"
    ? command.preparation.slotId
    : undefined);
}

function sendSlotProposal(
  state: WorkflowState,
  command: Extract<WorkflowCommand, { type: "SEND_SLOT_PROPOSAL" }>,
  now: string,
): { ok: true; state: WorkflowState; result: DomainCommandResult } {
  assertAgent(command.actor, state);
  const request = requireRequest(state);
  assertRequestIdentity(request, command);
  assertExpectedVersion(request.version, command.expectedRequestVersion);
  assertRequestState(request, "AGENT_REVIEWING");
  const prepared = request.preparedResponse;
  if (!prepared || prepared.kind !== "SLOT_PROPOSAL") {
    throw domainError("INVALID_TRANSITION", "A slot proposal must be prepared before sending");
  }

  const slot = getSlot(state, prepared.slotId);
  if (slot.listingId !== request.listingId) {
    throw domainError("VALIDATION_FAILED", "Prepared slot does not belong to the request listing");
  }
  if (slot.status !== "AVAILABLE") {
    throw domainError("SLOT_UNAVAILABLE", "Prepared slot is no longer available");
  }

  request.state = "SLOT_PROPOSED";
  request.sentResponse = clone(prepared);
  request.proposalExpiresAt = addHours(now, PROPOSAL_WINDOW_HOURS);
  request.version += 1;
  slot.status = "HELD_FOR_PROPOSAL";
  slot.heldByRequestId = request.id;
  appendAudit(state, auditForCommand(command, "AGENT_REVIEWING", request.state, request.version));
  return success(state, command, request, slot.id);
}

function sendAgentDecline(
  state: WorkflowState,
  command: Extract<WorkflowCommand, { type: "SEND_AGENT_DECLINE" }>,
): { ok: true; state: WorkflowState; result: DomainCommandResult } {
  assertAgent(command.actor, state);
  const request = requireRequest(state);
  assertRequestIdentity(request, command);
  assertExpectedVersion(request.version, command.expectedRequestVersion);
  assertRequestState(request, "AGENT_REVIEWING");
  const prepared = request.preparedResponse;
  if (!prepared || prepared.kind !== "AGENT_DECLINE") {
    throw domainError("INVALID_TRANSITION", "An agent decline must be prepared before sending");
  }

  request.state = "AGENT_DECLINED";
  request.sentResponse = clone(prepared);
  request.version += 1;
  appendAudit(state, auditForCommand(command, "AGENT_REVIEWING", request.state, request.version));
  return success(state, command, request);
}

function confirmViewing(
  state: WorkflowState,
  command: Extract<WorkflowCommand, { type: "CONFIRM_VIEWING" }>,
): { ok: true; state: WorkflowState; result: DomainCommandResult } {
  assertTenant(command.actor, state);
  const request = requireRequest(state);
  assertRequestIdentity(request, command);
  assertExpectedVersion(request.version, command.expectedRequestVersion);
  assertRequestState(request, "SLOT_PROPOSED");
  const sent = request.sentResponse;
  if (!sent || sent.kind !== "SLOT_PROPOSAL") {
    throw domainError("INVALID_TRANSITION", "Only a slot proposal can be confirmed");
  }

  const slot = getSlot(state, sent.slotId);
  if (slot.heldByRequestId !== request.id || slot.status !== "HELD_FOR_PROPOSAL") {
    throw domainError("SLOT_UNAVAILABLE", "The proposed slot is no longer held");
  }
  request.state = "VIEWING_CONFIRMED";
  request.version += 1;
  slot.status = "CONFIRMED";
  delete slot.heldByRequestId;
  appendAudit(state, auditForCommand(command, "SLOT_PROPOSED", request.state, request.version));
  return success(state, command, request, slot.id);
}

function declineViewing(
  state: WorkflowState,
  command: Extract<WorkflowCommand, { type: "DECLINE_VIEWING" }>,
): { ok: true; state: WorkflowState; result: DomainCommandResult } {
  assertTenant(command.actor, state);
  const request = requireRequest(state);
  assertRequestIdentity(request, command);
  assertExpectedVersion(request.version, command.expectedRequestVersion);
  assertRequestState(request, "SLOT_PROPOSED");
  const sent = request.sentResponse;
  if (!sent || sent.kind !== "SLOT_PROPOSAL") {
    throw domainError("INVALID_TRANSITION", "Only a slot proposal can be declined");
  }

  const slot = getSlot(state, sent.slotId);
  if (slot.heldByRequestId !== request.id || slot.status !== "HELD_FOR_PROPOSAL") {
    throw domainError("SLOT_UNAVAILABLE", "The proposed slot is no longer held");
  }
  request.state = "TENANT_DECLINED";
  request.version += 1;
  slot.status = "AVAILABLE";
  delete slot.heldByRequestId;
  appendAudit(state, auditForCommand(command, "SLOT_PROPOSED", request.state, request.version));
  return success(state, command, request, slot.id);
}

function success(
  state: WorkflowState,
  command: WorkflowCommand,
  request: ViewingRequest,
  slotId?: string,
): { ok: true; state: WorkflowState; result: DomainCommandResult } {
  const result: DomainCommandResult = {
    commandId: command.commandId,
    requestId: request.id,
    requestState: request.state,
    requestVersion: request.version,
    ...(slotId ? { slotId } : {}),
  };
  state.processedCommands.push({
    commandId: command.commandId,
    fingerprint: fingerprintCommand(command),
    result,
  });
  return { ok: true, state, result };
}

function failure(state: WorkflowState, error: DomainError): CommandOutcome {
  return { ok: false, state, error };
}

function assertTenant(actor: Actor, state: WorkflowState): void {
  assertActorRole(actor, "tenant");
  if (actor.id !== state.tenantId) {
    throw domainError("FORBIDDEN", "Actor is not the assigned tenant");
  }
}

function assertAgent(actor: Actor, state: WorkflowState): void {
  assertActorRole(actor, "agent");
  if (actor.id !== state.agentId) {
    throw domainError("FORBIDDEN", "Actor is not the assigned agent");
  }
}

function assertActorRole(actor: Actor, role: ActorRole): void {
  if (actor.role !== role) {
    throw domainError("FORBIDDEN", "Actor role is not permitted for this operation");
  }
}

function assertFixtureGeneration(state: WorkflowState, expected: number): void {
  if (state.fixtureGeneration !== expected) {
    throw domainError("FIXTURE_GENERATION_CONFLICT", "Fixture generation is stale");
  }
}

function assertExpectedVersion(actual: number, expected: number): void {
  if (actual !== expected) {
    throw domainError("STALE_VERSION", "Expected version is stale");
  }
}

function assertRequestIdentity(request: ViewingRequest, command: WorkflowCommand): void {
  if (request.id !== command.requestId) {
    throw domainError("NOT_FOUND", "Viewing request was not found");
  }
  if (request.fixtureGeneration !== command.fixtureGeneration) {
    throw domainError("FIXTURE_GENERATION_CONFLICT", "Fixture generation is stale");
  }
}

function assertRequestState(request: ViewingRequest, expected: RequestState): void {
  if (request.state !== expected) {
    if (TERMINAL_STATES.has(request.state)) {
      throw domainError("INVALID_TRANSITION", "Viewing request is terminal");
    }
    throw domainError("INVALID_TRANSITION", `Viewing request is not in ${expected}`);
  }
}

function requireRequest(state: WorkflowState): ViewingRequest {
  if (!state.request) {
    throw domainError("NOT_FOUND", "Viewing request was not found");
  }
  return state.request;
}

function getPublishedListing(state: WorkflowState, listingId: string): Listing {
  const listing = state.listings.find((candidate) => candidate.id === listingId);
  if (!listing) {
    throw domainError("NOT_FOUND", "Listing was not found");
  }
  if (listing.status !== "PUBLISHED") {
    throw domainError("VALIDATION_FAILED", "Listing is not published");
  }
  return listing;
}

function getSlot(state: WorkflowState, slotId: string): AvailabilitySlot {
  const slot = state.slots.find((candidate) => candidate.id === slotId);
  if (!slot) {
    throw domainError("NOT_FOUND", "Availability slot was not found");
  }
  return slot;
}

function validateCommandMetadata(command: WorkflowCommand): void {
  validateIdentifier(command.commandId, "command identifier");
  validateIdentifier(command.requestId, "request identifier");
  validateIdentifier(command.actor.id, "actor identifier");
  if (!Number.isInteger(command.fixtureGeneration) || command.fixtureGeneration < 1) {
    throw domainError("VALIDATION_FAILED", "Fixture generation must be a positive integer");
  }
  if (!Number.isInteger(command.expectedRequestVersion) || command.expectedRequestVersion < 0) {
    throw domainError("VALIDATION_FAILED", "Expected request version must be a non-negative integer");
  }
}

function validateDraftInput(preferredTimes: string[], tenantNote?: string): void {
  if (!Array.isArray(preferredTimes) || preferredTimes.length < 1 || preferredTimes.length > 3) {
    throw domainError("VALIDATION_FAILED", "One to three preferred times are required");
  }
  let previous = Number.NEGATIVE_INFINITY;
  for (const preferredTime of preferredTimes) {
    const parsed = Date.parse(preferredTime);
    if (!Number.isFinite(parsed) || parsed <= previous) {
      throw domainError("VALIDATION_FAILED", "Preferred times must be ordered timestamps");
    }
    previous = parsed;
  }
  validateOptionalNote(tenantNote, MAX_TENANT_NOTE_LENGTH, "Tenant note");
}

function validatePreparation(
  preparation: ResponsePreparationInput,
  internalReviewNote?: string,
): void {
  if (preparation.kind === "SLOT_PROPOSAL") {
    validateIdentifier(preparation.slotId, "slot identifier");
  }
  validateOptionalNote(preparation.tenantNote, MAX_NOTE_LENGTH, "Tenant-facing response note");
  validateOptionalNote(internalReviewNote, MAX_NOTE_LENGTH, "Internal review note");
}

function validateOptionalNote(value: string | undefined, max: number, label: string): void {
  if (value !== undefined && (value.length > max || value.trim().length === 0)) {
    throw domainError("VALIDATION_FAILED", `${label} is outside its bounds`);
  }
}

function validateIdentifier(value: string, label: string): void {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > MAX_IDENTIFIER_LENGTH ||
    !ISO_IDENTIFIER_PATTERN.test(value)
  ) {
    throw domainError("VALIDATION_FAILED", `${label} is outside its bounds`);
  }
}

function validateNow(now: string): void {
  if (typeof now !== "string" || !Number.isFinite(Date.parse(now))) {
    throw domainError("VALIDATION_FAILED", "Injected time must be a valid timestamp");
  }
}

function validateWorkflowState(state: WorkflowState): void {
  if (!Number.isInteger(state.fixtureGeneration) || state.fixtureGeneration < 1) {
    throw domainError("VALIDATION_FAILED", "Invalid fixture generation");
  }
  validateIdentifier(state.tenantId, "tenant identifier");
  validateIdentifier(state.agentId, "agent identifier");
  if (!Array.isArray(state.listings) || !Array.isArray(state.slots) || !Array.isArray(state.audit)) {
    throw domainError("VALIDATION_FAILED", "Invalid workflow collections");
  }
  for (const listing of state.listings) {
    validateIdentifier(listing.id, "listing identifier");
    if (!Number.isInteger(listing.version) || listing.version < 1) {
      throw domainError("VALIDATION_FAILED", "Invalid listing version");
    }
    if (!listing.assignedAgentId || !["PUBLISHED", "UNPUBLISHED"].includes(listing.status)) {
      throw domainError("VALIDATION_FAILED", "Invalid listing state");
    }
    if (listing.assignedAgentId !== state.agentId) {
      throw domainError("VALIDATION_FAILED", "Listing agent assignment is invalid");
    }
  }
  for (const slot of state.slots) {
    validateIdentifier(slot.id, "slot identifier");
    if (!Number.isFinite(Date.parse(slot.startsAt)) || !Number.isFinite(Date.parse(slot.endsAt))) {
      throw domainError("VALIDATION_FAILED", "Invalid slot timestamp");
    }
    if (![
      "AVAILABLE",
      "HELD_FOR_PROPOSAL",
      "CONFIRMED",
    ].includes(slot.status)) {
      throw domainError("VALIDATION_FAILED", "Invalid slot state");
    }
  }
  if (state.request) {
    validateIdentifier(state.request.id, "request identifier");
    if (!REQUEST_STATES.includes(state.request.state)) {
      throw domainError("VALIDATION_FAILED", "Invalid request state");
    }
    if (!Number.isInteger(state.request.version) || state.request.version < 1) {
      throw domainError("VALIDATION_FAILED", "Invalid request version");
    }
    if (state.request.fixtureGeneration !== state.fixtureGeneration) {
      throw domainError("VALIDATION_FAILED", "Request belongs to another fixture generation");
    }
    if (state.request.tenantId !== state.tenantId) {
      throw domainError("VALIDATION_FAILED", "Request tenant does not match the fixture");
    }
    if (state.request.agentId !== state.agentId) {
      throw domainError("VALIDATION_FAILED", "Request agent does not match the fixture");
    }
    const requestListing = state.listings.find((listing) => listing.id === state.request?.listingId);
    if (!requestListing || state.request.agentId !== requestListing.assignedAgentId) {
      throw domainError("VALIDATION_FAILED", "Request agent assignment is invalid");
    }
  }
}

function appendAudit(state: WorkflowState, entry: Omit<AuditEntry, "sequence">): void {
  state.audit.push({ sequence: state.audit.length + 1, ...entry });
}

function auditForCommand(
  command: WorkflowCommand,
  fromState: RequestState | null,
  toState: RequestState,
  requestVersion: number,
): Omit<AuditEntry, "sequence"> {
  return {
    commandId: command.commandId,
    operation: command.type,
    actorId: command.actor.id,
    actorRole: command.actor.role,
    requestId: command.requestId,
    fromState,
    toState,
    requestVersion,
  };
}

function asDomainError(
  error: unknown,
  fallbackCode: "VALIDATION_FAILED",
  fallbackMessage: string,
): DomainError {
  return error instanceof DomainError ? error : domainError(fallbackCode, fallbackMessage);
}

function fingerprintCommand(command: WorkflowCommand): string {
  return JSON.stringify(sortKeys(command));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortKeys(entry)]),
    );
  }
  return value;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function addHours(now: string, hours: number): string {
  return new Date(Date.parse(now) + hours * 60 * 60 * 1000).toISOString();
}

function createDefaultListings(agentId: string): Listing[] {
  return [
    { id: "listing-primary", version: 1, status: "PUBLISHED", assignedAgentId: agentId },
    { id: "listing-north", version: 1, status: "PUBLISHED", assignedAgentId: agentId },
    { id: "listing-riverside", version: 1, status: "PUBLISHED", assignedAgentId: agentId },
  ];
}

function createDefaultSlots(listingId: string): AvailabilitySlot[] {
  return [
    {
      id: "slot-primary-1",
      listingId,
      startsAt: "2026-09-03T10:00:00.000Z",
      endsAt: "2026-09-03T10:30:00.000Z",
      status: "AVAILABLE",
    },
    {
      id: "slot-primary-2",
      listingId,
      startsAt: "2026-09-04T14:00:00.000Z",
      endsAt: "2026-09-04T14:30:00.000Z",
      status: "AVAILABLE",
    },
    {
      id: "slot-primary-3",
      listingId,
      startsAt: "2026-09-05T16:00:00.000Z",
      endsAt: "2026-09-05T16:30:00.000Z",
      status: "AVAILABLE",
    },
  ];
}
