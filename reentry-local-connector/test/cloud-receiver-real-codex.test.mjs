import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  canonicalJson,
  createContinuationReceipt,
} from "@webmcp-challenge/reentry-core/protocol";
import { LocalConnectorClient } from "@webmcp-challenge/reentry-core/local-connector-client";
import { createCodexExecAdapter } from "../src/codex-exec-adapter.mjs";
import { LocalConnector } from "../src/local-connector.mjs";

const enabled = process.env.REENTRY_REAL_CODEX_E2E === "1";
const WORKSPACE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CONNECTOR_TOKEN = "fake-connector-token-real-codex-e2e";
const CLAIM_TOKEN = Buffer.alloc(32, 7).toString("base64url");
const INSTRUCTION = "Reply exactly: Re-entry is working.";

test(
  "fake Receiver claim reaches the real Local Connector and real Codex",
  { skip: enabled ? false : "Set REENTRY_REAL_CODEX_E2E=1 to run the real Codex loopback test" },
  async () => {
    let claimRequest;
    let spawnCall;
    const receiver = createServer(async (request, response) => {
      if (request.method !== "POST" || request.url !== "/v0.1/delivery-claims") {
        response.writeHead(404);
        response.end();
        return;
      }

      claimRequest = await readJson(request);
      process.stdout.write(`${JSON.stringify({
        event: "fake_receiver_claim_received",
        route: request.url,
        has_connector_token: typeof claimRequest.connector_token === "string",
        claim_token_length: claimRequest.claim_token?.length ?? 0,
      })}\n`);

      const body = canonicalJson({
        duplicate: false,
        lease: deliveryLease({ leaseToken: claimRequest.claim_token }),
      });
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
      });
      response.end(body);
    });

    await new Promise((resolve, reject) => {
      receiver.once("error", reject);
      receiver.listen(0, "127.0.0.1", resolve);
    });

    try {
      const address = receiver.address();
      assert.equal(typeof address, "object");
      const receiverOrigin = `http://127.0.0.1:${address.port}`;
      const client = new LocalConnectorClient({
        baseUrl: receiverOrigin,
        connectorToken: CONNECTOR_TOKEN,
        requestTimeoutMs: 5_000,
      });
      const adapter = createCodexExecAdapter({
        workingDirectory: WORKSPACE,
        commandTimeoutMs: 60_000,
        spawnCommand(executable, args, options) {
          spawnCall = { executable, args, options };
          process.stdout.write(`${JSON.stringify({
            event: "real_codex_process_started",
            executable,
            command: args.slice(0, 3),
            prompt_contains_instruction: args[3]?.includes(INSTRUCTION) === true,
          })}\n`);
          return spawn(executable, args, {
            ...options,
            stdio: ["ignore", "inherit", "inherit"],
          });
        },
      });
      const connector = new LocalConnector({
        client,
        adapter,
        clock: () => new Date(),
        activationTimeoutMs: 60_000,
        createClaimToken: () => CLAIM_TOKEN,
      });

      const result = await connector.runOnce();

      assert.deepEqual(result.status, "activation_result");
      assert.equal(result.event_id, "event_real_codex_e2e_001");
      assert.equal(result.result.outcome, "accepted");
      assert.equal(result.result.code, "activation_dispatch_accepted");
      assert.deepEqual(claimRequest, {
        connector_token: CONNECTOR_TOKEN,
        claim_token: CLAIM_TOKEN,
      });
      assert.ok(spawnCall);
      assert.deepEqual(spawnCall.args.slice(0, 3), ["exec", "--cd", WORKSPACE]);
      assert.equal(spawnCall.args[3].includes(INSTRUCTION), true);
      assert.equal(spawnCall.args[3].includes(CLAIM_TOKEN), false);
      assert.equal(spawnCall.args[3].includes(CONNECTOR_TOKEN), false);

      process.stdout.write(`${JSON.stringify({
        event: "real_codex_process_completed",
        outcome: result.result.outcome,
        code: result.result.code,
        cloud_claim_observed: true,
      })}\n`);
    } finally {
      receiver.close();
      await once(receiver, "close");
    }
  },
);

function deliveryLease({ leaseToken }) {
  const expiresAt = new Date(Date.now() + 120_000).toISOString();
  const receipt = createContinuationReceipt({
    type: "webmcp.continuation_receipt",
    protocol_version: "0.1",
    grant_id: "grant_real_codex_e2e_001",
    correlation_id: "correlation_real_codex_e2e_001",
    issuer_origin: "https://test-host.example",
    workflow_id: "workflow_real_codex_e2e_001",
    event_type: "workflow.ready",
    canonical_url: "https://test-host.example/workflows/real-codex-e2e",
    expires_at: expiresAt,
    human_boundary: "explicit_receiver_consent",
    continuation_mode: "open_canonical_page_read_current_state",
  });

  return {
    type: "webmcp.delivery_lease",
    protocol_version: "0.1",
    delivery_id: "delivery_real_codex_e2e_001",
    event_id: "event_real_codex_e2e_001",
    attempt: 1,
    lease_token: leaseToken,
    lease_expires_at: expiresAt,
    continuation: {
      correlation_id: "correlation_real_codex_e2e_001",
      workflow_id: "workflow_real_codex_e2e_001",
      event_type: "workflow.ready",
      event_sequence: 1,
      state_version: 1,
      occurred_at: new Date().toISOString(),
      canonical_url: "https://test-host.example/workflows/real-codex-e2e",
      instruction: INSTRUCTION,
    },
    receipt,
  };
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
