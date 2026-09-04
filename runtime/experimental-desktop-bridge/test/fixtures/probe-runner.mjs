import { createNativeAppToolsClient } from "../../src/native-client.mjs";
import { createProbeBridge } from "../../src/probe-bridge.mjs";

// Fixture-only orchestration; never consume ambient Desktop caller or endpoint context.
async function readInput() {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > 4096) throw new Error("invalid_input");
    chunks.push(chunk);
  }
  const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!input || typeof input !== "object" || Array.isArray(input)
      || Object.keys(input).some((key) => !["targetId", "expectedCwd", "marker", "priorMarker"].includes(key))) {
    throw new Error("invalid_input");
  }
  return input;
}

const emit = (phase, result) => process.stdout.write(`${JSON.stringify({ phase, ...result })}\n`);
let bridge;
try {
  const pipePath = process.env.REENTRY_FIXTURE_PIPE_PATH;
  if (!/^\/tmp\/reentry-cli-[A-Za-z0-9]{6}\/native\.sock$/u.test(pipePath ?? "")) {
    throw new Error("fixture_context_required");
  }
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && !["--inspect", "--send-once"].includes(args[0]))) {
    throw new Error("invalid_mode");
  }
  const { targetId, expectedCwd, marker, priorMarker } = await readInput();
  bridge = createProbeBridge({
    enabled: args[0] === "--send-once",
    targetId,
    expectedCwd,
    ...(priorMarker === undefined ? {} : { priorMarker }),
    nativeClient: createNativeAppToolsClient({
      pipePath,
      callerId: "private-cli-fixture-caller",
    }),
  });
  if (args[0] !== "--send-once") {
    const inspected = await bridge.inspect();
    emit("preflight", inspected);
    if (!inspected.sameTaskVerified) process.exitCode = 1;
  } else {
    const sent = await bridge.probeOnce({ marker });
    emit("submission", sent);
    process.exitCode = 1;
    if (sent.submission !== "not_sent") {
      const deadline = Date.now() + 90_000;
      let previous = "";
      while (Date.now() < deadline) {
        const observed = await bridge.observe();
        const serialized = JSON.stringify(observed);
        if (serialized !== previous) emit("observation", observed);
        previous = serialized;
        if (observed.sameTaskVerified && observed.observation === "correlated_turn_observed"
            && observed.turnCompleted && !observed.unexpectedToolUseObserved
            && !observed.unexpectedItemTypeObserved) process.exitCode = 0;
        if (observed.unexpectedToolUseObserved || observed.unexpectedItemTypeObserved
            || (observed.turnCompleted && observed.inputObserved)
            || ["observation_failed", "task_identity_unverified"].includes(observed.reasonCode)) break;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
} catch {
  emit("failure", { reasonCode: "probe_failed", submission: "unreported" });
  process.exitCode = 1;
} finally {
  let clientClosed = true;
  try { bridge?.close(); } catch { clientClosed = false; process.exitCode = 1; }
  emit("shutdown", { clientClosed, listenerCreated: false, retryAttempted: false });
}
