import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import {
  DELETE as deleteSession,
  POST as createSession,
} from "../../app/api/session/route";
import { WorkflowApplication } from "../../src/server/application/workflow";
import {
  handleConfirmTenantRequest,
  handleCreateTenantRequest,
  handleDeclineTenantRequest,
  handlePrepareAgentResponse,
  handleReadAgentQueue,
  handleReadAgentRequest,
  handleReadTenantRequest,
  handleSendAgentResponse,
  handleStartAgentReview,
  handleSubmitTenantRequest,
  handleUpdateTenantRequest,
  type WorkflowHttpDependencies,
} from "../../src/server/application/workflow-http";
import { WorkflowPersistenceError } from "../../src/server/persistence/workflow-store";

const NOW = "2026-09-01T09:00:00.000Z";
const LATER = "2026-09-01T10:00:00.000Z";
const EXPIRED = "2026-09-02T10:00:00.000Z";
const FIRST_TIME = "2026-09-03T10:00:00.000Z";
const SECOND_TIME = "2026-09-04T14:00:00.000Z";
const TENANT_COOKIE_NAME = "rightspot_demo_session";
const TEST_DIRECTORY = join(process.cwd(), "var/test");
let databaseSequence = 0;

mkdirSync(TEST_DIRECTORY, { recursive: true });

function databasePath(label: string): string {
  databaseSequence += 1;
  return join(TEST_DIRECTORY, `workflow-http-${process.pid}-${databaseSequence}-${label}.sqlite`);
}

function dependencies(path: string, now = NOW): WorkflowHttpDependencies {
  return {
    createApplication: () => new WorkflowApplication({
      databasePath: path,
      initialTimestamp: NOW,
    }),
    now: () => now,
  };
}

function jsonRequest(
  url: string,
  body: unknown,
  cookie?: string,
  method = "POST",
): Request {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

function request(url: string, cookie?: string, method = "GET"): Request {
  return new Request(url, {
    method,
    ...(cookie ? { headers: { cookie } } : {}),
  });
}

async function sessionCookie(role: "tenant" | "agent"): Promise<string> {
  const response = await createSession(jsonRequest("http://localhost/api/session", { role }));
  assert.equal(response.status, 200);
  return requireCookie(response);
}

function requireCookie(response: Response): string {
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie);
  const cookie = setCookie.split(";", 1)[0];
  assert.ok(cookie);
  return cookie;
}

async function responseBody(response: Response): Promise<Record<string, any>> {
  return await response.json() as Record<string, any>;
}

async function createDraft(
  path: string,
  cookie: string,
  commandId = "create-1",
): Promise<Record<string, any>> {
  const response = await handleCreateTenantRequest(
    jsonRequest("http://localhost/api/tenant/request", {
      commandId,
      fixtureGeneration: 1,
      listingId: "listing-primary",
      expectedListingVersion: 1,
      preferredTimes: [FIRST_TIME, SECOND_TIME],
      tenantNote: "Looking forward to viewing the property.",
    }, cookie),
    dependencies(path),
  );
  assert.equal(response.status, 200);
  return responseBody(response);
}

async function submitDraft(
  path: string,
  cookie: string,
  commandId = "submit-1",
  expectedRequestVersion = 1,
  expectedListingVersion = 1,
): Promise<Record<string, any>> {
  const response = await handleSubmitTenantRequest(
    jsonRequest("http://localhost/api/tenant/request/submit", {
      commandId,
      fixtureGeneration: 1,
      expectedRequestVersion,
      expectedListingVersion,
    }, cookie),
    dependencies(path),
  );
  assert.equal(response.status, 200);
  return responseBody(response);
}

async function startReview(
  path: string,
  cookie: string,
  expectedRequestVersion = 2,
): Promise<Record<string, any>> {
  const response = await handleStartAgentReview(
    jsonRequest("http://localhost/api/agent/requests/request-1/review", {
      commandId: "review-1",
      fixtureGeneration: 1,
      expectedRequestVersion,
    }, cookie),
    "request-1",
    dependencies(path),
  );
  assert.equal(response.status, 200);
  return responseBody(response);
}

