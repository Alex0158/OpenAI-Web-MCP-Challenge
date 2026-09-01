import { domainError, isDomainError, type DomainError } from "../domain/errors";
import {
  MAX_IDENTIFIER_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_TENANT_NOTE_LENGTH,
} from "../domain/workflow";
import type {
  Actor,
  AgentProjection,
  CommandOutcome,
  ProjectionOutcome,
  TenantProjection,
  WorkflowCommand,
} from "../domain/types";
import { WorkflowPersistenceError } from "../persistence/workflow-store";
import {
  resolveDemoSession,
} from "./demo-session";
import {
  createWorkflowApplication,
  type WorkflowApplication,
} from "./workflow";
import {
  toAgentQueueView,
  toAgentRequestView,
  toCommandResult,
  toTenantRequestView,
} from "./workflow-views";
import type {
  CreateRequestDraftBody,
  ResponsePreparationBody,
  SendAgentResponseBody,
  StartAgentReviewBody,
  SubmitRequestBody,
  TenantDecisionBody,
  TenantWorkflowMutationResponse,
  UpdateRequestDraftBody,
  AgentWorkflowMutationResponse,
  WorkflowErrorCode,
  WorkflowErrorResponse,
  WorkflowResponseDto,
} from "../../shared/contracts/workflow-api";

const WORKFLOW_REQUEST_ID = "request-1";
const MAX_WORKFLOW_BODY_LENGTH = 8_000;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]+$/;
const JSON_CONTENT_TYPE = "application/json";

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

export type WorkflowApplicationPort = Pick<
  WorkflowApplication,
  | "readTenantRequest"
  | "readAgentQueue"
  | "readAgentProjection"
  | "applyCommand"
  | "close"
>;

export type WorkflowHttpDependencies = {
  createApplication?: () => WorkflowApplicationPort;
  now?: () => string;
};

class HttpInputError extends Error {}

export function handleReadTenantRequest(
  request: Request,
  dependencies: WorkflowHttpDependencies = {},
): Response {
  const actor = requireRoleSession(request, "tenant");
  if (actor instanceof Response) return actor;

  return runWorkflow(dependencies, (application, now) => {
    return toTenantRequestView(application.readTenantRequest(actor, now));
  });
}

export async function handleCreateTenantRequest(
  request: Request,
  dependencies: WorkflowHttpDependencies = {},
): Promise<Response> {
  const actor = requireRoleSession(request, "tenant");
  if (actor instanceof Response) return actor;

  let body: CreateRequestDraftBody;
  try {
    body = await readCreateRequestDraftBody(request);
  } catch (error) {
    return workflowErrorResponse(error);
  }

  return runWorkflow(dependencies, (application, now) => {
    const current = application.readTenantRequest(actor, now);
    const outcome = application.applyCommand({
      type: "CREATE_REQUEST_DRAFT",
      commandId: body.commandId,
      actor,
      fixtureGeneration: body.fixtureGeneration,
      requestId: current.projection?.request.id ?? WORKFLOW_REQUEST_ID,
      expectedRequestVersion: 0,
      listingId: body.listingId,
      expectedListingVersion: body.expectedListingVersion,
      preferredTimes: [...body.preferredTimes],
      ...(body.tenantNote !== undefined ? { tenantNote: body.tenantNote } : {}),
    }, now);
    return tenantMutationResponse(application, actor, now, outcome);
  });
}

export async function handleUpdateTenantRequest(
  request: Request,
  dependencies: WorkflowHttpDependencies = {},
): Promise<Response> {
  const actor = requireRoleSession(request, "tenant");
  if (actor instanceof Response) return actor;

  let body: UpdateRequestDraftBody;
  try {
    body = await readUpdateRequestDraftBody(request);
  } catch (error) {
    return workflowErrorResponse(error);
  }

  return runWorkflow(dependencies, (application, now) => {
    const current = requireTenantRequest(application.readTenantRequest(actor, now));
    const outcome = application.applyCommand({
      type: "UPDATE_REQUEST_DRAFT",
      commandId: body.commandId,
      actor,
      fixtureGeneration: body.fixtureGeneration,
      requestId: current.projection.request.id,
      expectedRequestVersion: body.expectedRequestVersion,
      listingId: current.projection.request.listingId,
      expectedListingVersion: body.expectedListingVersion,
      preferredTimes: [...body.preferredTimes],
      ...(body.tenantNote !== undefined ? { tenantNote: body.tenantNote } : {}),
    }, now);
    return tenantMutationResponse(application, actor, now, outcome);
  });
}

