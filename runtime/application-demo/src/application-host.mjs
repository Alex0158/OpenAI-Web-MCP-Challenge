import { randomBytes, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";

import {
  AGENT_ACTIVATION_RESULT_TYPE,
  validateAgentActivation,
} from "../../../reentry-core/src/agent-adapter.mjs";
import { PROTOCOL_VERSION } from "../../../reentry-core/src/protocol.mjs";
import {
  HOST_EFFECT_ATTESTATION_TYPE,
  HOST_EFFECT_OUTCOME,
} from "../../../reentry-core/src/receiver-delivery.mjs";
import { applicationFailure } from "./application-store.mjs";

const APPLICATION_ID = "application_demo_001";
const MAX_BODY_BYTES = 16 * 1_024;
const ASSET_SOURCES = Object.freeze({
  "/assets/applicant.mjs": await readFile(new URL("./browser/applicant.mjs", import.meta.url), "utf8"),
  "/assets/reviewer.mjs": await readFile(new URL("./browser/reviewer.mjs", import.meta.url), "utf8"),
  "/assets/styles.css": await readFile(new URL("./browser/styles.css", import.meta.url), "utf8"),
  "/assets/reentry-client.mjs": await readFile(new URL("../../host-sdk/src/client.mjs", import.meta.url), "utf8"),
});

export function createApplicationHost(options) {
  requireOptions(options);
  const store = options.store;
  const clock = options.clock ?? (() => new Date());
  const emit = options.emit ?? (() => {});
  const applicantControlToken = randomBytes(32).toString("base64url");
  const reviewerControlToken = randomBytes(32).toString("base64url");
  const acceptControlToken = randomBytes(32).toString("base64url");
  const effectsByToken = new Map();
  const effectTokenByDelivery = new Map();
  let sdk;
  let origin;
  let state = "created";

  const server = createServer((request, response) => {
    void handleRequest(request, response).catch((error) => {
      if (response.writableEnded || response.destroyed) return;
      writeJson(response, error.statusCode ?? 500, {
        error: { code: publicErrorCode(error) },
      });
    });
  });

  const effectAuthority = Object.freeze({
    verifyEffect({ effectToken, expected }) {
      const record = effectsByToken.get(effectToken);
      if (!record || !sameExpectedEffect(record.expected, expected)) {
        throw new Error("Application Host effect is unknown or out of scope");
      }
      return record.attestation;
    },
  });

  return Object.freeze({
    effectAuthority,
    start,
    stop,
    configureSdk,
    createAgentAdapter,
    getEffectToken,
    markDeliveryAcknowledged,
    snapshot: () => store.snapshot(),
  });

  async function start({ host = "127.0.0.1", port = 0 } = {}) {
    if (state !== "created") throw new Error("Application Host can be started exactly once");
    if (host !== "127.0.0.1") throw new TypeError("Application Host is loopback-only");
    if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) throw new TypeError("Application Host port is invalid");
    state = "starting";
    await listen(server, host, port);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Application Host address is unavailable");
    origin = `http://${host}:${address.port}`;
    state = "ready";
    return Object.freeze({
      origin,
      port: address.port,
      applicantUrl: `${origin}/applications/${APPLICATION_ID}`,
      reviewerUrl: `${origin}/review/applications/${APPLICATION_ID}`,
      canonicalUrl: `${origin}/applications/${APPLICATION_ID}`,
    });
  }

  async function stop() {
    if (state === "stopped") return;
    state = "stopping";
    if (server.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
        server.closeIdleConnections?.();
      });
    }
    state = "stopped";
  }

  function configureSdk(value) {
    if (
      sdk !== undefined || !value || typeof value !== "object" ||
      typeof value.createManifest !== "function" ||
      typeof value.createConsentSession !== "function" ||
      typeof value.decideConsent !== "function" ||
      typeof value.sendEvent !== "function"
    ) {
      throw new TypeError("Application Host SDK is invalid or already configured");
    }
    sdk = value;
  }

  function createAgentAdapter() {
    return Object.freeze({
      async activate(rawActivation) {
        const activation = validateAgentActivation(rawActivation);
        if (activation.protocol_version !== PROTOCOL_VERSION) {
          throw new TypeError("Application Host adapter supports protocol 0.1 only");
        }
        await applyContinuation(activation);
        return {
          type: AGENT_ACTIVATION_RESULT_TYPE,
          protocol_version: PROTOCOL_VERSION,
          delivery_id: activation.delivery_id,
          event_id: activation.event_id,
          attempt: activation.attempt,
          outcome: "accepted",
          code: "activation_dispatch_accepted",
          unavailable_capability: null,
        };
      },
    });
  }

  async function applyContinuation(activation) {
    if (effectTokenByDelivery.has(activation.delivery_id)) return;
    const current = await store.snapshot();
    if (
      current.status !== "APPROVED" ||
      current.workflow_id !== activation.continuation.workflow_id ||
      current.state_version !== activation.continuation.state_version ||
      activation.continuation.event_type !== "application.approved" ||
      activation.continuation.canonical_url !== `${origin}/applications/${APPLICATION_ID}` ||
      current.reentry.event.event_id !== activation.event_id
    ) {
      throw new Error("Application continuation does not match current Host state");
    }

    await store.prepareNextStage({
      content: buildNextStagePlan(current),
      expected_state_version: current.state_version,
      expected_revision: current.artifact.revision,
      delivery_id: activation.delivery_id,
    });

    const effectToken = randomBytes(32).toString("base64url");
    const expected = Object.freeze({
      delivery_id: activation.delivery_id,
      event_id: activation.event_id,
      correlation_id: activation.continuation.correlation_id,
      workflow_id: activation.continuation.workflow_id,
      canonical_url: activation.continuation.canonical_url,
      human_boundary: activation.receipt.human_boundary,
      outcome: HOST_EFFECT_OUTCOME,
    });
    const attestation = Object.freeze({
      type: HOST_EFFECT_ATTESTATION_TYPE,
      protocol_version: "0.1",
      effect_id: `effect_${randomBytes(16).toString("hex")}`,
      delivery_id: activation.delivery_id,
      event_id: activation.event_id,
      correlation_id: activation.continuation.correlation_id,
      workflow_id: activation.continuation.workflow_id,
      outcome: HOST_EFFECT_OUTCOME,
      confirmed_at: readTimestamp(clock),
    });
    effectsByToken.set(effectToken, Object.freeze({ expected, attestation }));
    effectTokenByDelivery.set(activation.delivery_id, effectToken);
    emit({ event: "sample_next_stage_prepared", delivery_id: activation.delivery_id });
  }

  function getEffectToken(deliveryId) {
    const token = effectTokenByDelivery.get(deliveryId);
    if (!token) throw new Error("Application Host effect is not ready");
    return token;
  }

  async function markDeliveryAcknowledged({ deliveryId, effectId }) {
    await store.markDeliveryAcknowledged({ delivery_id: deliveryId, effect_id: effectId });
  }

  async function handleRequest(request, response) {
    if (origin !== undefined && request.headers.host !== new URL(origin).host) {
      writeJson(response, 421, { error: { code: "application_host_origin_invalid" } });
      return;
    }
    const applicantPath = `/applications/${APPLICATION_ID}`;
    const reviewerPath = `/review/applications/${APPLICATION_ID}`;
    const apiPath = `/api/applications/${APPLICATION_ID}`;

    if (request.method === "GET" && (request.url === "/" || request.url === applicantPath)) {
      writeHtml(response, renderApplicantPage({ apiPath, reviewerPath, applicantControlToken, acceptControlToken }));
      return;
    }
    if (request.method === "GET" && request.url === reviewerPath) {
      writeHtml(response, renderReviewerPage({ apiPath, applicantPath, reviewerControlToken }));
      return;
    }
    if (request.method === "GET" && Object.hasOwn(ASSET_SOURCES, request.url)) {
      const contentType = request.url.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8";
      writeAsset(response, ASSET_SOURCES[request.url], contentType);
      return;
    }
    if (request.method === "GET" && request.url === "/healthz") {
      writeJson(response, 200, { ok: true, role: "application_demo_host" });
      return;
    }
    if (request.method === "GET" && request.url === apiPath) {
      writeJson(response, 200, toPublicSnapshot(await store.snapshot()));
      return;
    }
    if (request.method === "POST" && request.url === `${apiPath}/reentry/session`) {
      assertEmptyRecord(await readJson(request));
      writeJson(response, 201, await createConsentSession());
      return;
    }
    if (request.method === "POST" && request.url === `${apiPath}/reentry/decision`) {
      writeJson(response, 200, await decideConsent(await readJson(request)));
      return;
    }
    if (request.method === "POST" && request.url === `${apiPath}/draft`) {
      writeJson(response, 200, toPublicSnapshot(await saveDraft(await readJson(request))));
      return;
    }
    if (request.method === "POST" && request.url === `${apiPath}/submit`) {
      writeJson(response, 200, toPublicSnapshot(await submitApplication(await readJson(request))));
      return;
    }
    if (request.method === "POST" && request.url === `${apiPath}/review/approve`) {
      writeJson(response, 200, toPublicSnapshot(await approveAndSendEvent(await readJson(request))));
      return;
    }
    if (request.method === "POST" && request.url === `${apiPath}/plan`) {
      writeJson(response, 200, toPublicSnapshot(await revisePlan(await readJson(request))));
      return;
    }
    if (request.method === "POST" && request.url === `${apiPath}/accept`) {
      writeJson(response, 200, toPublicSnapshot(await acceptNextStage(await readJson(request))));
      return;
    }
    writeJson(response, 404, { error: { code: "application_host_not_found" } });
  }

  async function createConsentSession() {
    requireSdk();
    const current = await store.snapshot();
    if (current.status !== "DRAFT" || current.reentry.binding !== null) {
      throw applicationFailure("application_consent_unavailable", 409);
    }
    const now = readDate(clock);
    const manifest = sdk.createManifest({
      offerExpiresAt: new Date(now.getTime() + 5 * 60_000).toISOString(),
      workflow: {
        id: current.workflow_id,
        type: current.workflow_type,
        stateVersion: current.state_version,
        canonicalUrl: `${origin}/applications/${APPLICATION_ID}`,
      },
      display: {
        title: "Continue this application after review",
        reason: "If a reviewer approves it later, Re-entry may prepare the visible next-stage plan on this page.",
      },
      grantRequest: {
        eventType: "application.approved",
        grantExpiresAt: new Date(now.getTime() + 20 * 60_000).toISOString(),
        humanBoundary: "explicit_receiver_consent",
      },
    });
    const session = await sdk.createConsentSession({ manifest, hostSubjectRef: "sample_applicant_001" });
    emit({ event: "sample_consent_session_created" });
    return {
      challenge_id: session.challenge.challenge_id,
      consent_token: session.consent_token,
      title: session.challenge.display.title,
      reason: session.challenge.display.reason,
      expires_at: session.expires_at,
    };
  }

  async function decideConsent(input) {
    requireSdk();
    requireExactRecord(input, ["challenge_id", "consent_token", "action"], "Consent decision");
    if (!["approve", "decline"].includes(input.action)) throw applicationFailure("application_consent_decision_invalid", 400);
    const decision = await sdk.decideConsent({
      challengeId: input.challenge_id,
      consentToken: input.consent_token,
      hostSubjectRef: "sample_applicant_001",
      action: input.action,
    });
    if (decision.status === "approved") await store.attachBinding(decision.binding);
    emit({ event: "sample_consent_decided", status: decision.status });
    return { status: decision.status, duplicate: decision.duplicate };
  }

  async function saveDraft(input) {
    requireExactRecord(input, ["expected_state_version", "expected_revision", "form"], "Application draft request");
    return store.saveDraft(input);
  }

  async function submitApplication(input) {
    requireExactRecord(input, ["submit_token", "expected_state_version", "expected_revision", "form"], "Application submission request");
    const result = await store.submit({
      control_token_valid: secureEqual(input.submit_token, applicantControlToken),
      expected_state_version: input.expected_state_version,
      expected_revision: input.expected_revision,
      form: input.form,
    });
    emit({ event: "sample_application_submitted" });
    return result;
  }

  async function approveAndSendEvent(input) {
    requireSdk();
    requireExactRecord(input, ["review_token", "expected_state_version", "expected_revision"], "Application review request");
    let current = await store.approve({
      control_token_valid: secureEqual(input.review_token, reviewerControlToken),
      expected_state_version: input.expected_state_version,
      expected_revision: input.expected_revision,
    });
    emit({ event: "sample_application_approved", event_id: current.reentry.event.event_id });
    if (current.reentry.event.status === "SENT") return current;

    try {
      const acceptance = await sdk.sendEvent({
        binding: current.reentry.binding,
        workflow: {
          id: current.workflow_id,
          stateVersion: current.state_version,
          canonicalUrl: `${origin}/applications/${APPLICATION_ID}`,
        },
        eventId: current.reentry.event.event_id,
        occurredAt: current.reentry.event.occurred_at,
      });
      current = await store.markEventSent({
        event_id: current.reentry.event.event_id,
        receiver_event_id: acceptance.event_id,
      });
      emit({ event: "sample_event_accepted", event_id: acceptance.event_id });
      return current;
    } catch (error) {
      await store.markEventFailure({
        event_id: current.reentry.event.event_id,
        code: typeof error?.code === "string" ? error.code : "application_event_send_failed",
      });
      throw applicationFailure("application_reentry_event_failed", 502);
    }
  }

  async function revisePlan(input) {
    requireExactRecord(input, ["content", "expected_state_version", "expected_revision"], "Plan revision request");
    return store.reviseNextStagePlan(input);
  }

  async function acceptNextStage(input) {
    requireExactRecord(input, ["accept_token", "expected_state_version", "expected_revision"], "Next-stage acceptance request");
    const result = await store.acceptNextStage({
      control_token_valid: secureEqual(input.accept_token, acceptControlToken),
      expected_state_version: input.expected_state_version,
      expected_revision: input.expected_revision,
    });
    emit({ event: "sample_next_stage_accepted_by_human" });
    return result;
  }

  function requireSdk() {
    if (sdk === undefined) throw applicationFailure("application_reentry_not_configured", 503);
  }
}

