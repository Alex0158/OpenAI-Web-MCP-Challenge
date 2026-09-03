import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { createNativeAppToolsClient } from "../src/native-client.mjs";

const CALLER = "private-fixture-caller";
const TARGET = "private-fixture-target";
const CATALOG = {
  tools: [
    { name: "read_thread", namespace: "fixture_app" },
    { name: "send_message_to_thread", namespace: "fixture_app" },
    { name: "unrelated_tool", namespace: "fixture_other" },
  ],
};
const payload = { thread: { id: TARGET, cwd: "/fixture/workspace" }, turns: [] };
const success = (value) => ({ success: true, contentItems: [{ type: "inputText", text: JSON.stringify(value) }] });

test("lazy narrow client uses the caller identity, live namespaces, bounded reads and one accepted send", async (t) => {
  const host = await fakeHost(t);
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
  assert.equal(host.connections, 0);
  assert.deepEqual(Object.keys(client), ["capabilities", "readTask", "sendProbe", "close"]);
  assert.equal(Object.isFrozen(client), true);
  const capabilities = await Promise.all([client.capabilities(), client.capabilities()]);
  assert.deepEqual(capabilities, [{ readTask: true, sendProbe: true }, { readTask: true, sendProbe: true }]);
  assert.deepEqual(await client.readTask(TARGET), payload);
  assert.deepEqual(await client.sendProbe(TARGET, "Inert fixture probe."), { reportedAccepted: true });
  assert.equal(host.connections, 1);
  assert.deepEqual(host.requests.map((request) => request.method), ["tools/list", "tools/call", "tools/call"]);
  assert.deepEqual(host.requests[0].params, { threadStartKind: "default" });
  const read = host.requests[1].params;
  assert.equal(read.threadId, CALLER);
  assert.equal(read.namespace, "fixture_app");
  assert.deepEqual(read.arguments, { threadId: TARGET, turnLimit: 3, includeOutputs: false, maxOutputCharsPerItem: 1_000 });
  const send = host.requests[2].params;
  assert.equal(send.tool, "send_message_to_thread");
  assert.equal(send.threadId, CALLER);
  assert.deepEqual(send.arguments, { threadId: TARGET, prompt: "Inert fixture probe." });
  assert.match(send.callId, /^reentry-probe-call-/u);
  assert.match(send.turnId, /^reentry-probe-turn-/u);
  assert.notEqual(send.callId, read.callId);
  client.close();
  client.close();
  await rejectsCode(client.capabilities(), "native_closed");
  assert.equal(fs.lstatSync(host.pipePath).isSocket(), true, "client close does not remove the host endpoint");
});

test("capabilities require an exact live name and namespace; missing capability cannot send", async (t) => {
  const host = await fakeHost(t, (request, socket) => {
    reply(socket, request, { tools: [{ name: "read_thread", namespace: "fixture_app" }, { name: "send_message_to_thread" }] });
  });
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
  assert.deepEqual(await client.capabilities(), { readTask: true, sendProbe: false });
  await rejectsCode(client.sendProbe(TARGET, "Inert fixture."), "native_tool_unavailable");
  assert.equal(host.requests.length, 1);
  client.close();
});

test("duplicate tool identities fail closed instead of selecting a namespace", async (t) => {
  const host = await fakeHost(t, (request, socket) => reply(socket, request, {
    tools: [{ name: "read_thread", namespace: "one" }, { name: "read_thread", namespace: "two" }],
  }));
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
  await rejectsCode(client.capabilities(), "native_invalid_catalog");
  await rejectsCode(client.readTask(TARGET), "native_invalid_catalog");
  assert.equal(host.connections, 1);
});

test("concurrent and subsequent sends cannot produce another native mutation", async (t) => {
  const host = await fakeHost(t);
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
  const first = client.sendProbe(TARGET, "Inert fixture.");
  await rejectsCode(client.sendProbe(TARGET, "Second fixture."), "native_probe_already_attempted");
  assert.deepEqual(await first, { reportedAccepted: true });
  await rejectsCode(client.sendProbe(TARGET, "Third fixture."), "native_probe_already_attempted");
  assert.equal(host.requests.filter((request) => request.params.tool === "send_message_to_thread").length, 1);
  client.close();
});

test("malformed inputs are rejected before connecting", async (t) => {
  const host = await fakeHost(t);
  for (const configuration of [
    { pipePath: "relative" }, { callerId: " " }, { callerId: "bad\ncaller" },
    { timeoutMs: 0 }, { timeoutMs: Infinity }, { timeoutMs: 30_001 }, { maxFrameBytes: 127 },
  ]) {
    assert.throws(() => createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER, ...configuration }),
      { code: "native_invalid_configuration" });
  }
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
  await rejectsCode(client.readTask("other\ntask"), "native_invalid_input");
  for (const prompt of ["", "\r", "x".repeat(16_385), { prompt: "not text" }]) {
    await rejectsCode(client.sendProbe(TARGET, prompt), "native_invalid_input");
  }
  assert.equal(host.connections, 0);
  client.close();
});

