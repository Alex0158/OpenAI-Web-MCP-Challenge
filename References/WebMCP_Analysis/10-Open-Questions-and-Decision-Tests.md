# WebMCP: Open Questions and Decision Tests

**Status:** Research dossier

**Snapshot:** 2026-08-28

## Purpose

The right next step for a WebMCP project is not to ask whether the technology is exciting. It is to test whether a specific user journey is materially better, safe enough, and maintainable enough in the target browser and agent hosts.

## Architecture decision to prove

The first experiment should distinguish three different claims instead of treating them as one:

1. **Semantic remote control:** a WebMCP tool calls an operation the human UI already exposes.
2. **Agent workflow improvement:** agent-specific tools reduce steps, ambiguity, or recovery cost while using shared business rules.
3. **Agent-native product capability:** the product adds a new collaborative workflow that is valuable to both the user and the business.

Build a baseline for each claim. If the result is only claim 1, present WebMCP as an interaction and reliability improvement. Do not claim that the business logic has been transformed. To justify claims 2 or 3, show a concrete agent-oriented use case—such as constraint-based comparison, multi-item preparation, preview and approval, or state-aware recovery—and trace it back to the same authoritative domain rules used by the human path.

The recommended target architecture is:

```text
Human workflow  -\
                 +-> shared domain rules and backend authority
Agent workflow  -/
```

The agent workflow may have a different sequence and higher-level tools. It must not become a parallel business system whose permissions, prices, or commit rules drift from the human path.

## Highest-priority unanswered questions

### Standards and platform

- Which parts of the current imperative API will survive standardization?
- Will the declarative form API join the formal specification, and in what shape?
- Will Firefox and Safari implement a compatible surface?
- Will browser-native agents expose a stable, provenance-preserving observation format?
- How will implementations handle tool registries across routes, top-level documents, frames, and workers?

### Security and trust

- How can a host verify that a tool is owned by the intended application and has not been replaced by a dependency or race?
- How should agents identify themselves without creating tracking or excluding independent clients?
- Which action classes require native confirmation, and how should the browser distinguish preview, draft, reversible, consequential, financial, and destructive operations?
- How should untrusted output be separated from trusted control instructions in multimodal and streamed results?
- What guarantees exist when a tool is unregistered or a page navigates after a mutation has started?

### Engineering and product

- Does the shared page state improve user outcomes enough to justify integration and lifecycle cost?
- How much tool-surface size can the target model reliably handle before selection errors or observation cost rise?
- Which operations should be tools, which should remain UI interactions, and which belong in backend MCP?
- Can the team support tool versioning, localization, analytics, and rollback as a real product contract?

## Decision-test program

### Test 1: UI-only versus WebMCP journey benchmark

Choose one journey with a clear user goal, such as adding a specific product variant to a cart or preparing a dashboard report. Run the same state and intent through:

1. ordinary UI automation;
2. WebMCP tools in the target host; and
3. backend MCP or API plus a visible page handoff, where relevant.

Measure completion, correct tool/control selection, valid arguments, time, model/token cost, human takeover, stale-state failures, and unintended side effects. Do not declare victory from latency alone.

### Test 2: State and lifecycle resilience

Inject controlled changes between discovery and execution:

- user edits the selected item;
- route changes;
- component unmounts;
- tool list changes;
- page enters and leaves BFCache;
- network request times out;
- user cancels during input and after server commit;
- a second tab changes the same entity.

Pass criteria should include safe refusal or recovery, no duplicate mutation, accurate user-visible state, and an audit trail for any partial commit.

### Test 3: Tool-surface integrity

In a controlled test application, attempt to:

- register a colliding tool name;
- alter a description or parameter description with instruction-like text;
- race registration and unregistration;
- return untrusted user content containing instructions;
- expose a cross-origin iframe with and without policy delegation;
- mark a mutating tool as read-only;
- inject a third-party script that attempts to alter the registry.

