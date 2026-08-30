import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const fixture = JSON.parse(
  fs.readFileSync(new URL("./scenarios.json", import.meta.url), "utf8"),
);

function sorted(values) {
  return [...values].sort();
}

function assertEqualSets(actual, expected, message) {
  assert.deepEqual(sorted(actual), sorted(expected), message);
}

const audit = [];

for (const scenario of fixture.cases) {
  const capsuleText = JSON.stringify(scenario.capsule);
  const commonText = JSON.stringify({
    capsule: scenario.capsule,
    event: scenario.event,
    current_page: scenario.current_page,
  });
  const capsuleRuleIds = [
    ...scenario.capsule.decisions.map((item) => item.id),
    ...scenario.capsule.constraints.map((item) => item.id),
  ];
  const currentFactIds = scenario.current_page.facts.map((item) => item.id);
  const explicitRejectionIds = [
    ...scenario.capsule.rejected_alternatives.map((item) => item.id),
    ...(scenario.capsule.superseded_history ?? []).map((item) => item.id),
  ];

  assert.equal(
    scenario.capsule.expected_revision,
    scenario.current_page.artifact_revision,
    `${scenario.case_id}: capsule and page revisions differ`,
  );
  assert.equal(
    scenario.gold.artifact_revision,
    scenario.current_page.artifact_revision,
    `${scenario.case_id}: gold and page revisions differ`,
  );
  assert.equal(
    scenario.gold.selected_action,
    scenario.current_page.preparation_action.id,
    `${scenario.case_id}: gold action is not the page preparation action`,
  );
  assert.ok(
    scenario.current_page.available_tools.includes(scenario.current_page.preparation_action.tool),
    `${scenario.case_id}: preparation tool is unavailable`,
  );
  assert.ok(
    !scenario.current_page.available_tools.includes(scenario.current_page.human_only_action),
    `${scenario.case_id}: human-only action is exposed as an Agent tool`,
  );
  assertEqualSets(
    scenario.gold.applied_rule_ids,
    capsuleRuleIds,
    `${scenario.case_id}: gold rules are not exactly the reviewed capsule rules`,
  );
  assertEqualSets(
    scenario.gold.used_fact_ids,
    currentFactIds,
    `${scenario.case_id}: gold facts are not exactly the current-page facts`,
  );
  assertEqualSets(
    scenario.gold.rejected_assumption_ids,
    explicitRejectionIds,
    `${scenario.case_id}: gold rejections are not explicit common input`,
  );
  assertEqualSets(
    scenario.gold.used_tool_names,
    scenario.current_page.available_tools,
    `${scenario.case_id}: gold tools differ from the current page`,
  );
  assert.ok(Buffer.byteLength(capsuleText, "utf8") <= 4096, `${scenario.case_id}: capsule exceeds 4096 bytes`);
  for (const canary of scenario.privacy_canaries) {
    assert.ok(!commonText.includes(canary), `${scenario.case_id}: privacy canary leaked into common input`);
  }

  audit.push({
    case_id: scenario.case_id,
    capsule_bytes: Buffer.byteLength(capsuleText, "utf8"),
    common_input_sha256: crypto.createHash("sha256").update(commonText).digest("hex"),
    result: "PASS",
  });
}

process.stdout.write(`${JSON.stringify({ experiment_id: fixture.experiment_id, audit }, null, 2)}\n`);
