import assert from "node:assert/strict";
import { test } from "node:test";

import {
  collectCanonicalAreas,
  resolveCanonicalArea,
  suggestCanonicalAreas,
} from "../../src/shared/contracts/listings-api";

test("area discovery preserves first-seen canonical labels and deterministic prefix suggestions", () => {
  const catalogue = [
    { area: "  Southwark " },
    { area: "southwark" },
    { area: "Islington" },
    { area: "Haringey" },
    { area: "Southbank" },
  ];

  assert.deepEqual(collectCanonicalAreas(catalogue), [
    "Southwark",
    "Islington",
    "Haringey",
    "Southbank",
  ]);
  assert.deepEqual(suggestCanonicalAreas(catalogue, ""), [
    "Southwark",
    "Islington",
    "Haringey",
    "Southbank",
  ]);
  assert.deepEqual(suggestCanonicalAreas(catalogue, " s"), [
    "Southwark",
    "Southbank",
  ]);
  assert.deepEqual(suggestCanonicalAreas(catalogue, "is"), ["Islington"]);
  assert.deepEqual(suggestCanonicalAreas(catalogue, "bank"), []);
  assert.equal(resolveCanonicalArea(catalogue, " southwark "), "Southwark");
  assert.equal(resolveCanonicalArea(catalogue, "South"), null);
});
