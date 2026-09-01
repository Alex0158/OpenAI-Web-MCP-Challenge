import { randomBytes } from "node:crypto";
import { chmod, mkdir, open, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import process from "node:process";

import { createCloudReceiverService } from "./cloud-receiver-service.mjs";
import { createProductPreviewComposition } from "./product-preview-composition.mjs";

const host = "127.0.0.1";

await startPreview();

async function startPreview() {
  let service;
  try {
    const port = readPort(process.env.CLOUD_RECEIVER_PORT ?? "43224");
    const stateDirectory = requireStateDirectory(
      process.env.REENTRY_LOCAL_STATE_DIR ?? join(homedir(), ".reentry", "receiver-preview"),
    );
    await mkdir(stateDirectory, { recursive: true, mode: 0o700 });
    await chmod(stateDirectory, 0o700);
    const tokenSecret = await readOrCreateSecret(join(stateDirectory, "receiver.secret"));
    const composition = createProductPreviewComposition({
      receiverDatabasePath: join(stateDirectory, "receiver.sqlite"),
      pairingDatabasePath: join(stateDirectory, "host-keys.sqlite"),
      accountDatabasePath: join(stateDirectory, "accounts.sqlite"),
      productDatabasePath: join(stateDirectory, "product.sqlite"),
      tokenSecret,
    });
    service = createCloudReceiverService(composition);
    const address = await service.start({ host, port });
    printStarted(address.origin);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({
      event: "reentry_preview_start_failed",
      code: publicFailureCode(error),
    })}\n`);
    process.exitCode = 1;
    return;
  }

  let stopping = false;
  const stop = async (signal) => {
    if (stopping) return;
    stopping = true;
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
    try {
      await service.stop();
      process.stdout.write(`${JSON.stringify({ event: "reentry_preview_stopped", signal })}\n`);
    } catch {
      process.stderr.write('{"event":"reentry_preview_stop_failed","code":"preview_shutdown_failed"}\n');
      process.exitCode = 1;
    }
  };
  const onSigint = () => void stop("SIGINT");
  const onSigterm = () => void stop("SIGTERM");
  process.once("SIGINT", onSigint);
  process.once("SIGTERM", onSigterm);
}

async function readOrCreateSecret(filename) {
  try {
    const handle = await open(filename, "wx", 0o600);
    try {
      const value = randomBytes(32).toString("base64url");
      await handle.writeFile(`${value}\n`, "utf8");
      await handle.sync();
      return value;
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
  }
  await chmod(filename, 0o600);
  const value = (await readFile(filename, "utf8")).trim();
  if (!/^[A-Za-z0-9_-]{43}$/.test(value)) {
    const error = new Error("Local Receiver secret is invalid");
    error.code = "preview_secret_invalid";
    throw error;
  }
  return value;
}

function readPort(value) {
  if (typeof value !== "string" || !/^(?:0|[1-9][0-9]{0,4})$/.test(value)) {
    throw previewFailure("preview_port_invalid");
  }
  const port = Number(value);
  if (port > 65_535) throw previewFailure("preview_port_invalid");
  return port;
}

function requireStateDirectory(value) {
  if (
    typeof value !== "string" ||
    !isAbsolute(value) ||
    value.length > 4_096 ||
    value.includes("\0")
  ) {
    throw previewFailure("preview_state_directory_invalid");
  }
  return value;
}

function printStarted(origin) {
  if (process.stdout.isTTY) {
    process.stdout.write(`\n  RE-ENTRY CLOUD\n  ${origin}\n\n  Create an account, then run the Local Connector install once.\n  Press Ctrl-C to stop the local preview.\n\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify({ event: "reentry_preview_started", origin })}\n`);
}

function publicFailureCode(error) {
  if (error?.code === "EADDRINUSE") return "preview_port_in_use";
  return typeof error?.code === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(error.code)
    ? error.code
    : "preview_start_failed";
}

function previewFailure(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}
