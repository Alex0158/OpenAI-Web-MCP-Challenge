import { generateKeyPairSync, randomBytes } from "node:crypto";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";

import { LocalConnectorClient } from "../../../reentry-core/src/local-connector-client.mjs";
import { createCloudReceiverService } from "../../cloud-receiver/src/cloud-receiver-service.mjs";
import { createLocalPreviewComposition } from "../../cloud-receiver/src/local-preview-composition.mjs";
import { createHostSdk } from "../../host-sdk/src/server.mjs";
import { LocalConnector } from "../../local-connector/src/local-connector.mjs";
import { LocalConnectorPairingClient } from "../../local-connector/src/pairing-client.mjs";
import { createApplicationHost } from "./application-host.mjs";
import { openApplicationStore } from "./application-store.mjs";

const ORGANIZATION_ID = "org_application_demo_001";
const HOST_ID = "host_application_demo_001";
const HOST_KEY_ID = "host_key_application_demo_001";
const HOST_SUBJECT_REF = "sample_applicant_001";

export async function startApplicationDemo(options = {}) {
  const emit = typeof options.emit === "function" ? options.emit : () => {};
  const stateDirectory = await resolveStateDirectory(options.stateDirectory);
  const store = await openApplicationStore({ filename: join(stateDirectory, "application.json") });
  const hostApiKey = randomBytes(32).toString("base64url");
  const connectorTokenSecret = randomBytes(32).toString("base64url");
  const keys = generateKeyPairSync("ed25519");
  const host = createApplicationHost({ store, emit });
  let receiverService;
  let stopped = false;
  let connectorRunning = true;
  let connectorFailure = null;
  let connectorLoop;

  try {
    const hostAddress = await host.start({ host: "127.0.0.1", port: options.hostPort ?? 0 });
    emit({
      event: "sample_host_started",
      applicant_url: hostAddress.applicantUrl,
      reviewer_url: hostAddress.reviewerUrl,
    });

    const composition = createLocalPreviewComposition({
      receiverDatabasePath: join(stateDirectory, "receiver.sqlite"),
      pairingDatabasePath: join(stateDirectory, "pairing.sqlite"),
      organizationId: ORGANIZATION_ID,
      hostApiKey,
      connectorTokenSecret,
      effectAuthority: host.effectAuthority,
    });
    receiverService = createCloudReceiverService(composition);
    const receiverAddress = await receiverService.start({ host: "127.0.0.1", port: options.receiverPort ?? 0 });
    emit({ event: "sample_reentry_started", receiver_origin: receiverAddress.origin });

    const sdk = createHostSdk({
      origin: hostAddress.origin,
      receiverOrigin: receiverAddress.origin,
      privateKey: keys.privateKey,
      keyId: HOST_KEY_ID,
      organizationApiKey: hostApiKey,
    });
    await sdk.registerHostKey({ hostId: HOST_ID });
    host.configureSdk(sdk);
    emit({ event: "sample_host_sdk_connected" });

    const credentials = await pairLocalConnector({
      receiverOrigin: receiverAddress.origin,
      hostApiKey,
    });
    emit({ event: "sample_connector_auto_paired", connector_id: credentials.connector_id });

    const client = new LocalConnectorClient({
      baseUrl: receiverAddress.origin,
      connectorToken: credentials.connector_token,
      requestTimeoutMs: 5_000,
    });
    let activeLeaseToken;
    const connector = new LocalConnector({
      client,
      adapter: host.createAgentAdapter(),
      clock: () => new Date(),
      activationTimeoutMs: 5_000,
      createClaimToken() {
        activeLeaseToken = randomBytes(32).toString("base64url");
        return activeLeaseToken;
      },
    });

    connectorLoop = runConnectorLoop({
      connector,
      host,
      pollIntervalMs: options.connectorPollIntervalMs ?? 250,
      isRunning: () => connectorRunning,
      getLeaseToken: () => activeLeaseToken,
      emit,
    }).catch((error) => {
      connectorFailure = typeof error?.code === "string" ? error.code : "sample_connector_failed";
      connectorRunning = false;
      emit({ event: "sample_connector_stopped", code: connectorFailure });
    });

    return Object.freeze({
      applicantUrl: hostAddress.applicantUrl,
      reviewerUrl: hostAddress.reviewerUrl,
      receiverOrigin: receiverAddress.origin,
      stateDirectory,
      snapshot: () => host.snapshot(),
      getConnectorFailure: () => connectorFailure,
      stop,
    });
  } catch (error) {
    connectorRunning = false;
    await connectorLoop?.catch(() => {});
    await receiverService?.stop().catch(() => {});
    await host.stop().catch(() => {});
    throw error;
  }

  async function stop() {
    if (stopped) return;
    stopped = true;
    connectorRunning = false;
    await connectorLoop?.catch(() => {});
    await receiverService?.stop().catch(() => {});
    await host.stop().catch(() => {});
  }
}

