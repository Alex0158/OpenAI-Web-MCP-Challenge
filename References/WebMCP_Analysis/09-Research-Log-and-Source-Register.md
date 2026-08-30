# WebMCP: Research Log and Source Register

**Status:** Research dossier

**Research cutoff:** 2026-08-29

## Method

The research was run in multiple passes rather than as a single web summary:

1. Establish the product and standards distinction.
2. Read the current OpenAI, Chrome, Chromium, WebMCP specification, and MCP documentation.
3. Inspect the official repository's explainers, security questionnaire, implementation status, issues, and browser tooling.
4. Compare the page-scoped architecture with backend MCP, UI automation, and remote browser bridges.
5. Check security research and ecosystem implementations.
6. Synthesize practical implications, business value, future hypotheses, and decision tests.
7. Run a prior-art and originality pass against the proposed TwinSurface architecture, including official WebMCP examples, public implementations, and the current WebMCP Challenge submission surface.

The dossier labels facts, snapshots, proposals, research evidence, inferences, and hypotheses separately. All source links below were consulted or used as the evidence base for the corresponding files. Volatile pages, rollout conditions, issue states, and browser milestones should be rechecked before implementation or launch.

## Primary standards and specifications

| Source | Class | Evidence used |
| --- | --- | --- |
| [WebMCP Community Group specification](https://webmachinelearning.github.io/webmcp/) | Current draft specification | API shape, registration, discovery, execution, annotations, origins, lifecycle, browser-agent observation, security framing, and current non-standard status |
| [WebMCP official README and explainer](https://github.com/webmachinelearning/webmcp) | Official project explainer | Motivation, goals/non-goals, lifecycle, alternatives, cross-origin behavior, cancellation, dynamic tools, and open questions |
| [WebMCP declarative API explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md) | Draft explainer | Form attributes, schema synthesis, auto-submit and review behavior, events, CSS hooks, and navigation response proposals |
| [WebMCP security and privacy questionnaire](https://github.com/webmachinelearning/webmcp/blob/main/security-privacy-questionnaire.md) | Official security analysis | Data exposure, lifecycle, private browsing, Permissions Policy, errors, and unresolved security/privacy questions |
| [WebMCP implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md) | Official project status page | Snapshot of Brave, ChatGPT, Chrome, Edge, Firefox, and Safari implementation signals |
| [MCP latest specification](https://modelcontextprotocol.io/specification/latest) | Current MCP specification | MCP host/client/server model, JSON-RPC, tools/resources/prompts, consent and tool-safety principles |
| [MCP 2026-07-28 release](https://blog.modelcontextprotocol.io/posts/2026-07-28/) | Official release note | Current MCP baseline and recent protocol direction |
| [MCP roadmap](https://blog.modelcontextprotocol.io/posts/mcp-roadmap/) | Official roadmap | Contrast for identity, enterprise security, HTTP-native transport, and agentic messaging priorities |

## OpenAI sources

| Source | Class | Evidence used |
| --- | --- | --- |
| [OpenAI Site tools documentation](https://learn.chatgpt.com/docs/webmcp) | Product/developer documentation | Site tools as a WebMCP implementation, current workflow, browser subset, iframe limitation, security warnings, and example registration code |
| [OpenAI Help Center: using Site tools](https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app) | Product help documentation | Current desktop-app scope, availability indicator, page-bound behavior, confirmation policy, and settings control |
| [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/) | Official ecosystem page | Experimental-standard positioning, challenge scope, dates, judges, and product/application signal |
| [OpenAI WebMCP showcase](https://developers.openai.com/showcase?view=webmcp-apps) | Official showcase index | Examples of apps designed for shared user-agent interaction |
| [Margin Editor](https://developers.openai.com/showcase/margin-editor) | Official showcase example | Document and note collaboration, tool count, read/write pattern, and user-agent shared context |
| [Verdant Market](https://developers.openai.com/showcase/verdant-market) | Official showcase example | Catalog, product, cart, and checkout-preview pattern; iterative feedback and tool-schema refinement |
| [Codex Modeling Studio](https://developers.openai.com/showcase/codex-modeling-studio) | Official showcase example | Browser-native 3D canvas, geometry and texture operations, WebAssembly/WebGPU, and shared viewport |
| [Sunday Table](https://developers.openai.com/showcase/sunday-table) | Official showcase example | Meal planning, recipes, groceries, preferences, and live page-state synchronization |
| [Webroom](https://developers.openai.com/showcase/webroom) | Official showcase example | Browser photo editor and large semantic tool surface |

## Browser and implementation sources

| Source | Class | Evidence used |
| --- | --- | --- |
| [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp?hl=en) | Official browser documentation | WebMCP motivation, progressive enhancement, JS tools, form direction, origin isolation, Permissions Policy, and Origin Trial instructions |
| [Chrome MCP comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp?authuser=14&hl=en) | Official browser documentation | WebMCP versus MCP, page scope, browser mediation, lifecycle, and complementary architecture |
| [Chrome WebMCP evals](https://developer.chrome.com/docs/ai/webmcp/evals) | Official browser documentation | Deterministic, probabilistic, isolation, chaining, failure-mode, and end-to-end evaluation guidance |
| [Chrome WebMCP use cases](https://developer.chrome.com/docs/ai/webmcp/use-cases?hl=en) | Official browser documentation | Commerce, forms, repeat tasks, travel, and business workflow examples |
| [Chrome DevTools WebMCP announcement](https://developer.chrome.com/blog/new-in-devtools-149?hl=en) | Official browser blog | Experimental inspection, invocation, call tracking, and Application-panel support |
| [Chromium Intent to Experiment](https://groups.google.com/a/chromium.org/g/blink-dev/c/gmYffo5WOE8/m/OJxuQRP3AAAJ) | Browser platform intent | Experiment goals, Gecko/WebKit signals, security, debug support, WPT coverage, and milestones 146–157 |
| [Chrome DevTools MCP tool reference](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md) | Product tooling repository | Non-standard `list_webmcp_tools` and `execute_webmcp_tool` development bridge |
| [Chromium WebMCP testing commit](https://chromium.googlesource.com/chromium/src/%2B/787339445c506799709bd787a62655f4fbb29eb0) | Browser source commit | Experimental cross-document testing support for navigation-triggered results |
| [Chrome WebMCP origin-trial entry point](https://developer.chrome.com/origintrials/) | Official browser portal | Origin Trial context; the portal itself is JavaScript-driven and status can change |

## Ecosystem sources

| Source | Class | Evidence used |
| --- | --- | --- |
| [Cloudflare WebMCP developer preview](https://blog.cloudflare.com/webmcp/) | Vendor announcement | Edge injection, packs, same-origin session bridge, and commercial adoption signal |
| [Cloudflare Browser Run WebMCP](https://developers.cloudflare.com/browser-run/features/webmcp/) | Vendor documentation | Experimental remote-browser support, tool listing, live view, and testing boundary |
| [Shopify WebMCP](https://shopify.dev/docs/api/web-mcp) | Platform documentation | Storefront catalog/cart/checkout/order/policy tools and separation from Storefront MCP |
| [Shopify Hydrogen release notes](https://hydrogen.shopify.dev/update/developer-preview-release-notes-july-8-2026) | Platform release note | Default storefront loading, CDN injection, opt-out, and supported operation categories |
| [WebMCP relay](https://github.com/PaulKinlan/webmcp-relay) | Third-party tooling | Dynamic page-tool re-exposure, list-change refresh, and operational registry/relay concerns |
| [ScaleKit WebMCP analysis](https://www.scalekit.com/blog/webmcp-the-missing-bridge-between-ai-agents-and-the-web) | Secondary technical/business analysis | Useful framing for browser-agent pain, contextual tool loading, B2B dashboards/internal tools, inherited SSO/RBAC context, and MCP Apps comparison; code samples and browser forecasts require current-spec verification |
| [Cloudflare WebMCP Browser Run](https://developers.cloudflare.com/browser-run/features/webmcp/) | Vendor documentation | State-dependent hotel workflow, tool re-listing after actions, and human confirmation at reservation commit |
| [Respira WebMCP for WordPress](https://github.com/respira-press/webmcp-for-wordpress) | Public implementation repository | Agent-only staging, approval, rejection, rollback, page bridge, and shared WordPress domain/action layer |
| [VeilFill WebMCP](https://github.com/tkhs0813/veilfill-webmcp) | Public challenge implementation | Opaque-handle agent mapping, human-only disclosure consent, staged browser-local fill, and dynamic post-completion tool reduction |
| [NetSpectre WebMCP Challenge](https://github.com/DoobyDev/NetSpectre-WebMCP-Challenge) | Public challenge implementation | Agent-drafted investigation finding, human approval, shared case state, and visible activity record |
| [Google Chrome Labs WebMCP Maze](https://github.com/GoogleChromeLabs/webmcp-tools/blob/main/demos/webmcp-maze/src/webmcp/tools/EvalTool.ts) | Official implementation example | Composite `eval_code` tool that orchestrates lower-level tools rather than exposing only one-step moves |
| [WebMCP Skills issue #161](https://github.com/webmachinelearning/webmcp/issues/161) | Official open design discussion | Proposed workflow-level context for composing tools and explaining how and when to use them |

## Security and academic sources

| Source | Class | Evidence used |
| --- | --- | --- |
| [WebMCP Tool Surface Poisoning](https://arxiv.org/abs/2606.06387) | Preliminary academic research | Mid-Session Tool Injection categories, controlled attack-success results, and proxy-defense limitations |
| [WebMCP-Phalanx](https://arxiv.org/abs/2608.24017) | Very recent preliminary preprint | Browser trust anchor, quarantine-agent design, results, and adaptive-attacker limitation |
| [Spotlighting](https://arxiv.org/abs/2403.14720) | Academic research | Provenance-preserving input transformation and indirect prompt-injection mitigation signal |
| [webMCP: Efficient AI-Native Client-Side Interaction](https://arxiv.org/abs/2508.09171) | Unrelated academic paper | Name-collision warning; its benchmark is not evidence for the official WebMCP proposal |
| [WebMCP security issue #121](https://github.com/webmachinelearning/webmcp/issues/121) | Community proposal | Possible consent, identity, validation, PII, rate-limit, and logging controls; not current standard requirements |
| [WebMCP privacy issue #45](https://github.com/webmachinelearning/webmcp/issues/45) | Community discussion | Baseline privacy and prompt-injection concerns |
| [WebMCP agent identity issue #105](https://github.com/webmachinelearning/webmcp/issues/105) | Community issue | Missing caller identity and authorization signal |

## Open design and lifecycle issues

| Source | Evidence used |
| --- | --- |
| [WebMCP issues index](https://github.com/webmachinelearning/webmcp/issues/) | Current snapshot of open topics including lifecycle, observation, sessions, cross-document discovery, schemas, and bulk execution |
| [Unregister during in-flight execution](https://github.com/webmachinelearning/webmcp/issues/218) | Framework teardown and cancellation concern |
| [Cross-document tool discovery](https://github.com/webmachinelearning/webmcp/issues/227) | Current `getTools()` scope and top-level context proposal |
| [Agent sessions and compaction](https://github.com/webmachinelearning/webmcp/issues/234) | Session and context-management concern |
| [Stable tool identity/framework issue](https://github.com/webmachinelearning/webmcp/issues/199) | Stale closures, registry thrashing, and scoped registry concerns |
| [Service Worker integration](https://github.com/webmachinelearning/webmcp/issues/212) | Background and navigation continuity proposal |
| [Service Worker explainer](https://github.com/webmachinelearning/webmcp/blob/main/docs/service-workers.md) | Origin-scoped worker providers and human handoff proposal |
| [Tool result content](https://github.com/webmachinelearning/webmcp/issues/86) | Binary/resource and non-text output gap |
| [Output schema](https://github.com/webmachinelearning/webmcp/issues/9) | Structured result contract gap |
| [Skills discussion](https://github.com/webmachinelearning/webmcp/issues/161) | Capability versus procedure distinction |
| [Reversible/consequential hints](https://github.com/webmachinelearning/webmcp/issues/176) | Side-effect classification proposal |

## Source-quality notes

- The specification, official repository, browser intent, official browser documentation, OpenAI product documentation, and MCP specification are the strongest sources for current technical claims.
- Showcase pages and vendor announcements demonstrate product patterns and adoption intent; they do not establish interoperability, security, or general performance.
- GitHub issues are useful for identifying open design pressure, but proposals and comments must not be promoted to standard behavior.
- Secondary technical articles can add useful product and market framing, but their API samples may lag the draft. The ScaleKit article uses illustrative `navigator.registerTool` and hyphenated declarative attributes that differ from the current draft's `document.modelContext` surface.
- Academic papers cited here are valuable threat and systems evidence, but their attack rates and benchmarks are controlled experiments with their own assumptions.
- Product availability, browser milestones, implementation-status entries, and issue state are volatile and should be rechecked before making a launch decision.
- The [prior-art and originality audit](./12-Prior-Art-and-Originality-Audit.md) is a bounded public-source review, not a complete competitor census or legal clearance. The current [challenge project gallery](https://webmcp.devpost.com/project-gallery) was not published at the research cutoff.
