import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CodexDesktopDemoAdapter } from "./lib/adapters/codex-desktop-demo.mjs";
import {
  CLARIFICATION_EVENT,
  WORKFLOW_ID,
} from "./lib/apps/tenderrelay/domain.mjs";
import { TenderRelayHostAdapter } from "./lib/apps/tenderrelay/host-adapter.mjs";
import { DryRunAgentAdapter } from "./lib/infrastructure/agent-adapter.mjs";
import { ContinuationApplication } from "./lib/infrastructure/continuation-application.mjs";
import { ContinuationHostSdk } from "./lib/infrastructure/host-sdk.mjs";
import { ReceiverCore } from "./lib/infrastructure/receiver-core.mjs";
import { JsonFileStateStore } from "./lib/infrastructure/state-store.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const publicDir = join(root, "public");
const stateFile =
  process.env.CONTINUATION_STATE_FILE ??
  process.env.TENDERRELAY_STATE_FILE ??
  join(root, ".tenderrelay", "state.json");
const port = Number(process.env.PORT ?? 43118);
const host = process.env.HOST ?? "127.0.0.1";
const origin = `http://${host}:${port}`;
const fallbackSigningSecret = "local-kill-test-secret-change-me";
const signingSecret =
  process.env.CONTINUATION_EVENT_SECRET ??
  process.env.TENDERRELAY_EVENT_SECRET ??
  fallbackSigningSecret;
const signingKeyId = process.env.CONTINUATION_KEY_ID ?? "local-kill-test-key";
const receiverMode =
  process.env.CONTINUATION_RECEIVER_MODE ??
  process.env.TENDERRELAY_RECEIVER_MODE ??
  "dry-run";
const threadId =
  process.env.CONTINUATION_CONTEXT_ID ??
  process.env.TENDERRELAY_THREAD_ID ??
  "";
const bundledCodex = "/Applications/ChatGPT.app/Contents/Resources/codex";
const codexBinary =
  process.env.CONTINUATION_CODEX_BIN ??
  process.env.TENDERRELAY_CODEX_BIN ??
  (existsSync(bundledCodex) ? bundledCodex : "codex");

if (
  process.env.CONTINUATION_PUBLIC_MODE === "true" &&
  signingSecret === fallbackSigningSecret
) {
  throw new Error(
    "CONTINUATION_EVENT_SECRET must be configured when CONTINUATION_PUBLIC_MODE=true",
  );
}

const hostSdk = new ContinuationHostSdk({
  origin,
  signingSecret,
  keyId: signingKeyId,
});
const hostAdapter = new TenderRelayHostAdapter({ hostSdk });
const agentAdapter =
  receiverMode === "live"
    ? new CodexDesktopDemoAdapter({
        threadId,
        codexBinary,
        cwd: root,
      })
    : new DryRunAgentAdapter({ contextBinding: threadId });
const receiver = new ReceiverCore({
  adapter: agentAdapter,
  expectedOrigin: origin,
  keyResolver: ({ keyId }) => (keyId === signingKeyId ? signingSecret : null),
});
const application = new ContinuationApplication({
  hostAdapter,
  receiver,
  stateStore: new JsonFileStateStore(stateFile),
});
const siteToolEvidence = inspectTenderSiteToolBoundary();

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
    const state = application.publicState();
    json(res, 200, {
      ok: true,
      hostAdapter: hostAdapter.id,
      agentAdapter: agentAdapter.describe(),
      workflowStatus: state.status,
      stateVersion: state.stateVersion,
    });
    return;
  }

  if (method === "GET" && url.pathname === "/api/state") {
    json(res, 200, application.publicState());
    return;
  }

  if (method === "GET" && url.pathname === "/api/reentry-manifest") {
    json(res, 200, application.manifest());
    return;
  }

  if (method === "GET" && url.pathname === "/api/diagnostics") {
    json(res, 200, {
      ...application.diagnostics(),
      siteToolEvidence,
    });
    return;
  }

  if (method === "POST" && url.pathname === "/api/bid/draft") {
    const body = await readJson(req);
    application.mutateHost((state) => hostAdapter.updateBidDraft(state, body));
    json(res, 200, application.publicState());
    return;
  }

  if (method === "POST" && url.pathname === "/api/grants/attach") {
    const body = await readJson(req);
    const result = application.activateGrant(CLARIFICATION_EVENT, {
      humanApproved: body.humanApproved,
    });
    json(res, 200, {
      grant: result.binding,
      manifest: result.manifest,
      state: result.state,
    });
    return;
  }

  if (method === "POST" && url.pathname === "/api/bid/submit") {
    const body = await readJson(req);
    application.mutateHost((state) => hostAdapter.submitBid(state, body));
    json(res, 200, application.publicState());
    return;
  }

  if (method === "POST" && url.pathname === "/api/clarification/draft") {
    const body = await readJson(req);
    application.mutateHost((state) =>
      hostAdapter.updateClarificationDraft(state, body),
    );
    json(res, 200, application.publicState());
    return;
  }

  if (method === "POST" && url.pathname === "/api/continuations/events") {
    const body = await readJson(req);
    const result = await application.acceptAndContinue(body.event ?? body);
    json(res, result.delivery.status === "failed" ? 502 : 202, result);
    return;
  }

  if (
    method === "POST" &&
    url.pathname === "/api/reviewer/request-clarification"
  ) {
    const body = await readJson(req);
    const transition = (state) =>
      hostAdapter.requestClarification(state, {
        feedback:
          body.feedback ??
          "Please confirm whether Net-30 payment terms are included and identify the evidence supporting your proposed incident response commitment.",
        expectedStateVersion: body.expectedStateVersion,
      });
    if (url.searchParams.get("dispatch") === "external") {
      const result = application.commitHostTransition(transition);
      json(res, 202, {
        ...result,
        delivery: { status: "awaiting_external_sender" },
      });
    } else {
      const result = await application.transitionAndContinue(transition);
      json(res, result.delivery.status === "failed" ? 502 : 202, result);
    }
    return;
  }

  if (method === "POST" && url.pathname === "/api/test/reset") {
    json(res, 200, application.reset());
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

function inspectTenderSiteToolBoundary() {
  const source = readFileSync(join(publicDir, "tender.js"), "utf8");
  const forbiddenNames = [
    "attach_continuation_grant",
    "submit_approved_bid",
    "submit_approved_clarification",
  ];
  const exposedNames = forbiddenNames.filter((name) =>
    new RegExp(`name:\\s*["']${name}["']`).test(source),
  );
  return {
    checkedSurface: "public/tender.js",
    forbiddenNames,
    exposedNames,
    consequentialSubmissionUnavailable: exposedNames.length === 0,
  };
}

export function startServer() {
  const server = createServer((req, res) => {
    route(req, res).catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        json(res, error.statusCode ?? 400, { ok: false, error: error.message });
      } else {
        res.end();
      }
    });
  });
  server.listen(port, host, () => {
    application.persist();
    console.log(`TenderRelay Host Adapter: ${origin}/tenders/${WORKFLOW_ID}`);
    console.log(`Reviewer trigger: ${origin}/reviewer/tenders/${WORKFLOW_ID}`);
    console.log(`Receiver adapter: ${agentAdapter.id} (${receiverMode})`);
    console.log(`Agent context binding configured: ${Boolean(threadId)}`);
  });
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer();
}
