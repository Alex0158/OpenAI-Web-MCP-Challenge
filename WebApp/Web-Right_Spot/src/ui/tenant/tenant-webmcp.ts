"use client";

import { useEffect, useRef } from "react";
import {
  TenantApiError,
  type TenantListingFilters,
  type TenantListingsResponse,
} from "./tenant-api";

const MAX_MONTHLY_RENT_GBP = 100000;
const MAX_LISTING_SIZE_SQ_M = 10000;
const MAX_LISTING_AREA_LENGTH = 80;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SEARCH_FILTER_NAMES = new Set(["area", "maxRent", "minSizeSqM", "availableBy"]);

export const TENANT_SEARCH_TOOL_NAME = "search_listings";
export const TENANT_SEARCH_TOOL_TITLE = "Search published rental listings";
export const TENANT_SEARCH_TOOL_DESCRIPTION =
  "Find published rental listings on the Tenant Discovery page using area, maximum rent, minimum size, and available-by date.";

type StringSchemaProperty = {
  type: "string";
  description?: string;
  format?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

type IntegerSchemaProperty = {
  type: "integer";
  description?: string;
  minimum: number;
  maximum: number;
};

export type TenantSearchInputSchema = {
  type: "object";
  additionalProperties: false;
  properties: {
    area: StringSchemaProperty;
    maxRent: IntegerSchemaProperty;
    minSizeSqM: IntegerSchemaProperty;
    availableBy: StringSchemaProperty;
  };
};

export const TENANT_SEARCH_INPUT_SCHEMA: TenantSearchInputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    area: {
      type: "string",
      minLength: 1,
      maxLength: MAX_LISTING_AREA_LENGTH,
      description: "Exact published canonical area after trim and case normalization.",
    },
    maxRent: {
      type: "integer",
      minimum: 1,
      maximum: MAX_MONTHLY_RENT_GBP,
      description: "Maximum monthly rent in GBP.",
    },
    minSizeSqM: {
      type: "integer",
      minimum: 1,
      maximum: MAX_LISTING_SIZE_SQ_M,
      description: "Minimum property size in square metres.",
    },
    availableBy: {
      type: "string",
      format: "date",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      description: "Inclusive date-only availability boundary in YYYY-MM-DD form.",
    },
  },
};

export type WebMcpModelContext = {
  registerTool: (
    tool: TenantSearchTool,
    options?: { signal?: AbortSignal },
  ) => Promise<unknown> | unknown;
};

export type TenantSearchExecutor = (
  filters: TenantListingFilters,
  options?: { signal?: AbortSignal },
) => Promise<TenantListingsResponse>;

export type TenantSearchErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "PERSISTENCE_ERROR"
  | "INVALID_RESPONSE"
  | "STALE_RESULT";

export type TenantSearchToolError = {
  error: {
    code: TenantSearchErrorCode;
    message: string;
  };
};

export type TenantSearchToolResult = TenantListingsResponse | TenantSearchToolError;

export type TenantSearchTool = {
  name: typeof TENANT_SEARCH_TOOL_NAME;
  title: typeof TENANT_SEARCH_TOOL_TITLE;
  description: typeof TENANT_SEARCH_TOOL_DESCRIPTION;
  inputSchema: TenantSearchInputSchema;
  annotations: {
    readOnlyHint: true;
    untrustedContentHint: true;
  };
  execute: (
    input: unknown,
    client?: { signal?: AbortSignal },
  ) => Promise<TenantSearchToolResult>;
};

export class TenantSearchStaleError extends Error {
  constructor() {
    super("The search was cancelled or superseded");
    this.name = "TenantSearchStaleError";
  }
}

export function detectModelContext(source: unknown): WebMcpModelContext | null {
  if (!isRecord(source) || !isRecord(source.modelContext)) return null;
  if (typeof source.modelContext.registerTool !== "function") return null;
  return source.modelContext as unknown as WebMcpModelContext;
}

export function getRuntimeModelContext(): WebMcpModelContext | null {
  if (typeof document === "undefined") return null;
  return detectModelContext(document);
}

export function createTenantSearchTool(executeSearch: TenantSearchExecutor): TenantSearchTool {
  return {
    name: TENANT_SEARCH_TOOL_NAME,
    title: TENANT_SEARCH_TOOL_TITLE,
    description: TENANT_SEARCH_TOOL_DESCRIPTION,
    inputSchema: TENANT_SEARCH_INPUT_SCHEMA,
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: true,
    },
    execute: async (input, client = {}) => {
      if (client.signal?.aborted) return staleResult();

      const parsed = parseTenantSearchInput(input);
      if (!parsed.ok) return parsed.error;

      try {
        const result = await executeSearch(parsed.filters, { signal: client.signal });
        if (client.signal?.aborted) return staleResult();
        return result;
      } catch (error: unknown) {
        return mapSearchError(error);
      }
    },
  };
}

