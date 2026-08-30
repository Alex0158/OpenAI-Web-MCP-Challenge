# WebMCP: Future Directions and Innovation Hypotheses

> **Status: DEPRIORITIZED REFERENCE.** These are future platform hypotheses, not current
> re-entry workflow requirements or platform guarantees. See
> [`../../Docs/Core/00-current-status.md`](../../Docs/Core/00-current-status.md).

**Status:** Research dossier

**Snapshot:** 2026-08-28

This document distinguishes active proposals from analytical hypotheses. None of the future directions below should be presented as current WebMCP capability unless the specification and target implementation explicitly support it.

## The next design frontier

The first generation of WebMCP answers: “How can a live page expose a structured operation to an agent?” The next generation must answer: “How can that operation remain trustworthy, composable, observable, durable enough, and understandable to the user across time, origins, models, and media?”

## Ranked direction map

| Priority | Direction | Why it matters | Current status |
| --- | --- | --- | --- |
| 1 | Tool provenance and agent identity | Prevents a model from treating a runtime-poisoned or unknown tool as equivalent to a trusted application capability | Open concern and proposal space; not solved by the current draft |
| 2 | Consequential, reversible, and consent semantics | Lets browsers and hosts distinguish drafting from sending, previewing from purchasing, and undoable from destructive operations | `readOnlyHint` exists; richer hints and elicitation are open proposals |
| 3 | Lifecycle and cross-document continuity | Removes the “navigation tax” and makes multi-page journeys recoverable without pretending a document is a permanent server | Cross-document, top-level discovery, and Service Worker proposals |
| 4 | Strong input and output contracts | Improves validation, chaining, files, media, streams, and interoperability across hosts | `inputSchema` exists; output schema and multimodal/streaming work remain open |
| 5 | Evaluation and observability | Turns agent integration from demo craft into an engineering discipline | Chrome guidance and DevTools exist; shared benchmarks remain immature |
| 6 | Higher-level skills and journey primitives | Reduces repetitive orchestration while preserving reviewable checkpoints | Community proposal space; not current core API |
| 7 | Standardized discovery and ecosystem packaging | Helps agents find useful site capabilities without requiring the user to open the exact page first | Service Worker/manifest/directory discussions; unresolved |
| 8 | Interoperability across browsers and hosts | Determines whether developers can treat WebMCP as a web platform instead of a Chromium feature | Current signals are concentrated in Chromium-derived products and selected hosts |

## 1. Provenance, ownership, and agent identity

### Problem

The current page tool surface can contain multiple scripts, dynamic registrations, same-named tools, and outputs from external data. The draft provides origin and window information, but it does not give a tool a durable cryptographic identity or give the page a portable way to verify which agent is calling it.

