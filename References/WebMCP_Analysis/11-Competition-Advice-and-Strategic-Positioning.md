# Competition Advice and Strategic Positioning

> **Status: DEPRIORITIZED REFERENCE.** The general competition principles remain useful,
> but the selected mechanism, app-selection boundary, and challenge scope are controlled by
> [`../../Docs/Core/01-product-definition.md`](../../Docs/Core/01-product-definition.md) and
> [`../../Docs/Core/06-mvp-and-demo.md`](../../Docs/Core/06-mvp-and-demo.md).

**Status:** Competition strategy note

**Snapshot:** 2026-08-29

**Scope:** Advice for presenting a WebMCP Challenge project. This is strategic analysis, not an official judging rubric.

## The central competition insight

The first originality decision is negative: do not claim that the TwinSurface architecture itself is new. The official WebMCP proposal, official OpenAI showcase, Respira for WordPress, VeilFill, and other public projects already show the broad combination of human UI, agent-facing tools, shared state, staged changes, and human review. Use [12 - Prior Art and Originality Audit](./12-Prior-Art-and-Originality-Audit.md) as the evidence register and claim boundary.

Do not present WebMCP as “we exposed our buttons to an AI.” That demonstrates a protocol integration, but it leaves the strongest question unanswered: why should an agent use this website, and why should the user remain involved?

The stronger position is:

> We designed a product in which a human and an agent share the same live application, use different interaction surfaces, and rely on one authoritative business system.

The human sees and controls the visible product. The agent receives structured tools that are not necessarily visible as buttons. Both paths share the same state, policy, validation, and backend authority. The agent accelerates intent resolution and preparation; the human remains the decision-maker at the points where judgment, consent, or accountability matters.

This is a product positioning and implementation claim, not a claim that our team invented the pattern. The originality must come from the chosen domain mechanism, the specific user outcome, and the evidence that the combined workflow is materially better.