function toPublicSnapshot(state) {
  return {
    workflow_id: state.workflow_id,
    workflow_type: state.workflow_type,
    status: state.status,
    state_version: state.state_version,
    submitted_at: state.submitted_at,
    reviewed_at: state.reviewed_at,
    accepted_at: state.accepted_at,
    artifact: {
      revision: state.artifact.revision,
      form: { ...state.artifact.form },
      next_stage_plan: state.artifact.next_stage_plan,
    },
    reentry: {
      connected: state.reentry.binding !== null,
      consent_status: state.reentry.consent_status,
      event_status: state.reentry.event.status,
      event_error: state.reentry.event.last_error_code,
      delivery_status: state.reentry.delivery.status,
    },
    human_boundary: { accepted: state.human_boundary.accepted },
  };
}

function buildNextStagePlan(state) {
  const project = state.artifact.form.project_name;
  return [
    `Next-stage plan for ${project}`,
    "",
    "1. Review the approval notes and confirm the project contact details.",
    "2. Prepare the kickoff materials using the submitted application as the source.",
    "3. Ask the applicant to review and explicitly accept this plan.",
    "",
    "Re-entry prepared this draft. Final acceptance still belongs to the applicant.",
  ].join("\n");
}

function renderApplicantPage({ apiPath, reviewerPath, applicantControlToken, acceptControlToken }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Launchpad application</title>
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
  <header class="site-header"><a class="brand" href="/"><span class="brand-mark">LP</span><span>Launchpad</span></a><a class="header-link" href="${reviewerPath}">Reviewer view →</a></header>
  <main class="page" id="application-root" data-api-path="${apiPath}" data-submit-token="${applicantControlToken}" data-accept-token="${acceptControlToken}">
    <section class="hero"><div><p class="eyebrow">Sample Host / Application workflow</p><h1>Submit once. Continue when the decision arrives.</h1><p class="hero-copy">This small website shows how a Host uses the Re-entry SDK: you approve one future continuation, submit an application, and return after a reviewer approves it.</p></div><span class="status-chip" id="state-label">Loading</span></section>
    <div class="layout">
      <div class="stack">
        <section class="card"><h2>Your application</h2><p class="card-intro">Enable Re-entry first, then submit the form. The form data stays in this Host; Re-entry receives only the signed workflow event.</p>
          <form id="application-form"><div class="fields">
            <label>Full name<input name="full_name" autocomplete="name" maxlength="120" required placeholder="Alex Morgan"></label>
            <label>Email<input name="email" type="email" autocomplete="email" maxlength="254" required placeholder="alex@example.com"></label>
            <label class="full">Project name<input name="project_name" maxlength="120" required placeholder="Community solar pilot"></label>
            <label class="full">Short summary<textarea name="summary" maxlength="1500" minlength="10" required placeholder="What are you applying for, and why now?"></textarea></label>
          </div><div class="actions"><button class="button button-secondary" id="enable-reentry" type="button">Enable Re-entry</button><button class="button" type="submit" disabled>Submit application</button></div></form>
          <p class="webmcp" id="webmcp-label">Checking WebMCP support…</p><p class="message" id="message" role="status" hidden></p>
        </section>
        <section class="card"><h2>Next-stage plan</h2><p class="card-intro">Reviewer approval triggers the continuation. The local evidence Agent prepares this draft and stops here.</p><pre class="plan" id="next-stage-plan">Loading…</pre><div class="actions"><button class="button button-human" id="accept-next-stage" type="button" hidden disabled>Accept next stage</button></div><p class="boundary-note">Human boundary: acceptance is a normal page button and is never registered as a Site Tool.</p></section>
      </div>
      <aside class="stack">
        <section class="card"><h2>Workflow</h2><div class="timeline">
          <div class="step" data-stage="DRAFT"><span class="step-dot">1</span><div><strong>Draft</strong><span>Connect and complete the form.</span></div></div>
          <div class="step" data-stage="SUBMITTED"><span class="step-dot">2</span><div><strong>Submitted</strong><span>Waiting for a reviewer.</span></div></div>
          <div class="step" data-stage="APPROVED"><span class="step-dot">3</span><div><strong>Approved</strong><span>The Host emits the signed event.</span></div></div>
          <div class="step" data-stage="NEXT_STAGE_READY"><span class="step-dot">4</span><div><strong>Continued</strong><span>Re-entry prepares the next stage.</span></div></div>
          <div class="step" data-stage="ACCEPTED"><span class="step-dot">5</span><div><strong>Accepted</strong><span>The applicant makes the final choice.</span></div></div>
        </div></section>
        <section class="card"><h2>Re-entry connection</h2><div class="facts"><div class="fact"><span>Grant</span><strong id="connection-label">Loading</strong></div><div class="fact"><span>Delivery</span><strong id="delivery-label">Loading</strong></div></div><p class="boundary-note">The bundled Connector is auto-paired only for this local demo. The Agent Adapter is deterministic evidence, not real Codex activation.</p></section>
      </aside>
    </div>
  </main>
  <script type="module" src="/assets/applicant.mjs"></script>
</body>
</html>`;
}

function renderReviewerPage({ apiPath, applicantPath, reviewerControlToken }) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Launchpad review</title><link rel="stylesheet" href="/assets/styles.css"></head>
<body>
  <header class="site-header"><a class="brand" href="${applicantPath}"><span class="brand-mark">LP</span><span>Launchpad</span></a><a class="header-link" href="${applicantPath}">← Applicant view</a></header>
  <main class="page" id="review-root" data-api-path="${apiPath}" data-review-token="${reviewerControlToken}">
    <section class="hero"><div><p class="eyebrow">Human reviewer</p><h1>Review the application.</h1><p class="hero-copy">Approval is Host business truth. Only after it is committed does the Host SDK send the signed Re-entry event.</p></div><span class="status-chip" id="review-state">Loading</span></section>
    <div class="layout"><section class="card"><h2>Submitted application</h2><div class="review-grid">
      <div class="review-field"><span>Applicant</span><strong id="applicant-name">—</strong></div><div class="review-field"><span>Email</span><strong id="applicant-email">—</strong></div>
      <div class="review-field full"><span>Project</span><strong id="project-name">—</strong></div><div class="review-field full"><span>Summary</span><p id="project-summary">—</p></div>
    </div><div class="warning">Approving moves the Host to APPROVED and triggers one signed <code>application.approved</code> event. It does not accept the applicant's next stage.</div><div class="actions"><button class="button" id="approve-application" type="button" disabled>Approve application</button></div><p class="message" id="review-message" role="status" hidden></p></section>
    <aside class="card"><h2>Protocol status</h2><div class="facts"><div class="fact"><span>Host state</span><strong id="event-state">Loading</strong></div><div class="fact"><span>Connector delivery</span><strong id="delivery-state">Loading</strong></div></div><p class="boundary-note">If Receiver acceptance is uncertain, the retry uses the same persisted event ID and occurrence time.</p></aside></div>
  </main>
  <script type="module" src="/assets/reviewer.mjs"></script>
</body></html>`;
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY_BYTES) throw applicationFailure("application_body_too_large", 413);
    chunks.push(bytes);
  }
  if (size === 0) throw applicationFailure("application_input_invalid", 400);
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw applicationFailure("application_input_invalid", 400);
  }
}

