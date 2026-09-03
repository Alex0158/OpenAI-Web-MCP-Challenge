import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const HOST = process.env.CP02_HOST ?? "127.0.0.1";
const PORT = Number(process.env.CP02_PORT ?? 8787);
const dataFile = resolve(process.env.CP02_DATA_FILE ?? join(process.cwd(), "probe-data.sqlite"));
const publicDir = resolve(new URL("./public", import.meta.url).pathname);

mkdirSync(dirname(dataFile), { recursive: true });
const db = new DatabaseSync(dataFile);
db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;");
db.exec(`
  CREATE TABLE IF NOT EXISTS probe_events (
    event_id TEXT PRIMARY KEY,
    command_id TEXT NOT NULL,
    command_type TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    payload_json TEXT NOT NULL,
    world_time INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const sockets = new Set();
let server;
let shuttingDown = false;

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function state() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM probe_events").get().count;
  const last = db.prepare(
    "SELECT event_id, command_id, command_type, idempotency_key, world_time FROM probe_events ORDER BY rowid DESC LIMIT 1",
  ).get();
  return {
    type: "snapshot",
    snapshot_id: `probe-snapshot-${count}`,
    world_time: Math.floor(Date.now() / 1000),
    probe_event_count: Number(count),
    last_event: last ?? null,
  };
}

function commandResult(command) {
  if (!command || typeof command !== "object") {
    return { ok: false, failure: { code: "INVALID_COMMAND", message: "A JSON object is required." } };
  }
  const commandId = typeof command.command_id === "string" ? command.command_id : "";
  const commandType = typeof command.command_type === "string" ? command.command_type : "";
  const idempotencyKey = typeof command.idempotency_key === "string" ? command.idempotency_key : "";
  if (!commandId || !commandType || !idempotencyKey) {
    return { ok: false, failure: { code: "INVALID_COMMAND", message: "command_id, command_type, and idempotency_key are required." } };
  }

  const existing = db.prepare(
    "SELECT event_id, command_id, command_type, idempotency_key, world_time FROM probe_events WHERE idempotency_key = ?",
  ).get(idempotencyKey);
  if (existing) {
    return { ok: true, duplicate: true, event: existing, snapshot: state() };
  }

  const event = {
    event_id: `probe-event-${randomUUID()}`,
    command_id: commandId,
    command_type: commandType,
    idempotency_key: idempotencyKey,
    payload_json: JSON.stringify(command.typed_arguments ?? command.payload ?? {}),
    world_time: Math.floor(Date.now() / 1000),
    created_at: new Date().toISOString(),
  };
  db.prepare(`
    INSERT INTO probe_events
      (event_id, command_id, command_type, idempotency_key, payload_json, world_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.event_id,
    event.command_id,
    event.command_type,
    event.idempotency_key,
    event.payload_json,
    event.world_time,
    event.created_at,
  );
  return {
    ok: true,
    duplicate: false,
    event: {
      event_id: event.event_id,
      command_id: event.command_id,
      command_type: event.command_type,
      idempotency_key: event.idempotency_key,
      world_time: event.world_time,
    },
    snapshot: state(),
  };
}

function frame(payload, opcode = 0x1) {
  const body = Buffer.from(payload);
  if (body.length < 126) return Buffer.concat([Buffer.from([0x80 | opcode, body.length]), body]);
  if (body.length <= 0xffff) {
    const header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(body.length, 2);
    return Buffer.concat([header, body]);
  }
  const header = Buffer.alloc(10);
  header[0] = 0x80 | opcode;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(body.length), 2);
  return Buffer.concat([header, body]);
}

function send(socket, value) {
  if (!socket.destroyed) socket.write(frame(JSON.stringify(value)));
}

