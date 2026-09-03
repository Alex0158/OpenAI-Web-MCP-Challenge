import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const FRAME_PATH = resolve(process.cwd(), "src/ui/shared/role-page-frame.tsx");

test("RolePageFrame delegates post-entry checks to the shared lifecycle monitor", () => {
  const source = readFileSync(FRAME_PATH, "utf8");

  assert.match(source, /createRoleSessionLifecycleMonitor/);
  assert.match(source, /readSession/);
  assert.match(source, /onActorChange:\s*\(resolvedActor\)/);
  assert.match(source, /onError:\s*\(error/);
});

test("authenticated children use an actor-id-and-role keyed boundary", () => {
  const source = readFileSync(FRAME_PATH, "utf8");

  assert.match(source, /key=\{sessionActorKey\(actor\)\}/);
  assert.match(source, /\{children\}/);
});

test("the frame adds no polling, cookie parsing, client auth store, or cross-tab role inference", () => {
  const source = readFileSync(FRAME_PATH, "utf8");

  assert.doesNotMatch(source, /setInterval|setTimeout|document\.cookie|localStorage|BroadcastChannel/);
  assert.doesNotMatch(source, /window\.location.*role|searchParams.*role/);
});
