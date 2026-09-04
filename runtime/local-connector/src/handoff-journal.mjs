import { randomUUID } from "node:crypto";
import {
  chmod,
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute } from "node:path";

import {
  validateNotificationHandoffReceipt,
  validateRuntimeAdmissionAttestation,
} from "@webmcp-challenge/reentry-core/notification-handoff";

export const LOCAL_HANDOFF_JOURNAL_TYPE = "webmcp.local_handoff_journal";
export const LOCAL_HANDOFF_JOURNAL_PROTOCOL_VERSION = "0.2";
export const LOCAL_HANDOFF_JOURNAL_VERSION = 1;

const JOURNAL_FIELDS = Object.freeze(["version", "entries"]);
const ENTRY_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "handoff_id",
  "delivery_id",
  "event_id",
  "state",
  "code",
  "recorded_at",
  "runtime_admission_attestation",
  "receipt",
]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const TIMESTAMP_MAX_LENGTH = 27;
const JOURNAL_STATES = new Set([
  "runtime_pending",
  "runtime_unknown",
  "unsupported",
  "handoff_pending",
  "handed_off",
]);
const MAX_ENTRIES = 10_000;

/**
 * Private, restart-safe record of a standing handoff boundary.
 *
 * The journal intentionally contains only correlation identifiers, the opaque runtime
 * attestation, and the Receiver receipt. It never stores a lease token, Connector token,
 * prompt, canonical page, or raw task locator. A runtime-unknown entry is immutable and acts as
 * a quarantine marker; an admitted entry can safely retry only the Receiver receipt because the
 * runtime attestation was already returned before the journal write.
 */
export class LocalHandoffJournalStore {
  #filename;

  constructor(options) {
    if (
      !options ||
      typeof options !== "object" ||
      Array.isArray(options) ||
      typeof options.filename !== "string" ||
      options.filename.length === 0 ||
      !isAbsolute(options.filename)
    ) {
      const error = new TypeError("Handoff journal requires an absolute filename");
      error.code = "local_handoff_journal_path_invalid";
      throw error;
    }
    this.#filename = options.filename;
  }