export async function handleSubmitTenantRequest(
  request: Request,
  dependencies: WorkflowHttpDependencies = {},
): Promise<Response> {
  const actor = requireRoleSession(request, "tenant");
  if (actor instanceof Response) return actor;

  let body: SubmitRequestBody;
  try {
    body = await readSubmitRequestBody(request);
  } catch (error) {
    return workflowErrorResponse(error);
  }

  return runWorkflow(dependencies, (application, now) => {
    const current = requireTenantRequest(application.readTenantRequest(actor, now));
    const outcome = application.applyCommand({
      type: "SUBMIT_REQUEST",
      commandId: body.commandId,
      actor,
      fixtureGeneration: body.fixtureGeneration,
      requestId: current.projection.request.id,
      expectedRequestVersion: body.expectedRequestVersion,
      listingId: current.projection.request.listingId,
      expectedListingVersion: body.expectedListingVersion,
    }, now);
    return tenantMutationResponse(application, actor, now, outcome);
  });
}

export async function handleConfirmTenantRequest(
  request: Request,
  dependencies: WorkflowHttpDependencies = {},
): Promise<Response> {
  return handleTenantDecision(request, "CONFIRM_VIEWING", dependencies);
}

export async function handleDeclineTenantRequest(
  request: Request,
  dependencies: WorkflowHttpDependencies = {},
): Promise<Response> {
  return handleTenantDecision(request, "DECLINE_VIEWING", dependencies);
}

export function handleReadAgentQueue(
  request: Request,
  dependencies: WorkflowHttpDependencies = {},
): Response {
  const actor = requireRoleSession(request, "agent");
  if (actor instanceof Response) return actor;

  return runWorkflow(dependencies, (application, now) => {
    return toAgentQueueView(application.readAgentQueue(actor, now));
  });
}

export function handleReadAgentRequest(
  request: Request,
  requestId: string,
  dependencies: WorkflowHttpDependencies = {},
): Response {
  const actor = requireRoleSession(request, "agent");
  if (actor instanceof Response) return actor;

  try {
    validateIdentifier(requestId, "request identifier");
  } catch (error) {
    return workflowErrorResponse(error);
  }

  return runWorkflow(dependencies, (application, now) => {
    const projection = application.readAgentProjection(actor, now);
    assertRequestPath(projection, requestId);
    return toAgentRequestView(projection);
  });
}

export async function handleStartAgentReview(
  request: Request,
  requestId: string,
  dependencies: WorkflowHttpDependencies = {},
): Promise<Response> {
  const actor = requireRoleSession(request, "agent");
  if (actor instanceof Response) return actor;
  const validatedRequestId = validateRequestIdOrResponse(requestId);
  if (validatedRequestId instanceof Response) return validatedRequestId;

  let body: StartAgentReviewBody;
  try {
    body = await readStartAgentReviewBody(request);
  } catch (error) {
    return workflowErrorResponse(error);
  }

  return runWorkflow(dependencies, (application, now) => {
    const current = readAgentRequestForPath(application, actor, validatedRequestId, now);
    const outcome = application.applyCommand({
      type: "START_AGENT_REVIEW",
      commandId: body.commandId,
      actor,
      fixtureGeneration: body.fixtureGeneration,
      requestId: current.projection.request.id,
      expectedRequestVersion: body.expectedRequestVersion,
    }, now);
    return agentMutationResponse(application, actor, now, outcome);
  });
}

