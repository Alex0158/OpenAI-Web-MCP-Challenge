import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { clearTestAccounts } from "../../../test/helper";
import { prisma } from "../../../db";

type JsonBody = Record<string, unknown>;

type HttpResult = {
  status: number;
  body: JsonBody;
  headers: Headers;
};

type PairingRow = {
  pairing_code_digest: string;
  consumed_at: Date | null;
};

type ConnectorRow = {
  connector_id: string;
  delivery_target_id: string;
  connector_token_digest: string;
  device_name: string;
};

const backendDirectory = path.resolve(__dirname, "../../../../");
const serverPort = 4014;
const serverBaseUrl = `http://127.0.0.1:${serverPort}`;
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const userEmail = `pairing-restart-${suffix}@example.com`;
const password = "correct horse battery staple";

let receiver: ChildProcess | null = null;
let receiverLogs = "";

function startReceiver(): void {
  if (receiver) {
    throw new Error("Cloud Receiver process is already running");
  }

  const child = spawn(process.execPath, [path.join(backendDirectory, "dist/index.js")], {
    cwd: backendDirectory,
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(serverPort),
      FRONTEND_URL: "http://localhost:3000",
      CLOUD_RECEIVER_RUNTIME_DATABASE_URL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (chunk: Buffer | string) => {
    receiverLogs += chunk.toString();
  });
  child.stderr?.on("data", (chunk: Buffer | string) => {
    receiverLogs += chunk.toString();
  });

  receiver = child;
}

async function stopReceiver(): Promise<void> {
  const child = receiver;
  receiver = null;

  if (!child) {
    return;
  }

  if (child.exitCode !== null) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      settle(new Error("Cloud Receiver did not stop after SIGTERM"));
    }, 10_000);

    const settle = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    child.once("error", (error) => settle(error));
    child.once("exit", () => settle());
    child.kill("SIGTERM");
  });
}

