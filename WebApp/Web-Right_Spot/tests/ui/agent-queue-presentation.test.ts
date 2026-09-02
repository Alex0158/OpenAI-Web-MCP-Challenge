import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const DASHBOARD_PATH = resolve(process.cwd(), "src/ui/agent/agent-dashboard-page.tsx");
const CSS_PATH = resolve(process.cwd(), "src/ui/agent/agent.module.css");

test("Agent queue presentation separates active work from terminal history", () => {
  const dashboard = readFileSync(DASHBOARD_PATH, "utf8");
  const css = readFileSync(CSS_PATH, "utf8");

  const activeStates = readStateGroup(dashboard, "ACTIVE_QUEUE_STATES");
  const terminalStates = readStateGroup(dashboard, "TERMINAL_QUEUE_STATES");

  assert.deepEqual(activeStates, [
    "REQUEST_SUBMITTED",
    "AGENT_REVIEWING",
    "SLOT_PROPOSED",
  ]);
  assert.deepEqual(terminalStates, [
    "VIEWING_CONFIRMED",
    "TENANT_DECLINED",
    "EXPIRED",
    "AGENT_DECLINED",
  ]);
  assert.ok(!activeStates.includes("TENANT_DRAFT"));
  assert.ok(!terminalStates.includes("TENANT_DRAFT"));

  assert.match(dashboard, /Active workflow/);
  assert.match(dashboard, /Recorded outcomes/);
  assert.match(dashboard, /activeRequests/);
  assert.match(dashboard, /terminalRequests/);
  assert.match(dashboard, /View recorded request/);
  assert.match(dashboard, /No active requests/);
  assert.match(dashboard, /No assigned requests/);
  assert.match(css, /\.queueSection/);
  assert.match(css, /\.metricGrid/);
});

function readStateGroup(source: string, name: string): string[] {
  const match = source.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\] as const;`));
  assert.ok(match, `Missing ${name} contract`);
  return [...match[1].matchAll(/"([A-Z_]+)"/g)].map((entry) => entry[1]);
}
