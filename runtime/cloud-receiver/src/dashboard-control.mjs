import { TextDecoder } from "node:util";

import {
  renderAuthPageSimple,
  renderOrganizationChooserPage,
  renderOrganizationDashboardPage,
  renderDashboardPage,
  renderDeveloperDocsPage,
  renderConnectorAuthPage,
} from "./console-pages.mjs";
import { renderLanding } from "./landing-page.mjs";

export const CLOUD_CONSOLE_ROUTES = Object.freeze({
  landing: "/",
  login: "/login",
  register: "/register",
  docs: "/docs",
  dashboard: "/dashboard",
  activityPage: "/dashboard/activity",
  pendingPage: "/dashboard/pending",
  organizationsPage: "/dashboard/organizations",
  quickConnectPage: "/dashboard/quick-connect",
  session: "/api/session",
  registerAccount: "/api/auth/register",
  loginAccount: "/api/auth/login",
  logout: "/api/auth/logout",
  organizations: "/api/organizations",
  activity: "/api/activity",
});

const MAX_BODY_BYTES = 32 * 1_024;
const SESSION_COOKIE = "reentry_session";
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const JSON_CONTENT_TYPE = /^application\/json(?:\s*;\s*charset=utf-8)?$/i;

export class CloudConsoleError extends Error {
  constructor(code, statusCode, message) {
    super(message || code);
    this.name = "CloudConsoleError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function createCloudConsoleControlPlane(options) {
  requireExactRecord(options, ["store", "clock", "activity"], ["store"], "Cloud console options");
  if (!options.store || typeof options.store.getSession !== "function") {
    throw new TypeError("Cloud console store is missing getSession");
  }
  if (options.activity !== undefined && typeof options.activity.snapshot !== "function") {
    throw new TypeError("Cloud console activity must implement snapshot");
  }
  const clock = typeof options.clock === "function" ? options.clock : () => new Date();

  return Object.freeze({ handler, readiness: () => options.store.ready() });

  async function handler(request, response) {
    const route = parseRoute(request.url);
    if (!route) return false;

    if (route.kind === "page") {
      if (route.path.startsWith("/dashboard") && !readAccount(request)) {
        redirect(response, "/login?next=" + encodeURIComponent(route.path));
        return true;
      }
      writeHtml(
        response,
        route.path === CLOUD_CONSOLE_ROUTES.login
          ? route.authFlow === "connector"
            ? renderConnectorAuthPage("login", { next: route.authNext })
            : renderAuthPageSimple("login")
          : route.path === CLOUD_CONSOLE_ROUTES.register
            ? route.authFlow === "connector"
              ? renderConnectorAuthPage("register", { next: route.authNext })
              : renderAuthPageSimple("register")
            : route.path === CLOUD_CONSOLE_ROUTES.docs
              ? renderDeveloperDocsPage()
            : route.path === CLOUD_CONSOLE_ROUTES.organizationsPage
              ? renderOrganizationChooserPage()
            : route.view === "organization"
              ? renderOrganizationDashboardPage(route.view, route.organizationId)
            : route.path.startsWith("/dashboard")
              ? renderDashboardPage(route.view, route.organizationId)
              : renderLanding(),
      );
      return true;
    }

    if (route.kind === "organization-page") {
      if (!readAccount(request)) {
        redirect(response, "/login?next=" + encodeURIComponent(route.path));
        return true;
      }
      writeHtml(response, renderOrganizationDashboardPage(route.view, route.organizationId));
      return true;
    }

    try {
      await handleApi(route, request, response);
    } catch (error) {
      if (response.headersSent || response.destroyed) return true;
      writeJson(
        response,
        statusFor(error),
        { error: { code: codeFor(error) } },
        error instanceof CloudConsoleError && error.code === "session_required"
          ? { "Set-Cookie": clearSessionCookie() }
          : undefined,
      );
    }
    return true;
  }

  async function handleApi(route, request, response) {
    if (route.path === CLOUD_CONSOLE_ROUTES.session) {
      requireMethod(request, "GET");
      const account = readAccount(request);
      writeJson(response, 200, account
        ? { authenticated: true, account }
        : { authenticated: false });
      return;
    }

    if (route.path === CLOUD_CONSOLE_ROUTES.registerAccount) {
      requireMethod(request, "POST");
      requireJsonContentType(request);
      const result = options.store.registerAccount(await readJsonBody(request));
      const session = options.store.createSession(
        result.account.account_id,
        readClock(clock),
      );
      writeJson(
        response,
        201,
        {
          authenticated: true,
          account: result.account,
        },
        { "Set-Cookie": sessionCookie(session.token) },
      );
      return;
    }

    if (route.path === CLOUD_CONSOLE_ROUTES.loginAccount) {
      requireMethod(request, "POST");
      requireJsonContentType(request);
      const account = options.store.authenticate(await readJsonBody(request));
      const session = options.store.createSession(
        account.account_id,
        readClock(clock),
      );
      writeJson(
        response,
        200,
        {
          authenticated: true,
          account,
          organizations: options.store.listOrganizations(account.account_id),
        },
        { "Set-Cookie": sessionCookie(session.token) },
      );
      return;
    }

    if (route.path === CLOUD_CONSOLE_ROUTES.logout) {
      requireMethod(request, "POST");
      const token = readCookie(request, SESSION_COOKIE);
      if (token) options.store.destroySession(token);
      writeJson(response, 200, { authenticated: false }, {
        "Set-Cookie": clearSessionCookie(),
      });
      return;
    }

    const account = requireAccount(request);
    if (route.path === CLOUD_CONSOLE_ROUTES.organizations) {
      if (request.method === "GET") {
        writeJson(response, 200, {
          organizations: options.store.listOrganizations(account.account_id),
        });
        return;
      }
      requireMethod(request, "POST");
      requireJsonContentType(request);
      const result = options.store.createOrganization(
        account.account_id,
        await readJsonBody(request),
        readClock(clock),
      );
      writeJson(response, 201, {
        organization: result.organization,
        api_key: result.apiKey,
      });
      return;
    }

    if (route.path === CLOUD_CONSOLE_ROUTES.activity) {
      requireMethod(request, "GET");
      writeJson(response, 200, options.activity
        ? options.activity.snapshot({ limit: 25 })
        : unavailableActivity(readClock(clock)));
      return;
    }

    if (route.kind === "organization") {
      if (route.resource === "organization" && request.method === "DELETE") {
        const organization = options.store.deleteOrganization(
          account.account_id,
          route.organizationId,
        );
        writeJson(response, 200, {
          status: "deleted",
          organization,
        });
        return;
      }
      if (route.resource === "api-keys" && request.method === "GET") {
        writeJson(response, 200, {
          api_keys: options.store.listApiKeys(account.account_id, route.organizationId),
        });
        return;
      }
      if (route.resource === "api-keys" && request.method === "POST") {
        const result = options.store.createApiKey(
          account.account_id,
          route.organizationId,
          readClock(clock),
        );
        writeJson(response, 201, { api_key: result });
        return;
      }
      if (route.resource === "api-key-revocation" && request.method === "POST") {
        options.store.revokeApiKey(
          account.account_id,
          route.organizationId,
          route.apiKeyId,
          readClock(clock),
        );
        writeJson(response, 200, {
          status: "revoked",
          api_key_id: route.apiKeyId,
        });
        return;
      }
    }

    throw new CloudConsoleError("console_route_not_found", 404);
  }

  function readAccount(request) {
    const token = readCookie(request, SESSION_COOKIE);
    return token ? options.store.getSession(token, readClock(clock)) : null;
  }

  function requireAccount(request) {
    const account = readAccount(request);
    if (!account) throw new CloudConsoleError("session_required", 401);
    return account;
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
  let match = url.pathname.match(/^\/([^/]+)\/dashboard(?:\/(activity|pending|contracts))?$/);
  if (match) {
    return {
      kind: "organization-page",
      path: url.pathname,
      view: match[2] || "overview",
      organizationId: decodeSegment(match[1]),
    };
  }
  match = url.pathname.match(/^\/dashboard\/organizations\/([^/]+)$/);
  if (match) {
    return {
      kind: "page",
      path: url.pathname,
      view: "organization",
      organizationId: decodeSegment(match[1]),
    };
  }
  if ([
    CLOUD_CONSOLE_ROUTES.landing,
    CLOUD_CONSOLE_ROUTES.login,
    CLOUD_CONSOLE_ROUTES.register,
    CLOUD_CONSOLE_ROUTES.docs,
    CLOUD_CONSOLE_ROUTES.dashboard,
    CLOUD_CONSOLE_ROUTES.activityPage,
    CLOUD_CONSOLE_ROUTES.pendingPage,
    CLOUD_CONSOLE_ROUTES.organizationsPage,
    CLOUD_CONSOLE_ROUTES.quickConnectPage,
  ].includes(url.pathname)) {
    const authContext = readAuthContext(url);
    return {
      kind: "page",
      path: url.pathname,
      view: url.pathname === CLOUD_CONSOLE_ROUTES.activityPage
        ? "activity"
        : url.pathname === CLOUD_CONSOLE_ROUTES.pendingPage
          ? "pending"
          : url.pathname === CLOUD_CONSOLE_ROUTES.organizationsPage
            ? "organizations"
          : url.pathname === CLOUD_CONSOLE_ROUTES.quickConnectPage
              ? "quick-connect"
              : "overview",
      ...authContext,
    };
  }
  if ([
    CLOUD_CONSOLE_ROUTES.session,
    CLOUD_CONSOLE_ROUTES.registerAccount,
    CLOUD_CONSOLE_ROUTES.loginAccount,
    CLOUD_CONSOLE_ROUTES.logout,
    CLOUD_CONSOLE_ROUTES.organizations,
    CLOUD_CONSOLE_ROUTES.activity,
  ].includes(url.pathname)) {
    return { kind: "api", path: url.pathname };
  }
  match = url.pathname.match(/^\/api\/organizations\/([^/]+)$/);
  if (match) {
    return {
      kind: "organization",
      path: url.pathname,
      organizationId: decodeSegment(match[1]),
      resource: "organization",
    };
  }
  match = url.pathname.match(/^\/api\/organizations\/([^/]+)\/api-keys$/);
  if (match) {
    return {
      kind: "organization",
      path: url.pathname,
      organizationId: decodeSegment(match[1]),
      resource: "api-keys",
    };
  }
  match = url.pathname.match(/^\/api\/organizations\/([^/]+)\/api-keys\/([^/]+)\/revoke$/);
  if (match) {
    return {
      kind: "organization",
      path: url.pathname,
      organizationId: decodeSegment(match[1]),
      apiKeyId: decodeSegment(match[2]),
      resource: "api-key-revocation",
    };
  }
  return null;
}

function readAuthContext(url) {
  if (![CLOUD_CONSOLE_ROUTES.login, CLOUD_CONSOLE_ROUTES.register].includes(url.pathname)) {
    return {};
  }
  const flow = url.searchParams.get("flow");
  const next = url.searchParams.get("next");
  if (flow !== "connector" || !isConnectorReturnPath(next)) return {};
  return { authFlow: "connector", authNext: next };
}

function isConnectorReturnPath(value) {
  if (typeof value !== "string" || value.length > 256) return false;
  let url;
  try {
    url = new URL(value, "http://reentry.local");
  } catch {
    return false;
  }
  if (
    url.origin !== "http://reentry.local" ||
    url.pathname !== "/connect" ||
    url.hash ||
    url.searchParams.getAll("token").length !== 1 ||
    [...url.searchParams.keys()].some((key) => key !== "token")
  ) {
    return false;
  }
  return /^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get("token"));
}

function unavailableActivity(now) {
  return {
    available: false,
    receiver_scope: null,
    generated_at: now.toISOString(),
    counts: { events: 0, pending_work: 0 },
    events: [],
    pending_work: [],
  };
}

function requireMethod(request, expected) {
  if (request.method !== expected) {
    throw new CloudConsoleError("http_method_not_allowed", 405);
  }
}

function requireJsonContentType(request) {
  if (
    typeof request.headers?.["content-type"] !== "string" ||
    !JSON_CONTENT_TYPE.test(request.headers["content-type"])
  ) {
    throw new CloudConsoleError("http_content_type_invalid", 415);
  }
}

async function readJsonBody(request) {
  const declared = request.headers?.["content-length"];
  if (
    declared !== undefined &&
    (!/^(?:0|[1-9][0-9]*)$/.test(declared) || Number(declared) > MAX_BODY_BYTES)
  ) {
    throw new CloudConsoleError(
      Number(declared) > MAX_BODY_BYTES ? "http_body_too_large" : "http_body_invalid",
      Number(declared) > MAX_BODY_BYTES ? 413 : 400,
    );
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY_BYTES) {
      throw new CloudConsoleError("http_body_too_large", 413);
    }
    chunks.push(bytes);
  }
  if (size === 0) throw new CloudConsoleError("http_body_invalid", 400);
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
  } catch {
    throw new CloudConsoleError("http_body_invalid", 400);
  }
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw new CloudConsoleError("http_body_invalid", 400);
  }
}

