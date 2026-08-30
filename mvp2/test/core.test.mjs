import test from "node:test";
import assert from "node:assert/strict";
import { TenderRelayHostAdapter } from "../lib/apps/tenderrelay/host-adapter.mjs";
import { CLARIFICATION_EVENT } from "../lib/apps/tenderrelay/domain.mjs";
import { DryRunAgentAdapter } from "../lib/infrastructure/agent-adapter.mjs";
import { ContinuationApplication } from "../lib/infrastructure/continuation-application.mjs";
import { ContinuationHostSdk } from "../lib/infrastructure/host-sdk.mjs";
import { ReceiverCore } from "../lib/infrastructure/receiver-core.mjs";
import { signContinuationEvent } from "../lib/infrastructure/protocol.mjs";
import { MemoryStateStore } from "../lib/infrastructure/state-store.mjs";

const origin = "http://127.0.0.1:43118";
const secret = "test-secret";
const keyId = "test-key";

function createTenderApplication() {
  const clock = () => new Date("2026-08-30T12:00:00.000Z");
  let id = 0;
  const createId = () => `id-${++id}`;
  const hostSdk = new ContinuationHostSdk({
    origin,
    signingSecret: secret,
    keyId,
    clock,
    createId,
  });
  const host = new TenderRelayHostAdapter({ hostSdk, clock });
  const receiver = new ReceiverCore({
    adapter: new DryRunAgentAdapter({ contextBinding: "private-task-id" }),
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
  return { application, host };
}

function createComponentsWithStore(stateStore) {
  const clock = () => new Date("2026-08-30T12:00:00.000Z");
  const hostSdk = new ContinuationHostSdk({
    origin,
    signingSecret: secret,
    keyId,
    clock,
    createId: () => "migration-id",
  });
  const host = new TenderRelayHostAdapter({ hostSdk, clock });
  const receiver = new ReceiverCore({
    adapter: new DryRunAgentAdapter(),
    expectedOrigin: origin,
    keyResolver: () => secret,
    clock,
    createId: () => "migration-id",
  });
  return {
    host,
    application: new ContinuationApplication({
      hostAdapter: host,
      receiver,
      stateStore,
    }),
  };
}

function activateAndSubmit(application, host) {
  application.activateGrant(CLARIFICATION_EVENT, { humanApproved: true });
  application.mutateHost((state) =>
    host.submitBid(state, {
      approved: true,
      expectedStateVersion: state.stateVersion,
      expectedArtifactRevision: state.artifactRevision,
    }),
  );
}

test("TenderRelay manifest exposes one signed, scoped clarification event", () => {
  const { application } = createTenderApplication();
  const manifest = application.manifest();
  assert.equal(manifest.reentryPoints.length, 1);
  assert.equal(manifest.reentryPoints[0].eventType, CLARIFICATION_EVENT);
  assert.equal(manifest.reentryPoints[0].defaultLimits.maximumExecutions, 1);
  assert.deepEqual(manifest.reentryPoints[0].requiredToolOrder, [
    "get_current_tender_state",
    "read_clarification_request",
    "update_clarification_draft",
  ]);
  assert.equal(manifest.signature.algorithm, "HMAC-SHA256");
  const activated = application.activateGrant(CLARIFICATION_EVENT, {
    humanApproved: true,
  });
  assert.deepEqual(activated.manifest, manifest);
  assert.deepEqual(application.manifest(), manifest);
});

test("legacy monolithic TenderRelay JSON state migrates into Host and Receiver namespaces", () => {
  const { host } = createComponentsWithStore(new MemoryStateStore());
  const legacy = host.createInitialState();
  delete legacy.workflowType;
  delete legacy.artifactRevision;
  delete legacy.continuationBinding;
  legacy.grant = null;
  legacy.events = [];
  legacy.runs = [];

  const migrated = createComponentsWithStore(
    new MemoryStateStore(legacy),
  ).application;
  assert.equal(migrated.state.host.workflowType, "tender_submission");
  assert.equal(migrated.state.host.artifactRevision, 1);
  assert.deepEqual(migrated.state.receiver.events, []);
  assert.deepEqual(migrated.state.outbox, []);
});

test("Receiver refuses Grant activation without exact human approval", () => {
  const { application } = createTenderApplication();
  assert.throws(
    () =>
      application.activateGrant(CLARIFICATION_EVENT, {
        humanApproved: false,
      }),
    /human approval/i,
  );
  assert.equal(application.publicState().grant, null);
});

test("human submission is revision guarded and requires an active Grant", () => {
  const { application, host } = createTenderApplication();
  assert.throws(
    () =>
      application.mutateHost((state) =>
        host.submitBid(state, {
          approved: true,
          expectedStateVersion: state.stateVersion,
          expectedArtifactRevision: state.artifactRevision,
        }),
      ),
    /Grant/i,
  );
  application.activateGrant(CLARIFICATION_EVENT, { humanApproved: true });
  assert.throws(
    () =>
      application.mutateHost((state) =>
        host.submitBid(state, {
          approved: true,
          expectedStateVersion: state.stateVersion - 1,
          expectedArtifactRevision: state.artifactRevision,
        }),
      ),
    /stale state version/i,
  );
  assert.equal(application.publicState().status, "DRAFT");
});

test("signed clarification event is reserved once, delivered through the adapter, and replayed harmlessly", async () => {
  const { application, host } = createTenderApplication();
  activateAndSubmit(application, host);
  const first = await application.transitionAndContinue((state) =>
    host.requestClarification(state, {
      feedback: "Please confirm the proposed payment terms and supporting evidence.",
      expectedStateVersion: state.stateVersion,
    }),
  );
  const replay = await application.acceptAndContinue(first.event);

  assert.equal(first.gateway.accepted, true);
  assert.equal(first.gateway.duplicate, false);
  assert.equal(first.delivery.status, "dry_run");
  assert.match(first.delivery.instruction, /get_current_tender_state/);
  assert.match(first.delivery.instruction, /do not call the Host REST API directly/i);
  assert.equal(replay.gateway.duplicate, true);
  assert.equal(replay.delivery.duplicate, true);
  assert.equal(application.state.receiver.events.length, 1);
  assert.equal(application.state.receiver.runs.length, 1);
  assert.equal(application.publicState().status, "CHANGES_REQUESTED");
});

test("Host transition and external Receiver invocation can occur in separate steps", async () => {
  const { application, host } = createTenderApplication();
  activateAndSubmit(application, host);
  const prepared = application.commitHostTransition((state) =>
    host.requestClarification(state, {
      feedback: "Please confirm the proposed payment terms and supporting evidence.",
      expectedStateVersion: state.stateVersion,
    }),
  );

  assert.equal(application.publicState().status, "CHANGES_REQUESTED");
  assert.equal(application.state.receiver.events.length, 0);
  assert.equal(application.state.outbox[0].status, "pending");

  const received = await application.acceptAndContinue(prepared.event);
  assert.equal(received.gateway.accepted, true);
  assert.equal(received.delivery.status, "dry_run");
  assert.equal(application.state.receiver.events.length, 1);
  assert.equal(application.state.outbox[0].status, "dry_run");
});

test("Receiver rejects a correctly signed event outside its accepted time window", async () => {
  const { application, host } = createTenderApplication();
  activateAndSubmit(application, host);
  const prepared = application.commitHostTransition((state) =>
    host.requestClarification(state, {
      feedback: "Please confirm the proposed payment terms and supporting evidence.",
      expectedStateVersion: state.stateVersion,
    }),
  );
  const { signature: _signature, ...unsigned } = prepared.event;
  const stale = signContinuationEvent(
    { ...unsigned, occurredAt: "2026-08-30T11:00:00.000Z" },
    { secret, keyId },
  );
  await assert.rejects(
    () => application.acceptAndContinue(stale),
    /time window/i,
  );
  assert.equal(application.state.receiver.events.length, 0);
});

test("Receiver scope conformance rejects mismatched bindings, workflow, state, URL, type, origin, and expiry", async () => {
  const cases = [
    {
      mutate: (event) => ({ ...event, grantId: "cg_wrong" }),
      expected: /Grant/i,
    },
    {
      mutate: (event) => ({ ...event, workflowId: "OTHER-WORKFLOW" }),
      expected: /workflow/i,
    },
    {
      mutate: (event) => ({ ...event, stateVersion: 99 }),
      expected: /state version/i,
    },
    {
      mutate: (event) => ({
        ...event,
        resumeUrl: `${origin}/tenders/OTHER-WORKFLOW`,
      }),
      expected: /canonical URL/i,
    },
    {
      mutate: (event) => ({ ...event, eventType: "award.ready" }),
      expected: /event type/i,
    },
    {
      mutate: (event) => ({
        ...event,
        origin: "https://other.example",
        resumeUrl: "https://other.example/tenders/TENDER-102",
      }),
      expected: /origin/i,
    },
    {
      beforeAccept: (application) => {
        application.state.receiver.grants[0].expiresAt =
          "2026-08-30T11:59:59.000Z";
      },
      mutate: (event) => event,
      expected: /expired/i,
    },
  ];

  for (const scenario of cases) {
    const { application, host } = createTenderApplication();
    activateAndSubmit(application, host);
    const prepared = application.commitHostTransition((state) =>
      host.requestClarification(state, {
        feedback: "Please confirm the proposed payment terms and supporting evidence.",
        expectedStateVersion: state.stateVersion,
      }),
    );
    scenario.beforeAccept?.(application);
    const { signature: _signature, ...unsigned } = prepared.event;
    const event = signContinuationEvent(scenario.mutate(unsigned), {
      secret,
      keyId,
    });
    await assert.rejects(
      () => application.acceptAndContinue(event),
      scenario.expected,
    );
    assert.equal(application.state.receiver.events.length, 0);
  }
});

test("stale artifact updates are rejected without changing the visible draft", () => {
  const { application, host } = createTenderApplication();
  const initial = application.publicState();
  application.mutateHost((state) =>
    host.updateBidDraft(state, {
      response: "A revised implementation response with sufficient detail for review.",
      expectedStateVersion: initial.stateVersion,
      expectedArtifactRevision: initial.artifactRevision,
    }),
  );
  const updated = application.publicState();
  assert.equal(updated.artifactRevision, initial.artifactRevision + 1);
  assert.throws(
    () =>
      application.mutateHost((state) =>
        host.updateBidDraft(state, {
          response: "A conflicting stale response that must not replace the current draft.",
          expectedStateVersion: initial.stateVersion,
          expectedArtifactRevision: initial.artifactRevision,
        }),
      ),
    /stale artifact revision/i,
  );
  assert.equal(
    application.publicState().tender.bidDraft,
    updated.tender.bidDraft,
  );
});

test("re-entry updates a revision-guarded draft and exposes no submission operation", async () => {
  const { application, host } = createTenderApplication();
  activateAndSubmit(application, host);
  await application.transitionAndContinue((state) =>
    host.requestClarification(state, {
      feedback: "Please confirm the proposed payment terms and supporting evidence.",
      expectedStateVersion: state.stateVersion,
    }),
  );
  const before = application.publicState();
  application.mutateHost((state) =>
    host.updateClarificationDraft(state, {
      response:
        "We confirm Net-30 terms and will provide incident response evidence for human review.",
      expectedStateVersion: before.stateVersion,
      expectedArtifactRevision: before.artifactRevision,
    }),
  );
  const after = application.publicState();
  assert.match(after.clarification.responseDraft, /Net-30/);
  assert.equal(after.status, "CHANGES_REQUESTED");
  assert.equal(typeof host.submitClarification, "undefined");
});
