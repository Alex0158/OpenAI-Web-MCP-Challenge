import { resolve } from "node:path";

import { createSqliteReceiverComposition } from "../../src/sqlite-composition.mjs";

export function createCloudReceiverComposition() {
  const databasePath = process.env.CLOUD_RECEIVER_DATABASE_PATH;
  if (typeof databasePath !== "string") {
    throw new Error("Test composition requires CLOUD_RECEIVER_DATABASE_PATH");
  }
  return createSqliteReceiverComposition({
    databasePath: resolve(databasePath),
    keyResolver() {
      return undefined;
    },
    consentAuthority: rejectingAuthority("verifyDecision"),
    grantControlAuthority: rejectingAuthority("verifyControl"),
    connectorAuthority: rejectingAuthority("verifyConnector"),
    effectAuthority: rejectingAuthority("verifyEffect"),
    maximumGrantLifetimeMs: 30 * 60_000,
    leaseDurationMs: 60_000,
    maximumDeliveryAttempts: 3,
  });
}

function rejectingAuthority(method) {
  return {
    [method]() {
      throw new Error("Synthetic Stage 1 process fixture has no active authority");
    },
  };
}
