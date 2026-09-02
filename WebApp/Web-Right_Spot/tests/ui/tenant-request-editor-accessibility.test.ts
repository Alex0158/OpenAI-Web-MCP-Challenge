import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const editorPath = resolve(process.cwd(), "src/ui/tenant/tenant-request-page.tsx");

test("preferred-time removal controls identify their option number", () => {
  const editor = readFileSync(editorPath, "utf8");

  assert.match(editor, /<TenantRequestEditor/);
  assert.match(editor, /Option \{index \+ 1\}/);
  const controlStart = editor.indexOf("aria-label={`Remove preferred viewing time option ${index + 1}`}");
  const controlEnd = editor.indexOf("</button>", controlStart);
  assert.notEqual(controlStart, -1);
  assert.notEqual(controlEnd, -1);
  const removalControl = editor.slice(controlStart, controlEnd);

  assert.match(removalControl, /aria-label=\{`Remove preferred viewing time option \$\{index \+ 1\}`\}/);
  assert.match(removalControl, /onClick=\{\(\) => \{[\s\S]*setTimes\(times\.filter\(/);
  assert.match(editor, /<button[\s\S]*className="button button-quiet"[\s\S]*type="button"/);
});

test("the existing visible removal boundary remains bounded", () => {
  const editor = readFileSync(editorPath, "utf8");

  assert.match(editor, /times\.length > 1 \? /);
  assert.match(editor, />\s*Remove\s*<\/button>/);
  assert.doesNotMatch(editor, /Remove preferred viewing time option \{index \+ 1\}/);
});
