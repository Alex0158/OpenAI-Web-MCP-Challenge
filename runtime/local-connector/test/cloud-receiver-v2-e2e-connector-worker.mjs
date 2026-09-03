import path from "node:path";
import process from "node:process";

import { AGENT_ACTIVATION_RESULT_TYPE } from "../../../reentry-core/src/agent-adapter.mjs";
import { LocalConnectorClient } from "../../../reentry-core/src/local-connector-client.mjs";
import { LocalConnector } from "../src/local-connector.mjs";
import { LocalConnectorCredentialStore } from "../src/credentials.mjs";

try {
  const input = await readInput();
  requireExactFields(input, ["credential_file", "claim_token"]);
  if (!path.isAbsolute(input.credential_file)) throw workerFailure("connector_e2e_input_invalid");

  const credentials = await new LocalConnectorCredentialStore({
    filename: input.credential_file,
  }).load();
  if (!credentials) throw workerFailure("connector_credentials_missing");

  const client = new LocalConnectorClient({
    baseUrl: credentials.receiver_origin,
    connectorToken: credentials.connector_token,
    requestTimeoutMs: 5_000,
  });
  let observedInstruction;
  const connector = new LocalConnector({
    client,
    adapter: {
      activate(activation) {
        for (const secretField of ["connector_token", "lease_token", "effect_token"]) {
          if (secretField in activation) throw workerFailure("connector_activation_secret_boundary");
        }
        observedInstruction = activation.continuation.instruction;
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
    },
    clock: () => new Date(),
    activationTimeoutMs: 5_000,
    createClaimToken: () => input.claim_token,
  });

  const result = await connector.runOnce();
  if (result.status === "idle") {
    process.stdout.write(`${JSON.stringify({
      event: "connector_e2e_claim_result",
      status: "idle",
    })}\n`);
  } else {
    process.stdout.write(`${JSON.stringify({
      event: "connector_e2e_claim_result",
      status: "activation_result",
      delivery_id: result.delivery_id,
      event_id: result.event_id,
      outcome: result.result.outcome,
      code: result.result.code,
      instruction: observedInstruction,
    })}\n`);
  }
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    event: "connector_e2e_failed",
    code: error?.code ?? "connector_e2e_failed",
  })}\n`);
  process.exitCode = 1;
}

async function readInput() {
  let body = "";
  for await (const chunk of process.stdin) {
    body += chunk.toString();
    if (Buffer.byteLength(body, "utf8") > 16 * 1_024) throw workerFailure("connector_e2e_input_too_large");
  }
  try {
    const value = JSON.parse(body);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw workerFailure("connector_e2e_input_invalid");
  }
}

function requireExactFields(value, expected) {
  const actual = Object.keys(value).sort();
  const fields = [...expected].sort();
  if (actual.length !== fields.length || actual.some((field, index) => field !== fields[index])) {
    throw workerFailure("connector_e2e_input_invalid");
  }
}

function workerFailure(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}
