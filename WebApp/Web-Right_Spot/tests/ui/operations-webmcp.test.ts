import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  createOperationsListingPipelineTool,
  detectOperationsModelContext,
  OperationsReadStaleError,
  registerOperationsListingPipelineTool,
  type OperationsListingPipelineTool,
  type OperationsWebMcpModelContext,
} from "../../src/ui/agent/operations/operations-webmcp";
import { OperationsApiError } from "../../src/ui/agent/operations/operations-api";
import type { OperationsApiResponse } from "../../src/shared/contracts/operations-api";

const PAGE_PATH = resolve(process.cwd(), "src/ui/agent/operations/operations-page.tsx");
const ADAPTER_PATH = resolve(process.cwd(), "src/ui/agent/operations/operations-webmcp.ts");

const LISTING_RESULT = {
  profile: "operations",
  fixtureGeneration: 8,
  timezone: "Europe/London",
  asOf: "2026-09-03T10:00:00.000Z",
  dataAsOf: "2026-09-03T09:55:00.000Z",
  freshness: "CURRENT",
  filters: {
    kind: "listingPipeline",
    area: "North",
    publicationState: "PUBLISHED",
    lifecycleState: "OPEN",
    minPublishedAgeDays: 14,
  },
  totalCount: 1,
  returnedCount: 1,
  truncated: false,
  counts: {
    publicationState: { PUBLISHED: 1, UNPUBLISHED: 0 },
    lifecycleState: { OPEN: 1, UNAVAILABLE: 0, LET_AGREED: 0, ARCHIVED: 0 },
  },
  items: [{
    id: "listing-1",
    revision: 2,
    title: "Canal House",
    area: "North",
    monthlyRentGbp: 2200,
    bedrooms: 2,
    sizeSqM: 61,
    availableFrom: "2026-09-15",
    publicationState: "PUBLISHED",
    lifecycleState: "OPEN",
    firstPublishedAt: "2026-08-01T09:00:00.000Z",
    publishedAgeDays: 33,
    stale: true,
  }],
} as const satisfies Extract<OperationsApiResponse, { filters: { kind: "listingPipeline" } }>;

test("read_listing_pipeline freezes the accepted metadata, annotations, and schema", () => {
  const tool = createOperationsListingPipelineTool(async () => LISTING_RESULT);

  assert.equal(tool.name, "read_listing_pipeline");
  assert.equal(tool.title, "Read listing pipeline");
  assert.equal(
    tool.description,
    "Read the assigned agent's current listing pipeline on the Operations page using optional area, publication state, lifecycle state, and minimum published age filters.",
  );
  assert.deepEqual(tool.annotations, { readOnlyHint: true, untrustedContentHint: true });
  assert.equal(tool.inputSchema.type, "object");
  assert.equal(tool.inputSchema.additionalProperties, false);
  assert.equal("required" in tool.inputSchema, false);
  assert.deepEqual(Object.keys(tool.inputSchema.properties), [
    "area",
    "publicationState",
    "lifecycleState",
    "minPublishedAgeDays",
  ]);
  assert.deepEqual(tool.inputSchema.properties.area, {
    type: "string",
    minLength: 1,
    maxLength: 80,
    pattern: "^(?:\\S|\\S.*\\S)$",
  });
  assert.deepEqual(tool.inputSchema.properties.publicationState, {
    type: "string",
    enum: ["PUBLISHED", "UNPUBLISHED"],
  });
  assert.deepEqual(tool.inputSchema.properties.lifecycleState, {
    type: "string",
    enum: ["OPEN", "UNAVAILABLE", "LET_AGREED", "ARCHIVED"],
  });
  assert.deepEqual(tool.inputSchema.properties.minPublishedAgeDays, {
    type: "integer",
    minimum: 0,
    maximum: Number.MAX_SAFE_INTEGER,
  });
});

test("Operations capability detection requires document.modelContext.registerTool", () => {
  const registerTool = () => Promise.resolve();
  assert.ok(detectOperationsModelContext({ modelContext: { registerTool } }));
  assert.equal(detectOperationsModelContext({ modelContext: {} }), null);
  assert.equal(detectOperationsModelContext({}), null);
  assert.equal(detectOperationsModelContext(null), null);
});

