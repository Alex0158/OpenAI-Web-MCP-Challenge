# WebMCP: Current State and Timeline

**Status:** Research dossier

**Snapshot:** 2026-08-28

## Current-state answer

WebMCP is an experimental proposed web standard. The current Community Group draft is implementable at the imperative JavaScript API level, but it is not a W3C Standard. Product implementations and browser experiments exist, while cross-browser adoption, declarative forms, background execution, identity, and several security and lifecycle details remain unsettled.

The phrase “OpenAI's new WebMCP technology” is therefore imprecise. OpenAI has shipped a product surface called Site tools that implements part of the proposed WebMCP model; the underlying standard is a multi-party web-platform effort.

## Timeline and milestones

| Date or period | Event | Evidence status and significance |
| --- | --- | --- |
| 2025-08-06 | An unrelated paper titled [webMCP: Efficient AI-Native Client-Side Interaction](https://arxiv.org/abs/2508.09171) appears | Research evidence, not the Web Machine Learning Community Group proposal. The shared name is a source of confusion. |
| 2025-08-13 | The official [WebMCP repository](https://github.com/webmachinelearning/webmcp) is first published according to its repository history and README | Confirmed project history; the proposal later evolved substantially. |
| 2025-08-28 | The official [Service Worker explainer](https://github.com/webmachinelearning/webmcp/blob/main/docs/service-workers.md) is published | Draft proposal for background and longer-lived web workflows; not part of the current core standard. |
| 2026-05-15 | Chromium publishes [Intent to Experiment: WebMCP](https://groups.google.com/a/chromium.org/g/blink-dev/c/gmYffo5WOE8/m/OJxuQRP3AAAJ) | Confirmed experiment intent. It records no Gecko or WebKit signal, incomplete WPT coverage, and planned API experimentation. |
| 2026-05-19 | Chrome publishes [Evals for WebMCP](https://developer.chrome.com/docs/ai/webmcp/evals) | Confirmed developer guidance: deterministic tool tests, probabilistic model evals, and end-to-end journey evals. |
| 2026-06 onward | Chrome Origin Trial begins at milestone 149, with the intent listing 149–156 for the trial | Implementation snapshot and rollout plan, not a universal availability guarantee. |
| 2026-07-28 | The current [MCP specification](https://modelcontextprotocol.io/specification/latest) is dated 2026-07-28 | Useful comparison baseline; MCP and WebMCP solve related but different integration problems. |
| 2026-08-06 | [Cloudflare WebMCP](https://blog.cloudflare.com/webmcp/) developer preview is announced | Ecosystem signal: edge injection and bridges can reduce origin-code adoption cost. It is not standard evidence. |
| 2026-08-25 | [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/) highlights experimental apps and ecosystem participation | Adoption and product-design signal, not a conformance or reliability claim. |
| 2026-08-26 | The [WebMCP Community Group draft](https://webmachinelearning.github.io/webmcp/) is dated 26 August 2026 | Current specification snapshot. It explicitly says it is not a W3C Standard and not on the W3C Standards Track. |
| 2026-08-28 | This dossier snapshot | Research cutoff for the files in this folder. Volatile availability claims should be rechecked before implementation or launch. |

## Current implementation and standards matrix

| Surface | Current position in this snapshot | Confidence |
| --- | --- | --- |
| Formal API | `document.modelContext` with `registerTool`, `getTools`, `executeTool`, and `ontoolchange` in the Community Group draft | High for the draft; not a final web-platform contract |
| Declarative form API | Described in a separate explainer; the formal specification section remains TODO | High for status; low for final shape |
| Chrome | Dev Trial from 146; Origin Trial from 149 through the planned 156 window; estimated shipping milestone 157 in the Chromium intent | High as a Chromium plan; rollout status is volatile |
| Edge | The implementation-status page records an Origin Trial in Edge 150 | Implementation snapshot; verify current enrollment/status directly |
| Brave | The implementation-status page records experimental support in Leo AI chat | Implementation snapshot; vendor-specific |
| ChatGPT | OpenAI Site tools expose a supported subset in the ChatGPT desktop app's built-in browser | Product snapshot; access, model, plan, and app requirements can change |
| Firefox | No signal recorded in the Chromium intent or current implementation-status page | Snapshot, not a permanent non-adoption decision |
| Safari/WebKit | No signal recorded in the Chromium intent or current implementation-status page | Snapshot, not a permanent non-adoption decision |
| DevTools | Chrome 149 introduces experimental WebMCP inspection, manual invocation, and call tracking in the Application panel | Confirmed experimental tooling; flags and UI can change |
| Testing | Chrome documents isolated calls, deterministic tests, probabilistic evals, and end-to-end journey tests | Confirmed guidance |
| Persistence | Current registration is tied to the document lifetime; no persistent cross-session registry is specified | Confirmed draft behavior |
| Background execution | Service Worker support is an explainer and active design space, not current core behavior | Draft proposal |

Sources: [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp?hl=en), [Chromium intent](https://groups.google.com/a/chromium.org/g/blink-dev/c/gmYffo5WOE8/m/OJxuQRP3AAAJ), [WebMCP implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md), [Chrome DevTools announcement](https://developer.chrome.com/blog/new-in-devtools-149?hl=en).

## OpenAI Site tools: product facts versus standard facts

OpenAI's documentation says Site tools use WebMCP to let ChatGPT interact with tools exposed by a website in the ChatGPT desktop app's built-in browser. The tool call happens against the current page and signed-in session, and the user and agent can observe the same live state. The documentation also states that the implementation supports only a subset of WebMCP APIs: declarative form annotations are not currently supported, and tools in iframes are not discovered by the current ChatGPT browser implementation.

At this snapshot, the OpenAI developer documentation lists Site tools for GPT-5.6 Sol or Terra, with GPT-5.6 Luna disabled for WebMCP; it also requires the latest desktop app, is rollout/page dependent, and is not available to Enterprise or Edu accounts. OpenAI's Help Center further describes the feature as limited to the ChatGPT desktop app's built-in browser rather than Chrome, page-bound to the current tab, and configurable through the browser permissions setting. These are volatile product conditions, not properties of the WebMCP standard, and must be verified again before relying on them.

Sources: [OpenAI Site tools developer documentation](https://learn.chatgpt.com/docs/webmcp), [OpenAI Help Center](https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app).

## What is stable enough to design around

The following principles are more durable than any specific rollout flag:

1. A site can expose structured operations that map to its own application logic.
2. The agent can be given a live page-scoped tool surface rather than only a visual surface.
3. The page remains responsible for application state, input validation, business rules, and session-bound authorization.
4. Browser mediation can preserve user visibility and apply agent-safety checks.
5. The page must retain a normal human interface as progressive enhancement.

## What should not be treated as settled

- The final namespace and API shape.
- Whether all major browser engines will implement the feature.
- Whether a tool registry will remain only document-scoped or gain worker/session primitives.
- How agents will verify tool provenance and identity.
- How consequential, reversible, or permission-sensitive actions will be represented.
- How schemas, defaults, output types, streams, files, and multimodal data will be standardized.
- How a navigation or cross-document workflow will preserve an agent's context.
- How model-specific behavior will be evaluated across different tool lists and page states.

## Practical maturity rating

| Area | Rating | Reason |
| --- | --- | --- |
| Conceptual clarity | Strong | The page/agent/user shared-context model is coherent and has multiple prototypes. |
| Imperative prototype readiness | Moderate to strong | A concrete API and browser experiments exist. |
| Declarative form readiness | Early | The proposal is useful but remains separate from the formal API and is not supported by ChatGPT Site tools. |
| Cross-browser readiness | Weak | Current signals are concentrated in Chromium-derived products and selected hosts. |
| Security maturity | Early to moderate | Threats are documented, but identity, intent, lifecycle, and provenance controls remain incomplete. |
| Production evaluation practice | Moderate | Chrome provides a useful testing model, but teams still need product-specific datasets and safety metrics. |
| Long-running/background workflows | Early | Service Worker and cross-document proposals are unresolved. |

This rating is an analytical synthesis, not an official status label.
