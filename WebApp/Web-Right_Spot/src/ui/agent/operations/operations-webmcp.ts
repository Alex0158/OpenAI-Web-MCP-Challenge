"use client";

import { useEffect, useRef } from "react";
import type { OperationsApiResponse } from "../../../shared/contracts/operations-api";
import { readSession, type SessionActor } from "../../shared/session-api";
import {
  OperationsApiError,
  reconstructOperationsResponse,
  type OperationsQuery,
} from "./operations-api";

const INPUT_NAMES = new Set([
  "area",
  "publicationState",
  "lifecycleState",
  "minPublishedAgeDays",
]);
const AREA_PATTERN = /^(?:\S|\S.*\S)$/;

export const OPERATIONS_LISTING_PIPELINE_TOOL_NAME = "read_listing_pipeline";
export const OPERATIONS_LISTING_PIPELINE_TOOL_TITLE = "Read listing pipeline";
export const OPERATIONS_LISTING_PIPELINE_TOOL_DESCRIPTION =
  "Read the assigned agent's current listing pipeline on the Operations page using optional area, publication state, lifecycle state, and minimum published age filters.";

export const OPERATIONS_LISTING_PIPELINE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    area: {
      type: "string",
      minLength: 1,
      maxLength: 80,
      pattern: "^(?:\\S|\\S.*\\S)$",
    },
    publicationState: {
      type: "string",
      enum: ["PUBLISHED", "UNPUBLISHED"],
    },
    lifecycleState: {
      type: "string",
      enum: ["OPEN", "UNAVAILABLE", "LET_AGREED", "ARCHIVED"],
    },
    minPublishedAgeDays: {
      type: "integer",
      minimum: 0,
      maximum: Number.MAX_SAFE_INTEGER,
    },
  },
} as const;

type ListingPipelineQuery = Extract<OperationsQuery, { kind: "listingPipeline" }>;
type ListingPipelineResponse = Extract<OperationsApiResponse, { filters: { kind: "listingPipeline" } }>;

export type OperationsListingPipelineExecutor = (
  query: ListingPipelineQuery,
  options?: { signal?: AbortSignal },
) => Promise<OperationsApiResponse>;

export type OperationsToolErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "PERSISTENCE_ERROR"
  | "AUTHORITY_UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "STALE_RESULT";

export type OperationsToolError = {
  error: {
    code: OperationsToolErrorCode;
    message: string;
  };
};

export type OperationsListingPipelineToolResult = ListingPipelineResponse | OperationsToolError;

export type OperationsListingPipelineTool = {
  name: typeof OPERATIONS_LISTING_PIPELINE_TOOL_NAME;
  title: typeof OPERATIONS_LISTING_PIPELINE_TOOL_TITLE;
  description: typeof OPERATIONS_LISTING_PIPELINE_TOOL_DESCRIPTION;
  inputSchema: typeof OPERATIONS_LISTING_PIPELINE_INPUT_SCHEMA;
  annotations: {
    readOnlyHint: true;
    untrustedContentHint: true;
  };
  execute: (
    input: unknown,
    client?: { signal?: AbortSignal },
  ) => Promise<OperationsListingPipelineToolResult>;
};

export type OperationsWebMcpModelContext = {
  registerTool: (
    tool: OperationsListingPipelineTool,
    options?: { signal?: AbortSignal },
  ) => Promise<unknown> | unknown;
};

export class OperationsReadStaleError extends Error {
  constructor() {
    super("The Operations read was cancelled or superseded");
    this.name = "OperationsReadStaleError";
  }
}

export function detectOperationsModelContext(source: unknown): OperationsWebMcpModelContext | null {
  if (!isRecord(source) || !isRecord(source.modelContext)) return null;
  if (typeof source.modelContext.registerTool !== "function") return null;
  return source.modelContext as unknown as OperationsWebMcpModelContext;
}

function getRuntimeModelContext(): OperationsWebMcpModelContext | null {
  if (typeof document === "undefined") return null;
  return detectOperationsModelContext(document);
}

export function createOperationsListingPipelineTool(
  executeRead: OperationsListingPipelineExecutor,
): OperationsListingPipelineTool {
  return {
    name: OPERATIONS_LISTING_PIPELINE_TOOL_NAME,
    title: OPERATIONS_LISTING_PIPELINE_TOOL_TITLE,
    description: OPERATIONS_LISTING_PIPELINE_TOOL_DESCRIPTION,
    inputSchema: OPERATIONS_LISTING_PIPELINE_INPUT_SCHEMA,
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: true,
    },
    execute: async (input, client = {}) => {
      if (client.signal?.aborted) return staleResult();
      const parsed = parseInput(input);
      if (!parsed.ok) return parsed.error;

      try {
        const result = await executeRead(parsed.query, { signal: client.signal });
        if (client.signal?.aborted) return staleResult();
        try {
          return reconstructOperationsResponse(result, parsed.query) as ListingPipelineResponse;
        } catch {
          return boundedResult(
            "INVALID_RESPONSE",
            "The Operations response was invalid. Retry the current page.",
          );
        }
      } catch (error: unknown) {
        return mapError(error);
      }
    },
  };
}

