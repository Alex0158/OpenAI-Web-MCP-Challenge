import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const requestPagePath = resolve(process.cwd(), "src/ui/tenant/tenant-request-page.tsx");
const listingPagePath = resolve(process.cwd(), "src/ui/tenant/tenant-listing-page.tsx");

test("tenant conflict recovery is parent-owned and truthful", () => {
  const requestPage = readFileSync(requestPagePath, "utf8");
  const listingPage = readFileSync(listingPagePath, "utf8");

  assert.match(requestPage, /export type TenantRequestConflictNotice = \{/);
  assert.match(requestPage, /onConflictNotice: \(notice: TenantRequestConflictNotice\) => void/);
  assert.match(requestPage, /const refreshed = await readTenantRequest\(\);/);
  assert.match(requestPage, /onSaved\(refreshed\);/);
  assert.match(requestPage, /onConflictNotice\(\{\s*tone: "status",/);
  assert.match(requestPage, /The latest tenant view is shown; review it before trying again\./);
  assert.match(requestPage, /onConflictNotice\(\{\s*tone: "error",/);
  assert.match(requestPage, /latest tenant view could not be refreshed\. Reload this page before trying again\./);
  assert.doesNotMatch(requestPage, /The tenant view was refreshed; review it before trying again\./);

  assert.match(requestPage, /const \[conflictNotice, setConflictNotice\] = useState/);
  assert.match(requestPage, /onConflictNotice=\{setConflictNotice\}/);
  assert.match(requestPage, /conflictNotice\.tone/);
  assert.match(requestPage, /conflictNotice\.tone === "error" \? styles\.inlineError : styles\.inlineStatus/);
  assert.match(requestPage, /role=\{conflictNotice\.tone === "error" \? "alert" : "status"\}/);
  assert.match(requestPage, /setConflictNotice\(null\)/);

  const requestRender = requestPage.match(/return \([\s\S]*?<\/RolePageFrame>\n  \);/)?.[0];
  assert.ok(requestRender, "missing tenant request page render");
  assert.ok(
    requestRender.indexOf("{conflictNotice ?") < requestRender.indexOf("<RequestDashboard"),
    "conflict feedback must live outside the version-keyed dashboard editor",
  );

  assert.match(listingPage, /type TenantRequestConflictNotice/);
  assert.match(listingPage, /const \[requestNotice, setRequestNotice\] = useState/);
  assert.match(listingPage, /onConflictNotice=\{setRequestNotice\}/);
  assert.match(listingPage, /requestNotice\.tone/);
  assert.match(listingPage, /requestNotice\.tone === "error" \? styles\.inlineError : styles\.inlineStatus/);
  assert.match(listingPage, /role=\{requestNotice\.tone === "error" \? "alert" : "status"\}/);
  assert.match(listingPage, /setRequestNotice\(null\)/);
  assert.match(listingPage, /function applyRequestData\(nextData: TenantRequestResponse\)/);
  const applyRequestData = listingPage.match(
    /function applyRequestData\(nextData: TenantRequestResponse\) \{([\s\S]*?)\n  \}/,
  )?.[1];
  assert.ok(applyRequestData, "missing listing request data acceptance function");
  assert.match(applyRequestData, /setRequestData\(nextData\);/);
  assert.match(applyRequestData, /setRequestNotice\(null\);/);
  assert.match(listingPage, /onRequestData=\{applyRequestData\}/);

  const listingRender = listingPage.match(/return \([\s\S]*?<\/RolePageFrame>\n  \);/)?.[0];
  assert.ok(listingRender, "missing tenant listing page render");
  assert.ok(
    listingRender.indexOf("{requestNotice ?") < listingRender.indexOf("<ListingDetailContent"),
    "conflict feedback must live outside the version-keyed listing editor",
  );
});