function parseFrames(socket, chunk) {
  socket._cp02Buffer = Buffer.concat([socket._cp02Buffer ?? Buffer.alloc(0), chunk]);
  const messages = [];
  while (socket._cp02Buffer.length >= 2) {
    const first = socket._cp02Buffer[0];
    const second = socket._cp02Buffer[1];
    const opcode = first & 0x0f;
    const masked = Boolean(second & 0x80);
    let length = second & 0x7f;
    let offset = 2;
    if (length === 126) {
      if (socket._cp02Buffer.length < 4) break;
      length = socket._cp02Buffer.readUInt16BE(2);
      offset = 4;
    } else if (length === 127) {
      if (socket._cp02Buffer.length < 10) break;
      const large = socket._cp02Buffer.readBigUInt64BE(2);
      if (large > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Frame too large.");
      length = Number(large);
      offset = 10;
    }
    const maskOffset = masked ? 4 : 0;
    const frameEnd = offset + maskOffset + length;
    if (socket._cp02Buffer.length < frameEnd) break;
    let payload = socket._cp02Buffer.subarray(offset + maskOffset, frameEnd);
    if (masked) {
      const mask = socket._cp02Buffer.subarray(offset, offset + 4);
      payload = Buffer.from(payload);
      for (let index = 0; index < payload.length; index += 1) payload[index] ^= mask[index % 4];
    }
    socket._cp02Buffer = socket._cp02Buffer.subarray(frameEnd);
    messages.push({ opcode, payload });
  }
  return messages;
}

function acceptWebSocket(req, socket) {
  const key = req.headers["sec-websocket-key"];
  if (typeof key !== "string") {
    socket.destroy();
    return;
  }
  const accept = createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");
  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
  );
  sockets.add(socket);
  send(socket, state());
  socket.on("data", (chunk) => {
    try {
      for (const message of parseFrames(socket, chunk)) {
        if (message.opcode === 0x8) {
          socket.write(frame(message.payload, 0x8));
          socket.end();
          continue;
        }
        if (message.opcode === 0x9) {
          socket.write(frame(message.payload, 0xA));
          continue;
        }
        if (message.opcode !== 0x1) continue;
        let command;
        try {
          command = JSON.parse(message.payload.toString("utf8"));
        } catch {
          send(socket, { type: "command_result", ok: false, failure: { code: "INVALID_JSON" } });
          continue;
        }
        send(socket, { type: "command_result", ...commandResult(command) });
      }
    } catch (error) {
      send(socket, { type: "command_result", ok: false, failure: { code: "FRAME_ERROR", message: error.message } });
      socket.destroy();
    }
  });
  socket.on("close", () => sockets.delete(socket));
  socket.on("error", () => sockets.delete(socket));
}

async function handleRequest(req, res) {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, { ok: true, service: "cp02-probe", pid: process.pid, node: process.version });
    return;
  }
  if (req.method === "GET" && url.pathname === "/probe/read") {
    const journal = db.prepare("PRAGMA journal_mode").get();
    const events = db.prepare(
      "SELECT event_id, command_id, command_type, idempotency_key, world_time FROM probe_events ORDER BY rowid",
    ).all();
    json(res, 200, {
      ok: true,
      journal_mode: String(journal.journal_mode).toLowerCase(),
      synchronous: db.prepare("PRAGMA synchronous").get().synchronous,
      event_count: events.length,
      events,
    });
    return;
  }
  if (req.method === "POST" && url.pathname === "/command") {
    try {
      const command = JSON.parse(await readBody(req));
      json(res, 200, { type: "command_result", ...commandResult(command) });
    } catch (error) {
      json(res, 400, { ok: false, failure: { code: "INVALID_JSON", message: error.message } });
    }
    return;
  }
  if (req.method === "POST" && url.pathname === "/shutdown") {
    json(res, 202, { ok: true, shutting_down: true });
    setImmediate(shutdown);
    return;
  }
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    const body = await readFile(join(publicDir, "index.html"));
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(body);
    return;
  }
  json(res, 404, { ok: false, failure: { code: "NOT_FOUND" } });
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const socket of sockets) socket.end(frame("", 0x8));
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

server = createServer((req, res) => {
  handleRequest(req, res).catch((error) => json(res, 500, { ok: false, failure: { code: "INTERNAL_ERROR", message: error.message } }));
});
server.on("upgrade", (req, socket) => {
  if (req.url !== "/realtime" || String(req.headers.upgrade).toLowerCase() !== "websocket") {
    socket.destroy();
    return;
  }
  acceptWebSocket(req, socket);
});
server.listen(PORT, HOST, () => {
  const address = server.address();
  process.stdout.write(`CP02_READY ${JSON.stringify({ host: HOST, port: address.port, pid: process.pid, node: process.version, data_file: dataFile })}\n`);
});
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
