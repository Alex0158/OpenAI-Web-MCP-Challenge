import { createHash, randomBytes } from "node:crypto";

export function createId(prefix) {
  return `${prefix}_${randomBytes(10).toString("base64url")}`;
}

export function createCorrelationId() {
  return createId("corr");
}

export function createBearerToken(prefix) {
  return `${prefix}_${randomBytes(24).toString("base64url")}`;
}

export function digestBearerToken(value) {
  return createHash("sha256").update(value).digest("base64url");
}
