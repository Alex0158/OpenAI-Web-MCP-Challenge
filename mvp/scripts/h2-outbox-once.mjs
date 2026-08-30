import { createRuntime } from "../src/server.mjs";
import { H2_TRACE_PATH } from "../src/config.mjs";

if (process.env.WEBMCP_H2_DURABLE_ENROLLMENT !== "true") {
  throw new Error("The H2 one-shot worker requires WEBMCP_H2_DURABLE_ENROLLMENT=true");
}

const fixedNow = process.env.WEBMCP_H2_WORKER_NOW;
const runtime = createRuntime({
  tracePath: H2_TRACE_PATH,
  ...(fixedNow ? { clock: () => new Date(fixedNow) } : {}),
  allowH2TestPaths: process.env.WEBMCP_H2_ALLOW_TEST_PATHS === "true",
});

try {
  const result = await runtime.durableEnrollment.dispatchNext();
  process.stdout.write(`${JSON.stringify({ mode: "h2-outbox-once", result })}\n`);
} finally {
  runtime.receiptDestinationDatabase.close();
  runtime.database.close();
}