test("a rejected registration signals once and deactivates the captured tool", async () => {
  const tools: OperationsListingPipelineTool[] = [];
  let registrationSignal: AbortSignal | undefined;
  let rejectRegistration: ((reason?: unknown) => void) | undefined;
  let executionCalls = 0;
  let registrationErrors = 0;
  let abortEvents = 0;
  const registration = new Promise<unknown>((_resolve, reject) => {
    rejectRegistration = reject;
  });
  const modelContext: OperationsWebMcpModelContext = {
    registerTool(tool, options) {
      tools.push(tool);
      registrationSignal = options?.signal;
      registrationSignal?.addEventListener("abort", () => { abortEvents += 1; });
      return registration;
    },
  };

  const dispose = registerOperationsListingPipelineTool({
    modelContext,
    executeRead: async () => {
      executionCalls += 1;
      return LISTING_RESULT;
    },
    onRegistrationError: () => { registrationErrors += 1; },
  });

  rejectRegistration?.(new Error("private registration detail"));
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(tools.length, 1);
  assert.equal(tools[0]?.name, "read_listing_pipeline");
  assert.equal(registrationErrors, 1);
  assert.equal(registrationSignal?.aborted, true);
  assert.equal(abortEvents, 1);
  const staleResult = await tools[0]!.execute({});
  assert.equal("error" in staleResult ? staleResult.error.code : undefined, "STALE_RESULT");
  assert.equal(executionCalls, 0);

  dispose();
  assert.equal(registrationSignal?.aborted, true);
  assert.equal(registrationErrors, 1);
  assert.equal(abortEvents, 1);
});

test("a synchronous registration failure signals once and deactivates the captured tool", async () => {
  const tools: OperationsListingPipelineTool[] = [];
  let registrationSignal: AbortSignal | undefined;
  let executionCalls = 0;
  let registrationErrors = 0;
  let abortEvents = 0;
  const modelContext: OperationsWebMcpModelContext = {
    registerTool(tool, options) {
      tools.push(tool);
      registrationSignal = options?.signal;
      registrationSignal?.addEventListener("abort", () => { abortEvents += 1; });
      throw new Error("private registration detail");
    },
  };

  const dispose = registerOperationsListingPipelineTool({
    modelContext,
    executeRead: async () => {
      executionCalls += 1;
      return LISTING_RESULT;
    },
    onRegistrationError: () => { registrationErrors += 1; },
  });

  assert.equal(registrationErrors, 1);
  assert.equal(registrationSignal?.aborted, true);
  assert.equal(abortEvents, 1);
  const result = await tools[0]!.execute({});
  assert.equal("error" in result ? result.error.code : undefined, "STALE_RESULT");
  assert.equal(executionCalls, 0);
  dispose();
  assert.equal(registrationErrors, 1);
  assert.equal(abortEvents, 1);
});

test("a registration rejection arriving after disposal cannot signal a dead page", async () => {
  let rejectRegistration: ((reason?: unknown) => void) | undefined;
  let registrationSignal: AbortSignal | undefined;
  let registrationErrors = 0;
  const registration = new Promise<unknown>((_resolve, reject) => {
    rejectRegistration = reject;
  });
  const dispose = registerOperationsListingPipelineTool({
    modelContext: {
      registerTool(_tool, options) {
        registrationSignal = options?.signal;
        return registration;
      },
    },
    executeRead: async () => LISTING_RESULT,
    onRegistrationError: () => { registrationErrors += 1; },
  });

  dispose();
  rejectRegistration?.(new Error("late private registration detail"));
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(registrationSignal?.aborted, true);
  assert.equal(registrationErrors, 0);
});

