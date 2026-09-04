import { createHash, randomUUID } from "node:crypto";
import {
  chmod,
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute } from "node:path";

export const LOCAL_TASK_BINDING_TYPE = "webmcp.local_task_binding";
export const LOCAL_TASK_BINDING_PROTOCOL_VERSION = "0.2";
export const LOCAL_TASK_BINDING_STORE_VERSION = 1;

const STORE_FIELDS = Object.freeze(["version", "bindings"]);
const BINDING_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "grant_id",
  "adapter_id",
  "binding_ref",
  "binding_generation",
  "bound_at",
  "status",
]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const DIGEST_PATTERN = /^[0-9a-f]{64}$/;
const TASK_REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const ACTIVE_STATUS = "active";
const RETIRED_STATUS = "retired";

/**
 * Private, restart-safe custody for the task selected during trusted enrollment.
 *
 * This file is deliberately separate from Connector credentials. A Grant authorizes a
 * notification, while this store records the local Adapter target that the user selected in the
 * task's trusted runtime. The binding reference never leaves this process.
 */
export class LocalTaskBindingStore {
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
      const error = new TypeError("Task binding store requires an absolute filename");
      error.code = "local_task_binding_path_invalid";
      throw error;
    }
    this.#filename = options.filename;
  }

  async load() {
    let value;
    try {
      value = JSON.parse(await readFile(this.#filename, "utf8"));
    } catch (error) {
      if (error?.code === "ENOENT") return emptyStore();
      throw bindingFailure(
        "local_task_binding_unreadable",
        "Local task binding store could not be read",
        error,
      );
    }
    return normalizeStore(value);
  }

  async save(value) {
    const normalized = normalizeStore(value);
    const parent = dirname(this.#filename);
    await mkdir(parent, { recursive: true, mode: 0o700 });
    await chmod(parent, 0o700).catch((error) => {
      throw bindingFailure(
        "local_task_binding_unwritable",
        "Local task binding directory could not be protected",
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
      throw bindingFailure(
        "local_task_binding_unwritable",
        "Local task binding store could not be written",
        error,
      );
    }
    return normalized;
  }

  /**
   * Capture a task reference supplied by the trusted local runtime. Reusing the exact active
   * capture is idempotent; replacing an active Grant binding is always an explicit conflict.
   */
  async capture({ grantId, adapterId, bindingRef, boundAt = new Date() }) {
    const grant = requireIdentifier(grantId, "Grant identifier");
    const adapter = requireIdentifier(adapterId, "Adapter identifier");
    const reference = requireTaskReference(bindingRef);
    const timestamp = requireTimestamp(boundAt, "binding time");
    const current = await this.load();
    const existing = current.bindings.find(
      (binding) => binding.grant_id === grant && binding.adapter_id === adapter,
    );
    if (existing?.status === ACTIVE_STATUS) {
      if (existing.binding_ref !== reference) {
        throw bindingFailure(
          "local_task_binding_conflict",
          "An active Grant is already bound to another local task",
        );
      }
      return existing;
    }

    const nextBinding = normalizeBinding({
      type: LOCAL_TASK_BINDING_TYPE,
      protocol_version: LOCAL_TASK_BINDING_PROTOCOL_VERSION,
      grant_id: grant,
      adapter_id: adapter,
      binding_ref: reference,
      binding_generation: createBindingGeneration({ grantId: grant, adapterId: adapter }),
      bound_at: timestamp,
      status: ACTIVE_STATUS,
    });
    const bindings = current.bindings.filter(
      (binding) => !(binding.grant_id === grant && binding.adapter_id === adapter),
    );
    await this.save({ version: LOCAL_TASK_BINDING_STORE_VERSION, bindings: [...bindings, nextBinding] });
    return nextBinding;
  }

  /** Resolve only an active binding in the exact Grant and Adapter scope. */
  async resolve({ grantId, adapterId }) {
    const grant = requireIdentifier(grantId, "Grant identifier");
    const adapter = requireIdentifier(adapterId, "Adapter identifier");
    const store = await this.load();
    const binding = store.bindings.find(
      (candidate) =>
        candidate.grant_id === grant &&
        candidate.adapter_id === adapter &&
        candidate.status === ACTIVE_STATUS,
    );
    return binding ?? null;
  }

  /** Retire a local mapping without deleting the audit-safe record or replacing another Grant. */
  async retire({ grantId, adapterId }) {
    const grant = requireIdentifier(grantId, "Grant identifier");
    const adapter = requireIdentifier(adapterId, "Adapter identifier");
    const current = await this.load();
    const index = current.bindings.findIndex(
      (binding) => binding.grant_id === grant && binding.adapter_id === adapter,
    );
    if (index < 0 || current.bindings[index].status === RETIRED_STATUS) return false;
    const bindings = [...current.bindings];
    bindings[index] = normalizeBinding({ ...bindings[index], status: RETIRED_STATUS });
    await this.save({ version: LOCAL_TASK_BINDING_STORE_VERSION, bindings });
    return true;
  }

  /** Retire every active local mapping during an explicit Connector disconnect/uninstall. */
  async retireAll() {
    const current = await this.load();
    const active = current.bindings.filter((binding) => binding.status === ACTIVE_STATUS).length;
    if (active === 0) return 0;
    const bindings = current.bindings.map((binding) =>
      binding.status === ACTIVE_STATUS
        ? normalizeBinding({ ...binding, status: RETIRED_STATUS })
        : binding,
    );
    await this.save({ version: LOCAL_TASK_BINDING_STORE_VERSION, bindings });
    return active;
  }
}

/** Capture only the task identity provided by the current trusted Codex runtime environment. */
export async function captureCurrentCodexTaskBinding({
  store,
  grantId,
  adapterId,
  environment = process.env,
  boundAt = new Date(),
}) {
  if (!(store instanceof LocalTaskBindingStore)) {
    throw new TypeError("Trusted task binding capture requires a LocalTaskBindingStore");
  }
  if (!environment || typeof environment !== "object" || Array.isArray(environment)) {
    throw new TypeError("Trusted task binding capture environment is invalid");
  }
  const reference = environment.CODEX_SESSION_ID;
  if (typeof reference !== "string" || reference.length === 0) {
    throw bindingFailure(
      "local_task_binding_runtime_unavailable",
      "The current trusted Codex runtime did not provide a task identity",
    );
  }
  return store.capture({ grantId, adapterId, bindingRef: reference, boundAt });
}

/** A safe status projection for CLI/UI output; it intentionally omits the private locator. */
export function summarizeTaskBindings(value) {
  const store = normalizeStore(value);
  return Object.freeze({
    version: store.version,
    bindings: Object.freeze(
      store.bindings.map((binding) => Object.freeze({
        type: binding.type,
        protocol_version: binding.protocol_version,
        grant_id: binding.grant_id,
        adapter_id: binding.adapter_id,
        binding_generation: binding.binding_generation,
        bound_at: binding.bound_at,
        status: binding.status,
      })),
    ),
  });
}

export function createBindingGeneration({ grantId, adapterId }) {
  const grant = requireIdentifier(grantId, "Grant identifier");
  const adapter = requireIdentifier(adapterId, "Adapter identifier");
  return createHash("sha256")
    .update(`${LOCAL_TASK_BINDING_STORE_VERSION}\u0000${grant}\u0000${adapter}\u0000${randomUUID()}`)
    .digest("hex");
}

function emptyStore() {
  return Object.freeze({ version: LOCAL_TASK_BINDING_STORE_VERSION, bindings: Object.freeze([]) });
}

function normalizeStore(value) {
  requireExactRecord(value, STORE_FIELDS, "Local task binding store");
  if (value.version !== LOCAL_TASK_BINDING_STORE_VERSION || !Array.isArray(value.bindings)) {
    throw bindingFailure("local_task_binding_invalid", "Local task binding store version is unsupported");
  }
  const bindings = value.bindings.map((binding) => normalizeBinding(binding));
  const seen = new Set();
  for (const binding of bindings) {
    const key = `${binding.grant_id}\u0000${binding.adapter_id}`;
    if (seen.has(key)) {
      throw bindingFailure("local_task_binding_invalid", "Local task binding store contains a duplicate scope");
    }
    seen.add(key);
  }
  return Object.freeze({
    version: LOCAL_TASK_BINDING_STORE_VERSION,
    bindings: Object.freeze(bindings),
  });
}

function normalizeBinding(value) {
  requireExactRecord(value, BINDING_FIELDS, "Local task binding");
  if (
    value.type !== LOCAL_TASK_BINDING_TYPE ||
    value.protocol_version !== LOCAL_TASK_BINDING_PROTOCOL_VERSION ||
    (value.status !== ACTIVE_STATUS && value.status !== RETIRED_STATUS)
  ) {
    throw bindingFailure("local_task_binding_invalid", "Local task binding is unsupported");
  }
  return Object.freeze({
    type: LOCAL_TASK_BINDING_TYPE,
    protocol_version: LOCAL_TASK_BINDING_PROTOCOL_VERSION,
    grant_id: requireIdentifier(value.grant_id, "Grant identifier"),
    adapter_id: requireIdentifier(value.adapter_id, "Adapter identifier"),
    binding_ref: requireTaskReference(value.binding_ref),
    binding_generation: requireDigest(value.binding_generation),
    bound_at: requireTimestamp(value.bound_at, "binding time"),
    status: value.status,
  });
}

function requireExactRecord(value, fields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw bindingFailure("local_task_binding_invalid", `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw bindingFailure("local_task_binding_invalid", `${label} must be a plain object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (
    actual.length !== expected.length ||
    actual.some((field, index) => field !== expected[index])
  ) {
    throw bindingFailure("local_task_binding_invalid", `${label} fields are invalid`);
  }
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw bindingFailure("local_task_binding_invalid", `${label} is invalid`);
  }
  return value;
}

function requireTaskReference(value) {
  if (
    typeof value !== "string" ||
    !TASK_REFERENCE_PATTERN.test(value) ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    throw bindingFailure("local_task_binding_invalid", "Local task reference is invalid");
  }
  return value;
}

function requireDigest(value) {
  if (typeof value !== "string" || !DIGEST_PATTERN.test(value)) {
    throw bindingFailure("local_task_binding_invalid", "Binding generation is invalid");
  }
  return value;
}

function requireTimestamp(value, label) {
  if (!(value instanceof Date)) {
    if (typeof value !== "string") {
      throw bindingFailure("local_task_binding_invalid", `${label} is invalid`);
    }
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
      throw bindingFailure("local_task_binding_invalid", `${label} is invalid`);
    }
    return value;
  }
  if (!Number.isFinite(value.getTime())) {
    throw bindingFailure("local_task_binding_invalid", `${label} is invalid`);
  }
  return value.toISOString();
}

function bindingFailure(code, message, cause) {
  const error = new Error(`${code}: ${message}`, cause === undefined ? undefined : { cause });
  error.name = "LocalTaskBindingError";
  error.code = code;
  return error;
}