test("endpoint type, ownership, permissions, symlink and parent controls fail before native calls", async (t) => {
  for (const mode of [0o660, 0o644, 0o777]) {
    await t.test(`socket mode ${mode.toString(8)}`, async (caseTest) => {
      const host = await fakeHost(caseTest);
      fs.chmodSync(host.pipePath, mode);
      const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
      await rejectsCode(client.capabilities(), "native_unsafe_endpoint");
      assert.equal(host.connections, 0);
    });
  }
  await t.test("wrong endpoint UID", async (caseTest) => {
    const host = await fakeHost(caseTest);
    const original = fs.lstatSync;
    const mock = caseTest.mock.method(fs, "lstatSync", (filename, ...args) => {
      const stat = original(filename, ...args);
      if (filename === host.pipePath) stat.uid = process.getuid() + 1;
      return stat;
    });
    const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
    await rejectsCode(client.capabilities(), "native_unsafe_endpoint");
    assert.equal(host.connections, 0);
    mock.mock.restore();
  });
  await t.test("endpoint symlink", async (caseTest) => {
    const host = await fakeHost(caseTest);
    const link = path.join(host.directory, "alias.sock");
    fs.symlinkSync(host.pipePath, link);
    host.ownedFiles.push(link);
    const client = createNativeAppToolsClient({ pipePath: link, callerId: CALLER });
    await rejectsCode(client.capabilities(), "native_unsafe_endpoint");
    assert.equal(host.connections, 0);
  });
  await t.test("regular file", async (caseTest) => {
    const host = await fakeHost(caseTest);
    const file = path.join(host.directory, "not-socket");
    fs.closeSync(fs.openSync(file, "wx", 0o600));
    host.ownedFiles.push(file);
    const client = createNativeAppToolsClient({ pipePath: file, callerId: CALLER });
    await rejectsCode(client.capabilities(), "native_unsafe_endpoint");
    assert.equal(host.connections, 0);
  });
  await t.test("non-sticky shared parent", async (caseTest) => {
    const host = await fakeHost(caseTest);
    fs.chmodSync(host.directory, 0o777);
    const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
    await rejectsCode(client.capabilities(), "native_unsafe_endpoint");
    assert.equal(host.connections, 0);
  });
});

test("trusted sticky parent is supported without changing endpoint permissions", async (t) => {
  const host = await fakeHost(t);
  fs.chmodSync(host.directory, 0o1777);
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
  assert.deepEqual(await client.capabilities(), { readTask: true, sendProbe: true });
  assert.equal(fs.lstatSync(host.pipePath).mode & 0o7777, 0o600);
  client.close();
});

test("connection uses the validated canonical endpoint rather than its parent alias", async (t) => {
  const host = await fakeHost(t);
  const alias = path.join(host.directory, "parent-alias");
  fs.symlinkSync(host.directory, alias);
  host.ownedFiles.push(alias);
  const aliasedPipe = path.join(alias, "native.sock");
  const canonicalPipe = fs.realpathSync(aliasedPipe);
  const original = net.createConnection;
  const mock = t.mock.method(net, "createConnection", (...args) => original(...args));
  const client = createNativeAppToolsClient({ pipePath: aliasedPipe, callerId: CALLER });
  assert.deepEqual(await client.capabilities(), { readTask: true, sendProbe: true });
  assert.equal(mock.mock.callCount(), 1);
  assert.equal(mock.mock.calls[0].arguments[0], canonicalPipe);
  assert.notEqual(mock.mock.calls[0].arguments[0], aliasedPipe);
  client.close();
  mock.mock.restore();
});

test("endpoint metadata is checked again after connection, before any request", async (t) => {
  const host = await fakeHost(t);
  const resolved = fs.realpathSync(host.pipePath);
  const original = fs.lstatSync;
  let endpointChecks = 0;
  const mock = t.mock.method(fs, "lstatSync", (filename, ...args) => {
    const stat = original(filename, ...args);
    if (filename === host.pipePath || filename === resolved) {
      endpointChecks += 1;
      if (endpointChecks > 2) stat.ino += 1;
    }
    return stat;
  });
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
  await rejectsCode(client.capabilities(), "native_endpoint_changed");
  assert.equal(host.requests.length, 0);
  mock.mock.restore();
});

