import assert from "node:assert/strict";
import { test } from "node:test";
import {
  readSession,
  SessionApiError,
  type SessionActor,
} from "../../src/ui/shared/session-api";

type SessionResponse = Pick<Response, "json" | "ok" | "status">;

async function withFetch(response: SessionResponse, run: () => Promise<void>): Promise<void> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => response as Response) as typeof fetch;

  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("readSession treats an unparseable 401 as the signed-out state", async () => {
  let parsed = false;
  const response = {
    status: 401,
    ok: false,
    json: async () => {
      parsed = true;
      throw new Error("401 body unavailable");
    },
  } as SessionResponse;

  await withFetch(response, async () => {
    assert.equal(await readSession(), null);
  });

  assert.equal(parsed, false, "known unauthenticated responses must not depend on body parsing");
});

test("readSession preserves a validated actor from a successful response", async () => {
  const actor: SessionActor = { id: "tenant-primary", role: "tenant" };
  const response = {
    status: 200,
    ok: true,
    json: async () => ({ actor }),
  } as SessionResponse;

  await withFetch(response, async () => {
    assert.deepEqual(await readSession(), actor);
  });
});

test("readSession keeps non-401 malformed responses as bounded errors", async () => {
  const response = {
    status: 503,
    ok: false,
    json: async () => {
      throw new Error("upstream unavailable");
    },
  } as SessionResponse;

  await withFetch(response, async () => {
    await assert.rejects(
      readSession(),
      (error: unknown) => {
        assert.ok(error instanceof SessionApiError);
        assert.equal(error.status, 503);
        assert.equal(error.code, "INVALID_RESPONSE");
        return true;
      },
    );
  });
});
