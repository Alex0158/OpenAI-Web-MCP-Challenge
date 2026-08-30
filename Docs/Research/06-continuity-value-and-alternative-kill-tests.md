# Continuity Value and Alternative Kill Tests

**Role:** SUPPORTING product and scientific research  
**Status:** Active hypothesis and evaluation plan; does not select the demo application  
**Observed:** 2026-08-30  
**Scope:** Value of authoritative page re-entry, exact-thread continuity, structured handoff,
human control, and measurable business outcomes

## Executive judgment

The concept currently bundles three different continuity claims that must be tested
separately:

1. **Authority continuity:** the resumed Agent reads current business truth and current
   capabilities from the canonical page.
2. **Artifact continuity:** the resumed work targets the same persistent business object and
   revision.
3. **Deliberation continuity:** prior goals, constraints, rejected alternatives, and rationale
   materially improve the next result.

The first two claims are central and technically composable in the current P0. Their user
value remains a hypothesis. The third claim is plausible but not yet proven, and an exact
platform thread is only one way to carry it. The product must not equate a persistent
conversation container with reliable or unique memory.

The sealed-context H0b probe now proves a narrower operational fact: one current-build
scheduled turn in an existing task recovered a bounded prior re-entry receipt and used it to
regain the canonical page and a genuine read-only Site Tool. It does not prove that retaining
the full thread improves the result over carrying the same bounded receipt or capsule into a
fresh Agent.

The later H1 pass extends the mechanism evidence: the retained receipt was sufficient to
enforce a no-event stop, carry one authenticated event through Receiver restart, continue the
same artifact once through fresh genuine Site Tools, and recover idempotently from omitted
acknowledgement. It still does not isolate whether full-thread deliberation contributed any
value beyond the bounded receipt and explicit one-run test instructions.

A later domain-neutral
[method calibration](../../Experiments/continuity-calibration/verdict.md) completed eight
no-retry structured runs comparing a resumed CLI session plus a strong capsule with a fresh
session receiving the same capsule. Its frozen verdict is `REVISE_PROTOCOL`: seven runs
failed only an ambiguous self-reported tool-inventory gate, and fresh versus resumed CLI
runs exposed condition-correlated diagnostics. All eight outputs nevertheless passed the
action, revision, prior-rule, current-fact, stale-rejection, boundary, and privacy checks.
That descriptive result proves neither superiority nor equivalence. It establishes that the
app-specific study must score actual runtime tool traces and control the system/tool startup
surface rather than trusting model-reported tool lists.

The strongest current product thesis is therefore:

> Reduce context reconstruction, handoff errors, stale-state actions, and abandoned work in
> asynchronous web workflows by returning to the same work with bounded prior rationale and
> mandatory fresh page authority.

“Wake the same thread” is a capability hypothesis, not the customer outcome.

## 1. First-principles model

Let:

- `X_t` be authoritative current page state, identity, permissions, artifact revision, and
  currently registered Site Tools;
- `H` be the prior conversation and deliberative history;
- `S` be a bounded, source-tagged continuation capsule distilled from `H`;
- `G` be the Receiver-validated Grant and stopping boundary; and
- `E` be the later business event.

The intended next action is approximately:

~~~text
Action = f(X_t, relevant(H or S), G)
~~~

`E` is only a reason to check whether work should resume. It is not business truth and must
not become a free-form Agent instruction.

This model creates two independent empirical questions:

1. Does fresh page re-entry reduce stale or unauthorized actions compared with acting from
   the event or prior conversation alone?
2. After controlling for the page and a structured capsule, does the exact resumed thread
   still produce a material improvement?

The decisive exact-thread test is:

~~~text
Performance(X_t + full thread) > Performance(X_t + bounded capsule)
~~~

If this inequality does not hold on meaningful outcomes, exact-thread continuity should be
an adapter optimization rather than the product's core claim.

## 2. What external research supports

External evidence supports explicit resumption cues and structured continuity, but it does
not directly prove that an AI system must resume one platform thread.

