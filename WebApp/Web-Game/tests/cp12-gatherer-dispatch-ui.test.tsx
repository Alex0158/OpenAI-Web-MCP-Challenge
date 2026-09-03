import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../src/client/game-projection.tsx", import.meta.url), "utf8");

test("the gatherer form uses native labelled controls and a separate polite result", () => {
  assert.match(source, /<form[\s\S]*?<fieldset/);
  assert.match(source, /<fieldset[\s\S]*?aria-busy=\{dispatchPending\}/);
  assert.match(source, /<legend[^>]*>Dispatch gatherer<\/legend>/);
  assert.match(source, /<label[^>]*htmlFor="dispatch-soldier"[^>]*>Resident soldier<\/label>/);
  assert.match(source, /<select[^>]*id="dispatch-soldier"/);
  assert.match(source, /<label[^>]*htmlFor="dispatch-target"[^>]*>Sensed resource target<\/label>/);
  assert.match(source, /<select[^>]*id="dispatch-target"/);
  assert.match(source, /id="dispatch-status"[\s\S]*?role="status"[\s\S]*?aria-live="polite"/);
});

test("the form states fixed policy and cargo risk without route or timing claims", () => {
  assert.match(source, /GATHERER/);
  assert.match(source, /Tier 1/);
  assert.match(source, /WHEN_FULL/);
  assert.match(source, /Cargo remains unbanked until shelter deposit\./);
  assert.match(source, /available in the latest authoritative snapshot/);
  assert.doesNotMatch(source, /dispatchEta|estimated dispatch/i);
});

test("the shared page gate blocks map input independently of movement transport state", () => {
  assert.match(source, /commandPending:\s*pageMutationPending\s*&&\s*!movementPending/);
  assert.match(source, /disabled=\{!movementEnabled\}/);
  assert.match(source, /disabled=\{!dispatchEnabled \|\| !dispatchChoices\.ready\}/);
});