This framing aligns with the WebMCP proposal's emphasis on shared context and user control, and with Chrome's distinction between page-local WebMCP interaction and durable backend MCP integration. See the [WebMCP specification](https://webmachinelearning.github.io/webmcp/) and [Chrome's WebMCP/MCP comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp?hl=en).

## The architecture to show

```text
                    +--------------------------+
                    |  Human-visible interface |
                    |  buttons, canvas, review |
                    +------------+-------------+
                                 |
                                 v
                     Human interaction workflow
                                 |
                                 |
Agent request --> WebMCP tool surface
                                 |
                                 v
                     Agent interaction workflow
                                 |
             +-------------------+-------------------+
             v                                       v
       Shared application commands              Agent-specific use cases
             +-------------------+-------------------+
                                 v
                 Shared domain and policy layer
                                 v
                    Backend transaction authority
```

This is the key design rule:

> Two interaction surfaces, one domain truth.

Do not implement one business engine for humans and another for agents. Let the agent workflow be different where that creates value—batching, comparison, preparation, explanation, recovery, or natural-language intent resolution—but make both paths pass through the same authoritative rules.

## What counts as a strong WebMCP entry

### Weak: a semantic remote control

```text
Agent: click Add to Cart
WebMCP: calls the same Add to Cart handler
```

This can still be useful. It may reduce UI ambiguity and improve reliability. But the project should describe it honestly as an agent-compatible interaction layer, not as a new business capability.

### Stronger: an agent-oriented workflow

```text
Agent: “Find me the best compatible setup under this budget.”
WebMCP:
  1. reads the current page and user selection
  2. searches compatible options
  3. applies business constraints
  4. compares alternatives
  5. prepares a visible recommendation
  6. waits for the user's decision
```

This is valuable because the product now supports a user goal that is awkward to complete through individual controls. The agent tool is not merely a hidden button; it is a deliberate application use case.

### Strongest: a collaborative, governed workflow

```text
User expresses goal
      v
Agent gathers and prepares
      v
Application produces a state-bound preview
      v
User edits or approves
      v
Backend re-authorizes and commits
      v
Visible receipt, audit trail, and recovery path
```

This demonstrates human value and business value simultaneously. It also makes safety visible rather than treating autonomy as the only measure of success.

## What should remain human-visible

Do not hide the consequences of an agent action simply because the tool has no visible button. The user should be able to see:

- what the agent is trying to accomplish;
- which object, account, or data scope is affected;
- the important inputs and constraints;
- the expected price, disclosure, or side effect;
- whether the result is a draft, preview, reversible change, or committed action;
- when user confirmation is required; and
- how to stop, edit, undo, or recover.

The tool itself may be agent-facing, but the outcome and the control boundary must remain legible to the human.

## Recommended project shape

For a competition prototype, choose one narrow vertical slice:

1. A visible application with meaningful state.
2. Three to six well-designed domain tools.
3. At least one agent-specific tool that is not a one-to-one button wrapper.
4. A preview or review checkpoint.
5. Shared command logic for human and agent paths.
6. Server-side or authoritative validation for the final result.
7. A visible activity timeline and result receipt.
8. A graceful ordinary-UI fallback.
9. A short evaluation showing improvement over UI-only operation.

Avoid building a large catalogue of shallow tools. A small, coherent workflow is easier to demonstrate, test, and trust.

## Choose WebMCP for the live-context advantage

The competition entry should make clear why the chosen experience belongs in a webpage rather than only in backend MCP or an assistant-native app. Use WebMCP when the user and agent need the same open document, dashboard, cart, canvas, selection, or authenticated session. Use backend MCP when the task is durable, background, cross-page, or primarily data/service access. Use an assistant-native UI when the product does not need the original website as the shared workspace.

This choice is especially strong for B2B dashboards and internal tools: the agent can translate intent into filters, comparisons, preparation, and review while preserving the user's current tenant, permissions, and visible state. The [ScaleKit analysis](https://www.scalekit.com/blog/webmcp-the-missing-bridge-between-ai-agents-and-the-web) is useful secondary support for this direction, but the project should prove the advantage with its own task and user evidence.

## Demo storyline

The demo should make the architectural difference visible within a few minutes:

1. Start with a human using the normal interface.
2. Show the current page state and explain that the agent sees the same context.
3. Ask for a goal that would require many manual steps or comparisons.
4. Show the agent using a high-level WebMCP tool rather than clicking through every control.
5. Let the user change a selection or constraint while the workflow is in progress.
6. Show the page updating and the agent adapting to the new state.
7. Present a clear preview and ask the human to approve or edit it.
8. Commit only after the proper confirmation and backend validation.
9. Show the receipt, audit information, or undo path.
10. Demonstrate what happens when WebMCP is unavailable or a state becomes stale.

This proves shared context, human control, agent-specific orchestration, and operational maturity in one narrative.

## Evidence to bring

The [OpenAI WebMCP showcase](https://developers.openai.com/showcase?view=webmcp-apps) provides examples of shared document, commerce, meal-planning, 3D, and photo-editing experiences. Use these as pattern references, not as a reason to copy their surface area.

Your own project should show:

- the exact tools and schemas;
- the human UI path and the agent path;
- the shared command/domain path;
- before/after task metrics;
- state and lifecycle handling;
- user confirmation and recovery;
- failure behavior; and
- why WebMCP is better here than backend MCP alone.

## Evaluation story

Measure the competition claim directly:

| Claim | Evidence |
| --- | --- |
| Better actuation | Correct tool selection, valid arguments, fewer UI steps, lower latency |
| Better workflow | Completion rate for comparison, batching, preparation, or recovery tasks |
| Better human experience | User control, review comprehension, takeover rate, trust, and recovery |
| Better business outcome | Conversion, support time, completed work, quality, or retention proxy |
| Safer operation | No unintended side effects in adversarial and stale-state tests |
| Real WebMCP value | WebMCP outperforms UI-only and is preferable to backend-only for the chosen live-context task |

Do not use token reduction as the sole success metric. A shorter path that produces an incorrect purchase or an invisible destructive action is a failure.

## What not to claim

- Do not claim WebMCP replaces MCP.
- Do not claim that exposing tools creates new backend authority.
- Do not claim that agent-only tools are safe because humans cannot see them.
- Do not claim that a demo proves cross-browser production readiness.
- Do not claim that `readOnlyHint` is an authorization control.
- Do not present a browser automation wrapper as a redesigned business process.
- Do not remove the human UI to make the agent look more autonomous.
- Do not claim that TwinSurface, as a generic dual-surface architecture, is an industry first or a new WebMCP primitive.
- Do not claim that agent-only tools, staged approval, or state-dependent registration are original without identifying a narrower domain-specific contribution.

## Recommended positioning statement

> Our project treats WebMCP as a second, semantic interaction surface—not a second business system. People retain the visible interface and final control; agents receive high-level tools for intent resolution, comparison, preparation, and recovery. Both paths operate on the same live state and pass through the same authoritative business rules. This makes the product better for agents without making it worse for humans.

## Final strategic test

If removing the WebMCP tools would leave the product with exactly the same workflow, value proposition, and user experience—apart from faster clicking—the project is probably a remote-control demo. That may be a valid technical demonstration, but a stronger competition entry should show at least one new collaborative workflow that is difficult, inefficient, or ambiguous for a human-only interface and unnecessary or context-poor for backend MCP alone.

Before committing to the submission, verify the current [Devpost rules](https://webmcp.devpost.com/rules) and eligibility list against the entrant's exact UK residency or legal-entity status. The previously noted Hong Kong exclusion is not a current blocker for this participant.
