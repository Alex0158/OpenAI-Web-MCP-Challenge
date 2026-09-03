import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createApplicationHost } from "../src/application-host.mjs";
import { openApplicationStore } from "../src/application-store.mjs";
import { startApplicationDemo } from "../src/application-system.mjs";

const FORM = Object.freeze({
  full_name: "Sam Rivera",
  email: "sam@example.com",
  project_name: "Community solar pilot",
  summary: "A practical pilot that helps one neighborhood share locally generated solar energy.",
});

test("real sample crosses consent, human review, Re-entry delivery, Host effect, and acknowledgement", async (t) => {
  const stateDirectory = await mkdtemp(join(tmpdir(), "webmcp-application-demo-test-"));
  t.after(() => rm(stateDirectory, { recursive: true, force: true }));
  const events = [];
  const system = await startApplicationDemo({
    stateDirectory,
    connectorPollIntervalMs: 25,
    emit(value) { events.push(value); },
  });
  t.after(() => system.stop());

  const applicantPage = await getText(system.applicantUrl);
  const reviewerPage = await getText(system.reviewerUrl);
  const applicantScript = await getText(new URL("/assets/applicant.mjs", system.applicantUrl));
  const sdkClient = await getText(new URL("/assets/reentry-client.mjs", system.applicantUrl));
  assert.match(applicantPage, /Submit once\. Continue when the decision arrives\./);
  assert.match(reviewerPage, /Human reviewer/);
  assert.match(sdkClient, /export function createContinuationPrompt/);
  assert.match(applicantScript, /name: "prepare_application_draft"/);
  assert.match(applicantScript, /name: "revise_next_stage_plan"/);
  assert.doesNotMatch(applicantScript, /name: "(?:submit|approve|accept)[^"]*"/);

  const submitToken = readDataToken(applicantPage, "submit-token");
  const acceptToken = readDataToken(applicantPage, "accept-token");
  const reviewToken = readDataToken(reviewerPage, "review-token");
  const apiUrl = new URL("/api/applications/application_demo_001", system.applicantUrl);

  let current = await getJson(apiUrl);
  assert.equal(current.status, "DRAFT");
  assert.equal(current.reentry.connected, false);

  const prematureReview = await postJson(`${apiUrl}/review/approve`, {
    review_token: reviewToken,
    expected_state_version: current.state_version,
    expected_revision: current.artifact.revision,
  }, [409]);
  assert.equal(prematureReview.error.code, "application_approval_unavailable");

  const blindSubmission = await postJson(`${apiUrl}/submit`, {
    submit_token: "wrong",
    expected_state_version: current.state_version,
    expected_revision: current.artifact.revision,
    form: FORM,
  }, [403]);
  assert.equal(blindSubmission.error.code, "application_human_control_invalid");

  const session = await postJson(`${apiUrl}/reentry/session`, {}, [201]);
  assert.match(session.consent_token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(session.title, "Continue this application after review");
  const decision = await postJson(`${apiUrl}/reentry/decision`, {
    challenge_id: session.challenge_id,
    consent_token: session.consent_token,
    action: "approve",
  });
  assert.equal(decision.status, "approved");

  current = await getJson(apiUrl);
  assert.equal(current.reentry.connected, true);
  const staleSubmission = await postJson(`${apiUrl}/submit`, {
    submit_token: submitToken,
    expected_state_version: current.state_version + 1,
    expected_revision: current.artifact.revision,
    form: FORM,
  }, [409]);
  assert.equal(staleSubmission.error.code, "application_revision_conflict");

  current = await postJson(`${apiUrl}/submit`, {
    submit_token: submitToken,
    expected_state_version: current.state_version,
    expected_revision: current.artifact.revision,
    form: FORM,
  });
  assert.equal(current.status, "SUBMITTED");

  current = await postJson(`${apiUrl}/review/approve`, {
    review_token: reviewToken,
    expected_state_version: current.state_version,
    expected_revision: current.artifact.revision,
  });
  assert.ok(["APPROVED", "NEXT_STAGE_READY"].includes(current.status));

  current = await waitFor(async () => {
    const value = await getJson(apiUrl);
    return value.reentry.delivery_status === "ACKNOWLEDGED" ? value : null;
  });
  assert.equal(current.status, "NEXT_STAGE_READY");
  assert.equal(current.reentry.event_status, "SENT");
  assert.equal(current.human_boundary.accepted, false);
  assert.match(current.artifact.next_stage_plan, /Community solar pilot/);

  const blindAcceptance = await postJson(`${apiUrl}/accept`, {
    accept_token: "wrong",
    expected_state_version: current.state_version,
    expected_revision: current.artifact.revision,
  }, [403]);
  assert.equal(blindAcceptance.error.code, "application_human_control_invalid");

  const accepted = await postJson(`${apiUrl}/accept`, {
    accept_token: acceptToken,
    expected_state_version: current.state_version,
    expected_revision: current.artifact.revision,
  });
  assert.equal(accepted.status, "ACCEPTED");
  assert.equal(accepted.human_boundary.accepted, true);
  assert.equal(system.getConnectorFailure(), null);

  const eventNames = events.map((value) => value.event);
  for (const name of [
    "sample_host_started",
    "sample_reentry_started",
    "sample_host_sdk_connected",
    "sample_connector_auto_paired",
    "sample_consent_decided",
    "sample_application_submitted",
    "sample_application_approved",
    "sample_event_accepted",
    "sample_agent_activation_accepted",
    "sample_next_stage_prepared",
    "sample_delivery_acknowledged",
  ]) assert.ok(eventNames.includes(name), `missing ${name}`);

  const applicationState = await readFile(join(stateDirectory, "application.json"), "utf8");
  assert.match(applicationState, /"status": "ACCEPTED"/);
  for (const secret of [session.consent_token, submitToken, acceptToken, reviewToken]) {
    assert.equal(applicationState.includes(secret), false);
  }
  for (const filename of ["receiver.sqlite", "pairing.sqlite"]) {
    const bytes = await readFile(join(stateDirectory, filename));
    for (const privateValue of Object.values(FORM)) assert.equal(bytes.includes(Buffer.from(privateValue)), false);
  }
});

test("review retry preserves the Host event identity after an uncertain send", async (t) => {
  const stateDirectory = await mkdtemp(join(tmpdir(), "webmcp-application-retry-test-"));
  t.after(() => rm(stateDirectory, { recursive: true, force: true }));
  const store = await openApplicationStore({ filename: join(stateDirectory, "application.json") });
  await store.attachBinding({
    binding_id: "binding_retry_001",
    correlation_id: "correlation_retry_001",
    workflow_id: "application_demo_001",
    event_type: "application.approved",
    status: "active",
    runs_remaining: 1,
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  });
  const attempts = [];
  const host = createApplicationHost({ store });
  const address = await host.start();
  t.after(() => host.stop());
  host.configureSdk({
    createManifest() { throw new Error("not used"); },
    createConsentSession() { throw new Error("not used"); },
    decideConsent() { throw new Error("not used"); },
    async sendEvent(input) {
      attempts.push(structuredClone(input));
      if (attempts.length === 1) throw Object.assign(new Error("uncertain"), { code: "host_sdk_network_error" });
      return { event_id: input.eventId };
    },
  });

  const applicantPage = await getText(address.applicantUrl);
  const reviewerPage = await getText(address.reviewerUrl);
  const submitToken = readDataToken(applicantPage, "submit-token");
  const reviewToken = readDataToken(reviewerPage, "review-token");
  const apiUrl = new URL("/api/applications/application_demo_001", address.origin);
  let current = await getJson(apiUrl);
  current = await postJson(`${apiUrl}/submit`, {
    submit_token: submitToken,
    expected_state_version: current.state_version,
    expected_revision: current.artifact.revision,
    form: FORM,
  });

  const uncertain = await postJson(`${apiUrl}/review/approve`, {
    review_token: reviewToken,
    expected_state_version: current.state_version,
    expected_revision: current.artifact.revision,
  }, [502]);
  assert.equal(uncertain.error.code, "application_reentry_event_failed");
  current = await getJson(apiUrl);
  assert.equal(current.status, "APPROVED");
  assert.equal(current.reentry.event_status, "PENDING");

  const retried = await postJson(`${apiUrl}/review/approve`, {
    review_token: reviewToken,
    expected_state_version: current.state_version,
    expected_revision: current.artifact.revision,
  });
  assert.equal(retried.reentry.event_status, "SENT");
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].eventId, attempts[1].eventId);
  assert.equal(attempts[0].occurredAt, attempts[1].occurredAt);
  assert.equal(attempts[0].workflow.stateVersion, attempts[1].workflow.stateVersion);
});

async function getText(url) {
  const response = await fetch(url, { redirect: "manual" });
  assert.equal(response.status, 200);
  return response.text();
}

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" }, redirect: "manual" });
  assert.equal(response.status, 200);
  return response.json();
}

async function postJson(url, body, acceptedStatuses = [200]) {
  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    redirect: "manual",
  });
  const value = await response.json();
  assert.ok(acceptedStatuses.includes(response.status), `${response.status}: ${JSON.stringify(value)}`);
  return value;
}

function readDataToken(source, name) {
  const match = source.match(new RegExp(`data-${name}="([A-Za-z0-9_-]{43})"`));
  assert.ok(match, `missing ${name}`);
  return match[1];
}

async function waitFor(operation, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await operation();
    if (result !== null && result !== undefined) return result;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("Timed out waiting for application demo state");
}
