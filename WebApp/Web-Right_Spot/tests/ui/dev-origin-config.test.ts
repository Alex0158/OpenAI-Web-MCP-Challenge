import assert from "node:assert/strict";
import { test } from "node:test";
import nextConfig from "../../next.config";

test("local development explicitly allows the documented loopback origin", () => {
  assert.deepEqual(nextConfig.allowedDevOrigins, ["127.0.0.1"]);
});
