# Prior Art and Originality Audit: TwinSurface

> **Status: DEPRIORITIZED REFERENCE.** This file remains the prior-art boundary for the
> historical `TwinSurface` framing. `TwinSurface` is not the selected mechanism identity or
> current novelty claim. See
> [`../../Docs/Decisions/ADR-0002-separate-mechanism-from-demo-app.md`](../../Docs/Decisions/ADR-0002-separate-mechanism-from-demo-app.md).

**Status:** Research artifact

**Research snapshot:** 2026-08-29

**Question:** Is the proposed TwinSurface architecture and workflow already being used, and what can still be claimed as original for a WebMCP Challenge entry?

**Scope:** Public official WebMCP materials, official showcase applications, public implementation repositories, vendor documentation, and the currently visible challenge rules and project-indexing surface. This is a product and competition originality assessment, not a patent, copyright, or legal clearance opinion.

## Executive conclusion

The generic TwinSurface idea is not safely claimable as a new invention. The broad pattern is already present in the official WebMCP proposal and official examples:

```text
Human-visible UI + agent-facing WebMCP tools
                    |
                    v
       one live application and domain truth
                    |
                    v
        human review at consequential boundaries
```

The same pattern is also visible in public implementations. Respira for WordPress describes agent-only tools for staging, approving, rejecting, and rolling back edits. VeilFill uses an agent to prepare a structured mapping while keeping disclosure approval and submission outside the agent tool surface. NetSpectre uses the agent to prepare an investigation finding that a human must review and approve.

Therefore:

- **Not original enough:** dual human/agent surfaces, hidden agent-only tools, human approval, shared page state, dynamic tool availability, multi-step workflows, and high-level orchestration considered separately.
- **Potentially differentiating:** a specific domain problem and a concrete business mechanism that combines state-derived capabilities, agent preparation, human editing or judgment, authoritative revalidation, and measurable improvement in the chosen workflow.
- **Required positioning:** present TwinSurface as our named implementation pattern and product design discipline, not as a newly invented WebMCP primitive or industry-first architecture.

The public challenge gallery was not published at the time of review, so this audit cannot rule out unpublished, private, or unindexed projects with an even closer match.

## What TwinSurface means in this project

TwinSurface is our internal codename for:

> A Human-Agent Dual-Surface Architecture in which a human-facing UI and an agent-facing WebMCP tool surface provide different interaction paths over one shared application, domain, and backend truth.

The proposed version adds three important design choices:

1. The agent surface may expose semantic or high-level operations instead of mirroring every visible button.
2. The available tools may change with application state and business preconditions.
3. The agent prepares, explains, or proposes; the human retains judgment and the application retains authoritative validation and commit authority.

These are good design choices. They are not, by themselves, evidence of invention.

## Prior-art comparison

