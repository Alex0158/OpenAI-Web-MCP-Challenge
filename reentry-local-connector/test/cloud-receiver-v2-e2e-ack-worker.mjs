import path from "node:path";
import process from "node:process";

import { LocalConnectorClient } from "../../reentry-core/src/local-connector-client.mjs";
import { LocalConnectorCredentialStore } from "../src/credentials.mjs";

try {
  const input = await readInput();
  requireExactFields(input, ["credential_file", "delivery_id", "lease_token", "effect_token"]);
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
  const result = await client.acknowledgeDelivery({
    deliveryId: input.delivery_id,
    leaseToken: input.lease_token,
    effectToken: input.effect_token,
  });
  process.stdout.write(`${JSON.stringify({
    event: "connector_e2e_ack_result",
    delivery_id: result.delivery_id,
    duplicate: result.duplicate,
    status: result.status,
  })}\n`);
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
