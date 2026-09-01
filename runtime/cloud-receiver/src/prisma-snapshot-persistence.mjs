import { DatabaseSync } from "node:sqlite";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPackage from "@prisma/client";
import { createCloudReceiverHttpHandler } from "../../../reentry-core/src/cloud-receiver-http.mjs";
import { createProductPreviewComposition } from "./product-preview-composition.mjs";

const { PrismaClient } = prismaClientPackage;

const STORE_FILES = Object.freeze([
  ["receiver", "receiver.sqlite"],
  ["host-keys", "host-keys.sqlite"],
  ["accounts", "accounts.sqlite"],
  ["product", "product.sqlite"],
]);
const ADVISORY_LOCK_SQL = "SELECT pg_advisory_xact_lock(hashtext('reentry-runtime-state'))";

export function createPrismaSnapshotPersistence(options) {
  requireExactRecord(options, ["databaseUrl", "tokenSecret", "verificationOrigin"], ["databaseUrl", "tokenSecret"], "Prisma persistence options");
  const adapter = new PrismaPg({ connectionString: requireText(options.databaseUrl, "DATABASE_URL") });
  const prisma = new PrismaClient({ adapter });
  const tokenSecret = requireText(options.tokenSecret, "Connector token secret");
  const verificationOrigin = options.verificationOrigin;
  let closed = false;

  return Object.freeze({ withComposition, ready, close });

  async function withComposition(callback) {
    assertOpen();
    if (typeof callback !== "function") throw new TypeError("Prisma persistence callback is required");
    return prisma.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe(ADVISORY_LOCK_SQL);
      const stateDirectory = await mkdtemp(join(tmpdir(), "reentry-cloud-"));
      const paths = new Map(STORE_FILES.map(([name, filename]) => [name, join(stateDirectory, filename)]));
      try {
        await hydrate(transaction, paths);
        const composition = createProductPreviewComposition({
          receiverDatabasePath: paths.get("receiver"),
          pairingDatabasePath: paths.get("host-keys"),
          accountDatabasePath: paths.get("accounts"),
          productDatabasePath: paths.get("product"),
          tokenSecret,
          ...(verificationOrigin === undefined ? {} : { verificationOrigin }),
        });
        try {
          return await callback({
            composition,
            protocolHandler: createCloudReceiverHttpHandler({ receiver: composition.receiver }),
          });
        } finally {
          composition.close();
          await persist(transaction, paths);
        }
      } finally {
        await rm(stateDirectory, { recursive: true, force: true });
      }
    }, { maxWait: 10_000, timeout: 25_000 });
  }

  async function ready() {
    assertOpen();
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  async function close() {
    if (closed) return;
    closed = true;
    await prisma.$disconnect();
  }

  function assertOpen() {
    if (closed) throw new Error("Prisma persistence is closed");
  }
}

async function hydrate(transaction, paths) {
  const snapshots = await transaction.runtimeStoreSnapshot.findMany();
  for (const snapshot of snapshots) {
    const path = paths.get(snapshot.storeName);
    if (!path) continue;
    await writeFile(path, Buffer.from(snapshot.payload));
  }
}

async function persist(transaction, paths) {
  for (const [storeName, path] of paths) {
    checkpoint(path);
    const payload = await readFile(path);
    await transaction.runtimeStoreSnapshot.upsert({
      where: { storeName },
      create: { storeName, payload },
      update: { payload },
    });
  }
}

function checkpoint(path) {
  const database = new DatabaseSync(path);
  try {
    database.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  } finally {
    database.close();
  }
}

function requireText(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.length > 16_384) {
    throw new TypeError(`${label} is required`);
  }
  return value;
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw new TypeError(`${label} contains an unsupported field`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw new TypeError(`${label} is missing a required field`);
  }
}
