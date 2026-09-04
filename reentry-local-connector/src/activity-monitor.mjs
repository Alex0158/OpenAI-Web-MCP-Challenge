import { open, stat } from "node:fs/promises";

const MAX_LINE_BYTES = 16 * 1_024;
const MAX_READ_BYTES = 64 * 1_024;

/**
 * Follow new JSON events written by the installed background Connector.
 * The monitor starts at the end of each file and never starts another Connector poller.
 */
export async function followConnectorActivity(options) {
  requireOptions(options);
  const cursors = await Promise.all(options.paths.map(initializeCursor));
  const pollIntervalMs = options.pollIntervalMs ?? 350;
  if (!Number.isSafeInteger(pollIntervalMs) || pollIntervalMs < 10 || pollIntervalMs > 5_000) {
    throw new TypeError("Activity monitor poll interval is invalid");
  }

  while (!options.signal.aborted) {
    for (const cursor of cursors) {
      await readNewEvents(cursor, options.onEvent);
    }
    await waitForNextRead(pollIntervalMs, options.signal);
  }
}

async function initializeCursor(path) {
  try {
    const metadata = await stat(path);
    return { path, offset: metadata.size, pending: "" };
  } catch (error) {
    if (error?.code === "ENOENT") return { path, offset: 0, pending: "" };
    throw error;
  }
}

async function readNewEvents(cursor, onEvent) {
  let handle;
  try {
    handle = await open(cursor.path, "r");
    const metadata = await handle.stat();
    if (metadata.size < cursor.offset) {
      cursor.offset = 0;
      cursor.pending = "";
    }
    if (metadata.size === cursor.offset) return;
    const length = Math.min(metadata.size - cursor.offset, MAX_READ_BYTES);
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, cursor.offset);
    cursor.offset += bytesRead;
    const lines = `${cursor.pending}${buffer.subarray(0, bytesRead).toString("utf8")}`.split("\n");
    cursor.pending = lines.pop() ?? "";
    if (Buffer.byteLength(cursor.pending, "utf8") > MAX_LINE_BYTES) cursor.pending = "";
    for (const line of lines) {
      const event = parseEvent(line);
      if (event) await onEvent(event);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  } finally {
    await handle?.close();
  }
}

function parseEvent(line) {
  if (line.length === 0 || Buffer.byteLength(line, "utf8") > MAX_LINE_BYTES) return null;
  try {
    const value = JSON.parse(line);
    if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.event !== "string") {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function waitForNextRead(milliseconds, signal) {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, milliseconds);
    function done() {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    }
    signal.addEventListener("abort", done, { once: true });
  });
}

function requireOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Activity monitor options are required");
  }
  const fields = Object.keys(options);
  if (fields.some((field) => !["paths", "signal", "onEvent", "pollIntervalMs"].includes(field))) {
    throw new TypeError("Activity monitor options contain an unsupported field");
  }
  if (
    !Array.isArray(options.paths) ||
    options.paths.length !== 2 ||
    options.paths.some((path) => typeof path !== "string" || path.length === 0) ||
    !(options.signal instanceof AbortSignal) ||
    typeof options.onEvent !== "function"
  ) {
    throw new TypeError("Activity monitor options are invalid");
  }
}
