import { createHash, createHmac } from "node:crypto";
import { TextDecoder } from "node:util";

import { CONSENT_DECISION_TYPE } from "../../../reentry-core/src/receiver-core.mjs";
import { PROTOCOL_VERSION } from "../../../reentry-core/src/protocol.mjs";

export const ACCOUNT_CONSENT_ROUTES = Object.freeze({
  session: "/v0.1/consent-sessions",
  browserDecision: "/v0.1/account-consent-decisions",
  page: "/consent",
});

const OPTION_FIELDS = Object.freeze([
  "store",
  "connectorControl",
  "accountAuthority",
  "getReceiver",
  "authenticateOrganization",
  "tokenSecret",
  "clock",
  "createId",
  "verificationOrigin",
]);
const REQUIRED_OPTION_FIELDS = Object.freeze(OPTION_FIELDS.filter((field) => field !== "verificationOrigin"));
const SESSION_FIELDS = Object.freeze(["host_subject_ref", "expected_origin", "manifest"]);
const BROWSER_DECISION_FIELDS = Object.freeze(["consent_token", "action", "connector_id"]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const CONTENT_TYPE = /^application\/json(?:\s*;\s*charset=utf-8)?$/i;
const MAX_BODY_BYTES = 24 * 1_024;

export class AccountConsentControlError extends Error {
  constructor(code, statusCode, message) {
    super(message);
    this.name = "AccountConsentControlError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function createAccountConsentControlPlane(options) {
  requireExactRecord(options, OPTION_FIELDS, REQUIRED_OPTION_FIELDS, "Account consent options");
  requireStore(options.store);
  requireConnectorControl(options.connectorControl);
  if (!options.accountAuthority || typeof options.accountAuthority.readAccount !== "function") {
    throw new TypeError("Account consent accountAuthority must implement readAccount");
  }
  const getReceiver = requireFunction(options.getReceiver, "Account consent getReceiver");
  const authenticateOrganization = requireFunction(
    options.authenticateOrganization,
    "Account consent organization authenticator",
  );
  const secret = requireSecret(options.tokenSecret, "Consent token secret");
  const clock = requireFunction(options.clock, "Account consent clock");
  const createId = requireFunction(options.createId, "Account consent createId");
  const verificationOrigin = options.verificationOrigin === undefined
    ? undefined
    : requireOrigin(options.verificationOrigin);

  return Object.freeze({
    handler,
    createConsentSession,
    decideConsent,
    verifyDecision,
    readiness: () => options.store.ready(),
  });

  function createConsentSession(input, organization, request) {
    requireExactRecord(input, SESSION_FIELDS, SESSION_FIELDS, "Consent session input");
    const hostSubjectRef = requireIdentifier(input.host_subject_ref, "host_subject_ref");
    const expectedOrigin = requireOrigin(input.expected_origin);
    const organizationId = requireIdentifier(organization.organization_id, "organization_id");
    const receiver = requireReceiver(getReceiver());
    const enrollment = receiver.createConsentChallenge({
      manifest: input.manifest,
      expectedOrigin,
    });
    const challenge = enrollment.challenge;
    const existing = options.store.getConsentSessionByChallengeId(challenge.challenge_id);
    const consentToken = deriveToken(secret, "consent", challenge.challenge_id);
    if (existing) {
      assertSameSession(existing, {
        organizationId,
        hostSubjectRef,
        challenge,
        consentToken,
      });
      return buildSessionResponse(
        existing,
        challenge,
        consentToken,
        resolveVerificationOrigin(request),
        true,
      );
    }
    if (challenge.status !== "pending") {
      throw consentError("consent_session_not_pending", 409, "Consent challenge is not pending");
    }
    const now = readClock(clock);
    const result = options.store.createConsentSession({
      consent_session_id: requireIdentifier(createId("consent_session"), "consent_session_id"),
      organization_id: organizationId,
      challenge_id: challenge.challenge_id,
      host_subject_ref_digest: digest(hostSubjectRef),
      consent_token_digest: digest(consentToken),
      decision_id: requireIdentifier(createId("decision"), "decision_id"),
      status: "pending",
      account_id: null,
      connector_id: null,
      subject_id: null,
      delivery_target_id: null,
      created_at: now.toISOString(),
      expires_at: sessionExpiry(challenge),
      decision_action: null,
      decided_at: null,
      binding_json: null,
    });
    return buildSessionResponse(
      result.record,
      challenge,
      consentToken,
      resolveVerificationOrigin(request),
      result.duplicate,
    );
  }

  function decideConsent(input, request) {
    requireExactRecord(
      input,
      BROWSER_DECISION_FIELDS,
      ["consent_token", "action"],
      "Account consent decision",
    );
    const account = requireAccount(request);
    const consentToken = requireToken(input.consent_token, "consent_token");
    const session = options.store.getConsentSessionByTokenDigest(digest(consentToken));
    if (!session) throw consentError("consent_token_invalid", 403, "Consent token is invalid");
    if (!['approve', 'decline'].includes(input.action)) {
      throw consentError("consent_action_invalid", 400, "Consent action is invalid");
    }
    if (
      ["pending", "deciding"].includes(session.status) &&
      Date.parse(session.expires_at) <= readClock(clock).getTime()
    ) {
      throw consentError("consent_session_expired", 410, "Consent session expired");
    }

    const accountId = requireIdentifier(account.account_id, "account_id");
    let connector = null;
    if (input.action === "approve") {
      connector = options.connectorControl.getAccountConnector(
        accountId,
        requireIdentifier(input.connector_id, "connector_id"),
      );
      if (!connector) {
        throw consentError("connector_not_available", 409, "Selected Connector is not available");
      }
      options.connectorControl.bindHostSubject({
        organization_id: session.organization_id,
        host_subject_ref_digest: session.host_subject_ref_digest,
        account_id: accountId,
        connector_id: connector.connector_id,
      });
    } else if (input.connector_id !== undefined) {
      throw consentError("consent_input_fields_invalid", 400, "Decline does not accept a Connector");
    }

    const now = readClock(clock);
    const subjectId = connector?.subject_id ?? deriveAccountSubject(secret, accountId);
    const prepared = options.store.prepareConsentDecision({
      challenge_id: session.challenge_id,
      account_id: accountId,
      connector_id: connector?.connector_id ?? null,
      subject_id: subjectId,
      delivery_target_id: connector?.delivery_target_id ?? null,
      action: input.action,
      decided_at: session.decided_at ?? now.toISOString(),
    });
    if (!prepared) throw consentError("consent_session_not_found", 404, "Consent session was not found");
    const receiver = requireReceiver(getReceiver());
    const result = receiver.decideConsent({
      challengeId: session.challenge_id,
      decisionToken: consentToken,
    });
    const terminalStatus = result.status === "approved" ? "approved" : "declined";
    const binding = result.binding;
    options.store.finalizeConsentSession(
      session.challenge_id,
      terminalStatus,
      terminalStatus === "approved" ? JSON.stringify(requireBinding(binding)) : undefined,
    );
    return {
      type: "webmcp.reentry_account_consent_decision",
      protocol_version: PROTOCOL_VERSION,
      consent_session_id: session.consent_session_id,
      challenge_id: session.challenge_id,
      status: terminalStatus,
      duplicate: result.duplicate,
    };
  }

  function verifyDecision({ challengeId, decisionToken }) {
    const token = requireToken(decisionToken, "decision_token");
    const session = options.store.getConsentSessionByTokenDigest(digest(token));
    if (
      !session ||
      session.challenge_id !== requireIdentifier(challengeId, "challenge_id") ||
      !["deciding", "approved", "declined"].includes(session.status) ||
      !session.account_id ||
      !session.subject_id ||
      !session.decision_action ||
      !session.decided_at
    ) {
      throw consentError("consent_decision_invalid", 403, "Consent decision is invalid");
    }
    return {
      type: CONSENT_DECISION_TYPE,
      protocol_version: PROTOCOL_VERSION,
      decision_id: session.decision_id,
      challenge_id: session.challenge_id,
      action: session.decision_action,
      subject_id: session.subject_id,
      ...(session.decision_action === "approve"
        ? { delivery_target_id: session.delivery_target_id }
        : {}),
      decided_at: session.decided_at,
    };
  }

  async function handler(request, response) {
    const route = parseRoute(request.url);
    if (!route) return false;
    try {
      if (route.kind === "page") {
        handlePage(request, response);
        return true;
      }
      if (route.kind === "status") {
        if (request.method !== "GET") throw consentError("http_method_not_allowed", 405, "Method is not allowed");
        const organization = authenticateRequest(request);
        const session = options.store.getConsentSessionById(route.consentSessionId);
        if (!session || session.organization_id !== organization.organization_id) {
          throw consentError("consent_session_not_found", 404, "Consent session was not found");
        }
        writeJson(response, 200, buildStatusResponse(session));
        return true;
      }
      if (request.method !== "POST") throw consentError("http_method_not_allowed", 405, "Method is not allowed");
      requireJsonContentType(request);
      const body = await readJsonBody(request);
      if (route.kind === "session") {
        const organization = authenticateRequest(request);
        const result = createConsentSession(body, organization, request);
        writeJson(response, result.duplicate ? 200 : 201, result);
      } else {
        writeJson(response, 200, decideConsent(body, request));
      }
      return true;
    } catch (error) {
      if (response.headersSent || response.destroyed) return true;
      writeJson(response, statusFor(error), { error: { code: codeFor(error) } });
      return true;
    }
  }

  function handlePage(request, response) {
    if (request.method !== "GET") throw consentError("http_method_not_allowed", 405, "Method is not allowed");
    const consentToken = readPageToken(request.url);
    const session = options.store.getConsentSessionByTokenDigest(digest(consentToken));
    if (!session) throw consentError("consent_token_invalid", 404, "Consent request was not found");
    const account = options.accountAuthority.readAccount(request);
    if (!account) {
      const next = `${ACCOUNT_CONSENT_ROUTES.page}?token=${encodeURIComponent(consentToken)}`;
      redirect(response, `/user-login?next=${encodeURIComponent(next)}`);
      return;
    }
    const challenge = requireReceiver(getReceiver()).getConsentChallenge(session.challenge_id);
    if (!["pending", "deciding"].includes(session.status)) {
      writeHtml(response, renderTerminalPage(session, challenge));
      return;
    }
    const connectors = options.connectorControl.listAccountConnectors(account.account_id);
    writeHtml(response, renderConsentPage({
      consentToken,
      session,
      challenge,
      connectors,
      identity: account.identity,
    }));
  }

  function authenticateRequest(request) {
    let identity;
    try {
      identity = authenticateOrganization(readBearer(request));
    } catch {
      identity = null;
    }
    if (!identity || typeof identity !== "object" || Array.isArray(identity)) {
      throw consentError("organization_auth_invalid", 403, "Organization authentication is invalid");
    }
    return {
      organization_id: requireIdentifier(identity.organization_id, "organization_id"),
    };
  }

  function requireAccount(request) {
    const account = options.accountAuthority.readAccount(request);
    if (!account) throw consentError("session_required", 401, "Sign in is required");
    return account;
  }

  function resolveVerificationOrigin(request) {
    if (verificationOrigin) return verificationOrigin;
    const host = request?.headers?.host;
    if (typeof host !== "string" || !/^(?:127\.0\.0\.1|localhost|\[::1\])(?::(?:0|[1-9][0-9]{0,4}))?$/.test(host)) {
      throw consentError("consent_origin_invalid", 400, "Consent origin is invalid");
    }
    return `http://${host}`;
  }
}

function parseRoute(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.length > 2_048) return null;
  let url;
  try {
    url = new URL(rawUrl, "http://reentry.local");
  } catch {
    return null;
  }
  if (url.pathname === ACCOUNT_CONSENT_ROUTES.page) return { kind: "page" };
  if (url.search || url.hash) return null;
  if (url.pathname === ACCOUNT_CONSENT_ROUTES.session) return { kind: "session" };
  if (url.pathname === ACCOUNT_CONSENT_ROUTES.browserDecision) return { kind: "decision" };
  const match = url.pathname.match(/^\/v0\.1\/consent-sessions\/([A-Za-z0-9][A-Za-z0-9._:-]{0,159})$/);
  return match ? { kind: "status", consentSessionId: match[1] } : null;
}

function buildSessionResponse(record, challenge, consentToken, origin, duplicate) {
  return {
    type: "webmcp.reentry_consent_session",
    protocol_version: PROTOCOL_VERSION,
    consent_session_id: record.consent_session_id,
    challenge,
    consent_url: `${origin}${ACCOUNT_CONSENT_ROUTES.page}?token=${encodeURIComponent(consentToken)}`,
    expires_at: record.expires_at,
    duplicate,
  };
}

function buildStatusResponse(record) {
  return {
    type: "webmcp.reentry_consent_status",
    protocol_version: PROTOCOL_VERSION,
    consent_session_id: record.consent_session_id,
    challenge_id: record.challenge_id,
    status: record.status,
    expires_at: record.expires_at,
    ...(record.binding_json ? { binding: JSON.parse(record.binding_json) } : {}),
  };
}

function assertSameSession(existing, value) {
  if (
    existing.organization_id !== value.organizationId ||
    existing.challenge_id !== value.challenge.challenge_id ||
    existing.host_subject_ref_digest !== digest(value.hostSubjectRef) ||
    existing.consent_token_digest !== digest(value.consentToken)
  ) {
    throw consentError("consent_session_identity_conflict", 409, "Consent session identity conflicts");
  }
}

function sessionExpiry(challenge) {
  const offer = Date.parse(challenge.offer_expires_at);
  const grant = Date.parse(challenge.grant_scope.expires_at);
  if (!Number.isFinite(offer) || !Number.isFinite(grant)) {
    throw consentError("consent_challenge_invalid", 500, "Consent challenge expiry is invalid");
  }
  return new Date(Math.min(offer, grant)).toISOString();
}

function deriveToken(secret, purpose, id) {
  return createHmac("sha256", secret).update(`${purpose}:${id}`, "utf8").digest("base64url");
}

function deriveAccountSubject(secret, accountId) {
  return `subject_account_${createHmac("sha256", secret).update(accountId, "utf8").digest("base64url")}`;
}

function digest(value) {
  return createHash("sha256").update(value, "utf8").digest("base64url");
}

function readPageToken(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl, "http://reentry.local");
  } catch {
    throw consentError("consent_token_invalid", 400, "Consent token is invalid");
  }
  if (
    url.pathname !== ACCOUNT_CONSENT_ROUTES.page ||
    url.hash ||
    url.searchParams.getAll("token").length !== 1 ||
    [...url.searchParams.keys()].some((key) => key !== "token")
  ) {
    throw consentError("consent_token_invalid", 400, "Consent token is invalid");
  }
  return requireToken(url.searchParams.get("token"), "consent_token");
}