async function prepareProposal(
  path: string,
  cookie: string,
  expectedRequestVersion = 3,
): Promise<Record<string, any>> {
  const response = await handlePrepareAgentResponse(
    jsonRequest("http://localhost/api/agent/requests/request-1/preparation", {
      commandId: "prepare-1",
      fixtureGeneration: 1,
      expectedRequestVersion,
      preparation: {
        kind: "SLOT_PROPOSAL",
        slotId: "slot-primary-1",
        tenantNote: "Please confirm this time.",
      },
      internalReviewNote: "The first requested slot is available.",
    }, cookie),
    "request-1",
    dependencies(path),
  );
  assert.equal(response.status, 200);
  return responseBody(response);
}

async function sendProposal(
  path: string,
  cookie: string,
  expectedRequestVersion = 4,
  commandId = "send-1",
): Promise<Record<string, any>> {
  const response = await handleSendAgentResponse(
    jsonRequest("http://localhost/api/agent/requests/request-1/send", {
      commandId,
      fixtureGeneration: 1,
      expectedRequestVersion,
    }, cookie),
    "request-1",
    dependencies(path),
  );
  assert.equal(response.status, 200);
  return responseBody(response);
}

test("tenant request and agent queue expose deterministic empty states", async () => {
  const path = databasePath("empty");
  const tenantCookie = await sessionCookie("tenant");
  const agentCookie = await sessionCookie("agent");

  const tenant = await responseBody(await handleReadTenantRequest(
    request("http://localhost/api/tenant/request", tenantCookie),
    dependencies(path),
  ));
  assert.deepEqual(tenant, {
    fixtureGeneration: 1,
    request: null,
    listing: null,
    timeline: [],
  });

  const queue = await responseBody(await handleReadAgentQueue(
    request("http://localhost/api/agent/requests", agentCookie),
    dependencies(path),
  ));
  assert.deepEqual(queue, {
    fixtureGeneration: 1,
    requests: [],
    counts: {
      TENANT_DRAFT: 0,
      REQUEST_SUBMITTED: 0,
      AGENT_REVIEWING: 0,
      SLOT_PROPOSED: 0,
      VIEWING_CONFIRMED: 0,
      TENANT_DECLINED: 0,
      EXPIRED: 0,
      AGENT_DECLINED: 0,
    },
  });

  assert.equal((await handleReadTenantRequest(
    request("http://localhost/api/tenant/request"),
    dependencies(path),
  )).status, 401);
  assert.equal((await handleReadTenantRequest(
    request("http://localhost/api/tenant/request", agentCookie),
    dependencies(path),
  )).status, 403);
  assert.equal((await handleReadAgentQueue(
    request("http://localhost/api/agent/requests", tenantCookie),
    dependencies(path),
  )).status, 403);

  const missing = await handleReadAgentRequest(
    request("http://localhost/api/agent/requests/request-missing", agentCookie),
    "request-missing",
    dependencies(path),
  );
  assert.equal(missing.status, 404);
  assert.deepEqual(await responseBody(missing), {
    error: { code: "NOT_FOUND", message: "Workflow resource was not found" },
  });
});

