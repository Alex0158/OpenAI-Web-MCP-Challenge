# WebMCP: API and Implementation Reference

**Status:** Research dossier

**Snapshot:** 2026-08-28

This document describes the current Community Group draft API. It is not a promise that browser implementations, agent hosts, or future standards will keep the same surface.

## Minimal imperative example

The following pattern follows the current OpenAI documentation and illustrates a benign read-only operation:

```js
if (typeof document.modelContext?.registerTool === "function") {
  await document.modelContext.registerTool({
    name: "get_page_title",
    description: "Read the title of the current page.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async () => ({ title: document.title }),
  });
}
```

The feature check is essential. A site must continue to work as a normal human-facing web application when WebMCP is unavailable.

## Current draft interfaces

The draft exposes a secure-context `ModelContext` through `Document`:

```webidl
partial interface Document {
  [SecureContext, SameObject] readonly attribute ModelContext modelContext;
};

[Exposed=Window, SecureContext]
interface ModelContext : EventTarget {
  Promise<undefined> registerTool(
    ModelContextTool tool,
    optional ModelContextRegisterToolOptions options = {}
  );
  Promise<sequence<RegisteredTool>> getTools(
    optional ModelContextGetToolOptions options = {}
  );
  Promise<DOMString> executeTool(
    RegisteredTool tool,
    optional object inputObject = {},
    optional ModelContextExecuteToolOptions options = {}
  );
  attribute EventHandler ontoolchange;
};
```

The Chromium feature is historically tracked under the name `navigator.modelContext`, while current examples and the Community Group draft use `document.modelContext`. For implementation work, inspect the target browser's actual API and do not infer support from the feature label alone.

## Tool definition fields

| Field | Current draft meaning | Implementation guidance |
| --- | --- | --- |
| `name` | Required stable identifier; current draft limits it to 128 characters and ASCII letters, numbers, `_`, `-`, and `.` | Use a durable domain verb and avoid names that overlap with unrelated tools. |
| `title` | Optional human-facing display label | Keep it concise and localizable; do not treat it as a security claim. |
| `description` | Required natural-language explanation of purpose | State what the tool does, when to use it, required context, and important side effects. |
| `inputSchema` | JSON Schema-like structured input description that must be JSON-serializable | Use narrow fields, enums, explicit required values, formats, bounds, and examples where supported. |
| `execute` | Required asynchronous callback receiving an input object and `{ signal }` | Re-read current state, validate inputs, enforce authorization, handle cancellation, and return a concise verifiable result. |
| `annotations.readOnlyHint` | Hint that the operation does not mutate state | Never use it as authorization or proof that no side effect exists. |
| `annotations.untrustedContentHint` | Hint that output contains untrusted content | Mark user-generated or externally sourced content so the host can apply appropriate handling. |

## Registration and lifecycle

`registerTool` returns `Promise<undefined>` in the current draft. Registration rejects for invalid or duplicate names, empty descriptions, non-serializable schemas, and other invalid definitions. The optional registration `AbortSignal` can remove a tool when aborted. The registration is associated with the document and is not a persistent cross-session record.

The lifecycle design creates a common framework problem. Registering once with a closure can freeze old state. Re-registering on every state update can cause registry churn, duplicate-name collisions, tool flicker, and accidental cancellation of work. A robust pattern is:

1. Register a stable tool identity at the correct page or feature boundary.
2. Resolve current state inside `execute`, not from a stale closure.
3. Keep registration changes proportional to actual capability changes.
4. Use explicit idempotency and operation identifiers for mutations.
5. Test unmount, route changes, BFCache, rapid updates, and in-flight cancellation.

The stable-identity/upsert problem is an active framework discussion, not a solved current API feature.

## Discovery and invocation

An in-page agent can use:

```js
const tools = await document.modelContext.getTools();
const selectedTool = tools.find((tool) => tool.name === "get_page_title");

if (selectedTool) {
  const result = await document.modelContext.executeTool(selectedTool, {});
  console.log(result);
}
```

`getTools()` returns `RegisteredTool` objects containing the tool metadata, owning `Window`, and origin. Same-origin tools are the default. The `fromOrigins` option enables explicitly requested cross-origin discovery where the browser policy and exposure rules permit it.

`executeTool()` checks that the target is an appropriate live document and runs the callback in the owner context. Its returned value is a `DOMString` representation of the callback result. A callback itself can return a JSON-compatible JavaScript value. This distinction matters when designing result parsing and when comparing the API with a model host's function-calling representation.

The `signal` option on execution lets callers cancel a pending call. The callback must pass cancellation to fetches or other cancellable operations where appropriate, and must define what happens if the operation has already committed a server-side mutation.

## Dynamic tool changes

`ontoolchange` is raised when the tool set changes. Dynamic exposure is useful for state-dependent capabilities—for example, showing `remove_from_cart` only when an item exists or exposing editor actions only when a document is editable. It also introduces observation churn and race conditions.