test("valid structured input reaches only listingPipeline and returns the adopted result", async () => {
  let receivedQuery: unknown;
  let receivedSignal: AbortSignal | undefined;
  const controller = new AbortController();
  const tool = createOperationsListingPipelineTool(async (query, options) => {
    receivedQuery = query;
    receivedSignal = options?.signal;
    return LISTING_RESULT;
  });

  const result = await tool.execute({
    area: "North",
    publicationState: "PUBLISHED",
    lifecycleState: "OPEN",
    minPublishedAgeDays: 14,
  }, { signal: controller.signal });

  assert.deepEqual(receivedQuery, LISTING_RESULT.filters);
  assert.equal(receivedSignal, controller.signal);
  assert.deepEqual(result, LISTING_RESULT);
});

test("unknown and malformed input fails before page execution without normalization", async () => {
  let calls = 0;
  const tool = createOperationsListingPipelineTool(async () => {
    calls += 1;
    return LISTING_RESULT;
  });
  const invalidInputs: unknown[] = [
    null,
    [],
    "North",
    { kind: "listingPipeline" },
    { area: "" },
    { area: " " },
    { area: " North" },
    { area: "North " },
    { area: "North\nSouth" },
    { area: "a".repeat(81) },
    { publicationState: "published" },
    { publicationState: null },
    { lifecycleState: "CLOSED" },
    { minPublishedAgeDays: -1 },
    { minPublishedAgeDays: 1.5 },
    { minPublishedAgeDays: Number.MAX_SAFE_INTEGER + 1 },
    { minPublishedAgeDays: Number.POSITIVE_INFINITY },
    new Date(),
  ];

  for (const input of invalidInputs) {
    const result = await tool.execute(input);
    assert.equal("error" in result ? result.error.code : undefined, "VALIDATION_FAILED");
  }
  assert.equal(calls, 0);
});

test("Area remains exact and case-sensitive without client normalization", async () => {
  let receivedQuery: unknown;
  const emptyResult: Extract<OperationsApiResponse, { filters: { kind: "listingPipeline" } }> = {
    ...LISTING_RESULT,
    filters: { kind: "listingPipeline", area: "north" },
    totalCount: 0,
    returnedCount: 0,
    counts: {
      publicationState: { PUBLISHED: 0, UNPUBLISHED: 0 },
      lifecycleState: { OPEN: 0, UNAVAILABLE: 0, LET_AGREED: 0, ARCHIVED: 0 },
    },
    items: [],
  };
  const tool = createOperationsListingPipelineTool(async (query) => {
    receivedQuery = query;
    return emptyResult;
  });

  const result = await tool.execute({ area: "north" });
  assert.deepEqual(receivedQuery, { kind: "listingPipeline", area: "north" });
  assert.deepEqual(result, emptyResult);
});

test("Area and minimum-age protocol boundaries are inclusive", async () => {
  const receivedQueries: unknown[] = [];
  const tool = createOperationsListingPipelineTool(async (query) => {
    receivedQueries.push(query);
    return {
      ...LISTING_RESULT,
      filters: query,
      totalCount: 0,
      returnedCount: 0,
      counts: {
        publicationState: { PUBLISHED: 0, UNPUBLISHED: 0 },
        lifecycleState: { OPEN: 0, UNAVAILABLE: 0, LET_AGREED: 0, ARCHIVED: 0 },
      },
      items: [],
    };
  });

  const oneCharacter = await tool.execute({ area: "N", minPublishedAgeDays: 0 });
  const eightyCharacters = await tool.execute({
    area: "N".repeat(80),
    minPublishedAgeDays: Number.MAX_SAFE_INTEGER,
  });

  assert.equal("error" in oneCharacter, false);
  assert.equal("error" in eightyCharacters, false);
  assert.deepEqual(receivedQueries, [
    { kind: "listingPipeline", area: "N", minPublishedAgeDays: 0 },
    {
      kind: "listingPipeline",
      area: "N".repeat(80),
      minPublishedAgeDays: Number.MAX_SAFE_INTEGER,
    },
  ]);
});

