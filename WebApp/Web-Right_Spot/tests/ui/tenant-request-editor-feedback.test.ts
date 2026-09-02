import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const editorPath = resolve(process.cwd(), "src/ui/tenant/tenant-request-page.tsx");

test("preferred-time removal clears stale editor feedback without changing the row boundary", () => {
  const editor = readFileSync(editorPath, "utf8");
  const handlerStart = editor.indexOf("aria-label={`Remove preferred viewing time option ${index + 1}`}");
  const handlerEnd = editor.indexOf("</button>", handlerStart);
  assert.notEqual(handlerStart, -1);
  assert.notEqual(handlerEnd, -1);
  const removalControl = editor.slice(handlerStart, handlerEnd);

  assert.match(editor, /times\.length > 1 \?/);
  assert.match(removalControl, /onClick=\{\(\) => \{/);
  assert.match(removalControl, /setTimes\(times\.filter\(\(_, currentIndex\) => currentIndex !== index\)\)/);
  assert.match(removalControl, /setError\(null\)/);
  assert.match(removalControl, /onFeedbackChange\?\.\(null\)/);
  assert.match(removalControl, /aria-label=\{`Remove preferred viewing time option \$\{index \+ 1\}`\}/);
});

test("removal keeps the visible control and one-option boundary explicit", () => {
  const editor = readFileSync(editorPath, "utf8");

  assert.match(editor, /times\.length > 1 \?/);
  assert.match(editor, />\s*Remove\s*<\/button>/);
  assert.match(editor, /times\.length < 3 \?/);
});

test("mutation completion feedback is parent-owned across both tenant editor consumers", () => {
  const requestPage = readFileSync(editorPath, "utf8");
  const listingPage = readFileSync(resolve(process.cwd(), "src/ui/tenant/tenant-listing-page.tsx"), "utf8");
  const editorStart = requestPage.indexOf("export function TenantRequestEditor");
  const editor = requestPage.slice(editorStart);

  assert.match(requestPage, /onSaved: \(data: TenantRequestResponse, successMessage\?: string\) => void/);
  assert.match(requestPage, /onFeedbackChange\?: \(message: string \| null\) => void/);
  assert.match(requestPage, /onSaved\(response, "Draft saved from the server response\. Review it, then submit explicitly\."\)/);
  assert.match(requestPage, /onSaved\(response, "Viewing Request submitted from the server response\."\)/);
  assert.match(requestPage, /onFeedbackChange=\{setStatusMessage\}/);
  assert.doesNotMatch(editor, /const \[statusMessage, setStatusMessage\] = useState/);
  assert.doesNotMatch(editor, /\{statusMessage \? <div className=\{styles\.inlineSuccess\}/);

  assert.match(listingPage, /const \[requestStatusMessage, setRequestStatusMessage\] = useState/);
  assert.match(listingPage, /\{requestStatusMessage \? \([\s\S]*?<div className=\{styles\.inlineSuccess\}/);
  assert.match(listingPage, /function applyRequestData\(nextData: TenantRequestResponse, successMessage\?: string\)/);
  assert.match(listingPage, /onFeedbackChange=\{setRequestStatusMessage\}/);
});
