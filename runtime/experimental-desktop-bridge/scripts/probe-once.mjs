// CLOUD-028 has not established legitimate custom-client admission.
// Do not read private input/runtime context or import native code before that gate is resolved.
// This is an operational hold, not a host authenticator or a configurable permission check.
const args = process.argv.slice(2);
const validMode = args.length === 0
  || (args.length === 1 && ["--inspect", "--send-once"].includes(args[0]));
const emit = (phase, result) => process.stdout.write(`${JSON.stringify({ phase, ...result })}\n`);

process.exitCode = 1;
emit("failure", {
  reasonCode: validMode ? "admission_unverified" : "invalid_mode",
  submission: "not_sent",
});
emit("shutdown", { clientClosed: true, listenerCreated: false, retryAttempted: false });
