import { isAbsolute } from "node:path";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1"]);

export class CloudReceiverConfigurationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "CloudReceiverConfigurationError";
    this.code = code;
  }
}

export function readCloudReceiverProcessConfig(environment) {
  if (!environment || typeof environment !== "object") {
    throw configurationFailure(
      "cloud_receiver_environment_invalid",
      "Cloud Receiver environment is unavailable",
    );
  }

  const host = environment.CLOUD_RECEIVER_HOST ?? "127.0.0.1";
  if (!LOOPBACK_HOSTS.has(host)) {
    throw configurationFailure(
      "cloud_receiver_host_invalid",
      "Stage 1 Cloud Receiver host must be a literal loopback address",
    );
  }

  const portText = environment.CLOUD_RECEIVER_PORT ?? "8080";
  if (typeof portText !== "string" || !/^(?:0|[1-9][0-9]{0,4})$/.test(portText)) {
    throw configurationFailure(
      "cloud_receiver_port_invalid",
      "Cloud Receiver port must be an integer between 0 and 65535",
    );
  }
  const port = Number(portText);
  if (port > 65_535) {
    throw configurationFailure(
      "cloud_receiver_port_invalid",
      "Cloud Receiver port must be an integer between 0 and 65535",
    );
  }

  const compositionModule = environment.CLOUD_RECEIVER_COMPOSITION_MODULE;
  if (
    typeof compositionModule !== "string" ||
    compositionModule.length === 0 ||
    Buffer.byteLength(compositionModule, "utf8") > 4_096 ||
    compositionModule.includes("\0") ||
    !isAbsolute(compositionModule)
  ) {
    throw configurationFailure(
      "cloud_receiver_composition_invalid",
      "Cloud Receiver composition module must be an absolute local path",
    );
  }

  return Object.freeze({ host, port, compositionModule });
}

function configurationFailure(code, message) {
  return new CloudReceiverConfigurationError(code, message);
}
