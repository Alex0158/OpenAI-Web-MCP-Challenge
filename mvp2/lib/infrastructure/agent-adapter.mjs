import { createHash } from "node:crypto";

export class AgentContinuationAdapter {
  constructor({ id, proofClassification }) {
    if (new.target === AgentContinuationAdapter) {
      throw new TypeError("AgentContinuationAdapter is an interface");
    }
    requireText(id, "adapter id");
    requireText(proofClassification, "adapter proof classification");
    this.id = id;
    this.proofClassification = proofClassification;
  }

  async deliver() {
    throw new Error("AgentContinuationAdapter.deliver is not implemented");
  }

  describe() {
    return {
      id: this.id,
      proofClassification: this.proofClassification,
    };
  }
}

export class DryRunAgentAdapter extends AgentContinuationAdapter {
  constructor({ contextBinding = "" } = {}) {
    super({
      id: "dry-run",
      proofClassification: "synthetic-local",
    });
    this.contextBinding = contextBinding;
  }

  async deliver({ instruction }) {
    return {
      status: "dry_run",
      adapter: this.id,
      proofClassification: this.proofClassification,
      instruction,
      contextBindingHash: digestContextBinding(this.contextBinding),
    };
  }
}

export function buildReentryInstruction({ event, grant }) {
  const toolOrder = grant.requiredToolOrder ?? [
    ...grant.permittedReadTools,
    ...grant.permittedWriteTools,
  ];
  const humanActions = grant.actionsRequiringHumanApproval ?? [];

  return [
    "Authorized WebMCP re-entry event.",
    `Event type: ${event.eventType}.`,
    `Workflow: ${event.workflowId}.`,
    `Expected state version: ${event.stateVersion}.`,
    `Open the exact canonical URL ${event.resumeUrl} in the Codex in-app browser.`,
    toolOrder.length > 0
      ? `Use genuine page Site Tools only, in this order: ${toolOrder.join(", ")}.`
      : "Use only the genuine Site Tools exposed by the current page state.",
    grant.reentryGoal,
    "Read fresh authoritative page state; do not call the Host REST API directly.",
    humanActions.length > 0
      ? `Do not perform these human-controlled actions: ${humanActions.join(", ")}.`
      : "Stop at the Host application's visible human decision boundary.",
    "After updating the visible shared artifact, report whether canonical URL opening and stage-specific Site Tool invocation succeeded.",
  ].join(" ");
}

export function assertDeliveryResult(result, adapter) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Agent adapter returned no delivery result");
  }
  requireText(result.status, "delivery status");
  return {
    adapter: adapter.id,
    proofClassification: adapter.proofClassification,
    ...result,
  };
}

export function digestContextBinding(value) {
  if (!value) return null;
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

function requireText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} is required`);
  }
}
