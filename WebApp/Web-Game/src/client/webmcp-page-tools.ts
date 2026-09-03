"use client";

import {
  PAGE_TOOL_INPUT_SCHEMAS,
  PAGE_TOOL_NAMES,
  PAGE_TOOLS_EXECUTE_PATH,
  type PageToolName,
  type PageToolResult,
} from "../shared/page-tool-contract";

export type WebMcpPageStatus = "unsupported" | "registering" | "registered" | "stale" | "error";

export interface WebMcpToolExecuteOptions {
  readonly signal: AbortSignal;
}

export interface WebMcpRegisteredTool {
  readonly name: string;
  readonly inputSchema: string | Record<string, unknown>;
}

export interface WebMcpToolDefinition {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
  readonly annotations?: { readonly readOnlyHint?: boolean; readonly untrustedContentHint?: boolean };
  readonly execute: (input: Record<string, unknown>, options: WebMcpToolExecuteOptions) => Promise<unknown>;
}

export interface WebMcpModelContext {
  registerTool(tool: WebMcpToolDefinition, options?: { readonly signal?: AbortSignal }): Promise<undefined>;
  getTools(options?: { readonly fromOrigins?: readonly string[] }): Promise<readonly WebMcpRegisteredTool[]>;
}

export interface WebMcpPageToolRegistrarOptions {
  readonly onStatus: (status: WebMcpPageStatus, message: string) => void;
  readonly onReconcile: () => void;
  readonly fetchImpl?: typeof fetch;
}

export interface WebMcpPageToolRegistrar {
  start(): Promise<void>;
  stop(reason?: "reconnect" | "unmount" | "error"): void;
  readonly status: WebMcpPageStatus;
}

function modelContextFromDocument(): WebMcpModelContext | null {
  if (typeof document === "undefined") {
    return null;
  }
  const candidate = (document as Document & { readonly modelContext?: unknown }).modelContext;
  if (!candidate || typeof candidate !== "object") {
    return null;
  }
  const value = candidate as Partial<WebMcpModelContext>;
  return typeof value.registerTool === "function" && typeof value.getTools === "function"
    ? value as WebMcpModelContext
    : null;
}