| Evidence | Relevant signal | Limit of inference |
|---|---|---|
| [Parnin and Rugaber, interrupted programming tasks](https://chrisparnin.me/pdf/parnin-icpc09.pdf) | People reconstruct context after interruption and commonly navigate before resuming work | Human programming behavior is an analogy, not an Agent benchmark |
| [Altmann, resumption lag and cues](https://www.interruptions.net/literature/Altmann-CogSci04.pdf) | External task cues reduce resumption cost | Supports a good continuation cue, not necessarily a full transcript |
| [I-PASS handoff study](https://pubmed.ncbi.nlm.nih.gov/25372088/) | Structured handoffs can transfer action lists, contingencies, and ownership across different people | Shows that continuity can be portable rather than executor-bound |
| [Lost in the Middle](https://aclanthology.org/2024.tacl-1.9/) | Long-context use varies with information position | A full thread is not guaranteed to expose the right prior fact |
| [LongMemEval](https://arxiv.org/abs/2410.10813) and [LoCoMo](https://arxiv.org/abs/2402.17753) | Long-term dialogue memory remains difficult, especially for temporal updates and causal reasoning | A stored history is not authoritative memory |
| [Human-AI synergy meta-analysis](https://www.nature.com/articles/s41562-024-02024-1) | Adding a human boundary does not automatically create better joint performance | Human review must expose evidence, diff, uncertainty, and consequences |
| [Bansal et al. on explanations and team performance](https://www.microsoft.com/en-us/research/publication/does-the-whole-exceed-its-parts-the-effect-of-ai-explanations-on-complementary-team-performance/) | Explanations can increase acceptance of correct and incorrect advice | Narrative rationale alone is not an adequate control surface |

These sources motivate controlled project experiments. They do not validate this project's
commercial value by themselves.

## 3. When exact-thread continuity could matter

Exact-thread continuity has the best chance of producing material value when:

- correct action depends on soft constraints, risk preferences, or stakeholder intent that
  are absent from the page;
- negative knowledge matters, such as why a plausible alternative was rejected;
- the artifact is a jointly developed analysis or creative object rather than a fully
  serialized form;
- reconstructing the prior rationale would require new user questions or repeated research;
- omission cost is higher than the privacy, compute, and platform-coupling cost of history;
- the user needs one continuous decision provenance; and
- the resumed Agent prepares work but cannot perform the final consequence.

It is weak or harmful when:

- the page and artifact schema already contain all decision-relevant state;
- a fresh Agent can receive the same evidence and a sufficient capsule;
- stale or noisy history competes with new authority;
- the task benefits from an independent reviewer;
- the old context contains unrelated sensitive data; or
- exact task binding materially reduces reliability or portability.

## 4. Domain-neutral controlled experiment

Use the same model, event, canonical page, tool schemas, artifact, and scoring rubric across
all conditions.

| Condition | Prior deliberation | Fresh canonical page |
|---|---|---|
| `N` | Human notification only | Yes |
| `F0` | Fresh Agent, no prior capsule | Yes |
| `FC` | Fresh Agent plus bounded continuation capsule | Yes |
| `TR` | Exact resumed thread with prior history | Yes |
| `TE` | Exact resumed thread | No; event payload only |

Test at least four workflow families:

1. **State-sufficient control:** all necessary facts are on the page.
2. **Rationale-dependent:** prior discussion contains genuine constraints, rejected options,
   and reasons that are absent from the page.
3. **Stale-history conflict:** current page state intentionally invalidates an earlier
   assumption.
4. **Long and noisy context:** a small number of important decisions are embedded in much
   irrelevant history.

Add a privacy trap in which the old thread contains unrelated data that must not affect or
appear in the resumed artifact.

Before using results causally, freeze the task set, input evidence, scoring rubric, capsule
construction protocol, and stopping rules. Run repeated trials with randomized condition
order and stable model/tool settings. Blind evaluators to condition labels, score critical
errors separately from style, and retain per-case traces and costs. Pilot variance should
determine the final sample size; a single polished workflow is demo evidence, not an
experiment.

Record `available_tools`, preregistered `required_tools`, and observed runtime tool calls as
three separate variables. Never use a model-authored list as proof of tool availability or
invocation. The fresh and resumed conditions must also receive equivalent system
instructions, tool catalogs, startup diagnostics, and failure surfaces; otherwise the result
is a total platform-treatment observation rather than an isolated history effect.

## 5. Falsifiable hypotheses

- **H1 — Grounding:** conditions with fresh page re-entry produce fewer stale-state actions
  than `TE`.
- **H2 — Non-Markovian value:** `TR` retains more genuine prior constraints than `F0` on
  rationale-dependent cases.
- **H3 — Structured substitution:** determine how much of the `TR` advantage is reproduced
  by `FC`.
- **H4 — Selective memory:** `FC` outperforms raw `TR` in noisy or superseded histories.
- **H5 — Authority preservation:** grounded conditions use only current-stage Site Tools,
  preserve the correct artifact revision, and stop at the boundary.
- **H6 — Appropriate reliance:** a source-linked proposal and diff help a reviewer accept
  correct work and reject incorrect work better than narrative explanation alone.
- **H7 — Economic value:** saved active-attention time and avoided-error value exceed
  integration, compute, consent, security, and platform-lock-in costs.
- **H8 — Provenance:** a managed context adds audit completeness beyond what a workflow
  ledger and capsule can provide.

## 6. Measures and preliminary kill gates

Primary success requires all of the following:

- use the current authoritative state;
- retain all critical prior constraints;
- reject stale or revoked assumptions;
- target the correct artifact revision;
- use only the current-stage tool surface; and
- stop before the human consequence.

Secondary measures include event-to-reviewable-result latency, human active-attention
seconds, clarification turns, critical omissions, unsupported assumptions, stale-memory
override rate, reviewer edits, appropriate-reliance rate, token/tool cost, duplicate or
wrong-context continuation, completion rate, and cost per successful continuation.

Before selecting a domain, use preliminary mechanism gates rather than claiming universal
thresholds:

- page-grounded conditions must materially beat event-only continuation on stale-state
  errors;
- `TR` must beat `FC` on at least one safety, quality, or time outcome without increasing
  privacy or stale-history failures to remain a core requirement; and
- all Agent variants must beat a notification-and-deep-link control on a selected app's
  actual user outcome.

Final thresholds must be calibrated after the application, error cost, baseline handling
time, and unit economics are selected with Eddy.

## 7. Decision consequences

| Result | Concept consequence |
|---|---|
| `TR > FC` and risks are controlled | Keep exact managed context and demonstrate a constraint that exists only in prior deliberation |
| `TR ≈ FC > F0` | Make structured workflow memory the core; exact thread becomes optional |
| Grounded conditions win but `TR` adds no value | Position the mechanism as state-grounded event re-entry |
| Backend API is equivalent to page re-entry | WebMCP materiality is not proven; the concept collapses toward generic orchestration |
| Notification/deep link is equivalent | The Agent continuation mechanism lacks sufficient product value |

If a capsule becomes the preferred mechanism, it should include workflow and artifact IDs,
expected revision, canonical origin, authorized event and expiry, prior decisions and their
provenance, rejected alternatives, open questions, permitted preparation, and the
configured human consequence. It must never replace current page truth.

## 8. Current conclusion and open questions

**MECHANISM-FEASIBLE:** mandatory page re-entry, artifact continuity, current-stage tool
discovery, and a human review boundary are technically composable and form testable product
hypotheses.

**UNPROVEN:** exact-thread continuity is materially better than a fresh Agent with a
well-designed continuation capsule.

**UNKNOWN UNTIL APP SELECTION:** user willingness to grant future authority, acceptable
latency, error cost, retention requirements, economic value, and the right human approval
mechanism.

No demo application is selected by this document.
