import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const entry = fileURLToPath(new URL("../src/main.mjs", import.meta.url));
const previewReceiver = "https://cloud-receiver-delta.vercel.app";

test("connect is idempotent for the one saved connection", async () => {
  await withCredential(async (credentialFile) => {
    const result = spawnSync(process.execPath, [
      entry,
      "connect",
      "--json",
      "--credential-file",
      credentialFile,
    ], { encoding: "utf8" });

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.deepEqual(JSON.parse(result.stdout), {
      event: "connector_already_connected",
      connector_id: "connector_existing",
      receiver_origin: previewReceiver,
    });
  });
});

test("connect refuses to replace an existing connection", async () => {
  await withCredential(async (credentialFile) => {
    const before = await readFile(credentialFile, "utf8");
    const result = spawnSync(process.execPath, [
      entry,
      "connect",
      "--json",
      "--receiver",
      "https://another-accepted-receiver.example",
      "--credential-file",
      credentialFile,
    ], { encoding: "utf8" });

    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.deepEqual(JSON.parse(result.stderr), {
      event: "local_connector_failed",
      code: "connector_account_already_connected",
      message: "connector_account_already_connected",
    });
    assert.equal(await readFile(credentialFile, "utf8"), before);
  });
});

async function withCredential(callback) {
  const directory = await mkdtemp(join(tmpdir(), "reentry-cli-lifecycle-"));
  const credentialFile = join(directory, "credentials.json");
  try {
    await writeFile(credentialFile, `${JSON.stringify({
      version: 1,
      receiver_origin: previewReceiver,
      connector_id: "connector_existing",
      connector_token: "A".repeat(43),
      connector_expires_at: "2099-01-01T00:00:00.000Z",
    })}\n`);
    await callback(credentialFile);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
