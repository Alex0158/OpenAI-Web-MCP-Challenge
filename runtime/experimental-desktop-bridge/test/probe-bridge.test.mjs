import assert from "node:assert/strict";
import test from "node:test";
import { createProbeBridge } from "../src/probe-bridge.mjs";

const TARGET = "private-target-fixture";
const MARKER = "REENTRY_BRIDGE_TEST_B1";
const CWD = "/test/private-workspace";
function fixture() {
  const calls = [];
  const value = { thread: { id: TARGET, kind: "codex", hostId: "local", cwd: CWD,
    status: { type: "notLoaded" } }, turns: [{ id: "baseline", status: "completed", items: [] }] };
  const client = {
    capabilities: async () => { calls.push("capabilities"); return { readTask: true, sendProbe: true }; },
    readTask: async (id) => { calls.push(["read", id]); return structuredClone(value); },
    sendProbe: async (id, prompt) => { calls.push(["send", id, prompt]); return { reportedAccepted: true }; },
    close: () => calls.push("close"),
  };
  const bridge = (extra = {}) => createProbeBridge({ enabled: true, targetId: TARGET,
    expectedCwd: CWD, nativeClient: client, ...extra });
  return { calls, value, client, bridge, sends: () => calls.filter((call) => call[0] === "send") };
}

test("default-disabled bridge is inert on import/construction and refuses dispatch", async () => {
  const f = fixture();
  const b = f.bridge({ enabled: false });
  assert.equal(f.calls.length, 0);
  assert.equal((await b.probeOnce({ marker: MARKER })).reasonCode, "bridge_disabled");
  assert.equal(f.calls.length, 0);
});

test("exact-task read-only preflight does not submit", async () => {
  const f = fixture();
  assert.equal((await f.bridge().inspect()).sameTaskVerified, true);
  assert.equal(f.sends().length, 0);
});

test("native preflight failure exposes only a fixed diagnostic code and makes zero sends", async () => {
  for (const code of ["native_connection_closed", "native_private_target_secret"]) {
    const f = fixture();
    f.client.capabilities = async () => { throw Object.assign(new Error(`${TARGET} bearer secret`), { code }); };
    const result = await f.bridge().inspect();
    assert.equal(result.reasonCode, "preflight_failed");
    assert.equal(result.nativeFailureCode, code === "native_connection_closed" ? code : null);
    assert.equal(result.submission, "not_sent");
    assert.equal(f.sends().length, 0);
    assert.doesNotMatch(JSON.stringify(result), /private_target|private-target|bearer|secret/);
  }
});

for (const mutate of [
  (v) => { v.thread.id = "wrong-target"; },
  (v) => { v.thread.cwd = "/wrong-workspace"; },
  (v) => { v.thread.hostId = "remote"; },
  (v) => { v.thread.kind = "chatgpt"; },
  (v) => { v.threadId = "conflicting-target"; },
  (v) => { v.turns = null; },
]) {
  test(`identity/shape mismatch produces zero sends: ${mutate.toString()}`, async () => {
    const f = fixture(); mutate(f.value);
    const result = await f.bridge().probeOnce({ marker: MARKER });
    assert.equal(result.submission, "not_sent");
    assert.equal(result.reasonCode, "task_identity_unverified");
    assert.equal(f.sends().length, 0);
  });
}

test("missing capability, busy target and existing marker each fail before send", async () => {
  for (const scenario of ["capability", "busy", "marker"]) {
    const f = fixture();
    if (scenario === "capability") f.client.capabilities = async () => ({ readTask: true, sendProbe: false });
    if (scenario === "busy") f.value.thread.status.type = "running";
    if (scenario === "marker") f.value.turns[0].items.push({ type: "agentMessage", text: MARKER });
    assert.equal((await f.bridge().probeOnce({ marker: MARKER })).submission, "not_sent");
    assert.equal(f.sends().length, 0);
  }
});

test("request overrides and accessors are rejected without evaluation or IO", async () => {
  for (const input of [{ marker: MARKER, targetId: "another" }, { marker: MARKER, prompt: "other" },
    { marker: "arbitrary instructions" }, Object.defineProperty({}, "marker", { get() { throw new Error("accessor ran"); } })]) {
    const f = fixture();
    assert.equal((await f.bridge().probeOnce(input)).reasonCode, "invalid_probe_input");
    assert.equal(f.calls.length, 0);
  }
});

test("accepted send fixes target and inert body without exposing private data", async () => {
  const f = fixture();
  const result = await f.bridge().probeOnce({ marker: MARKER });
  assert.equal(f.sends().length, 1);
  assert.equal(f.sends()[0][1], TARGET);
  assert.match(f.sends()[0][2], /not a Game business event/);
  assert.doesNotMatch(f.sends()[0][2], new RegExp(TARGET));
  assert.equal(result.submission, "reported_accepted");
  assert.equal(result.observation, "not_observed");
  assert.doesNotMatch(JSON.stringify(result), /private-target|private-workspace/);
});

