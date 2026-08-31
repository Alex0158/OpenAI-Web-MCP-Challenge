import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ProtocolAuthenticationError,
  ProtocolValidationError,
  REENTRY_HEADER_NAMES,
  canonicalJson,
  createContinuationEvent,
  createContinuationEventEnvelope,
  createContinuationReceipt,
  createReentryManifest,
  validateContinuationReceipt,
  validatePublicBinding,
  validateReentryManifest,
  verifyContinuationEventEnvelope,
} from "../src/protocol.mjs";
import {
  FIXED_NOW,
  HOST_ORIGIN,
  continuationEvent,
  continuationReceipt,
  createTestKeys,
  manifestValue,
  publicBinding,
} from "./fixtures.mjs";

test("canonicalJson is deterministic and rejects ambiguous JavaScript values", () => {
  assert.equal(
    canonicalJson({ zebra: 2, alpha: { y: true, x: null }, list: ["safe", 1] }),
    '{"alpha":{"x":null,"y":true},"list":["safe",1],"zebra":2}',
  );

  const invalidValues = [
    { value: undefined },
    { value: Number.MAX_SAFE_INTEGER + 1 },
    { value: -0 },
    { value: Number.NaN },
    { value: new Date() },
    { value: [, "sparse"] },
    { value: "\ud800" },
  ];
  for (const value of invalidValues) {
    assert.throws(() => canonicalJson(value), ProtocolValidationError);
  }

  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => canonicalJson(cyclic), { code: "canonical_cycle_invalid" });

  const accessor = {};
  Object.defineProperty(accessor, "value", { enumerable: true, get: () => "unsafe" });
  assert.throws(() => canonicalJson(accessor), { code: "protocol_property_invalid" });
});

test("signed Manifest verifies through an origin- and purpose-scoped public-key resolver", () => {
  const { privateKey, publicKey } = createTestKeys();
  const manifest = createReentryManifest(manifestValue(), {
    privateKey,
    keyId: "host_key_001",
  });
  let request;
  const verified = validateReentryManifest(manifest, {
    now: FIXED_NOW,
    expectedOrigin: HOST_ORIGIN,
    keyResolver(value) {
      request = value;
      return publicKey;
    },
  });

  assert.deepEqual(request, {
    issuerOrigin: HOST_ORIGIN,
    keyId: "host_key_001",
    purpose: "manifest",
  });
  assert.deepEqual(verified, manifest);
  assert.ok(Object.isFrozen(verified));
  assert.ok(Object.isFrozen(verified.workflow));
});

test("Manifest validation rejects tamper, extension fields, stale offers, and private verifier keys", () => {
  const { privateKey, publicKey } = createTestKeys();
  const manifest = createReentryManifest(manifestValue(), {
    privateKey,
    keyId: "host_key_001",
  });
  const verify = (value, overrides = {}) => validateReentryManifest(value, {
    now: FIXED_NOW,
    expectedOrigin: HOST_ORIGIN,
    keyResolver: () => publicKey,
    ...overrides,
  });

  assert.throws(
    () => verify({ ...manifest, display: { ...manifest.display, title: "Tampered" } }),
    { code: "manifest_signature_invalid" },
  );
  assert.throws(
    () => verify({ ...manifest, prompt: "do anything" }),
    { code: "manifest_fields_invalid" },
  );
  assert.throws(
    () => verify(manifest, { expectedOrigin: "https://other.example" }),
    { code: "manifest_origin_mismatch" },
  );
  assert.throws(
    () => verify(manifest, { now: new Date("2026-08-31T03:10:00.000Z") }),
    { code: "manifest_expired", statusCode: 410 },
  );
  assert.throws(
    () => verify(manifest, { keyResolver: () => privateKey }),
    { code: "manifest_key_invalid" },
  );
  assert.throws(
    () => verify(manifest, {
      keyResolver: () => ({
        key: privateKey.export({ format: "der", type: "pkcs8" }),
        format: "der",
        type: "pkcs8",
      }),
    }),
    { code: "manifest_key_invalid" },
  );
  assert.throws(
    () => verify(manifest, {
      keyResolver: () => ({ type: "public", asymmetricKeyType: "ed25519" }),
    }),
    { code: "manifest_key_invalid" },
  );
  assert.throws(
    () => verify({
      ...manifest,
      signature: { ...manifest.signature, value: "A".repeat(87) },
    }),
    { code: "protocol_signature_invalid" },
  );
});

