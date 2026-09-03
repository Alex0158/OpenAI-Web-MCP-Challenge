import assert from "node:assert/strict";
import { appendFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { followConnectorActivity } from "../src/activity-monitor.mjs";

test("activity monitor follows only new background Connector events", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-activity-monitor-"));
  const output = join(directory, "connector.log");
  const errors = join(directory, "connector-error.log");
  await writeFile(output, '{"event":"old_event"}\n');
  await writeFile(errors, "");
  const controller = new AbortController();
  const events = [];
  const following = followConnectorActivity({
    paths: [output, errors],
    signal: controller.signal,
    pollIntervalMs: 10,
    onEvent(event) {
      events.push(event);
      controller.abort();
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 25));
  await appendFile(output, '{"event":"connector_activation_result","outcome":"accepted"}\n');
  await following;

  assert.deepEqual(events, [{ event: "connector_activation_result", outcome: "accepted" }]);
  await rm(directory, { recursive: true, force: true });
});
