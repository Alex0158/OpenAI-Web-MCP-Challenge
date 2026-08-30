import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { pathToFileURL } from "node:url";
import {
  DATABASE_PATH,
  DELIVERY_MODE,
  DELIVERY_TICKET_SECRET,
  DEFAULT_HOST,
  DEFAULT_ORIGIN,
  DEFAULT_PORT,
  DURABLE_ENROLLMENT_ENABLED,
  EFFECT_RECEIPT_SECRET,
  H1_DATABASE_PATH,
  H1_TRACE_PATH,
  H2_DATABASE_PATH,
  H2_DESTINATION_DATABASE_PATH,
  H2_RECEIPT_KEY_ID,
  H2_RECEIPT_SEALING_KEY,
  H2_TRACE_PATH,
  MVP_ROOT,
  TRACE_PATH,
  WORKFLOW_ID,
} from "./config.mjs";
import { openDatabase } from "./database.mjs";
import { WorkflowDomain, ConflictError } from "./domain.mjs";
import { TraceRecorder } from "./trace.mjs";
import { createSelectedAdapter } from "./adapters/selected-adapter.mjs";
import { GrantService, GrantConflictError } from "./receiver/grants.mjs";
import { EventReceiver, EventAuthenticationError, EventScopeError } from "./receiver/events.mjs";
import { renderConsentPage } from "./receiver/consent.mjs";
import { createCorrelationId } from "./ids.mjs";
import { signaturesMatch } from "./webmcp-manifest.mjs";
import { HeartbeatInbox, HeartbeatInboxError } from "./receiver/heartbeat-inbox.mjs";
import { H1ContinuationService } from "./h1-continuation.mjs";
import { ReentryTicketError } from "./reentry-ticket.mjs";
import { DurableEnrollmentError, DurableEnrollmentService } from "./receiver/durable-enrollment.mjs";
import {
  DurableContextReceiptSink,
  DurableReceiptSinkError,
  openDurableReceiptDestination,
} from "./adapters/durable-receipt-sink.mjs";