test("Manifest field limits and time ordering accept the boundary and reject overflow", () => {
  const { privateKey } = createTestKeys();
  const create = (value) => createReentryManifest(value, {
    privateKey,
    keyId: "host_key_001",
  });
  const originAndSlashBytes = Buffer.byteLength(`${HOST_ORIGIN}/`, "utf8");
  const maximumUrl = `${HOST_ORIGIN}/${"a".repeat(2_048 - originAndSlashBytes)}`;

  assert.doesNotThrow(() => create(manifestValue({
    manifest_id: "m".repeat(160),
    workflow: {
      ...manifestValue().workflow,
      canonical_url: maximumUrl,
    },
    display: {
      title: "t".repeat(120),
      reason: "r".repeat(500),
    },
  })));
  assert.throws(
    () => create(manifestValue({ manifest_id: "m".repeat(161) })),
    { code: "protocol_identifier_invalid" },
  );
  assert.throws(
    () => create(manifestValue({
      workflow: {
        ...manifestValue().workflow,
        canonical_url: `${maximumUrl}a`,
      },
    })),
    { code: "protocol_url_invalid" },
  );
  assert.throws(
    () => create(manifestValue({
      display: { ...manifestValue().display, title: "t".repeat(121) },
    })),
    { code: "protocol_display_invalid" },
  );
  assert.throws(
    () => create(manifestValue({ offer_expires_at: "2026-08-31T03:00:00.000Z" })),
    { code: "manifest_offer_window_invalid" },
  );
  assert.throws(
    () => create(manifestValue({
      grant_request: {
        ...manifestValue().grant_request,
        grant_expires_at: "2026-08-31T03:10:00.000Z",
      },
    })),
    { code: "manifest_grant_window_invalid" },
  );
  assert.throws(
    () => create(manifestValue({ issued_at: "2".repeat(28) })),
    { code: "protocol_timestamp_invalid" },
  );
});

test("event envelope verifies exact canonical body, detached headers, and resolver scope", () => {
  const { privateKey, publicKey } = createTestKeys();
  const event = createContinuationEvent(continuationEvent());
  const envelope = createContinuationEventEnvelope(event, {
    privateKey,
    keyId: "host_key_001",
    timestamp: "1788145440",
  });
  let request;
  const verified = verifyContinuationEventEnvelope(envelope, {
    now: FIXED_NOW,
    expectedOrigin: HOST_ORIGIN,
    keyResolver(value) {
      request = value;
      return publicKey;
    },
  });

  assert.deepEqual(request, {
    issuerOrigin: HOST_ORIGIN,
    keyId: "host_key_001",
    purpose: "event",
  });
  assert.deepEqual(verified, event);
  assert.equal(envelope.body, canonicalJson(event));
  assert.deepEqual(Object.keys(envelope.headers).sort(), Object.values(REENTRY_HEADER_NAMES).sort());
});

test("event validation rejects wire extensions, tamper, noncanonical JSON, and stale delivery", () => {
  const { privateKey, publicKey } = createTestKeys();
  const event = continuationEvent();
  const createEnvelope = (value = event) => createContinuationEventEnvelope(value, {
    privateKey,
    keyId: "host_key_001",
    timestamp: "1788145440",
  });
  const verify = (envelope, overrides = {}) => verifyContinuationEventEnvelope(envelope, {
    now: FIXED_NOW,
    expectedOrigin: HOST_ORIGIN,
    keyResolver: () => publicKey,
    ...overrides,
  });

  assert.throws(
    () => createEnvelope({ ...event, prompt: "continue" }),
    { code: "continuation_event_fields_invalid" },
  );
  assert.throws(
    () => createEnvelope({ ...event, grant_id: "grant_private_001" }),
    { code: "continuation_event_fields_invalid" },
  );
  const envelope = createEnvelope();
  const parsed = JSON.parse(envelope.body);
  parsed.state_version += 1;
  assert.throws(
    () => verify({ ...envelope, body: canonicalJson(parsed) }),
    { code: "event_signature_invalid" },
  );
  assert.throws(
    () => verify({ ...envelope, body: JSON.stringify(event) }),
    { code: "event_body_noncanonical" },
  );
  assert.throws(
    () => verify({
      ...envelope,
      headers: { ...envelope.headers, Authorization: "forbidden" },
    }),
    { code: "event_envelope_headers_fields_invalid" },
  );
  assert.throws(
    () => verify({
      ...envelope,
      headers: {
        ...envelope.headers,
        [REENTRY_HEADER_NAMES.timestamp]: "1".repeat(17),
      },
    }),
    { code: "event_delivery_timestamp_invalid" },
  );
  assert.throws(
    () => verify(envelope, { now: new Date("2026-08-31T03:10:01.000Z") }),
    { code: "event_delivery_timestamp_outside_window" },
  );
  const futureEvent = createEnvelope(continuationEvent({
    occurred_at: "2026-08-31T03:06:00.001Z",
  }));
  assert.throws(
    () => verify(futureEvent),
    { code: "event_occurred_in_future" },
  );
});

