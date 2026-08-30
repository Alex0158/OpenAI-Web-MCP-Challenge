import { createReceiverState } from "./receiver-core.mjs";

export class ContinuationApplication {
  constructor({ hostAdapter, receiver, stateStore }) {
    assertHostAdapter(hostAdapter);
    if (!receiver || typeof receiver.acceptEvent !== "function") {
      throw new TypeError("ContinuationApplication requires a Receiver Core");
    }
    if (
      !stateStore ||
      typeof stateStore.load !== "function" ||
      typeof stateStore.save !== "function"
    ) {
      throw new TypeError("ContinuationApplication requires a state store");
    }
    this.host = hostAdapter;
    this.receiver = receiver;
    this.stateStore = stateStore;
    const loaded = stateStore.load(() => this.createInitialAggregate());
    this.state = this.normalizeAggregate(loaded);
  }

  createInitialAggregate() {
    return {
      schemaVersion: 1,
      hostAdapter: this.host.id,
      host: this.host.createInitialState(),
      receiver: createReceiverState(),
      outbox: [],
    };
  }

  normalizeAggregate(value) {
    if (
      value?.schemaVersion === 1 &&
      value.hostAdapter === this.host.id &&
      value.host &&
      value.receiver
    ) {
      return {
        ...value,
        outbox: Array.isArray(value.outbox) ? value.outbox : [],
      };
    }
    if (typeof this.host.migrateLegacyState === "function") {
      const migrated = this.host.migrateLegacyState(value);
      return {
        ...migrated,
        outbox: Array.isArray(migrated.outbox) ? migrated.outbox : [],
      };
    }
    throw new Error(
      `Stored state is not compatible with Host Adapter ${this.host.id}`,
    );
  }

  persist() {
    this.stateStore.save(this.state);
  }

  publicState() {
    return this.host.publicState(this.state.host);
  }

  manifest() {
    return this.host.issueManifest(this.state.host);
  }

  mutateHost(operation) {
    const candidate = structuredClone(this.state);
    const result = operation(candidate.host);
    this.state = candidate;
    this.persist();
    return result;
  }

  activateGrant(eventType, { humanApproved }) {
    const candidate = structuredClone(this.state);
    const manifest = this.host.issueManifest(candidate.host);
    const binding = this.receiver.activateGrant(candidate.receiver, {
      manifest,
      eventType,
      humanApproved,
    });
    this.host.attachContinuationBinding(candidate.host, binding, manifest);
    this.state = candidate;
    this.persist();
    return { manifest, binding, state: this.host.publicState(candidate.host) };
  }

  async transitionAndContinue(hostTransition) {
    const candidate = structuredClone(this.state);
    const event = hostTransition(candidate.host);
    recordEventIntent(candidate.outbox, event);
    const gateway = this.receiver.acceptEvent(
      candidate.receiver,
      event,
      this.host.authoritativeWorkflow(candidate.host),
    );
    markEventIntent(candidate.outbox, event.eventId, "reserved");

    // The authoritative Host transition and Receiver reservation are committed together.
    this.state = candidate;
    this.persist();

    const delivery = await this.receiver.dispatch(this.state.receiver, gateway);
    markEventIntent(this.state.outbox, event.eventId, delivery.status);
    this.persist();
    return {
      event,
      gateway,
      delivery,
      state: this.host.publicState(this.state.host),
    };
  }

  commitHostTransition(hostTransition) {
    const candidate = structuredClone(this.state);
    const event = hostTransition(candidate.host);
    recordEventIntent(candidate.outbox, event);
    this.state = candidate;
    this.persist();
    return {
      event,
      state: this.host.publicState(this.state.host),
    };
  }

  async acceptAndContinue(event) {
    const candidate = structuredClone(this.state);
    const gateway = this.receiver.acceptEvent(
      candidate.receiver,
      event,
      this.host.authoritativeWorkflow(candidate.host),
    );
    markEventIntent(candidate.outbox, event.eventId, "reserved");
    this.state = candidate;
    this.persist();
    const delivery = await this.receiver.dispatch(this.state.receiver, gateway);
    markEventIntent(this.state.outbox, event.eventId, delivery.status);
    this.persist();
    return { event, gateway, delivery, state: this.publicState() };
  }

  async dispatchPending() {
    const pending = this.state.receiver.runs.filter(
      (run) => run.status === "reserved",
    );
    const deliveries = [];
    for (const run of pending) {
      const delivery = await this.receiver.dispatch(this.state.receiver, {
        accepted: true,
        duplicate: false,
        eventId: run.eventId,
        runId: run.runId,
        status: run.status,
      });
      markEventIntent(this.state.outbox, run.eventId, delivery.status);
      deliveries.push({ runId: run.runId, delivery });
      this.persist();
    }
    return deliveries;
  }

  diagnostics() {
    return {
      hostAdapter: this.host.id,
      workflow: this.host.authoritativeWorkflow(this.state.host),
      hostAudit: this.host.audit(this.state.host),
      hostOutbox: this.state.outbox.map((entry) => ({
        eventId: entry.event.eventId,
        eventType: entry.event.eventType,
        workflowId: entry.event.workflowId,
        stateVersion: entry.event.stateVersion,
        status: entry.status,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      })),
      receiver: this.receiver.diagnostics(this.state.receiver),
    };
  }

  reset() {
    this.state = this.createInitialAggregate();
    this.persist();
    return this.publicState();
  }
}

function recordEventIntent(outbox, event) {
  if (outbox.some((entry) => entry.event.eventId === event.eventId)) return;
  outbox.push({
    event: structuredClone(event),
    status: "pending",
    createdAt: event.occurredAt,
    updatedAt: event.occurredAt,
  });
}

function markEventIntent(outbox, eventId, status) {
  const entry = outbox.find((candidate) => candidate.event.eventId === eventId);
  if (!entry) return;
  entry.status = status;
  entry.updatedAt = new Date().toISOString();
}

export function assertHostAdapter(host) {
  const methods = [
    "createInitialState",
    "publicState",
    "authoritativeWorkflow",
    "issueManifest",
    "attachContinuationBinding",
    "audit",
  ];
  if (!host || typeof host.id !== "string") {
    throw new TypeError("ContinuationApplication requires a named Host Adapter");
  }
  for (const method of methods) {
    if (typeof host[method] !== "function") {
      throw new TypeError(`Host Adapter ${host.id} does not implement ${method}`);
    }
  }
}