test("empty success remains success and bounded failures never expose raw diagnostics", async () => {
  const emptyResult: Extract<OperationsApiResponse, { filters: { kind: "listingPipeline" } }> = {
    ...LISTING_RESULT,
    filters: { kind: "listingPipeline" },
    totalCount: 0,
    returnedCount: 0,
    counts: {
      publicationState: { PUBLISHED: 0, UNPUBLISHED: 0 },
      lifecycleState: { OPEN: 0, UNAVAILABLE: 0, LET_AGREED: 0, ARCHIVED: 0 },
    },
    items: [],
  };
  const emptyTool = createOperationsListingPipelineTool(async () => emptyResult);
  assert.deepEqual(await emptyTool.execute({}), emptyResult);

  const cases = [
    [new OperationsApiError(400, "VALIDATION_FAILED", "private"), "VALIDATION_FAILED"],
    [new OperationsApiError(401, "UNAUTHENTICATED", "private"), "UNAUTHENTICATED"],
    [new OperationsApiError(403, "FORBIDDEN", "private"), "FORBIDDEN"],
    [new OperationsApiError(503, "PERSISTENCE_ERROR", "private"), "PERSISTENCE_ERROR"],
    [new OperationsApiError(503, "AUTHORITY_UNAVAILABLE", "private"), "AUTHORITY_UNAVAILABLE"],
    [new OperationsApiError(200, "INVALID_RESPONSE", "private"), "INVALID_RESPONSE"],
    [new OperationsReadStaleError(), "STALE_RESULT"],
    [new Error("databasePath=/private/path"), "AUTHORITY_UNAVAILABLE"],
  ] as const;

  for (const [failure, code] of cases) {
    const tool = createOperationsListingPipelineTool(async () => { throw failure; });
    const result = await tool.execute({});
    assert.equal("error" in result ? result.error.code : undefined, code);
    assert.equal(JSON.stringify(result).includes("private"), false);
    assert.equal(JSON.stringify(result).includes("databasePath"), false);
  }
});

test("the tool fails closed when its page executor returns an expanded runtime object", async () => {
  const expandedResult = { ...LISTING_RESULT, databasePath: "/private/rightspot.sqlite" };
  const tool = createOperationsListingPipelineTool(async () => expandedResult);
  const result = await tool.execute({
    area: "North",
    publicationState: "PUBLISHED",
    lifecycleState: "OPEN",
    minPublishedAgeDays: 14,
  });

  assert.deepEqual(result, {
    error: {
      code: "INVALID_RESPONSE",
      message: "The Operations response was invalid. Retry the current page.",
    },
  });
  assert.equal(JSON.stringify(result).includes("databasePath"), false);
});

test("teardown and caller abort make in-flight invocations stale", async () => {
  const tools: OperationsListingPipelineTool[] = [];
  let release: (() => void) | undefined;
  let delegatedSignal: AbortSignal | undefined;
  const modelContext: OperationsWebMcpModelContext = {
    registerTool(tool) { tools.push(tool); },
  };
  const dispose = registerOperationsListingPipelineTool({
    modelContext,
    executeRead: async (_query, options) => {
      delegatedSignal = options?.signal;
      await new Promise<void>((resolvePromise) => { release = resolvePromise; });
      return LISTING_RESULT;
    },
  });
  const tool = tools[0];
  assert.ok(tool);
  const pending = tool.execute({});
  await Promise.resolve();
  dispose();
  assert.equal(delegatedSignal?.aborted, true);
  release?.();
  const staleResult = await pending;
  assert.equal("error" in staleResult ? staleResult.error.code : undefined, "STALE_RESULT");

  const caller = new AbortController();
  let releaseCaller: (() => void) | undefined;
  const callerTool = createOperationsListingPipelineTool(async () => {
    await new Promise<void>((resolvePromise) => { releaseCaller = resolvePromise; });
    return LISTING_RESULT;
  });
  const callerPending = callerTool.execute({}, { signal: caller.signal });
  caller.abort();
  releaseCaller?.();
  const callerResult = await callerPending;
  assert.equal("error" in callerResult ? callerResult.error.code : undefined, "STALE_RESULT");
});

