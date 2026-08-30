const CHATGPT_MAIN_COMMAND = "/Applications/ChatGPT.app/Contents/MacOS/ChatGPT";
const CHATGPT_BUNDLE_PREFIX = "/Applications/ChatGPT.app/Contents/";
const CHATGPT_FRAMEWORKS_PREFIX = `${CHATGPT_BUNDLE_PREFIX}Frameworks/`;
const CHATGPT_CODEX_COMMAND = `${CHATGPT_BUNDLE_PREFIX}Resources/codex`;
const CHATGPT_CUA_NODE_COMMAND =
  `${CHATGPT_BUNDLE_PREFIX}Resources/cua_node/bin/node`;
const CHATGPT_CUA_NODE_REPL_COMMAND =
  `${CHATGPT_BUNDLE_PREFIX}Resources/cua_node/bin/node_repl`;
const CHATGPT_CODE_MODE_HOST_COMMAND =
  `${CHATGPT_BUNDLE_PREFIX}Resources/codex-code-mode-host`;
const CHATGPT_MODIFIER_MONITOR_COMMAND =
  `${CHATGPT_BUNDLE_PREFIX}Resources/native/bare-modifier-monitor`;
const D4_RELAY_SUFFIX = "src/relay/codex-app-tools-relay.mjs";
const KNOWN_CODEX_WORKLOAD_ARGUMENT_PATTERNS = [
  /^exec(?:\s|$)/u,
  /^app-server --listen stdio:\/\/$/u,
];
const KNOWN_CUA_NODE_WORKLOAD_ARGUMENT_PATTERNS = [
  /^\.\/server\.mjs$/u,
  /^--experimental-vm-modules \/var\/folders\/\S+\/T\/\.tmp[^/\s]+\/kernel\.js --session-id \S+ --working-dir .+$/u,
  /^\/var\/folders\/\S+\/T\/\.tmp[^/\s]+\/trusted-worker\.js .+$/u,
];

export function chatGptMainProcesses(rows) {
  return rows.filter((row) => executableMatches(row.command, CHATGPT_MAIN_COMMAND));
}

export function chatGptCoreAppServerProcesses(rows) {
  return rows.filter((row) => isDesktopCoreAppServerProcess(row.command));
}

export function chatGptLifecycleProcesses(rows) {
  return rows.filter((row) => isChatGptLifecycleProcess(row));
}

export function lifecycleIdentityMap(rows) {
  return new Map(rows.map((row) => {
    const identity = { pid: row.pid, started_at: row.startedAt ?? row.started_at };
    return [identityKey(identity), identity];
  }));
}

export function extendTrackedLifecycleIdentities(rows, tracked) {
  for (const row of chatGptLifecycleProcesses(rows)) {
    const key = identityKey(row);
    if (!tracked.has(key)) {
      tracked.set(key, { pid: row.pid, started_at: row.startedAt ?? row.started_at });
    }
  }
}

export function desktopLifecycleSnapshot(rows, trackedLifecycleIdentities) {
  const tracked = Array.isArray(trackedLifecycleIdentities)
    ? trackedLifecycleIdentities
    : [...trackedLifecycleIdentities.values()];
  const liveTrackedLifecycleCount = tracked.filter(
    (identity) => rows.some((row) => sameProcessIdentity(row, identity)),
  ).length;
  const chatGptMainProcessCount = chatGptMainProcesses(rows).length;
  const chatGptLifecycleProcessCount = chatGptLifecycleProcesses(rows).length;
  const excludedBundleWorkloadProcessCount = rows.filter(
    (row) =>
      row.command.startsWith(CHATGPT_BUNDLE_PREFIX) &&
      !isChatGptLifecycleProcess(row),
  ).length;
  return {
    closed:
      chatGptMainProcessCount === 0 &&
      chatGptLifecycleProcessCount === 0 &&
      liveTrackedLifecycleCount === 0,
    chatgpt_main_process_count: chatGptMainProcessCount,
    chatgpt_lifecycle_process_count: chatGptLifecycleProcessCount,
    live_tracked_lifecycle_process_count: liveTrackedLifecycleCount,
    excluded_bundle_workload_process_count: excludedBundleWorkloadProcessCount,
  };
}

export function d4ContaminatingProcessSnapshot(rows) {
  const relayProcessCount = rows.filter(
    (row) => {
      const nodeArgs = executableArguments(row.command, CHATGPT_CUA_NODE_COMMAND);
      if (nodeArgs === null) return false;
      const [scriptPath] = nodeArgs.split(/\s+/u);
      return scriptPath?.endsWith(D4_RELAY_SUFFIX) === true;
    },
  ).length;
  return {
    clean: relayProcessCount === 0,
    codex_app_tools_relay_process_count: relayProcessCount,
  };
}

export function sameProcessIdentity(left, right) {
  return (
    left?.pid === right?.pid &&
    (left?.startedAt ?? left?.started_at) === (right?.startedAt ?? right?.started_at)
  );
}

function identityKey(identity) {
  return `${identity.pid}:${identity.startedAt ?? identity.started_at}`;
}

function isChatGptLifecycleProcess(row) {
  if (!row.command.startsWith(CHATGPT_BUNDLE_PREFIX)) return false;

  if (
    executableMatches(row.command, CHATGPT_MAIN_COMMAND) ||
    row.command.startsWith(CHATGPT_FRAMEWORKS_PREFIX) ||
    isDesktopCoreAppServerProcess(row.command) ||
    executableMatches(row.command, CHATGPT_CODE_MODE_HOST_COMMAND) ||
    executableMatches(row.command, CHATGPT_MODIFIER_MONITOR_COMMAND)
  ) {
    return true;
  }

  if (isKnownChatGptWorkloadProcess(row.command)) return false;

  // Unknown executables inside the signed application bundle fail closed. A
  // new workload signature must be reviewed and added to the narrow allowlist
  // before it can stop participating in Desktop-closure detection.
  return true;
}

function isDesktopCoreAppServerProcess(command) {
  const args = executableArguments(command, CHATGPT_CODEX_COMMAND);
  if (args === null) return false;
  return (
    /(?:^|\s)-c\s+features\.code_mode_host=true(?:\s|$)/u.test(args) &&
    /(?:^|\s)app-server(?:\s|$)/u.test(args) &&
    /(?:^|\s)--analytics-default-enabled(?:\s|$)/u.test(args)
  );
}

function isKnownChatGptWorkloadProcess(command) {
  const codexArgs = executableArguments(command, CHATGPT_CODEX_COMMAND);
  if (codexArgs !== null) {
    return KNOWN_CODEX_WORKLOAD_ARGUMENT_PATTERNS.some(
      (pattern) => pattern.test(codexArgs),
    );
  }

  const nodeReplArgs = executableArguments(command, CHATGPT_CUA_NODE_REPL_COMMAND);
  if (nodeReplArgs !== null) return nodeReplArgs === "";

  const nodeArgs = executableArguments(command, CHATGPT_CUA_NODE_COMMAND);
  if (nodeArgs === null) return false;
  return KNOWN_CUA_NODE_WORKLOAD_ARGUMENT_PATTERNS.some(
    (pattern) => pattern.test(nodeArgs),
  );
}

function executableArguments(command, executable) {
  if (command === executable) return "";
  if (!command.startsWith(`${executable} `)) return null;
  return command.slice(executable.length + 1);
}

function executableMatches(command, executable) {
  return command === executable || command.startsWith(`${executable} `);
}