test("concurrent and repeated calls consume only one submission allowance", async () => {
  const f = fixture(); const b = f.bridge();
  const results = await Promise.all([b.probeOnce({ marker: MARKER }), b.probeOnce({ marker: MARKER })]);
  assert.equal(f.sends().length, 1);
  assert.ok(results.some((r) => r.reasonCode === "attempt_already_used"));
  await b.probeOnce({ marker: MARKER });
  assert.equal(f.sends().length, 1);
});

test("send exception remains unknown and cannot resend or leak upstream details", async () => {
  const f = fixture(); const b = f.bridge();
  f.client.sendProbe = async () => { f.calls.push(["send"]); throw new Error(`${TARGET} bearer secret`); };
  const result = await b.probeOnce({ marker: MARKER });
  assert.equal(result.submission, "outcome_unknown");
  assert.doesNotMatch(JSON.stringify(result), /private-target|bearer/);
  await b.probeOnce({ marker: MARKER });
  assert.equal(f.sends().length, 1);
});

test("acceptance, uncorrelated activity, and baseline echoes do not prove wake", async () => {
  const f = fixture(); const b = f.bridge();
  await b.probeOnce({ marker: MARKER });
  const prompt = f.sends()[0][2];
  f.value.turns[0].items = [{ type: "userMessage", content: [{ type: "text", text: prompt }] },
    { type: "agentMessage", text: MARKER }];
  f.value.turns.unshift({ id: "unrelated", status: "completed", items: [{ type: "agentMessage", text: MARKER }] });
  assert.equal((await b.observe()).observation, "not_observed");
});

test("correlated input alone is not observed Agent activity; exact new response proves wake only", async () => {
  const f = fixture(); const b = f.bridge({ priorMarker: "REENTRY_WAKE_OLD" });
  await b.probeOnce({ marker: MARKER });
  const turn = { id: "new-turn", status: "inProgress", items: [
    { type: "userMessage", content: [{ type: "text", text: f.sends()[0][2] }] },
  ] };
  f.value.turns.unshift(turn);
  assert.equal((await b.observe()).observation, "input_only_observed");
  turn.items.push({ type: "agentMessage", text: MARKER });
  turn.status = "completed";
  const result = await b.observe();
  assert.equal(result.observation, "correlated_turn_observed");
  assert.equal(result.inputRole, "userMessage");
  assert.equal(result.markerResponseObserved, true);
  assert.equal(result.browser, "not_attempted");
  assert.equal(result.receiverAcknowledgement, "not_attempted");
});

test("wrong-task observation cannot establish a new wake", async () => {
  const f = fixture(); const b = f.bridge();
  await b.probeOnce({ marker: MARKER });
  f.value.thread.id = "another-task";
  assert.equal((await b.observe()).reasonCode, "task_identity_unverified");
});

test("retained earlier input and unexpected tool use are independent observations", async () => {
  const f = fixture(); const b = f.bridge({ priorMarker: "REENTRY_WAKE_OLD" });
  await b.probeOnce({ marker: MARKER });
  f.value.turns.unshift({ id: "old-queue-new-turn", status: "completed", items: [
    { type: "userMessage", content: [{ type: "text", text: "REENTRY_WAKE_OLD" }] },
    { type: "mcpToolCall", arguments: { secret: TARGET } },
  ] });
  const result = await b.observe();
  assert.equal(result.priorQueueMarkerObserved, true);
  assert.equal(result.unexpectedToolUseObserved, true);
  assert.equal(result.observation, "not_observed");
  assert.doesNotMatch(JSON.stringify(result), new RegExp(TARGET));
});

test("closing disables subsequent submission without retracting an accepted one", async () => {
  const f = fixture(); const b = f.bridge();
  await b.probeOnce({ marker: MARKER }); b.close();
  const result = await b.probeOnce({ marker: MARKER });
  assert.equal(result.reasonCode, "bridge_closed");
  assert.equal(result.submission, "reported_accepted");
  assert.equal(f.sends().length, 1);
});

test("closing while preflight is pending fences the first send", async () => {
  const f = fixture();
  let release;
  f.client.capabilities = () => new Promise((resolve) => { release = resolve; });
  const b = f.bridge();
  const pending = b.probeOnce({ marker: MARKER });
  b.close();
  release({ readTask: true, sendProbe: true });
  assert.equal((await pending).reasonCode, "bridge_closed");
  assert.equal(f.sends().length, 0);
});

test("older activity before the new input cannot prove that input woke the task", async () => {
  const f = fixture(); const b = f.bridge();
  await b.probeOnce({ marker: MARKER });
  const items = [{ type: "agentMessage", text: "older queued response" },
    { type: "userMessage", content: [{ type: "text", text: f.sends()[0][2] }] }];
  f.value.turns.unshift({ id: "joined-turn", status: "completed", items });
  assert.equal((await b.observe()).observation, "input_only_observed");
  items.push({ type: "agentMessage", text: MARKER });
  const result = await b.observe();
  assert.equal(result.observation, "response_in_joined_turn_observed");
  assert.equal(result.inputStartedObservedTurn, false);
  assert.equal(result.markerResponseObserved, true);
});