test("public binding and private receipt preserve their separate strict surfaces", () => {
  const binding = validatePublicBinding(publicBinding());
  const receipt = validateContinuationReceipt(continuationReceipt());

  assert.ok(!("grant_id" in binding));
  assert.equal(receipt.grant_id, "grant_private_001");
  assert.ok(!("display" in receipt));
  assert.ok(Object.isFrozen(binding));
  assert.ok(Object.isFrozen(receipt));
  assert.deepEqual(createContinuationReceipt(continuationReceipt()), receipt);
  assert.throws(
    () => validatePublicBinding({ ...publicBinding(), grant_id: "leak" }),
    { code: "public_binding_fields_invalid" },
  );
  assert.throws(
    () => validateContinuationReceipt({ ...continuationReceipt(), prompt: "continue" }),
    { code: "continuation_receipt_fields_invalid" },
  );
});

test("frozen v0.1 vector verifies without a Host private key", async () => {
  const vector = JSON.parse(await readFile(
    new URL("../protocol/test-vectors/v0.1.json", import.meta.url),
    "utf8",
  ));
  const resolveVectorKey = ({ issuerOrigin, keyId }) => {
    assert.equal(issuerOrigin, vector.issuer_origin);
    assert.equal(keyId, vector.key_id);
    return vector.public_key_pem;
  };

  assert.equal(canonicalJson(vector.manifest), vector.manifest_canonical_json);
  assert.deepEqual(validateReentryManifest(vector.manifest, {
    now: new Date(vector.verification_time),
    expectedOrigin: vector.issuer_origin,
    keyResolver: resolveVectorKey,
  }), vector.manifest);
  assert.equal(vector.event_envelope.body, vector.event_canonical_json);
  assert.deepEqual(verifyContinuationEventEnvelope(vector.event_envelope, {
    now: new Date(vector.verification_time),
    expectedOrigin: vector.issuer_origin,
    keyResolver: resolveVectorKey,
  }), JSON.parse(vector.event_envelope.body));
});

test("authentication failures remain distinguishable from protocol-shape failures", () => {
  const { privateKey, publicKey } = createTestKeys();
  const envelope = createContinuationEventEnvelope(continuationEvent(), {
    privateKey,
    keyId: "host_key_001",
    timestamp: "1788145440",
  });
  assert.throws(
    () => verifyContinuationEventEnvelope(envelope, {
      now: FIXED_NOW,
      expectedOrigin: HOST_ORIGIN,
      keyResolver: () => createTestKeys().publicKey,
    }),
    ProtocolAuthenticationError,
  );
  assert.throws(
    () => verifyContinuationEventEnvelope({ ...envelope, body: "{" }, {
      now: FIXED_NOW,
      expectedOrigin: HOST_ORIGIN,
      keyResolver: () => publicKey,
    }),
    ProtocolValidationError,
  );
});

test("verification cannot run without a trusted origin anchor", () => {
  const { privateKey, publicKey } = createTestKeys();
  const manifest = createReentryManifest(manifestValue(), {
    privateKey,
    keyId: "host_key_001",
  });
  const envelope = createContinuationEventEnvelope(continuationEvent(), {
    privateKey,
    keyId: "host_key_001",
    timestamp: "1788145440",
  });

  assert.throws(
    () => validateReentryManifest(manifest, {
      now: FIXED_NOW,
      keyResolver: () => publicKey,
    }),
    { name: "TypeError", message: "expectedOrigin is required for Manifest verification" },
  );
  assert.throws(
    () => verifyContinuationEventEnvelope(envelope, {
      now: FIXED_NOW,
      keyResolver: () => publicKey,
    }),
    { name: "TypeError", message: "expectedOrigin is required for event verification" },
  );
});