export function createRuntime({
  databasePath = DATABASE_PATH,
  tracePath = TRACE_PATH,
  origin = DEFAULT_ORIGIN,
  clock = () => new Date(),
  manifestSecret,
  eventSecret,
  adapterMode,
  deliveryMode = DELIVERY_MODE,
  deliveryTicketSecret = DELIVERY_TICKET_SECRET,
  effectReceiptSecret = EFFECT_RECEIPT_SECRET,
  durableEnrollmentEnabled = DURABLE_ENROLLMENT_ENABLED,
  durableDestinationPath = H2_DESTINATION_DATABASE_PATH,
  receiptSealingKey = H2_RECEIPT_SEALING_KEY,
  receiptKeyId = H2_RECEIPT_KEY_ID,
  durableEnrollmentFaultInjector = null,
  durableReceiptSinkFaultInjector = null,
  allowH1TestPaths = false,
  allowH2TestPaths = false,
  receiverClientToken = process.env.WEBMCP_P0_RECEIVER_CLIENT_TOKEN,
} = {}) {
  if (deliveryMode === "heartbeat" && (!deliveryTicketSecret || !effectReceiptSecret)) {
    throw new Error("Heartbeat delivery requires injected H1 ticket and effect secrets");
  }
  if (durableEnrollmentEnabled && deliveryMode !== "heartbeat") {
    throw new Error("Durable H2 enrollment requires heartbeat delivery mode");
  }
  if (durableEnrollmentEnabled && !receiptSealingKey) {
    throw new Error("Durable H2 enrollment requires an injected receipt sealing key");
  }
  if (
    deliveryMode === "heartbeat" &&
    !durableEnrollmentEnabled &&
    !allowH1TestPaths &&
    (
      typeof databasePath !== "string" ||
      typeof tracePath !== "string" ||
      path.resolve(databasePath) !== H1_DATABASE_PATH ||
      path.resolve(tracePath) !== H1_TRACE_PATH
    )
  ) {
    throw new Error("Heartbeat delivery requires the isolated H1 database and trace paths");
  }
  if (
    durableEnrollmentEnabled &&
    !allowH2TestPaths &&
    (
      typeof databasePath !== "string" ||
      typeof tracePath !== "string" ||
      typeof durableDestinationPath !== "string" ||
      path.resolve(databasePath) !== H2_DATABASE_PATH ||
      path.resolve(tracePath) !== H2_TRACE_PATH ||
      path.resolve(durableDestinationPath) !== H2_DESTINATION_DATABASE_PATH
    )
  ) {
    throw new Error("Durable H2 enrollment requires isolated H2 Receiver, destination, and trace paths");
  }
  if (
    durableEnrollmentEnabled &&
    (
      typeof databasePath !== "string" ||
      typeof durableDestinationPath !== "string" ||
      databasePath === ":memory:" ||
      durableDestinationPath === ":memory:" ||
      path.resolve(databasePath) === path.resolve(durableDestinationPath)
    )
  ) {
    throw new Error("Durable H2 enrollment requires distinct filesystem Receiver and destination databases");
  }
  const database = openDatabase(databasePath, {
    enableHeartbeat: deliveryMode === "heartbeat",
    enableDurableEnrollment: durableEnrollmentEnabled,
    busyTimeoutMs: durableEnrollmentEnabled ? 5_000 : 0,
  });
  const trace = new TraceRecorder({
    tracePath,
    clock,
    redactManagedContext: durableEnrollmentEnabled,
  });
  const adapter = createSelectedAdapter({ database, trace, clock, adapterMode, cwd: MVP_ROOT });
  const domain = new WorkflowDomain({
    database,
    origin,
    trace,
    clock,
    heartbeatEnabled: deliveryMode === "heartbeat",
    durableEnrollmentEnabled,
  });
  domain.ensureSeeded();
  const grants = new GrantService({
    database,
    adapter,
    origin,
    trace,
    clock,
    ...(manifestSecret ? { manifestSecret } : {}),
  });
  const heartbeatInbox = new HeartbeatInbox({
    database,
    origin,
    trace,
    clock,
    deliveryTicketSecret,
    effectReceiptSecret,
  });
  const h1Continuation = new H1ContinuationService({
    database,
    origin,
    trace,
    clock,
    deliveryTicketSecret,
    effectReceiptSecret,
  });
  const receiptDestinationDatabase = durableEnrollmentEnabled
    ? openDurableReceiptDestination(durableDestinationPath)
    : null;
  const durableReceiptSink = receiptDestinationDatabase
    ? new DurableContextReceiptSink({
        database: receiptDestinationDatabase,
        clock,
        faultInjector: durableReceiptSinkFaultInjector,
      })
    : null;
  const durableEnrollment = durableReceiptSink
    ? new DurableEnrollmentService({
        database,
        receiptSink: durableReceiptSink,
        origin,
        trace,
        clock,
        ...(manifestSecret ? { manifestSecret } : {}),
        receiptSealingKey,
        receiptKeyId,
        faultInjector: durableEnrollmentFaultInjector,
      })
    : null;
  const events = new EventReceiver({
    database,
    adapter,
    origin,
    trace,
    clock,
    deliveryMode,
    ...(eventSecret ? { eventSecret } : {}),
  });
  return {
    database,
    trace,
    adapter,
    domain,
    grants,
    events,
    heartbeatInbox,
    h1Continuation,
    durableEnrollment,
    durableReceiptSink,
    receiptDestinationDatabase,
    origin,
    deliveryMode,
    durableEnrollmentEnabled,
    receiverClientToken,
  };
}

