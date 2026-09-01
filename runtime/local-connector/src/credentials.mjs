import { chmod, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

const CREDENTIAL_FIELDS = Object.freeze([
  "version",
  "receiver_origin",
  "connector_id",
  "connector_token",
  "connector_expires_at",
]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export class LocalConnectorCredentialStore {
  #filename;

  constructor(options) {
    if (!options || typeof options !== "object" || Array.isArray(options) || typeof options.filename !== "string" || options.filename.length === 0) {
      throw new TypeError("Credential store requires a filename");
    }
    this.#filename = options.filename;
  }

  async load() {
    let value;
    try {
      value = JSON.parse(await readFile(this.#filename, "utf8"));
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw credentialFailure("connector_credentials_unreadable", "Connector credentials could not be read", error);
    }
    return normalizeCredentials(value);
  }

  async save(value) {
    const normalized = normalizeCredentials(value);
    await mkdir(dirname(this.#filename), { recursive: true, mode: 0o700 });
    const temporary = `${this.#filename}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, `${JSON.stringify(normalized)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
      await chmod(temporary, 0o600);
      await rename(temporary, this.#filename);
      await chmod(this.#filename, 0o600);
    } catch (error) {
      await unlink(temporary).catch(() => {});
      throw credentialFailure("connector_credentials_unwritable", "Connector credentials could not be stored", error);
    }
  }
}

function normalizeCredentials(value) {
  requireExactRecord(value, CREDENTIAL_FIELDS, CREDENTIAL_FIELDS, "Connector credentials");
  if (value.version !== 1) throw credentialFailure("connector_credentials_invalid", "Connector credential version is unsupported");
  if (
    typeof value.receiver_origin !== "string" ||
    !/^https?:\/\/[^/]+$/.test(value.receiver_origin) ||
    (value.receiver_origin.startsWith("http://") && !/http:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(value.receiver_origin))
  ) {
    throw credentialFailure("connector_credentials_invalid", "Connector receiver origin is invalid");
  }
  if (typeof value.connector_id !== "string" || !IDENTIFIER_PATTERN.test(value.connector_id)) {
    throw credentialFailure("connector_credentials_invalid", "Connector ID is invalid");
  }
  if (typeof value.connector_token !== "string" || !TOKEN_PATTERN.test(value.connector_token)) {
    throw credentialFailure("connector_credentials_invalid", "Connector token is invalid");
  }
  const expires = Date.parse(value.connector_expires_at);
  if (typeof value.connector_expires_at !== "string" || !Number.isFinite(expires) || new Date(expires).toISOString() !== value.connector_expires_at) {
    throw credentialFailure("connector_credentials_invalid", "Connector credential expiry is invalid");
  }
  return Object.freeze({ ...value });
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw credentialFailure("connector_credentials_invalid", `${label} must be an object`);
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field)) || requiredFields.some((field) => !fields.includes(field))) {
    throw credentialFailure("connector_credentials_invalid", `${label} fields are invalid`);
  }
}

function credentialFailure(code, message, cause) {
  const error = new Error(`${code}: ${message}`, cause === undefined ? undefined : { cause });
  error.code = code;
  return error;
}
