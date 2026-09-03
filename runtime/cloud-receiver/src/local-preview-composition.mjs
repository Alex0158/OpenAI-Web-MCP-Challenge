/**
 * @deprecated Historical Cloud Receiver composition. Do not use for new integrations or
 * production; use the reusable Re-entry Core contracts in a replacement service.
 */
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, isAbsolute } from "node:path";
import process from "node:process";

import { createPairingControlPlane } from "./pairing-control.mjs";
import { PairingStore } from "./pairing-store.mjs";
import { createHostKeyControlPlane } from "./host-key-control.mjs";
import { createConsentControlPlane } from "./consent-control.mjs";
import { createSqliteReceiverComposition } from "./sqlite-composition.mjs";

const DEFAULT_ORGANIZATION_ID = "org_preview";
const PAIRING_LIFETIME_MS = 5 * 60_000;
const CONNECTOR_LIFETIME_MS = 24 * 60 * 60_000;
const MAXIMUM_GRANT_LIFETIME_MS = 30 * 60_000;
const LEASE_DURATION_MS = 60_000;
const MAXIMUM_DELIVERY_ATTEMPTS = 3;

/**
 * Build the loopback-only local preview composition used by the standalone process.
 *
 * The pairing, Host-key, and consent control planes are real and durable. Grant control and Host-
 * effect verification remain explicit unsupported authorities in the standalone preview. A
 * bounded reference consumer may inject those authority ports without changing the default.
 */
export function createCloudReceiverComposition() {
  return createLocalPreviewComposition(readEnvironment());
}

export function createLocalPreviewComposition(options) {
  const configuration = normalizeOptions(options);
  ensureParentDirectory(configuration.receiverDatabasePath);
  ensureParentDirectory(configuration.pairingDatabasePath);

  const pairingStore = new PairingStore({ filename: configuration.pairingDatabasePath });
  let control;
  let hostKeys;
  let consent;
  let receiverComposition;
  let closed = false;
  try {
    control = createPairingControlPlane({
      store: pairingStore,
      organizationId: configuration.organizationId,
      hostApiKey: configuration.hostApiKey,
      connectorTokenSecret: configuration.connectorTokenSecret,
      pairingLifetimeMs: PAIRING_LIFETIME_MS,
      connectorLifetimeMs: CONNECTOR_LIFETIME_MS,
      clock: configuration.clock,
      createId: (prefix) => `${prefix}_${randomUUID()}`,
      verificationOrigin: configuration.verificationOrigin,
    });
    hostKeys = createHostKeyControlPlane({
      store: pairingStore,
      organizationId: configuration.organizationId,
      hostApiKey: configuration.hostApiKey,
      clock: configuration.clock,
    });
    consent = createConsentControlPlane({
      store: pairingStore,
      pairingControl: control,
      getReceiver: () => receiverComposition?.receiver,
      organizationId: configuration.organizationId,
      hostApiKey: configuration.hostApiKey,
      consentTokenSecret: configuration.connectorTokenSecret,
      clock: configuration.clock,
      createId: (prefix) => `${prefix}_${randomUUID()}`,
    });
    receiverComposition = createSqliteReceiverComposition({
      databasePath: configuration.receiverDatabasePath,
      keyResolver: hostKeys.resolveKey,
      consentAuthority: consent,
      grantControlAuthority: configuration.grantControlAuthority,
      connectorAuthority: control,
      effectAuthority: configuration.effectAuthority,
      maximumGrantLifetimeMs: MAXIMUM_GRANT_LIFETIME_MS,
      leaseDurationMs: LEASE_DURATION_MS,
      maximumDeliveryAttempts: MAXIMUM_DELIVERY_ATTEMPTS,
      clock: configuration.clock,
    });
  } catch (error) {
    try {
      receiverComposition?.close();
    } finally {
      control?.close();
      if (receiverComposition === undefined) pairingStore.close();
    }
    throw error;
  }

  return Object.freeze({
    receiver: receiverComposition.receiver,
    controlHandler: handleControl,
    readiness: () => (
      !closed &&
      receiverComposition.readiness() &&
      control.readiness() &&
      hostKeys.readiness() &&
      consent.readiness()
    ),
    close() {
      if (closed) return;
      closed = true;
      let firstError;
      try {
        receiverComposition.close();
      } catch (error) {
        firstError = error;
      }
      try {
        control.close();
      } catch (error) {
        if (firstError === undefined) firstError = error;
        else throw new AggregateError([firstError, error], "Local preview composition close failed");
      }
      if (firstError !== undefined) throw firstError;
    },
  });

  async function handleControl(request, response) {
    if (await hostKeys.handler(request, response)) return true;
    if (await consent.handler(request, response)) return true;
    return control.handler(request, response);
  }
}

