import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

export const WORKFLOW_ID = "TENDER-102";
export const EVENT_TYPE = "clarification.requested";

const isoNow = () => new Date().toISOString();

function audit(state, action, details = {}) {
  state.audit.push({
    id: randomUUID(),
    action,
    details,
    stateVersion: state.stateVersion,
    createdAt: isoNow(),
  });
}

function requireStatus(state, expected) {
  if (state.status !== expected) {
    throw new Error(`Expected workflow status ${expected}, received ${state.status}`);
  }
}

export function createInitialState() {
  const state = {
    workflowId: WORKFLOW_ID,
    status: "DRAFT",
    stateVersion: 1,
    tender: {
      title: "Northbridge Community Services Platform",
      buyer: "Northbridge Borough Council",
      deadline: "2026-09-03T20:00:00.000Z",
      requirements: [
        "Describe the implementation approach and delivery controls.",
        "Confirm support coverage and incident response commitments.",
        "State the proposed payment terms and supporting evidence.",
      ],
      bidDraft:
        "We will deliver in three controlled phases with weekly governance, named service ownership, and measurable acceptance criteria.",
      submittedBid: null,
      submittedAt: null,
    },
    grant: null,
    clarification: null,
    events: [],
    runs: [],
    audit: [],
  };
  audit(state, "workflow.created", { status: state.status });
  return state;
}

export function publicState(state) {
  return structuredClone(state);
}