test("a matching substring in unrelated input is not the probe", async () => {
  const f = fixture(); const b = f.bridge();
  await b.probeOnce({ marker: MARKER });
  f.value.turns.unshift({ id: "new-turn", status: "completed", items: [
    { type: "userMessage", content: [{ type: "text", text: `Unrelated quoted text: ${f.sends()[0][2]}` }] },
    { type: "agentMessage", text: MARKER },
  ] });
  assert.equal((await b.observe()).observation, "not_observed");
});

test("native delegation wrapping is recognized without forwarding caller metadata", async () => {
  const f = fixture(); const b = f.bridge();
  await b.probeOnce({ marker: MARKER });
  f.value.turns.unshift({ id: "new-turn", status: "completed", items: [
    { type: "userMessage", content: [{ type: "text", text: `<codex_delegation>\n<source_thread_id>private-caller</source_thread_id>\n<input>${f.sends()[0][2]}</input>\n</codex_delegation>` }] },
    { type: "agentMessage", text: MARKER },
  ] });
  const result = await b.observe();
  assert.equal(result.observation, "correlated_turn_observed");
  assert.doesNotMatch(JSON.stringify(result), /private-caller/);
});

test("host-mediated output envelope preserves tool-data role and joined-turn attribution", async () => {
  const f = fixture(); const b = f.bridge({ priorMarker: "REENTRY_WAKE_OLD" });
  await b.probeOnce({ marker: MARKER });
  f.value.turns.unshift({ id: "control-turn", status: "completed", items: [
    { type: "userMessage", content: [{ type: "text", text: "REENTRY_WAKE_OLD" }] },
    { type: "agentMessage", text: "REENTRY_WAKE_OLD" },
    { type: "functionCallOutput", name: "send_message_to_thread", namespace: "codex_app",
      output: { text: `<codex_delegation>\n<source_thread_id>private-caller</source_thread_id>\n<input>${f.sends()[0][2]}</input>\n</codex_delegation>`, truncated: false } },
    { type: "agentMessage", text: MARKER },
  ] });
  const result = await b.observe();
  assert.equal(result.observation, "response_in_joined_turn_observed");
  assert.equal(result.inputRole, "functionCallOutput");
  assert.equal(result.inputStartedObservedTurn, false);
  assert.equal(result.markerResponseObserved, true);
  assert.equal(result.priorQueueMarkerObserved, true);
  assert.equal(result.unexpectedToolUseObserved, false);
  assert.equal(result.unexpectedItemTypeObserved, false);
  assert.equal(result.turnCompleted, true);
  assert.equal(result.browser, "not_attempted");
  assert.equal(result.receiverAcknowledgement, "not_attempted");
  assert.doesNotMatch(JSON.stringify(result), /private-caller|private-target|private-workspace/);
});

test("truncated, malformed, foreign or merely quoted output envelopes cannot prove receipt", async (t) => {
  const mutations = {
    truncated: (item) => { item.output.truncated = true; },
    missingTruncation: (item) => { delete item.output.truncated; },
    nonBooleanTruncation: (item) => { item.output.truncated = "false"; },
    missingText: (item) => { delete item.output.text; },
    nonText: (item) => { item.output.text = { text: MARKER }; },
    nullOutput: (item) => { item.output = null; },
    arrayOutput: (item) => { item.output = [item.output]; },
    unknownField: (item) => { item.output.unrecognized = true; },
    foreignTool: (item) => { item.name = "read_thread"; },
    foreignNamespace: (item) => { item.namespace = "another_app"; },
    missingNamespace: (item) => { delete item.namespace; },
    quotedPrompt: (item) => { item.output.text = `Unrelated quoted text: ${item.output.text}`; },
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    await t.test(name, async () => {
      const f = fixture(); const b = f.bridge();
      await b.probeOnce({ marker: MARKER });
      const item = { type: "functionCallOutput", name: "send_message_to_thread", namespace: "codex_app",
        output: { text: f.sends()[0][2], truncated: false } };
      mutate(item);
      f.value.turns.unshift({ id: "unverified-output", status: "completed", items: [
        item, { type: "agentMessage", text: MARKER },
      ] });
      const result = await b.observe();
      assert.equal(result.observation, "not_observed");
      assert.equal(result.inputObserved, false);
      assert.equal(f.sends().length, 1);
    });
  }
});

test("non-MCP tools and future unknown items cannot pass the no-tools observation", async () => {
  for (const type of ["webSearch", "futureAction"]) {
    const f = fixture(); const b = f.bridge();
    await b.probeOnce({ marker: MARKER });
    f.value.turns.unshift({ id: "new-turn", status: "completed", items: [{ type }] });
    const result = await b.observe();
    assert.ok(result.unexpectedToolUseObserved || result.unexpectedItemTypeObserved);
  }
});
