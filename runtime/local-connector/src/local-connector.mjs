import { randomBytes } from "node:crypto";

import {
  dispatchAgentActivation,
} from "@webmcp-challenge/reentry-core/agent-adapter";
import { LocalConnectorClient } from "@webmcp-challenge/reentry-core/local-connector-client";

const OPTION_FIELDS = Object.freeze([
  "client",
  "adapter",
  "clock",
  "activationTimeoutMs",
  "createClaimToken",
]);
const MIN_TIMEOUT_MS = 100;
const MAX_TIMEOUT_MS = 60_000;

export class LocalConnector {
  #client;
  #adapter;
  #clock;
  #activationTimeoutMs;
  #createClaimToken;

  constructor(options) {
    requireExactRecord(options, OPTION_FIELDS, OPTION_FIELDS, "Local Connector options");
    if (!(options.client instanceof LocalConnectorClient)) {
      throw new TypeError("Local Connector client must be a LocalConnectorClient");
    }
    if (!options.adapter || typeof options.adapter.activate !== "function") {
      throw new TypeError("Local Connector adapter must implement activate");
    }
    if (typeof options.clock !== "function") throw new TypeError("Local Connector clock must be a function");
    if (!Number.isSafeInteger(options.activationTimeoutMs) || options.activationTimeoutMs < MIN_TIMEOUT_MS || options.activationTimeoutMs > MAX_TIMEOUT_MS) {
      throw new TypeError("Local Connector activationTimeoutMs is invalid");
    }
    if (typeof options.createClaimToken !== "function") throw new TypeError("Local Connector createClaimToken must be a function");
    this.#client = options.client;
    this.#adapter = options.adapter;
    this.#clock = options.clock;
    this.#activationTimeoutMs = options.activationTimeoutMs;
    this.#createClaimToken = options.createClaimToken;
  }

  async runOnce() {
    const claimToken = this.#createClaimToken();
    const claim = await this.#client.claimDelivery({ claimToken });
    if (claim === null) return Object.freeze({ status: "idle" });
    const result = await dispatchAgentActivation({
      adapter: this.#adapter,
      lease: claim.lease,
      now: this.#readClock(),
      timeoutMs: this.#activationTimeoutMs,
    });
    return Object.freeze({
      status: "activation_result",
      delivery_id: claim.lease.delivery_id,
      event_id: claim.lease.event_id,
      result,
    });
  }

  acknowledgeDelivery(input) {
    return this.#client.acknowledgeDelivery(input);
  }

  #readClock() {
    const value = this.#clock();
    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new TypeError("Local Connector clock must return a valid Date");
    return new Date(value.getTime());
  }
}

export function createRandomClaimToken() {
  return randomBytes(32).toString("base64url");
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field)) || requiredFields.some((field) => !fields.includes(field))) throw new TypeError(`${label} fields are invalid`);
}