export function getReentryManifest(state, origin) {
  return {
    type: "webmcp.reentry_manifest",
    version: "0.1",
    manifestId: `rm_${WORKFLOW_ID}_v1`,
    issuedAt: isoNow(),
    origin,
    workflow: {
      id: state.workflowId,
      type: "tender_submission",
      currentState: state.status,
      stateVersion: state.stateVersion,
    },
    reentryPoints: [
      {
        eventType: EVENT_TYPE,
        title: "Clarification requested",
        description: "Return to read the clarification and prepare a visible response draft.",
        resumeUrl: `${origin}/tenders/${WORKFLOW_ID}`,
        reentryGoal: "Read current feedback and prepare a clarification draft.",
        permittedReadTools: [
          "get_current_tender_state",
          "read_clarification_request",
        ],
        permittedWriteTools: ["update_clarification_draft"],
        actionsRequiringHumanApproval: ["submit_approved_clarification"],
        defaultLimits: {
          maximumExecutions: 3,
          minimumIntervalSeconds: 5,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    ],
  };
}

export function updateBidDraft(state, response) {
  requireStatus(state, "DRAFT");
  if (typeof response !== "string" || response.trim().length < 20) {
    throw new Error("Bid response must contain at least 20 characters");
  }
  state.tender.bidDraft = response.trim();
  audit(state, "bid.draft_updated", { characters: state.tender.bidDraft.length });
  return state.tender.bidDraft;
}

export function attachGrant(state, options = {}) {
  requireStatus(state, "DRAFT");
  if (state.grant?.status === "active") {
    return state.grant;
  }

  const allowedEvents = options.allowedEvents ?? [EVENT_TYPE];
  if (
    allowedEvents.length !== 1 ||
    allowedEvents[0] !== EVENT_TYPE
  ) {
    throw new Error("The kill test permits only clarification.requested");
  }

  state.grant = {
    grantId: `cg_${randomUUID()}`,
    manifestId: `rm_${WORKFLOW_ID}_v1`,
    workflowId: state.workflowId,
    allowedEvents,
    mode: "read_and_draft",
    status: "active",
    maximumRuns: 3,
    runsUsed: 0,
    lastAcceptedStateVersion: state.stateVersion,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    consequentialActionsRequireHumanApproval: true,
    attachedAt: isoNow(),
  };
  audit(state, "grant.attached", {
    grantId: state.grant.grantId,
    allowedEvents,
  });
  return state.grant;
}

export function submitBid(state, { approved }) {
  requireStatus(state, "DRAFT");
  if (approved !== true) {
    throw new Error("Exact human approval is required before initial submission");
  }
  if (!state.grant || state.grant.status !== "active") {
    throw new Error("Attach the continuation grant before entering the waiting state");
  }
  state.tender.submittedBid = state.tender.bidDraft;
  state.tender.submittedAt = isoNow();
  state.status = "UNDER_REVIEW";
  state.stateVersion += 1;
  audit(state, "bid.submitted", { approved: true });
  return publicState(state);
}

function canonicalEvent(event) {
  return JSON.stringify({
    type: event.type,
    version: event.version,
    eventId: event.eventId,
    grantId: event.grantId,
    manifestId: event.manifestId,
    origin: event.origin,
    workflowId: event.workflowId,
    eventType: event.eventType,
    stateVersion: event.stateVersion,
    occurredAt: event.occurredAt,
    resumeUrl: event.resumeUrl,
    nonce: event.nonce,
    idempotencyKey: event.idempotencyKey,
  });
}

export function signEvent(event, secret) {
  const signature = createHmac("sha256", secret)
    .update(canonicalEvent(event))
    .digest("base64url");
  return {
    ...event,
    signature: {
      algorithm: "HMAC-SHA256",
      keyId: "local-kill-test-key",
      value: signature,
    },
  };
}

export function verifyEventSignature(event, secret) {
  const expected = createHmac("sha256", secret)
    .update(canonicalEvent(event))
    .digest();
  let actual;
  try {
    actual = Buffer.from(event.signature?.value ?? "", "base64url");
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function requestClarificationTransition(state, { origin, feedback }) {
  requireStatus(state, "UNDER_REVIEW");
  if (typeof feedback !== "string" || feedback.trim().length < 10) {
    throw new Error("Clarification feedback must contain at least 10 characters");
  }
  if (!state.grant || state.grant.status !== "active") {
    throw new Error("No active continuation grant is attached");
  }

  state.status = "CHANGES_REQUESTED";
  state.stateVersion += 1;
  state.clarification = {
    requestedAt: isoNow(),
    feedback: feedback.trim(),
    responseDraft: "",
    submittedAt: null,
  };
  audit(state, "workflow.state_changed", {
    from: "UNDER_REVIEW",
    to: state.status,
  });

  return {
    type: "workflow.continuation_event",
    version: "0.1",
    eventId: `evt_${randomUUID()}`,
    grantId: state.grant.grantId,
    manifestId: state.grant.manifestId,
    origin,
    workflowId: state.workflowId,
    eventType: EVENT_TYPE,
    stateVersion: state.stateVersion,
    occurredAt: isoNow(),
    resumeUrl: `${origin}/tenders/${WORKFLOW_ID}`,
    nonce: randomUUID(),
    idempotencyKey: `${state.workflowId}:${state.stateVersion}:${EVENT_TYPE}`,
  };
}

export function acceptAtGateway(state, event, secret) {
  if (!verifyEventSignature(event, secret)) {
    throw new Error("Invalid continuation event signature");
  }
  const duplicate = state.events.find(
    (existing) =>
      existing.eventId === event.eventId ||
      existing.idempotencyKey === event.idempotencyKey,
  );
  if (duplicate) {
    return { accepted: true, duplicate: true, eventId: duplicate.eventId };
  }
  if (!state.grant || state.grant.status !== "active") {
    throw new Error("Continuation grant is inactive");
  }
  if (Date.now() >= Date.parse(state.grant.expiresAt)) {
    throw new Error("Continuation grant has expired");
  }
  if (event.grantId !== state.grant.grantId) {
    throw new Error("Continuation grant mismatch");
  }
  if (event.workflowId !== state.workflowId) {
    throw new Error("Workflow mismatch");
  }
  if (!state.grant.allowedEvents.includes(event.eventType)) {
    throw new Error("Event type is outside the approved grant");
  }
  if (event.stateVersion !== state.stateVersion) {
    throw new Error("Event state version does not match canonical state");
  }
  if (event.stateVersion <= state.grant.lastAcceptedStateVersion) {
    throw new Error("Stale continuation event");
  }
  if (state.grant.runsUsed >= state.grant.maximumRuns) {
    throw new Error("Continuation run budget exhausted");
  }

  state.events.push({
    ...event,
    signatureStatus: "verified",
    deliveryStatus: "accepted",
    acceptedAt: isoNow(),
  });
  state.grant.lastAcceptedStateVersion = event.stateVersion;
  state.grant.runsUsed += 1;
  audit(state, "continuation.event_verified", {
    eventId: event.eventId,
    eventType: event.eventType,
  });
  return { accepted: true, duplicate: false, eventId: event.eventId };
}

export function updateClarificationDraft(state, response) {
  requireStatus(state, "CHANGES_REQUESTED");
  if (typeof response !== "string" || response.trim().length < 20) {
    throw new Error("Clarification response must contain at least 20 characters");
  }
  state.clarification.responseDraft = response.trim();
  audit(state, "clarification.draft_updated", {
    characters: state.clarification.responseDraft.length,
  });
  return state.clarification;
}

export function threadBindingHash(threadId) {
  if (!threadId) return null;
  return createHash("sha256").update(threadId).digest("hex").slice(0, 12);
}

