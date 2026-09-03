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
import { createReferenceHost } from "./reference-host.mjs";

const HOST_SUBJECT_REF = "host_user_reference_001";
const ORGANIZATION_ID = "org_reference_001";
const HOST_ID = "host_reference_001";
const HOST_KEY_ID = "host_key_reference_001";

export async function runReferenceSystem(options = {}) {
  const emit = typeof options.emit === "function" ? options.emit : () => {};
  const stateDirectory = await resolveStateDirectory(options.stateDirectory);
  const hostApiKey = randomBytes(32).toString("base64url");
  const connectorTokenSecret = randomBytes(32).toString("base64url");
  const keys = generateKeyPairSync("ed25519");
  const host = createReferenceHost();
  let hostAddress;
  let receiverService;
  let receiverOrigin;

  try {
    hostAddress = await host.start();
    emit({ event: "reference_host_started", canonical_url: hostAddress.canonicalUrl });

    ({ service: receiverService, origin: receiverOrigin } = await startReceiver({
      stateDirectory,
      hostApiKey,
      connectorTokenSecret,
      effectAuthority: host.effectAuthority,
    }));
    emit({ event: "reentry_started", receiver_origin: receiverOrigin });

    const sdk = createHostSdk({
      origin: hostAddress.origin,
      receiverOrigin,
      privateKey: keys.privateKey,
      keyId: HOST_KEY_ID,
      organizationApiKey: hostApiKey,
    });
    await sdk.registerHostKey({ hostId: HOST_ID });
    emit({ event: "host_key_registered" });

    const pairing = await postJson(receiverOrigin, "/v0.1/pairing-sessions", {
      headers: { Authorization: `Bearer ${hostApiKey}` },
      body: { host_subject_ref: HOST_SUBJECT_REF },
      acceptedStatuses: [201],
    });
    const pairingClient = new LocalConnectorPairingClient({
      baseUrl: receiverOrigin,
      openBrowser: async (verificationUri) => {
        const page = await fetch(verificationUri, { redirect: "manual" });
        if (page.status !== 200) return false;
        await postJson(receiverOrigin, "/v0.1/pairing-sessions/approve", {
          body: { user_code: pairing.user_code },
          acceptedStatuses: [200],
        });
        return true;
      },
      sleep: async () => {},
    });
    const credentials = await pairingClient.pair({ userCode: pairing.user_code });
    emit({ event: "connector_paired", connector_id: credentials.connector_id });

    const now = new Date();
    const initial = host.snapshot();
    const manifest = sdk.createManifest({
      offerExpiresAt: addMilliseconds(now, 5 * 60_000),
      workflow: {
        id: initial.workflow_id,
        type: initial.workflow_type,
        stateVersion: initial.state_version,
        canonicalUrl: hostAddress.canonicalUrl,
      },
      display: {
        title: "Continue this reference workflow",
        reason: "The Host will later have one visible draft step ready.",
      },
      grantRequest: {
        eventType: "workflow.ready",
        grantExpiresAt: addMilliseconds(now, 20 * 60_000),
        humanBoundary: "explicit_receiver_consent",
      },
    });
    const consent = await sdk.createConsentSession({
      manifest,
      hostSubjectRef: HOST_SUBJECT_REF,
    });
    const approval = await sdk.decideConsent({
      challengeId: consent.challenge.challenge_id,
      hostSubjectRef: HOST_SUBJECT_REF,
      action: "approve",
      consentToken: consent.consent_token,
    });
    host.attachBinding(approval.binding);
    emit({ event: "consent_approved", binding_id: approval.binding.binding_id });

    const ready = host.markReady();
    const acceptance = await sdk.sendEvent({
      binding: host.getBinding(),
      workflow: {
        id: ready.workflow_id,
        stateVersion: ready.state_version,
        canonicalUrl: hostAddress.canonicalUrl,
      },
    });
    emit({ event: "event_accepted", event_id: acceptance.event_id });

    const client = new LocalConnectorClient({
      baseUrl: receiverOrigin,
      connectorToken: credentials.connector_token,
      requestTimeoutMs: 5_000,
    });
    const leaseToken = randomBytes(32).toString("base64url");
    const connector = new LocalConnector({
      client,
      adapter: host.createAgentAdapter(),
      clock: () => new Date(),
      activationTimeoutMs: 5_000,
      createClaimToken: () => leaseToken,
    });
    const activation = await connector.runOnce();
    if (activation.status !== "activation_result" || activation.result.outcome !== "accepted") {
      throw referenceFailure("reference_agent_activation_failed");
    }
    emit({ event: "agent_activation_accepted", delivery_id: activation.delivery_id });

    const effectToken = host.getEffectToken(activation.delivery_id);
    const acknowledgement = await connector.acknowledgeDelivery({
      deliveryId: activation.delivery_id,
      leaseToken,
      effectToken,
    });
    emit({
      event: "host_effect_acknowledged",
      delivery_id: acknowledgement.delivery_id,
      effect_id: acknowledgement.effect_id,
    });

    const idle = await client.claimDelivery({ claimToken: randomBytes(32).toString("base64url") });
    if (idle !== null) throw referenceFailure("reference_delivery_not_idle");
    emit({ event: "connector_idle" });

    await receiverService.stop();
    receiverService = undefined;
    ({ service: receiverService, origin: receiverOrigin } = await startReceiver({
      stateDirectory,
      hostApiKey,
      connectorTokenSecret,
      effectAuthority: host.effectAuthority,
    }));
    emit({ event: "reentry_restarted", receiver_origin: receiverOrigin });
    const reopenedClient = new LocalConnectorClient({
      baseUrl: receiverOrigin,
      connectorToken: credentials.connector_token,
      requestTimeoutMs: 5_000,
    });
    const replay = await reopenedClient.acknowledgeDelivery({
      deliveryId: activation.delivery_id,
      leaseToken,
      effectToken,
    });
    if (replay.duplicate !== true) throw referenceFailure("reference_restart_replay_failed");
    emit({ event: "restart_replay_verified", delivery_id: replay.delivery_id });

    const finalState = host.snapshot();
    if (
      finalState.status !== "READY_FOR_HUMAN" ||
      finalState.artifact.revision !== 1 ||
      finalState.human_boundary.committed !== false
    ) {
      throw referenceFailure("reference_host_effect_invalid");
    }
    const result = Object.freeze({
      status: "locally_verified",
      host_url: hostAddress.canonicalUrl,
      receiver_origin: receiverOrigin,
      state_directory: stateDirectory,
      delivery_id: activation.delivery_id,
      effect_id: acknowledgement.effect_id,
      host_state: finalState,
    });
    emit({
      event: "reference_system_complete",
      status: result.status,
      host_url: result.host_url,
      receiver_origin: result.receiver_origin,
      state_directory: result.state_directory,
      host_status: result.host_state.status,
      artifact_revision: result.host_state.artifact.revision,
    });

    if (options.holdOpen === true) {
      emit({ event: "reference_system_waiting", host_url: result.host_url });
      await waitForTermination();
    }
    return result;
  } finally {
    await receiverService?.stop().catch(() => {});
    await host.stop().catch(() => {});
  }
}

