import { createReceiverState, publicGrantBinding } from "../../infrastructure/receiver-core.mjs";
import {
  attachContinuationBinding,
  authoritativeWorkflow,
  CLARIFICATION_EVENT,
  createInitialTenderState,
  hostAudit,
  publicTenderState,
  requestClarification,
  submitBid,
  updateBidDraft,
  updateClarificationDraft,
  WORKFLOW_ID,
} from "./domain.mjs";

export class TenderRelayHostAdapter {
  constructor({ hostSdk, clock = () => new Date() }) {
    if (!hostSdk || typeof hostSdk.issueManifest !== "function") {
      throw new TypeError("TenderRelayHostAdapter requires the Host SDK");
    }
    this.id = "tenderrelay-reference";
    this.sdk = hostSdk;
    this.clock = clock;
  }

  createInitialState() {
    return createInitialTenderState({ clock: this.clock });
  }

  publicState(state) {
    return publicTenderState(state);
  }

  authoritativeWorkflow(state) {
    return authoritativeWorkflow(state);
  }

  audit(state) {
    return hostAudit(state);
  }

  issueManifest(state) {
    if (state.continuationManifest) {
      return structuredClone(state.continuationManifest);
    }
    const issuedAt = state.createdAt ?? state.audit[0]?.createdAt;
    const expiresAt = new Date(
      Date.parse(issuedAt) + 24 * 60 * 60 * 1000,
    ).toISOString();
    return this.sdk.issueManifest({
      manifestId: `rm_${WORKFLOW_ID}_v1`,
      issuedAt,
      workflow: authoritativeWorkflow(state),
      reentryPoints: [
        {
          eventType: CLARIFICATION_EVENT,
          title: "Clarification requested",
          description:
            "Return to read the clarification and prepare a visible response draft.",
          resumeUrl: `${this.sdk.origin}/tenders/${WORKFLOW_ID}`,
          reentryGoal:
            "Prepare a concise response grounded in the current page feedback.",
          permittedReadTools: [
            "get_current_tender_state",
            "read_clarification_request",
          ],
          permittedWriteTools: ["update_clarification_draft"],
          requiredToolOrder: [
            "get_current_tender_state",
            "read_clarification_request",
            "update_clarification_draft",
          ],
          actionsRequiringHumanApproval: [
            "submit_approved_clarification",
          ],
          defaultLimits: {
            maximumExecutions: 1,
            minimumIntervalSeconds: 5,
            expiresAt,
          },
        },
      ],
    });
  }

  attachContinuationBinding(state, binding, manifest) {
    return attachContinuationBinding(state, binding, {
      clock: this.clock,
      manifest,
    });
  }

  updateBidDraft(state, input) {
    return updateBidDraft(state, input, { clock: this.clock });
  }

  submitBid(state, input) {
    return submitBid(state, input, { clock: this.clock });
  }

  requestClarification(state, input) {
    const workflow = requestClarification(state, input, { clock: this.clock });
    return this.sdk.issueEvent({
      binding: state.continuationBinding,
      workflow,
      eventType: CLARIFICATION_EVENT,
      resumeUrl: `${this.sdk.origin}/tenders/${WORKFLOW_ID}`,
    });
  }

  updateClarificationDraft(state, input) {
    return updateClarificationDraft(state, input, { clock: this.clock });
  }

  migrateLegacyState(value) {
    if (!value || value.workflowId !== WORKFLOW_ID) {
      throw new Error("Stored state is not compatible with TenderRelay");
    }
    const legacyGrant = value.grant ?? null;
    const host = {
      workflowId: value.workflowId,
      workflowType: "tender_submission",
      status: value.status,
      stateVersion: value.stateVersion,
      artifactRevision: value.artifactRevision ?? 1,
      createdAt: value.createdAt ?? value.audit?.[0]?.createdAt ?? this.clock().toISOString(),
      tender: value.tender,
      continuationBinding: legacyGrant
        ? {
            grantId: legacyGrant.grantId,
            manifestId: legacyGrant.manifestId,
            workflowId: legacyGrant.workflowId,
            allowedEvents: legacyGrant.allowedEvents,
            status: legacyGrant.status,
            maximumRuns: legacyGrant.maximumRuns,
            runsUsed: legacyGrant.runsUsed,
            expiresAt: legacyGrant.expiresAt,
            consequentialActionsRequireHumanApproval:
              legacyGrant.consequentialActionsRequireHumanApproval,
          }
        : null,
      continuationManifest: value.continuationManifest ?? null,
      clarification: value.clarification,
      audit: value.audit ?? [],
    };
    const receiver = createReceiverState();
    if (legacyGrant) receiver.grants.push(upgradeLegacyGrant(legacyGrant, this));
    receiver.events = (value.events ?? []).map((event) =>
      upgradeLegacyEvent(event, value.runs ?? []),
    );
    receiver.runs = structuredClone(value.runs ?? []);
    return {
      schemaVersion: 1,
      hostAdapter: this.id,
      host,
      receiver,
    };
  }
}

function upgradeLegacyGrant(grant, adapter) {
  const binding = publicGrantBinding({
    ...grant,
    consequentialActionsRequireHumanApproval:
      grant.consequentialActionsRequireHumanApproval,
  });
  return {
    ...grant,
    ...binding,
    issuerOrigin: adapter.sdk.origin,
    canonicalUrl: `${adapter.sdk.origin}/tenders/${WORKFLOW_ID}`,
    minimumIntervalSeconds: 5,
    lastAcceptedAt: null,
    reentryGoal:
      "Prepare a concise response grounded in the current page feedback.",
    permittedReadTools: [
      "get_current_tender_state",
      "read_clarification_request",
    ],
    permittedWriteTools: ["update_clarification_draft"],
    requiredToolOrder: [
      "get_current_tender_state",
      "read_clarification_request",
      "update_clarification_draft",
    ],
    actionsRequiringHumanApproval: ["submit_approved_clarification"],
  };
}

function upgradeLegacyEvent(event, runs) {
  const run = runs.find((candidate) => candidate.eventId === event.eventId);
  return {
    eventId: event.eventId,
    idempotencyKey: event.idempotencyKey,
    grantId: event.grantId,
    runId: run?.runId ?? `legacy_${event.eventId}`,
    signatureStatus: event.signatureStatus ?? "verified",
    deliveryStatus: event.deliveryStatus ?? run?.status ?? "unknown",
    acceptedAt: event.acceptedAt ?? event.occurredAt,
    payload: {
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
      signature: event.signature,
    },
  };
}