function readEnvironment() {
  const receiverDatabasePath = process.env.CLOUD_RECEIVER_DATABASE_PATH;
  return {
    receiverDatabasePath,
    pairingDatabasePath: process.env.CLOUD_RECEIVER_PAIRING_DATABASE_PATH ?? (
      typeof receiverDatabasePath === "string"
        ? `${receiverDatabasePath}.pairing.sqlite`
        : undefined
    ),
    organizationId: process.env.CLOUD_RECEIVER_ORGANIZATION_ID ?? DEFAULT_ORGANIZATION_ID,
    hostApiKey: process.env.CLOUD_RECEIVER_HOST_API_KEY,
    connectorTokenSecret: process.env.CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET,
    verificationOrigin: process.env.CLOUD_RECEIVER_VERIFICATION_ORIGIN,
  };
}

function normalizeOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Local preview composition options are required");
  }
  return {
    receiverDatabasePath: requireDatabasePath(options.receiverDatabasePath, "receiverDatabasePath"),
    pairingDatabasePath: requireDatabasePath(options.pairingDatabasePath, "pairingDatabasePath"),
    organizationId: requireIdentifier(options.organizationId, "organizationId"),
    hostApiKey: requireSecret(options.hostApiKey, "hostApiKey"),
    connectorTokenSecret: requireSecret(options.connectorTokenSecret, "connectorTokenSecret"),
    verificationOrigin: options.verificationOrigin === undefined
      ? undefined
      : requireOrigin(options.verificationOrigin),
    clock: typeof options.clock === "function" ? options.clock : () => new Date(),
    grantControlAuthority: options.grantControlAuthority === undefined
      ? unsupportedAuthority("Grant control")
      : requireAuthority(options.grantControlAuthority, "verifyControl", "Grant control"),
    effectAuthority: options.effectAuthority === undefined
      ? unsupportedAuthority("Host effect verification")
      : requireAuthority(options.effectAuthority, "verifyEffect", "Host effect verification"),
  };
}

function requireAuthority(value, method, label) {
  if (!value || typeof value !== "object" || typeof value[method] !== "function") {
    throw new TypeError(`Local preview ${label} authority must implement ${method}`);
  }
  return value;
}

function unsupportedAuthority(name) {
  return Object.freeze({
    verifyDecision() {
      throw new Error(`Local preview ${name} authority is not configured`);
    },
    verifyControl() {
      throw new Error(`Local preview ${name} authority is not configured`);
    },
    verifyEffect() {
      throw new Error(`Local preview ${name} authority is not configured`);
    },
  });
}

function ensureParentDirectory(filename) {
  mkdirSync(dirname(filename), { recursive: true });
}

function requireDatabasePath(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 4_096 ||
    value.includes("\0") ||
    value === ":memory:" ||
    !isAbsolute(value)
  ) {
    throw new TypeError(`Local preview ${label} must be an absolute file-backed path`);
  }
  return value;
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value)) {
    throw new TypeError(`Local preview ${label} is invalid`);
  }
  return value;
}

function requireSecret(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > 4 * 1_024 ||
    /[^\x21-\x7e]/.test(value)
  ) {
    throw new TypeError(`Local preview ${label} is invalid`);
  }
  return value;
}

function requireOrigin(value) {
  if (typeof value !== "string" || value.length > 2_048) {
    throw new TypeError("Local preview verificationOrigin is invalid");
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError("Local preview verificationOrigin is invalid");
  }
  if (
    parsed.protocol !== "http:" ||
    !["127.0.0.1", "[::1]", "::1", "localhost"].includes(parsed.hostname) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.origin !== value
  ) {
    throw new TypeError("Local preview verificationOrigin is invalid");
  }
  return value;
}
