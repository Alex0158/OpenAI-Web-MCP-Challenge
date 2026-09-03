import { DatabaseSync } from "node:sqlite";
import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const SCHEMA_VERSION = 1;
const STORE_FIELDS = Object.freeze(["filename"]);
const ACCOUNT_FIELDS = Object.freeze([
  "account_id",
  "identity",
  "credential_salt",
  "credential_digest",
  "created_at",
]);
const ORGANIZATION_FIELDS = Object.freeze([
  "organization_id",
  "account_id",
  "name",
  "created_at",
]);
const API_KEY_FIELDS = Object.freeze([
  "api_key_id",
  "organization_id",
  "key_digest",
  "key_prefix",
  "created_at",
  "revoked_at",
]);
const SESSION_FIELDS = Object.freeze([
  "session_id",
  "account_id",
  "token_digest",
  "created_at",
  "expires_at",
]);
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60_000;
const CREDENTIAL_SALT_BYTES = 16;
const API_KEY_BYTES = 24;
const SESSION_TOKEN_BYTES = 32;
const IDENTIFIER_MAX_BYTES = 160;
const ORGANIZATION_NAME_MAX_BYTES = 120;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 256;

const SCHEMA_SQL = `
CREATE TABLE reentry_accounts (
  account_id TEXT PRIMARY KEY,
  identity TEXT NOT NULL UNIQUE,
  credential_salt TEXT NOT NULL,
  credential_digest TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE reentry_organizations (
  organization_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES reentry_accounts(account_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX reentry_organizations_account
  ON reentry_organizations(account_id, created_at);

CREATE TABLE reentry_api_keys (
  api_key_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES reentry_organizations(organization_id) ON DELETE CASCADE,
  key_digest TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
) STRICT;

CREATE INDEX reentry_api_keys_organization
  ON reentry_api_keys(organization_id, created_at);

CREATE TABLE reentry_sessions (
  session_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES reentry_accounts(account_id) ON DELETE CASCADE,
  token_digest TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
) STRICT;

CREATE INDEX reentry_sessions_expiry
  ON reentry_sessions(expires_at);
`;

export class CloudAccountStore {
  #database;
  #statements;
  #closed = false;
  #inTransaction = false;

  constructor(options) {
    requireExactRecord(options, STORE_FIELDS, STORE_FIELDS, "Cloud account store options");
    requireFilename(options.filename);
    this.#database = new DatabaseSync(options.filename);
    try {
      this.#configure();
      this.#initializeSchema();
      this.#statements = this.#prepareStatements();
    } catch (error) {
      this.#database.close();
      this.#closed = true;
      throw error;
    }
  }

  registerAccount(input) {
    this.#assertOpen();
    const normalized = normalizeRegistration(input);
    const now = new Date().toISOString();
    const accountId = `acct_${randomUUID()}`;
    const salt = randomBytes(CREDENTIAL_SALT_BYTES).toString("base64url");
    const credentialDigest = deriveCredentialDigest(normalized.password, salt);

    try {
      this.transaction(() => {
        this.#statements.insertAccount.run(
          accountId,
          normalized.identity,
          salt,
          credentialDigest,
          now,
        );
      });
    } catch (error) {
      if (isDuplicateAccountIdentityError(error)) {
        throw storeError("account_exists");
      }
      throw error;
    }

