# WebMCP, MCP, and Browser Automation

**Status:** Research dossier

**Snapshot:** 2026-08-28

## The short distinction

MCP and WebMCP are complementary integration layers:

- **MCP** connects an AI host to tools, resources, prompts, and other capabilities exposed by a local or remote server through an MCP protocol.
- **WebMCP** lets a live web page expose application-defined tools to an agent operating in the browser context.

Chrome's [comparison guide](https://developer.chrome.com/docs/ai/webmcp/compare-mcp?authuser=14&hl=en) describes MCP as the broader backend or service integration and WebMCP as a page-local, browser-mediated connection. A mature product may use both: backend MCP for durable business capabilities and WebMCP for shared, visible, session-aware interaction.

## Layer comparison

| Dimension | Backend MCP | WebMCP | Browser UI automation | Browser extension or remote browser bridge |
| --- | --- | --- | --- | --- |
| Primary location | Local process, service, or remote server | Live web document and browser | Rendered page, DOM, accessibility tree, or coordinates | Browser control plane, often over CDP or extension APIs |
| Availability | Can be persistent and reachable without a page open | Usually only while the relevant document is live | Usually requires a browser session and target page | Depends on browser, session, extension, and remote control service |
| Integration contract | MCP protocol, tools/resources/prompts, server capabilities | Page-registered tool metadata and callback | Agent infers or targets UI affordances | Vendor or protocol-specific automation commands |
| State context | Server-managed; may need session replication | Current page, DOM/application state, cookies, and visible UI | Whatever the automation layer can observe | Browser/session state plus bridge-specific metadata |
| Transport | JSON-RPC and MCP transports | Browser-mediated API; no separate MCP server required | Automation protocol or model-driven interaction | CDP, extension messaging, vendor API, or relay |
| Lifecycle | Server or connection lifecycle | Document, origin, frame, and navigation lifecycle | Browser/session lifecycle | Browser/session/bridge lifecycle |
| Best fit | Durable business operations, data access, cross-session workflows | Co-browsing, stateful UI tasks, user review, page-owned actions | Sites that do not provide tools, exploratory tasks, fallback coverage | Remote testing, developer tools, browser operations, cross-page orchestration |
| Main strength | Reach and durability | Shared context and lower UI ambiguity | Zero site integration | Broad control and operational reach |
| Main weakness | Separate auth/state and possible UI disintermediation | Experimental, page-scoped, trust and lifecycle complexity | Brittle, expensive, and sensitive to UI change | More powerful trust boundary and vendor dependency |

The categories overlap in real systems. The table is a design heuristic, not a protocol specification.

## WebMCP versus MCP

### Why WebMCP is not “MCP in JavaScript”

The current WebMCP proposal is MCP-inspired but intentionally uses web-platform concepts: origins, documents, windows, Permissions Policy, iframes, secure contexts, BFCache, and browser-controlled page lifecycle. It does not simply embed an MCP server in every page. In particular, the core API does not reproduce the full MCP server model of resources, prompts, transport negotiation, or persistent server execution.

