import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import {
  OperationsInsightsApplication,
  type OperationsInsightsApplicationOptions,
} from "../../src/server/application/operations-insights";
import { DomainError } from "../../src/server/domain/errors";
import {
  createInitialOperationsProfile,
  OperationsProfileValidationError,
} from "../../src/server/domain/operations-profile";
import {
  projectOperationsProfile,
  type OperationsListingPipelineProjection,
} from "../../src/server/domain/operations-profile-projection";
import type { Actor } from "../../src/server/domain/types";

const AGENT: Actor = { id: "agent-demo", role: "agent" };
const TENANT: Actor = { id: "tenant-demo", role: "tenant" };
const AS_OF = "2026-09-03T09:00:00.000Z";
const TEST_DIRECTORY = join(process.cwd(), "var/test");
let sequence = 0;

mkdirSync(TEST_DIRECTORY, { recursive: true });

test("application returns projection-parity listing pipeline and upcoming viewing envelopes", () => {
  const application = new OperationsInsightsApplication({
    databasePath: databasePath("parity"),
    now: () => AS_OF,
  });
  try {
    const listingQuery = { kind: "listingPipeline" } as const;
    assert.deepEqual(
      application.read(AGENT, listingQuery),
      projectOperationsProfile(createInitialOperationsProfile(), AGENT, listingQuery, AS_OF),
    );

    const upcomingQuery = {
      kind: "upcomingViewings",
      from: "2026-09-03",
      to: "2026-09-05",
      status: "PROPOSED",
    } as const;
    assert.deepEqual(
      application.read(AGENT, upcomingQuery),
      projectOperationsProfile(createInitialOperationsProfile(), AGENT, upcomingQuery, AS_OF),
    );
  } finally {
    application.close();
  }
});

test("application preserves explicit empty results, exact counts, and fixed cap", () => {
  const application = new OperationsInsightsApplication({
    databasePath: databasePath("empty"),
    now: () => AS_OF,
  });
  try {
    const empty = application.read(AGENT, {
      kind: "listingPipeline",
      area: "No Such Area",
    });
    assert.equal(empty.totalCount, 0);
    assert.equal(empty.returnedCount, 0);
    assert.equal(empty.truncated, false);
    assert.deepEqual(empty.items, []);
    assert.deepEqual(empty.filters, { kind: "listingPipeline", area: "No Such Area" });
  } finally {
    application.close();
  }
});

test("application preserves projection counts and truncation rather than counting returned rows", () => {
  const state = createInitialOperationsProfile();
  for (let index = 0; index < 30; index += 1) {
    state.listings.push({
      id: `operations-extra-${String(index).padStart(2, "0")}`,
      revision: 1,
      title: `Extra listing ${index}`,
      area: "Southwark",
      monthlyRentGbp: 1_000,
      bedrooms: 1,
      sizeSqM: 40,
      availableFrom: "2026-09-01",
      publicationState: "PUBLISHED",
      lifecycleState: "OPEN",
      assignedAgentId: "agent-demo",
      firstPublishedAt: "2026-08-01T09:00:00.000Z",
    });
  }
  let closed = false;
  const application = new OperationsInsightsApplication({
    createStore: () => ({ readState: () => state, close: () => { closed = true; } }),
    now: () => AS_OF,
  });
  const result = application.read(AGENT, { kind: "listingPipeline" });
  application.close();
  assert.equal(result.totalCount, 35);
  assert.equal(result.returnedCount, 25);
  assert.equal(result.truncated, true);
  assert.equal(
    (result as OperationsListingPipelineProjection).counts.publicationState.PUBLISHED,
    34,
  );
  assert.equal(closed, true);
});

test("application enforces the agent boundary and converts invalid authority to a typed failure", () => {
  const application = new OperationsInsightsApplication({
    databasePath: databasePath("role"),
    now: () => AS_OF,
  });
  try {
    assert.throws(
      () => application.read(TENANT, { kind: "listingPipeline" }),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
  } finally {
    application.close();
  }

  const invalidAuthority = new OperationsInsightsApplication({
    createStore: () => ({
      readState: () => {
        throw new OperationsProfileValidationError();
      },
      close: () => undefined,
    }),
    now: () => AS_OF,
  } satisfies OperationsInsightsApplicationOptions);
  try {
    assert.throws(
      () => invalidAuthority.read(AGENT, { kind: "listingPipeline" }),
      (error: unknown) => error instanceof OperationsProfileValidationError,
    );
  } finally {
    invalidAuthority.close();
  }
});

function databasePath(label: string): string {
  sequence += 1;
  return join(TEST_DIRECTORY, `operations-insights-${process.pid}-${sequence}-${label}.sqlite`);
}
