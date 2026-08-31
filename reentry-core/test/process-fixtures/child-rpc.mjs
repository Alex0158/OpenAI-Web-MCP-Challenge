export function serveChildRpc(handlers) {
  if (typeof process.send !== "function") {
    throw new Error("Process fixture requires an IPC channel");
  }

  process.on("message", (message) => {
    void handleMessage(handlers, message);
  });
}

async function handleMessage(handlers, message) {
  const id = message?.id;
  const command = message?.command;
  if (!Number.isSafeInteger(id) || typeof command !== "string") return;

  const handler = handlers[command];
  if (typeof handler !== "function") {
    send({ id, ok: false, error: { code: "fixture_command_unknown" } });
    return;
  }

  try {
    const result = await handler(message.payload);
    send({ id, ok: true, result }, command === "stop");
  } catch (error) {
    send({
      id,
      ok: false,
      error: {
        code: boundedCode(error?.code),
        statusCode: Number.isInteger(error?.statusCode) ? error.statusCode : undefined,
      },
    });
  }
}

function send(message, disconnect = false) {
  process.send(message, (error) => {
    if (error) process.exitCode = 1;
    if (disconnect && process.connected) process.disconnect();
  });
}

function boundedCode(value) {
  return typeof value === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(value)
    ? value
    : "fixture_command_failed";
}