export async function handlePrepareAgentResponse(
  request: Request,
  requestId: string,
  dependencies: WorkflowHttpDependencies = {},
): Promise<Response> {
  const actor = requireRoleSession(request, "agent");
  if (actor instanceof Response) return actor;
  const validatedRequestId = validateRequestIdOrResponse(requestId);
  if (validatedRequestId instanceof Response) return validatedRequestId;

  let body: ResponsePreparationBody;
  try {
    body = await readResponsePreparationBody(request);
  } catch (error) {
    return workflowErrorResponse(error);
  }

  return runWorkflow(dependencies, (application, now) => {
    const current = readAgentRequestForPath(application, actor, validatedRequestId, now);
    const outcome = application.applyCommand({
      type: "PREPARE_AGENT_RESPONSE",
      commandId: body.commandId,
      actor,
      fixtureGeneration: body.fixtureGeneration,
      requestId: current.projection.request.id,
      expectedRequestVersion: body.expectedRequestVersion,
      preparation: body.preparation,
      ...(body.internalReviewNote !== undefined
        ? { internalReviewNote: body.internalReviewNote }
        : {}),
    }, now);
    return agentMutationResponse(application, actor, now, outcome);
  });
}

export async function handleSendAgentResponse(
  request: Request,
  requestId: string,
  dependencies: WorkflowHttpDependencies = {},
): Promise<Response> {
  const actor = requireRoleSession(request, "agent");
  if (actor instanceof Response) return actor;
  const validatedRequestId = validateRequestIdOrResponse(requestId);
  if (validatedRequestId instanceof Response) return validatedRequestId;

  let body: SendAgentResponseBody;
  try {
    body = await readSendAgentResponseBody(request);
  } catch (error) {
    return workflowErrorResponse(error);
  }

  return runWorkflow(dependencies, (application, now) => {
    const current = readAgentRequestForPath(application, actor, validatedRequestId, now);
    const prepared = current.projection.request.preparedResponse;
    if (!prepared) {
      throw domainError("INVALID_TRANSITION", "A response must be prepared before sending");
    }

    let type: "SEND_SLOT_PROPOSAL" | "SEND_AGENT_DECLINE";
    if (prepared.kind === "SLOT_PROPOSAL") {
      type = "SEND_SLOT_PROPOSAL";
    } else if (prepared.kind === "AGENT_DECLINE") {
      type = "SEND_AGENT_DECLINE";
    } else {
      throw new WorkflowPersistenceError();
    }

    const outcome = application.applyCommand({
      type,
      commandId: body.commandId,
      actor,
      fixtureGeneration: body.fixtureGeneration,
      requestId: current.projection.request.id,
      expectedRequestVersion: body.expectedRequestVersion,
    }, now);
    return agentMutationResponse(application, actor, now, outcome);
  });
}

async function handleTenantDecision(
  request: Request,
  type: "CONFIRM_VIEWING" | "DECLINE_VIEWING",
  dependencies: WorkflowHttpDependencies,
): Promise<Response> {
  const actor = requireRoleSession(request, "tenant");
  if (actor instanceof Response) return actor;

  let body: TenantDecisionBody;
  try {
    body = await readTenantDecisionBody(request);
  } catch (error) {
    return workflowErrorResponse(error);
  }

  return runWorkflow(dependencies, (application, now) => {
    const current = requireTenantRequest(application.readTenantRequest(actor, now));
    const outcome = application.applyCommand({
      type,
      commandId: body.commandId,
      actor,
      fixtureGeneration: body.fixtureGeneration,
      requestId: current.projection.request.id,
      expectedRequestVersion: body.expectedRequestVersion,
    }, now);
    return tenantMutationResponse(application, actor, now, outcome);
  });
}

function readAgentRequestForPath(
  application: WorkflowApplicationPort,
  actor: Actor,
  requestId: string,
  now: string,
): ProjectionOutcome<AgentProjection> {
  const projection = application.readAgentProjection(actor, now);
  assertRequestPath(projection, requestId);
  return projection;
}

function assertRequestPath(
  projection: ProjectionOutcome<AgentProjection>,
  requestId: string,
): void {
  if (projection.projection.request.id !== requestId) {
    throw domainError("NOT_FOUND", "Viewing request was not found");
  }
}

function requireTenantRequest(
  outcome: ProjectionOutcome<TenantProjection | null>,
): ProjectionOutcome<TenantProjection> {
  if (!outcome.projection) {
    throw domainError("NOT_FOUND", "Viewing request was not found");
  }
  return outcome as ProjectionOutcome<TenantProjection>;
}

function tenantMutationResponse(
  application: WorkflowApplicationPort,
  actor: Actor,
  now: string,
  outcome: CommandOutcome,
): TenantWorkflowMutationResponse {
  const result = requireCommandSuccess(outcome);
  const view = toTenantRequestView(application.readTenantRequest(actor, now));
  if (!view.request || !view.listing) {
    throw new WorkflowPersistenceError();
  }
  return {
    ...view,
    result: toCommandResult(result),
  };
}

