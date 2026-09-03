import assert from "node:assert/strict";
import { readFile, rm, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  CloudReceiverPersistenceBusyError,
  createPrismaRelationalPersistence,
} from "../src/prisma-relational-persistence.mjs";
import { createProductPreviewComposition } from "../src/product-preview-composition.mjs";

test("snapshot persistence reports lock contention as a bounded busy failure", async () => {
  let transactionOptions;
  const prisma = {
    async $transaction(callback, options) {
      transactionOptions = options;
      return callback({
        async $queryRawUnsafe(sql) {
          assert.match(sql, /pg_try_advisory_xact_lock/);
          return [{ acquired: false }];
        },
      });
    },
    async $disconnect() {},
  };
  const persistence = createPrismaRelationalPersistence({
    databaseUrl: "postgresql://preview.invalid/reentry",
    prismaClient: prisma,
    tokenSecret: "snapshot-test-secret",
  });

  await assert.rejects(
    persistence.withComposition(() => {}),
    (error) => error instanceof CloudReceiverPersistenceBusyError
      && error.code === "cloud_receiver_persistence_busy",
  );
  assert.deepEqual(transactionOptions, { maxWait: 10_000, timeout: 25_000 });
  await persistence.close();
});

test("legacy PostgreSQL lock timeout errors map to the same busy failure", async () => {
  const prisma = {
    async $transaction(callback) {
      return callback({
        async $queryRawUnsafe() {
          const error = new Error("canceling statement due to lock timeout");
          error.code = "P2010";
          throw error;
        },
      });
    },
    async $disconnect() {},
  };
  const persistence = createPrismaRelationalPersistence({
    databaseUrl: "postgresql://preview.invalid/reentry",
    prismaClient: prisma,
    tokenSecret: "snapshot-test-secret",
  });

  await assert.rejects(
    persistence.withComposition(() => {}),
    (error) => error instanceof CloudReceiverPersistenceBusyError,
  );
  await persistence.close();
});

test("relational persistence executes the existing composition against native rows", async () => {
  const operations = [];
  const transaction = transactionStub(operations);
  const prisma = {
    async $transaction(callback, options) {
      operations.push({ type: "transaction", options });
      return callback(transaction);
    },
    async $disconnect() {},
  };
  const persistence = createPrismaRelationalPersistence({
    databaseUrl: "postgresql://preview.invalid/reentry",
    prismaClient: prisma,
    tokenSecret: "relational-test-secret",
  });

  const result = await persistence.withComposition(async ({ composition }) => ({
    ready: composition.readiness(),
  }));

  assert.deepEqual(result, { ready: true });
  assert.equal(operations[0].type, "transaction");
  const deleteDelegates = operations
    .filter((operation) => operation.type === "deleteMany")
    .map((operation) => operation.delegate);
  assert.equal(deleteDelegates.length, 20);
  assert.equal(deleteDelegates[0], "deliveryAttempt");
  assert.equal(deleteDelegates.at(-1), "account");
  await persistence.close();
});

test("relational persistence imports legacy snapshots and clears them after backfill", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-relational-backfill-"));
  const paths = {
    receiver: join(directory, "receiver.sqlite"),
    hostKeys: join(directory, "host-keys.sqlite"),
    accounts: join(directory, "accounts.sqlite"),
    product: join(directory, "product.sqlite"),
  };
  const seed = createProductPreviewComposition({
    receiverDatabasePath: paths.receiver,
    pairingDatabasePath: paths.hostKeys,
    accountDatabasePath: paths.accounts,
    productDatabasePath: paths.product,
    tokenSecret: "backfill-seed-secret",
  });
  seed.close();

  const operations = [];
  const transaction = transactionStub(operations, [
    ["receiver", await readFile(paths.receiver)],
    ["host-keys", await readFile(paths.hostKeys)],
    ["accounts", await readFile(paths.accounts)],
    ["product", await readFile(paths.product)],
  ]);
  const prisma = {
    async $transaction(callback) {
      return callback(transaction);
    },
    async $disconnect() {},
  };
  const persistence = createPrismaRelationalPersistence({
    databaseUrl: "postgresql://preview.invalid/reentry",
    prismaClient: prisma,
    tokenSecret: "relational-test-secret",
  });

  await persistence.withComposition(async ({ composition }) => ({
    ready: composition.readiness(),
  }));

  assert.equal(operations.some((operation) => operation.type === "snapshotDelete"), true);
  assert.equal(operations.some((operation) => operation.type === "findMany"), false);
  await persistence.close();
  await rm(directory, { recursive: true, force: true });
});

function transactionStub(operations, snapshots = []) {
  const delegates = new Map();
  return new Proxy({
    async $queryRawUnsafe(sql) {
      assert.match(sql, /pg_try_advisory_xact_lock/);
      return [{ acquired: true }];
    },
    runtimeStoreSnapshot: {
      async findMany() {
        operations.push({ type: "snapshotFindMany" });
        return snapshots.map(([storeName, payload]) => ({ storeName, payload }));
      },
      async deleteMany() {
        operations.push({ type: "snapshotDelete" });
      },
    },
  }, {
    get(target, property) {
      if (property in target) return target[property];
      if (!delegates.has(property)) {
        delegates.set(property, {
          async findMany() {
            operations.push({ type: "findMany", delegate: property });
            return [];
          },
          async deleteMany() {
            operations.push({ type: "deleteMany", delegate: property });
          },
          async createMany({ data }) {
            operations.push({ type: "createMany", count: data.length, delegate: property });
          },
        });
      }
      return delegates.get(property);
    },
  });
}