The [agent identity discussion](https://github.com/webmachinelearning/webmcp/issues/105) notes that a tool may not be able to distinguish a browser agent, search crawler, assistant, screen reader, or other caller. The [tool-surface poisoning research](https://arxiv.org/abs/2606.06387) shows why registry integrity matters.

### Hypothesis

A future WebMCP profile could expose signed tool manifests, registration provenance, dependency trust, tool version, and an agent identity/attestation channel. This could let a site apply different policy to a browser-native agent, a user-approved assistant, a test harness, and an unknown script.

### Risk

Identity can create tracking, fingerprinting, and exclusion problems. A mandatory identity signal could make the open web less accessible to independent agents and assistive technologies. The solution should be capability- and consent-oriented, not a universal surveillance identifier.

## 2. Consequential, reversible, and consent-aware actions

### Problem

Read-only versus write is too coarse. Drafting an email, changing a filter, sending the email, charging a card, deleting a file, and changing a permission all have different reversibility, user expectations, and liability.

The [consequential-action discussion](https://github.com/webmachinelearning/webmcp/issues/176) explores richer hints. The [elicitation discussion](https://github.com/webmachinelearning/webmcp/issues/165) considers how clients can request user interaction.

### Hypothesis

A future action taxonomy could combine side-effect class, reversibility, data sensitivity, financial impact, and confirmation requirement. The browser or host could then render standardized previews and confirmations while the server issues a short-lived commit capability.

### Innovation opportunity

This would enable “agent prepares, human approves, system commits” as a first-class web pattern rather than a product-specific modal. It could become a trust primitive for commerce, finance, healthcare, and enterprise workflows.

## 3. Cross-document and background execution

### Problem

Current tools are tied to a document. A multi-page journey can lose its capability surface during navigation, while a user may want an agent to monitor or prepare work when the relevant page is not open.

The [Service Worker explainer](https://github.com/webmachinelearning/webmcp/blob/main/docs/service-workers.md) proposes origin-scoped providers that can operate in the background and open a page for sensitive UI handoff. The [worker integration issue](https://github.com/webmachinelearning/webmcp/issues/212) describes a possible middle layer between page-scoped WebMCP and backend MCP.

### Hypothesis

A safe design will separate durable discovery from live commit authority:

```text
Origin-scoped worker or backend
  -> search, prepare, monitor, summarize
  -> opens a live page for confirmation and sensitive commit
  -> page-scoped tool completes the user-visible operation
```

This can support reminders, price monitoring, inbox triage, inventory search, and itinerary preparation without granting a background worker permanent authority over payment or account changes.

### Hard problem

Session routing, multiple tabs, multiple conversations, user presence, stale state, and origin ambiguity must be explicit. Otherwise a “persistent tool” becomes an invisible cross-session automation channel.

## 4. Stronger schemas, outputs, and data types

### Current gap

The current draft centers on JSON-compatible inputs and stringified invocation results. Open issues cover `outputSchema`, binary/image/resource results, transferable or streamable inputs and outputs, and streaming arguments.

Relevant discussions include [output schema](https://github.com/webmachinelearning/webmcp/issues/9), [tool result content](https://github.com/webmachinelearning/webmcp/issues/86), and [streaming arguments](https://github.com/webmachinelearning/webmcp/issues/82).

### Hypothesis

A future version could adopt typed content envelopes with:

- a machine-readable output schema;
- provenance for every field or content part;
- bounded streams for large text, files, audio, and video;
- explicit ownership and lifetime for transferable data; and
- a clear distinction between model-readable summary and user-visible artifact.

This is essential for creative tools, data analysis, document editing, and multimodal agents. It also expands exfiltration risk and needs quotas, redaction, and consent.

## 5. Skills and journey-level primitives

Tools state what the page can do. A skill could explain how to accomplish a broader user goal using several tools, what checkpoints to show, which operations are optional, and when to ask the user.

The [skills proposal discussion](https://github.com/webmachinelearning/webmcp/issues/161) suggests a distinction between capability and procedure. A practical future model may be:

```text
Tool = atomic capability with schema and side effects
Skill = advisory procedure with goals, preconditions, checkpoints, and recovery
Task = durable execution state with user-visible progress and authorization
```

The danger is hidden autonomy. Skills should remain advisory, bounded, inspectable, and interruptible; they should not become an opaque site-controlled system prompt.

## 6. Standardized observation, progress, and debugging

Native agents currently receive an implementation-defined observation of the tool surface. Standardized provenance, state snapshots, progress events, call traces, and error types could improve cross-host reliability and developer tooling.

Chrome's experimental DevTools support already points in this direction: inspect schemas, execute tools manually, and track active or pending calls. The [application-driven observation discussion](https://github.com/webmachinelearning/webmcp/issues/232) and related tool-discovery issues show that observation frequency and context churn are active design concerns.

The future challenge is balancing enough state for correctness against sending the model a constantly changing, expensive, and potentially private tool map.

## 7. Discovery beyond the open tab

WebMCP is strongest when the user and agent share a live page, but a user cannot know which sites have useful tools before opening them. Possible discovery surfaces include search metadata, directories, links, PWA manifests, capability cards, and worker registration.

Discovery must not imply permission. A public capability advertisement can describe what a site supports, while actual execution still requires a live session, origin policy, user consent, and server authorization.

## 8. Interoperability and standardization

The proposal needs agreement across browser engines, agent hosts, frameworks, and platform providers. Chromium's intent records no Gecko or WebKit signal at the snapshot date; the implementation-status page records no Firefox or Safari support. Mozilla's standards-position issue is currently marked neutral, which is a signal of consideration, not adoption.

Possible interoperability layers include:

- a minimal common imperative API;
- a stable declarative form subset;
- conformance tests for lifecycle, origins, cancellation, and tool changes;
- shared action/side-effect metadata;
- standardized model-facing observation with provenance; and
- host capability negotiation so sites can degrade gracefully.

The worst outcome for developers is a pseudo-standard where every major host supports a different subset and every framework needs its own adapter.

## 9. New application categories

If trust and lifecycle mature, WebMCP could support:

- **Agent-native creative canvases:** domain operations over 3D, photo, video, and design state with human review at every commit.
- **Collaborative research workspaces:** agents navigate data, propose analysis, and update a shared notebook while preserving citations and provenance.
- **Personal operations hubs:** a user supervises travel, appointments, returns, and subscriptions through live service pages rather than opaque background automation.
- **Enterprise control planes:** an agent prepares changes in a live dashboard, shows policy impact, and requests approval before a server-side commit.
- **Accessible task interfaces:** semantic operations help users complete complex workflows while retaining compatible HTML and assistive-technology support.
- **Agent-aware commerce infrastructure:** storefront platforms provide standardized catalog, cart, policy, and review primitives with merchant-controlled confirmation.

These are hypotheses. They depend on browser reach, host trust, user demand, and measurable outcomes.

## Strategic forecast

The likely durable pattern is not WebMCP replacing MCP. It is a layered system:

1. Backend services provide durable authority and data.
2. WebMCP provides live, user-visible, state-aware operations.
3. Browser and agent hosts provide observation, policy, and consent.
4. Skills or task layers orchestrate bounded journeys.
5. Evaluation and provenance systems make the combined stack governable.

The largest opportunity is to make “human plus agent using the same application” a reliable product category. The largest risk is to make authenticated web sessions callable by probabilistic systems without a sufficiently explicit trust and consent model.