function cloneSchema(tool: PageToolName): Record<string, unknown> {
  return structuredClone(PAGE_TOOL_INPUT_SCHEMAS[tool]);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function schemaFromRegisteredTool(tool: WebMcpRegisteredTool): Record<string, unknown> | null {
  if (typeof tool.inputSchema === "string") {
    try {
      const parsed = JSON.parse(tool.inputSchema) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : null;
    } catch {
      return null;
    }
  }
  return tool.inputSchema && typeof tool.inputSchema === "object" && !Array.isArray(tool.inputSchema)
    ? tool.inputSchema
    : null;
}

function readModelContextStatus(): { readonly context: WebMcpModelContext | null; readonly message: string } {
  const context = modelContextFromDocument();
  return context
    ? { context, message: "WebMCP page API detected; registering the server-bound read tools." }
    : { context: null, message: "WebMCP is unavailable in this browser. Human controls remain available." };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isContinuationResult(value: unknown): value is PageToolResult & {
  readonly tool: "inspect_shelter_state";
  readonly continuation: { readonly signal_id: string; readonly bounded_action: "force_recall_soldier" };
} {
  return isRecord(value)
    && value.tool === "inspect_shelter_state"
    && isRecord(value.continuation)
    && typeof value.continuation.signal_id === "string"
    && value.continuation.signal_id.trim() !== ""
    && value.continuation.bounded_action === "force_recall_soldier";
}

function readToolNames(tools: readonly WebMcpRegisteredTool[]): Set<string> {
  return new Set(tools.map((tool) => tool.name));
}

export function createWebMcpPageToolRegistrar(options: WebMcpPageToolRegistrarOptions): WebMcpPageToolRegistrar {
  const fetchImpl = options.fetchImpl ?? fetch;
  let activeContext: WebMcpModelContext | null = null;
  let controller: AbortController | null = null;
  let generation = 0;
  let currentStatus: WebMcpPageStatus = "unsupported";
  let recallRegistered = false;
  let recallRegistrationPromise: Promise<void> | null = null;

  const setStatus = (status: WebMcpPageStatus, message: string) => {
    currentStatus = status;
    options.onStatus(status, message);
  };

  const execute = async (
    tool: PageToolName,
    input: Record<string, unknown>,
    signal: AbortSignal,
    generationAtStart: number,
  ): Promise<unknown> => {
    const assertCurrentGeneration = (): void => {
      if (generationAtStart !== generation || !controller || controller.signal.aborted) {
        throw new DOMException("The page tool registration is stale.", "AbortError");
      }
    };
    assertCurrentGeneration();
    const response = await fetchImpl(PAGE_TOOLS_EXECUTE_PATH, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tool, input }),
      signal,
    });
    assertCurrentGeneration();
    let value: unknown;
    try {
      value = await response.json();
    } catch {
      assertCurrentGeneration();
      throw new Error("PAGE_TOOL_RESPONSE_INVALID");
    }
    assertCurrentGeneration();
    if (!response.ok) {
      const errorCode = isRecord(value) && typeof value.error_code === "string" ? value.error_code : "RECOVERY_REQUIRED";
      throw new Error(errorCode);
    }
    if (tool === "inspect_shelter_state" && isContinuationResult(value) && !recallRegistered) {
      try {
        await registerRecall(value.continuation.signal_id, generationAtStart);
      } catch (error) {
        if (generationAtStart === generation && controller && !controller.signal.aborted) {
          stop("error");
          setStatus("error", "WebMCP recall registration failed its page-contract readback. Human controls remain available.");
        }
        throw error;
      }
    }
    assertCurrentGeneration();
    if (tool === "force_recall_soldier") {
      options.onReconcile();
    }
    return value;
  };

  const validateReadback = async (context: WebMcpModelContext, includeRecall: boolean): Promise<void> => {
    const tools = await context.getTools();
    const names = readToolNames(tools);
    const required = includeRecall ? PAGE_TOOL_NAMES : PAGE_TOOL_NAMES.filter((name) => name !== "force_recall_soldier");
    for (const name of required) {
      const matching = tools.filter((tool) => tool.name === name);
      if (matching.length !== 1 || canonicalJson(schemaFromRegisteredTool(matching[0] as WebMcpRegisteredTool))
        !== canonicalJson(cloneSchema(name))) {
        throw new Error("PAGE_TOOL_READBACK_MISMATCH");
      }
    }
    if (includeRecall && names.size < required.length) {
      throw new Error("PAGE_TOOL_READBACK_MISMATCH");
    }
  };

  const registerRead = async (tool: PageToolName, generationAtStart: number): Promise<void> => {
    if (!activeContext || !controller || generationAtStart !== generation) {
      throw new DOMException("The page tool registration is stale.", "AbortError");
    }
    await activeContext.registerTool({
      name: tool,
      title: tool === "inspect_shelter_state"
        ? "Inspect shelter state"
        : tool === "inspect_client_snapshot"
          ? "Inspect current game snapshot"
          : tool === "inspect_missions"
            ? "Inspect soldier missions"
            : "Inspect mission history",
      description: tool === "inspect_shelter_state"
        ? "Read the current server-scoped shelter state and any eligible continuation signal."
        : tool === "inspect_client_snapshot"
          ? "Read a bounded server snapshot summary for the current player and shelter."
          : tool === "inspect_missions"
            ? "Read bounded mission summaries for the current shelter."
            : "Read a bounded, scope-filtered page of causal mission history.",
      inputSchema: cloneSchema(tool),
      annotations: { readOnlyHint: true },
      execute: (input, executeOptions) => execute(tool, input, executeOptions.signal, generationAtStart),
    }, { signal: controller.signal });
  };

  async function registerRecall(signalId: string, generationAtStart: number): Promise<void> {
    if (recallRegistered) {
      return;
    }
    if (recallRegistrationPromise) {
      await recallRegistrationPromise;
      return;
    }
    if (!activeContext || !controller || generationAtStart !== generation || controller.signal.aborted) {
      throw new DOMException("The page tool registration is stale.", "AbortError");
    }
    const registration = (async (): Promise<void> => {
      const context = activeContext;
      const registrationController = controller;
      if (!context || !registrationController || generationAtStart !== generation || registrationController.signal.aborted) {
        throw new DOMException("The page tool registration is stale.", "AbortError");
      }
      await context.registerTool({
        name: "force_recall_soldier",
        title: "Recall a soldier",
        description: "Request a bounded server-authoritative recall for the soldier named by the current continuation signal and revisions.",
        inputSchema: cloneSchema("force_recall_soldier"),
        annotations: { readOnlyHint: false },
        execute: (input, executeOptions) => {
          if (input.signal_id !== signalId) {
            return Promise.reject(new Error("STALE_REENTRY_CONTEXT"));
          }
          return execute("force_recall_soldier", input, executeOptions.signal, generationAtStart);
        },
      }, { signal: registrationController.signal });
      if (generationAtStart !== generation || registrationController.signal.aborted) {
        return;
      }
      await validateReadback(context, true);
      if (generationAtStart !== generation || registrationController.signal.aborted) {
        return;
      }
      recallRegistered = true;
    })();
    recallRegistrationPromise = registration;
    try {
      await registration;
    } finally {
      if (recallRegistrationPromise === registration) {
        recallRegistrationPromise = null;
      }
    }
  }

  const start = async (): Promise<void> => {
    stop("reconnect");
    const generationAtStart = generation;
    const detection = readModelContextStatus();
    if (!detection.context) {
      setStatus("unsupported", detection.message);
      return;
    }
    activeContext = detection.context;
    controller = new AbortController();
    recallRegistered = false;
    recallRegistrationPromise = null;
    setStatus("registering", detection.message);
    try {
      for (const tool of PAGE_TOOL_NAMES.filter((name) => name !== "force_recall_soldier")) {
        await registerRead(tool, generationAtStart);
      }
      await validateReadback(detection.context, false);
      if (generationAtStart !== generation || controller.signal.aborted) {
        return;
      }
      setStatus("registered", "WebMCP read tools are ready. Recall appears only when the server exposes an eligible continuation grant.");
    } catch (error) {
      if (generationAtStart !== generation || controller.signal.aborted) {
        return;
      }
      controller.abort();
      recallRegistered = false;
      recallRegistrationPromise = null;
      setStatus("error", error instanceof Error && error.message === "PAGE_TOOL_READBACK_MISMATCH"
        ? "WebMCP registration readback did not match the page contract. Human controls remain available."
        : "WebMCP registration failed. Human controls remain available.");
    }
  };

  const stop = (reason: "reconnect" | "unmount" | "error" = "unmount"): void => {
    generation += 1;
    controller?.abort(reason);
    controller = null;
    activeContext = null;
    recallRegistered = false;
    recallRegistrationPromise = null;
    if (reason !== "error") {
      setStatus("stale", reason === "reconnect"
        ? "WebMCP tools were cleared for reconnect; waiting for a fresh authoritative snapshot."
        : "WebMCP tools were cleared because the page session ended.");
    }
  };

  return {
    start,
    stop,
    get status() {
      return currentStatus;
    },
  };
}
