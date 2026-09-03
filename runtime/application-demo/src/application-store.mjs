import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute } from "node:path";

const SCHEMA_VERSION = 1;
const WORKFLOW_ID = "application_demo_001";
const WORKFLOW_TYPE = "application_review";
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;

export async function openApplicationStore(options) {
  requireExactRecord(options, ["filename", "clock", "createId"], ["filename"], "Application store options");
  const filename = requireAbsolutePath(options.filename);
  const clock = options.clock ?? (() => new Date());
  const createId = options.createId ?? ((prefix) => `${prefix}_${randomBytes(16).toString("hex")}`);
  if (typeof clock !== "function") throw new TypeError("Application store clock must be a function");
  if (typeof createId !== "function") throw new TypeError("Application store createId must be a function");

  await mkdir(dirname(filename), { recursive: true, mode: 0o700 });
  let state;
  try {
    state = validateStoredState(JSON.parse(await readFile(filename, "utf8")));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    state = createInitialState();
    await persist(filename, state);
  }

  let queue = Promise.resolve();

  return Object.freeze({
    snapshot,
    attachBinding,
    saveDraft,
    submit,
    approve,
    markEventSent,
    markEventFailure,
    prepareNextStage,
    reviseNextStagePlan,
    markDeliveryAcknowledged,
    acceptNextStage,
  });

  async function snapshot() {
    await queue;
    return clone(state);
  }

  function attachBinding(binding) {
    return mutate((draft) => {
      validateBinding(binding, draft.workflow_id);
      if (draft.status !== "DRAFT") throw applicationFailure("application_consent_unavailable", 409);
      if (draft.reentry.binding !== null) {
        if (draft.reentry.binding.binding_id !== binding.binding_id) {
          throw applicationFailure("application_binding_conflict", 409);
        }
        return;
      }
      draft.reentry.binding = clone(binding);
      draft.reentry.consent_status = "APPROVED";
    });
  }

  function saveDraft(input) {
    return mutate((draft) => {
      requireExactRecord(
        input,
        ["expected_state_version", "expected_revision", "form"],
        ["expected_state_version", "expected_revision", "form"],
        "Application draft",
      );
      requireRevision(input, draft);
      if (draft.status !== "DRAFT") throw applicationFailure("application_draft_unavailable", 409);
      draft.artifact.form = normalizeForm(input.form);
      draft.artifact.revision += 1;
      draft.state_version += 1;
    });
  }

  function submit(input) {
    return mutate((draft) => {
      requireExactRecord(
        input,
        ["control_token_valid", "expected_state_version", "expected_revision", "form"],
        ["control_token_valid", "expected_state_version", "expected_revision", "form"],
        "Application submission",
      );
      if (input.control_token_valid !== true) throw applicationFailure("application_human_control_invalid", 403);
      requireRevision(input, draft);
      if (draft.status !== "DRAFT") throw applicationFailure("application_submission_unavailable", 409);
      if (draft.reentry.binding === null) throw applicationFailure("application_consent_required", 409);
      draft.artifact.form = normalizeForm(input.form);
      draft.artifact.revision += 1;
      draft.status = "SUBMITTED";
      draft.state_version += 1;
      draft.submitted_at = readTimestamp(clock);
    });
  }

  function approve(input) {
    return mutate((draft) => {
      requireExactRecord(
        input,
        ["control_token_valid", "expected_state_version", "expected_revision"],
        ["control_token_valid", "expected_state_version", "expected_revision"],
        "Application approval",
      );
      if (input.control_token_valid !== true) throw applicationFailure("application_reviewer_control_invalid", 403);
      requireRevision(input, draft);
      if (draft.status === "APPROVED" && draft.reentry.event.status !== "NOT_READY") return;
      if (draft.status !== "SUBMITTED") throw applicationFailure("application_approval_unavailable", 409);
      const eventId = requireCreatedIdentifier(createId("event"), "event identifier");
      draft.status = "APPROVED";
      draft.state_version += 1;
      draft.reviewed_at = readTimestamp(clock);
      draft.reentry.event = {
        status: "PENDING",
        event_id: eventId,
        occurred_at: draft.reviewed_at,
        receiver_event_id: null,
        last_error_code: null,
      };
    });
  }

  function markEventSent(input) {
    return mutate((draft) => {
      requireExactRecord(input, ["event_id", "receiver_event_id"], ["event_id", "receiver_event_id"], "Event acceptance");
      requireEventIdentity(input.event_id, draft);
      if (typeof input.receiver_event_id !== "string" || !IDENTIFIER_PATTERN.test(input.receiver_event_id)) {
        throw applicationFailure("application_event_acceptance_invalid", 500);
      }
      if (draft.reentry.event.status === "SENT") {
        if (draft.reentry.event.receiver_event_id !== input.receiver_event_id) {
          throw applicationFailure("application_event_acceptance_conflict", 409);
        }
        return;
      }
      draft.reentry.event.status = "SENT";
      draft.reentry.event.receiver_event_id = input.receiver_event_id;
      draft.reentry.event.last_error_code = null;
    });
  }

  function markEventFailure(input) {
    return mutate((draft) => {
      requireExactRecord(input, ["event_id", "code"], ["event_id", "code"], "Event failure");
      requireEventIdentity(input.event_id, draft);
      if (draft.reentry.event.status === "SENT") return;
      draft.reentry.event.status = "PENDING";
      draft.reentry.event.last_error_code = requireFailureCode(input.code);
    });
  }

  function prepareNextStage(input) {
    return mutate((draft) => {
      requireExactRecord(
        input,
        ["content", "expected_state_version", "expected_revision", "delivery_id"],
        ["content", "expected_state_version", "expected_revision", "delivery_id"],
        "Next-stage preparation",
      );
      const deliveryId = requireCreatedIdentifier(input.delivery_id, "delivery identifier");
      if (draft.reentry.delivery.delivery_id === deliveryId && draft.status === "NEXT_STAGE_READY") return;
      requireRevision(input, draft);
      if (
        draft.status !== "APPROVED" ||
        !["PENDING", "SENT"].includes(draft.reentry.event.status)
      ) {
        throw applicationFailure("application_continuation_unavailable", 409);
      }
      const content = requireText(input.content, 1, 2_000, "Next-stage plan");
      draft.artifact.next_stage_plan = content;
      draft.artifact.revision += 1;
      draft.status = "NEXT_STAGE_READY";
      draft.state_version += 1;
      draft.reentry.delivery = {
        status: "EFFECT_READY",
        delivery_id: deliveryId,
        effect_id: null,
      };
    });
  }

  function reviseNextStagePlan(input) {
    return mutate((draft) => {
      requireExactRecord(
        input,
        ["content", "expected_state_version", "expected_revision"],
        ["content", "expected_state_version", "expected_revision"],
        "Next-stage plan revision",
      );
      requireRevision(input, draft);
      if (draft.status !== "NEXT_STAGE_READY" || draft.human_boundary.accepted) {
        throw applicationFailure("application_plan_revision_unavailable", 409);
      }
      draft.artifact.next_stage_plan = requireText(input.content, 1, 2_000, "Next-stage plan");
      draft.artifact.revision += 1;
      draft.state_version += 1;
    });
  }

  function markDeliveryAcknowledged(input) {
    return mutate((draft) => {
      requireExactRecord(input, ["delivery_id", "effect_id"], ["delivery_id", "effect_id"], "Delivery acknowledgement");
      if (
        draft.reentry.delivery.delivery_id !== input.delivery_id ||
        typeof input.effect_id !== "string" ||
        !IDENTIFIER_PATTERN.test(input.effect_id)
      ) {
        throw applicationFailure("application_delivery_acknowledgement_invalid", 409);
      }
      if (draft.reentry.delivery.status === "ACKNOWLEDGED") {
        if (draft.reentry.delivery.effect_id !== input.effect_id) {
          throw applicationFailure("application_delivery_acknowledgement_conflict", 409);
        }
        return;
      }
      if (draft.reentry.delivery.status !== "EFFECT_READY") {
        throw applicationFailure("application_delivery_acknowledgement_invalid", 409);
      }
      draft.reentry.delivery.status = "ACKNOWLEDGED";
      draft.reentry.delivery.effect_id = input.effect_id;
    });
  }

  function acceptNextStage(input) {
    return mutate((draft) => {
      requireExactRecord(
        input,
        ["control_token_valid", "expected_state_version", "expected_revision"],
        ["control_token_valid", "expected_state_version", "expected_revision"],
        "Next-stage acceptance",
      );
      if (input.control_token_valid !== true) throw applicationFailure("application_human_control_invalid", 403);
      requireRevision(input, draft);
      if (draft.status !== "NEXT_STAGE_READY" || draft.human_boundary.accepted) {
        throw applicationFailure("application_acceptance_unavailable", 409);
      }
      draft.human_boundary.accepted = true;
      draft.status = "ACCEPTED";
      draft.state_version += 1;
      draft.accepted_at = readTimestamp(clock);
    });
  }

  function mutate(operation) {
    const result = queue.then(async () => {
      const draft = clone(state);
      operation(draft);
      validateStoredState(draft);
      await persist(filename, draft);
      state = draft;
      return clone(state);
    });
    queue = result.then(() => undefined, () => undefined);
    return result;
  }
}