The goal is not merely to see whether the model is fooled. It is to verify that provenance, policy, confirmation, server validation, logging, and rollback prevent a bad outcome.

### Test 4: User trust and review quality

Compare users completing the same task with and without WebMCP. Ask:

- Did the user understand what the agent did?
- Could the user identify target, scope, price, data disclosure, and side effects?
- Did the user know when a commit occurred?
- Could the user stop, edit, undo, or recover?
- Did the user feel more or less in control?

The result is a product metric, not a model benchmark.

### Test 5: Cross-host fallback

Test at least one supported WebMCP host, one host without WebMCP, and ordinary human interaction. The journey must degrade to a useful and accessible experience. Record capability detection, browser version, agent host, model, tool-list state, and failure reason.

## Suggested release gates

These are recommended decision thresholds to adapt to the risk of the journey, not universal WebMCP requirements.

| Gate | Low-risk read/reversible tool | Consequential or sensitive tool |
| --- | --- | --- |
| Server-side authorization | Required | Required, with operation-specific policy |
| Input validation | 100% deterministic coverage for accepted paths | 100% plus adversarial and ownership tests |
| Correct tool/argument eval | Defined baseline with monitored regressions | Strict baseline and no unresolved unsafe escalation |
| User confirmation | Optional only when scope and privacy are clear | Required before commit |
| Idempotency | Required for writes | Required with receipt and replay protection |
| Provenance | Origin and tool version logged | Origin, tool version, state snapshot, actor/agent context, and audit ID |
| Cancellation/recovery | Tested | Tested before, during, and after commit |
| Fallback UI | Required | Required and accessible |
| Rollout | Canary and monitoring | Small controlled cohort with rapid rollback |

## Open issue watchlist

The following official repository discussions should be monitored as the standard evolves:

- [#105 Agent identity](https://github.com/webmachinelearning/webmcp/issues/105)
- [#121 Security policy and tool call controls](https://github.com/webmachinelearning/webmcp/issues/121)
- [#161 Skills](https://github.com/webmachinelearning/webmcp/issues/161)
- [#165 User interaction and elicitation](https://github.com/webmachinelearning/webmcp/issues/165)
- [#176 Reversible and consequential hints](https://github.com/webmachinelearning/webmcp/issues/176)
- [#199 Framework/lifecycle concerns](https://github.com/webmachinelearning/webmcp/issues/199)
- [#212 Service Worker integration](https://github.com/webmachinelearning/webmcp/issues/212)
- [#218 Unregister during in-flight execution](https://github.com/webmachinelearning/webmcp/issues/218)
- [#227 Cross-document discovery](https://github.com/webmachinelearning/webmcp/issues/227)
- [#232 Application-driven observation](https://github.com/webmachinelearning/webmcp/issues/232)
- [#234 Agent sessions and compaction](https://github.com/webmachinelearning/webmcp/issues/234)

## Questions that require project-specific decisions

Before implementation, a project owner should write down:

1. Which exact user journey is in scope?
2. Which browser and agent hosts are required at launch?
3. Which actions are read, reversible, consequential, financial, private, or destructive?
4. Which layer owns authority: page, backend, or both?
5. What is the confirmation and rollback design?
6. How will third-party scripts and tool registration be governed?
7. What is the fallback when the feature is unavailable or a call fails?
8. What evidence will justify expanding from a pilot to a broader rollout?

## Recommended immediate experiment

Build one small, read-only or reversible vertical slice with three tools, a visible activity log, state-version validation, deterministic callback tests, model-selection evals, and an ordinary UI fallback. Use it to measure whether shared live state improves completion and user control. Do not begin with checkout commit, account deletion, permission changes, or unrestricted “agent mode.”

## Final decision rule

Proceed when the journey shows a material, repeatable benefit over the best fallback, the target host actually supports the required subset, and the security gates are closed. Pause when the benefit is only theoretical, when the tool surface is too broad to govern, or when lifecycle/provenance failures cannot be explained and recovered safely.
