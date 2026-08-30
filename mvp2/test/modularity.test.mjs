import test from "node:test";
import assert from "node:assert/strict";
import {
  INCIDENT_EVENT,
  IncidentResponseHostAdapter,
} from "../examples/incident-response-host.mjs";
import { DryRunAgentAdapter } from "../lib/infrastructure/agent-adapter.mjs";
import { ContinuationApplication } from "../lib/infrastructure/continuation-application.mjs";
import { ContinuationHostSdk } from "../lib/infrastructure/host-sdk.mjs";
import { ReceiverCore } from "../lib/infrastructure/receiver-core.mjs";
import { MemoryStateStore } from "../lib/infrastructure/state-store.mjs";

test("a non-tender Host Adapter plugs into the same SDK, Receiver, store, and Agent Adapter", async () => {
  const origin = "https://incident.example";
  const secret = "incident-issuer-secret";
  const keyId = "incident-key";
  const clock = () => new Date("2026-08-30T12:00:00.000Z");
  let id = 0;
  const createId = () => `fixture-${++id}`;
  const hostSdk = new ContinuationHostSdk({
    origin,
    signingSecret: secret,
    keyId,
    clock,
    createId,
  });
  const host = new IncidentResponseHostAdapter({ hostSdk, clock });
  const receiver = new ReceiverCore({
    adapter: new DryRunAgentAdapter(),
    expectedOrigin: origin,
    keyResolver: ({ keyId: candidate }) =>
      candidate === keyId ? secret : null,
    clock,
    createId,
  });
  const application = new ContinuationApplication({
    hostAdapter: host,
    receiver,
    stateStore: new MemoryStateStore(),
  });

  application.activateGrant(INCIDENT_EVENT, { humanApproved: true });
  const result = await application.transitionAndContinue((state) =>
    host.breachThreshold(state, {
      reading: "error-rate = 8.4%",
      expectedStateVersion: state.stateVersion,
    }),
  );

  assert.equal(result.event.eventType, "threshold.breached");
  assert.equal(result.state.status, "ACTION_REQUIRED");
  assert.equal(result.delivery.status, "dry_run");
  assert.match(result.delivery.instruction, /get_current_incident_state/);
  assert.match(result.delivery.instruction, /update_response_plan_draft/);
  assert.doesNotMatch(result.delivery.instruction, /tender|clarification/i);
  assert.equal(application.diagnostics().hostAdapter, host.id);
});
