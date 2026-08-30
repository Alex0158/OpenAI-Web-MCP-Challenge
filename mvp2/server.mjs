import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  acceptAtGateway,
  attachGrant,
  createInitialState,
  getReentryManifest,
  publicState,
  requestClarificationTransition,
  signEvent,
  submitBid,
  threadBindingHash,
  updateBidDraft,
  updateClarificationDraft,
  WORKFLOW_ID,
} from "./lib/core.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const publicDir = join(root, "public");
const stateFile =
  process.env.TENDERRELAY_STATE_FILE ?? join(root, ".tenderrelay", "state.json");
const port = Number(process.env.PORT ?? 43118);
const host = process.env.HOST ?? "127.0.0.1";
const origin = `http://${host}:${port}`;
const eventSecret =
  process.env.TENDERRELAY_EVENT_SECRET ?? "local-kill-test-secret-change-me";
const receiverMode = process.env.TENDERRELAY_RECEIVER_MODE ?? "dry-run";
const threadId = process.env.TENDERRELAY_THREAD_ID ?? "";
const bundledCodex = "/Applications/ChatGPT.app/Contents/Resources/codex";
const codexBinary =
  process.env.TENDERRELAY_CODEX_BIN ??
  (existsSync(bundledCodex) ? bundledCodex : "codex");

let state = loadState();

function loadState() {
  if (!existsSync(stateFile)) return createInitialState();
  return JSON.parse(readFileSync(stateFile, "utf8"));
}

