/**
 * @deprecated Historical loopback entry point. Do not use for new integrations or production.
 */
import { pathToFileURL } from "node:url";
import process from "node:process";

import { createCloudReceiverService } from "./cloud-receiver-service.mjs";
import {
  CloudReceiverConfigurationError,
  readCloudReceiverProcessConfig,
} from "./process-config.mjs";

await startProcess();

async function startProcess() {
  let composition;
  let service;
  try {
    const configuration = readCloudReceiverProcessConfig(process.env);
    const compositionModule = await import(pathToFileURL(configuration.compositionModule).href);
    if (typeof compositionModule.createCloudReceiverComposition !== "function") {
      throw new TypeError("Cloud Receiver composition module is missing its factory");
    }
    composition = await compositionModule.createCloudReceiverComposition();
    service = createCloudReceiverService(composition);
    const address = await service.start({
      host: configuration.host,
      port: configuration.port,
    });
    writeLog({
      event: "cloud_receiver_started",
      host: address.host,
      port: address.port,
      profile: "stage1_loopback",
    });
  } catch (error) {
    if (service === undefined && typeof composition?.close === "function") {
      try {
        await composition.close();
      } catch {
        // The public startup result remains one bounded failure code.
      }
    }
    writeError({ event: "cloud_receiver_start_failed", code: startupFailureCode(error) });
    process.exitCode = 1;
    return;
  }

  let stopping = false;
  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
    try {
      await service.stop();
      writeLog({ event: "cloud_receiver_stopped", signal });
    } catch {
      writeError({
        event: "cloud_receiver_stop_failed",
        code: "cloud_receiver_shutdown_failed",
      });
      process.exitCode = 1;
    }
  };
  const onSigint = () => void shutdown("SIGINT");
  const onSigterm = () => void shutdown("SIGTERM");
  process.once("SIGINT", onSigint);
  process.once("SIGTERM", onSigterm);
}

function startupFailureCode(error) {
  if (error instanceof CloudReceiverConfigurationError) return error.code;
  if (error?.code === "EADDRINUSE" || error?.code === "EACCES") {
    return "cloud_receiver_listen_failed";
  }
  return "cloud_receiver_start_failed";
}

function writeLog(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function writeError(value) {
  process.stderr.write(`${JSON.stringify(value)}\n`);
}
