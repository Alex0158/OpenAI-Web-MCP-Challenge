import fs from "node:fs";
import path from "node:path";

export class TraceRecorder {
  constructor({ tracePath = null, clock = () => new Date(), redactManagedContext = false } = {}) {
    this.tracePath = tracePath;
    this.clock = clock;
    this.redactManagedContext = redactManagedContext;
    this.entries = [];
  }

  record(entry) {
    const complete = {
      time: this.clock().toISOString(),
      correlation_id: entry.correlation_id,
      component: entry.component,
      action: entry.action,
      workflow_id: entry.workflow_id,
      ...(entry.grant_id ? { grant_id: entry.grant_id } : {}),
      ...(entry.event_id ? { event_id: entry.event_id } : {}),
      ...(entry.run_id ? { run_id: entry.run_id } : {}),
      outcome: entry.outcome,
      details: this.redactManagedContext
        ? redactPrivateContext(entry.details ?? {})
        : entry.details ?? {},
    };
    this.entries.push(complete);

    if (this.tracePath) {
      fs.mkdirSync(path.dirname(this.tracePath), { recursive: true });
      fs.appendFileSync(this.tracePath, `${JSON.stringify(complete)}\n`, "utf8");
    }
    return complete;
  }
}

function redactPrivateContext(value) {
  if (Array.isArray(value)) return value.map(redactPrivateContext);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["agent_binding", "managed_context_id", "managed_context_kind"].includes(key))
    .map(([key, child]) => [key, redactPrivateContext(child)]));
}
