import test from "node:test";
import assert from "node:assert/strict";
import {
  chatGptCoreAppServerProcesses,
  chatGptLifecycleProcesses,
  d4ContaminatingProcessSnapshot,
  desktopLifecycleSnapshot,
  extendTrackedLifecycleIdentities,
  lifecycleIdentityMap,
} from "../scripts/d4-desktop-process-lifecycle.mjs";

const T0 = "2026-08-30T19:30:00.000Z";
const T1 = "2026-08-30T19:30:01.000Z";
const T2 = "2026-08-30T19:30:02.000Z";
const T3 = "2026-08-30T19:30:03.000Z";
const T4 = "2026-08-30T19:30:04.000Z";
const T5 = "2026-08-30T19:30:05.000Z";
const MAIN = "/Applications/ChatGPT.app/Contents/MacOS/ChatGPT";
const APP_SERVER = "/Applications/ChatGPT.app/Contents/Resources/codex -c features.code_mode_host=true app-server --analytics-default-enabled";
const NESTED_APP_SERVER = "/Applications/ChatGPT.app/Contents/Resources/codex app-server --listen stdio://";
const CODEX_CLI = "/Applications/ChatGPT.app/Contents/Resources/codex exec --model test";
const CODE_MODE_HOST = "/Applications/ChatGPT.app/Contents/Resources/codex-code-mode-host";
const FRAMEWORK_HELPER = "/Applications/ChatGPT.app/Contents/Frameworks/Codex Framework.framework/Helpers/Codex Helper";
const BUNDLED_NODE = "/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node";
const BUNDLED_NODE_REPL = "/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node_repl";
const KERNEL = `${BUNDLED_NODE} --experimental-vm-modules /var/folders/example/T/.tmpProbe/kernel.js --session-id session123 --working-dir /workspace/probe`;
const TRUSTED_WORKER = `${BUNDLED_NODE} /var/folders/example/T/.tmpProbe/trusted-worker.js /workspace/probe`;
const UNKNOWN_BUNDLE_EXECUTABLE = "/Applications/ChatGPT.app/Contents/Resources/future-daemon --serve";

function processRow(pid, ppid, startedAt, command) {
  return { pid, ppid, startedAt, command, executable: command.split(/\s+/)[0] };
}

function baselineWithRelay() {
  return [
    processRow(100, 1, T0, MAIN),
    processRow(110, 100, T1, APP_SERVER),
    processRow(
      120,
      110,
      T2,
      `${BUNDLED_NODE} /workspace/mvp/src/relay/codex-app-tools-relay.mjs`,
    ),
    processRow(125, 110, T3, CODEX_CLI),
  ];
}

test("explicitly allowlisted reparented workloads do not keep Desktop lifecycle open", () => {
  const baseline = [
    processRow(100, 1, T0, MAIN),
    processRow(110, 100, T1, APP_SERVER),
    processRow(120, 110, T2, `${BUNDLED_NODE} ./server.mjs`),
    processRow(125, 110, T3, CODEX_CLI),
  ];
  const tracked = lifecycleIdentityMap(chatGptLifecycleProcesses(baseline));
  assert.equal(tracked.size, 2);

  const afterQuit = [
    { ...baseline[2], ppid: 1 },
    { ...baseline[3], ppid: 1 },
  ];
  assert.deepEqual(desktopLifecycleSnapshot(afterQuit, tracked), {
    closed: true,
    chatgpt_main_process_count: 0,
    chatgpt_lifecycle_process_count: 0,
    live_tracked_lifecycle_process_count: 0,
    excluded_bundle_workload_process_count: 2,
  });
});

test("the Desktop core app-server is lifecycle while a nested stdio app-server is workload", () => {
  const main = processRow(100, 1, T0, MAIN);
  const coreAppServer = processRow(110, 100, T1, APP_SERVER);
  const repl = processRow(120, 110, T2, BUNDLED_NODE_REPL);
  const nestedAppServer = processRow(130, 120, T3, NESTED_APP_SERVER);
  const kernel = processRow(131, 120, T4, KERNEL);
  const trustedWorker = processRow(132, 120, T5, TRUSTED_WORKER);
  const baseline = [
    main,
    coreAppServer,
    repl,
    nestedAppServer,
    kernel,
    trustedWorker,
  ];
  const tracked = lifecycleIdentityMap(chatGptLifecycleProcesses(baseline));

  assert.deepEqual([...tracked.values()], [
    { pid: 100, started_at: T0 },
    { pid: 110, started_at: T1 },
  ]);
  assert.deepEqual(chatGptCoreAppServerProcesses(baseline), [coreAppServer]);

  const afterQuit = [repl, nestedAppServer, kernel, trustedWorker]
    .map((row) => ({ ...row, ppid: 1 }));
  assert.deepEqual(desktopLifecycleSnapshot(afterQuit, tracked), {
    closed: true,
    chatgpt_main_process_count: 0,
    chatgpt_lifecycle_process_count: 0,
    live_tracked_lifecycle_process_count: 0,
    excluded_bundle_workload_process_count: 4,
  });
});

