const EVENT_ROUTE_OPTION_FIELDS = Object.freeze(["sdk", "getEventInput"]);
const MANIFEST_ROUTE_OPTION_FIELDS = Object.freeze(["sdk", "getManifestInput"]);
const CONSENT_SESSION_ROUTE_OPTION_FIELDS = Object.freeze(["sdk", "getConsentSessionInput"]);
const CONSENT_DECISION_ROUTE_OPTION_FIELDS = Object.freeze(["sdk", "getConsentDecisionInput"]);
const NO_STORE_HEADERS = Object.freeze({
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
});

/**
 * Build a Next.js Route Handler for the Host -> Receiver event step.
 *
 * The callback must load the current binding and workflow on the server. Do not trust a browser
 * request to supply a private binding or current state by itself.
 */
export function createEventRoute(options) {
  requireExactRecord(options, EVENT_ROUTE_OPTION_FIELDS, EVENT_ROUTE_OPTION_FIELDS, "Event route options");
  requireSdk(options.sdk, "sendEvent");
  requireFunction(options.getEventInput, "getEventInput");

  return async function POST(request) {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, { error: { code: "host_sdk_request_invalid" } });
    }

    try {
      const input = await options.getEventInput({ body, request });
      const acceptance = await options.sdk.sendEvent(input);
      return jsonResponse(202, acceptance);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/**
 * Build a Next.js Route Handler that returns a signed Manifest for the Host page to expose.
 * Creating or displaying a Manifest is not the same as creating a Grant.
 */
export function createManifestRoute(options) {
  requireExactRecord(
    options,
    MANIFEST_ROUTE_OPTION_FIELDS,
    MANIFEST_ROUTE_OPTION_FIELDS,
    "Manifest route options",
  );
  requireSdk(options.sdk, "createManifest");
  requireFunction(options.getManifestInput, "getManifestInput");

  return async function GET(request) {
    try {
      const input = await options.getManifestInput({ request });
      return jsonResponse(200, options.sdk.createManifest(input));
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/**
 * Build a Next.js Route Handler for the Host server -> Reentry consent-session step.
 *
 * The callback must load the signed Manifest and the authenticated Host subject on the server.
 * The browser request is only a trigger; it is not the source of identity or authority.
 */
export function createConsentSessionRoute(options) {
  requireExactRecord(
    options,
    CONSENT_SESSION_ROUTE_OPTION_FIELDS,
    CONSENT_SESSION_ROUTE_OPTION_FIELDS,
    "Consent session route options",
  );
  requireSdk(options.sdk, "createConsentSession");
  requireFunction(options.getConsentSessionInput, "getConsentSessionInput");

  return async function POST(request) {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, { error: { code: "host_sdk_request_invalid" } });
    }

    try {
      const input = await options.getConsentSessionInput({ body, request });
      const session = await options.sdk.createConsentSession(input);
      return jsonResponse(session.duplicate === true ? 200 : 201, session);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/**
 * Build a Next.js Route Handler for the Host server -> Reentry consent-decision step.
 *
 * The callback must supply the authenticated Host subject on the server. The browser may provide
 * the public challenge identifier, opaque consent token, and approve/decline action.
 */
export function createConsentDecisionRoute(options) {
  requireExactRecord(
    options,
    CONSENT_DECISION_ROUTE_OPTION_FIELDS,
    CONSENT_DECISION_ROUTE_OPTION_FIELDS,
    "Consent decision route options",
  );
  requireSdk(options.sdk, "decideConsent");
  requireFunction(options.getConsentDecisionInput, "getConsentDecisionInput");

  return async function POST(request) {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, { error: { code: "host_sdk_request_invalid" } });
    }

    try {
      const input = await options.getConsentDecisionInput({ body, request });
      return jsonResponse(200, await options.sdk.decideConsent(input));
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function createConsentStatusRoute(options) {
  requireExactRecord(
    options,
    ["sdk", "getConsentStatusInput"],
    ["sdk", "getConsentStatusInput"],
    "Consent status Route Handler options",
  );
  requireSdk(options.sdk, "getConsentSession");
  requireFunction(options.getConsentStatusInput, "getConsentStatusInput");

  return async function GET(request, context) {
    try {
      const input = await options.getConsentStatusInput(request, context);
      return jsonResponse(200, await options.sdk.getConsentSession(input));
    } catch (error) {
      return errorResponse(error);
    }
  };
}

function jsonResponse(status, value) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      ...NO_STORE_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function errorResponse(error) {
  const status = Number.isInteger(error?.statusCode) && error.statusCode >= 400 && error.statusCode <= 599
    ? error.statusCode
    : 500;
  const code = typeof error?.code === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(error.code)
    ? error.code
    : "host_sdk_route_failed";
  return jsonResponse(status, { error: { code } });
}

function requireSdk(value, method) {
  if (!value || typeof value !== "object" || typeof value[method] !== "function") {
    throw new TypeError(`Next.js Host SDK route requires sdk.${method}`);
  }
}

function requireFunction(value, label) {
  if (typeof value !== "function") throw new TypeError(`Next.js Host SDK route requires ${label}`);
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === "symbol" || !descriptor?.enumerable || !("value" in descriptor)) {
      throw new TypeError(`${label} contains an invalid property`);
    }
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw new TypeError(`${label} contains an unsupported field`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw new TypeError(`${label} is missing a required field`);
  }
}
