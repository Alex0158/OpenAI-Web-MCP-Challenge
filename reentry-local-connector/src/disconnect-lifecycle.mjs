export async function disconnectConnectorLifecycle(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Connector disconnection options are invalid");
  }
  if (typeof options.revokeRemote !== "function" || typeof options.clearLocal !== "function") {
    throw new TypeError("Connector disconnection operations are invalid");
  }

  const remote = options.credentials === null
    ? null
    : await options.revokeRemote(options.credentials);
  const local = await options.clearLocal();

  return Object.freeze({ remote, local });
}