export function createHttpServer(runtime) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, runtime.origin);
    const correlationId = request.headers["x-correlation-id"] ?? createCorrelationId();
    response.setHeader("X-Correlation-Id", correlationId);

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return sendJson(response, 200, {
          status: "ok",
          fixture: "webmcp-reentry-p0",
          adapter: runtime.adapter.name,
          adapter_proof_classification: runtime.adapter.proofClassification ?? "synthetic_only",
          delivery_mode: runtime.deliveryMode,
          durable_enrollment_enabled: runtime.durableEnrollmentEnabled,
          trusted_context_capture_configured: Boolean(runtime.receiverClientToken),
        });
      }

      if (request.method === "GET" && url.pathname === `/workflows/${WORKFLOW_ID}`) {
        return sendFile(response, path.join(MVP_ROOT, "public", "index.html"), "text/html; charset=utf-8");
      }
      if (request.method === "GET" && url.pathname === "/app.js") {
        return sendFile(response, path.join(MVP_ROOT, "public", "app.js"), "text/javascript; charset=utf-8");
      }
      if (request.method === "GET" && url.pathname === "/styles.css") {
        return sendFile(response, path.join(MVP_ROOT, "public", "styles.css"), "text/css; charset=utf-8");
      }
      const inboxPageMatch = url.pathname.match(/^\/receiver\/inboxes\/([^/]+)$/);
      if (request.method === "GET" && inboxPageMatch) {
        return sendFile(response, path.join(MVP_ROOT, "public", "receiver-inbox.html"), "text/html; charset=utf-8");
      }
      if (request.method === "GET" && url.pathname === "/receiver-inbox.js") {
        return sendFile(response, path.join(MVP_ROOT, "public", "receiver-inbox.js"), "text/javascript; charset=utf-8");
      }

      if (request.method === "GET" && url.pathname === `/api/workflows/${WORKFLOW_ID}`) {
        const hostBinding = runtime.grants.getHostBinding();
        return sendJson(response, 200, {
          ...runtime.domain.getWorkflow(),
          available_site_tools: runtime.domain.siteToolNames(),
          host_binding: runtime.durableEnrollmentEnabled && hostBinding
            ? { registered: true, grant_summary: hostBinding.grant_summary }
            : hostBinding,
          delivery_mode: runtime.deliveryMode,
        });
      }
      if (request.method === "POST" && url.pathname === `/api/workflows/${WORKFLOW_ID}/prepare`) {
        return sendJson(response, 200, runtime.domain.prepareArtifact(await readJson(request), correlationId));
      }
      if (request.method === "GET" && url.pathname === `/api/workflows/${WORKFLOW_ID}/reentry-offer`) {
        return sendJson(response, 200, runtime.grants.issueManifest(correlationId));
      }
      if (request.method === "POST" && url.pathname === `/api/workflows/${WORKFLOW_ID}/binding`) {
        const input = await readJson(request);
        const result = runtime.durableEnrollmentEnabled
          ? runtime.durableEnrollment.registerHostBinding(input, correlationId)
          : runtime.grants.registerHostBinding(input, correlationId);
        return sendJson(response, 200, result);
      }
      if (request.method === "POST" && url.pathname === `/api/workflows/${WORKFLOW_ID}/continue`) {
        const input = await readJson(request);
        const result = runtime.deliveryMode === "heartbeat"
          ? runtime.h1Continuation.continueArtifact(input, correlationId)
          : runtime.domain.continueArtifact(input, correlationId);
        return sendJson(response, 200, result);
      }
      if (request.method === "POST" && url.pathname === `/api/workflows/${WORKFLOW_ID}/commit`) {
        if (request.headers["x-human-action"] !== "true") {
          return sendJson(response, 403, { error: "Commit is available only through the human UI control" });
        }
        return sendJson(response, 200, runtime.domain.commitByHuman(correlationId));
      }

      if (request.method === "POST" && url.pathname === "/api/receiver/context-captures") {
        requireReceiverClient(request, runtime.receiverClientToken);
        return sendJson(response, 201, await runtime.grants.captureCurrentContext(correlationId));
      }
      if (request.method === "POST" && url.pathname === "/api/receiver/enroll") {
        return sendJson(response, 201, runtime.grants.beginEnrollment(await readJson(request), correlationId));
      }

      const consentMatch = url.pathname.match(/^\/receiver\/consent\/([^/]+)$/);
      if (request.method === "GET" && consentMatch) {
        return sendHtml(response, 200, renderConsentPage(runtime.grants.getConsentDetails(consentMatch[1])));
      }
      const decisionMatch = url.pathname.match(/^\/api\/receiver\/consent\/([^/]+)\/(approve|decline)$/);
      if (request.method === "POST" && decisionMatch) {
        const [, challengeId, decision] = decisionMatch;
        const humanAction = request.headers["x-receiver-human-action"] === "true";
        const result = decision === "approve"
          ? runtime.durableEnrollmentEnabled
            ? runtime.durableEnrollment.approveChallenge(challengeId, correlationId, { humanAction })
            : await runtime.grants.approveChallenge(challengeId, correlationId, { humanAction })
          : runtime.grants.declineChallenge(challengeId, correlationId, { humanAction });
        const heartbeatReceipt = decision === "approve" &&
          runtime.deliveryMode === "heartbeat" &&
          !runtime.durableEnrollmentEnabled
          ? runtime.heartbeatInbox.createForGrant(result.grant_id)
          : null;
        const statusCode = decision === "approve" && runtime.durableEnrollmentEnabled ? 202 : 200;
        return sendJson(response, statusCode, heartbeatReceipt ? { ...result, ...heartbeatReceipt } : result);
      }

      const enrollmentStatusMatch = url.pathname.match(
        /^\/api\/receiver\/consent\/([^/]+)\/status$/,
      );
      if (request.method === "GET" && enrollmentStatusMatch && runtime.durableEnrollmentEnabled) {
        return sendJson(
          response,
          200,
          runtime.durableEnrollment.getStatus(enrollmentStatusMatch[1], correlationId),
        );
      }

      const pendingMatch = url.pathname.match(/^\/api\/receiver\/inboxes\/([^/]+)\/pending$/);
      if (request.method === "GET" && pendingMatch) {
        return sendJson(response, 200, runtime.heartbeatInbox.getPending(decodePathSegment(pendingMatch[1])));
      }
      const acknowledgeMatch = url.pathname.match(/^\/api\/receiver\/inboxes\/([^/]+)\/ack$/);
      if (request.method === "POST" && acknowledgeMatch) {
        const input = await readJson(request);
        requireExactKeys(input, ["effect_receipt"], "Inbox acknowledgement");
        return sendJson(response, 200, runtime.heartbeatInbox.acknowledge(
          decodePathSegment(acknowledgeMatch[1]),
          input.effect_receipt,
        ));
      }

      if (request.method === "POST" && url.pathname === "/api/test/transition") {
        return sendJson(response, 200, runtime.domain.transitionToReady(correlationId));
      }
      if (request.method === "POST" && url.pathname === "/api/receiver/events") {
        const rawBody = await readRawBody(request);
        const result = await runtime.events.receive({
          rawBody,
          timestamp: request.headers["x-event-timestamp"],
          signature: request.headers["x-event-signature"],
          correlationId,
        });
        return sendJson(response, 202, result);
      }
      return sendJson(response, 404, { error: "Route not found" });
    } catch (error) {
      const statusCode = error.statusCode ?? (
        error instanceof SyntaxError || error instanceof TypeError ? 400 : 500
      );
      runtime.trace?.record({
        correlation_id: correlationId,
        component: "receiver",
        action: "request_rejected",
        workflow_id: WORKFLOW_ID,
        outcome: "rejected",
        details: { path: redactRequestPath(url.pathname), error: error.message },
      });
      return sendJson(response, statusCode, { error: error.message, error_type: error.name });
    }
  });
}