function assertEmptyRecord(value) {
  if (Object.keys(value).length !== 0) throw applicationFailure("application_input_invalid", 400);
}

function requireExactRecord(value, fields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join(",") !== [...fields].sort().join(",")) {
    throw applicationFailure("application_input_invalid", 400, `${label} fields are invalid`);
  }
}

function requireOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options) || !options.store || typeof options.store.snapshot !== "function") {
    throw new TypeError("Application Host options are invalid");
  }
  if (options.clock !== undefined && typeof options.clock !== "function") throw new TypeError("Application Host clock is invalid");
  if (options.emit !== undefined && typeof options.emit !== "function") throw new TypeError("Application Host emit is invalid");
}

function sameExpectedEffect(left, right) {
  return left && right && [
    "delivery_id", "event_id", "correlation_id", "workflow_id", "canonical_url", "human_boundary", "outcome",
  ].every((field) => left[field] === right[field]);
}

function secureEqual(value, expected) {
  if (typeof value !== "string") return false;
  const left = Buffer.from(value, "utf8");
  const right = Buffer.from(expected, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

function readDate(clock) {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new TypeError("Application Host clock must return a valid Date");
  return new Date(value.getTime());
}

function readTimestamp(clock) {
  return readDate(clock).toISOString();
}

function publicErrorCode(error) {
  return typeof error?.code === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(error.code)
    ? error.code
    : "application_host_internal_error";
}

function writeHtml(response, body) {
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Security-Policy": "default-src 'none'; connect-src 'self'; script-src 'self'; style-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    "Content-Type": "text/html; charset=utf-8",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  });
  response.end(body);
}

function writeAsset(response, body, contentType) {
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": contentType,
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(body);
}

function writeJson(response, statusCode, value) {
  const body = JSON.stringify(value);
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json; charset=utf-8",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(body);
}

function listen(server, host, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}