function readCookie(request, name) {
  const header = request.headers?.cookie;
  if (typeof header !== "string") return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() !== name) continue;
    const value = part.slice(index + 1).trim();
    if (!/^[A-Za-z0-9_-]{16,256}$/.test(value)) return null;
    return value;
  }
  return null;
}

function sessionCookie(token) {
  return SESSION_COOKIE + "=" + token +
    "; Path=/; Max-Age=" + COOKIE_MAX_AGE_SECONDS +
    "; HttpOnly; SameSite=Lax";
}

function clearSessionCookie() {
  return SESSION_COOKIE + "=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax";
}

function writeJson(response, statusCode, body, headers = undefined) {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
    "Content-Type": "application/json; charset=utf-8",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  response.end(payload);
}

function writeHtml(response, html) {
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(html),
    "Content-Security-Policy": "default-src 'none'; img-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    "Content-Type": "text/html; charset=utf-8",
    Pragma: "no-cache",
    "Referrer-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(html);
}

function redirect(response, location) {
  response.writeHead(302, {
    "Cache-Control": "no-store",
    Location: location,
    "Content-Length": 0,
  });
  response.end();
}

function statusFor(error) {
  if (error instanceof CloudConsoleError) return error.statusCode;
  if ([
    "identity_invalid",
    "credentials_invalid",
    "email_invalid",
    "password_invalid",
    "organization_name_invalid",
  ].includes(error?.code)) return 422;
  if (error?.code === "account_exists") return 409;
  if (error?.code === "invalid_credentials") return 401;
  if ([
    "account_not_found",
    "organization_not_found",
    "api_key_not_found",
  ].includes(error?.code)) return 404;
  return 500;
}

function codeFor(error) {
  if (typeof error?.code === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(error.code)) {
    return error.code;
  }
  return "console_internal_error";
}

function readClock(clock) {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError("Cloud console clock must return a valid Date");
  }
  return new Date(value.getTime());
}

function decodeSegment(value) {
  try {
    const decoded = decodeURIComponent(value);
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(decoded)) throw new Error();
    return decoded;
  } catch {
    throw new CloudConsoleError("console_route_invalid", 400);
  }
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(label + " must be an object");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(label + " must be a plain object");
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw new TypeError(label + " contains an unsupported field");
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw new TypeError(label + " is missing a required field");
  }
}
