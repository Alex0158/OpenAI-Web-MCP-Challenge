import test from "node:test";
import assert from "node:assert/strict";
import { createHttpServer, createRuntime } from "../src/server.mjs";

test("HTTP enrollment exposes no raw context injection or public trace path", async () => {
  const correlationId = "corr_http_trust_boundary";
  const receiverClientToken = "test-receiver-client-token";
  const runtime = createRuntime({
    databasePath: ":memory:",
    tracePath: null,
    origin: "http://127.0.0.1:0",
    receiverClientToken,
  });
  const server = createHttpServer(runtime);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const correlationHeaders = { "X-Correlation-Id": correlationId };

  try {
    const manifest = await request(baseUrl, "/api/workflows/WF-001/reentry-offer", {
      headers: correlationHeaders,
    });

    const unauthenticatedCapture = await requestRaw(baseUrl, "/api/receiver/context-captures", {
      method: "POST",
      headers: correlationHeaders,
    });
    assert.equal(unauthenticatedCapture.status, 403);
    assert.equal(runtime.database.prepare(
      "SELECT count(*) AS count FROM context_captures",
    ).get().count, 0);

    const capture = await request(baseUrl, "/api/receiver/context-captures", {
      method: "POST",
      headers: {
        ...correlationHeaders,
        "X-Receiver-Client-Token": receiverClientToken,
      },
    });
    assert.equal("managed_context_id" in capture, false);
    const privateCapture = runtime.database.prepare(`
      SELECT managed_context_id FROM context_captures WHERE correlation_id = ?
    `).get(correlationId);

    const injectedIdentity = await requestRaw(baseUrl, "/api/receiver/enroll", {
      method: "POST",
      headers: correlationHeaders,
      body: {
        manifest,
        capture_handle: capture.capture_handle,
        managed_context_id: "caller-selected-context",
      },
    });
    assert.equal(injectedIdentity.status, 400);
    assert.equal(runtime.database.prepare(
      "SELECT count(*) AS count FROM binding_challenges",
    ).get().count, 0);

    const enrollment = await request(baseUrl, "/api/receiver/enroll", {
      method: "POST",
      headers: correlationHeaders,
      body: { manifest, capture_handle: capture.capture_handle },
    });
    const missingHumanAction = await requestRaw(
      baseUrl,
      `/api/receiver/consent/${enrollment.challenge_id}/approve`,
      { method: "POST", headers: correlationHeaders },
    );
    assert.equal(missingHumanAction.status, 403);

    const approval = await request(
      baseUrl,
      `/api/receiver/consent/${enrollment.challenge_id}/approve`,
      {
        method: "POST",
        headers: {
          ...correlationHeaders,
          "X-Receiver-Human-Action": "true",
        },
      },
    );
    assert.equal(JSON.stringify(approval).includes(privateCapture.managed_context_id), false);

    const rawContextRoute = await requestRaw(baseUrl, "/api/test/contexts", {
      method: "POST",
      body: { managed_context_id: "forbidden" },
    });
    assert.equal(rawContextRoute.status, 404);
    const publicTraceRoute = await requestRaw(baseUrl, "/api/evidence/trace");
    assert.equal(publicTraceRoute.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    runtime.database.close();
  }
});

async function request(baseUrl, path, options = {}) {
  const response = await requestRaw(baseUrl, path, options);
  const value = await response.json();
  if (!response.ok) throw new Error(value.error ?? `Request failed with ${response.status}`);
  return value;
}

function requestRaw(baseUrl, path, { method = "GET", body, headers = {} } = {}) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
