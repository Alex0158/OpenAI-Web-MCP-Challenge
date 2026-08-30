// A deliberately small second Host Adapter used by the conformance tests.
// It imports the Host SDK contract, but no TenderRelay or Receiver internals.

export const INCIDENT_EVENT = "threshold.breached";
export const INCIDENT_WORKFLOW_ID = "INCIDENT-7";

export class IncidentResponseHostAdapter {
  constructor({ hostSdk, clock = () => new Date() }) {
    this.id = "incident-response-conformance-fixture";
    this.sdk = hostSdk;
    this.clock = clock;
  }

  createInitialState() {
    const createdAt = this.clock().toISOString();
    return {
      workflowId: INCIDENT_WORKFLOW_ID,
      status: "MONITORING",
      stateVersion: 1,
      artifactRevision: 1,
      createdAt,
      continuationBinding: null,
      continuationManifest: null,
      incident: {
        service: "checkout-api",
        threshold: "error-rate > 5%",
        reading: null,
        responsePlanDraft: "",
      },
      audit: [],
    };
  }

  publicState(state) {
    return structuredClone(state);
  }

  authoritativeWorkflow(state) {
    return {
      id: state.workflowId,
      type: "service_incident",
      currentState: state.status,
      stateVersion: state.stateVersion,
    };
  }

  audit(state) {
    return structuredClone(state.audit);
  }

  issueManifest(state) {
    if (state.continuationManifest) {
      return structuredClone(state.continuationManifest);
    }
    return this.sdk.issueManifest({
      manifestId: "rm_INCIDENT-7_v1",
      issuedAt: state.createdAt,
      workflow: this.authoritativeWorkflow(state),
      reentryPoints: [
        {
          eventType: INCIDENT_EVENT,
          title: "Service threshold breached",
          description: "Return to inspect the incident and prepare a response plan.",
          resumeUrl: `${this.sdk.origin}/incidents/${INCIDENT_WORKFLOW_ID}`,
          reentryGoal: "Prepare a response plan draft grounded in current telemetry.",
          permittedReadTools: [
            "get_current_incident_state",
            "read_threshold_breach",
          ],
          permittedWriteTools: ["update_response_plan_draft"],
          requiredToolOrder: [
            "get_current_incident_state",
            "read_threshold_breach",
            "update_response_plan_draft",
          ],
          actionsRequiringHumanApproval: ["execute_incident_response_plan"],
          defaultLimits: {
            maximumExecutions: 1,
            minimumIntervalSeconds: 0,
            expiresAt: new Date(
              Date.parse(state.createdAt) + 60 * 60 * 1000,
            ).toISOString(),
          },
        },
      ],
    });
  }

  attachContinuationBinding(state, binding, manifest) {
    if (state.status !== "MONITORING") {
      throw new Error("Incident continuation can only be attached while monitoring");
    }
    state.continuationBinding = structuredClone(binding);
    state.continuationManifest = structuredClone(manifest);
    this.record(state, "grant.attached", { grantId: binding.grantId });
    return binding;
  }

  breachThreshold(state, { reading, expectedStateVersion }) {
    if (state.status !== "MONITORING") throw new Error("Incident is not monitoring");
    if (state.stateVersion !== expectedStateVersion) {
      throw new Error("Incident state version is stale");
    }
    state.status = "ACTION_REQUIRED";
    state.stateVersion += 1;
    state.artifactRevision += 1;
    state.incident.reading = reading;
    this.record(state, "incident.threshold_breached", { reading });
    return this.sdk.issueEvent({
      binding: state.continuationBinding,
      workflow: this.authoritativeWorkflow(state),
      eventType: INCIDENT_EVENT,
      resumeUrl: `${this.sdk.origin}/incidents/${INCIDENT_WORKFLOW_ID}`,
    });
  }

  record(state, action, details) {
    state.audit.push({
      action,
      details,
      stateVersion: state.stateVersion,
      createdAt: this.clock().toISOString(),
    });
  }
}
