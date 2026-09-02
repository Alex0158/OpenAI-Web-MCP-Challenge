import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const requestPagePath = resolve(process.cwd(), "src/ui/tenant/tenant-request-page.tsx");

test("tenant request reads guard every async settlement by the latest read id", () => {
  const requestPage = readFileSync(requestPagePath, "utf8");
  const loadBody = requestPage.match(
    /function load\(message\?: string\) \{([\s\S]*?)\n  \}\n\n  useEffect/,
  )?.[1];

  assert.ok(loadBody, "missing tenant request load function");
  assert.match(requestPage, /useEffect, useRef, useState/);
  assert.match(requestPage, /const latestReadId = useRef\(0\);/);
  assert.match(loadBody, /const readId = \+\+latestReadId\.current;/);
  assert.equal(
    loadBody.match(/if \(readId !== latestReadId\.current\) return;/g)?.length,
    3,
    "then, catch, and finally must all ignore stale reads",
  );
});

test("server data acceptance invalidates an in-flight read", () => {
  const requestPage = readFileSync(requestPagePath, "utf8");
  const loadBody = requestPage.match(
    /function load\(message\?: string\) \{([\s\S]*?)\n  \}\n\n  useEffect/,
  )?.[1];
  const pageComponent = requestPage.match(
    /export default function TenantRequestPage\(\) \{([\s\S]*?)\n\}\n\ntype RequestDashboardProps/,
  )?.[1];
  const applyServerData = requestPage.match(
    /function applyServerData\(nextData: TenantRequestResponse\) \{([\s\S]*?)\n  \}/,
  )?.[1];

  assert.ok(pageComponent, "missing tenant request page component");
  assert.ok(loadBody, "missing tenant request load function");
  assert.ok(applyServerData, "missing parent-owned server data acceptance function");
  assert.match(applyServerData, /latestReadId\.current \+= 1;/);
  assert.match(applyServerData, /setIsLoading\(false\);/);
  assert.match(loadBody, /applyServerData\(nextData\);/);
  assert.doesNotMatch(loadBody, /setData\(nextData\);/);
  assert.equal(requestPage.match(/setData\(/g)?.length, 1, "server data must have one parent-owned writer");
  assert.match(requestPage, /const \[pendingDraftMutation, setPendingDraftMutation\] = useState\(false\);/);
  assert.match(pageComponent, /<RequestDashboard[\s\S]*?onSaved=\{applyServerData\}/);
  assert.match(pageComponent, /applyServerData\(response\);/);
});

test("tenant request Refresh cannot overlap a read or any mutation", () => {
  const requestPage = readFileSync(requestPagePath, "utf8");

  assert.match(
    requestPage,
    /disabled=\{isLoading \|\| pendingDraftMutation \|\| pendingResponse !== null\} onClick=\{\(\) => load\(\)\}/,
  );
  assert.match(requestPage, /onPendingChange=\{setPendingDraftMutation\}/);
  assert.match(requestPage, /onPendingChange\?: \(pending: boolean\) => void/);
  assert.match(requestPage, /onPendingChange\?\.\(true\)/);
  assert.match(requestPage, /onPendingChange\?\.\(false\)/);
});