function renderConsentPage({ consentToken, session, challenge, connectors, identity }) {
  const connectorCards = connectors.length > 0
    ? connectors.map((connector, index) => `<label class="device-choice"><input type="radio" name="connector" value="${escapeHtml(connector.connector_id)}" ${index === 0 ? "checked" : ""}><span class="radio"></span><span><strong>${escapeHtml(connector.device_name)}</strong><small>Connected ${escapeHtml(shortDate(connector.connected_at))}</small></span><em>Codex</em></label>`).join("")
    : `<div class="empty-device"><strong>No connected Mac yet.</strong><span>Install the Re-entry Connector, sign in to your user portal, click <strong>Pair this Mac</strong>, then refresh this page.</span></div>`;
  const expectedOrigin = challenge.issuer_origin;
  return pageShell(`${challenge.display.title} — Re-entry`, `
    <main class="consent-shell">
      <header><a class="wordmark" href="/">re-entry</a><span class="account">${escapeHtml(identity)}</span></header>
      <section class="consent-card">
        <div class="origin"><span></span>${escapeHtml(hostLabel(challenge.issuer_origin))} IS ASKING</div>
        <h1>${escapeHtml(challenge.display.title)}</h1>
        <p class="reason">${escapeHtml(challenge.display.reason)}</p>
        <div class="scope">
          <div><small>WORKFLOW</small><strong>${escapeHtml(challenge.workflow.id)}</strong></div>
          <div><small>CAN TRIGGER</small><strong>${escapeHtml(challenge.grant_scope.event_type)}</strong></div>
          <div><small>RUNS</small><strong>Once</strong></div>
        </div>
        <div class="device-head"><div><small>DELIVER TO</small><h2>Choose your Codex device</h2></div><button type="button" onclick="location.reload()">Refresh</button></div>
        <div class="devices">${connectorCards}</div>
        <p id="status" class="status" role="status"></p>
        <div class="actions"><button id="decline" class="secondary">Decline</button><button id="approve" class="primary" ${connectors.length === 0 ? "disabled" : ""}>Approve and continue</button></div>
        <p class="boundary">Re-entry creates a one-run Grant. The Host still controls the final business action.</p>
      </section>
    </main>
    <script>
      const consentToken=${JSON.stringify(consentToken)};
      const sessionId=${JSON.stringify(session.consent_session_id)};
      const expectedOrigin=${JSON.stringify(expectedOrigin)};
      const status=document.querySelector('#status');
      const buttons=[document.querySelector('#approve'),document.querySelector('#decline')];
      async function decide(action){
        const selected=document.querySelector('input[name=connector]:checked');
        if(action==='approve'&&!selected){status.textContent='Connect a Mac before approving.';return}
        buttons.forEach((button)=>button.disabled=true);
        status.textContent=action==='approve'?'Creating the return path…':'Declining…';
        const payload={consent_token:consentToken,action};
        if(selected&&action==='approve')payload.connector_id=selected.value;
        try {
          const response=await fetch('${ACCOUNT_CONSENT_ROUTES.browserDecision}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
          const body=await response.json().catch(()=>({}));
          if(!response.ok){status.textContent=consentErrorMessage(body.error&&body.error.code);buttons.forEach((button)=>button.disabled=false);return}
          const finalStatus=body.status;
          window.opener?.postMessage({type:'reentry.consent.complete',consent_session_id:sessionId,status:finalStatus},expectedOrigin);
          document.querySelector('.consent-card').classList.add('complete');
          document.querySelector('h1').textContent=finalStatus==='approved'?'Approved. The return path is ready.':'Request declined.';
          document.querySelector('.reason').textContent=finalStatus==='approved'?'You can close this window. The Host will receive an opaque binding, not your Re-entry account or device credential.':'No Grant was created.';
          document.querySelector('.scope').hidden=true;document.querySelector('.device-head').hidden=true;document.querySelector('.devices').hidden=true;document.querySelector('.actions').hidden=true;document.querySelector('.boundary').hidden=true;
          status.textContent='You can close this window.';
        } catch {
          status.textContent='Could not reach Re-entry. Check your connection and try again.';
          buttons.forEach((button)=>button.disabled=false);
        }
      }
      function consentErrorMessage(code){
        const messages={
          consent_session_expired:'This consent request expired. Start again.',
          consent_token_invalid:'This consent request is no longer available.',
          consent_session_not_found:'This consent request is no longer available.',
          connector_not_available:'No connected Mac is available for this request.',
          receiver_busy:'Re-entry is busy. Try again in a moment.',
          receiver_internal_error:'Re-entry is temporarily unavailable. Try again.'
        };
        return messages[code]||'Something went wrong in Re-entry. Try again.';
      }
      document.querySelector('#approve').addEventListener('click',()=>decide('approve'));
      document.querySelector('#decline').addEventListener('click',()=>decide('decline'));
    </script>
  `);
}

