import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  clearConnectorReauthorizationRequired,
  hasConnectorReauthorizationRequired,
  markConnectorReauthorizationRequired,
  reauthorizationMarkerPath,
} from "../src/credentials.mjs";

test("connector authorization status marks a rejected cloud credential and clears after reconnect", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-credential-status-"));
  const credentialFile = join(directory, "credentials.json");
  try {
    assert.equal(await hasConnectorReauthorizationRequired(credentialFile), false);
    await markConnectorReauthorizationRequired(credentialFile, {
      receiver_origin: "https://reentry-cloud.vercel.app",
    });
    assert.equal(await hasConnectorReauthorizationRequired(credentialFile), true);
    const marker = JSON.parse(await readFile(reauthorizationMarkerPath(credentialFile), "utf8"));
    assert.deepEqual(marker, {
      receiver_origin: "https://reentry-cloud.vercel.app",
      reason: "connector_identity_invalid",
      observed_at: marker.observed_at,
    });
    assert.equal(Number.isNaN(Date.parse(marker.observed_at)), false);
    await clearConnectorReauthorizationRequired(credentialFile);
    assert.equal(await hasConnectorReauthorizationRequired(credentialFile), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