The [current MCP specification](https://modelcontextprotocol.io/specification/latest) defines a host/client/server architecture and a JSON-RPC-based protocol for connecting model applications to external capabilities. WebMCP instead treats the browser as the mediator and the page as an ephemeral capability provider.

### Where they work together

```text
Agent host
  ├─ Backend MCP ──> durable catalog, CRM, inventory, policy, analytics, workflow services
  └─ WebMCP ───────> live page state, visible editor/cart/dashboard, current session, user review
```

A commerce application could use backend MCP to search a large catalog or check fulfillment rules, then use WebMCP to update the user's visible cart and stop before payment confirmation. A productivity application could use backend MCP for organization-wide search and WebMCP for editing the open document.

### WebMCP versus MCP Apps

MCP Apps and WebMCP can both create agentic experiences, but they put the application in different places:

| Question | WebMCP | MCP Apps |
| --- | --- | --- |
| Where is the main interface? | The existing website in a live browser tab | A UI rendered inside the AI host |
| Who owns the surrounding session? | The website and browser | The agent host and its app container |
| Best fit | Existing web products, live page state, SSO/session context, user takeover | New agent-first experiences or tools that need to render inside the assistant |
| Main trade-off | Browser and page lifecycle, host support, and cross-browser maturity | A separate app surface and host-specific rendering constraints |

This makes the choice strategic. If the product's value depends on the user and agent seeing the same open document, cart, dashboard, or canvas, WebMCP is the natural contextual layer. If the desired experience is primarily an assistant-native UI that works without the original page, MCP Apps or backend MCP may be more appropriate. A product can combine them.

### Selection questions

Choose backend MCP first when:

- the operation must work without a page open;
- it spans multiple sessions, users, tenants, or pages;
- it needs long-running tasks, durable queues, or scheduled execution;
- the capability is fundamentally a service or data integration; or
- the browser should not hold the authoritative workflow state.

Choose WebMCP first when:

- the current page state materially changes the correct action;
- the user needs to see, supervise, or adjust the same UI;
- the site already contains the needed business logic and session context;
- the value comes from precise interaction with a rich editor, canvas, cart, or dashboard; or
- a site wants a progressive enhancement without operating a separate MCP server.

Use both when the durable service and the live interaction each matter.

## WebMCP versus UI automation

UI automation asks an agent to infer a control path from a rendered interface and then reproduce human-like interactions. WebMCP lets the site declare a semantic operation and structured input. That distinction can reduce:

- dependence on layout, CSS selectors, coordinates, and button text;
- unnecessary screenshots, DOM exploration, and intermediate clicks;
- ambiguity between nearby controls with similar labels;
- latency and token use caused by repeated observation; and
- the chance that a UI redesign breaks the agent's action path.

It does not remove the need for UI automation. A site may be uninstrumented, an agent may not support WebMCP, or the task may be genuinely visual and exploratory. UI automation remains an important fallback and can still observe the visible effects of a WebMCP call.

## WebMCP versus an ordinary front-end API

An ordinary front-end API is code for the application itself. WebMCP adds an agent-facing description, schema, discovery path, and browser-mediated invocation boundary around selected operations. The underlying code can be shared, but the audience and threat model differ:

| Ordinary front-end function | WebMCP tool contract |
| --- | --- |
| Caller is known application code | Caller may be a browser or model-mediated agent |
| Types may be enforced by compiler or local code | Description and schema guide a probabilistic model and need runtime validation |
| Internal naming is acceptable | Name and description become part of a public semantic surface |
| Errors are designed for developers or UI handlers | Results and errors must be concise, attributable, and useful for agent continuation |
| Component lifecycle is an implementation detail | Registration lifecycle is observable and affects availability |

The correct response is not to expose every internal function. It is to publish a small, deliberately designed agent contract.

## Alternatives considered by the WebMCP proposal

The official explainer discusses several alternatives:

1. **Direct full MCP in the browser:** would not naturally express browser origin, permission, DOM, tab, and document lifecycle, and would tightly couple the page to an evolving backend protocol.
2. **Static manifests:** could describe capabilities but would not naturally update with current UI state or provide executable page-local code.
3. **Event-only tool calls:** would separate the schema from its implementation and push dispatch logic into a generic switch statement; a hybrid may still be useful in some architectures.

These arguments support WebMCP's current shape, but they do not prove it is the only viable design.

## Decision matrix

| Requirement | Prefer WebMCP | Prefer backend MCP | Prefer UI automation | Prefer combined design |
| --- | --- | --- | --- | --- |
| User must review a live cart before purchase | Yes | No, unless paired with page handoff | Possible fallback | Strongest |
| Search across an organization without opening a page | No | Yes | No | Optional page handoff |
| Work across a long-running workflow and navigation | Early/limited | Yes | Possible but fragile | Strongest |
| Existing site has no integration points | No immediate requirement, but add progressively | Possible separate integration | Yes | Start with automation, add tools |
| Rich visual canvas or editor | Strong if operations can be semantic | Useful for assets/data | Useful for visual inspection | Strongest |
| Payment, deletion, or account permission change | Only as a reviewed front-end step | Server remains authoritative | Never rely on model action alone | Combined with explicit consent and server gates |
| Need broad browser coverage today | Not sufficient alone | Usually more predictable | Usually broader but fragile | Progressive fallback |

## Strategic conclusion

WebMCP should be positioned as the **co-browsing and application-context layer** in an agent architecture. It is not the universal tool layer. The most resilient stack separates:

- durable authority and business policy in backend services;
- user-visible, stateful interaction in WebMCP;
- fallback access through accessible HTML and UI automation; and
- browser/agent mediation, consent, logging, and evaluation above all three.
