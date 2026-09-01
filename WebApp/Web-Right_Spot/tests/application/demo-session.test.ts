import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEMO_SESSION_COOKIE_NAME,
  DEMO_SESSION_MAX_AGE_SECONDS,
  issueDemoSession,
  resolveDemoSession,
  serializeClearedDemoSessionCookie,
  serializeDemoSessionCookie,
} from "../../src/server/application/demo-session";

test("the allowlist issues and resolves only the two seeded demo actors", () => {
  const tenant = issueDemoSession("tenant");
  const agent = issueDemoSession("agent");

  assert.deepEqual(
    resolveDemoSession(`${DEMO_SESSION_COOKIE_NAME}=${tenant.cookieValue}`),
    { id: "tenant-demo", role: "tenant" },
  );
  assert.deepEqual(
    resolveDemoSession(`other=value; ${DEMO_SESSION_COOKIE_NAME}=${agent.cookieValue}`),
    { id: "agent-demo", role: "agent" },
  );
  assert.notEqual(tenant.cookieValue, agent.cookieValue);
});

test("absent, forged, malformed, and duplicate cookie values grant no actor", () => {
  assert.equal(resolveDemoSession(null), null);
  assert.equal(resolveDemoSession(`${DEMO_SESSION_COOKIE_NAME}=tenant`), null);
  assert.equal(resolveDemoSession(`${DEMO_SESSION_COOKIE_NAME}=%E0%A4%A`), null);
  const tenant = issueDemoSession("tenant");
  assert.equal(
    resolveDemoSession(
      `${DEMO_SESSION_COOKIE_NAME}=${tenant.cookieValue}; ${DEMO_SESSION_COOKIE_NAME}=${tenant.cookieValue}`,
    ),
    null,
  );
});

test("session and logout cookies use the bounded local security attributes", () => {
  const issued = serializeDemoSessionCookie(issueDemoSession("tenant").cookieValue);
  assert.match(issued, new RegExp(`^${DEMO_SESSION_COOKIE_NAME}=`));
  assert.match(issued, new RegExp(`Max-Age=${DEMO_SESSION_MAX_AGE_SECONDS}`));
  assert.match(issued, /HttpOnly/);
  assert.match(issued, /SameSite=Lax/);
  assert.match(issued, /Path=\//);

  const cleared = serializeClearedDemoSessionCookie();
  assert.match(cleared, new RegExp(`^${DEMO_SESSION_COOKIE_NAME}=`));
  assert.match(cleared, /Max-Age=0/);
  assert.match(cleared, /HttpOnly/);
  assert.match(cleared, /SameSite=Lax/);
  assert.match(cleared, /Path=\//);
});
