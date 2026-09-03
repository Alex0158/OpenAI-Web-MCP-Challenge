import test from "node:test";
import assert from "node:assert/strict";

import { resolveClerkPresentationMode } from "../src/client/clerk-presentation";

test("Clerk presentation requires a publishable key in production", () => {
  assert.equal(resolveClerkPresentationMode({ nodeEnv: "production", publishableKey: undefined }), "missing-production-config");
  assert.equal(resolveClerkPresentationMode({ nodeEnv: "production", publishableKey: "   " }), "missing-production-config");
  assert.equal(resolveClerkPresentationMode({ nodeEnv: "production", publishableKey: "pk_live_demo" }), "clerk");
});

test("local fixture presentation remains available without Clerk client configuration", () => {
  assert.equal(resolveClerkPresentationMode({ nodeEnv: "test", publishableKey: undefined }), "local");
  assert.equal(resolveClerkPresentationMode({ nodeEnv: "development", publishableKey: "" }), "local");
});
