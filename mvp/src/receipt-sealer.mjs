import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { canonicalJson } from "./webmcp-manifest.mjs";

const RECEIPT_ALGORITHM = "aes-256-gcm";
const RECEIPT_IV_BYTES = 12;

export function sealReceipt(receipt, { key, keyId, aad }) {
  const encryptionKey = normalizeEncryptionKey(key);
  requireText(keyId, "receipt_key_id");
  const plaintext = Buffer.from(canonicalJson(receipt), "utf8");
  const iv = randomBytes(RECEIPT_IV_BYTES);
  const cipher = createCipheriv(RECEIPT_ALGORITHM, encryptionKey, iv);
  cipher.setAAD(Buffer.from(canonicalJson(aad), "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    receipt_key_id: keyId,
    receipt_ciphertext: ciphertext,
    receipt_iv: iv,
    receipt_auth_tag: authTag,
    receipt_digest: digestReceiptBytes(plaintext),
  };
}

export function unsealReceipt(sealed, { key, keyId, aad }) {
  const encryptionKey = normalizeEncryptionKey(key);
  if (sealed.receipt_key_id !== keyId) {
    throw new ReceiptSealingError("Receipt sealing key ID does not match the persisted envelope");
  }
  const envelope = {};
  for (const field of ["receipt_ciphertext", "receipt_iv", "receipt_auth_tag"]) {
    if (!ArrayBuffer.isView(sealed[field])) {
      throw new ReceiptSealingError("Persisted receipt envelope is incomplete");
    }
    envelope[field] = Buffer.from(
      sealed[field].buffer,
      sealed[field].byteOffset,
      sealed[field].byteLength,
    );
  }
  try {
    const decipher = createDecipheriv(RECEIPT_ALGORITHM, encryptionKey, envelope.receipt_iv);
    decipher.setAAD(Buffer.from(canonicalJson(aad), "utf8"));
    decipher.setAuthTag(envelope.receipt_auth_tag);
    const plaintext = Buffer.concat([
      decipher.update(envelope.receipt_ciphertext),
      decipher.final(),
    ]);
    const actualDigest = Buffer.from(digestReceiptBytes(plaintext), "utf8");
    const expectedDigest = Buffer.from(sealed.receipt_digest ?? "", "utf8");
    if (
      actualDigest.length !== expectedDigest.length ||
      !timingSafeEqual(actualDigest, expectedDigest)
    ) {
      throw new ReceiptSealingError("Receipt digest does not match the sealed payload");
    }
    const parsed = JSON.parse(plaintext.toString("utf8"));
    if (canonicalJson(parsed) !== plaintext.toString("utf8")) {
      throw new ReceiptSealingError("Receipt payload is not canonically encoded");
    }
    return parsed;
  } catch (error) {
    if (error instanceof ReceiptSealingError) throw error;
    throw new ReceiptSealingError("Receipt envelope authentication failed");
  }
}

export function digestReceipt(receipt) {
  return digestReceiptBytes(Buffer.from(canonicalJson(receipt), "utf8"));
}

export function normalizeEncryptionKey(value) {
  const key = Buffer.isBuffer(value)
    ? Buffer.from(value)
    : typeof value === "string"
      ? Buffer.from(value, "base64url")
      : null;
  if (!key || key.length !== 32) {
    throw new ReceiptSealingError("Receipt sealing key must contain exactly 32 bytes");
  }
  return key;
}

function digestReceiptBytes(value) {
  return createHash("sha256").update(value).digest("base64url");
}

function requireText(value, field) {
  if (typeof value !== "string" || value.length === 0 || value.length > 256) {
    throw new ReceiptSealingError(`${field} must be a bounded non-empty string`);
  }
}

export class ReceiptSealingError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReceiptSealingError";
    this.statusCode = 422;
  }
}
