/**
 * @deprecated Historical Cloud Receiver composition helper. Do not use for new integrations or
 * production.
 */
import { isAbsolute } from "node:path";

import { ReceiverCore } from "../../../reentry-core/src/receiver-core.mjs";
import { SqliteReceiverStore } from "../../../reentry-core/src/sqlite-receiver-store.mjs";

const COMPOSITION_OPTION_FIELDS = Object.freeze([
  "databasePath",
  "keyResolver",
  "consentAuthority",
  "grantControlAuthority",
  "connectorAuthority",
  "effectAuthority",
  "maximumGrantLifetimeMs",
  "leaseDurationMs",
  "maximumDeliveryAttempts",
  "clock",
  "createId",
]);
const REQUIRED_COMPOSITION_FIELDS = Object.freeze(
  COMPOSITION_OPTION_FIELDS.filter((field) => !["clock", "createId"].includes(field)),
);

export function createSqliteReceiverComposition(options) {
  requireExactRecord(
    options,
    COMPOSITION_OPTION_FIELDS,
    REQUIRED_COMPOSITION_FIELDS,
    "SQLite Cloud Receiver composition options",
  );
  const databasePath = requireDurableDatabasePath(options.databasePath);
  const store = new SqliteReceiverStore({ filename: databasePath });
  let closed = false;
  let receiver;
  try {
    const receiverOptions = {
      store,
      keyResolver: options.keyResolver,
      consentAuthority: options.consentAuthority,
      grantControlAuthority: options.grantControlAuthority,
      connectorAuthority: options.connectorAuthority,
      effectAuthority: options.effectAuthority,
      maximumGrantLifetimeMs: options.maximumGrantLifetimeMs,
      leaseDurationMs: options.leaseDurationMs,
      maximumDeliveryAttempts: options.maximumDeliveryAttempts,
    };
    if (Object.hasOwn(options, "clock")) receiverOptions.clock = options.clock;
    if (Object.hasOwn(options, "createId")) receiverOptions.createId = options.createId;
    receiver = new ReceiverCore(receiverOptions);
  } catch (error) {
    store.close();
    throw error;
  }

  return Object.freeze({
    receiver,
    close() {
      if (closed) return;
      store.close();
      closed = true;
    },
    readiness() {
      return !closed;
    },
  });
}

function requireDurableDatabasePath(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > 4_096 ||
    value.includes("\0") ||
    value === ":memory:" ||
    !isAbsolute(value)
  ) {
    throw new TypeError("Cloud Receiver databasePath must be an absolute file-backed path");
  }
  return value;
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === "symbol" || !descriptor?.enumerable || !("value" in descriptor)) {
      throw new TypeError(`${label} contains an invalid property`);
    }
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw new TypeError(`${label} contains an unsupported field`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw new TypeError(`${label} is missing a required field`);
  }
}
