import { createRuntime } from "../src/server.mjs";
import { signEventBody } from "../src/receiver/events.mjs";

export const FIXED_NOW = new Date("2026-08-30T12:00:00.000Z");
export const TEST_ORIGIN = "http://127.0.0.1:4317";

export function testRuntime() {
  return createRuntime({
    databasePath: ":memory:",
    tracePath: null,
    origin: TEST_ORIGIN,
    clock: () => new Date(FIXED_NOW),
  });
}

export async function approvedEnrollment(runtime, correlationId = "corr_test") {
  const manifest = runtime.grants.issueManifest(correlationId);
  const capture = await runtime.grants.captureCurrentContext(correlationId);
  const privateCapture = runtime.database.prepare(`
    SELECT managed_context_id, managed_context_kind
    FROM context_captures WHERE correlation_id = ?
    ORDER BY created_at DESC LIMIT 1
  `).get(correlationId);
  const challenge = runtime.grants.beginEnrollment({
    manifest,
    capture_handle: capture.capture_handle,
  }, correlationId);
  const approval = await runtime.grants.approveChallenge(
    challenge.challenge_id,
    correlationId,
    { humanAction: true },
  );
  runtime.grants.registerHostBinding({
    workflow_id: "WF-001",
    agent_binding: approval.agent_binding,
  }, correlationId);
  return { manifest, capture, privateCapture, challenge, approval };
}

export function transitionAndSignedEnvelope(runtime, correlationId = "corr_test") {
  const transition = runtime.domain.transitionToReady(correlationId);
  const rawBody = JSON.stringify(transition.event);
  const timestamp = String(Math.floor(FIXED_NOW.getTime() / 1000));
  return {
    transition,
    rawBody,
    timestamp,
    signature: signEventBody(rawBody, timestamp),
    correlationId,
  };
}
