import fs from "node:fs";
import { createRuntime } from "../src/server.mjs";
import { TRACE_PATH } from "../src/config.mjs";

const runtime = createRuntime({ tracePath: null });
const workflow = runtime.domain.reset();
runtime.database.close();
fs.writeFileSync(TRACE_PATH, "", "utf8");
process.stdout.write(`${JSON.stringify({ reset: true, workflow }, null, 2)}\n`);
