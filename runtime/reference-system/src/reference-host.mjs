import { randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

import {
  AGENT_ACTIVATION_RESULT_TYPE,
  validateAgentActivation,
} from "../../../reentry-core/src/agent-adapter.mjs";
import {
  HOST_EFFECT_ATTESTATION_TYPE,
  HOST_EFFECT_OUTCOME,
} from "../../../reentry-core/src/receiver-delivery.mjs";

const MAX_BODY_BYTES = 8 * 1_024;

export function createReferenceHost(options = {}) {
  const workflowId = options.workflowId ?? "workflow_reference_001";
  const workflowType = options.workflowType ?? "domain-neutral-workflow";
  requireIdentifier(workflowId, "workflowId");
  requireIdentifier(workflowType, "workflowType");

  const state = {
    workflow_id: workflowId,
    workflow_type: workflowType,
    status: "DRAFT",
    state_version: 1,
    artifact: { revision: 0, content: "" },
    human_boundary: { committed: false },
  };
  const effectsByToken = new Map();
  const effectTokenByDelivery = new Map();
  const humanCommitToken = randomBytes(32).toString("base64url");
  let binding;
  let origin;
  let serverState = "created";

  const server = createServer((request, response) => {
    void handleRequest(request, response).catch(() => {
      if (!response.writableEnded && !response.destroyed) writeJson(response, 500, {
        error: { code: "reference_host_internal_error" },
      });
    });
  });

  const effectAuthority = Object.freeze({
    verifyEffect({ effectToken, expected }) {
      const record = effectsByToken.get(effectToken);
      if (!record || !sameExpectedEffect(record.expected, expected)) {
        throw new Error("Reference Host effect is unknown or out of scope");
      }
      return record.attestation;
    },
  });

  return Object.freeze({
    effectAuthority,
    start,
    stop,
    attachBinding,
    markReady,
    getBinding: () => binding,
    getEffectToken,
    snapshot,
    createAgentAdapter,
  });

  async function start({ host = "127.0.0.1", port = 0 } = {}) {
    if (serverState !== "created") throw new Error("Reference Host can be started exactly once");
    if (host !== "127.0.0.1") throw new TypeError("Reference Host is loopback-only");
    if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) {
      throw new TypeError("Reference Host port is invalid");
    }
    serverState = "starting";
    await new Promise((resolveListen, rejectListen) => {
      const onError = (error) => {
        server.off("listening", onListening);
        rejectListen(error);
      };
      const onListening = () => {
        server.off("error", onError);
        resolveListen();
      };
      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(port, host);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Reference Host address is unavailable");
    origin = `http://${host}:${address.port}`;
    serverState = "ready";
    return Object.freeze({
      origin,
      canonicalUrl: `${origin}/workflows/${workflowId}`,
      port: address.port,
    });
  }

  async function stop() {
    if (serverState === "stopped") return;
    serverState = "stopping";
    if (server.listening) {
      await new Promise((resolveClose, rejectClose) => {
        server.close((error) => error ? rejectClose(error) : resolveClose());
        server.closeIdleConnections?.();
      });
    }
    serverState = "stopped";
  }

  function attachBinding(value) {
    if (!value || typeof value !== "object" || value.workflow_id !== workflowId || value.status !== "active") {
      throw new TypeError("Reference Host binding is invalid");
    }
    binding = Object.freeze({ ...value });
    return binding;
  }

  function markReady() {
    if (!binding) throw new Error("Reference Host requires an approved binding before the event");
    if (state.status !== "DRAFT") throw new Error("Reference Host event can occur exactly once");
    state.status = "READY";
    state.state_version += 1;
    return snapshot();
  }

  function createAgentAdapter() {
    return Object.freeze({
      activate(rawActivation) {
        const activation = validateAgentActivation(rawActivation);
        applyAgentDraft(activation);
        return {
          type: AGENT_ACTIVATION_RESULT_TYPE,
          protocol_version: "0.1",
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

  function applyAgentDraft(activation) {
    if (effectTokenByDelivery.has(activation.delivery_id)) return;
    if (
      state.status !== "READY" ||
      activation.continuation.workflow_id !== workflowId ||
      activation.continuation.canonical_url !== `${origin}/workflows/${workflowId}` ||
      activation.continuation.state_version !== state.state_version
    ) {
      throw new Error("Reference Agent activation does not match current Host state");
    }
    updateDraft({
      content: `Prepared continuation draft for ${activation.continuation.event_type}.`,
      expected_state_version: state.state_version,
      expected_revision: state.artifact.revision,
    });
    state.status = "READY_FOR_HUMAN";

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
      confirmed_at: new Date().toISOString(),
    });
    effectsByToken.set(effectToken, Object.freeze({ expected, attestation }));
    effectTokenByDelivery.set(activation.delivery_id, effectToken);
  }

  function getEffectToken(deliveryId) {
    requireIdentifier(deliveryId, "deliveryId");
    const token = effectTokenByDelivery.get(deliveryId);
    if (!token) throw new Error("Reference Host effect is not ready");
    return token;
  }

  function updateDraft(input) {
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      Object.keys(input).sort().join(",") !== "content,expected_revision,expected_state_version" ||
      typeof input.content !== "string" ||
      input.content.length < 1 ||
      input.content.length > 2_000 ||
      !Number.isSafeInteger(input.expected_state_version) ||
      !Number.isSafeInteger(input.expected_revision)
    ) {
      throw hostFailure("reference_host_input_invalid", 400);
    }
    if (
      input.expected_state_version !== state.state_version ||
      input.expected_revision !== state.artifact.revision
    ) {
      throw hostFailure("reference_host_revision_conflict", 409);
    }
    if (state.human_boundary.committed) throw hostFailure("reference_host_already_committed", 409);
    state.artifact = {
      revision: state.artifact.revision + 1,
      content: input.content,
    };
    state.state_version += 1;
    return snapshot();
  }

  function snapshot() {
    return Object.freeze({
      workflow_id: state.workflow_id,
      workflow_type: state.workflow_type,
      status: state.status,
      state_version: state.state_version,
      artifact: Object.freeze({ ...state.artifact }),
      human_boundary: Object.freeze({ ...state.human_boundary }),
    });
  }

  async function handleRequest(request, response) {
    if (origin !== undefined && request.headers.host !== new URL(origin).host) {
      writeJson(response, 421, { error: { code: "reference_host_origin_invalid" } });
      return;
    }
    const workflowPath = `/workflows/${workflowId}`;
    const apiPath = `/api/workflows/${workflowId}`;
    if (request.method === "GET" && (request.url === "/" || request.url === workflowPath)) {
      writeHtml(response, renderPage({ workflowId, apiPath, humanCommitToken }));
      return;
    }
    if (request.method === "GET" && request.url === apiPath) {
      writeJson(response, 200, snapshot());
      return;
    }
    if (request.method === "POST" && request.url === `${apiPath}/draft`) {
      try {
        writeJson(response, 200, updateDraft(await readJson(request)));
      } catch (error) {
        writeJson(response, error.statusCode ?? 500, { error: { code: error.code ?? "reference_host_internal_error" } });
      }
      return;
    }
    if (request.method === "POST" && request.url === `${apiPath}/commit`) {
      let input;
      try {
        input = await readJson(request);
      } catch (error) {
        writeJson(response, error.statusCode ?? 400, { error: { code: error.code ?? "reference_host_input_invalid" } });
        return;
      }
      if (
        !input ||
        typeof input !== "object" ||
        Array.isArray(input) ||
        Object.keys(input).length !== 1 ||
        !secureEqual(input.commit_token, humanCommitToken)
      ) {
        writeJson(response, 403, { error: { code: "reference_host_human_control_invalid" } });
        return;
      }
      if (state.status !== "READY_FOR_HUMAN" || state.human_boundary.committed) {
        writeJson(response, 409, { error: { code: "reference_host_commit_unavailable" } });
        return;
      }
      state.human_boundary.committed = true;
      state.status = "COMMITTED";
      state.state_version += 1;
      writeJson(response, 200, snapshot());
      return;
    }
    writeJson(response, 404, { error: { code: "reference_host_not_found" } });
  }
}

function sameExpectedEffect(left, right) {
  return left && right && [
    "delivery_id",
    "event_id",
    "correlation_id",
    "workflow_id",
    "canonical_url",
    "human_boundary",
    "outcome",
  ].every((field) => left[field] === right[field]);
}

function renderPage({ workflowId, apiPath, humanCommitToken }) {
  const encodedWorkflowId = JSON.stringify(workflowId).replaceAll("<", "\\u003c");
  const encodedApiPath = JSON.stringify(apiPath).replaceAll("<", "\\u003c");
  const encodedCommitToken = JSON.stringify(humanCommitToken).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Re-entry Reference Host</title>
  <style>body{font:16px system-ui,sans-serif;max-width:52rem;margin:3rem auto;padding:0 1rem;color:#202123}main{display:grid;gap:1rem}.card{border:1px solid #ddd;border-radius:14px;padding:1rem;background:#fff}pre{white-space:pre-wrap;background:#f7f7f7;padding:1rem;border-radius:10px}button{font:inherit;padding:.7rem 1rem}#webmcp{color:#555}</style>
</head>
<body>
<main>
  <h1>Re-entry Reference Host</h1>
  <p>This page is the authoritative Host surface for workflow <strong>${workflowId}</strong>.</p>
  <section class="card"><h2>Current workflow</h2><pre id="state">Loading…</pre><p id="webmcp">Checking Site Tools…</p></section>
  <section class="card"><h2>Human boundary</h2><p>Final commit stays a visible human action and is never registered as a Site Tool.</p><button id="commit" type="button">Commit final result</button><p id="commit-status" role="status"></p></section>
</main>
<script type="module">
const workflowId=${encodedWorkflowId};
const apiPath=${encodedApiPath};
const humanCommitToken=${encodedCommitToken};
const stateNode=document.querySelector("#state");
const webmcpNode=document.querySelector("#webmcp");
async function refresh(){const response=await fetch(apiPath,{cache:"no-store"});const state=await response.json();stateNode.textContent=JSON.stringify(state,null,2);document.querySelector("#commit").disabled=state.status!=="READY_FOR_HUMAN"||state.human_boundary.committed;return state}
const initial=await refresh();
if(typeof document.modelContext?.registerTool!=="function"){
  webmcpNode.textContent="Site Tools are unavailable in this browser; the human page still works.";
}else{
  const schema=(properties={},required=[])=>({type:"object",properties,required,additionalProperties:false});
  await document.modelContext.registerTool({name:"get_current_workflow_state",description:"Read the current authoritative reference workflow state.",inputSchema:schema(),annotations:{readOnlyHint:true},execute:async()=>refresh()});
  if(initial.status==="READY"){
    await document.modelContext.registerTool({name:"update_continuation_draft",description:"Update the visible draft and stop before the human-only final commit.",inputSchema:schema({content:{type:"string",minLength:1,maxLength:2000},expected_state_version:{type:"integer",minimum:1},expected_revision:{type:"integer",minimum:0}},["content","expected_state_version","expected_revision"]),annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:false},execute:async(input)=>{const response=await fetch(apiPath+"/draft",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(input)});const value=await response.json();if(!response.ok)throw new Error(value.error?.code||"update_failed");await refresh();return value}});
  }
  webmcpNode.textContent="Registered genuine page-bound Site Tools for the current stage.";
}
document.querySelector("#commit").addEventListener("click",async()=>{const response=await fetch(apiPath+"/commit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({commit_token:humanCommitToken})});const value=await response.json();document.querySelector("#commit-status").textContent=response.ok?"Committed by the human control.":value.error?.code||"Commit failed";await refresh()});
</script>
</body>
</html>`;
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY_BYTES) throw hostFailure("reference_host_body_too_large", 413);
    chunks.push(bytes);
  }
  if (size === 0) throw hostFailure("reference_host_input_invalid", 400);
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw hostFailure("reference_host_input_invalid", 400);
  }
}

function writeHtml(response, body) {
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Security-Policy": "default-src 'none'; connect-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'",
    "Content-Type": "text/html; charset=utf-8",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Frame-Options": "DENY",
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

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value)) {
    throw new TypeError(`Reference Host ${label} is invalid`);
  }
}

function hostFailure(code, statusCode) {
  return Object.assign(new Error(code), { code, statusCode });
}

function secureEqual(value, expected) {
  if (typeof value !== "string" || typeof expected !== "string") return false;
  const left = Buffer.from(value, "utf8");
  const right = Buffer.from(expected, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}