test("an unrecognized ChatGPT-bundle executable fails closed", () => {
  const unknown = processRow(150, 1, T0, UNKNOWN_BUNDLE_EXECUTABLE);
  const tracked = lifecycleIdentityMap(chatGptLifecycleProcesses([unknown]));
  const snapshot = desktopLifecycleSnapshot([unknown], tracked);

  assert.equal(tracked.size, 1);
  assert.equal(snapshot.closed, false);
  assert.equal(snapshot.chatgpt_lifecycle_process_count, 1);
  assert.equal(snapshot.live_tracked_lifecycle_process_count, 1);
  assert.equal(snapshot.excluded_bundle_workload_process_count, 0);
});

test("an unrecognized bundled-node workload fails closed", () => {
  const unknownNode = processRow(
    155,
    1,
    T0,
    `${BUNDLED_NODE} /workspace/unreviewed-agent.js`,
  );
  const tracked = lifecycleIdentityMap(chatGptLifecycleProcesses([unknownNode]));
  const snapshot = desktopLifecycleSnapshot([unknownNode], tracked);

  assert.equal(tracked.size, 1);
  assert.equal(snapshot.closed, false);
  assert.equal(snapshot.chatgpt_lifecycle_process_count, 1);
  assert.equal(snapshot.excluded_bundle_workload_process_count, 0);
});

test("an app-server command outside the exact nested-workload signature fails closed", () => {
  const unknownAppServer = processRow(
    160,
    1,
    T0,
    `${NESTED_APP_SERVER} --future-option`,
  );
  const tracked = lifecycleIdentityMap(chatGptLifecycleProcesses([unknownAppServer]));
  const snapshot = desktopLifecycleSnapshot([unknownAppServer], tracked);

  assert.equal(tracked.size, 1);
  assert.equal(snapshot.closed, false);
  assert.equal(snapshot.chatgpt_lifecycle_process_count, 1);
  assert.equal(snapshot.excluded_bundle_workload_process_count, 0);
});

test("the known P0 relay is rejected as D4 experiment contamination", () => {
  assert.deepEqual(d4ContaminatingProcessSnapshot(baselineWithRelay()), {
    clean: false,
    codex_app_tools_relay_process_count: 1,
  });
  const relayWithTrailingArgument = baselineWithRelay();
  relayWithTrailingArgument[2] = {
    ...relayWithTrailingArgument[2],
    command: `${relayWithTrailingArgument[2].command} --diagnostic`,
  };
  assert.equal(
    d4ContaminatingProcessSnapshot(relayWithTrailingArgument)
      .codex_app_tools_relay_process_count,
    1,
  );
});

test("a reparented old app-server keeps Desktop lifecycle open", () => {
  const baseline = baselineWithRelay().slice(0, 2);
  const tracked = lifecycleIdentityMap(chatGptLifecycleProcesses(baseline));
  const afterQuit = [{ ...baseline[1], ppid: 1 }];
  const snapshot = desktopLifecycleSnapshot(afterQuit, tracked);
  assert.equal(snapshot.closed, false);
  assert.equal(snapshot.chatgpt_lifecycle_process_count, 1);
  assert.equal(snapshot.live_tracked_lifecycle_process_count, 1);
});

test("a reparented Electron framework helper keeps Desktop lifecycle open", () => {
  const main = processRow(100, 1, T0, MAIN);
  const helper = processRow(130, 100, T1, FRAMEWORK_HELPER);
  const tracked = lifecycleIdentityMap(chatGptLifecycleProcesses([main, helper]));
  const snapshot = desktopLifecycleSnapshot([{ ...helper, ppid: 1 }], tracked);
  assert.equal(snapshot.closed, false);
  assert.equal(snapshot.live_tracked_lifecycle_process_count, 1);
});

test("a late lifecycle host is added to the tracked identity set", () => {
  const baseline = baselineWithRelay().slice(0, 2);
  const tracked = lifecycleIdentityMap(chatGptLifecycleProcesses(baseline));
  const lateHost = processRow(140, 110, T3, CODE_MODE_HOST);
  extendTrackedLifecycleIdentities([...baseline, lateHost], tracked);
  assert.equal(tracked.size, 3);
  assert.equal(
    desktopLifecycleSnapshot([{ ...lateHost, ppid: 1 }], tracked).closed,
    false,
  );
});

test("PID reuse does not preserve an old identity but a new main still blocks closure", () => {
  const oldMain = processRow(100, 1, T0, MAIN);
  const tracked = lifecycleIdentityMap(chatGptLifecycleProcesses([oldMain]));
  const newMain = processRow(100, 1, T3, MAIN);
  const snapshot = desktopLifecycleSnapshot([newMain], tracked);
  assert.equal(snapshot.live_tracked_lifecycle_process_count, 0);
  assert.equal(snapshot.chatgpt_main_process_count, 1);
  assert.equal(snapshot.closed, false);
});