function sendFile(response, filePath, contentType) {
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(fs.readFileSync(filePath));
}

function sendHtml(response, statusCode, html) {
  response.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(html);
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(value));
}

function readRawBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > 64 * 1024) {
        reject(new TypeError("Request body exceeds the fixture limit"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

async function readJson(request) {
  const raw = await readRawBody(request);
  if (!raw) return {};
  return JSON.parse(raw);
}

function requireReceiverClient(request, expectedToken) {
  const actualToken = request.headers["x-receiver-client-token"];
  if (!expectedToken || !signaturesMatch(actualToken, expectedToken)) {
    const error = new Error("Trusted Receiver client authentication is required");
    error.statusCode = 403;
    throw error;
  }
}

function decodePathSegment(value) {
  try {
    const decoded = decodeURIComponent(value);
    if (!decoded || decoded.includes("/")) throw new Error("invalid segment");
    return decoded;
  } catch {
    const error = new TypeError("Route contains an invalid encoded path segment");
    error.statusCode = 400;
    throw error;
  }
}

function requireExactKeys(value, fields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) {
    throw new TypeError(`${label} fields do not match the strict contract`);
  }
}

function redactRequestPath(pathname) {
  return pathname
    .replace(/^\/receiver\/inboxes\/[^/]+/, "/receiver/inboxes/[redacted]")
    .replace(/^\/api\/receiver\/inboxes\/[^/]+/, "/api/receiver/inboxes/[redacted]");
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  const runtime = createRuntime();
  const server = createHttpServer(runtime);
  server.listen(DEFAULT_PORT, DEFAULT_HOST, () => {
    process.stdout.write(`WebMCP fixture (${runtime.deliveryMode}) listening at ${DEFAULT_ORIGIN}/workflows/${WORKFLOW_ID}\n`);
  });
}

export {
  ConflictError,
  GrantConflictError,
  EventAuthenticationError,
  EventScopeError,
  HeartbeatInboxError,
  ReentryTicketError,
  DurableEnrollmentError,
  DurableReceiptSinkError,
};