async function startReceiver({ stateDirectory, hostApiKey, connectorTokenSecret, effectAuthority }) {
  const composition = createLocalPreviewComposition({
    receiverDatabasePath: join(stateDirectory, "receiver.sqlite"),
    pairingDatabasePath: join(stateDirectory, "pairing.sqlite"),
    organizationId: ORGANIZATION_ID,
    hostApiKey,
    connectorTokenSecret,
    effectAuthority,
  });
  const service = createCloudReceiverService(composition);
  try {
    const address = await service.start({ host: "127.0.0.1", port: 0 });
    return { service, origin: address.origin };
  } catch (error) {
    await service.stop().catch(() => {});
    throw error;
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
  if (!acceptedStatuses.includes(response.status)) {
    throw referenceFailure(value?.error?.code ?? "reference_http_failure");
  }
  return value;
}

async function resolveStateDirectory(value) {
  if (value === undefined) return mkdtemp(join(tmpdir(), "webmcp-reference-system-"));
  if (typeof value !== "string" || !isAbsolute(value) || value.includes("\0")) {
    throw new TypeError("Reference system stateDirectory must be an absolute path");
  }
  await mkdir(value, { recursive: true, mode: 0o700 });
  return value;
}

function addMilliseconds(date, milliseconds) {
  return new Date(date.getTime() + milliseconds).toISOString();
}

function referenceFailure(code) {
  return Object.assign(new Error(code), { code });
}

function waitForTermination() {
  return new Promise((resolve) => {
    const finish = () => {
      process.off("SIGINT", finish);
      process.off("SIGTERM", finish);
      resolve();
    };
    process.once("SIGINT", finish);
    process.once("SIGTERM", finish);
  });
}
