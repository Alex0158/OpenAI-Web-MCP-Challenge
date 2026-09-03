/**
 * @deprecated Historical Cloud Receiver product composition. Do not use for new integrations or
 * production; use the reusable Re-entry Core contracts in a replacement service.
 */
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, isAbsolute } from "node:path";
import process from "node:process";

import { CloudAccountStore } from "./account-store.mjs";
import { createAccountConnectorControlPlane } from "./account-connector-control.mjs";
import { createAccountConsentControlPlane } from "./account-consent-control.mjs";
import { createBrowserAccountAuthority } from "./browser-account-authority.mjs";
import { createCloudConsoleControlPlane } from "./dashboard-control.mjs";
import { createHostKeyControlPlane } from "./host-key-control.mjs";
import { PairingStore } from "./pairing-store.mjs";
import { ProductFlowStore } from "./product-flow-store.mjs";
import { ReceiverActivityReader } from "./receiver-activity.mjs";
import { createSqliteReceiverComposition } from "./sqlite-composition.mjs";

const MAXIMUM_GRANT_LIFETIME_MS = 30 * 60_000;
const LEASE_DURATION_MS = 60_000;
const MAXIMUM_DELIVERY_ATTEMPTS = 3;

/**
 * Product-preview composition.
 *
 * This connects dashboard-issued organization keys, authenticated browser accounts, account-linked
 * Connector devices, and Receiver Core in one local process. It remains loopback-only and does not
 * claim production identity or deployment readiness.
 */
export function createCloudReceiverComposition() {
  const receiverDatabasePath = process.env.CLOUD_RECEIVER_DATABASE_PATH;
  return createProductPreviewComposition({
    receiverDatabasePath,
    pairingDatabasePath: process.env.CLOUD_RECEIVER_PAIRING_DATABASE_PATH || (
      typeof receiverDatabasePath === "string" ? `${receiverDatabasePath}.pairing.sqlite` : undefined
    ),
    accountDatabasePath: process.env.CLOUD_RECEIVER_ACCOUNT_DATABASE_PATH || (
      typeof receiverDatabasePath === "string" ? `${receiverDatabasePath}.accounts.sqlite` : undefined
    ),
    productDatabasePath: process.env.CLOUD_RECEIVER_PRODUCT_DATABASE_PATH || (
      typeof receiverDatabasePath === "string" ? `${receiverDatabasePath}.product.sqlite` : undefined
    ),
    tokenSecret: process.env.CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET,
    verificationOrigin: process.env.CLOUD_RECEIVER_VERIFICATION_ORIGIN,
  });
}

export function createProductPreviewComposition(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Product preview composition options are required");
  }
  const receiverDatabasePath = requireDatabasePath(
    options.receiverDatabasePath,
    "receiverDatabasePath",
  );
  const pairingDatabasePath = requireDatabasePath(
    options.pairingDatabasePath,
    "pairingDatabasePath",
  );
  const accountDatabasePath = requireDatabasePath(
    options.accountDatabasePath,
    "accountDatabasePath",
  );
  const productDatabasePath = requireDatabasePath(
    options.productDatabasePath,
    "productDatabasePath",
  );
  const tokenSecret = requireSecret(
    options.tokenSecret,
    "tokenSecret",
  );
  const verificationOrigin = options.verificationOrigin;
  const clock = options.clock ?? (() => new Date());
  const createId = options.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);
  if (typeof clock !== "function" || typeof createId !== "function") {
    throw new TypeError("Product preview clock and createId must be functions");
  }

  for (const filename of [
    receiverDatabasePath,
    pairingDatabasePath,
    accountDatabasePath,
    productDatabasePath,
  ]) {
    ensureParentDirectory(filename);
  }

  const accounts = new CloudAccountStore({ filename: accountDatabasePath });
  const hostKeyStore = new PairingStore({ filename: pairingDatabasePath });
  const productStore = new ProductFlowStore({ filename: productDatabasePath });
  let receiverComposition;
  let activity;
  let closed = false;

  try {
    const accountAuthority = createBrowserAccountAuthority({ store: accounts, clock });
    const connectorControl = createAccountConnectorControlPlane({
      store: productStore,
      accountAuthority,
      tokenSecret,
      clock,
      createId,
      ...(verificationOrigin === undefined ? {} : { verificationOrigin }),
    });
    const hostKeys = createHostKeyControlPlane({
      store: hostKeyStore,
      authenticateOrganization: (token) => accounts.authenticateApiKey(token),
      clock,
    });
    const consentControl = createAccountConsentControlPlane({
      store: productStore,
      connectorControl,
      accountAuthority,
      getReceiver: () => receiverComposition?.receiver,
      authenticateOrganization: (token) => accounts.authenticateApiKey(token),
      tokenSecret,
      clock,
      createId,
      ...(verificationOrigin === undefined ? {} : { verificationOrigin }),
    });
    receiverComposition = createSqliteReceiverComposition({
      databasePath: receiverDatabasePath,
      keyResolver: hostKeys.resolveKey,
      consentAuthority: consentControl,
      grantControlAuthority: unsupportedAuthority("Grant control"),
      connectorAuthority: connectorControl,
      effectAuthority: unsupportedAuthority("Host effect verification"),
      maximumGrantLifetimeMs: MAXIMUM_GRANT_LIFETIME_MS,
      leaseDurationMs: LEASE_DURATION_MS,
      maximumDeliveryAttempts: MAXIMUM_DELIVERY_ATTEMPTS,
      clock,
      createId,
    });
    activity = new ReceiverActivityReader({
      filename: receiverDatabasePath,
      organizationId: "product_preview",
    });
    const consoleControl = createCloudConsoleControlPlane({ store: accounts, activity, clock });

    return Object.freeze({
      receiver: receiverComposition.receiver,
      controlHandler: async (request, response) => {
        if (await consoleControl.handler(request, response)) return true;
        if (await consentControl.handler(request, response)) return true;
        if (await connectorControl.handler(request, response)) return true;
        return hostKeys.handler(request, response);
      },
      readiness: () => (
        !closed &&
        accounts.ready() &&
        hostKeyStore.ready() &&
        productStore.ready() &&
        receiverComposition.readiness() &&
        consentControl.readiness() &&
        connectorControl.readiness() &&
        consoleControl.readiness()
      ),
      close() {
        if (closed) return;
        closed = true;
        const errors = [];
        for (const close of [
          () => activity.close(),
          () => receiverComposition.close(),
          () => productStore.close(),
          () => hostKeyStore.close(),
          () => accounts.close(),
        ]) {
          try {
            close();
          } catch (error) {
            errors.push(error);
          }
        }
        if (errors.length === 1) throw errors[0];
        if (errors.length > 1) throw new AggregateError(errors, "Product preview close failed");
      },
    });
  } catch (error) {
    activity?.close();
    receiverComposition?.close();
    productStore.close();
    hostKeyStore.close();
    accounts.close();
    throw error;
  }
}

function unsupportedAuthority(name) {
  return Object.freeze({
    verifyControl() {
      throw new Error(`Product preview ${name} authority is not configured`);
    },
    verifyEffect() {
      throw new Error(`Product preview ${name} authority is not configured`);
    },
  });
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
    throw new TypeError(`${label} must be an absolute file-backed path`);
  }
  return value;
}

function requireSecret(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 16 ||
    Buffer.byteLength(value, "utf8") > 4 * 1_024 ||
    /[^\x21-\x7e]/.test(value)
  ) {
    throw new TypeError(`${label} must be a non-empty local secret`);
  }
  return value;
}

function ensureParentDirectory(filename) {
  mkdirSync(dirname(filename), { recursive: true });
}
