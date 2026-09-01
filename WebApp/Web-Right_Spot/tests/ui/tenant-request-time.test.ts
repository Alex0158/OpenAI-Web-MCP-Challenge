import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import {
  londonWallTimeToUtcIso,
  TenantRequestTimeError,
  utcIsoToLondonInput,
} from "../../src/ui/tenant/tenant-request-time";

const appRoot = path.resolve(import.meta.dirname, "../..");
const helperUrl = pathToFileURL(path.join(appRoot, "src/ui/tenant/tenant-request-time.ts")).href;

test("converts winter and summer London wall times to UTC", () => {
  assert.equal(londonWallTimeToUtcIso("2026-01-15T10:00"), "2026-01-15T10:00:00.000Z");
  assert.equal(londonWallTimeToUtcIso("2026-07-15T10:00"), "2026-07-15T09:00:00.000Z");
});

test("stored UTC instants round-trip to their London editor values", () => {
  assert.equal(utcIsoToLondonInput("2026-01-15T10:00:00.000Z"), "2026-01-15T10:00");
  assert.equal(utcIsoToLondonInput("2026-07-15T09:00:00.000Z"), "2026-07-15T10:00");
});

test("rejects malformed and calendar-invalid wall times", () => {
  for (const value of ["", "2026-01-15T9:00", "2026-02-30T10:00", "2026-01-15T24:00"]) {
    assert.throws(
      () => londonWallTimeToUtcIso(value),
      (error: unknown) => error instanceof TenantRequestTimeError && error.code === "INVALID_INPUT",
    );
  }
  assert.equal(utcIsoToLondonInput("not-a-date"), "");
});

test("fails closed for the Europe/London spring-forward gap", () => {
  assert.throws(
    () => londonWallTimeToUtcIso("2026-03-29T01:30"),
    (error: unknown) => error instanceof TenantRequestTimeError && error.code === "NON_EXISTENT_TIME",
  );
});

test("fails closed for the Europe/London autumn overlap", () => {
  assert.throws(
    () => londonWallTimeToUtcIso("2026-10-25T01:30"),
    (error: unknown) => error instanceof TenantRequestTimeError && error.code === "AMBIGUOUS_TIME",
  );
});

test("produces the same UTC instant under UTC and non-UK host timezones", () => {
  const outputs = ["UTC", "America/New_York"].map((timezone) => runInTimezone(timezone, "2026-07-15T10:00"));
  assert.deepEqual(outputs, ["2026-07-15T09:00:00.000Z", "2026-07-15T09:00:00.000Z"]);
});

function runInTimezone(timezone: string, wallTime: string): string {
  const script = [
    `import { londonWallTimeToUtcIso } from ${JSON.stringify(helperUrl)};`,
    `process.stdout.write(londonWallTimeToUtcIso(${JSON.stringify(wallTime)}));`,
  ].join("\n");
  return execFileSync(process.execPath, ["--import", "tsx/esm", "--input-type=module", "--eval", script], {
    cwd: appRoot,
    env: { ...process.env, TZ: timezone },
    encoding: "utf8",
  });
}