function agentMutationResponse(
  application: WorkflowApplicationPort,
  actor: Actor,
  now: string,
  outcome: CommandOutcome,
): AgentWorkflowMutationResponse {
  const result = requireCommandSuccess(outcome);
  const view = toAgentRequestView(application.readAgentProjection(actor, now));
  return {
    ...view,
    result: toCommandResult(result),
  };
}

function requireCommandSuccess(
  outcome: CommandOutcome,
): Extract<CommandOutcome, { ok: true }>["result"] {
  if (!outcome.ok) {
    throw outcome.error;
  }
  return outcome.result;
}

function runWorkflow<T>(
  dependencies: WorkflowHttpDependencies,
  operation: (application: WorkflowApplicationPort, now: string) => T,
): Response {
  try {
    const application = (dependencies.createApplication ?? (() => createWorkflowApplication()))();
    try {
      const now = dependencies.now?.() ?? new Date().toISOString();
      return jsonResponse(200, operation(application, now));
    } finally {
      application.close();
    }
  } catch (error) {
    return workflowErrorResponse(error);
  }
}

function requireRoleSession(
  request: Request,
  role: "tenant" | "agent",
): Actor | Response {
  const actor = resolveDemoSession(request.headers.get("cookie"));
  if (!actor) {
    return errorResponse(401, "UNAUTHENTICATED", "Demo session is required");
  }
  if (actor.role !== role) {
    return errorResponse(403, "FORBIDDEN", "This role cannot access the workflow resource");
  }
  return actor;
}

function validateRequestIdOrResponse(requestId: string): string | Response {
  try {
    validateIdentifier(requestId, "request identifier");
    return requestId;
  } catch (error) {
    return workflowErrorResponse(error);
  }
}

async function readCreateRequestDraftBody(request: Request): Promise<CreateRequestDraftBody> {
  const body = await readBody(request, [
    "commandId",
    "fixtureGeneration",
    "listingId",
    "expectedListingVersion",
    "preferredTimes",
  ], ["tenantNote"]);
  return {
    commandId: readCommandId(body),
    fixtureGeneration: readPositiveInteger(body, "fixtureGeneration"),
    listingId: readIdentifier(readRequired(body, "listingId"), "listing identifier"),
    expectedListingVersion: readPositiveInteger(body, "expectedListingVersion"),
    preferredTimes: readPreferredTimes(readRequired(body, "preferredTimes")),
    ...(readOptionalNote(body, "tenantNote", MAX_TENANT_NOTE_LENGTH) ?? {}),
  };
}

async function readUpdateRequestDraftBody(request: Request): Promise<UpdateRequestDraftBody> {
  const body = await readBody(request, [
    "commandId",
    "fixtureGeneration",
    "expectedRequestVersion",
    "expectedListingVersion",
    "preferredTimes",
  ], ["tenantNote"]);
  return {
    commandId: readCommandId(body),
    fixtureGeneration: readPositiveInteger(body, "fixtureGeneration"),
    expectedRequestVersion: readNonNegativeInteger(body, "expectedRequestVersion"),
    expectedListingVersion: readPositiveInteger(body, "expectedListingVersion"),
    preferredTimes: readPreferredTimes(readRequired(body, "preferredTimes")),
    ...(readOptionalNote(body, "tenantNote", MAX_TENANT_NOTE_LENGTH) ?? {}),
  };
}

async function readSubmitRequestBody(request: Request): Promise<SubmitRequestBody> {
  const body = await readBody(request, [
    "commandId",
    "fixtureGeneration",
    "expectedRequestVersion",
    "expectedListingVersion",
  ]);
  return {
    commandId: readCommandId(body),
    fixtureGeneration: readPositiveInteger(body, "fixtureGeneration"),
    expectedRequestVersion: readNonNegativeInteger(body, "expectedRequestVersion"),
    expectedListingVersion: readPositiveInteger(body, "expectedListingVersion"),
  };
}

