import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { POST as createSession } from "../../app/api/session/route";
import { WorkflowApplication } from "../../src/server/application/workflow";
import {
  handleCreateTenantRequest,
  handleReadAgentQueue,
  handleReadAgentRequest,
  handleReadTenantRequest,
  handleSubmitTenantRequest,
  type WorkflowHttpDependencies,
} from "../../src/server/application/workflow-http";

const NOW = "2026-09-01T09:00:00.000Z";
const FIRST_TIME = "2026-09-03T10:00:00.000Z";
const TEST_DIRECTORY = join(process.cwd(), "var/test");
let databaseSequence = 0;

mkdirSync(TEST_DIRECTORY, { recursive: true });

function databasePath(label: string): string {
  databaseSequence += 1;
  return join(TEST_DIRECTORY, `agent-draft-visibility-${process.pid}-${databaseSequence}-${label}.sqlite`);
}

function dependencies(path: string): WorkflowHttpDependencies {
  return {
    createApplication: () => new WorkflowApplication({ databasePath: path, initialTimestamp: NOW }),
    now: () => NOW,
  };
}

function jsonRequest(url: string, body: unknown, cookie: string, method = "POST"): Request {
  return new Request(url, {
    method,
    headers: {
      cookie,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function request(url: string, cookie: string): Request {
  return new Request(url, { headers: { cookie } });
}

async function sessionCookie(role: "tenant" | "agent"): Promise<string> {
  const response = await createSession(jsonRequest("http://localhost/api/session", { role }, ""));
  assert.equal(response.status, 200);
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie);
  const cookie = setCookie.split(";", 1)[0];
  assert.ok(cookie);
  return cookie;
}

async function responseBody(response: Response): Promise<Record<string, unknown>> {
  return await response.json() as Record<string, unknown>;
}

async function createDraft(path: string, tenantCookie: string): Promise<Record<string, unknown>> {
  const response = await handleCreateTenantRequest(
    jsonRequest("http://localhost/api/tenant/request", {
      commandId: "draft-visibility-create",
      fixtureGeneration: 1,
      listingId: "listing-primary",
      expectedListingVersion: 1,
      preferredTimes: [FIRST_TIME],
    }, tenantCookie),
    dependencies(path),
  );
  assert.equal(response.status, 200);
  return responseBody(response);
}

test("a tenant draft remains private from the agent queue and direct detail", async () => {
  const path = databasePath("draft");
  const tenantCookie = await sessionCookie("tenant");
  const agentCookie = await sessionCookie("agent");
  await createDraft(path, tenantCookie);

  const tenant = await responseBody(await handleReadTenantRequest(
    request("http://localhost/api/tenant/request", tenantCookie),
    dependencies(path),
  ));
  assert.equal((tenant.request as Record<string, unknown>).state, "TENANT_DRAFT");

  const beforeReads = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  const stateBeforeReads = JSON.stringify(beforeReads.readState());
  beforeReads.close();

  const queue = await responseBody(await handleReadAgentQueue(
    request("http://localhost/api/agent/requests", agentCookie),
    dependencies(path),
  ));
  assert.deepEqual(queue.requests, []);
  assert.equal((queue.counts as Record<string, unknown>).TENANT_DRAFT, 0);
  assert.equal((queue.counts as Record<string, unknown>).REQUEST_SUBMITTED, 0);

  const detail = await handleReadAgentRequest(
    request("http://localhost/api/agent/requests/request-1", agentCookie),
    "request-1",
    dependencies(path),
  );
  assert.equal(detail.status, 404);
  assert.deepEqual(await responseBody(detail), {
    error: { code: "NOT_FOUND", message: "Workflow resource was not found" },
  });

  const afterReads = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  try {
    const stateAfterReads = afterReads.readState();
    assert.equal(JSON.stringify(stateAfterReads), stateBeforeReads);
    assert.equal(stateAfterReads.request?.state, "TENANT_DRAFT");
    assert.equal(stateAfterReads.request?.version, 1);
  } finally {
    afterReads.close();
  }
});

test("an explicitly submitted request remains visible to the assigned agent", async () => {
  const path = databasePath("submitted");
  const tenantCookie = await sessionCookie("tenant");
  const agentCookie = await sessionCookie("agent");
  await createDraft(path, tenantCookie);

  const submitted = await handleSubmitTenantRequest(
    jsonRequest("http://localhost/api/tenant/request/submit", {
      commandId: "draft-visibility-submit",
      fixtureGeneration: 1,
      expectedRequestVersion: 1,
      expectedListingVersion: 1,
    }, tenantCookie),
    dependencies(path),
  );
  assert.equal(submitted.status, 200);

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

  const detail = await handleReadAgentRequest(
    request("http://localhost/api/agent/requests/request-1", agentCookie),
    "request-1",
    dependencies(path),
  );
  assert.equal(detail.status, 200);
  const detailBody = await responseBody(detail);
  assert.equal((detailBody.request as Record<string, unknown>).state, "REQUEST_SUBMITTED");
});
