import assert from "node:assert/strict";
import test from "node:test";

import deprecatedVercelHandler, { createCloudReceiverVercelHandler } from "../api/index.mjs";
import { CloudReceiverPersistenceBusyError } from "../src/prisma-relational-persistence.mjs";

test("the default Vercel entry point advertises retirement", async () => {
  const response = responseStub();

  await deprecatedVercelHandler({ url: "/healthz" }, response);

  assert.equal(response.statusCode, 410);
  assert.deepEqual(JSON.parse(response.body), {
    error: "receiver_deprecated",
    status: "deprecated",
  });
});

test("Vercel handler turns Receiver lock contention into a retryable response", async () => {
  const handler = createCloudReceiverVercelHandler({
    deprecated: false,
    createPersistence() {
      return {
        async withComposition() {
          throw new CloudReceiverPersistenceBusyError();
        },
      };
    },
    environment: {
      CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET: "handler-test-secret",
      CLOUD_RECEIVER_RUNTIME_DATABASE_URL: "postgresql://preview.invalid/reentry",
    },
  });
  const response = responseStub();

  await handler({ url: "/" }, response);

  assert.equal(response.statusCode, 503);
  assert.equal(response.headers["Retry-After"], "1");
  assert.deepEqual(JSON.parse(response.body), {
    error: { code: "receiver_busy" },
  });
});

test("Vercel handler contains unexpected persistence failures", async () => {
  const handler = createCloudReceiverVercelHandler({
    deprecated: false,
    createPersistence() {
      return {
        async withComposition() {
          throw new Error("private database detail");
        },
      };
    },
    environment: {
      CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET: "handler-test-secret",
      CLOUD_RECEIVER_RUNTIME_DATABASE_URL: "postgresql://preview.invalid/reentry",
    },
  });
  const response = responseStub();

  await handler({ url: "/" }, response);

  assert.equal(response.statusCode, 500);
  assert.deepEqual(JSON.parse(response.body), {
    error: { code: "receiver_internal_error" },
  });
});

test("Vercel handler preserves the configured Supabase pooler for runtime state", async () => {
  let persistenceOptions;
  const configuredDatabaseUrl =
    "postgresql://postgres.project:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require";
  const handler = createCloudReceiverVercelHandler({
    deprecated: false,
    createPersistence(options) {
      persistenceOptions = options;
      return {
        async ready() {
          return true;
        },
      };
    },
    environment: {
      CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET: "handler-test-secret",
      CLOUD_RECEIVER_RUNTIME_DATABASE_URL: configuredDatabaseUrl,
    },
  });
  const response = responseStub();

  await handler({ url: "/readyz" }, response);

  assert.equal(persistenceOptions.databaseUrl, configuredDatabaseUrl);
});

function responseStub() {
  return {
    body: "",
    destroyed: false,
    headers: {},
    headersSent: false,
    statusCode: undefined,
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
      this.headersSent = true;
    },
    end(body) {
      this.body = body;
    },
  };
}