function persistState() {
  mkdirSync(dirname(stateFile), { recursive: true });
  const temporary = `${stateFile}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  renameSync(temporary, stateFile);
}

function addAudit(action, details = {}) {
  state.audit.push({
    id: cryptoRandomId(),
    action,
    details,
    stateVersion: state.stateVersion,
    createdAt: new Date().toISOString(),
  });
}

function cryptoRandomId() {
  return createHash("sha256")
    .update(`${Date.now()}:${Math.random()}`)
    .digest("hex")
    .slice(0, 24);
}

function fixedReentryMessage(event) {
  return [
    "TenderRelay authorized re-entry event.",
    `Event type: ${event.eventType}.`,
    `Workflow: ${event.workflowId}.`,
    `Expected state version: ${event.stateVersion}.`,
    `Open the exact canonical URL ${event.resumeUrl} in the Codex in-app browser.`,
    "Use genuine page Site Tools only: first get_current_tender_state, then read_clarification_request, then update_clarification_draft.",
    "Prepare a concise response grounded in the current page feedback. Do not call the REST API directly and do not submit the clarification.",
    "After updating the visible draft, report whether canonical URL opening and second-stage Site Tool invocation succeeded.",
  ].join(" ");
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      } else {
        reject(
          new Error(
            `Receiver command exited ${code}: ${stderr.trim() || stdout.trim()}`,
          ),
        );
      }
    });
  });
}

async function deliverToReceiver(event) {
  const message = fixedReentryMessage(event);
  if (receiverMode !== "live") {
    return {
      status: "dry_run",
      message,
      threadBindingHash: threadBindingHash(threadId),
    };
  }
  if (!threadId) {
    throw new Error("TENDERRELAY_THREAD_ID is required in live Receiver mode");
  }

  const result = await runProcess(codexBinary, [
    "queue",
    "--thread",
    threadId,
    "--message",
    message,
  ]);
  return {
    status: "queued",
    threadBindingHash: threadBindingHash(threadId),
    receiverOutput: result.stdout.slice(0, 500),
  };
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function text(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("Request body is too large");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const assetTypes = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".html": "text/html; charset=utf-8",
};

function serveFile(res, filename) {
  const fullPath = join(publicDir, filename);
  if (!existsSync(fullPath)) {
    text(res, 404, "Not found");
    return;
  }
  text(
    res,
    200,
    readFileSync(fullPath, "utf8"),
    assetTypes[extname(fullPath)] ?? "application/octet-stream",
  );
}

async function route(req, res) {
  const url = new URL(req.url, origin);
  const method = req.method ?? "GET";

  if (method === "GET" && url.pathname === "/health") {
    json(res, 200, {
      ok: true,
      receiverMode,
      hasThreadBinding: Boolean(threadId),
      workflowStatus: state.status,
      stateVersion: state.stateVersion,
    });
    return;
  }

  if (method === "GET" && url.pathname === "/api/state") {
    json(res, 200, publicState(state));
    return;
  }

  if (method === "GET" && url.pathname === "/api/reentry-manifest") {
    json(res, 200, getReentryManifest(state, origin));
    return;
  }

  if (method === "GET" && url.pathname === "/api/diagnostics") {
    json(res, 200, {
      workflowId: state.workflowId,
      status: state.status,
      stateVersion: state.stateVersion,
      receiver: {
        mode: receiverMode,
        configured: receiverMode !== "live" || Boolean(threadId),
        threadBindingHash: threadBindingHash(threadId),
      },
      grant: state.grant,
      events: state.events,
      runs: state.runs,
      audit: state.audit,
    });
    return;
  }

  if (method === "POST" && url.pathname === "/api/bid/draft") {
    const body = await readJson(req);
    updateBidDraft(state, body.response);
    persistState();
    json(res, 200, publicState(state));
    return;
  }

  if (method === "POST" && url.pathname === "/api/grants/attach") {
    const body = await readJson(req);
    const grant = attachGrant(state, body);
    persistState();
    json(res, 200, { grant, state: publicState(state) });
    return;
  }

  if (method === "POST" && url.pathname === "/api/bid/submit") {
    const body = await readJson(req);
    submitBid(state, body);
    persistState();
    json(res, 200, publicState(state));
    return;
  }

  if (method === "POST" && url.pathname === "/api/clarification/draft") {
    const body = await readJson(req);
    updateClarificationDraft(state, body.response);
    persistState();
    json(res, 200, publicState(state));
    return;
  }

  if (
    method === "POST" &&
    url.pathname === "/api/reviewer/request-clarification"
  ) {
    const body = await readJson(req);
    const unsignedEvent = requestClarificationTransition(state, {
      origin,
      feedback:
        body.feedback ??
        "Please confirm whether Net-30 payment terms are included and identify the evidence supporting your proposed incident response commitment.",
    });
    const event = signEvent(unsignedEvent, eventSecret);
    const gateway = acceptAtGateway(state, event, eventSecret);
    persistState();

    let delivery;
    try {
      delivery = await deliverToReceiver(event);
      state.runs.push({
        runId: `run_${cryptoRandomId()}`,
        eventId: event.eventId,
        status: delivery.status,
        threadBindingHash: delivery.threadBindingHash,
        queuedAt: new Date().toISOString(),
        resumeUrl: event.resumeUrl,
      });
      state.events.at(-1).deliveryStatus = delivery.status;
      addAudit("agent.reentry_queued", {
        eventId: event.eventId,
        deliveryStatus: delivery.status,
      });
      persistState();
    } catch (error) {
      delivery = { status: "failed", error: error.message };
      state.runs.push({
        runId: `run_${cryptoRandomId()}`,
        eventId: event.eventId,
        status: "failed",
        error: error.message,
        queuedAt: new Date().toISOString(),
        resumeUrl: event.resumeUrl,
      });
      state.events.at(-1).deliveryStatus = "failed";
      addAudit("agent.reentry_failed", {
        eventId: event.eventId,
        error: error.message,
      });
      persistState();
    }

    json(res, delivery.status === "failed" ? 502 : 202, {
      event,
      gateway,
      delivery,
      state: publicState(state),
    });
    return;
  }

  if (method === "POST" && url.pathname === "/api/test/reset") {
    state = createInitialState();
    persistState();
    json(res, 200, publicState(state));
    return;
  }

  if (method === "GET" && url.pathname === "/") {
    res.writeHead(302, { Location: `/tenders/${WORKFLOW_ID}` });
    res.end();
    return;
  }
  if (method === "GET" && url.pathname === `/tenders/${WORKFLOW_ID}`) {
    serveFile(res, "tender.html");
    return;
  }
  if (
    method === "GET" &&
    url.pathname === `/reviewer/tenders/${WORKFLOW_ID}`
  ) {
    serveFile(res, "reviewer.html");
    return;
  }
  if (method === "GET" && url.pathname === "/diagnostics/continuation") {
    serveFile(res, "diagnostics.html");
    return;
  }
  if (method === "GET" && url.pathname.startsWith("/assets/")) {
    serveFile(res, url.pathname.slice("/assets/".length));
    return;
  }

  text(res, 404, "Not found");
}

export function startServer() {
  const server = createServer((req, res) => {
    route(req, res).catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        json(res, 400, { ok: false, error: error.message });
      } else {
        res.end();
      }
    });
  });
  server.listen(port, host, () => {
    persistState();
    console.log(`TenderRelay kill test: ${origin}/tenders/${WORKFLOW_ID}`);
    console.log(`Reviewer trigger: ${origin}/reviewer/tenders/${WORKFLOW_ID}`);
    console.log(`Receiver mode: ${receiverMode}`);
    console.log(`Thread binding configured: ${Boolean(threadId)}`);
  });
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer();
}

