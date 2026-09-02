import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const PAGE_PATH = resolve(process.cwd(), "src/ui/agent/agent-request-page.tsx");

test("Agent stale-action recovery renders the authoritative detail without a false unavailable state", () => {
  const page = readFileSync(PAGE_PATH, "utf8");
  const recovery = page.slice(
    page.indexOf("async function handleMutationError"),
    page.indexOf("const hasPreparedResponse"),
  );

  assert.match(page, /const \[conflictNotice, setConflictNotice\] = useState<string \| null>\(null\);/);
  assert.match(page, /<StatusBanner tone="info" message=\{conflictNotice\} \/>/);
  assert.match(recovery, /const refreshed = await readAgentRequest\(requestId\);/);
  assert.match(recovery, /setDetail\(refreshed\);\s*setError\(null\);\s*setConflictNotice\(/);
  assert.doesNotMatch(recovery, /setNotice\(["`]The workflow changed before that action completed/);
});

test("Agent stale-action recovery keeps the failed-read boundary and clears old conflict feedback for a new action", () => {
  const page = readFileSync(PAGE_PATH, "utf8");
  const recovery = page.slice(
    page.indexOf("async function handleMutationError"),
    page.indexOf("const hasPreparedResponse"),
  );
  const startReview = page.slice(
    page.indexOf("async function handleStartReview"),
    page.indexOf("async function handlePrepare"),
  );
  const prepare = page.slice(
    page.indexOf("async function handlePrepare"),
    page.indexOf("async function handleSend"),
  );
  const send = page.slice(
    page.indexOf("async function handleSend"),
    page.indexOf("async function handleMutationError"),
  );

  assert.match(recovery, /catch \(refreshError: unknown\) \{[\s\S]*setConflictNotice\(null\);[\s\S]*setError\(/);
  assert.match(startReview, /setConflictNotice\(null\);[\s\S]*setMutation\("review"\)/);
  assert.match(prepare, /setConflictNotice\(null\);[\s\S]*setMutation\("prepare"\)/);
  assert.match(send, /setConflictNotice\(null\);[\s\S]*setMutation\("send"\)/);
});
