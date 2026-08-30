import { createRuntime } from "../../src/server.mjs";

const action = process.env.H2_CHILD_ACTION;
if (!action) process.exit(0);
const faultLabel = process.env.H2_CHILD_FAULT_LABEL;
const clock = () => new Date(process.env.H2_CHILD_NOW);
const faultInjector = faultLabel
  ? {
      hit(label) {
        if (label !== faultLabel) return;
        process.send?.({ type: "barrier", label });
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
      },
    }
  : null;
const runtime = createRuntime({
  databasePath: process.env.H2_RECEIVER_DATABASE,
  durableDestinationPath: process.env.H2_DESTINATION_DATABASE,
  tracePath: process.env.H2_TRACE_PATH || null,
  origin: process.env.H2_ORIGIN,
  clock,
  deliveryMode: "heartbeat",
  deliveryTicketSecret: process.env.H2_DELIVERY_SECRET,
  effectReceiptSecret: process.env.H2_EFFECT_SECRET,
  durableEnrollmentEnabled: true,
  receiptSealingKey: process.env.H2_SEALING_KEY,
  receiptKeyId: process.env.H2_KEY_ID,
  durableEnrollmentFaultInjector: faultInjector,
  durableReceiptSinkFaultInjector: faultInjector,
  allowH2TestPaths: true,
});

try {
  if (process.env.H2_WAIT_FOR_GO === "true") {
    process.send?.({ type: "ready" });
    await new Promise((resolve) => process.once("message", resolve));
  }
  const result = action === "approve"
    ? runtime.durableEnrollment.approveChallenge(
        process.env.H2_CHALLENGE_ID,
        process.env.H2_CORRELATION_ID,
        { humanAction: true },
      )
    : action === "dispatch"
      ? await runtime.durableEnrollment.dispatchNext()
      : (() => { throw new Error("Unknown H2 child action"); })();
  await sendIpc({ type: "result", result });
} catch (error) {
  await sendIpc({ type: "error", name: error.name, message: error.message });
  process.exitCode = 1;
} finally {
  runtime.receiptDestinationDatabase.close();
  runtime.database.close();
  if (process.connected) process.disconnect();
}

function sendIpc(message) {
  if (!process.send) return Promise.resolve();
  return new Promise((resolve, reject) => {
    process.send(message, (error) => error ? reject(error) : resolve());
  });
}