function renderTerminalPage(session, challenge) {
  const approved = session.status === "approved";
  return pageShell("Consent complete — Re-entry", `<main class="consent-shell"><header><a class="wordmark" href="/">re-entry</a></header><section class="consent-card complete"><div class="origin"><span></span>${escapeHtml(hostLabel(challenge.issuer_origin))}</div><h1>${approved ? "This return path is approved." : "This request was declined."}</h1><p class="reason">${approved ? "The Host can continue only inside the one-run Grant you approved." : "No Grant was created."}</p><button class="primary close-button" onclick="window.close()">Close window</button></section></main>`);
}

const CONSENT_THEME_STYLE = `
:root{color-scheme:dark;--ink:#f5f4ef;--muted:#aaa99f;--line:#353630;--panel:#171815;--green:#9fe870;--blue:#9fc7ff}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 12% 15%,rgba(74,99,129,.18),transparent 35%),#0d0e0c;color:var(--ink);font:15px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}.consent-shell{width:min(690px,calc(100% - 32px));margin:0 auto;padding:28px 0 54px}header{display:flex;align-items:center;justify-content:space-between;margin-bottom:54px}.wordmark{color:var(--ink);font-size:22px;font-weight:650;letter-spacing:-1px;text-decoration:none}.account{max-width:55%;overflow:hidden;color:var(--muted);font-size:12px;text-overflow:ellipsis;white-space:nowrap}.consent-card{padding:42px;border:1px solid var(--line);border-radius:24px;background:linear-gradient(145deg,rgba(255,255,255,.035),transparent 52%),var(--panel);box-shadow:0 30px 90px rgba(0,0,0,.38)}.origin{display:flex;align-items:center;gap:9px;color:var(--blue);font:700 11px/1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.1em}.origin span{width:8px;height:8px;border-radius:50%;background:var(--blue);box-shadow:0 0 0 5px rgba(159,199,255,.08)}h1{margin:23px 0 12px;font-size:clamp(34px,7vw,56px);line-height:1.03;letter-spacing:-.055em}.reason{max-width:560px;margin:0;color:#c7c6be;font-size:17px}.scope{display:grid;grid-template-columns:1.15fr 1fr .55fr;gap:1px;margin:30px 0;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden}.scope div{min-width:0;padding:15px;background:#11120f}.scope small,.device-head small{display:block;margin-bottom:5px;color:#77786f;font:700 10px/1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.1em}.scope strong{display:block;overflow:hidden;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.device-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:12px}.device-head h2{margin:3px 0 0;font-size:18px}.device-head button{border:0;background:none;color:var(--muted);cursor:pointer;font:600 12px system-ui}.devices{display:grid;gap:9px}.device-choice{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:15px;border:1px solid var(--line);border-radius:14px;background:#10110f;cursor:pointer}.device-choice:has(input:checked){border-color:rgba(159,232,112,.55);background:rgba(159,232,112,.045)}.device-choice input{position:absolute;opacity:0}.radio{width:18px;height:18px;border:1px solid #61625b;border-radius:50%}.device-choice input:checked+.radio{border:5px solid var(--green)}.device-choice strong,.device-choice small{display:block}.device-choice small{color:var(--muted)}.device-choice em{color:var(--green);font-size:12px;font-style:normal}.empty-device{padding:17px;border:1px dashed #4b4d45;border-radius:14px;color:var(--muted)}.empty-device strong,.empty-device span{display:block}.empty-device strong{color:var(--ink);margin-bottom:4px}.empty-device code{color:var(--green)}.status{min-height:22px;margin:16px 0 4px;color:var(--green);font-size:13px}.actions{display:flex;justify-content:flex-end;gap:10px}.actions button,.close-button{min-height:44px;padding:0 18px;border-radius:999px;font:700 14px system-ui;cursor:pointer}.primary{border:1px solid var(--ink);background:var(--ink);color:#10110f}.secondary{border:1px solid var(--line);background:transparent;color:var(--ink)}button:disabled{cursor:not-allowed;opacity:.4}.boundary{margin:20px 0 0;padding-top:18px;border-top:1px solid var(--line);color:#797a72;font-size:12px}.complete{border-color:rgba(159,232,112,.35)}.close-button{margin-top:24px}@media(max-width:600px){header{margin-bottom:36px}.consent-card{padding:28px 22px}.scope{grid-template-columns:1fr}.actions{flex-direction:column-reverse}.actions button{width:100%}}
`;