test("ordinary proposal path forwards commands and keeps tenant and agent DTOs private", async () => {
  const path = databasePath("proposal");
  const tenantCookie = await sessionCookie("tenant");
  const agentCookie = await sessionCookie("agent");

  const draft = await createDraft(path, tenantCookie);
  assert.equal(draft.fixtureGeneration, 1);
  assert.equal(draft.request.id, "request-1");
  assert.equal(draft.request.state, "TENANT_DRAFT");
  assert.equal(draft.request.version, 1);
  assert.equal(draft.result.state, "TENANT_DRAFT");
  assert.equal(draft.result.version, 1);
  assert.equal("actorId" in draft, false);
  assert.equal("commandId" in draft, false);

  const submitted = await submitDraft(path, tenantCookie);
  assert.equal(submitted.request.state, "REQUEST_SUBMITTED");
  assert.equal(submitted.request.version, 2);

  const queue = await responseBody(await handleReadAgentQueue(
    request("http://localhost/api/agent/requests", agentCookie),
    dependencies(path),
  ));
  assert.deepEqual(queue.requests, [{
    id: "request-1",
    listingId: "listing-primary",
    state: "REQUEST_SUBMITTED",
    version: 2,
  }]);
  assert.equal(queue.counts.REQUEST_SUBMITTED, 1);
  assert.equal(JSON.stringify(queue).includes("agent-demo"), false);
  assert.equal(JSON.stringify(queue).includes("processedCommands"), false);

  const detail = await responseBody(await handleReadAgentRequest(
    request("http://localhost/api/agent/requests/request-1", agentCookie),
    "request-1",
    dependencies(path),
  ));
  assert.equal(detail.request.state, "REQUEST_SUBMITTED");
  assert.equal(detail.request.version, 2);
  assert.equal(detail.listing.status, "PUBLISHED");
  assert.equal("assignedAgentId" in detail.listing, false);
  assert.equal(JSON.stringify(detail).includes("tenant-demo"), false);
  assert.equal(JSON.stringify(detail).includes("commandId"), false);

  const reviewed = await startReview(path, agentCookie);
  assert.equal(reviewed.request.state, "AGENT_REVIEWING");
  assert.equal(reviewed.request.version, 3);

  const prepared = await prepareProposal(path, agentCookie);
  assert.equal(prepared.request.state, "AGENT_REVIEWING");
  assert.equal(prepared.request.version, 4);
  assert.equal(prepared.request.preparedResponse.kind, "SLOT_PROPOSAL");
  assert.equal(prepared.request.internalReviewNote, "The first requested slot is available.");
  assert.equal(prepared.request.sentResponse, undefined);

  const tenantBeforeSend = await responseBody(await handleReadTenantRequest(
    request("http://localhost/api/tenant/request", tenantCookie),
    dependencies(path),
  ));
  assert.equal(tenantBeforeSend.request.state, "AGENT_REVIEWING");
  assert.equal("preparedResponse" in tenantBeforeSend.request, false);
  assert.equal("internalReviewNote" in tenantBeforeSend.request, false);
  assert.equal(tenantBeforeSend.request.response, undefined);

  const sent = await sendProposal(path, agentCookie);
  assert.equal(sent.request.state, "SLOT_PROPOSED");
  assert.equal(sent.request.version, 5);
  assert.equal(sent.request.sentResponse.kind, "SLOT_PROPOSAL");
  assert.equal(sent.request.preparedResponse.kind, "SLOT_PROPOSAL");
  assert.equal(sent.result.state, "SLOT_PROPOSED");
  assert.equal(sent.result.version, 5);
  assert.equal(sent.result.slotId, "slot-primary-1");

  const tenantAfterSend = await responseBody(await handleReadTenantRequest(
    request("http://localhost/api/tenant/request", tenantCookie),
    dependencies(path),
  ));
  assert.equal(tenantAfterSend.request.state, "SLOT_PROPOSED");
  assert.equal(tenantAfterSend.request.response.kind, "SLOT_PROPOSAL");
  assert.equal(tenantAfterSend.request.response.slotId, "slot-primary-1");
  assert.equal("preparedResponse" in tenantAfterSend.request, false);
  assert.equal("internalReviewNote" in tenantAfterSend.request, false);
  assert.equal(tenantAfterSend.timeline[0].operation, "CREATE_REQUEST_DRAFT");
  assert.equal("commandId" in tenantAfterSend.timeline[0], false);
  assert.equal("actorId" in tenantAfterSend.timeline[0], false);
  assert.equal("actorRole" in tenantAfterSend.timeline[0], false);
  assert.equal("heldByRequestId" in tenantAfterSend, false);

  const confirmed = await handleConfirmTenantRequest(
    jsonRequest("http://localhost/api/tenant/request/confirm", {
      commandId: "confirm-1",
      fixtureGeneration: 1,
      expectedRequestVersion: 5,
    }, tenantCookie),
    dependencies(path),
  );
  assert.equal(confirmed.status, 200);
  const confirmedBody = await responseBody(confirmed);
  assert.equal(confirmedBody.request.state, "VIEWING_CONFIRMED");
  assert.equal(confirmedBody.request.version, 6);
  assert.equal(confirmedBody.result.state, "VIEWING_CONFIRMED");
  assert.equal(confirmedBody.result.version, 6);

  const finalApplication = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  try {
    const finalState = finalApplication.readState();
    assert.equal(finalState.request?.state, "VIEWING_CONFIRMED");
    assert.equal(finalState.slots[0]?.status, "CONFIRMED");
    assert.equal(finalState.audit.length, 6);
    assert.equal(JSON.stringify(confirmedBody).includes("tenant-demo"), false);
    assert.equal(JSON.stringify(confirmedBody).includes("agent-demo"), false);
    assert.equal(JSON.stringify(confirmedBody).includes("processedCommands"), false);
  } finally {
    finalApplication.close();
  }
});

