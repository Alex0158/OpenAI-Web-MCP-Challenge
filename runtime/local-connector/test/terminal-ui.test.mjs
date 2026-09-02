import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";

import { waitForEnterToOpenBrowser } from "../src/browser-prompt.mjs";
import { createTerminalUi } from "../src/terminal-ui.mjs";
import { chooseWorkspaceDirectory } from "../src/workspace-picker.mjs";

function sink(isTTY = true) {
  const chunks = [];
  return {
    stream: {
      isTTY,
      write(value) {
        chunks.push(value);
      },
    },
    text() {
      return chunks.join("");
    },
  };
}

test("interactive terminal UI renders the guided connector states", () => {
  const output = sink();
  const errors = sink();
  const ui = createTerminalUi({
    output: output.stream,
    errorOutput: errors.stream,
    interactive: true,
    color: false,
  });

  ui.begin("Start the Local Connector", "guided one-shot check");
  ui.section("1 OF 3", "System check");
  ui.success("Node.js", "24.0.0");
  ui.step("Approval page", "opening your browser");
  ui.wait("Waiting for approval…");
  ui.stopWait("Approval received", "the Receiver approved this Connector");
  ui.complete("You're all set", "Re-entry is waiting for approved work.");
  ui.next("re-entry status", "Check the connection at any time.");
  ui.error("Connector stopped", "example failure", "try again");
  ui.close();

  assert.match(output.text(), /____  _____/);
  assert.match(output.text(), /LOCAL CONNECTOR/);
  assert.match(output.text(), /1 OF 3  System check/);
  assert.match(output.text(), /✓  Node\.js  24\.0\.0/);
  assert.match(output.text(), /Approval page  opening your browser/);
  assert.match(output.text(), /Approval received  the Receiver approved this Connector/);
  assert.match(output.text(), /You're all set/);
  assert.match(output.text(), /\$ re-entry status/);
  assert.match(errors.text(), /✕  Connector stopped/);
  assert.match(errors.text(), /example failure/);
  assert.match(errors.text(), /NEXT/);
  assert.match(errors.text(), /try again/);
});
test("non-interactive terminal UI stays silent for JSON callers", () => {
  const output = sink(false);
  const errors = sink(false);
  const ui = createTerminalUi({
    output: output.stream,
    errorOutput: errors.stream,
    interactive: false,
  });

  ui.begin("ignored");
  ui.success("ignored");
  ui.wait("ignored");
  ui.stopWait("ignored");
  ui.error("ignored");
  ui.close();

  assert.equal(output.text(), "");
  assert.equal(errors.text(), "");
});

test("browser prompt waits for Enter before continuing", async () => {
  const input = new PassThrough();
  input.isTTY = true;
  const output = new PassThrough();
  let outputText = "";
  output.on("data", (chunk) => {
    outputText += chunk.toString();
  });

  const waiting = waitForEnterToOpenBrowser({ input, output });
  input.write("\n");
  await waiting;

  assert.match(outputText, /Press Enter to open Re-entry/);
  input.destroy();
  output.destroy();
});

test("workspace picker offers a small first-run menu and selects the current folder", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-workspace-picker-"));
  const child = join(directory, "project");
  await mkdir(child);
  const input = new PassThrough();
  input.isTTY = true;
  input.isRaw = false;
  input.setRawMode = (value) => { input.isRaw = value; };
  const output = sink();
  const selecting = chooseWorkspaceDirectory({
    input,
    output: output.stream,
    startDirectory: child,
    homeDirectory: directory,
  });

  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.match(output.text(), /LOCAL CONNECTOR/);
  assert.match(output.text(), /1 OF 3  WORKSPACE/);
  assert.match(output.text(), /Use current folder/);
  assert.doesNotMatch(output.text(), /Open project/);
  input.write("\r");

  assert.equal(await selecting, child);
  await rm(directory, { recursive: true, force: true });
  input.destroy();
});
