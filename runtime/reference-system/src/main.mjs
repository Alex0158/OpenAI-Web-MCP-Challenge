import process from "node:process";

import { runReferenceSystem } from "./reference-system.mjs";

try {
  const options = parseArguments(process.argv.slice(2));
  await runReferenceSystem({
    ...options,
    emit(value) {
      process.stdout.write(`${JSON.stringify(value)}\n`);
    },
  });
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    event: "reference_system_failed",
    code: typeof error?.code === "string" ? error.code : "reference_system_failed",
  })}\n`);
  process.exitCode = 1;
}

function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--hold") {
      if (options.holdOpen !== undefined) throw argumentFailure();
      options.holdOpen = true;
      continue;
    }
    if (value === "--state-dir") {
      const next = args[index + 1];
      if (typeof next !== "string" || next.startsWith("--") || options.stateDirectory !== undefined) {
        throw argumentFailure();
      }
      options.stateDirectory = next;
      index += 1;
      continue;
    }
    throw argumentFailure();
  }
  return options;
}

function argumentFailure() {
  return Object.assign(new Error("reference_argument_invalid"), { code: "reference_argument_invalid" });
}
