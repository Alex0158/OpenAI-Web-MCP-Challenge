import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const DASHBOARD_PATH = resolve(process.cwd(), "src/ui/agent/agent-dashboard-page.tsx");
const DETAIL_PATH = resolve(process.cwd(), "src/ui/agent/agent-request-page.tsx");

test("Agent queue withholds retained content while a latest read is loading or failed", () => {
  const dashboard = readFileSync(DASHBOARD_PATH, "utf8");

  assert.match(dashboard, /\{isLoading \|\| isRefreshing \? <QueueLoading \/> : !error && queue \? <QueueContent queue=\{queue\} \/> : null\}/);
});

test("Agent request detail withholds retained facts and actions while a latest read is loading or failed", () => {
  const detail = readFileSync(DETAIL_PATH, "utf8");

  assert.match(detail, /\{isLoading \|\| isRefreshing \? \([\s\S]*?<RequestLoading \/>[\s\S]*?\) : !error && detail \? \(/);
});
