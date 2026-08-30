import fs from "node:fs";
import { createRuntime } from "../src/server.mjs";
import {
  DATABASE_PATH,
  H1_DATABASE_PATH,
  H1_TRACE_PATH,
  TRACE_PATH,
} from "../src/config.mjs";

if (process.env.WEBMCP_MVP_DELIVERY !== "heartbeat") {
  throw new Error("reset-h1 requires WEBMCP_MVP_DELIVERY=heartbeat");
}
if (DATABASE_PATH !== H1_DATABASE_PATH || TRACE_PATH !== H1_TRACE_PATH) {
  throw new Error("reset-h1 refuses any database or trace path outside the isolated H1 targets");
}

const runtime = createRuntime();
const workflow = runtime.domain.reset();
runtime.database.close();
fs.writeFileSync(TRACE_PATH, "", "utf8");
process.stdout.write(`${JSON.stringify({
  reset: true,
  delivery_mode: "heartbeat",
  workflow,
  evidence_classification: "mutable_h1_development_state",
}, null, 2)}\n`);