async function readTenantDecisionBody(request: Request): Promise<TenantDecisionBody> {
  const body = await readBody(request, [
    "commandId",
    "fixtureGeneration",
    "expectedRequestVersion",
  ]);
  return {
    commandId: readCommandId(body),
    fixtureGeneration: readPositiveInteger(body, "fixtureGeneration"),
    expectedRequestVersion: readNonNegativeInteger(body, "expectedRequestVersion"),
  };
}

async function readStartAgentReviewBody(request: Request): Promise<StartAgentReviewBody> {
  const body = await readBody(request, [
    "commandId",
    "fixtureGeneration",
    "expectedRequestVersion",
  ]);
  return {
    commandId: readCommandId(body),
    fixtureGeneration: readPositiveInteger(body, "fixtureGeneration"),
    expectedRequestVersion: readNonNegativeInteger(body, "expectedRequestVersion"),
  };
}

async function readResponsePreparationBody(request: Request): Promise<ResponsePreparationBody> {
  const body = await readBody(request, [
    "commandId",
    "fixtureGeneration",
    "expectedRequestVersion",
    "preparation",
  ], ["internalReviewNote"]);
  return {
    commandId: readCommandId(body),
    fixtureGeneration: readPositiveInteger(body, "fixtureGeneration"),
    expectedRequestVersion: readNonNegativeInteger(body, "expectedRequestVersion"),
    preparation: readPreparation(readRequired(body, "preparation")),
    ...(readOptionalNote(body, "internalReviewNote", MAX_NOTE_LENGTH) ?? {}),
  };
}

async function readSendAgentResponseBody(request: Request): Promise<SendAgentResponseBody> {
  const body = await readBody(request, [
    "commandId",
    "fixtureGeneration",
    "expectedRequestVersion",
  ]);
  return {
    commandId: readCommandId(body),
    fixtureGeneration: readPositiveInteger(body, "fixtureGeneration"),
    expectedRequestVersion: readNonNegativeInteger(body, "expectedRequestVersion"),
  };
}

async function readBody(
  request: Request,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[] = [],
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (contentType !== JSON_CONTENT_TYPE) {
    throw new HttpInputError("Workflow body must be JSON");
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    throw new HttpInputError("Workflow body is unreadable");
  }
  if (rawBody.length < 1 || rawBody.length > MAX_WORKFLOW_BODY_LENGTH) {
    throw new HttpInputError("Workflow body is outside its bounds");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    throw new HttpInputError("Workflow body is invalid");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new HttpInputError("Workflow body is invalid");
  }

  const body = parsed as Record<string, unknown>;
  const allowedKeys = new Set([...requiredKeys, ...optionalKeys]);
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) {
    throw new HttpInputError("Workflow body contains an unknown field");
  }
  if (requiredKeys.some((key) => !Object.prototype.hasOwnProperty.call(body, key))) {
    throw new HttpInputError("Workflow body is missing a field");
  }
  return body;
}

function readRequired(body: Record<string, unknown>, key: string): unknown {
  if (!Object.prototype.hasOwnProperty.call(body, key)) {
    throw new HttpInputError("Workflow body is missing a field");
  }
  return body[key];
}

function readCommandId(body: Record<string, unknown>): string {
  return readIdentifier(readRequired(body, "commandId"), "command identifier");
}

function readIdentifier(value: unknown, label: string): string {
  if (
    typeof value !== "string"
    || value.length < 1
    || value.length > MAX_IDENTIFIER_LENGTH
    || !IDENTIFIER_PATTERN.test(value)
  ) {
    throw new HttpInputError(`${label} is outside its bounds`);
  }
  return value;
}

function validateIdentifier(value: unknown, label: string): string {
  return readIdentifier(value, label);
}

function readPositiveInteger(body: Record<string, unknown>, key: string): number {
  const value = readRequired(body, key);
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new HttpInputError(`${key} is outside its bounds`);
  }
  return value;
}

function readNonNegativeInteger(body: Record<string, unknown>, key: string): number {
  const value = readRequired(body, key);
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new HttpInputError(`${key} is outside its bounds`);
  }
  return value;
}

function readPreferredTimes(value: unknown): string[] {
  if (
    !Array.isArray(value)
    || value.length < 1
    || value.length > 3
    || value.some((entry) => typeof entry !== "string")
  ) {
    throw new HttpInputError("Preferred times are outside their bounds");
  }
  return [...value] as string[];
}

