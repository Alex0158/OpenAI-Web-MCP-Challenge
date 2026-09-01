import { createHash, createHmac } from "node:crypto";
import { TextDecoder } from "node:util";

import { CONNECTOR_IDENTITY_TYPE } from "../../../reentry-core/src/receiver-core.mjs";
import { PROTOCOL_VERSION } from "../../../reentry-core/src/protocol.mjs";

export const ACCOUNT_CONNECTOR_ROUTES = Object.freeze({
  start: "/v0.1/device-authorizations",
  poll: "/v0.1/device-authorizations/poll",
  decision: "/v0.1/device-authorizations/decision",
  devices: "/v0.1/account/connectors",
  page: "/connect",
});

const OPTION_FIELDS = Object.freeze([
  "store",
  "accountAuthority",
  "tokenSecret",
  "clock",
  "createId",
  "verificationOrigin",
  "authorizationLifetimeMs",
  "connectorLifetimeMs",
]);
const REQUIRED_OPTION_FIELDS = Object.freeze([
  "store",
  "accountAuthority",
  "tokenSecret",
  "clock",
  "createId",
]);
const START_FIELDS = Object.freeze(["device_name"]);
const POLL_FIELDS = Object.freeze(["device_code"]);
const DECISION_FIELDS = Object.freeze(["authorization_token", "action"]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const CONTROL_CONTENT_TYPE = /^application\/json(?:\s*;\s*charset=utf-8)?$/i;
const MAX_BODY_BYTES = 8 * 1_024;
const DEFAULT_AUTHORIZATION_LIFETIME_MS = 10 * 60_000;
const DEFAULT_CONNECTOR_LIFETIME_MS = 30 * 24 * 60 * 60_000;
const POLL_INTERVAL_SECONDS = 2;

export class AccountConnectorControlError extends Error {
  constructor(code, statusCode, message) {
    super(message);
    this.name = "AccountConnectorControlError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function createAccountConnectorControlPlane(options) {
  requireExactRecord(options, OPTION_FIELDS, REQUIRED_OPTION_FIELDS, "Account Connector options");
  requireStore(options.store);
  if (!options.accountAuthority || typeof options.accountAuthority.readAccount !== "function") {
    throw new TypeError("Account Connector accountAuthority must implement readAccount");
  }
  const secret = requireSecret(options.tokenSecret, "Connector token secret");
  const clock = requireFunction(options.clock, "Account Connector clock");
  const createId = requireFunction(options.createId, "Account Connector createId");
  const verificationOrigin = options.verificationOrigin === undefined
    ? undefined
    : requireOrigin(options.verificationOrigin);
  const authorizationLifetimeMs = requireLifetime(
    options.authorizationLifetimeMs ?? DEFAULT_AUTHORIZATION_LIFETIME_MS,
    60_000,
    30 * 60_000,
    "authorizationLifetimeMs",
  );
  const connectorLifetimeMs = requireLifetime(
    options.connectorLifetimeMs ?? DEFAULT_CONNECTOR_LIFETIME_MS,
    60 * 60_000,
    90 * 24 * 60 * 60_000,
    "connectorLifetimeMs",
  );

  return Object.freeze({
    handler,
    verifyConnector,
    listAccountConnectors,
    getAccountConnector,
    bindHostSubject,
    resolveHostSubject,
    readiness: () => options.store.ready(),
  });

  function startAuthorization(input, request) {
    requireExactRecord(input, START_FIELDS, START_FIELDS, "Device authorization input");
    const deviceName = requireDeviceName(input.device_name);
    const now = readClock(clock);
    const authorizationId = requireIdentifier(createId("device_auth"), "authorization_id");
    const connectorId = requireIdentifier(createId("connector"), "connector_id");
    const subjectId = requireIdentifier(createId("subject"), "subject_id");
    const deliveryTargetId = requireIdentifier(createId("target"), "delivery_target_id");
    const deviceCode = deriveCode(secret, "device", authorizationId);
    const browserToken = deriveCode(secret, "browser", authorizationId);
    const connectorToken = deriveCode(secret, "connector", authorizationId);
    const expiresAt = new Date(now.getTime() + authorizationLifetimeMs).toISOString();
    options.store.createDeviceAuthorization({
      authorization_id: authorizationId,
      device_code_digest: digest(deviceCode),
      browser_token_digest: digest(browserToken),
      connector_id: connectorId,
      connector_token_digest: digest(connectorToken),
      subject_id: subjectId,
      delivery_target_id: deliveryTargetId,
      device_name: deviceName,
      account_id: null,
      status: "pending",
      created_at: now.toISOString(),
      expires_at: expiresAt,
      decided_at: null,
      consumed_at: null,
    });
    return {
      type: "webmcp.connector_device_authorization",
      protocol_version: PROTOCOL_VERSION,
      authorization_id: authorizationId,
      device_code: deviceCode,
      verification_uri: `${resolveVerificationOrigin(request)}${ACCOUNT_CONNECTOR_ROUTES.page}?token=${encodeURIComponent(browserToken)}`,
      expires_at: expiresAt,
      poll_interval_seconds: POLL_INTERVAL_SECONDS,
    };
  }

  function pollAuthorization(input) {
    requireExactRecord(input, POLL_FIELDS, POLL_FIELDS, "Device authorization poll");
    const deviceCode = requireToken(input.device_code, "device_code");
    const authorization = requireLiveAuthorization(
      options.store.getDeviceAuthorizationByDeviceDigest(digest(deviceCode)),
    );
    if (authorization.status === "pending") {
      return {
        statusCode: 202,
        body: {
          type: "webmcp.connector_device_authorization_status",
          protocol_version: PROTOCOL_VERSION,
          authorization_id: authorization.authorization_id,
          status: "pending",
          expires_at: authorization.expires_at,
          poll_interval_seconds: POLL_INTERVAL_SECONDS,
        },
      };
    }
    if (authorization.status === "denied") {
      throw controlError("device_authorization_denied", 403, "Device authorization was denied");
    }
    if (authorization.status === "consumed") {
      throw controlError(
        "device_authorization_consumed",
        409,
        "Device credentials were already delivered",
      );
    }
    const consumed = options.store.consumeDeviceAuthorization(
      authorization.authorization_id,
      readClock(clock).toISOString(),
    );
    if (consumed.status !== "consumed") {
      throw controlError("device_authorization_state_invalid", 409, "Device authorization is not ready");
    }
    const connector = options.store.getAccountConnector(
      authorization.account_id,
      authorization.connector_id,
    );
    if (!connector) {
      throw controlError("device_credentials_unavailable", 500, "Device credentials are unavailable");
    }
    return {
      statusCode: 200,
      body: {
        type: "webmcp.connector_credentials",
        protocol_version: PROTOCOL_VERSION,
        authorization_id: authorization.authorization_id,
        connector_id: connector.connector_id,
        connector_token: deriveCode(secret, "connector", authorization.authorization_id),
        connector_expires_at: connector.expires_at,
        duplicate: consumed.duplicate,
      },
    };
  }

  function decideAuthorization(input, request) {
    requireExactRecord(input, DECISION_FIELDS, DECISION_FIELDS, "Device authorization decision");
    const account = requireAccount(request);
    const browserToken = requireToken(input.authorization_token, "authorization_token");
    const authorization = requireLiveAuthorization(
      options.store.getDeviceAuthorizationByBrowserDigest(digest(browserToken)),
    );
    if (!['approve', 'deny'].includes(input.action)) {
      throw controlError("device_authorization_action_invalid", 400, "Device authorization action is invalid");
    }
    const now = readClock(clock);
    if (input.action === "deny") {
      const result = options.store.denyDeviceAuthorization(
        authorization.authorization_id,
        requireIdentifier(account.account_id, "account_id"),
        now.toISOString(),
      );
      return { status: result.status, duplicate: result.duplicate };
    }
    const connectorExpiresAt = new Date(now.getTime() + connectorLifetimeMs).toISOString();
    const result = options.store.approveDeviceAuthorization(
      authorization.authorization_id,
      requireIdentifier(account.account_id, "account_id"),
      now.toISOString(),
      {
        connector_id: authorization.connector_id,
        account_id: account.account_id,
        device_name: authorization.device_name,
        subject_id: authorization.subject_id,
        delivery_target_id: authorization.delivery_target_id,
        connector_token_digest: authorization.connector_token_digest,
        created_at: now.toISOString(),
        expires_at: connectorExpiresAt,
        revoked_at: null,
      },
    );
    if (result.status === "denied") {
      throw controlError("device_authorization_denied", 409, "Device authorization was denied");
    }
    return {
      status: "approved",
      duplicate: result.duplicate,
      connector: publicConnector(options.store.getAccountConnector(
        account.account_id,
        authorization.connector_id,
      )),
    };
  }

  function verifyConnector({ connectorToken }) {
    const token = requireToken(connectorToken, "connector_token");
    const connector = options.store.getConnectorByTokenDigest(digest(token));
    const now = readClock(clock);
    if (!connector || connector.revoked_at !== null || Date.parse(connector.expires_at) <= now.getTime()) {
      throw new Error("Connector token is invalid");
    }
    return {
      type: CONNECTOR_IDENTITY_TYPE,
      protocol_version: PROTOCOL_VERSION,
      connector_id: connector.connector_id,
      subject_id: connector.subject_id,
      delivery_target_id: connector.delivery_target_id,
      authenticated_at: now.toISOString(),
      expires_at: connector.expires_at,
    };
  }

  function listAccountConnectors(accountId) {
    const now = readClock(clock).getTime();
    return options.store.listAccountConnectors(requireIdentifier(accountId, "account_id"))
      .filter((connector) => connector.revoked_at === null && Date.parse(connector.expires_at) > now)
      .map(publicConnector);
  }

  function getAccountConnector(accountId, connectorId) {
    const connector = options.store.getAccountConnector(
      requireIdentifier(accountId, "account_id"),
      requireIdentifier(connectorId, "connector_id"),
    );
    if (!connector || connector.revoked_at !== null || Date.parse(connector.expires_at) <= readClock(clock).getTime()) {
      return null;
    }
    return { ...connector };
  }

  function bindHostSubject(input) {
    requireExactRecord(
      input,
      ["organization_id", "host_subject_ref_digest", "account_id", "connector_id"],
      ["organization_id", "host_subject_ref_digest", "account_id", "connector_id"],
      "Host subject binding input",
    );
    const connector = getAccountConnector(input.account_id, input.connector_id);
    if (!connector) {
      throw controlError("connector_not_available", 409, "Selected Connector is not available");
    }
    return options.store.bindHostSubject({
      organization_id: requireIdentifier(input.organization_id, "organization_id"),
      host_subject_ref_digest: requireDigest(input.host_subject_ref_digest),
      account_id: connector.account_id,
      subject_id: connector.subject_id,
      delivery_target_id: connector.delivery_target_id,
      connector_id: connector.connector_id,
      created_at: readClock(clock).toISOString(),
    });
  }

  function resolveHostSubject(input) {
    requireExactRecord(
      input,
      ["organization_id", "host_subject_ref_digest"],
      ["organization_id", "host_subject_ref_digest"],
      "Host subject lookup",
    );
    return options.store.getHostSubjectLink(
      requireIdentifier(input.organization_id, "organization_id"),
      requireDigest(input.host_subject_ref_digest),
    );
  }

  async function handler(request, response) {
    const route = parseRoute(request.url);
    if (!route) return false;
    try {
      if (route === "page") {
        handlePage(request, response);
        return true;
      }
      if (route === "devices") {
        if (request.method !== "GET") throw controlError("http_method_not_allowed", 405, "Method is not allowed");
        const account = requireAccount(request);
        writeJson(response, 200, { connectors: listAccountConnectors(account.account_id) });
        return true;
      }
      if (request.method !== "POST") throw controlError("http_method_not_allowed", 405, "Method is not allowed");
      requireJsonContentType(request);
      const body = await readJsonBody(request);
      if (route === "start") {
        writeJson(response, 201, startAuthorization(body, request));
      } else if (route === "decision") {
        writeJson(response, 200, decideAuthorization(body, request));
      } else {
        const result = pollAuthorization(body);
        writeJson(response, result.statusCode, result.body);
      }
      return true;
    } catch (error) {
      writeJson(response, statusFor(error), { error: { code: codeFor(error) } });
      return true;
    }
  }

  function handlePage(request, response) {
    if (request.method !== "GET") {
      throw controlError("http_method_not_allowed", 405, "Method is not allowed");
    }
    const browserToken = readPageToken(request.url);
    const authorization = requireLiveAuthorization(
      options.store.getDeviceAuthorizationByBrowserDigest(digest(browserToken)),
    );
    const account = options.accountAuthority.readAccount(request);
    if (!account) {
      writeHtml(response, renderAccountAccessPage({
        token: browserToken,
        deviceName: authorization.device_name,
      }));
      return;
    }
    if (authorization.status === "consumed") {
      writeHtml(response, renderConnectedPage(authorization.device_name));
      return;
    }
    if (authorization.status === "denied") {
      writeHtml(response, renderDeniedPage(authorization.device_name));
      return;
    }
    writeHtml(response, renderApprovalPage({
      token: browserToken,
      deviceName: authorization.device_name,
      identity: account.identity,
    }));
  }

  function requireLiveAuthorization(value) {
    if (!value) throw controlError("device_authorization_not_found", 404, "Device authorization was not found");
    if (Date.parse(value.expires_at) <= readClock(clock).getTime()) {
      throw controlError("device_authorization_expired", 410, "Device authorization expired");
    }
    return value;
  }

  function requireAccount(request) {
    const account = options.accountAuthority.readAccount(request);
    if (!account) throw controlError("session_required", 401, "Sign in is required");
    return account;
  }

  function resolveVerificationOrigin(request) {
    if (verificationOrigin) return verificationOrigin;
    const host = request?.headers?.host;
    if (typeof host !== "string" || !/^(?:127\.0\.0\.1|localhost|\[::1\])(?::(?:0|[1-9][0-9]{0,4}))?$/.test(host)) {
      throw controlError("device_authorization_origin_invalid", 400, "Verification origin is invalid");
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
  if (url.pathname === ACCOUNT_CONNECTOR_ROUTES.page) return "page";
  if (url.search || url.hash) return null;
  if (url.pathname === ACCOUNT_CONNECTOR_ROUTES.start) return "start";
  if (url.pathname === ACCOUNT_CONNECTOR_ROUTES.poll) return "poll";
  if (url.pathname === ACCOUNT_CONNECTOR_ROUTES.decision) return "decision";
  if (url.pathname === ACCOUNT_CONNECTOR_ROUTES.devices) return "devices";
  return null;
}

function readPageToken(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl, "http://reentry.local");
  } catch {
    throw controlError("device_authorization_token_invalid", 400, "Authorization token is invalid");
  }
  if (
    url.pathname !== ACCOUNT_CONNECTOR_ROUTES.page ||
    url.hash ||
    url.searchParams.getAll("token").length !== 1 ||
    [...url.searchParams.keys()].some((key) => key !== "token")
  ) {
    throw controlError("device_authorization_token_invalid", 400, "Authorization token is invalid");
  }
  return requireToken(url.searchParams.get("token"), "authorization_token");
}

function publicConnector(value) {
  if (!value) return null;
  return {
    connector_id: value.connector_id,
    device_name: value.device_name,
    status: value.revoked_at === null ? "connected" : "revoked",
    connected_at: value.created_at,
    expires_at: value.expires_at,
  };
}

function renderAccountAccessPage({ token, deviceName }) {
  const safeName = escapeHtml(deviceName);
  const returnPath = `${ACCOUNT_CONNECTOR_ROUTES.page}?token=${encodeURIComponent(token)}`;
  const loginHref = escapeHtml(`/login?flow=connector&next=${encodeURIComponent(returnPath)}`);
  const registerHref = escapeHtml(`/register?flow=connector&next=${encodeURIComponent(returnPath)}`);
  return pageShell("Connect this Mac", `
    <main class="account-entry-shell">
      <a class="wordmark" href="/">re-entry</a>
      <div class="account-entry-grid">
        <section class="account-entry-story">
          <div class="signal"><span></span> LOCAL CONNECTOR / FIRST RUN</div>
          <div class="entry-kicker">A one-time account step</div>
          <h1>Connect your Mac to the return path.</h1>
          <p class="lead">Re-entry uses your account to remember this device and deliver only the work you approve to Codex later.</p>
          <div class="account-entry-device"><span class="device-icon">MAC</span><div><strong>${safeName}</strong><small>Waiting for a Re-entry account</small></div><span class="state">Ready</span></div>
        </section>
        <section class="account-entry-card">
          <div class="signal"><span></span> RE-ENTRY ACCOUNT</div>
          <h2>How would you like to continue?</h2>
          <p class="entry-copy">Choose an account path. You will return here to approve this Mac.</p>
          <div class="entry-options">
            <a class="entry-option entry-option-primary" href="${registerHref}"><span class="entry-option-number">01</span><span class="entry-option-copy"><strong>Create an account</strong><small>New to Re-entry? Start with a lightweight account.</small></span><span class="entry-option-arrow">↗</span></a>
            <a class="entry-option" href="${loginHref}"><span class="entry-option-number">02</span><span class="entry-option-copy"><strong>Log in</strong><small>Already use Re-entry? Continue to connect this Mac.</small></span><span class="entry-option-arrow">↗</span></a>
          </div>
          <p class="entry-footnote"><span></span>After account access, Re-entry will show the final “Connect this Mac” approval.</p>
        </section>
      </div>
    </main>
  `);
}

function renderApprovalPage({ token, deviceName, identity }) {
  const safeName = escapeHtml(deviceName);
  const safeIdentity = escapeHtml(identity);
  return pageShell("Connect this Mac", `
    <main class="flow-shell">
      <a class="wordmark" href="/">re-entry</a>
      <section class="flow-card">
        <div class="signal"><span></span> LOCAL CONNECTOR</div>
        <h1>Connect ${safeName}?</h1>
        <p class="lead">This lets Re-entry deliver work you approve to Codex on this Mac.</p>
        <div class="device-row"><span class="device-icon">MAC</span><div><strong>${safeName}</strong><small>Signed in as ${safeIdentity}</small></div><span class="state">Ready</span></div>
        <ul><li>Outbound connection only</li><li>No browser or organization keys stored locally</li><li>Codex opens only after a separate approval</li></ul>
        <p id="status" class="status" role="status"></p>
        <div class="actions"><button id="deny" class="secondary">Not now</button><button id="approve" class="primary">Connect this Mac</button></div>
      </section>
      <p class="fine">You can close this page after the Connector confirms.</p>
    </main>
    <script>
      const token=${JSON.stringify(token)};
      const status=document.querySelector('#status');
      const buttons=[document.querySelector('#approve'),document.querySelector('#deny')];
      async function decide(action){
        buttons.forEach((button)=>button.disabled=true);
        status.textContent=action==='approve'?'Connecting this Mac…':'Declining…';
        const response=await fetch('${ACCOUNT_CONNECTOR_ROUTES.decision}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({authorization_token:token,action})});
        const body=await response.json().catch(()=>({}));
        if(!response.ok){status.textContent=(body.error&&body.error.code||'Unable to continue').replaceAll('_',' ');buttons.forEach((button)=>button.disabled=false);return}
        document.querySelector('.flow-card').classList.add('complete');
        document.querySelector('h1').textContent=action==='approve'?'This Mac is connected.':'Connection declined.';
        document.querySelector('.lead').textContent=action==='approve'?'Re-entry is ready to deliver approved work to Codex through the background Connector.':'Nothing was installed or connected.';
        document.querySelector('.device-row').hidden=true;
        document.querySelector('ul').hidden=true;
        document.querySelector('.actions').hidden=true;
        status.textContent=action==='approve'?'Return to Terminal. The Connector will finish automatically.':'You can close this page.';
      }
      document.querySelector('#approve').addEventListener('click',()=>decide('approve'));
      document.querySelector('#deny').addEventListener('click',()=>decide('deny'));
    </script>
  `);
}

function renderConnectedPage(deviceName) {
  return pageShell("Mac connected", `<main class="flow-shell"><a class="wordmark" href="/">re-entry</a><section class="flow-card complete"><div class="signal"><span></span> CONNECTED</div><h1>${escapeHtml(deviceName)} is connected.</h1><p class="lead">The Local Connector can now receive work you approve and open a fresh Codex session.</p></section><p class="fine">You can close this page.</p></main>`);
}

function renderDeniedPage(deviceName) {
  return pageShell("Connection declined", `<main class="flow-shell"><a class="wordmark" href="/">re-entry</a><section class="flow-card"><div class="signal muted"><span></span> NOT CONNECTED</div><h1>${escapeHtml(deviceName)} was not connected.</h1><p class="lead">Nothing was installed or authorized. Start the Connector again when you are ready.</p></section></main>`);
}

const ACCOUNT_ENTRY_STYLE = `
  .account-entry-shell{width:min(1040px,calc(100% - 32px));min-height:100vh;margin:0 auto;padding:34px 0 62px}.account-entry-shell>.wordmark{display:inline-block;margin-bottom:78px;color:var(--ink);font-size:22px;font-weight:650;letter-spacing:-1px;text-decoration:none}.account-entry-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(380px,.9fr);gap:76px;align-items:center}.account-entry-story{padding-bottom:22px}.account-entry-story .signal{margin-bottom:22px}.entry-kicker{position:relative;color:var(--green);font:700 11px/1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.12em;text-transform:uppercase}.account-entry-story h1{position:relative;max-width:570px;margin:18px 0 18px;font-size:clamp(42px,6vw,72px);line-height:.99;letter-spacing:-.065em}.account-entry-story .lead{max-width:500px;font-size:18px}.account-entry-device{display:flex;align-items:center;gap:14px;max-width:470px;margin-top:38px;padding:15px;border:1px solid var(--line);border-radius:15px;background:#10110f}.account-entry-device div{min-width:0;flex:1}.account-entry-device strong,.account-entry-device small{display:block}.account-entry-device small{margin-top:3px;overflow:hidden;color:var(--muted);text-overflow:ellipsis;white-space:nowrap}.account-entry-card{position:relative;overflow:hidden;padding:32px;border:1px solid rgba(159,232,112,.24);border-radius:24px;background:linear-gradient(145deg,rgba(255,255,255,.055),transparent 58%),#171815;box-shadow:0 28px 80px rgba(0,0,0,.34)}.account-entry-card:before{content:"";position:absolute;inset:-150px -80px auto auto;width:300px;height:300px;border-radius:50%;background:rgba(106,221,137,.1);filter:blur(18px)}.account-entry-card>*{position:relative}.account-entry-card h2{margin:22px 0 10px;font-size:28px;line-height:1.08;letter-spacing:-.05em}.entry-copy{max-width:360px;margin:0;color:#c8c7bf;font-size:15px}.entry-options{display:grid;gap:10px;margin-top:26px}.entry-option{display:flex;align-items:center;gap:13px;min-height:76px;padding:14px;border:1px solid #353630;border-radius:15px;background:#10110f;color:var(--ink);text-decoration:none;transition:border-color .18s ease,background .18s ease,transform .18s ease}.entry-option:hover{border-color:rgba(159,232,112,.6);background:#1b1d19;transform:translateY(-1px)}.entry-option-primary{border-color:rgba(159,232,112,.5);background:rgba(159,232,112,.08)}.entry-option-number{display:grid;place-items:center;flex:none;width:32px;height:32px;border-radius:10px;background:#292c25;color:var(--green);font:700 10px ui-monospace,SFMono-Regular,monospace}.entry-option-primary .entry-option-number{background:var(--green);color:#10110f}.entry-option-copy{min-width:0;flex:1}.entry-option-copy strong,.entry-option-copy small{display:block}.entry-option-copy strong{font-size:15px}.entry-option-copy small{margin-top:3px;color:var(--muted);font-size:12px;line-height:1.35}.entry-option-arrow{color:var(--green);font-size:20px}.entry-footnote{display:flex;align-items:flex-start;gap:9px;margin:22px 0 0;color:#85867d;font-size:12px;line-height:1.45}.entry-footnote span{flex:none;width:7px;height:7px;margin-top:5px;border-radius:50%;background:var(--green);box-shadow:0 0 0 4px rgba(159,232,112,.08)}@media(max-width:820px){.account-entry-grid{grid-template-columns:1fr;gap:38px}.account-entry-shell>.wordmark{margin-bottom:52px}.account-entry-story{max-width:680px}.account-entry-card{max-width:620px}}@media(max-width:560px){.account-entry-shell{width:min(100% - 32px,620px);padding-top:24px}.account-entry-story h1{font-size:46px}.account-entry-story .lead{font-size:16px}.account-entry-device{margin-top:28px}.account-entry-card{padding:24px 20px}.account-entry-card h2{font-size:25px}.entry-option{align-items:flex-start}.entry-option-arrow{margin-left:auto}}
`;

function pageShell(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} — Re-entry</title><style>
  :root{color-scheme:dark;--ink:#f5f4ef;--muted:#aaa99f;--line:#353630;--panel:#171815;--green:#9fe870;--green2:#60c97c}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 75% 10%,rgba(87,128,99,.18),transparent 34%),#0d0e0c;color:var(--ink);font:15px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}.flow-shell{width:min(620px,calc(100% - 32px));margin:0 auto;padding:34px 0 52px}.wordmark{display:inline-block;margin-bottom:72px;color:var(--ink);font-size:22px;font-weight:650;letter-spacing:-1px;text-decoration:none}.flow-card{position:relative;overflow:hidden;padding:40px;border:1px solid var(--line);border-radius:24px;background:linear-gradient(145deg,rgba(255,255,255,.035),transparent 55%),var(--panel);box-shadow:0 28px 80px rgba(0,0,0,.34)}.flow-card:before{content:"";position:absolute;inset:-120px auto auto 55%;width:280px;height:280px;border-radius:50%;background:rgba(106,221,137,.08);filter:blur(14px)}.signal{position:relative;display:flex;align-items:center;gap:9px;color:var(--green);font:700 11px/1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.12em}.signal span{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 0 5px rgba(159,232,112,.09)}.signal.muted{color:var(--muted)}.signal.muted span{background:var(--muted);box-shadow:none}h1{position:relative;margin:24px 0 12px;font-size:clamp(32px,7vw,54px);line-height:1.02;letter-spacing:-.055em}.lead{position:relative;max-width:470px;margin:0;color:#c8c7bf;font-size:17px}.device-row{position:relative;display:flex;align-items:center;gap:14px;margin:30px 0 22px;padding:16px;border:1px solid var(--line);border-radius:15px;background:#10110f}.device-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#272923;color:var(--green);font:700 10px ui-monospace,SFMono-Regular,monospace;letter-spacing:.08em}.device-row div{min-width:0;flex:1}.device-row strong,.device-row small{display:block}.device-row small{overflow:hidden;color:var(--muted);text-overflow:ellipsis;white-space:nowrap}.state{padding:5px 9px;border-radius:999px;background:rgba(159,232,112,.1);color:var(--green);font-size:11px;font-weight:700}ul{display:grid;gap:0;margin:0 0 30px;padding:0;list-style:none;color:var(--muted);font-size:13px}li{padding:8px 0;border-top:1px solid var(--line)}.actions{display:flex;justify-content:flex-end;gap:10px}.actions button{min-height:44px;padding:0 17px;border-radius:999px;font:700 14px system-ui;cursor:pointer}.primary{border:1px solid var(--ink);background:var(--ink);color:#10110f}.secondary{border:1px solid var(--line);background:transparent;color:var(--ink)}button:disabled{cursor:wait;opacity:.55}.status{min-height:22px;color:var(--green);font-size:13px}.fine{text-align:center;color:#77786f;font-size:12px}.complete{border-color:rgba(159,232,112,.35)}@media(max-width:560px){.wordmark{margin-bottom:48px}.flow-card{padding:28px 22px}.actions{flex-direction:column-reverse}.actions button{width:100%}}
  ${ACCOUNT_ENTRY_STYLE}
  </style></head><body>${body}</body></html>`;
}

function requireDeviceName(value) {
  if (typeof value !== "string") throw controlError("device_name_invalid", 422, "Device name is invalid");
  const name = value.trim();
  if (name.length < 2 || Buffer.byteLength(name, "utf8") > 80 || /[\u0000-\u001f\u007f]/.test(name)) {
    throw controlError("device_name_invalid", 422, "Device name is invalid");
  }
  return name;
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw controlError("device_identifier_invalid", 422, `${label} is invalid`);
  }
  return value;
}

function requireDigest(value) {
  if (typeof value !== "string" || !TOKEN_PATTERN.test(value)) {
    throw controlError("device_digest_invalid", 422, "Digest is invalid");
  }
  return value;
}

function requireToken(value, label) {
  if (typeof value !== "string" || !TOKEN_PATTERN.test(value)) {
    throw controlError("device_authorization_token_invalid", 403, `${label} is invalid`);
  }
  return value;
}

function requireSecret(value, label) {
  if (typeof value !== "string" || value.length < 16 || value.length > 4_096 || /[^\x21-\x7e]/.test(value)) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

function deriveCode(secret, purpose, authorizationId) {
  return createHmac("sha256", secret)
    .update(`${purpose}:${authorizationId}`, "utf8")
    .digest("base64url");
}

function digest(value) {
  return createHash("sha256").update(value, "utf8").digest("base64url");
}

function requireOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError("Account Connector verificationOrigin is invalid");
  }
  const loopback = ["127.0.0.1", "localhost", "[::1]", "::1"].includes(url.hostname);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    (url.protocol === "http:" && !loopback) ||
    url.origin !== value ||
    url.username ||
    url.password
  ) {
    throw new TypeError("Account Connector verificationOrigin is invalid");
  }
  return value;
}

function requireFunction(value, label) {
  if (typeof value !== "function") throw new TypeError(`${label} must be a function`);
  return value;
}

function requireLifetime(value, minimum, maximum, label) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new TypeError(`${label} is outside its supported range`);
  }
  return value;
}

function readClock(clock) {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError("Account Connector clock must return a valid Date");
  }
  return new Date(value.getTime());
}

function requireStore(store) {
  for (const method of [
    "ready",
    "createDeviceAuthorization",
    "getDeviceAuthorizationByDeviceDigest",
    "getDeviceAuthorizationByBrowserDigest",
    "approveDeviceAuthorization",
    "denyDeviceAuthorization",
    "consumeDeviceAuthorization",
    "getConnectorByTokenDigest",
    "getAccountConnector",
    "listAccountConnectors",
    "bindHostSubject",
    "getHostSubjectLink",
  ]) {
    if (!store || typeof store[method] !== "function") {
      throw new TypeError(`Account Connector store is missing ${method}`);
    }
  }
}

function requireJsonContentType(request) {
  const value = request.headers?.["content-type"];
  if (typeof value !== "string" || !CONTROL_CONTENT_TYPE.test(value) || request.headers?.["content-encoding"] !== undefined) {
    throw controlError("http_content_type_invalid", 415, "Request content type is invalid");
  }
}

async function readJsonBody(request) {
  const declared = request.headers?.["content-length"];
  if (declared !== undefined && (!/^(?:0|[1-9][0-9]*)$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) {
    throw controlError(Number(declared) > MAX_BODY_BYTES ? "http_body_too_large" : "http_body_invalid", Number(declared) > MAX_BODY_BYTES ? 413 : 400, "Request body is invalid");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY_BYTES) throw controlError("http_body_too_large", 413, "Request body is too large");
    chunks.push(bytes);
  }
  if (size === 0) throw controlError("http_body_invalid", 400, "Request body is invalid");
  try {
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw controlError("http_body_invalid", 400, "Request body is invalid");
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
  return error instanceof AccountConnectorControlError ? error.statusCode : 500;
}

function codeFor(error) {
  return typeof error?.code === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(error.code)
    ? error.code
    : "account_connector_internal_error";
}

function controlError(code, statusCode, message) {
  return new AccountConnectorControlError(code, statusCode, message);
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
    throw controlError("device_input_invalid", 400, `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw controlError("device_input_invalid", 400, `${label} must be a plain object`);
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field)) || requiredFields.some((field) => !fields.includes(field))) {
    throw controlError("device_input_fields_invalid", 400, `${label} fields are invalid`);
  }
}
