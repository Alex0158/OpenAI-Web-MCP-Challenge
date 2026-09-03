import process from "node:process";

import { startApplicationDemo } from "./application-system.mjs";

let system;
try {
  const options = parseArguments(process.argv.slice(2));
  system = await startApplicationDemo({
    ...options,
    emit(value) {
      process.stdout.write(`${JSON.stringify(value)}\n`);
    },
  });
  process.stdout.write(`${JSON.stringify({
    event: "sample_application_demo_ready",
    applicant_url: system.applicantUrl,
    reviewer_url: system.reviewerUrl,
    receiver_origin: system.receiverOrigin,
    state_directory: system.stateDirectory,
    agent_adapter: "deterministic_local_evidence_only",
  })}\n`);
  await waitForTermination();
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    event: "sample_application_demo_failed",
    code: typeof error?.code === "string" ? error.code : "sample_application_demo_failed",
  })}\n`);
  process.exitCode = 1;
} finally {
  await system?.stop().catch(() => {});
}

function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    const value = args[index + 1];
    if (flag === "--state-dir" && value && !value.startsWith("--") && options.stateDirectory === undefined) {
      options.stateDirectory = value;
      index += 1;
      continue;
    }
    if (["--host-port", "--receiver-port"].includes(flag) && value && !value.startsWith("--")) {
      const port = Number(value);
      if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) throw argumentFailure();
      const field = flag === "--host-port" ? "hostPort" : "receiverPort";
      if (options[field] !== undefined) throw argumentFailure();
      options[field] = port;
      index += 1;
      continue;
    }
    throw argumentFailure();
  }
  return options;
}

function waitForTermination() {
  return new Promise((resolve) => {
    const finish = () => {
      process.off("SIGINT", finish);
      process.off("SIGTERM", finish);
      resolve();
    };
    process.once("SIGINT", finish);
    process.once("SIGTERM", finish);
  });
}

function argumentFailure() {
  return Object.assign(new Error("sample_argument_invalid"), { code: "sample_argument_invalid" });
}