function createInitialState() {
  return {
    schema_version: SCHEMA_VERSION,
    workflow_id: WORKFLOW_ID,
    workflow_type: WORKFLOW_TYPE,
    status: "DRAFT",
    state_version: 1,
    submitted_at: null,
    reviewed_at: null,
    accepted_at: null,
    artifact: {
      revision: 0,
      form: { full_name: "", email: "", project_name: "", summary: "" },
      next_stage_plan: "",
    },
    reentry: {
      consent_status: "NOT_REQUESTED",
      binding: null,
      event: {
        status: "NOT_READY",
        event_id: null,
        occurred_at: null,
        receiver_event_id: null,
        last_error_code: null,
      },
      delivery: { status: "NOT_STARTED", delivery_id: null, effect_id: null },
    },
    human_boundary: { accepted: false },
  };
}

function validateStoredState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Application state is invalid");
  if (
    value.schema_version !== SCHEMA_VERSION ||
    value.workflow_id !== WORKFLOW_ID ||
    value.workflow_type !== WORKFLOW_TYPE ||
    !["DRAFT", "SUBMITTED", "APPROVED", "NEXT_STAGE_READY", "ACCEPTED"].includes(value.status) ||
    !Number.isSafeInteger(value.state_version) || value.state_version < 1 ||
    !value.artifact || !Number.isSafeInteger(value.artifact.revision) || value.artifact.revision < 0 ||
    !value.reentry || !value.reentry.event || !value.reentry.delivery ||
    !value.human_boundary || typeof value.human_boundary.accepted !== "boolean"
  ) {
    throw new TypeError("Application state is invalid");
  }
  const blankDraft = value.status === "DRAFT" && value.artifact.revision === 0 &&
    isBlankInitialForm(value.artifact.form);
  if (!blankDraft) normalizeForm(value.artifact.form);
  if (typeof value.artifact.next_stage_plan !== "string" || value.artifact.next_stage_plan.length > 2_000) {
    throw new TypeError("Application state is invalid");
  }
  return value;
}