  async load() {
    let value;
    try {
      value = JSON.parse(await readFile(this.#filename, "utf8"));
    } catch (error) {
      if (error?.code === "ENOENT") return emptyJournal();
      throw journalFailure(
        "local_handoff_journal_unreadable",
        "Local handoff journal could not be read",
        error,
      );
    }
    return normalizeJournal(value);
  }

  async save(value) {
    const normalized = normalizeJournal(value);
    const parent = dirname(this.#filename);
    await mkdir(parent, { recursive: true, mode: 0o700 });
    await chmod(parent, 0o700).catch((error) => {
      throw journalFailure(
        "local_handoff_journal_unwritable",
        "Local handoff journal directory could not be protected",
        error,
      );
    });
    const temporary = `${this.#filename}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, `${JSON.stringify(normalized)}\n`, {
        encoding: "utf8",
        mode: 0o600,
        flag: "wx",
      });
      await chmod(temporary, 0o600);
      await rename(temporary, this.#filename);
      await chmod(this.#filename, 0o600);
    } catch (error) {
      await unlink(temporary).catch(() => {});
      throw journalFailure(
        "local_handoff_journal_unwritable",
        "Local handoff journal could not be written",
        error,
      );
    }
    return normalized;
  }

  /** Return one exact handoff record, or null when this identity has not been seen. */
  async get({ handoffId }) {
    const id = requireIdentifier(handoffId, "handoffId");
    const journal = await this.load();
    return journal.entries.find((entry) => entry.handoff_id === id) ?? null;
  }

  /**
   * Reserve one handoff identity before invoking the runtime. If the Connector dies during the
   * call, the next process sees `runtime_pending` and stops instead of blindly queueing again.
   */
  async begin({ handoffId, deliveryId, eventId, recordedAt = new Date() }) {
    const identity = requireIdentity({ handoffId, deliveryId, eventId });
    const entry = normalizeEntry({
      type: LOCAL_HANDOFF_JOURNAL_TYPE,
      protocol_version: LOCAL_HANDOFF_JOURNAL_PROTOCOL_VERSION,
      ...identity,
      state: "runtime_pending",
      code: "runtime_admission_attempting",
      recorded_at: requireTimestamp(recordedAt, "recordedAt"),
      runtime_admission_attestation: null,
      receipt: null,
    });
    const journal = await this.load();
    const existing = journal.entries.find((candidate) => candidate.handoff_id === identity.handoff_id);
    if (existing) {
      assertSameIdentity(existing, identity);
      if (existing.state === "unsupported") {
        const entries = journal.entries.map((candidate) =>
          candidate.handoff_id === identity.handoff_id ? entry : candidate,
        );
        await this.save({ version: LOCAL_HANDOFF_JOURNAL_VERSION, entries });
        return entry;
      }
      return existing;
    }
    if (journal.entries.length >= MAX_ENTRIES) {
      throw journalFailure(
        "local_handoff_journal_full",
        "Local handoff journal reached its bounded entry limit",
      );
    }
    await this.save({
      version: LOCAL_HANDOFF_JOURNAL_VERSION,
      entries: [...journal.entries, entry],
    });
    return entry;
  }

  /** Record a capability miss that did not cross the runtime boundary. */
  async recordUnsupported({ handoffId, deliveryId, eventId, code, recordedAt = new Date() }) {
    const identity = requireIdentity({ handoffId, deliveryId, eventId });
    const entry = normalizeEntry({
      type: LOCAL_HANDOFF_JOURNAL_TYPE,
      protocol_version: LOCAL_HANDOFF_JOURNAL_PROTOCOL_VERSION,
      ...identity,
      state: "unsupported",
      code: requireCode(code),
      recorded_at: requireTimestamp(recordedAt, "recordedAt"),
      runtime_admission_attestation: null,
      receipt: null,
    });
    const journal = await this.load();
    const existing = journal.entries.find((candidate) => candidate.handoff_id === identity.handoff_id);
    if (!existing) return this.#appendOrReuse(entry);
    assertSameIdentity(existing, identity);
    if (existing.state === "unsupported" && existing.code === entry.code) return existing;
    if (existing.state !== "runtime_pending") {
      throw journalFailure(
        "local_handoff_journal_conflict",
        "A handoff journal identity has already crossed the runtime boundary",
      );
    }
    const entries = journal.entries.map((candidate) =>
      candidate.handoff_id === identity.handoff_id ? entry : candidate,
    );
    await this.save({ version: LOCAL_HANDOFF_JOURNAL_VERSION, entries });
    return entry;
  }

  /**
   * Record that runtime admission became ambiguous before a qualified attestation existed.
   * This state is immutable: changing it into success would permit an unsafe blind resend.
   */
  async recordRuntimeUnknown({ handoffId, deliveryId, eventId, code, recordedAt = new Date() }) {
    const identity = requireIdentity({ handoffId, deliveryId, eventId });
    const entry = normalizeEntry({
      type: LOCAL_HANDOFF_JOURNAL_TYPE,
      protocol_version: LOCAL_HANDOFF_JOURNAL_PROTOCOL_VERSION,
      ...identity,
      state: "runtime_unknown",
      code: requireCode(code),
      recorded_at: requireTimestamp(recordedAt, "recordedAt"),
      runtime_admission_attestation: null,
      receipt: null,
    });
    const journal = await this.load();
    const existing = journal.entries.find((candidate) => candidate.handoff_id === identity.handoff_id);
    if (!existing) return this.#appendOrReuse(entry);
    assertSameIdentity(existing, identity);
    if (existing.state === "runtime_unknown" && existing.code === entry.code) return existing;
    if (existing.state !== "runtime_pending") {
      throw journalFailure(
        "local_handoff_journal_conflict",
        "A handoff journal identity cannot be changed after runtime outcome is recorded",
      );
    }
    const entries = journal.entries.map((candidate) =>
      candidate.handoff_id === identity.handoff_id ? entry : candidate,
    );
    await this.save({ version: LOCAL_HANDOFF_JOURNAL_VERSION, entries });
    return entry;
  }

  /**
   * Persist the qualified runtime attestation before calling the Receiver. If the Receiver
   * response is lost, the same attestation can be submitted after lease reclaim without waking
   * the task a second time.
   */
  async recordAdmission({ handoffId, deliveryId, eventId, attestation, recordedAt = new Date() }) {
    const identity = requireIdentity({ handoffId, deliveryId, eventId });
    const normalizedAttestation = validateRuntimeAdmissionAttestation(attestation, validationScope(identity));
    const entry = normalizeEntry({
      type: LOCAL_HANDOFF_JOURNAL_TYPE,
      protocol_version: LOCAL_HANDOFF_JOURNAL_PROTOCOL_VERSION,
      ...identity,
      state: "handoff_pending",
      code: "runtime_admission_accepted",
      recorded_at: requireTimestamp(recordedAt, "recordedAt"),
      runtime_admission_attestation: normalizedAttestation,
      receipt: null,
    });
    const journal = await this.load();
    const existing = journal.entries.find((candidate) => candidate.handoff_id === identity.handoff_id);
    if (!existing) {
      throw journalFailure(
        "local_handoff_journal_attempt_missing",
        "A runtime admission cannot be recorded without a reserved attempt",
      );
    }
    assertSameIdentity(existing, identity);
    if (existing.state === "handoff_pending") {
      if (
        canonicalEntry(existing.runtime_admission_attestation) ===
        canonicalEntry(normalizedAttestation)
      ) {
        return existing;
      }
      throw journalFailure(
        "local_handoff_journal_conflict",
        "A handoff identity already has a different runtime admission",
      );
    }
    if (existing.state === "handed_off") return existing;
    if (existing.state !== "runtime_pending") {
      throw journalFailure(
        "local_handoff_journal_conflict",
        "A handoff identity cannot be admitted after an unknown or unsupported runtime outcome",
      );
    }
    const entries = journal.entries.map((candidate) =>
      candidate.handoff_id === identity.handoff_id ? entry : candidate,
    );
    await this.save({ version: LOCAL_HANDOFF_JOURNAL_VERSION, entries });
    return entry;
  }

  /** Record the Receiver's receipt after a known handoff response. */
  async recordHandoff({ handoffId, deliveryId, eventId, receipt, recordedAt = new Date() }) {
    const identity = requireIdentity({ handoffId, deliveryId, eventId });
    const journal = await this.load();
    const existing = journal.entries.find((entry) => entry.handoff_id === identity.handoff_id);
    if (!existing) {
      throw journalFailure(
        "local_handoff_journal_admission_missing",
        "A handoff receipt cannot be recorded without a persisted admission",
      );
    }
    assertSameIdentity(existing, identity);
    const normalizedReceipt = validateNotificationHandoffReceipt(receipt, validationScope(identity));
    if (existing.state === "runtime_unknown" || existing.state === "runtime_pending") {
      throw journalFailure(
        "local_handoff_journal_conflict",
        "A runtime-unknown handoff cannot be upgraded without explicit reconciliation",
      );
    }
    if (existing.state === "unsupported") {
      throw journalFailure(
        "local_handoff_journal_conflict",
        "An unsupported handoff cannot record a Receiver receipt",
      );
    }
    if (existing.runtime_admission_attestation === null) {
      throw journalFailure(
        "local_handoff_journal_invalid",
        "A handoff receipt is missing its runtime admission attestation",
      );
    }
    if (existing.state === "handed_off") {
      if (canonicalEntry(existing.receipt) === canonicalEntry(normalizedReceipt)) return existing;
      throw journalFailure(
        "local_handoff_journal_conflict",
        "A handoff identity already has a different Receiver receipt",
      );
    }
    if (existing.state !== "handoff_pending") {
      throw journalFailure(
        "local_handoff_journal_conflict",
        "A Receiver receipt requires a persisted runtime admission",
      );
    }
    const entry = normalizeEntry({
      type: LOCAL_HANDOFF_JOURNAL_TYPE,
      protocol_version: LOCAL_HANDOFF_JOURNAL_PROTOCOL_VERSION,
      ...identity,
      state: "handed_off",
      code: "notification_handoff_accepted",
      recorded_at: requireTimestamp(recordedAt, "recordedAt"),
      runtime_admission_attestation: existing.runtime_admission_attestation,
      receipt: normalizedReceipt,
    });
    if (
      normalizedReceipt.runtime_admission_ref !== existing.runtime_admission_attestation.admission_id
    ) {
      throw journalFailure(
        "local_handoff_journal_conflict",
        "Receiver receipt does not reference the stored runtime admission",
      );
    }
    const entries = journal.entries.map((candidate) =>
      candidate.handoff_id === identity.handoff_id ? entry : candidate,
    );
    await this.save({ version: LOCAL_HANDOFF_JOURNAL_VERSION, entries });
    return entry;
  }

  /** Return a redacted count/state projection for CLI or diagnostics. */
  async summarize() {
    const journal = await this.load();
    return Object.freeze({
      version: journal.version,
      entries: Object.freeze(
        journal.entries.map((entry) => Object.freeze({
          type: entry.type,
          protocol_version: entry.protocol_version,
          handoff_id: entry.handoff_id,
          delivery_id: entry.delivery_id,
          event_id: entry.event_id,
          state: entry.state,
          code: entry.code,
          recorded_at: entry.recorded_at,
        })),
      ),
    });
  }

  async #appendOrReuse(entry) {
    const journal = await this.load();
    const existing = journal.entries.find((candidate) => candidate.handoff_id === entry.handoff_id);
    if (existing) {
      assertSameIdentity(existing, entry);
      if (existing.state === entry.state && canonicalEntry(existing) === canonicalEntry(entry)) {
        return existing;
      }
      throw journalFailure(
        "local_handoff_journal_conflict",
        "Handoff journal identity already has a different terminal state",
      );
    }
    if (journal.entries.length >= MAX_ENTRIES) {
      throw journalFailure(
        "local_handoff_journal_full",
        "Local handoff journal reached its bounded entry limit",
      );
    }
    await this.save({
      version: LOCAL_HANDOFF_JOURNAL_VERSION,
      entries: [...journal.entries, entry],
    });
    return entry;
  }
}

export function summarizeHandoffJournal(value) {
  const journal = normalizeJournal(value);
  return Object.freeze({
    version: journal.version,
    entries: Object.freeze(
      journal.entries.map((entry) => Object.freeze({
        type: entry.type,
        protocol_version: entry.protocol_version,
        handoff_id: entry.handoff_id,
        delivery_id: entry.delivery_id,
        event_id: entry.event_id,
        state: entry.state,
        code: entry.code,
        recorded_at: entry.recorded_at,
      })),
    ),
  });
}

function emptyJournal() {
  return Object.freeze({
    version: LOCAL_HANDOFF_JOURNAL_VERSION,
    entries: Object.freeze([]),
  });
}

function normalizeJournal(value) {
  requireExactRecord(value, JOURNAL_FIELDS, "Local handoff journal");
  if (
    value.version !== LOCAL_HANDOFF_JOURNAL_VERSION ||
    !Array.isArray(value.entries) ||
    value.entries.length > MAX_ENTRIES
  ) {
    throw journalFailure("local_handoff_journal_invalid", "Local handoff journal version or size is unsupported");
  }
  const entries = value.entries.map((entry) => normalizeEntry(entry));
  const seen = new Set();
  for (const entry of entries) {
    if (seen.has(entry.handoff_id)) {
      throw journalFailure("local_handoff_journal_invalid", "Local handoff journal contains a duplicate handoff");
    }
    seen.add(entry.handoff_id);
  }
  return Object.freeze({
    version: LOCAL_HANDOFF_JOURNAL_VERSION,
    entries: Object.freeze(entries),
  });
}

function normalizeEntry(value) {
  requireExactRecord(value, ENTRY_FIELDS, "Local handoff journal entry");
  if (
    value.type !== LOCAL_HANDOFF_JOURNAL_TYPE ||
    value.protocol_version !== LOCAL_HANDOFF_JOURNAL_PROTOCOL_VERSION ||
    !JOURNAL_STATES.has(value.state) ||
    ((value.state === "runtime_pending" || value.state === "runtime_unknown" || value.state === "unsupported") && (value.runtime_admission_attestation !== null || value.receipt !== null)) ||
    (value.state === "handoff_pending" && (value.runtime_admission_attestation === null || value.receipt !== null)) ||
    (value.state === "handed_off" && (value.runtime_admission_attestation === null || value.receipt === null))
  ) {
    throw journalFailure("local_handoff_journal_invalid", "Local handoff journal entry is unsupported");
  }
  const identity = requireIdentity({
    handoffId: value.handoff_id,
    deliveryId: value.delivery_id,
    eventId: value.event_id,
  });
  const recordedAt = requireTimestamp(value.recorded_at, "recorded_at");
  const code = requireCode(value.code);
  const attestation = value.runtime_admission_attestation === null
    ? null
    : validateRuntimeAdmissionAttestation(value.runtime_admission_attestation, validationScope(identity));
  const receipt = value.receipt === null
    ? null
    : validateNotificationHandoffReceipt(value.receipt, validationScope(identity));
  if (
    receipt !== null &&
    attestation !== null &&
    receipt.runtime_admission_ref !== attestation.admission_id
  ) {
    throw journalFailure(
      "local_handoff_journal_invalid",
      "Receiver receipt does not reference the stored runtime admission",
    );
  }
  return Object.freeze({
    type: LOCAL_HANDOFF_JOURNAL_TYPE,
    protocol_version: LOCAL_HANDOFF_JOURNAL_PROTOCOL_VERSION,
    ...identity,
    state: value.state,
    code,
    recorded_at: recordedAt,
    runtime_admission_attestation: attestation,
    receipt,
  });
}

function requireIdentity({ handoffId, deliveryId, eventId }) {
  return {
    handoff_id: requireIdentifier(handoffId, "handoffId"),
    delivery_id: requireIdentifier(deliveryId, "deliveryId"),
    event_id: requireIdentifier(eventId, "eventId"),
  };
}

function assertSameIdentity(existing, candidate) {
  if (
    existing.handoff_id !== candidate.handoff_id ||
    existing.delivery_id !== candidate.delivery_id ||
    existing.event_id !== candidate.event_id
  ) {
    throw journalFailure(
      "local_handoff_journal_identity_conflict",
      "Handoff journal identity does not match the persisted delivery",
    );
  }
}

function validationScope(identity) {
  return {
    deliveryId: identity.delivery_id,
    eventId: identity.event_id,
    handoffId: identity.handoff_id,
  };
}

function canonicalEntry(value) {
  return JSON.stringify(value);
}

function requireExactRecord(value, fields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw journalFailure("local_handoff_journal_invalid", `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw journalFailure("local_handoff_journal_invalid", `${label} must be a plain object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (
    actual.length !== expected.length ||
    actual.some((field, index) => field !== expected[index])
  ) {
    throw journalFailure("local_handoff_journal_invalid", `${label} fields are invalid`);
  }
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw journalFailure("local_handoff_journal_invalid", `${label} is invalid`);
  }
  return value;
}

function requireCode(value) {
  if (typeof value !== "string" || !/^[a-z][a-z0-9_]{0,95}$/.test(value)) {
    throw journalFailure("local_handoff_journal_invalid", "handoff code is invalid");
  }
  return value;
}

function requireTimestamp(value, label) {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) {
      throw journalFailure("local_handoff_journal_invalid", `${label} is invalid`);
    }
    return value.toISOString();
  }
  if (
    typeof value !== "string" ||
    value.length > TIMESTAMP_MAX_LENGTH ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(Date.parse(value)).toISOString() !== value
  ) {
    throw journalFailure("local_handoff_journal_invalid", `${label} is invalid`);
  }
  return value;
}

function journalFailure(code, message, cause) {
  const error = new Error(`${code}: ${message}`, cause === undefined ? undefined : { cause });
  error.code = code;
  return error;
}