export function registerOperationsListingPipelineTool({
  modelContext,
  executeRead,
  readCurrentSession = readSession,
  onRegistrationError,
}: {
  modelContext: OperationsWebMcpModelContext | null;
  executeRead: OperationsListingPipelineExecutor;
  readCurrentSession?: () => Promise<SessionActor | null>;
  onRegistrationError?: (error: unknown) => void;
}): () => void {
  const registrationController = new AbortController();
  let active = true;
  const deactivate = () => {
    active = false;
    registrationController.abort();
  };
  const failRegistration = (error: unknown) => {
    if (!active) return;
    deactivate();
    onRegistrationError?.(error);
  };

  if (!modelContext) {
    return deactivate;
  }

  const tool = createOperationsListingPipelineTool(async (query, options) => {
    if (!active || registrationController.signal.aborted) throw new OperationsReadStaleError();
    const linkedExecution = linkAbortSignals([registrationController.signal, options?.signal]);
    try {
      const result = await executeRead(query, { signal: linkedExecution.signal });
      if (!active || linkedExecution.signal.aborted) throw new OperationsReadStaleError();
      return result;
    } catch (error: unknown) {
      if (error instanceof OperationsApiError) {
        if (error.code === "UNAUTHENTICATED") {
          deactivate();
        } else if (error.code === "FORBIDDEN") {
          try {
            const actor = await readCurrentSession();
            if (actor === null || actor.role !== "agent") deactivate();
          } catch {
            // The original bounded FORBIDDEN remains authoritative when confirmation is unavailable.
          }
        }
      }
      throw error;
    } finally {
      linkedExecution.dispose();
    }
  });

  try {
    const registration = modelContext.registerTool(tool, { signal: registrationController.signal });
    void Promise.resolve(registration).catch((error: unknown) => {
      failRegistration(error);
    });
  } catch (error: unknown) {
    failRegistration(error);
  }

  return deactivate;
}

export default function OperationsWebMcp({
  executeRead,
  cancelReads,
  onRegistrationError,
}: {
  executeRead: OperationsListingPipelineExecutor;
  cancelReads: () => void;
  onRegistrationError: (error: unknown) => void;
}) {
  const lifecycleGeneration = useRef(0);

  useEffect(() => {
    const generation = ++lifecycleGeneration.current;
    const dispose = registerOperationsListingPipelineTool({
      modelContext: getRuntimeModelContext(),
      executeRead,
      onRegistrationError,
    });

    return () => {
      dispose();
      queueMicrotask(() => {
        if (lifecycleGeneration.current === generation) cancelReads();
      });
    };
  }, [cancelReads, executeRead, onRegistrationError]);

  return null;
}

function parseInput(value: unknown):
  | { ok: true; query: ListingPipelineQuery }
  | { ok: false; error: OperationsToolError } {
  if (!isPlainRecord(value)) return { ok: false, error: validationResult() };
  if (Object.keys(value).some((name) => !INPUT_NAMES.has(name))) {
    return { ok: false, error: validationResult() };
  }

  const query: ListingPipelineQuery = { kind: "listingPipeline" };
  if (hasOwn(value, "area")) {
    if (typeof value.area !== "string"
      || value.area.length < 1
      || value.area.length > 80
      || !AREA_PATTERN.test(value.area)) {
      return { ok: false, error: validationResult() };
    }
    query.area = value.area;
  }
  if (hasOwn(value, "publicationState")) {
    if (value.publicationState !== "PUBLISHED" && value.publicationState !== "UNPUBLISHED") {
      return { ok: false, error: validationResult() };
    }
    query.publicationState = value.publicationState;
  }
  if (hasOwn(value, "lifecycleState")) {
    if (value.lifecycleState !== "OPEN"
      && value.lifecycleState !== "UNAVAILABLE"
      && value.lifecycleState !== "LET_AGREED"
      && value.lifecycleState !== "ARCHIVED") {
      return { ok: false, error: validationResult() };
    }
    query.lifecycleState = value.lifecycleState;
  }
  if (hasOwn(value, "minPublishedAgeDays")) {
    if (!isBoundedInteger(value.minPublishedAgeDays, 0, Number.MAX_SAFE_INTEGER)) {
      return { ok: false, error: validationResult() };
    }
    query.minPublishedAgeDays = value.minPublishedAgeDays;
  }
  return { ok: true, query };
}

function mapError(error: unknown): OperationsToolError {
  if (error instanceof OperationsReadStaleError) return staleResult();
  if (error instanceof OperationsApiError) {
    if (error.code === "VALIDATION_FAILED") return validationResult();
    if (error.code === "UNAUTHENTICATED") {
      return boundedResult("UNAUTHENTICATED", "An authenticated Agent session is required.");
    }
    if (error.code === "FORBIDDEN") {
      return boundedResult("FORBIDDEN", "The assigned Agent Operations profile is unavailable.");
    }
    if (error.code === "PERSISTENCE_ERROR") {
      return boundedResult("PERSISTENCE_ERROR", "The Operations service is unavailable. Retry the current page.");
    }
    if (error.code === "AUTHORITY_UNAVAILABLE") {
      return boundedResult("AUTHORITY_UNAVAILABLE", "The Operations authority is unavailable. Retry after it is restored.");
    }
    if (error.code === "INVALID_RESPONSE") {
      return boundedResult("INVALID_RESPONSE", "The Operations response was invalid. Retry the current page.");
    }
  }
  return boundedResult("AUTHORITY_UNAVAILABLE", "The Operations service is unavailable. Retry the current page.");
}

function validationResult(): OperationsToolError {
  return boundedResult(
    "VALIDATION_FAILED",
    "Listing pipeline arguments are invalid. Check the four bounded filters and try again.",
  );
}

function staleResult(): OperationsToolError {
  return boundedResult(
    "STALE_RESULT",
    "The Operations read was cancelled or superseded. Retry the latest read.",
  );
}

function boundedResult(code: OperationsToolErrorCode, message: string): OperationsToolError {
  return { error: { code, message } };
}

function isBoundedInteger(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number"
    && Number.isSafeInteger(value)
    && value >= minimum
    && value <= maximum;
}

function hasOwn(value: Record<string, unknown>, name: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, name);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
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