async function waitForLive(): Promise<void> {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${serverBaseUrl}/health/live`);
      await response.text();
      if (response.ok) {
        return;
      }
    } catch {
      // The process may still be starting. Retry until the bounded deadline.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("Cloud Receiver did not become live within the test deadline");
}

async function postJson(
  route: string,
  body: JsonBody,
  headers: Record<string, string> = {}
): Promise<HttpResult> {
  const response = await fetch(`${serverBaseUrl}${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();

  let bodyValue: unknown = {};
  try {
    bodyValue = text.length > 0 ? JSON.parse(text) : {};
  } catch {
    bodyValue = {};
  }

  return {
    status: response.status,
    body:
      bodyValue && typeof bodyValue === "object" && !Array.isArray(bodyValue)
        ? (bodyValue as JsonBody)
        : {},
    headers: response.headers,
  };
}

function expectExactKeys(value: JsonBody, keys: string[]): void {
  expect(Object.keys(value).sort()).toEqual([...keys].sort());
}

function readUserCookie(headers: Headers): string {
  const setCookie = headers.get("set-cookie");
  const cookie = setCookie?.split(";", 1)[0] ?? "";

  // Keep the JWT out of assertion output and logs; only its cookie name is
  // needed to establish the browser-side account boundary.
  expect(cookie.startsWith("user_session=")).toBe(true);
  return cookie;
}

async function readPairing(pairingId: string): Promise<PairingRow> {
  const rows = await prisma.$queryRaw<PairingRow[]>`
    SELECT "pairing_code_digest", "consumed_at"
    FROM "cr2_pairing_sessions"
    WHERE "pairing_id" = ${pairingId}
  `;
  expect(rows).toHaveLength(1);
  return rows[0];
}

async function readConnector(connectorId: string): Promise<ConnectorRow> {
  const rows = await prisma.$queryRaw<ConnectorRow[]>`
    SELECT "connector_id", "delivery_target_id", "connector_token_digest", "device_name"
    FROM "cr2_connectors"
    WHERE "connector_id" = ${connectorId}
  `;
  expect(rows).toHaveLength(1);
  return rows[0];
}

async function countConnectorForPairing(pairingId: string): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM "cr2_connectors"
    WHERE "pairing_id" = ${pairingId}
  `;
  return Number(rows[0]?.count ?? 0);
}

describe("Cloud Receiver v2 pairing restart evidence", () => {
  beforeAll(async () => {
    await clearTestAccounts(userEmail);
    receiverLogs = "";
    startReceiver();
    await waitForLive();
  });

  afterAll(async () => {
    await stopReceiver();
    await clearTestAccounts(userEmail);
  });

  it("replays tokenless after restart without creating another Connector", async () => {
    const register = await postJson("/v1/auth/users/register", {
      email: userEmail,
      password,
    });
    expect(register.status).toBe(201);
    const userCookie = readUserCookie(register.headers);

    const created = await postJson(
      "/v0.1/account/pairing-sessions",
      {},
      {
        Origin: "http://localhost:3000",
        Cookie: userCookie,
      }
    );
    expect(created.status).toBe(201);
    expectExactKeys(created.body, [
      "type",
      "protocol_version",
      "pairing_id",
      "pairing_code",
      "expires_at",
    ]);

    const pairingId = String(created.body.pairing_id);
    const pairingCode = String(created.body.pairing_code);
    const first = await postJson("/v0.1/account/pairing-sessions/claim", {
      pairing_code: pairingCode,
      device_name: "Restart Mac",
    });
    expect(first.status).toBe(200);
    expectExactKeys(first.body, [
      "type",
      "protocol_version",
      "pairing_id",
      "connector_id",
      "connector_token",
      "connector_expires_at",
      "duplicate",
    ]);
    expect(first.body.duplicate).toBe(false);

    const connectorId = String(first.body.connector_id);
    const firstToken = String(first.body.connector_token);
    expect(firstToken.length > 0).toBe(true);

    const pairingBeforeRestart = await readPairing(pairingId);
    const connectorBeforeRestart = await readConnector(connectorId);
    expect(pairingBeforeRestart.consumed_at).not.toBeNull();
    expect(pairingBeforeRestart.pairing_code_digest === pairingCode).toBe(false);
    expect(connectorBeforeRestart.connector_token_digest === firstToken).toBe(false);
    expect(await countConnectorForPairing(pairingId)).toBe(1);

    await stopReceiver();
    startReceiver();
    await waitForLive();

    const replay = await postJson("/v0.1/account/pairing-sessions/claim", {
      pairing_code: pairingCode,
      device_name: "Renamed After Restart",
    });
    expect(replay.status).toBe(200);
    expectExactKeys(replay.body, [
      "type",
      "protocol_version",
      "pairing_id",
      "connector_id",
      "connector_expires_at",
      "duplicate",
    ]);
    expect(replay.body.connector_token).toBeUndefined();
    expect(replay.body.duplicate).toBe(true);
    expect(replay.body.pairing_id).toBe(pairingId);
    expect(replay.body.connector_id).toBe(connectorId);

    const pairingAfterRestart = await readPairing(pairingId);
    const connectorAfterRestart = await readConnector(connectorId);
    expect(pairingAfterRestart.pairing_code_digest).toBe(
      pairingBeforeRestart.pairing_code_digest
    );
    expect(pairingAfterRestart.consumed_at).not.toBeNull();
    expect(connectorAfterRestart.connector_token_digest).toBe(
      connectorBeforeRestart.connector_token_digest
    );
    expect(connectorAfterRestart.delivery_target_id).toBe(
      connectorBeforeRestart.delivery_target_id
    );
    expect(connectorAfterRestart.device_name).toBe("Restart Mac");
    expect(await countConnectorForPairing(pairingId)).toBe(1);

    const rawTokenRows = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM "cr2_connectors"
      WHERE POSITION(${firstToken} IN row_to_json("cr2_connectors")::text) > 0
    `;
    expect(Number(rawTokenRows[0]?.count ?? 0)).toBe(0);
    expect(receiverLogs.includes(firstToken)).toBe(false);
  });
});