function isBlankInitialForm(value) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).sort().join(",") === "email,full_name,project_name,summary" &&
    Object.values(value).every((field) => field === "");
}

function validateBinding(value, workflowId) {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    value.workflow_id !== workflowId || value.event_type !== "application.approved" ||
    value.status !== "active" || typeof value.binding_id !== "string"
  ) {
    throw applicationFailure("application_binding_invalid", 400);
  }
}

function normalizeForm(value) {
  requireExactRecord(value, ["full_name", "email", "project_name", "summary"], ["full_name", "email", "project_name", "summary"], "Application form");
  const email = requireText(value.email, 3, 254, "Email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw applicationFailure("application_form_invalid", 400);
  return {
    full_name: requireText(value.full_name, 2, 120, "Full name"),
    email,
    project_name: requireText(value.project_name, 2, 120, "Project name"),
    summary: requireText(value.summary, 10, 1_500, "Summary"),
  };
}

function requireRevision(input, state) {
  if (!Number.isSafeInteger(input.expected_state_version) || !Number.isSafeInteger(input.expected_revision)) {
    throw applicationFailure("application_revision_invalid", 400);
  }
  if (
    input.expected_state_version !== state.state_version ||
    input.expected_revision !== state.artifact.revision
  ) {
    throw applicationFailure("application_revision_conflict", 409);
  }
}

function requireEventIdentity(eventId, state) {
  if (state.reentry.event.event_id !== eventId) throw applicationFailure("application_event_identity_invalid", 409);
}

function requireText(value, minimum, maximum, label) {
  if (typeof value !== "string") throw applicationFailure("application_form_invalid", 400);
  const normalized = value.trim();
  const length = new TextEncoder().encode(normalized).byteLength;
  if (length < minimum || length > maximum) throw applicationFailure("application_form_invalid", 400);
  return normalized;
}

function requireCreatedIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) throw new TypeError(`Application ${label} is invalid`);
  return value;
}

function requireFailureCode(value) {
  if (typeof value !== "string" || !/^[a-z][a-z0-9_]{0,95}$/.test(value)) return "application_event_send_failed";
  return value;
}

function requireAbsolutePath(value) {
  if (typeof value !== "string" || !isAbsolute(value) || value.length > 4_096 || value.includes("\0")) {
    throw new TypeError("Application store filename must be an absolute path");
  }
  return value;
}

function requireExactRecord(value, allowed, required, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw applicationFailure("application_input_invalid", 400, `${label} must be an object`);
  const fields = Object.keys(value);
  if (fields.some((field) => !allowed.includes(field)) || required.some((field) => !fields.includes(field))) {
    throw applicationFailure("application_input_invalid", 400, `${label} fields are invalid`);
  }
}

function readTimestamp(clock) {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new TypeError("Application store clock must return a valid Date");
  return value.toISOString();
}

async function persist(filename, value) {
  const temporary = `${filename}.${process.pid}.${randomBytes(8).toString("hex")}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
    await rename(temporary, filename);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

function clone(value) {
  return structuredClone(value);
}

export function applicationFailure(code, statusCode = 500, message = code) {
  return Object.assign(new Error(message), { code, statusCode });
}