test("agent decline and tenant decline branches remain separate terminal outcomes", async () => {
  const declinePath = databasePath("agent-decline");
  const tenantPath = databasePath("tenant-decline");
  const tenantCookie = await sessionCookie("tenant");
  const agentCookie = await sessionCookie("agent");

  await createDraft(declinePath, tenantCookie, "create-agent-decline");
  await submitDraft(declinePath, tenantCookie, "submit-agent-decline");
  await startReview(declinePath, agentCookie);
  const preparedDecline = await handlePrepareAgentResponse(
    jsonRequest("http://localhost/api/agent/requests/request-1/preparation", {
      commandId: "prepare-decline",
      fixtureGeneration: 1,
      expectedRequestVersion: 3,
      preparation: {
        kind: "AGENT_DECLINE",
        tenantNote: "The requested viewing window is not available.",
      },
      internalReviewNote: "No suitable slot remains in the current review window.",
    }, agentCookie),
    "request-1",
    dependencies(declinePath),
  );
  assert.equal(preparedDecline.status, 200);
  const declinePreparedBody = await responseBody(preparedDecline);
  assert.equal(declinePreparedBody.request.state, "AGENT_REVIEWING");
  assert.equal(declinePreparedBody.request.version, 4);

  const declined = await handleSendAgentResponse(
    jsonRequest("http://localhost/api/agent/requests/request-1/send", {
      commandId: "send-decline",
      fixtureGeneration: 1,
      expectedRequestVersion: 4,
    }, agentCookie),
    "request-1",
    dependencies(declinePath),
  );
  assert.equal(declined.status, 200);
  const declinedBody = await responseBody(declined);
  assert.equal(declinedBody.request.state, "AGENT_DECLINED");
  assert.equal(declinedBody.request.sentResponse.kind, "AGENT_DECLINE");
  assert.equal(declinedBody.request.sentResponse.tenantNote, "The requested viewing window is not available.");

  const tenantDeclineCookie = tenantCookie;
  await createDraft(tenantPath, tenantDeclineCookie, "create-tenant-decline");
  await submitDraft(tenantPath, tenantDeclineCookie, "submit-tenant-decline");
  await startReview(tenantPath, agentCookie);
  await prepareProposal(tenantPath, agentCookie);
  await sendProposal(tenantPath, agentCookie);
  const tenantDeclined = await handleDeclineTenantRequest(
    jsonRequest("http://localhost/api/tenant/request/decline", {
      commandId: "tenant-decline",
      fixtureGeneration: 1,
      expectedRequestVersion: 5,
    }, tenantDeclineCookie),
    dependencies(tenantPath),
  );
  assert.equal(tenantDeclined.status, 200);
  const tenantDeclinedBody = await responseBody(tenantDeclined);
  assert.equal(tenantDeclinedBody.request.state, "TENANT_DECLINED");
  assert.equal(tenantDeclinedBody.result.state, "TENANT_DECLINED");

  const tenantDeclineApplication = new WorkflowApplication({
    databasePath: tenantPath,
    initialTimestamp: NOW,
  });
  try {
    assert.equal(tenantDeclineApplication.readState().slots[0]?.status, "AVAILABLE");
  } finally {
    tenantDeclineApplication.close();
  }
});