function pageShell(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>
  ${CONSENT_THEME_STYLE}
  </style></head><body>${body}</body></html>`;
}

function hostLabel(origin) {
  try {
    return new URL(origin).host;
  } catch {
    return origin;
  }
}

function shortDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString("en", { month: "short", day: "numeric" }) : "recently";
}

function readBearer(request) {
  const value = request.headers?.authorization;
  if (typeof value !== "string" || !/^Bearer [\x21-\x7e]+$/.test(value)) {
    throw consentError("organization_auth_invalid", 403, "Organization authentication is invalid");
  }
  return value.slice(7);
}

function requireToken(value, label) {
  if (typeof value !== "string" || !TOKEN_PATTERN.test(value)) {
    throw consentError("consent_token_invalid", 403, `${label} is invalid`);
  }
  return value;
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw consentError("consent_identifier_invalid", 422, `${label} is invalid`);
  }
  return value;
}

function requireOrigin(value) {
  if (typeof value !== "string" || value.length > 2_048) {
    throw consentError("consent_origin_invalid", 422, "Origin is invalid");
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw consentError("consent_origin_invalid", 422, "Origin is invalid");
  }
  const loopback = ["127.0.0.1", "localhost", "[::1]", "::1"].includes(url.hostname);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    (url.protocol === "http:" && !loopback) ||
    url.origin !== value ||
    url.username ||
    url.password
  ) {
    throw consentError("consent_origin_invalid", 422, "Origin is invalid");
  }
  return value;
}

function requireSecret(value, label) {
  if (typeof value !== "string" || value.length < 16 || value.length > 4_096 || /[^\x21-\x7e]/.test(value)) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

function requireFunction(value, label) {
  if (typeof value !== "function") throw new TypeError(`${label} must be a function`);
  return value;
}

function readClock(clock) {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError("Account consent clock must return a valid Date");
  }
  return new Date(value.getTime());
}

function requireReceiver(receiver) {
  if (
    !receiver ||
    typeof receiver.createConsentChallenge !== "function" ||
    typeof receiver.getConsentChallenge !== "function" ||
    typeof receiver.decideConsent !== "function"
  ) {
    throw new TypeError("Account consent Receiver is unavailable");
  }
  return receiver;
}

function requireBinding(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw consentError("consent_binding_invalid", 500, "Receiver binding is invalid");
  }
  requireIdentifier(value.binding_id, "binding_id");
  return value;
}

function requireStore(store) {
  for (const method of [
    "ready",
    "createConsentSession",
    "getConsentSessionById",
    "getConsentSessionByChallengeId",
    "getConsentSessionByTokenDigest",
    "prepareConsentDecision",
    "finalizeConsentSession",
  ]) {
    if (!store || typeof store[method] !== "function") {
      throw new TypeError(`Account consent store is missing ${method}`);
    }
  }
}

function requireConnectorControl(control) {
  for (const method of ["listAccountConnectors", "getAccountConnector", "bindHostSubject"]) {
    if (!control || typeof control[method] !== "function") {
      throw new TypeError(`Account consent Connector control is missing ${method}`);
    }
  }
}

function requireJsonContentType(request) {
  const value = request.headers?.["content-type"];
  if (typeof value !== "string" || !CONTENT_TYPE.test(value) || request.headers?.["content-encoding"] !== undefined) {
    throw consentError("http_content_type_invalid", 415, "Request content type is invalid");
  }
}

async function readJsonBody(request) {
  const declared = request.headers?.["content-length"];
  if (declared !== undefined && (!/^(?:0|[1-9][0-9]*)$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) {
    throw consentError(Number(declared) > MAX_BODY_BYTES ? "http_body_too_large" : "http_body_invalid", Number(declared) > MAX_BODY_BYTES ? 413 : 400, "Request body is invalid");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY_BYTES) throw consentError("http_body_too_large", 413, "Request body is too large");
    chunks.push(bytes);
  }
  if (size === 0) throw consentError("http_body_invalid", 400, "Request body is invalid");
  try {
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw consentError("http_body_invalid", 400, "Request body is invalid");
  }
}

function writeJson(response, statusCode, body) {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
    "Content-Type": "application/json; charset=utf-8",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(payload);
}

function writeHtml(response, body) {
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Security-Policy": "default-src 'none'; connect-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    "Content-Type": "text/html; charset=utf-8",
    Pragma: "no-cache",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(body);
}

function redirect(response, location) {
  response.writeHead(302, {
    "Cache-Control": "no-store",
    "Content-Length": 0,
    Location: location,
    "Referrer-Policy": "no-referrer",
  });
  response.end();
}

function statusFor(error) {
  if (error instanceof AccountConsentControlError) return error.statusCode;
  if (typeof error?.statusCode === "number") return error.statusCode;
  if (typeof error?.code === "string" && error.code.includes("conflict")) return 409;
  return 500;
}

function codeFor(error) {
  return error instanceof AccountConsentControlError &&
    typeof error.code === "string" &&
    /^[a-z][a-z0-9_]{0,95}$/.test(error.code)
    ? error.code
    : "account_consent_internal_error";
}

function consentError(code, statusCode, message) {
  return new AccountConsentControlError(code, statusCode, message);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw consentError("consent_input_invalid", 400, `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw consentError("consent_input_invalid", 400, `${label} must be a plain object`);
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field)) || requiredFields.some((field) => !fields.includes(field))) {
    throw consentError("consent_input_fields_invalid", 400, `${label} fields are invalid`);
  }
}
