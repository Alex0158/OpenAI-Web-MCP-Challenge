import assert from "node:assert/strict";
import test from "node:test";

import { createTerminalUi } from "../src/terminal-ui.mjs";

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
  ui.success("Node.js", "24.0.0");
  ui.step("Approval page", "opening your browser");
  ui.wait("Waiting for approval…");
  ui.stopWait("Approval received", "the Receiver approved this Connector");
  ui.error("Connector stopped", "example failure", "try again");
  ui.close();

  assert.match(output.text(), /RE-ENTRY LOCAL CONNECTOR/);
  assert.match(output.text(), /✓ Node\.js  24\.0\.0/);
  assert.match(output.text(), /Approval page  opening your browser/);
  assert.match(output.text(), /Approval received  the Receiver approved this Connector/);
  assert.match(errors.text(), /✕ Connector stopped  example failure/);
  assert.match(errors.text(), /Next: try again/);
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