test("strict bodies, server-derived send kind, and version/generation conflicts are visible", async () => {
  const path = databasePath("validation-conflicts");
  const tenantCookie = await sessionCookie("tenant");
  const agentCookie = await sessionCookie("agent");

  const extraCreate = await handleCreateTenantRequest(
    jsonRequest("http://localhost/api/tenant/request", {
      commandId: "extra-create",
      fixtureGeneration: 1,
      listingId: "listing-primary",
      expectedListingVersion: 1,
      preferredTimes: [FIRST_TIME],
      actorId: "tenant-demo",
    }, tenantCookie),
    dependencies(path),
  );
  assert.equal(extraCreate.status, 400);

  const draft = await createDraft(path, tenantCookie, "create-stable");
  assert.equal(draft.request.version, 1);

  const retry = await createDraft(path, tenantCookie, "create-stable");
  assert.equal(retry.result.idempotent, true);
  assert.equal(retry.request.version, 1);

  const conflictingRetry = await handleCreateTenantRequest(
    jsonRequest("http://localhost/api/tenant/request", {
      commandId: "create-stable",
      fixtureGeneration: 1,
      listingId: "listing-north",
      expectedListingVersion: 1,
      preferredTimes: [FIRST_TIME],
    }, tenantCookie),
    dependencies(path),
  );
  assert.equal(conflictingRetry.status, 409);
  assert.deepEqual(await responseBody(conflictingRetry), {
    error: {
      code: "COMMAND_CONFLICT",
      message: "Command identifier conflicts with a completed command",
    },
  });

  const staleUpdate = await handleUpdateTenantRequest(
    jsonRequest("http://localhost/api/tenant/request", {
      commandId: "stale-update",
      fixtureGeneration: 1,
      expectedRequestVersion: 0,
      expectedListingVersion: 1,
      preferredTimes: [FIRST_TIME],
    }, tenantCookie, "PATCH"),
    dependencies(path),
  );
  assert.equal(staleUpdate.status, 409);
  assert.equal((await responseBody(staleUpdate)).error.code, "STALE_VERSION");

  const staleGeneration = await handleUpdateTenantRequest(
    jsonRequest("http://localhost/api/tenant/request", {
      commandId: "stale-generation",
      fixtureGeneration: 2,
      expectedRequestVersion: 1,
      expectedListingVersion: 1,
      preferredTimes: [FIRST_TIME],
    }, tenantCookie, "PATCH"),
    dependencies(path),
  );
  assert.equal(staleGeneration.status, 409);
  assert.equal((await responseBody(staleGeneration)).error.code, "FIXTURE_GENERATION_CONFLICT");

  const extraUpdate = await handleUpdateTenantRequest(
    jsonRequest("http://localhost/api/tenant/request", {
      commandId: "extra-update",
      fixtureGeneration: 1,
      expectedRequestVersion: 1,
      expectedListingVersion: 1,
      preferredTimes: [FIRST_TIME],
      listingId: "listing-primary",
    }, tenantCookie, "PATCH"),
    dependencies(path),
  );
  assert.equal(extraUpdate.status, 400);

  const extraSubmit = await handleSubmitTenantRequest(
    jsonRequest("http://localhost/api/tenant/request/submit", {
      commandId: "extra-submit",
      fixtureGeneration: 1,
      expectedRequestVersion: 1,
      expectedListingVersion: 1,
      state: "REQUEST_SUBMITTED",
    }, tenantCookie),
    dependencies(path),
  );
  assert.equal(extraSubmit.status, 400);

  const submitted = await submitDraft(path, tenantCookie, "submit-stable");
  assert.equal(submitted.request.version, 2);
  const extraReview = await handleStartAgentReview(
    jsonRequest("http://localhost/api/agent/requests/request-1/review", {
      commandId: "extra-review",
      fixtureGeneration: 1,
      expectedRequestVersion: 2,
      requestId: "request-1",
    }, agentCookie),
    "request-1",
    dependencies(path),
  );
  assert.equal(extraReview.status, 400);

  await startReview(path, agentCookie);
  const extraPreparation = await handlePrepareAgentResponse(
    jsonRequest("http://localhost/api/agent/requests/request-1/preparation", {
      commandId: "extra-preparation",
      fixtureGeneration: 1,
      expectedRequestVersion: 3,
      preparation: {
        kind: "SLOT_PROPOSAL",
        slotId: "slot-primary-1",
      },
      state: "AGENT_REVIEWING",
    }, agentCookie),
    "request-1",
    dependencies(path),
  );
  assert.equal(extraPreparation.status, 400);

  await prepareProposal(path, agentCookie);
  const extraSend = await handleSendAgentResponse(
    jsonRequest("http://localhost/api/agent/requests/request-1/send", {
      commandId: "extra-send",
      fixtureGeneration: 1,
      expectedRequestVersion: 4,
      kind: "SLOT_PROPOSAL",
      state: "SLOT_PROPOSED",
    }, agentCookie),
    "request-1",
    dependencies(path),
  );
  assert.equal(extraSend.status, 400);

  const wrongPath = await handleReadAgentRequest(
    request("http://localhost/api/agent/requests/request-unknown", agentCookie),
    "request-unknown",
    dependencies(path),
  );
  assert.equal(wrongPath.status, 404);

  const unsupported = await handlePrepareAgentResponse(
    jsonRequest("http://localhost/api/agent/requests/request-1/preparation", {
      commandId: "unsupported-kind",
      fixtureGeneration: 1,
      expectedRequestVersion: 4,
      preparation: { kind: "AGENT_DECLINE", slotId: "slot-primary-1" },
    }, agentCookie),
    "request-1",
    dependencies(path),
  );
  assert.equal(unsupported.status, 400);
});

