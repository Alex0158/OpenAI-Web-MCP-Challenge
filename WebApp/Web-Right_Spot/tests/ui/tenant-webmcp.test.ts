import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  createTenantSearchTool,
  detectModelContext,
  registerTenantSearchTool,
  TenantSearchStaleError,
  type TenantSearchTool,
  type WebMcpModelContext,
} from "../../src/ui/tenant/tenant-webmcp";
import type { TenantListingsResponse } from "../../src/shared/contracts/listings-api";
import { TenantApiError } from "../../src/ui/tenant/tenant-api";

const PAGE_PATH = resolve(process.cwd(), "src/ui/tenant/tenant-discovery-page.tsx");

const SEARCH_RESULT: TenantListingsResponse = {
  fixtureGeneration: 12,
  appliedFilters: {
    area: "Southwark",
    maxRent: 2500,
    minSizeSqM: 50,
    availableBy: "2026-09-20",
  },
  matchedCount: 1,
  listings: [{
    id: "listing-primary",
    version: 1,
    title: "Canal Wharf Apartment",
    address: "1 Example Walk",
    area: "Southwark",
    monthlyRentGbp: 2200,
    bedrooms: 2,
    sizeSqM: 61,
    availableFrom: "2026-09-15",
    description: "A seeded listing.",
    imageKey: "listing-primary-image",
  }],
  pagePath: "/tenant",
  pageState: "results",
};

test("search_listings exposes exactly the bounded read-only schema and static metadata", () => {
  const tool = createTenantSearchTool(async () => SEARCH_RESULT);

  assert.equal(tool.name, "search_listings");
  assert.equal(tool.title, "Search published rental listings");
  assert.equal(tool.annotations?.readOnlyHint, true);
  assert.equal(tool.annotations?.untrustedContentHint, true);
  assert.equal(typeof tool.description, "string");
  assert.equal(tool.description.includes("Canal Wharf"), false);
  assert.deepEqual(Object.keys(tool.inputSchema.properties).sort(), [
    "area",
    "availableBy",
    "maxRent",
    "minSizeSqM",
  ]);
  assert.equal(tool.inputSchema.type, "object");
  assert.equal(tool.inputSchema.additionalProperties, false);
  assert.equal(tool.inputSchema.properties.area.minLength, 1);
  assert.equal(tool.inputSchema.properties.area.maxLength, 80);
  assert.equal(tool.inputSchema.properties.maxRent.minimum, 1);
  assert.equal(tool.inputSchema.properties.maxRent.maximum, 100000);
  assert.equal(tool.inputSchema.properties.minSizeSqM.minimum, 1);
  assert.equal(tool.inputSchema.properties.minSizeSqM.maximum, 10000);
  assert.equal(tool.inputSchema.properties.availableBy.format, "date");
});

test("capability detection requires document.modelContext.registerTool", () => {
  const registerTool = () => Promise.resolve();
  assert.ok(detectModelContext({ modelContext: { registerTool } }));
  assert.equal(detectModelContext({ modelContext: {} }), null);
  assert.equal(detectModelContext({}), null);
  assert.equal(detectModelContext(null), null);
});

test("registration is page-local, single-tool, and aborts its registration signal on teardown", async () => {
  let calls = 0;
  const registeredTools: TenantSearchTool[] = [];
  let registrationSignal: AbortSignal | undefined;
  const modelContext: WebMcpModelContext = {
    registerTool(tool, options) {
      calls += 1;
      registeredTools.push(tool);
      registrationSignal = options?.signal;
      return Promise.resolve();
    },
  };

  const dispose = registerTenantSearchTool({
    modelContext,
    executeSearch: async () => SEARCH_RESULT,
  });

  await Promise.resolve();
  assert.equal(calls, 1);
  assert.equal(registeredTools[0]?.name, "search_listings");
  assert.equal(registrationSignal?.aborted, false);

  dispose();
  assert.equal(registrationSignal?.aborted, true);
});

test("registration teardown aborts an in-flight delegated search and cannot return success", async () => {
  const registeredTools: TenantSearchTool[] = [];
  let receivedSignal: AbortSignal | undefined;
  let release: (() => void) | undefined;
  const modelContext: WebMcpModelContext = {
    registerTool(tool) {
      registeredTools.push(tool);
    },
  };

  const dispose = registerTenantSearchTool({
    modelContext,
    executeSearch: async (_filters, options) => {
      receivedSignal = options?.signal;
      await new Promise<void>((resolvePromise) => { release = resolvePromise; });
      return SEARCH_RESULT;
    },
  });
  const tool = registeredTools[0];
  assert.ok(tool);

  const pendingResult = tool.execute({});
  await Promise.resolve();
  assert.equal(receivedSignal?.aborted, false);

  dispose();
  assert.equal(receivedSignal?.aborted, true);
  release?.();
  assert.deepEqual(await pendingResult, {
    error: {
      code: "STALE_RESULT",
      message: "The search was cancelled or superseded. Retry the latest search.",
    },
  });
});