export function registerTenantSearchTool({
  modelContext,
  executeSearch,
  onRegistrationError,
}: {
  modelContext: WebMcpModelContext | null;
  executeSearch: TenantSearchExecutor;
  onRegistrationError?: (error: unknown) => void;
}): () => void {
  const registrationController = new AbortController();
  let active = true;

  if (!modelContext) {
    return () => {
      active = false;
      registrationController.abort();
    };
  }

  const tool = createTenantSearchTool(async (filters, options) => {
    if (!active || registrationController.signal.aborted) {
      throw new TenantSearchStaleError();
    }

    const linkedExecution = linkAbortSignals([registrationController.signal, options?.signal]);
    try {
      const result = await executeSearch(filters, { signal: linkedExecution.signal });
      if (!active || linkedExecution.signal.aborted) {
        throw new TenantSearchStaleError();
      }
      return result;
    } finally {
      linkedExecution.dispose();
    }
  });

  try {
    const registration = modelContext.registerTool(tool, { signal: registrationController.signal });
    void Promise.resolve(registration).catch((error: unknown) => {
      if (active) onRegistrationError?.(error);
    });
  } catch (error: unknown) {
    if (active) onRegistrationError?.(error);
  }

  return () => {
    active = false;
    registrationController.abort();
  };
}

export default function TenantWebMcp({
  executeSearch,
  cancelSearches,
}: {
  executeSearch: TenantSearchExecutor;
  cancelSearches: () => void;
}) {
  const lifecycleGeneration = useRef(0);

  useEffect(() => {
    const generation = ++lifecycleGeneration.current;
    const dispose = registerTenantSearchTool({
      modelContext: getRuntimeModelContext(),
      executeSearch,
    });

    return () => {
      dispose();
      queueMicrotask(() => {
        if (lifecycleGeneration.current === generation) cancelSearches();
      });
    };
  }, [cancelSearches, executeSearch]);

  return null;
}

function parseTenantSearchInput(value: unknown):
  | { ok: true; filters: TenantListingFilters }
  | { ok: false; error: TenantSearchToolError } {
  if (!isRecord(value)) return { ok: false, error: validationResult() };
  if (Object.keys(value).some((name) => !SEARCH_FILTER_NAMES.has(name))) {
    return { ok: false, error: validationResult() };
  }

  const filters: TenantListingFilters = {};
  if (hasOwn(value, "area")) {
    const area = typeof value.area === "string" ? value.area.trim() : "";
    if (area.length === 0 || area.length > MAX_LISTING_AREA_LENGTH) {
      return { ok: false, error: validationResult() };
    }
    filters.area = area;
  }
  if (hasOwn(value, "maxRent")) {
    if (!isBoundedInteger(value.maxRent, 1, MAX_MONTHLY_RENT_GBP)) {
      return { ok: false, error: validationResult() };
    }
    filters.maxRent = value.maxRent;
  }
  if (hasOwn(value, "minSizeSqM")) {
    if (!isBoundedInteger(value.minSizeSqM, 1, MAX_LISTING_SIZE_SQ_M)) {
      return { ok: false, error: validationResult() };
    }
    filters.minSizeSqM = value.minSizeSqM;
  }
  if (hasOwn(value, "availableBy")) {
    if (typeof value.availableBy !== "string" || !isIsoDate(value.availableBy)) {
      return { ok: false, error: validationResult() };
    }
    filters.availableBy = value.availableBy;
  }

  return { ok: true, filters };
}

function mapSearchError(error: unknown): TenantSearchToolError {
  if (error instanceof TenantSearchStaleError) return staleResult();

  const status = error instanceof TenantApiError
    ? error.status
    : isRecord(error) && typeof error.status === "number" ? error.status : null;
  if (status === 400) return validationResult();
  if (status === 401) return boundedResult("UNAUTHENTICATED", "An authenticated Tenant session is required.");
  if (status === 403) return boundedResult("FORBIDDEN", "Tenant access is required for this search.");
  if (status === 200) return boundedResult("INVALID_RESPONSE", "The search response was invalid. Retry the current page.");
  return boundedResult("PERSISTENCE_ERROR", "The listing service is unavailable. Retry the current page.");
}

function validationResult(): TenantSearchToolError {
  return boundedResult(
    "VALIDATION_FAILED",
    "Search arguments are invalid. Check the four bounded criteria and try again.",
  );
}

function staleResult(): TenantSearchToolError {
  return boundedResult("STALE_RESULT", "The search was cancelled or superseded. Retry the latest search.");
}

function boundedResult(code: TenantSearchErrorCode, message: string): TenantSearchToolError {
  return { error: { code, message } };
}

function isBoundedInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === "number"
    && Number.isSafeInteger(value)
    && value >= min
    && value <= max;
}

function isIsoDate(value: string): boolean {
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  return ISO_DATE_PATTERN.test(value)
    && Number.isFinite(parsed)
    && new Date(parsed).toISOString().slice(0, 10) === value;
}

function hasOwn(value: Record<string, unknown>, name: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, name);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function linkAbortSignals(signals: readonly (AbortSignal | undefined)[]): {
  signal: AbortSignal;
  dispose: () => void;
} {
  const controller = new AbortController();
  const presentSignals = signals.filter((signal): signal is AbortSignal => signal !== undefined);
  const abort = () => controller.abort();

  for (const signal of presentSignals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener("abort", abort, { once: true });
  }

  return {
    signal: controller.signal,
    dispose: () => {
      for (const signal of presentSignals) signal.removeEventListener("abort", abort);
    },
  };
}