test("fragmented frames and canonical string response IDs are accepted", async (t) => {
  const host = await fakeHost(t, (request, socket) => {
    const bytes = frame({ jsonrpc: "2.0", id: String(request.id), result: CATALOG });
    socket.write(bytes.subarray(0, 2));
    setImmediate(() => socket.write(bytes.subarray(2, 7)));
    setTimeout(() => socket.write(bytes.subarray(7)), 5);
  });
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
  assert.deepEqual(await client.capabilities(), { readTask: true, sendProbe: true });
  client.close();
});

test("wrong IDs, malformed envelopes and invalid frames terminate without reconnect", async (t) => {
  const cases = [
    ["wrong ID", (request) => frame({ jsonrpc: "2.0", id: request.id + 1, result: CATALOG }), "native_invalid_response"],
    ["non-canonical ID", () => frame({ jsonrpc: "2.0", id: "01", result: CATALOG }), "native_invalid_response"],
    ["missing version", (request) => frame({ id: request.id, result: CATALOG }), "native_invalid_response"],
    ["both result and error", (request) => frame({ jsonrpc: "2.0", id: request.id, result: CATALOG, error: {} }), "native_invalid_response"],
    ["null envelope", () => frame(null), "native_invalid_response"],
    ["bad JSON", () => rawFrame(Buffer.from("{")), "native_invalid_response"],
    ["invalid UTF-8", () => rawFrame(Buffer.from([0xff])), "native_invalid_response"],
    ["empty frame", () => Buffer.alloc(4), "native_invalid_response"],
    ["oversized frame", () => { const bytes = Buffer.alloc(4); bytes.writeUInt32LE(1_048_577); return bytes; }, "native_frame_too_large"],
  ];
  for (const [name, makeResponse, code] of cases) {
    await t.test(name, async (caseTest) => {
      const host = await fakeHost(caseTest, (request, socket) => socket.write(makeResponse(request)));
      const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
      await rejectsCode(client.capabilities(), code);
      await rejectsCode(client.capabilities(), code);
      assert.equal(host.connections, 1);
      assert.equal(host.requests.length, 1);
    });
  }
});

test("response loss after send is terminal and never resubmits", async (t) => {
  const host = await fakeHost(t, (request, socket) => {
    if (request.method === "tools/list") reply(socket, request, CATALOG);
  });
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER, timeoutMs: 30 });
  await rejectsCode(client.sendProbe(TARGET, "Inert fixture."), "native_timeout");
  await rejectsCode(client.sendProbe(TARGET, "Must not resend."), "native_timeout");
  assert.equal(host.requests.length, 2);
  assert.equal(host.connections, 1);
});

test("a native disconnect after submission is unknown to the caller and cannot reconnect", async (t) => {
  const host = await fakeHost(t, (request, socket) => {
    if (request.method === "tools/list") reply(socket, request, CATALOG);
    else socket.destroy();
  });
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
  await rejectsCode(client.sendProbe(TARGET, "Inert fixture."), "native_connection_closed");
  await rejectsCode(client.readTask(TARGET), "native_connection_closed");
  assert.equal(host.requests.length, 2);
  assert.equal(host.connections, 1);
});

test("an oversized outgoing frame closes before the native tool call is written", async (t) => {
  const host = await fakeHost(t, (request, socket) => reply(socket, request, {
    tools: [{ name: "send_message_to_thread", namespace: "fixture_app" }],
  }));
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER, maxFrameBytes: 256 });
  await rejectsCode(client.sendProbe(TARGET, "x".repeat(256)), "native_request_too_large");
  assert.equal(host.requests.length, 1);
  await rejectsCode(client.capabilities(), "native_request_too_large");
});

test("connect timeout is bounded and permanently disables reconnect", async (t) => {
  const host = await fakeHost(t);
  const mock = t.mock.method(net, "createConnection", () => new net.Socket());
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER, timeoutMs: 20 });
  await rejectsCode(client.capabilities(), "native_timeout");
  await rejectsCode(client.capabilities(), "native_timeout");
  assert.equal(mock.mock.callCount(), 1);
  mock.mock.restore();
});

test("native error text and failure content are never included in sanitized errors", async (t) => {
  for (const [name, response, expected] of [
    ["RPC error", { error: { code: 99, message: `${CALLER} ${TARGET} secret-native-detail` } }, "native_remote_error"],
    ["tool failure", { result: { success: false, contentItems: [{ type: "inputText", text: `${TARGET} secret-native-detail` }] } }, "native_tool_failed"],
  ]) {
    await t.test(name, async (caseTest) => {
      const host = await fakeHost(caseTest, (request, socket) => {
        if (request.method === "tools/list") return reply(socket, request, CATALOG);
        socket.write(frame({ jsonrpc: "2.0", id: request.id, ...response }));
      });
      const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
      await assert.rejects(client.sendProbe(TARGET, "Inert fixture."), (error) => {
        assert.equal(error.code, expected);
        for (const sensitive of [CALLER, TARGET, host.pipePath, "secret-native-detail"]) {
          assert.equal(`${error.message} ${error.stack} ${JSON.stringify(error)}`.includes(sensitive), false);
        }
        return true;
      });
      await rejectsCode(client.capabilities(), expected);
      assert.equal(host.connections, 1);
    });
  }
});