test("reads evaluate expiry, preserve no-mutation behavior otherwise, and map persistence failures", async () => {
  const path = databasePath("expiry");
  const tenantCookie = await sessionCookie("tenant");
  const agentCookie = await sessionCookie("agent");

  await createDraft(path, tenantCookie, "create-expiry");
  await submitDraft(path, tenantCookie, "submit-expiry");
  await startReview(path, agentCookie);
  await prepareProposal(path, agentCookie);
  await sendProposal(path, agentCookie);

  const beforeRead = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  const beforeState = beforeRead.readState();
  beforeRead.close();
  assert.equal(beforeState.request?.state, "SLOT_PROPOSED");

  const tenantRead = await responseBody(await handleReadTenantRequest(
    request("http://localhost/api/tenant/request", tenantCookie),
    dependencies(path),
  ));
  assert.equal(tenantRead.request.state, "SLOT_PROPOSED");

  const agentRead = await responseBody(await handleReadAgentRequest(
    request("http://localhost/api/agent/requests/request-1", agentCookie),
    "request-1",
    dependencies(path),
  ));
  assert.equal(agentRead.request.state, "SLOT_PROPOSED");

  const afterNormalReads = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  try {
    assert.equal(afterNormalReads.readState().request?.version, beforeState.request?.version);
    assert.equal(afterNormalReads.readState().audit.length, beforeState.audit.length);
  } finally {
    afterNormalReads.close();
  }

  const expiredRead = await handleReadTenantRequest(
    request("http://localhost/api/tenant/request", tenantCookie),
    dependencies(path, EXPIRED),
  );
  assert.equal(expiredRead.status, 200);
  const expiredBody = await responseBody(expiredRead);
  assert.equal(expiredBody.request.state, "EXPIRED");
  assert.equal(expiredBody.request.version, 6);
  assert.equal(expiredBody.timeline.at(-1).operation, "EXPIRE_PROPOSAL");

  const unavailable = handleReadTenantRequest(
    request("http://localhost/api/tenant/request", tenantCookie),
    {
      now: () => NOW,
      createApplication: () => {
        throw new WorkflowPersistenceError();
      },
    },
  );
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await responseBody(unavailable), {
    error: { code: "PERSISTENCE_ERROR", message: "Workflow service is unavailable" },
  });

  const unavailableCommand = await handleCreateTenantRequest(
    jsonRequest("http://localhost/api/tenant/request", {
      commandId: "persistence-create",
      fixtureGeneration: 1,
      listingId: "listing-primary",
      expectedListingVersion: 1,
      preferredTimes: [FIRST_TIME],
    }, tenantCookie),
    {
      now: () => NOW,
      createApplication: () => {
        throw new WorkflowPersistenceError();
      },
    },
  );
  assert.equal(unavailableCommand.status, 503);
  assert.equal((await responseBody(unavailableCommand)).error.code, "PERSISTENCE_ERROR");
});

