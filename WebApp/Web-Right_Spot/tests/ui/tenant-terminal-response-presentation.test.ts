import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const requestPagePath = resolve(process.cwd(), "src/ui/tenant/tenant-request-page.tsx");

const acceptedPresentations = [
  ["SLOT_PROPOSED", "A viewing slot was proposed", "Action needed", true],
  ["VIEWING_CONFIRMED", "Viewing slot confirmed", "Decision recorded", false],
  ["TENANT_DECLINED", "Viewing proposal declined", "Decision recorded", false],
  ["EXPIRED", "Viewing proposal expired", "Closed", false],
  ["AGENT_DECLINED", "The agent declined this request", "Response received", false],
] as const;

test("tenant response presentation covers the complete authoritative state matrix", () => {
  const requestPage = readFileSync(requestPagePath, "utf8");

  assert.match(requestPage, /<TenantResponse state=\{data\.request\.state\}/);
  assert.match(requestPage, /function tenantResponsePresentation\(/);

  for (const [state, heading, badge, showDeadline] of acceptedPresentations) {
    const block = requestPage.match(
      new RegExp(`case "${state}":([\\s\\S]*?)(?=\\n    case "|\\n  })`),
    )?.[1];

    assert.ok(block, `missing explicit presentation branch for ${state}`);
    assert.ok(block.includes(heading), `missing response heading for ${state}`);
    assert.ok(block.includes(badge), `missing response badge for ${state}`);
    assert.ok(
      block.includes(`showDeadline: ${showDeadline}`),
      `incorrect deadline rule for ${state}`,
    );
  }
});

test("only an actionable slot proposal renders response deadline language", () => {
  const requestPage = readFileSync(requestPagePath, "utf8");

  assert.equal(requestPage.match(/showDeadline: true/g)?.length, 1);
  assert.equal(requestPage.match(/showDeadline: false/g)?.length, 4);
  assert.match(requestPage, /presentation\.showDeadline && expiresAt/);
  assert.match(requestPage, />Respond by</);
  assert.doesNotMatch(
    requestPage,
    /response\.kind === "SLOT_PROPOSAL" \? "Action needed" : "Response received"/,
  );
});

test("terminal response history does not broaden the tenant action boundary", () => {
  const requestPage = readFileSync(requestPagePath, "utf8");

  assert.match(requestPage, /data\.request\.state === "SLOT_PROPOSED" \? \(/);
  assert.match(requestPage, /There is no tenant action to take in this state\./);
  assert.match(requestPage, /response\.kind === "SLOT_PROPOSAL"/);
  assert.match(requestPage, /response\.kind === "AGENT_DECLINE"/);
});