function readOptionalNote(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
): { [key: string]: string } | undefined {
  if (!Object.prototype.hasOwnProperty.call(body, key)) {
    return undefined;
  }
  const value = body[key];
  if (
    typeof value !== "string"
    || value.length > maxLength
    || value.trim().length === 0
  ) {
    throw new HttpInputError(`${key} is outside its bounds`);
  }
  return { [key]: value };
}

function readPreparation(value: unknown): WorkflowResponseDto {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpInputError("Preparation is invalid");
  }

  const preparation = value as Record<string, unknown>;
  const keys = Object.keys(preparation);
  if (keys.some((key) => !["kind", "slotId", "tenantNote"].includes(key))) {
    throw new HttpInputError("Preparation contains an unknown field");
  }

  const kind = preparation.kind;
  if (kind === "SLOT_PROPOSAL") {
    if (!Object.prototype.hasOwnProperty.call(preparation, "slotId")) {
      throw new HttpInputError("A slot proposal requires a slot");
    }
    if (
      Object.prototype.hasOwnProperty.call(preparation, "tenantNote")
      && typeof preparation.tenantNote !== "string"
    ) {
      throw new HttpInputError("Tenant note is invalid");
    }
    const tenantNote = readPreparationNote(preparation.tenantNote);
    return {
      kind,
      slotId: readIdentifier(preparation.slotId, "slot identifier"),
      ...(tenantNote !== undefined ? { tenantNote } : {}),
    };
  }

  if (kind === "AGENT_DECLINE") {
    if (Object.prototype.hasOwnProperty.call(preparation, "slotId")) {
      throw new HttpInputError("A decline cannot select a slot");
    }
    if (
      Object.prototype.hasOwnProperty.call(preparation, "tenantNote")
      && typeof preparation.tenantNote !== "string"
    ) {
      throw new HttpInputError("Tenant note is invalid");
    }
    const tenantNote = readPreparationNote(preparation.tenantNote);
    return {
      kind,
      ...(tenantNote !== undefined ? { tenantNote } : {}),
    };
  }

  throw new HttpInputError("Preparation kind is invalid");
}

function readPreparationNote(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > MAX_NOTE_LENGTH || value.trim().length === 0) {
    throw new HttpInputError("Tenant note is outside its bounds");
  }
  return value;
}

function workflowErrorResponse(error: unknown): Response {
  if (error instanceof HttpInputError) {
    return errorResponse(400, "VALIDATION_FAILED", "Workflow input is invalid");
  }
  if (error instanceof WorkflowPersistenceError) {
    return errorResponse(503, "PERSISTENCE_ERROR", "Workflow service is unavailable");
  }
  if (isDomainError(error)) {
    return domainErrorResponse(error);
  }
  throw error;
}

function domainErrorResponse(error: DomainError): Response {
  const statusByCode: Record<Exclude<WorkflowErrorCode, "UNAUTHENTICATED" | "PERSISTENCE_ERROR">, number> = {
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_FAILED: 400,
    STALE_VERSION: 409,
    FIXTURE_GENERATION_CONFLICT: 409,
    INVALID_TRANSITION: 409,
    SLOT_UNAVAILABLE: 409,
    EXPIRED: 409,
    COMMAND_CONFLICT: 409,
  };
  const status = statusByCode[error.code];
  const messages: Record<DomainError["code"], string> = {
    FORBIDDEN: "Workflow access is not permitted",
    NOT_FOUND: "Workflow resource was not found",
    VALIDATION_FAILED: "Workflow input is invalid",
    STALE_VERSION: "Workflow version is stale",
    FIXTURE_GENERATION_CONFLICT: "Fixture generation is stale",
    INVALID_TRANSITION: "Workflow transition is not permitted",
    SLOT_UNAVAILABLE: "The selected slot is no longer available",
    EXPIRED: "The viewing response has expired",
    COMMAND_CONFLICT: "Command identifier conflicts with a completed command",
  };
  return errorResponse(status, error.code, messages[error.code]);
}

function errorResponse(
  status: number,
  code: WorkflowErrorCode,
  message: string,
): Response {
  const payload: WorkflowErrorResponse = { error: { code, message } };
  return jsonResponse(status, payload);
}

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}
