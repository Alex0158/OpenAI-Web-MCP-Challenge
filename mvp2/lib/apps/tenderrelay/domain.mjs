import { randomUUID } from "node:crypto";

export const WORKFLOW_ID = "TENDER-102";
export const WORKFLOW_TYPE = "tender_submission";
export const CLARIFICATION_EVENT = "clarification.requested";

export function createInitialTenderState({ clock = () => new Date() } = {}) {
  const createdAt = clock().toISOString();
  const state = {
    workflowId: WORKFLOW_ID,
    workflowType: WORKFLOW_TYPE,
    status: "DRAFT",
    stateVersion: 1,
    artifactRevision: 1,
    createdAt,
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
    continuationBinding: null,
    continuationManifest: null,
    clarification: null,
    audit: [],
  };
  audit(state, clock, "workflow.created", { status: state.status });
  return state;
}

export function authoritativeWorkflow(state) {
  return {
    id: state.workflowId,
    type: state.workflowType,
    currentState: state.status,
    stateVersion: state.stateVersion,
  };
}

export function publicTenderState(state) {
  return {
    workflowId: state.workflowId,
    status: state.status,
    stateVersion: state.stateVersion,
    artifactRevision: state.artifactRevision,
    tender: structuredClone(state.tender),
    grant: state.continuationBinding
      ? structuredClone(state.continuationBinding)
      : null,
    clarification: state.clarification
      ? structuredClone(state.clarification)
      : null,
    audit: structuredClone(state.audit),
  };
}

export function updateBidDraft(
  state,
  { response, expectedStateVersion, expectedArtifactRevision },
  { clock = () => new Date() } = {},
) {
  requireStatus(state, "DRAFT");
  requireVersions(state, expectedStateVersion, expectedArtifactRevision);
  requireDraft(response, "Bid response");
  state.tender.bidDraft = response.trim();
  state.artifactRevision += 1;
  audit(state, clock, "bid.draft_updated", {
    characters: state.tender.bidDraft.length,
    artifactRevision: state.artifactRevision,
  });
  return state.tender.bidDraft;
}

export function attachContinuationBinding(
  state,
  binding,
  { clock = () => new Date(), manifest = null } = {},
) {
  requireStatus(state, "DRAFT");
  if (state.continuationBinding?.status === "active") {
    if (state.continuationBinding.grantId !== binding.grantId) {
      throw new TenderStateConflictError(
        "A different continuation Grant is already attached",
      );
    }
    return state.continuationBinding;
  }
  if (
    binding?.workflowId !== state.workflowId ||
    !binding.allowedEvents?.includes(CLARIFICATION_EVENT)
  ) {
    throw new TenderStateConflictError(
      "Continuation binding is outside this tender workflow",
    );
  }
  state.continuationBinding = structuredClone(binding);
  state.continuationManifest = manifest ? structuredClone(manifest) : null;
  audit(state, clock, "grant.attached", {
    grantId: binding.grantId,
    allowedEvents: binding.allowedEvents,
  });
  return state.continuationBinding;
}

export function submitBid(
  state,
  { approved, expectedStateVersion, expectedArtifactRevision },
  { clock = () => new Date() } = {},
) {
  requireStatus(state, "DRAFT");
  requireVersions(state, expectedStateVersion, expectedArtifactRevision);
  if (approved !== true) {
    throw new TenderAuthorizationError(
      "Exact human approval is required before initial submission",
    );
  }
  if (state.continuationBinding?.status !== "active") {
    throw new TenderStateConflictError(
      "Attach the continuation Grant before entering the waiting state",
    );
  }
  state.tender.submittedBid = state.tender.bidDraft;
  state.tender.submittedAt = clock().toISOString();
  state.status = "UNDER_REVIEW";
  state.stateVersion += 1;
  audit(state, clock, "bid.submitted", {
    approved: true,
    artifactRevision: state.artifactRevision,
  });
  return publicTenderState(state);
}

export function requestClarification(
  state,
  { feedback, expectedStateVersion },
  { clock = () => new Date() } = {},
) {
  requireStatus(state, "UNDER_REVIEW");
  requireStateVersion(state, expectedStateVersion);
  if (typeof feedback !== "string" || feedback.trim().length < 10) {
    throw new TenderValidationError(
      "Clarification feedback must contain at least 10 characters",
    );
  }
  if (state.continuationBinding?.status !== "active") {
    throw new TenderStateConflictError("No active continuation Grant is attached");
  }

  state.status = "CHANGES_REQUESTED";
  state.stateVersion += 1;
  state.artifactRevision += 1;
  state.clarification = {
    requestedAt: clock().toISOString(),
    feedback: feedback.trim(),
    responseDraft: "",
    submittedAt: null,
  };
  audit(state, clock, "workflow.state_changed", {
    from: "UNDER_REVIEW",
    to: state.status,
    artifactRevision: state.artifactRevision,
  });
  return authoritativeWorkflow(state);
}

export function updateClarificationDraft(
  state,
  { response, expectedStateVersion, expectedArtifactRevision },
  { clock = () => new Date() } = {},
) {
  requireStatus(state, "CHANGES_REQUESTED");
  requireVersions(state, expectedStateVersion, expectedArtifactRevision);
  requireDraft(response, "Clarification response");
  state.clarification.responseDraft = response.trim();
  state.artifactRevision += 1;
  audit(state, clock, "clarification.draft_updated", {
    characters: state.clarification.responseDraft.length,
    artifactRevision: state.artifactRevision,
  });
  return structuredClone(state.clarification);
}

export function hostAudit(state) {
  return structuredClone(state.audit);
}

function requireStatus(state, expected) {
  if (state.status !== expected) {
    throw new TenderStateConflictError(
      `Expected workflow status ${expected}, received ${state.status}`,
    );
  }
}

function requireVersions(state, stateVersion, artifactRevision) {
  requireStateVersion(state, stateVersion);
  if (artifactRevision !== state.artifactRevision) {
    throw new TenderStateConflictError(
      `Stale artifact revision: expected ${state.artifactRevision}, received ${artifactRevision}`,
    );
  }
}

function requireStateVersion(state, stateVersion) {
  if (stateVersion !== state.stateVersion) {
    throw new TenderStateConflictError(
      `Stale state version: expected ${state.stateVersion}, received ${stateVersion}`,
    );
  }
}

function requireDraft(value, label) {
  if (typeof value !== "string" || value.trim().length < 20) {
    throw new TenderValidationError(`${label} must contain at least 20 characters`);
  }
}

function audit(state, clock, action, details = {}) {
  state.audit.push({
    id: randomUUID(),
    action,
    details,
    stateVersion: state.stateVersion,
    artifactRevision: state.artifactRevision,
    createdAt: clock().toISOString(),
  });
}

export class TenderValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "TenderValidationError";
    this.statusCode = 422;
  }
}

export class TenderStateConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "TenderStateConflictError";
    this.statusCode = 409;
  }
}

export class TenderAuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = "TenderAuthorizationError";
    this.statusCode = 403;
  }
}