    return {
      account: { account_id: accountId, identity: normalized.identity, created_at: now },
    };
  }

  authenticate(input) {
    this.#assertOpen();
    const normalized = normalizeCredentials(input);
    const record = this.#statements.accountByIdentity.get(normalized.identity);
    if (!record) throw storeError("invalid_credentials");
    const received = Buffer.from(
      deriveCredentialDigest(normalized.password, record.credential_salt),
      "base64url",
    );
    const expected = Buffer.from(record.credential_digest, "base64url");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      throw storeError("invalid_credentials");
    }
    return publicAccount(record);
  }

  createSession(accountId, now = new Date()) {
    this.#assertOpen();
    const account = this.#statements.accountById.get(requireIdentifier(accountId, "accountId"));
    if (!account) throw storeError("account_not_found");
    const createdAt = readDate(now);
    const expiresAt = new Date(createdAt.getTime() + SESSION_LIFETIME_MS);
    const sessionId = `sess_${randomUUID()}`;
    const token = `re_sess_${randomBytes(SESSION_TOKEN_BYTES).toString("base64url")}`;
    this.#statements.insertSession.run(
      sessionId,
      account.account_id,
      digest(token),
      createdAt.toISOString(),
      expiresAt.toISOString(),
    );
    return Object.freeze({ token, expiresAt: expiresAt.toISOString() });
  }

  getSession(token, now = new Date()) {
    this.#assertOpen();
    const normalized = requireToken(token, "Session token");
    const record = this.#statements.sessionByDigest.get(digest(normalized));
    if (!record) return null;
    const current = readDate(now);
    if (Date.parse(record.expires_at) <= current.getTime()) {
      this.#statements.deleteSessionById.run(record.session_id);
      return null;
    }
    return publicAccount(record);
  }

  destroySession(token) {
    this.#assertOpen();
    const normalized = requireToken(token, "Session token");
    this.#statements.deleteSessionByDigest.run(digest(normalized));
  }

  listOrganizations(accountId) {
    this.#assertOpen();
    const normalizedAccountId = requireIdentifier(accountId, "accountId");
    return this.#statements.organizationsByAccount.all(normalizedAccountId).map((row) => ({
      organization_id: row.organization_id,
      name: row.name,
      created_at: row.created_at,
      api_key_count: row.api_key_count,
      active_host_key_count: row.active_host_key_count,
    }));
  }

  listAllOrganizations() {
    this.#assertOpen();
    return this.#statements.allOrganizations.all().map((row) => ({
      organization_id: row.organization_id,
      account_id: row.account_id,
      name: row.name,
      created_at: row.created_at,
    }));
  }

  getOrganization(accountId, organizationId) {
    this.#assertOpen();
    const record = this.#statements.organizationByOwner.get(
      requireIdentifier(accountId, "accountId"),
      requireIdentifier(organizationId, "organizationId"),
    );
    return record ? { ...record } : null;
  }

  createOrganization(accountId, input, now = new Date()) {
    this.#assertOpen();
    const owner = requireIdentifier(accountId, "accountId");
    const name = requireOrganizationName(input?.name);
    const createdAt = readDate(now).toISOString();
    const organizationId = `org_${randomUUID()}`;
    const apiKeyId = `key_${randomUUID()}`;
    const apiKey = createApiKey();
    this.transaction(() => {
      if (!this.#statements.accountById.get(owner)) throw storeError("account_not_found");
      this.#statements.insertOrganization.run(organizationId, owner, name, createdAt);
      this.#statements.insertApiKey.run(
        apiKeyId,
        organizationId,
        digest(apiKey),
        apiKey.slice(0, 16),
        createdAt,
        null,
      );
    });
    return {
      organization: { organization_id: organizationId, name, created_at: createdAt },
      apiKey: { api_key_id: apiKeyId, secret: apiKey, created_at: createdAt },
    };
  }

  deleteOrganization(accountId, organizationId) {
    this.#assertOpen();
    const owner = requireIdentifier(accountId, "accountId");
    const organization = requireIdentifier(organizationId, "organizationId");
    const current = this.#statements.organizationByOwner.get(owner, organization);
    if (!current) throw storeError("organization_not_found");
    const deleted = this.#statements.deleteOrganization.run(organization, owner).changes;
    if (deleted !== 1) throw storeError("organization_not_found");
    return {
      organization_id: current.organization_id,
      name: current.name,
    };
  }

  listApiKeys(accountId, organizationId) {
    this.#assertOpen();
    this.#requireOwnedOrganization(accountId, organizationId);
    return this.#statements.apiKeysByOrganization.all(organizationId).map((row) => ({
      api_key_id: row.api_key_id,
      key_prefix: row.key_prefix,
      created_at: row.created_at,
      revoked_at: row.revoked_at,
      status: row.revoked_at === null ? "active" : "revoked",
    }));
  }

  createApiKey(accountId, organizationId, now = new Date()) {
    this.#assertOpen();
    this.#requireOwnedOrganization(accountId, organizationId);
    const createdAt = readDate(now).toISOString();
    const apiKeyId = `key_${randomUUID()}`;
    const apiKey = createApiKey();
    this.#statements.insertApiKey.run(
      apiKeyId,
      organizationId,
      digest(apiKey),
      apiKey.slice(0, 16),
      createdAt,
      null,
    );
    return { api_key_id: apiKeyId, secret: apiKey, created_at: createdAt };
  }

  revokeApiKey(accountId, organizationId, apiKeyId, now = new Date()) {
    this.#assertOpen();
    this.#requireOwnedOrganization(accountId, organizationId);
    const changed = this.#statements.revokeApiKey.run(
      readDate(now).toISOString(),
      apiKeyId,
      organizationId,
    ).changes;
    if (changed !== 1) throw storeError("api_key_not_found");
  }

  authenticateApiKey(token) {
    this.#assertOpen();
    const normalized = requireToken(token, "Organization API key");
    const record = this.#statements.organizationByApiKey.get(digest(normalized));
    if (!record || record.revoked_at !== null) return null;
    return {
      organization_id: record.organization_id,
      account_id: record.account_id,
      name: record.name,
      api_key_id: record.api_key_id,
    };
  }

  ready() {
    this.#assertOpen();
    return this.#database.prepare("SELECT 1 AS ready").get()?.ready === 1;
  }

  transaction(callback) {
    this.#assertOpen();
    if (typeof callback !== "function") throw new TypeError("Account transaction callback is required");
    if (this.#inTransaction) throw new Error("Nested account transactions are not supported");
    this.#database.exec("BEGIN IMMEDIATE");
    this.#inTransaction = true;
    try {
      const result = callback(this);
      if (result && typeof result.then === "function") {
        throw new TypeError("Account transaction callback must be synchronous");
      }
      this.#database.exec("COMMIT");
      return result;
    } catch (error) {
      try {
        this.#database.exec("ROLLBACK");
      } catch (rollbackError) {
        throw new AggregateError([error, rollbackError], "Account transaction and rollback failed", {
          cause: error,
        });
      }
      throw error;
    } finally {
      this.#inTransaction = false;
    }
  }

  close() {
    if (this.#closed) return;
    if (this.#inTransaction) throw new Error("Cannot close account store during a transaction");
    this.#database.close();
    this.#closed = true;
  }

  #requireOwnedOrganization(accountId, organizationId) {
    const owner = requireIdentifier(accountId, "accountId");
    const organization = requireIdentifier(organizationId, "organizationId");
    if (!this.#statements.organizationByOwner.get(owner, organization)) {
      throw storeError("organization_not_found");
    }
  }

  #configure() {
    this.#database.exec("PRAGMA foreign_keys = ON");
    this.#database.exec("PRAGMA busy_timeout = 5000");
    const journal = this.#database.prepare("PRAGMA journal_mode = WAL").get();
    if (String(journal?.journal_mode).toLowerCase() !== "wal") {
      throw new Error("Account store could not enable WAL journal mode");
    }
    this.#database.exec("PRAGMA synchronous = FULL");
    if (this.#database.prepare("PRAGMA synchronous").get()?.synchronous !== 2) {
      throw new Error("Account store could not enable full synchronous durability");
    }
  }

  #initializeSchema() {
    const version = this.#database.prepare("PRAGMA user_version").get()?.user_version;
    if (version === SCHEMA_VERSION) return;
    if (version !== 0) throw new Error(`Unsupported account store schema version: ${version}`);
    const existingTable = this.#database.prepare(
      "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' LIMIT 1",
    ).get();
    if (existingTable) throw new Error("Unversioned account store database is not empty");
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      this.#database.exec(SCHEMA_SQL);
      this.#database.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
      this.#database.exec("COMMIT");
    } catch (error) {
      try {
        this.#database.exec("ROLLBACK");
      } catch (rollbackError) {
        throw new AggregateError([error, rollbackError], "Account schema setup and rollback failed", {
          cause: error,
        });
      }
      throw error;
    }
  }

  #prepareStatements() {
    return {
      insertAccount: this.#database.prepare(`
        INSERT INTO reentry_accounts (account_id, identity, credential_salt, credential_digest, created_at)
        VALUES (?, ?, ?, ?, ?)
      `),
      insertOrganization: this.#database.prepare(`
        INSERT INTO reentry_organizations (organization_id, account_id, name, created_at)
        VALUES (?, ?, ?, ?)
      `),
      insertApiKey: this.#database.prepare(`
        INSERT INTO reentry_api_keys (
          api_key_id, organization_id, key_digest, key_prefix, created_at, revoked_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `),
      insertSession: this.#database.prepare(`
        INSERT INTO reentry_sessions (session_id, account_id, token_digest, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `),
      accountByIdentity: this.#database.prepare(`
        SELECT a.* FROM reentry_accounts a WHERE a.identity = ?
      `),
      accountById: this.#database.prepare(`
        SELECT a.* FROM reentry_accounts a WHERE a.account_id = ?
      `),
      sessionByDigest: this.#database.prepare(`
        SELECT s.*, a.* FROM reentry_sessions s
        JOIN reentry_accounts a ON a.account_id = s.account_id
        WHERE s.token_digest = ?
      `),
      deleteSessionByDigest: this.#database.prepare(
        "DELETE FROM reentry_sessions WHERE token_digest = ?",
      ),
      deleteSessionById: this.#database.prepare(
        "DELETE FROM reentry_sessions WHERE session_id = ?",
      ),
      organizationsByAccount: this.#database.prepare(`
        SELECT o.organization_id, o.name, o.created_at,
          COUNT(DISTINCT CASE WHEN k.revoked_at IS NULL THEN k.api_key_id END) AS api_key_count,
          0 AS active_host_key_count
        FROM reentry_organizations o
        LEFT JOIN reentry_api_keys k ON k.organization_id = o.organization_id
        WHERE o.account_id = ?
        GROUP BY o.organization_id
        ORDER BY o.created_at ASC, o.organization_id ASC
      `),
      allOrganizations: this.#database.prepare(`
        SELECT organization_id, account_id, name, created_at
        FROM reentry_organizations
        ORDER BY created_at ASC, organization_id ASC
      `),
      organizationByOwner: this.#database.prepare(`
        SELECT organization_id, account_id, name, created_at
        FROM reentry_organizations
        WHERE account_id = ? AND organization_id = ?
      `),
      deleteOrganization: this.#database.prepare(`
        DELETE FROM reentry_organizations
        WHERE organization_id = ? AND account_id = ?
      `),
      apiKeysByOrganization: this.#database.prepare(`
        SELECT api_key_id, key_prefix, created_at, revoked_at
        FROM reentry_api_keys
        WHERE organization_id = ?
        ORDER BY created_at ASC, api_key_id ASC
      `),
      revokeApiKey: this.#database.prepare(`
        UPDATE reentry_api_keys
        SET revoked_at = COALESCE(revoked_at, ?)
        WHERE api_key_id = ? AND organization_id = ?
      `),
      organizationByApiKey: this.#database.prepare(`
        SELECT k.api_key_id, k.revoked_at, o.organization_id, o.account_id, o.name
        FROM reentry_api_keys k
        JOIN reentry_organizations o ON o.organization_id = k.organization_id
        WHERE k.key_digest = ?
      `),
    };
  }

  #assertOpen() {
    if (this.#closed) throw new Error("Account store is closed");
  }
}

export { SESSION_LIFETIME_MS };

function createApiKey() {
  return `re_org_${randomBytes(API_KEY_BYTES).toString("base64url")}`;
}

function deriveCredentialDigest(password, salt) {
  return scryptSync(password, salt, 32, {
    N: 16_384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  }).toString("base64url");
}

function digest(value) {
  return createHash("sha256").update(value, "utf8").digest("base64url");
}

function normalizeRegistration(input) {
  let value;
  try {
    value = requireExactRecord(
      input,
      ["identity", "password"],
      ["identity", "password"],
      "Account registration",
    );
  } catch (error) {
    if (error instanceof TypeError) throw storeError("credentials_invalid");
    throw error;
  }
  const identity = normalizeEmail(value.identity);
  const password = requirePassword(value.password);
  return { identity, password };
}

function normalizeCredentials(input) {
  let value;
  try {
    value = requireExactRecord(
      input,
      ["identity", "password"],
      ["identity", "password"],
      "Account credentials",
    );
  } catch (error) {
    if (error instanceof TypeError) throw storeError("credentials_invalid");
    throw error;
  }
  return {
    identity: normalizeEmail(value.identity),
    password: requirePassword(value.password),
  };
}

function normalizeEmail(value) {
  if (typeof value !== "string") throw storeError("identity_invalid");
  const identity = value.trim().toLowerCase();
  if (
    !EMAIL_PATTERN.test(identity) ||
    Buffer.byteLength(identity, "utf8") > IDENTIFIER_MAX_BYTES ||
    /[\u0000-\u001f\u007f]/.test(identity)
  ) {
    throw storeError("email_invalid");
  }
  return identity;
}

function requirePassword(value) {
  if (
    typeof value !== "string" ||
    value.length < PASSWORD_MIN_LENGTH ||
    Buffer.byteLength(value, "utf8") > PASSWORD_MAX_BYTES ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw storeError("password_invalid");
  }
  return value;
}

function requireOrganizationName(value) {
  if (typeof value !== "string") throw storeError("organization_name_invalid");
  const name = value.trim();
  if (
    name.length < 2 ||
    Buffer.byteLength(name, "utf8") > ORGANIZATION_NAME_MAX_BYTES ||
    /[\u0000-\u001f\u007f]/.test(name)
  ) {
    throw storeError("organization_name_invalid");
  }
  return name;
}

function requireIdentifier(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > IDENTIFIER_MAX_BYTES ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value)
  ) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

function requireToken(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 16 ||
    value.length > 256 ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

function requireFilename(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 4_096 ||
    value.includes("\0") ||
    value === ":memory:" ||
    !value.startsWith("/")
  ) {
    throw new TypeError("Cloud account store filename must be an absolute file-backed path");
  }
}

function readDate(value) {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError("Account store clock must return a valid Date");
  }
  return new Date(value.getTime());
}

function publicAccount(record) {
  return {
    account_id: record.account_id,
    identity: record.identity,
    created_at: record.created_at,
  };
}

function storeError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function requirePlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain object`);
  }
  return value;
}

function isDuplicateAccountIdentityError(error) {
  return error?.code === "SQLITE_CONSTRAINT_UNIQUE"
    || (
      error?.code === "ERR_SQLITE_ERROR"
      && error?.message === "UNIQUE constraint failed: reentry_accounts.identity"
    );
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  const object = requirePlainObject(value, label);
  const fields = Object.keys(object);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw new TypeError(`${label} contains an unsupported field`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw new TypeError(`${label} is missing a required field`);
  }
  return object;
}
