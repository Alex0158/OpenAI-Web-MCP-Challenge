# WebMCP: Architecture and Execution Model

**Status:** Research dossier

**Snapshot:** 2026-08-28

## The core model

WebMCP adds a structured tool surface to a live web document. The application remains the owner of state and business logic; the browser mediates exposure and execution; the agent uses the resulting capability description to plan actions; the user remains the supervising authority.

```text
User
  | intent, review, consent, takeover
  v
Agent host and model
  | tool selection and structured arguments
  v
Browser mediation layer
  | origin, page lifecycle, policy, safety checks
  v
WebMCP tool registry on the live document
  | name, description, schema, annotations, executable callback
  v
Application logic and current state
  | validation, authorization, API calls, UI updates
  v
Visible page, server, and user-observable result
```

This model is intentionally different from a remote MCP server. A backend MCP server is an independently addressable integration surface. A WebMCP tool is normally ephemeral, attached to a document, and executed in the page's application context.

## Five-stage lifecycle

### 1. Registration

Application code calls `document.modelContext.registerTool(...)` with a tool definition. The definition contains:

- a constrained tool name;
- an optional display title;
- a non-empty natural-language description;
- a JSON-compatible input schema;
- an asynchronous `execute` callback; and
- annotations such as `readOnlyHint` and `untrustedContentHint`.

Registration can be tied to an `AbortSignal`, allowing the application to unregister the tool when its owning state or component is destroyed. This makes lifecycle management possible but also means that careless framework re-renders can create tool flicker, stale closures, duplicate names, or calls that disappear during execution.

### 2. Discovery

An in-page agent can call `getTools()` and receive `RegisteredTool` objects. A browser-native agent receives an implementation-defined observation of the page's tools. The current draft requires the browser to convey enough information for the agent to understand the available tool surface, but does not prescribe a single model-facing representation; it could be a function-calling format or another browser-specific format.

Discovery is therefore not the same as “the model can run arbitrary page JavaScript.” The browser controls how a native agent observes the page, and the page controls which tools are registered. The current registry is dynamic: `ontoolchange` allows an agent or integration to react when tools are added, removed, or updated.

This dynamic registry creates a contextual capability surface rather than a flat catalogue of every operation in the product. A search-results route may expose filtering and sorting; a product route may expose variant selection and cart preparation; an editor route may expose operations on the current document. Contextual loading can reduce tool-selection ambiguity and keep the agent focused, but it is an interaction and governance mechanism—not a substitute for authorization. Every callback must still validate the live state at execution time.

### 3. Invocation

The agent chooses a tool and constructs structured input from the declared schema. The browser can perform policy and safety checks before the call. The application must still validate every input and enforce authorization on the server or in authoritative application code.

The `readOnlyHint` annotation is not an access-control mechanism. A malicious or mistaken tool can misrepresent its side effects, and a safe agent must treat the declaration as untrusted unless the site and execution context are trusted.

### 4. Execution

The tool callback runs in the execution context of the document that owns the registration. It can call the same application functions, stores, and services that the page uses. The callback receives an `AbortSignal` so it can respond to cancellation. The application can update visible state, invoke its existing APIs, and return a structured JSON-compatible result.

The draft queues agent-triggered work in a WebMCP task source so that execution is coordinated with the document event loop. This preserves normal browser execution semantics, but it does not solve business-level race conditions. A tool must still re-read current state, handle concurrent user changes, and reject stale or invalid operations.

### 5. Response and observation

The result is returned to the agent, while UI and application state changes remain observable on the page. In the current draft, the JavaScript callback may resolve to any JSON-serializable value, while `executeTool()` exposes a stringified result. The application should return the minimum complete information the agent needs to verify the action and continue the journey.

The result is data, not proof of truth. It can be malformed, overlong, misleading, or contaminated by untrusted user-generated content. The agent host should preserve provenance and the application should make important state transitions independently verifiable.

## Page, agent, and server boundaries

### Page boundary

WebMCP is primarily a page-resident integration. Tools can read current application state and call existing front-end or server-backed logic without reproducing the entire session in a separate integration service. This is the main source of its practical advantage.

### Agent boundary

The agent may be supplied by the browser, an AI product, an in-page script, or a development/testing bridge. These are different trust and capability models. A browser-native agent can mediate consent and page isolation. An in-page agent is ordinary page code with access to the WebMCP API. A remote automation bridge may add its own transport, identity, logging, and user-interaction mechanisms.

### Server boundary

The server remains authoritative for authentication, authorization, inventory, pricing, payment, data protection, and irreversible state changes. A WebMCP callback is an entry point, not a security boundary. It should invoke the same validated command path used by the human UI, and the backend must assume that client-side inputs can be forged.

## One domain truth, two interaction surfaces

The most useful architecture is not two independent business engines. It is one authoritative domain model with two different interaction surfaces:

```text
Human-visible UI
  -> human workflow and presentation logic
  -> shared application commands
  -> shared domain policies and backend transactions

Agent-visible WebMCP tools
  -> agent workflow and structured tool contract
  -> shared application commands or agent-specific application services
  -> shared domain policies and backend transactions
```