When tools depend on current state, the application should:

- expose the smallest truthful set of tools;
- keep tool names stable when the operation is the same;
- communicate unavailable state through clear results or stable capability descriptions;
- ensure the callback revalidates state at call time; and
- test what the agent sees immediately before and after every state transition.

## Origins, policy, and secure contexts

The draft requires `document.modelContext` to be used in a secure context and to satisfy origin-keying requirements. The `tools` Permissions Policy defaults to the top-level document and same-origin iframes. Cross-origin iframe use requires explicit delegation, typically `<iframe allow="tools">`, and cross-origin exposure also requires an `exposedTo` origin allowlist.

These controls prevent accidental broad discovery; they do not turn a trusted origin into a trusted application. Origin ownership, content provenance, tool identity, server authorization, and user consent remain separate concerns.

## Declarative form API: proposed, not current core API

The [declarative API explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md) proposes exposing ordinary HTML forms as tools using attributes such as:

- `toolname`;
- `tooldescription`;
- `toolautosubmit`; and
- `toolparamdescription` on controls.

The explainer proposes deterministic form-to-schema synthesis, required-field mapping, validation metadata, and a default human review behavior when `toolautosubmit` is absent. It also discusses tool activation/cancellation events, CSS states, and navigation response handling.

The formal specification's declarative section is currently TODO, and OpenAI's current Site tools documentation says declarative form annotations are not supported by its built-in browser implementation. Treat this API as a promising progressive-enhancement direction, not a stable dependency.

## Version drift in secondary examples

WebMCP is changing quickly, so examples from secondary articles may use an earlier or illustrative API surface. For example, the [ScaleKit WebMCP article](https://www.scalekit.com/blog/webmcp-the-missing-bridge-between-ai-agents-and-the-web) shows `navigator.registerTool(...)` and hyphenated declarative attributes such as `tool-name`. The current Community Group draft exposes `document.modelContext.registerTool(...)`; its current declarative explainer uses names such as `toolname`, `tooldescription`, `toolautosubmit`, and `toolparamdescription`, while the formal declarative section remains unfinished.

The article is useful for explaining the motivation, contextual tool loading, B2B use cases, and the MCP/WebMCP decision, but its code should not be copied without checking the current target implementation. The [current specification](https://webmachinelearning.github.io/webmcp/) is the source of truth for the API snapshot used in this dossier.

## Native agent API versus testing and automation APIs

Do not conflate these surfaces:

| Surface | Purpose | Standard status |
| --- | --- | --- |
| `document.modelContext` | Page API for registering and using WebMCP tools | Current Community Group draft |
| Browser-native agent observation | Browser-defined representation supplied to the built-in agent | Implementation-defined |
| `document.modelContextTesting` and related CDP domains | Experimental inspection, invocation, and test support in Chromium tooling | Non-standard testing/DevTools surface |
| Chrome DevTools MCP `list_webmcp_tools` and `execute_webmcp_tool` | MCP tools that let a remote development agent inspect/invoke page tools through Chrome DevTools | Product tooling, not WebMCP itself |
| Cloudflare Browser Run WebMCP support | Experimental remote-browser integration and live-view handoff | Vendor preview, not the standard |

Chrome's DevTools support is valuable for development and observability, but code should not assume that a browser-native agent exposes the same direct JavaScript methods as an in-page agent.

## Implementation pattern: one command path

The preferred architecture is a shared application command layer:

```text
Human UI event ───────┐
                      ├─> validated application command ──> server/API ──> state update
WebMCP execute ───────┘
```

The WebMCP callback should translate structured input into the same command used by the human UI. The command layer should own authorization, optimistic/concurrent state rules, idempotency, and error classification. This avoids maintaining a second, weaker business-logic path that can drift from the product.

## Common implementation failures

- Registering a tool with a vague “manage everything” description.
- Treating `readOnlyHint` as an authorization decision.
- Capturing stale React/Vue/Svelte state in a long-lived callback.
- Re-registering on every render and causing tool churn.
- Returning a UI dump instead of a concise result the agent can verify.
- Exposing raw record IDs without validating ownership or current version.
- Allowing a tool to submit a payment, message, deletion, or permission change without a separate user-confirmation boundary.
- Assuming a tool remains available after navigation.
- Assuming the agent sees every iframe or every browser implementation.
- Building only WebMCP and removing the ordinary UI fallback.

## Source basis

- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [WebMCP README and explainer](https://github.com/webmachinelearning/webmcp)
- [Declarative API explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md)
- [OpenAI Site tools documentation](https://learn.chatgpt.com/docs/webmcp)
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp?hl=en)
- [Chrome WebMCP eval guidance](https://developer.chrome.com/docs/ai/webmcp/evals)
- [Chrome DevTools WebMCP announcement](https://developer.chrome.com/blog/new-in-devtools-149?hl=en)