test("unknown or invalid resources map to bounded errors without false success", async () => {
  const path = databasePath("errors");
  const tenantCookie = await sessionCookie("tenant");
  const agentCookie = await sessionCookie("agent");

  const invalidListing = await handleCreateTenantRequest(
    jsonRequest("http://localhost/api/tenant/request", {
      commandId: "missing-listing",
      fixtureGeneration: 1,
      listingId: "listing-missing",
      expectedListingVersion: 1,
      preferredTimes: [FIRST_TIME],
    }, tenantCookie),
    dependencies(path),
  );
  assert.equal(invalidListing.status, 404);
  assert.equal((await responseBody(invalidListing)).error.code, "NOT_FOUND");

  const invalidPreference = await handleCreateTenantRequest(
    jsonRequest("http://localhost/api/tenant/request", {
      commandId: "invalid-preference",
      fixtureGeneration: 1,
      listingId: "listing-primary",
      expectedListingVersion: 1,
      preferredTimes: [SECOND_TIME, FIRST_TIME],
    }, tenantCookie),
    dependencies(path),
  );
  assert.equal(invalidPreference.status, 400);
  assert.equal((await responseBody(invalidPreference)).error.code, "VALIDATION_FAILED");

  const invalidPath = await handleReadAgentRequest(
    request("http://localhost/api/agent/requests/request%20bad", agentCookie),
    "request bad",
    dependencies(path),
  );
  assert.equal(invalidPath.status, 400);

  const unauthenticatedCommand = await handleSubmitTenantRequest(
    jsonRequest("http://localhost/api/tenant/request/submit", {
      commandId: "unauthenticated",
      fixtureGeneration: 1,
      expectedRequestVersion: 1,
      expectedListingVersion: 1,
    }),
    dependencies(path),
  );
  assert.equal(unauthenticatedCommand.status, 401);

  const wrongRoleCommand = await handleStartAgentReview(
    jsonRequest("http://localhost/api/agent/requests/request-1/review", {
      commandId: "wrong-role",
      fixtureGeneration: 1,
      expectedRequestVersion: 1,
    }, tenantCookie),
    "request-1",
    dependencies(path),
  );
  assert.equal(wrongRoleCommand.status, 403);

  const validCookie = await sessionCookie("tenant");
  const logout = deleteSession();
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/);
  assert.equal(TENANT_COOKIE_NAME, "rightspot_demo_session");
  assert.equal(validCookie.startsWith(`${TENANT_COOKIE_NAME}=`), true);
});