test("readTask requires a single JSON object text response, without forwarding malformed content", async (t) => {
  for (const contentItems of [
    [], [{ type: "inputText", text: "not JSON" }], [{ type: "inputText", text: "[]" }],
    [{ type: "inputImage", imageUrl: "data:image/png;base64,fixture" }],
    [{ type: "inputText", text: "{}" }, { type: "inputText", text: "{}" }],
  ]) {
    await t.test(`invalid shape ${JSON.stringify(contentItems).slice(0, 60)}`, async (caseTest) => {
      const host = await fakeHost(caseTest, (request, socket) => reply(socket, request,
        request.method === "tools/list" ? CATALOG : { success: true, contentItems }));
      const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
      await rejectsCode(client.readTask(TARGET), "native_invalid_task_response");
      await rejectsCode(client.readTask(TARGET), "native_invalid_task_response");
      assert.equal(host.connections, 1);
    });
  }
});

test("native success with an unrecognized content variant is not accepted", async (t) => {
  const host = await fakeHost(t, (request, socket) => reply(socket, request,
    request.method === "tools/list" ? CATALOG : {
      success: true, contentItems: [{ type: "__proto__", "[object Object]": "not a content variant" }],
    }));
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
  await rejectsCode(client.sendProbe(TARGET, "Inert fixture."), "native_invalid_response");
  assert.equal(host.requests.length, 2);
});

test("a malformed coalesced extra response cannot become reported acceptance", async (t) => {
  const host = await fakeHost(t, (request, socket) => {
    if (request.method === "tools/list") return reply(socket, request, CATALOG);
    socket.write(Buffer.concat([
      frame({ jsonrpc: "2.0", id: request.id, result: success({}) }),
      frame({ jsonrpc: "2.0", id: request.id + 1, result: success({}) }),
    ]));
  });
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
  await rejectsCode(client.sendProbe(TARGET, "Inert fixture."), "native_invalid_response");
  await rejectsCode(client.sendProbe(TARGET, "No resend."), "native_invalid_response");
  assert.equal(host.requests.length, 2);
});

test("closing in-flight work hard-closes only the client connection", async (t) => {
  const host = await fakeHost(t, () => {});
  const client = createNativeAppToolsClient({ pipePath: host.pipePath, callerId: CALLER });
  const operation = client.capabilities();
  setImmediate(() => client.close());
  await rejectsCode(operation, "native_closed");
  assert.equal(fs.lstatSync(host.pipePath).isSocket(), true);
  await rejectsCode(client.capabilities(), "native_closed");
});

async function rejectsCode(operation, code) {
  await assert.rejects(operation, (error) => {
    assert.equal(error.name, "NativeAppToolsError");
    assert.equal(error.code, code);
    assert.equal(error.message, code);
    return true;
  });
}

function frame(value) {
  return rawFrame(Buffer.from(JSON.stringify(value), "utf8"));
}

function rawFrame(body) {
  const bytes = Buffer.alloc(body.length + 4);
  bytes.writeUInt32LE(body.length);
  body.copy(bytes, 4);
  return bytes;
}

function reply(socket, request, result) {
  socket.write(frame({ jsonrpc: "2.0", id: request.id, result }));
}

async function fakeHost(t, handler = (request, socket) => {
  reply(socket, request, request.method === "tools/list" ? CATALOG : success(payload));
}) {
  // Only this test's freshly created fixtures are cleaned up; no app-owned pipe is opened.
  const directory = fs.mkdtempSync("/tmp/reentry-native-");
  const pipePath = path.join(directory, "native.sock");
  const requests = [];
  const sockets = new Set();
  const ownedFiles = [];
  let connections = 0;
  const server = net.createServer((socket) => {
    connections += 1;
    sockets.add(socket);
    socket.on("error", () => {});
    socket.on("close", () => sockets.delete(socket));
    let buffer = Buffer.alloc(0);
    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 4 && buffer.length >= 4 + buffer.readUInt32LE(0)) {
        const length = buffer.readUInt32LE(0);
        const request = JSON.parse(buffer.subarray(4, 4 + length).toString("utf8"));
        buffer = buffer.subarray(4 + length);
        requests.push(request);
        handler(request, socket);
      }
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(pipePath, resolve);
  });
  fs.chmodSync(pipePath, 0o600);
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise((resolve) => server.close(resolve));
    for (const filename of ownedFiles) fs.unlinkSync(filename);
    fs.rmdirSync(directory);
  });
  return { directory, pipePath, requests, ownedFiles, get connections() { return connections; } };
}