async function pairLocalConnector({ receiverOrigin, hostApiKey }) {
  const pairing = await postJson(receiverOrigin, "/v0.1/pairing-sessions", {
    headers: { Authorization: `Bearer ${hostApiKey}` },
    body: { host_subject_ref: HOST_SUBJECT_REF },
    acceptedStatuses: [201],
  });
  const client = new LocalConnectorPairingClient({
    baseUrl: receiverOrigin,
    openBrowser: async (verificationUri) => {
      const page = await fetch(verificationUri, { redirect: "manual", signal: AbortSignal.timeout(5_000) });
      if (page.status !== 200) return false;
      await postJson(receiverOrigin, "/v0.1/pairing-sessions/approve", {
        body: { user_code: pairing.user_code },
        acceptedStatuses: [200],
      });
      return true;
    },
    sleep: async () => {},
  });
  return client.pair({ userCode: pairing.user_code });
}

async function runConnectorLoop({ connector, host, pollIntervalMs, isRunning, getLeaseToken, emit }) {
  if (!Number.isSafeInteger(pollIntervalMs) || pollIntervalMs < 25 || pollIntervalMs > 10_000) {
    throw new TypeError("Application demo Connector poll interval is invalid");
  }
  while (isRunning()) {
    const result = await connector.runOnce();
    if (result.status === "activation_result") {
      if (result.result.outcome !== "accepted") throw systemFailure("sample_agent_activation_failed");
      emit({ event: "sample_agent_activation_accepted", delivery_id: result.delivery_id });
      const acknowledgement = await connector.acknowledgeDelivery({
        deliveryId: result.delivery_id,
        leaseToken: getLeaseToken(),
        effectToken: host.getEffectToken(result.delivery_id),
      });
      await host.markDeliveryAcknowledged({
        deliveryId: acknowledgement.delivery_id,
        effectId: acknowledgement.effect_id,
      });
      emit({
        event: "sample_delivery_acknowledged",
        delivery_id: acknowledgement.delivery_id,
        effect_id: acknowledgement.effect_id,
      });
    }
    await delay(pollIntervalMs);
  }
}

async function postJson(origin, path, { headers = {}, body, acceptedStatuses }) {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
    credentials: "omit",
    redirect: "manual",
    signal: AbortSignal.timeout(5_000),
  });
  const value = await response.json();
  if (!acceptedStatuses.includes(response.status)) throw systemFailure(value?.error?.code ?? "sample_http_failure");
  return value;
}

async function resolveStateDirectory(value) {
  if (value === undefined) return mkdtemp(join(tmpdir(), "webmcp-application-demo-"));
  if (typeof value !== "string" || !isAbsolute(value) || value.includes("\0")) {
    throw new TypeError("Application demo stateDirectory must be an absolute path");
  }
  await mkdir(value, { recursive: true, mode: 0o700 });
  return value;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function systemFailure(code) {
  return Object.assign(new Error(code), { code });
}