| Proposed element | Closest public evidence | Assessment |
| --- | --- | --- |
| Human UI and agent tools over one live application | The [official WebMCP README](https://github.com/webmachinelearning/webmcp) explicitly treats human-in-the-loop operation, front-end adaptation, and code reuse as goals. It also says WebMCP is not intended to replace the human interface. | **Established prior art** |
| Agent tools are not necessarily visible as human buttons | [Respira for WordPress](https://github.com/respira-press/webmcp-for-wordpress) describes agent-facing `create-page-duplicate`, `approve-duplicate`, and `reject-duplicate` tools that are useful to an agent even though they are not ordinary UI buttons. | **Established prior art** |
| Agent prepares; human reviews or approves | Respira uses reviewable duplicates and rollback. [VeilFill](https://github.com/tkhs0813/veilfill-webmcp) keeps approval, submission, and raw-value release outside the agent tool surface. [NetSpectre](https://github.com/DoobyDev/NetSpectre-WebMCP-Challenge) keeps agent-created findings as drafts until an investigator approves them. | **Established prior art** |
| High-level tool instead of many low-level calls | The official [Chrome Labs Maze demo](https://github.com/GoogleChromeLabs/webmcp-tools/blob/main/demos/webmcp-maze/src/webmcp/tools/EvalTool.ts) exposes an `eval_code` tool that instructs the agent to solve a maze algorithmically through lower-level game tools instead of making moves one by one. | **Established pattern** |
| Workflow-level guidance for composing tools | Official WebMCP [issue #161](https://github.com/webmachinelearning/webmcp/issues/161) proposes “Skills” that bundle tools with workflow context and explain how and when to use them. This is a proposal, not a current standard feature. | **Recognised open design direction** |
| Multi-step, goal-oriented workflows | [Chrome's WebMCP workflow guidance](https://developer.chrome.google.cn/docs/ai/webmcp/build-tools) models user goals as sequences of tool invocations and calls for recovery from wrong state, malformed parameters, external failures, and business-rule violations. | **Established guidance** |
| Conditional or state-dependent tools | [Cloudflare Browser Run's WebMCP documentation](https://developers.cloudflare.com/browser-run/features/webmcp/) shows a hotel flow where new tools become available after search, filtering, and selection. Chrome's best practices also recommend registering tools only when they are useful for the current page state. | **Established implementation pattern; not a standard dependency graph** |
| Shared business/session truth | [Shopify WebMCP](https://shopify.dev/docs/api/web-mcp) operates on the live shopper session and visible cart. [Cloudflare Radar Researcher](https://blog.cloudflare.com/introducing-radar-researcher/) states that imperative tools call the same code that powers the UI. | **Established prior art** |
| Shared human and agent product experience | The [official OpenAI WebMCP showcase](https://developers.openai.com/showcase?view=webmcp-apps) includes shared document, itinerary, meal-planning, commerce, and creative experiences where users continue to review or edit while the agent works. | **Established prior art** |
| A reusable formal architecture named TwinSurface | No official standard or single public reference architecture with this exact name and complete combination was found in the reviewed material. | **Potentially differentiating as our framing, not proven novel as a concept** |

## Official WebMCP evidence

### The official proposal already contains the broad thesis

The official [WebMCP repository README](https://github.com/webmachinelearning/webmcp) describes goals that closely match the broad TwinSurface framing: human-in-the-loop operation, reliable structured tools, adapting the front end so agents can use the existing product logic, and code reuse. Its non-goals include replacing the backend integration or the human interface. The official creative-design example has the agent make several edits as uncommitted changes in the UI before a human reviews them; checkout remains a human action.

This means “agent tools augment the human product over the same application” is not a new claim for our project. It is part of the platform's own intended direction.

### Official workflow guidance supports conditions and recovery

[Chrome's WebMCP workflow documentation](https://developer.chrome.google.cn/docs/ai/webmcp/build-tools) recommends designing from the user's goal, application state, agent context, system constraints, permissions, and filters. Its examples include a chain such as profile lookup, flight search, filtering, selection, and booking. It also explicitly describes recovery when an action is attempted in the wrong state or violates a business rule.

[Chrome's WebMCP best practices](https://developer.chrome.google.cn/docs/ai/webmcp/best-practices) recommend registering tools only when they are useful for the current state and unregistering them when they become unusable. This validates a state-derived tool surface as a sound implementation pattern, but it does not provide a standard declarative `dependsOn` graph or workflow engine.

The official [Skills discussion](https://github.com/webmachinelearning/webmcp/issues/161) is especially important for our framing. It distinguishes a tool's capability from the workflow context that tells an agent how to use several related tools well. The issue proposes a workflow-level layer, but the proposal is still open and should not be described as current WebMCP functionality.

### Official showcase examples make shared-state collaboration common

The [OpenAI WebMCP showcase](https://developers.openai.com/showcase?view=webmcp-apps) includes patterns such as:

- a document where the agent creates notes and discusses changes while the user remains in the same document;
- an itinerary where the agent changes a live schedule and map;
- a meal-planning application where user edits and agent assistance stay synchronized; and
- a shared shopping cart where the agent explores products while the user browses and reviews.

These examples make the user-agent shared workspace a recognised product pattern. A competition entry needs a domain-specific reason why its workflow is materially new or better, not only a similar architecture diagram.

## Closest public implementations

### Respira for WordPress: closest match to the generic TwinSurface claim

The public [Respira repository](https://github.com/respira-press/webmcp-for-wordpress) describes a page bridge connected to the WordPress Abilities API and REST endpoints. Its agent-facing workflow can read context, stage an edit as a reviewable duplicate, obtain human approval or rejection, and support rollback. The project explicitly says that some tools are meaningful as site tools even though they do not need to exist as ordinary human buttons.

This is a very close match to the following TwinSurface claims:

- agent-only semantic tools;
- a human-visible review surface;
- shared product/domain state;
- a staged rather than immediately destructive write path; and
- human-controlled approval.

The project reports its own production and challenge status. Those claims are self-reported, but the public code and architecture are directly inspectable. We should treat the pattern as prior art regardless of the production claim.

### VeilFill: close match with a stronger privacy boundary

The [VeilFill WebMCP project](https://github.com/tkhs0813/veilfill-webmcp) uses the slogan “Agent maps. Human approves. Browser fills.” The agent works with opaque handles and semantic metadata, while the browser keeps raw personal data local. The agent can stage and validate a mapping, but the project deliberately does not expose tools for approving disclosure, submitting the application, resolving raw claims, or reading raw vault values.

This is relevant because it demonstrates that “agent-only preparation plus a human-only consent boundary” is already being used in a current public challenge project. A TwinSurface entry should not claim that separation as novel. It could, however, develop a different domain-specific trust or decision mechanism.

### NetSpectre: current challenge evidence for draft-to-approval collaboration

The [NetSpectre WebMCP Challenge project](https://github.com/DoobyDev/NetSpectre-WebMCP-Challenge) uses WebMCP for a cyber-investigation workflow. The agent gathers a case briefing and evidence, drafts an investigation finding, and generates a summary. The investigator reviews and approves the finding, which remains a draft until that decision.

This confirms that the draft, review, approval, activity record, and shared-state pattern is not only theoretical or limited to commerce and content editing.

## What we can and cannot claim

### Claims we should not make

- “We invented the human-agent dual-surface architecture.”
- “TwinSurface is the first architecture to expose hidden tools to agents.”
- “Human approval, preview, rollback, or staged changes are new.”
- “A high-level tool replacing many small calls is new.”
- “WebMCP itself provides a standard workflow dependency graph.”
- “Our project is the first WebMCP application with this pattern.”

### A defensible claim boundary

Use wording in this direction:

> TwinSurface is our named implementation pattern for applying WebMCP to a specific domain: the product keeps one authoritative application and business-rule layer, while projecting it into a human surface and a state-derived agent surface. The agent gets domain-specific tools for preparation, comparison, explanation, or recovery; the human retains visible control at judgment and consent boundaries; the application revalidates and commits the final result.

This claims our design and implementation without claiming ownership of the underlying WebMCP pattern.

## Where originality can still live

The architecture becomes more defensible when it is attached to a concrete product mechanism that solves a problem neither ordinary UI automation nor a generic backend MCP integration solves well.

### 1. A domain-specific goal, not a generic assistant

Choose a task with real constraints, ambiguity, or trade-offs. “Fill this form” is weak because it can be presented as automation. “Resolve this domain-specific decision under changing constraints, show the alternatives, and preserve human accountability” is stronger.

### 2. Capability projection from an explicit state machine

Model the application as explicit states, preconditions, legal transitions, and side effects. Derive the current agent tool surface from that state. At every invocation, validate the state again in the authoritative application layer. This can be a meaningful implementation contribution if it is concrete, observable, and domain-specific, even though dynamic registration itself is prior art.

### 3. A genuine prepare-review-commit protocol

Make the agent's output a state-bound proposal rather than an irreversible mutation:

```text
agent intent
    -> validated proposal
    -> human edits, changes constraints, or rejects
    -> authoritative revalidation
    -> atomic commit
    -> visible receipt and recovery path
```

The differentiator should be what the proposal means in the chosen domain: for example, a conflict-resolved plan, a policy-backed allocation, or a privacy-minimized disclosure decision. Do not present the generic protocol itself as novel.

### 4. Keep the human as a decision-maker

The human should be able to modify the proposal, alter constraints, inspect the affected scope, and understand the consequence. A single “Approve” button is weaker than a meaningful collaborative decision surface.

### 5. Demonstrate a WebMCP-specific advantage

The product should need the live page context: the current document, dashboard filters, open case, cart, canvas, tenant, or authenticated session. If the same result can be delivered by a backend MCP server without the live page, the WebMCP choice is harder to justify.

### 6. Measure the mechanism

Compare at least:

- human-only UI;
- DOM or browser automation;
- a thin WebMCP button wrapper; and
- the TwinSurface workflow.

Measure completion quality, invalid-state calls, retries, time to useful result, human corrections, approval comprehension, unintended side effects, and recovery from stale state. This does not automatically create originality, but it turns the claim into evidence rather than a diagram.

## Competition and eligibility notes

The official [OpenAI WebMCP Challenge page](https://openai.com/webmcp-challenge/) asks for an application that has not been seen before and is meaningfully better when people and agents use it together. The current [Devpost rules](https://webmcp.devpost.com/rules) require original work, a public open-source repository, an English description, and documentation of prior work when an existing project is meaningfully extended during the submission period. The judging dimensions include WebMCP leverage, execution, potential impact, and creativity/ambition.

The current [project gallery](https://webmcp.devpost.com/project-gallery) was not published at the time of this audit. Public GitHub search therefore provides useful examples but not a complete competitor census.

The participant has confirmed that the entrant is based in the United Kingdom, so the Hong Kong exclusion listed on the current Devpost overview is not a current blocker for this project. Final eligibility should still be checked against the entrant's exact legal entity and the latest challenge rules before submission.

## Recommended competition positioning

The entry should say, in substance:

> We are not claiming to have invented WebMCP's dual-surface idea. We use WebMCP as the agent surface for a domain-specific collaborative workflow that is difficult to complete through a human-only interface and context-poor through backend-only MCP. TwinSurface keeps the human UI and agent tools over one authoritative state and policy layer, turns agent work into an editable proposal, and preserves human judgment before commit. Our contribution is the domain mechanism and the measured human-agent outcome.

The demo should make the difference visible in this order:

1. Establish a real human task and its current application state.
2. Show why the task is awkward, ambiguous, or costly through the visible UI alone.
3. Invoke a high-level, domain-specific WebMCP capability.
4. Let the human change a constraint or edit the proposal.
5. Show state-derived capabilities and authoritative revalidation.
6. Require a meaningful human decision before commit.
7. Show the receipt, audit trail, recovery path, and a failure case.
8. Report a small but credible comparison against the baseline paths.

## Confidence and limitations

**High confidence:** the broad architecture, human-in-loop pattern, shared live state, semantic agent tools, high-level workflow direction, and staged approval pattern all have official or public prior art.

**Medium confidence:** the public implementations reviewed are representative of visible ecosystem activity, but public repository quality and self-reported production claims vary.

**Low confidence:** no public search can prove that no private, unpublished, unindexed, or separately named project has the exact combination of features. The unpublished challenge gallery makes that limitation especially important.

**Legal boundary:** this document is not a freedom-to-operate or patent search. Before submission, check repository licenses, copied code/assets, third-party trademarks, and the challenge's originality declaration.

## Bottom line

TwinSurface remains useful as a clear internal architecture name and as a disciplined way to build the project. It should not be the competition's novelty claim. The competition-worthy contribution must be the specific domain workflow and business mechanism implemented on top of that architecture, with evidence that the human-agent combination creates a new or materially better outcome.