test("unsupported capability does not register and the adapter stays inside the resolved Agent page", () => {
  let calls = 0;
  const dispose = registerOperationsListingPipelineTool({
    modelContext: null,
    executeRead: async () => {
      calls += 1;
      return LISTING_RESULT;
    },
  });
  dispose();
  assert.equal(calls, 0);

  const page = readFileSync(PAGE_PATH, "utf8");
  const frameStart = page.indexOf("<RolePageFrame");
  const frameGate = page.indexOf('currentPath="/agent/operations"');
  const adapterStart = page.indexOf("<OperationsWebMcp");
  assert.ok(frameStart >= 0);
  assert.ok(frameGate > frameStart);
  assert.ok(adapterStart > frameGate);
  assert.match(page, /<OperationsWebMcp[\s\S]*executeRead=\{executeRead\}/);
  assert.match(page, /cancelReads=\{cancelReads\}/);
  assert.match(page, /onRegistrationError=\{handleOperationsRegistrationError\}/);
  assert.match(page, /const handleOperationsRegistrationError = useCallback/);
  assert.match(page, /Operations assistance is unavailable in this session\. Use the manual controls below\./);
  assert.equal(page.includes("private registration detail"), false);
  const adapter = readFileSync(ADAPTER_PATH, "utf8");
  assert.match(adapter, /\}, \[cancelReads, executeRead, onRegistrationError\]\);/);
  assert.match(page, /Run operations read/);
  assert.match(page, /Clear filters/);
  assert.match(page, /Retry operations read/);
});

test("authoritative Operations UNAUTHENTICATED deactivates immediately without confirmation", async () => {
  const tools: OperationsListingPipelineTool[] = [];
  let registrationSignal: AbortSignal | undefined;
  let sessionReads = 0;
  const dispose = registerOperationsListingPipelineTool({
    modelContext: {
      registerTool(tool, options) {
        tools.push(tool);
        registrationSignal = options?.signal;
      },
    },
    executeRead: async () => {
      throw new OperationsApiError(401, "UNAUTHENTICATED", "private");
    },
    readCurrentSession: async () => {
      sessionReads += 1;
      return { id: "agent-primary", role: "agent" };
    },
  });

  const result = await tools[0]!.execute({});
  assert.equal("error" in result ? result.error.code : undefined, "UNAUTHENTICATED");
  assert.equal(sessionReads, 0);
  assert.equal(registrationSignal?.aborted, true);
  dispose();
});

test("Operations FORBIDDEN deactivates only after one session read confirms null or wrong role", async () => {
  for (const confirmedActor of [null, { id: "tenant-primary", role: "tenant" } as const]) {
    const tools: OperationsListingPipelineTool[] = [];
    let registrationSignal: AbortSignal | undefined;
    let sessionReads = 0;
    const dispose = registerOperationsListingPipelineTool({
      modelContext: {
        registerTool(tool, options) {
          tools.push(tool);
          registrationSignal = options?.signal;
        },
      },
      executeRead: async () => {
        throw new OperationsApiError(403, "FORBIDDEN", "private");
      },
      readCurrentSession: async () => {
        sessionReads += 1;
        return confirmedActor;
      },
    });

    const result = await tools[0]!.execute({});
    assert.equal("error" in result ? result.error.code : undefined, "FORBIDDEN");
    assert.equal(sessionReads, 1);
    assert.equal(registrationSignal?.aborted, true);
    dispose();
  }
});

test("unassigned-Agent FORBIDDEN and unavailable confirmation preserve the registration", async () => {
  for (const readCurrentSession of [
    async () => ({ id: "agent-unassigned", role: "agent" } as const),
    async () => { throw new Error("session service unavailable"); },
  ]) {
    const tools: OperationsListingPipelineTool[] = [];
    let registrationSignal: AbortSignal | undefined;
    let sessionReads = 0;
    const dispose = registerOperationsListingPipelineTool({
      modelContext: {
        registerTool(tool, options) {
          tools.push(tool);
          registrationSignal = options?.signal;
        },
      },
      executeRead: async () => {
        throw new OperationsApiError(403, "FORBIDDEN", "private");
      },
      readCurrentSession: async () => {
        sessionReads += 1;
        return await readCurrentSession();
      },
    });

    const result = await tools[0]!.execute({});
    assert.equal("error" in result ? result.error.code : undefined, "FORBIDDEN");
    assert.equal(sessionReads, 1);
    assert.equal(registrationSignal?.aborted, false);
    dispose();
  }
});
