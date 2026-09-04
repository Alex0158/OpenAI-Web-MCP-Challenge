import { createPublicKey, verify } from "node:crypto";
import { z } from "zod";

const identifier = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => Buffer.byteLength(value, "utf8") <= 160);

const isoTimestamp = z
  .string()
  .max(27)
  .refine((value) => Number.isFinite(Date.parse(value)))
  .refine((value) => new Date(value).toISOString() === value);

const displayText = (maximumBytes: number) =>
  z
    .string()
    .min(1)
    .refine((value) => value.trim() === value)
    .refine((value) => !/[\u0000-\u001f\u007f]/.test(value))
    .refine((value) => Buffer.byteLength(value, "utf8") <= maximumBytes);

const manifestSchema = z
  .object({
    type: z.literal("webmcp.reentry_manifest"),
    protocol_version: z.literal("0.1"),
    manifest_id: identifier,
    correlation_id: identifier,
    issuer_origin: z.string().min(1).max(2_048),
    issued_at: isoTimestamp,
    offer_expires_at: isoTimestamp,
    workflow: z
      .object({
        id: identifier,
        type: identifier,
        state_version: z.number().int().nonnegative(),
        canonical_url: z.string().url().max(2_048),
      })
      .strict(),
    display: z
      .object({
        title: displayText(120),
        reason: displayText(500),
      })
      .strict(),
    grant_request: z
      .object({
        event_type: identifier,
        grant_expires_at: isoTimestamp,
        max_runs: z.literal(1),
        human_boundary: identifier,
      })
      .strict(),
    signature: z
      .object({
        algorithm: z.literal("Ed25519"),
        key_id: identifier,
        value: z.string().length(86).regex(/^[A-Za-z0-9_-]+$/),
      })
      .strict(),
  })
  .strict();

export type ReentryManifest = z.infer<typeof manifestSchema>;

export type ManifestErrorCode =
  | "manifest_invalid"
  | "manifest_signature_invalid"
  | "manifest_origin_mismatch"
  | "manifest_issued_in_future"
  | "manifest_expired";

export class ManifestError extends Error {
  constructor(public readonly code: ManifestErrorCode) {
    super(code);
    this.name = "ManifestError";
  }
}

function canonicalValue(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new ManifestError("manifest_invalid");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalValue(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalValue(item)}`)
      .join(",")}}`;
  }
  throw new ManifestError("manifest_invalid");
}

export function canonicalJson(value: unknown): string {
  return canonicalValue(value);
}

export function normalizeOrigin(value: string): string {
  try {
    const parsed = new URL(value);
    if (
      (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
      parsed.username ||
      parsed.password ||
      parsed.origin !== value ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error("origin is not a bare HTTP origin");
    }
    return parsed.origin;
  } catch {
    throw new ManifestError("manifest_invalid");
  }
}

export function parseManifest(input: unknown): ReentryManifest {
  const result = manifestSchema.safeParse(input);
  if (!result.success) throw new ManifestError("manifest_invalid");

  const manifest = result.data;
  try {
    const issuerOrigin = normalizeOrigin(manifest.issuer_origin);
    const workflowUrl = new URL(manifest.workflow.canonical_url);
    if (
      !["http:", "https:"].includes(workflowUrl.protocol) ||
      workflowUrl.origin !== issuerOrigin ||
      workflowUrl.username ||
      workflowUrl.password ||
      workflowUrl.hash ||
      workflowUrl.href !== manifest.workflow.canonical_url
    ) {
      throw new Error("workflow URL must be HTTPS");
    }
    const issuedAt = Date.parse(manifest.issued_at);
    const offerExpiresAt = Date.parse(manifest.offer_expires_at);
    const grantExpiresAt = Date.parse(manifest.grant_request.grant_expires_at);
    if (offerExpiresAt <= issuedAt || grantExpiresAt <= offerExpiresAt) {
      throw new Error("manifest time window is invalid");
    }
  } catch {
    throw new ManifestError("manifest_invalid");
  }

  return manifest;
}

export function verifyManifest(
  input: unknown,
  expectedOrigin: string,
  publicKeyPem: string
): ReentryManifest {
  const manifest = parseManifest(input);
  let issuerOrigin: string;
  let normalizedExpectedOrigin: string;
  try {
    issuerOrigin = normalizeOrigin(manifest.issuer_origin);
    normalizedExpectedOrigin = normalizeOrigin(expectedOrigin);
  } catch {
    throw new ManifestError("manifest_invalid");
  }

  if (issuerOrigin !== normalizedExpectedOrigin || manifest.signature.value.length > 2_048) {
    if (issuerOrigin !== normalizedExpectedOrigin) {
      throw new ManifestError("manifest_origin_mismatch");
    }
    throw new ManifestError("manifest_signature_invalid");
  }

  const now = new Date();
  const issuedAt = Date.parse(manifest.issued_at);
  const offerExpiresAt = Date.parse(manifest.offer_expires_at);
  if (issuedAt > now.getTime() + 60_000) {
    throw new ManifestError("manifest_issued_in_future");
  }
  if (offerExpiresAt <= now.getTime()) {
    throw new ManifestError("manifest_expired");
  }

  const { signature: _signature, ...unsignedManifest } = manifest;
  try {
    const publicKey = createPublicKey(publicKeyPem);
    const valid = verify(
      null,
      Buffer.from(canonicalJson(unsignedManifest), "utf8"),
      publicKey,
      Buffer.from(manifest.signature.value, "base64url")
    );
    if (!valid) throw new Error("signature did not verify");
  } catch {
    throw new ManifestError("manifest_signature_invalid");
  }

  return manifest;
}

export function validatePublicKeyPem(publicKeyPem: string): void {
  try {
    const publicKey = createPublicKey(publicKeyPem);
    if (publicKey.asymmetricKeyType !== "ed25519") throw new Error("Host key is not Ed25519");
  } catch {
    throw new ManifestError("manifest_invalid");
  }
}