The human workflow can remain step-by-step and visually rich. The agent workflow can be intent-level, batch-oriented, preview-first, and designed around structured results. They should still share authoritative rules for eligibility, ownership, pricing, inventory, permissions, and commit behavior.

This distinction resolves a common misconception. WebMCP does not require a site to discard a human-friendly workflow, and it does not automatically create a new business capability. A thin wrapper around a button is mainly a more reliable semantic remote control. New value appears when the site adds agent-specific application use cases—such as comparison, constraint solving, preparation, preview, or safe orchestration—while keeping final authority in the shared domain/backend layer.

An agent-only tool may have no visible button. It is still not a secret permission: the host may expose its metadata, important actions should be reflected in the visible UI, and the server must enforce the real rule. “Not visible as a human control” means a different interaction affordance, not a bypass of business governance.

## Origin and iframe model

The current draft uses browser origin and Permissions Policy controls:

1. `document.modelContext` is available in a secure context and requires an origin-keyed agent cluster.
2. The `tools` Permissions Policy defaults to the top-level document and same-origin iframes.
3. A cross-origin iframe requires explicit delegation such as `<iframe allow="tools">`.
4. Cross-origin exposure is additionally constrained through the registering document's `exposedTo` option.
5. `getTools()` is same-origin by default; an agent can request tools from selected origins through `fromOrigins` where allowed.
6. A returned `RegisteredTool` carries its owning window and origin so that a caller can retain provenance.
7. `executeTool()` runs in the owner context and the browser checks the relevant navigable and origin conditions.

This is a layered control, not a complete trust solution. A permitted origin can still publish a malicious description or implementation, and an application can accidentally broaden access through overly permissive iframe policy.

## Document lifecycle and state semantics

The page-scoped design is both a strength and a constraint.

| Lifecycle event | Expected implication |
| --- | --- |
| State changes while the document remains active | The application can update, replace, or remove tools and signal the change. Tool execution should read current state at invocation time. |
| Component unmount or route-level teardown | An `AbortSignal` can unregister the tool. Framework code must avoid unregistering a tool while a legitimate call still needs to finish. |
| Back-forward cache entry | Tools remain associated with the document but are unavailable while the document is not fully active; they become usable again if the document is restored. |
| Document disconnected or navigated away | Tools are no longer discoverable or invokable; pending calls may be abandoned and the native agent should be informed. |
| Full page navigation | The new document gets a new tool surface. The current core draft does not supply durable cross-navigation workflow state. |
| In-flight unregister | Current implementation discussions indicate that Chromium aborts in-flight execution when a tool is unregistered; behavior and developer guidance remain an active design concern. |

The implication is architectural: WebMCP tools should be treated as leases on a live UI context, not as permanent API endpoints. Long workflows need explicit continuation state, idempotency, recovery, and a plan for navigation.

## Shared-context sequence

```text
1. User opens an authenticated application page.
2. The application registers tools appropriate to the current route and state.
3. The browser or agent host observes the page-scoped tool surface.
4. The user asks for an action using natural language.
5. The model selects a tool and produces structured input.
6. The browser performs host-level checks and may request confirmation.
7. The tool validates current state and authorization, then calls application logic.
8. The visible UI updates; the tool returns a concise structured result.
9. The agent verifies the result or stops for user review.
```

The same sequence explains the innovation and the risk. The agent has a much better actuation path, but it also operates close to live session state and potentially sensitive user context.

## What the architecture enables

### More reliable actuation

The site can name the operation and define structured inputs instead of requiring an agent to infer that a visually labeled button means a particular backend mutation. This reduces dependence on DOM layout and fragile click order.

### State-aware collaboration

The tool executes against the current page state, so the user can change a filter, select a variant, edit a document, or inspect a result while the agent operates on the same canvas. This is particularly valuable where user judgment and agent speed complement one another.

### Reuse of product logic

The site can make a thin wrapper around the same command or service used by its human UI. It does not need to maintain a second remote integration server merely to express a page-local operation.

### A better accessibility path for complex workflows

An agent can operate on semantic application operations rather than only visual coordinates. This may help users who cannot easily navigate a complex visual interface, although WebMCP is not itself an accessibility-tree API and must not be presented as a replacement for accessible HTML and assistive technology semantics.

## What the architecture does not enable by itself

- It does not bypass login or server authorization.
- It does not create a durable agent session after navigation.
- It does not make a malicious site trustworthy.
- It does not guarantee that a model selects the correct tool or arguments.
- It does not define general background execution.
- It does not turn a site into a full MCP server with resources, prompts, tasks, or a remote transport.
- It does not guarantee that a user can see or reverse every side effect.

## Source basis

- [WebMCP Community Group specification](https://webmachinelearning.github.io/webmcp/)
- [Official WebMCP explainer and README](https://github.com/webmachinelearning/webmcp)
- [WebMCP security and privacy questionnaire](https://github.com/webmachinelearning/webmcp/blob/main/security-privacy-questionnaire.md)
- [WebMCP declarative API explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md)
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp?hl=en)
- [Chromium Intent to Experiment](https://groups.google.com/a/chromium.org/g/blink-dev/c/gmYffo5WOE8/m/OJxuQRP3AAAJ)
