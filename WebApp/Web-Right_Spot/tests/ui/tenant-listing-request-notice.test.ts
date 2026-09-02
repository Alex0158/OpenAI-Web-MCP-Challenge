import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const detailPath = resolve(process.cwd(), "src/ui/tenant/tenant-listing-page.tsx");

const acceptedNotices = [
  [
    "REQUEST_SUBMITTED",
    "Viewing Request already submitted",
    "The request has been sent to the property agent. Open the request dashboard to follow its status.",
  ],
  [
    "AGENT_REVIEWING",
    "Viewing Request is under review",
    "The property agent is reviewing this request. Open the request dashboard for the latest status.",
  ],
  [
    "SLOT_PROPOSED",
    "Viewing Request has a proposed viewing",
    "Review the proposed time and make your decision from the request dashboard.",
  ],
  [
    "VIEWING_CONFIRMED",
    "Viewing Request is confirmed",
    "The proposed viewing is confirmed. Open the request dashboard to review the completed request.",
  ],
  [
    "TENANT_DECLINED",
    "Viewing Request was declined by you",
    "You declined the proposed viewing. Open the request dashboard to review the completed request.",
  ],
  [
    "AGENT_DECLINED",
    "Viewing Request was declined by the agent",
    "The property agent declined this request. Open the request dashboard to review the response.",
  ],
  [
    "EXPIRED",
    "Viewing Request has expired",
    "The proposal deadline passed before a tenant decision. Open the request dashboard to review the completed request.",
  ],
] as const;

const acceptedCrossListingNotices = [
  [
    "TENANT_DRAFT",
    "Your saved draft is for another listing",
    "Open the request dashboard to review or edit that saved draft before choosing another home.",
  ],
  [
    "REQUEST_SUBMITTED|AGENT_REVIEWING|SLOT_PROPOSED",
    "Your active request is for another listing",
    "Open the request dashboard to review the existing home and its latest status.",
  ],
  [
    "VIEWING_CONFIRMED|TENANT_DECLINED|EXPIRED|AGENT_DECLINED",
    "Your recorded request is for another listing",
    "Open the request dashboard to review the existing home and its completed status.",
  ],
] as const;

test("listing detail has explicit truthful copy for every non-draft request state", () => {
  const detail = readFileSync(detailPath, "utf8");

  assert.doesNotMatch(detail, /This listing already has a \{formatState\(request\?\.state\)\} request/);
  assert.doesNotMatch(detail, /The submitted request is read-only here\./);
  assert.match(detail, /function requestNoticeForState\(state: ExistingRequestState\)/);
  assert.match(detail, /requestNoticeForState\(requestState\)/);

  for (const [state, heading, copy] of acceptedNotices) {
    assert.match(detail, new RegExp(`case "${state}"`));
    assert.ok(detail.includes(heading), `missing heading for ${state}`);
    assert.ok(detail.includes(copy), `missing supporting copy for ${state}`);
  }
});

test("listing detail preserves the existing request boundaries and dashboard handoff", () => {
  const detail = readFileSync(detailPath, "utf8");

  assert.match(detail, /requestTargetsAnotherListing/);
  assert.match(detail, /canEditDraft/);
  assert.match(detail, /<TenantRequestEditor/);
  assert.match(detail, /href="\/tenant\/requests"/);
  assert.match(detail, /Open request dashboard/);
});

test("cross-listing notice distinguishes draft, active, and terminal request states", () => {
  const detail = readFileSync(detailPath, "utf8");

  assert.match(detail, /requestTargetsAnotherListing/);
  assert.match(detail, /request\.state/);

  for (const [states, heading, copy] of acceptedCrossListingNotices) {
    for (const state of states.split("|")) {
      assert.match(detail, new RegExp(`case "${state}"`), `missing cross-listing state ${state}`);
    }
    assert.ok(detail.includes(heading), `missing cross-listing heading for ${states}`);
    assert.ok(detail.includes(copy), `missing cross-listing copy for ${states}`);
  }

  assert.doesNotMatch(
    detail,
    /requestTargetsAnotherListing[\s\S]*Your active request is for another listing[\s\S]*: null/,
    "cross-listing copy must not be unconditional",
  );
});