test("unsupported capability performs no registration and leaves the manual page contract intact", () => {
  let calls = 0;
  const dispose = registerTenantSearchTool({
    modelContext: null,
    executeSearch: async () => {
      calls += 1;
      return SEARCH_RESULT;
    },
  });

  dispose();
  assert.equal(calls, 0);

  const page = readFileSync(PAGE_PATH, "utf8");
  assert.match(page, /function applyFilters/);
  assert.match(page, /Apply filters/);
  assert.match(page, /Clear/);
  assert.match(page, /Retry catalogue/);
});

test("valid tool arguments normalize only shared logical filters and return the accepted page result", async () => {
  let receivedFilters: unknown;
  let receivedSignal: AbortSignal | undefined;
  const tool = createTenantSearchTool(async (filters, options) => {
    receivedFilters = filters;
    receivedSignal = options?.signal;
    return SEARCH_RESULT;
  });
  const controller = new AbortController();

  const result = await tool.execute({
    area: "  southwark  ",
    maxRent: 2500,
    minSizeSqM: 50,
    availableBy: "2026-09-20",
  }, { signal: controller.signal });

  assert.deepEqual(receivedFilters, {
    area: "southwark",
    maxRent: 2500,
    minSizeSqM: 50,
    availableBy: "2026-09-20",
  });
  assert.equal(receivedSignal, controller.signal);
  assert.deepEqual(result, SEARCH_RESULT);
});

test("unknown, malformed, and invalid arguments fail before page execution", async () => {
  let calls = 0;
  const tool = createTenantSearchTool(async () => {
    calls += 1;
    return SEARCH_RESULT;
  });

  for (const input of [
    { area: "Southwark", limit: 1 },
    { maxRent: 2500.5 },
    { minSizeSqM: 0 },
    { availableBy: "2026-02-31" },
    { area: "   " },
    { area: "a".repeat(81) },
    null,
    [],
  ]) {
    const result = await tool.execute(input);
    assert.equal("error" in result ? result.error.code : undefined, "VALIDATION_FAILED");
  }

  assert.equal(calls, 0);
});

test("API failures are bounded and cancellation or supersession cannot report success", async () => {
  const invalidTool = createTenantSearchTool(async () => {
    throw { status: 400, code: "VALIDATION_FAILED", message: "private server detail" };
  });
  const invalidResult = await invalidTool.execute({ area: "Unknown" });
  assert.deepEqual(invalidResult, {
    error: {
      code: "VALIDATION_FAILED",
      message: "Search arguments are invalid. Check the four bounded criteria and try again.",
    },
  });
  assert.equal(JSON.stringify(invalidResult).includes("private"), false);

  const staleTool = createTenantSearchTool(async () => {
    throw new TenantSearchStaleError();
  });
  assert.deepEqual(await staleTool.execute({}), {
    error: {
      code: "STALE_RESULT",
      message: "The search was cancelled or superseded. Retry the latest search.",
    },
  });

  const controller = new AbortController();
  let release: (() => void) | undefined;
  const pendingTool = createTenantSearchTool(async () => {
    await new Promise<void>((resolvePromise) => { release = resolvePromise; });
    return SEARCH_RESULT;
  });
  const pendingResult = pendingTool.execute({}, { signal: controller.signal });
  controller.abort();
  release?.();
  assert.deepEqual(await pendingResult, {
    error: {
      code: "STALE_RESULT",
      message: "The search was cancelled or superseded. Retry the latest search.",
    },
  });
});

test("the adapter is mounted inside the server-resolved Tenant /tenant child boundary and shares the page executor", () => {
  const page = readFileSync(PAGE_PATH, "utf8");
  const frameStart = page.indexOf("<RolePageFrame");
  const adapterStart = page.indexOf("<TenantWebMcp");
  const frameGate = page.indexOf("currentPath=\"/tenant\"");

  assert.ok(frameStart >= 0);
  assert.ok(frameGate > frameStart);
  assert.ok(adapterStart > frameGate);
  assert.match(page, /<TenantWebMcp[\s\S]*executeSearch=\{executeSearch\}/);
  assert.match(page, /cancelSearches=\{cancelSearches\}/);
});

test("authoritative Tenant authentication failures deactivate the page registration", async () => {
  for (const failure of [
    new TenantApiError(401, "UNAUTHENTICATED", "private"),
    new TenantApiError(403, "FORBIDDEN", "private"),
  ]) {
    const tools: TenantSearchTool[] = [];
    let registrationSignal: AbortSignal | undefined;
    const modelContext: WebMcpModelContext = {
      registerTool(tool, options) {
        tools.push(tool);
        registrationSignal = options?.signal;
      },
    };
    const dispose = registerTenantSearchTool({
      modelContext,
      executeSearch: async () => { throw failure; },
    });

    const result = await tools[0]!.execute({});
    assert.equal("error" in result ? result.error.code : undefined, failure.code);
    assert.equal(registrationSignal?.aborted, true);
    const afterDeactivation = await tools[0]!.execute({});
    assert.equal("error" in afterDeactivation ? afterDeactivation.error.code : undefined, "STALE_RESULT");
    dispose();
  }
});
