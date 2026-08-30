# MVP and MVP2 Integration Assessment and Hackathon Recommendation

**Role:** SHARED SUPPORTING architecture, product, and competition handoff between MVP1 and
MVP2  
**Status:** Advisory comparison; no Core decision, app selection, transport selection, or
production claim is changed by this report  
**Prepared:** 2026-08-30, Europe/London  
**Audience:** Alex, the project team, and future Codex sessions  
**Compared implementations:** [`mvp/`](../mvp/) and [`mvp2/`](../mvp2/)

## 0. Authority and reading rule

This report records observations and recommendations after a live review of both
implementations and one clean MVP2 Desktop replay. It is deliberately stored in the
root-level `mvp-shared/` layer, alongside `mvp/` and `mvp2/`, because it is the integration
bridge between the implementations rather than another research experiment. It remains
supporting material and does not select a final application or change the mechanism.

The following sources continue to control project truth:

1. [`Core/00-current-status.md`](../Docs/Core/00-current-status.md) controls current status and
   evidence claims.
2. [`ADR-0002`](../Docs/Decisions/ADR-0002-separate-mechanism-from-demo-app.md) controls the
   separation between the mechanism and the unselected demo app.
3. [`ADR-0004`](../Docs/Decisions/ADR-0004-separate-event-protocol-from-agent-transport.md)
   controls the separation between the Website Backend-to-Receiver protocol and the
   Receiver-to-Agent transport.
4. [`Core/03-system-design.md`](../Docs/Core/03-system-design.md) controls reusable architecture
   and contract boundaries.
5. [`Core/06-mvp-and-demo.md`](../Docs/Core/06-mvp-and-demo.md) controls app selection, the
   challenge slice, and the three-minute demo shape.

Where this report recommends a new durable choice, the team must accept a new ADR before
promoting it into Core or restructuring the implementations around it.

## 1. Executive conclusion

`mvp/` and `mvp2/` are not competing versions of the same product and should not be judged
as a winner-takes-all choice.

- **MVP1 (`mvp/`) is the stronger mechanism laboratory and future infrastructure core.** It
  is domain-neutral, separates the Receiver from Agent adapters, uses durable state and
  compare-and-swap controls, has extensive replay and crash-recovery coverage, and preserves
  careful proof boundaries.
- **MVP2 (`mvp2/`) is the stronger product-shaped vertical slice and live explanatory
  demonstration.** It turns the mechanism into an understandable two-actor workflow,
  exposes genuine stage-derived Site Tools, shows the same artifact before and after an
  asynchronous event, uses a fast direct Desktop queue adapter, and makes the human boundary
  visible.
- **The strongest hackathon submission combines their strengths without merging them
  indiscriminately.** The submission should present an open re-entry protocol proposal and
  reference Receiver as the innovation, and one polished host application as the proof that
  the infrastructure creates real human-agent value.

The recommended relationship is:

```text
MVP1
  = protocol, Receiver, Grant authority, durability, adapters, conformance evidence

MVP2
  = first product-shaped Host Adapter and live demonstration pattern

Selected hero app
  = final judge-facing domain implementation, still requiring an app-selection ADR
```

MVP2 should therefore be treated as **MVP 2.0 of the explanatory vertical slice**, not as a
replacement for the verified MVP1 mechanism and not as a decision that TenderRelay is the
final app.

## 2. Correct product framing

The project is defining infrastructure around WebMCP, not a tender application.

The intended product thesis is:

> A user can authorize one bounded future business event to return an Agent to the correct
> live web workflow, where the Agent must read current authoritative state, discover the
> Site Tools valid for that state, continue the shared artifact, and stop at a visible human
> decision boundary.

TenderRelay is one possible Host Application Adapter. Any other business application can
participate if it supplies the required workflow state, canonical page, event semantics,
Site Tool lifecycle, artifact rules, and human boundary.

The project is not extending WebMCP itself. WebMCP makes the current page actionable. This
project proposes the missing consented continuation layer that carries one narrowly scoped
business transition across time and back to the page.

### 2.1 The two contracts must remain separate

```text
Contract A: Website Backend -> Receiver
  Project-owned, domain-neutral, versioned typed-event protocol

Contract B: Receiver -> Agent runtime
  Platform-specific continuation adapter
```

Contract A can be made open and reusable now. A conforming backend should not need custom
Receiver control logic. Contract B remains dependent on the selected Agent runtime and
deployment topology. Codex Desktop queueing, a private Desktop relay, scheduled pull, a
paired connector, and a future supported public API are different adapters or transports;
they are not interchangeable proof.

This distinction is the most important architectural rule for future work. It prevents the
absence of a public Codex wake API from being mistaken for a failure of the business-event
protocol, while also preventing a local Desktop experiment from being presented as a public
platform contract.

## 3. Evidence classification used in this report

The labels below follow the repository's evidence discipline.

| Label | Meaning here |
|---|---|
| **VERIFIED** | Directly supported by current source, tests, or a recorded/runtime-observed pass |
| **INFERENCE** | Reasonable interpretation of evidence, but not an independently proven fact |
| **RECOMMENDED** | Proposed next action or design choice; not yet accepted |
| **TARGET** | Desired future capability requiring implementation and evidence |
| **UNKNOWN** | Material question for which the current project has insufficient evidence |

## 4. What MVP1 contributes

### 4.1 Verified strengths

MVP1 is a domain-neutral P0 fixture with additive H0b, H1, H2a, and H2 experiments. Its
current [`README`](../mvp/README.md) and evidence packages support the following bounded
strengths:

- **VERIFIED:** Genuine page-bound WebMCP discovery and invocation occurred in both stages
  of a controlled Desktop run.
- **VERIFIED:** Receiver-owned consent and private managed-context binding produced an
  opaque Host-facing binding rather than exposing a raw Desktop task ID.
- **VERIFIED:** One authenticated typed event reached the intended bound task and the
  resumed run re-entered the canonical page.
- **VERIFIED:** Fresh page state produced a changed Stage-B Site Tool surface.
- **VERIFIED:** The same artifact was continued and remained uncommitted at the human
  boundary.
- **VERIFIED:** Exact event replay did not create a second logical event, run, or effect in
  the bounded tests.
- **VERIFIED:** SQL compare-and-swap protects workflow transitions and artifact writes in
  the current fixture.
- **VERIFIED:** The current page lifecycle uses `AbortSignal` to remove tools that no longer
  apply after authoritative state changes.
- **VERIFIED:** H1 tested one authenticated durable event across Receiver process restart,
  one Host effect after acknowledgement loss, and genuine Inbox and Host Site Tool calls.
- **VERIFIED:** H2a reconstructed the task-scoped Browser runtime after its Node kernel was
  terminated, while the Desktop app remained running.
- **VERIFIED:** H2 tested a crash-recoverable enrollment service contract against a separate
  synthetic durable destination, including real process termination boundaries and
  concurrent approval convergence.
- **VERIFIED:** The current full deterministic suite contains 88 passing tests.

### 4.2 Architectural strengths

MVP1 already contains the conceptual seams needed for reusable infrastructure:

- `src/receiver/` separates Grant, event, consent, enrollment, and Inbox concerns.
- `src/adapters/` defines platform adapter boundaries and multiple test/runtime paths.
- `src/database.mjs` provides durable Receiver records, runs, bindings, outboxes, and
  indexes.
- `src/domain.mjs` centralizes authoritative fixture state and concurrency controls.
- `src/trace.mjs` gives correlated evidence without requiring the user-facing app to own
  Receiver internals.
- the private relay surface narrowly allowlists task-control operations.

These seams are much closer to a protocol reference implementation than MVP2's integrated
server.

### 4.3 MVP1 limitations

MVP1 is intentionally a technical fixture. Those strengths become weaknesses if it is shown
unchanged as the hackathon product:

- **VERIFIED:** The host workflow is generic and does not identify a selected real user,
  buyer, or market problem.
- **VERIFIED:** The final application, product name, domain, and event remain unselected.
- **VERIFIED:** Its complete reproduction path requires specialist setup and private
  current-build Desktop capabilities.
- **INFERENCE:** A judge can understand the mechanism from the documentation but may not
  experience a coherent product or obvious user value within the first 30 seconds.
- **INFERENCE:** Showing H0b/H1/H2 details in the main demo would increase cognitive load
  without proportionally increasing the visible human-agent benefit.
- **UNKNOWN:** The exact-task path has not yet been shown to deliver materially greater user
  value than a strong bounded continuation capsule in a corrected controlled comparison.
- **UNKNOWN:** No public, supported, production Receiver-to-Codex transport has been proven.

MVP1 should remain the proof and conformance foundation. It should not be forced to become
the polished domain application.

## 5. What MVP2 contributes

### 5.1 Current implementation shape

MVP2 is a small TenderRelay kill-test application with:

- one applicant workspace;
- one independent reviewer surface;
- one diagnostics surface;
- a two-stage state machine (`DRAFT`, `UNDER_REVIEW`, `CHANGES_REQUESTED`);
- stage-derived imperative WebMCP tools;
- a website-authored re-entry Manifest;
- a scoped local Grant;
- an HMAC-signed clarification event;
- replay and state-version checks;
- a direct `codex queue --thread` delivery adapter;
- a visible resumed-stage clarification draft; and
- no clarification-submission Site Tool.

Its implementation is approximately 1,700 source lines across 13 files and currently has
five focused tests. Mutable local state is excluded under `.tenderrelay/`.

### 5.2 Verified live replay

One clean live replay was performed on 2026-08-30 with the original applicant page closed
before the reviewer event. The observed sequence was:

1. Reset the workflow to `DRAFT`, state version 1.
2. Open the canonical applicant page in the Codex in-app Browser.
3. Discover genuine Stage-A Site Tools.
4. Read requirements and the website-authored re-entry Manifest.
5. Update the visible bid draft through a Site Tool.
6. Attach the scoped clarification Grant.
7. Move the tender to `UNDER_REVIEW`, state version 2.
8. Close the applicant page completely.
9. Use the reviewer UI to commit `CHANGES_REQUESTED`, state version 3.
10. Verify the HMAC event and queue a fixed re-entry message to the same Codex task.
11. Observe automatic same-task re-entry without a new manually authored user request.
12. Open the exact canonical URL in a fresh in-app Browser tab.
13. Discover exactly the Stage-B tools:
    `get_current_tender_state`, `read_clarification_request`, and
    `update_clarification_draft`.
14. Invoke those three tools in that order, without a direct REST substitution.
15. Update the visible clarification draft while `submittedAt` remained `null`.
16. Confirm the resumed stage exposed no submission Site Tool.

The event verification and Receiver queue records in that replay were approximately 135 ms
apart. This is a useful observation about the local direct queue path, not a general latency
benchmark and not evidence about remote delivery, task scheduling, or Agent completion time.

The live replay is summarized in [`mvp2/README.md`](../mvp2/README.md). It has not yet
been frozen into an evidence package equivalent to MVP1's correlated artifacts.

### 5.3 MVP2 product and demo strengths

- **VERIFIED:** The workflow is visually understandable without first learning Receiver
  internals.
- **VERIFIED:** Human UI and Agent Site Tools act on the same visible artifact.
- **VERIFIED:** The tool surface changes visibly with authoritative workflow state.
- **VERIFIED:** Reviewer feedback is marked as untrusted content and read through a
  dedicated Stage-B tool.
- **VERIFIED:** The resumed Agent can draft but cannot submit the clarification.
- **VERIFIED:** Diagnostics expose Grant, state, event, delivery, draft, and human-boundary
  checkpoints.
- **INFERENCE:** The applicant/reviewer split makes the asynchronous external-actor moment
  more legible than the generic fixture.
- **INFERENCE:** The direct queue adapter creates a faster and more dramatic recorded demo
  than a scheduled polling path.
- **INFERENCE:** The application is a useful template for how a selected domain should map
  its state, event, artifact, Site Tools, and approval boundary onto the mechanism.

### 5.4 MVP2 weaknesses and risks

- **VERIFIED:** Domain, workflow ID, event type, origin, and tool names are hardcoded around
  TenderRelay.
- **VERIFIED:** Host domain state, Gateway logic, Grant records, Receiver delivery, and audit
  records are colocated in one server and JSON state file.
- **VERIFIED:** The live adapter receives a raw task ID from a Receiver-process environment
  variable and directly invokes `codex queue --thread`.
- **VERIFIED:** The current Host receives an opaque Grant handle, but MVP2 does not implement
  the stronger Receiver-owned context capture and consent lifecycle of MVP1.
- **VERIFIED:** MVP2 has basic replay protection but not MVP1's durable run reservation,
  compare-and-swap coverage, enrollment outbox, acknowledgement recovery, or separate
  destination tests.
- **VERIFIED:** MVP2 has five tests, compared with MVP1's much broader 88-test suite.
- **VERIFIED:** The initial stage currently exposes `submit_approved_bid` as a Site Tool.
  Passing `approved=true` is a guard, but it is not proof that an authenticated human
  personally performed the consequential approval.
- **UNKNOWN:** The direct queue path is undocumented as a stable public OpenAI platform
  contract and has not been tested across accounts, machines, app restart, or judge
  environments.
- **UNKNOWN:** A remote, independently hosted Website Backend has not yet sent the event to
  a separately deployed Receiver in MVP2.
- **UNKNOWN:** TenderRelay has not been selected through the canonical app scorecard and has
  no accepted app-selection ADR.

MVP2 is therefore strong evidence of an integration path and demo language, but it should
not become the protocol authority or production Receiver core.

## 6. Detailed comparison

| Dimension | MVP1 | MVP2 | Recommended ownership |
|---|---|---|---|
| Primary purpose | Domain-neutral technical validation | Product-shaped vertical slice | Keep both purposes explicit |
| Host domain | Generic workflow fixture | Tender clarification | Selected hero app remains open |
| Business state | Durable SQLite fixture with revision controls | Local JSON state with state version | Host Adapter owns domain state; production-like demo uses durable DB |
| Manifest | Signed, validated, versioned P0 offer | Scoped local Tender Manifest | MVP1 protocol model |
| Consent | Receiver-owned challenge and decision | In-page Grant attachment | MVP1 Receiver-owned model |
| Context binding | Private managed context and opaque binding | Raw task ID only in Receiver environment; Host sees opaque Grant handle | MVP1 adapter contract plus MVP2 UI wording |
| Event validation | Authentication, scope, canonical URL, state, run and replay controls | HMAC, scope, state, expiry, run and replay checks | MVP1 validation core |
| Delivery | Fixture, App Server, private Desktop relay, Desktop task, and heartbeat experiments | Direct local `codex queue` | Adapter interface; retain direct queue only as bounded demo adapter |
| Durability | SQLite, outboxes, CAS, crash tests | JSON file, synchronous flow | MVP1 core |
| WebMCP lifecycle | Generic Stage-A/Stage-B plus lifecycle probe | Domain-specific state-derived tools using `AbortSignal` | Shared lifecycle helper informed by both |
| Human experience | Technical fixture | Strong applicant/reviewer/diagnostics UI | MVP2 pattern or selected hero app |
| Human boundary | Uncommitted artifact and absent commit tool | No clarification submit tool; initial submit tool still exposed | Consequential action should remain human UI-only |
| Observability | Detailed trace and evidence packages | Simple visual PASS/WAIT diagnostics | Correlate shared IDs; show MVP2-style summary over MVP1 trace |
| Tests | 88 current deterministic tests | 5 focused tests | Reuse MVP1 conformance suite; retain scenario tests |
| Judge clarity | Low to medium without explanation | High | Hero app based on MVP2 pattern |
| Public reproducibility | Not yet proven | Not yet proven | Highest-priority release gate |

## 7. Mechanism efficiency assessment

Efficiency must not be reduced to event latency. The useful unit is one correct, authorized,
non-duplicated continuation that saves more user effort than enrollment and monitoring cost.

### 7.1 Direct push path

MVP2's direct queue adapter has the shortest local path:

```text
verified event -> Receiver process -> codex queue -> same task
```

Advantages:

- low observed local queue latency;
- no polling no-op runs;
- immediate and visually strong demo;
- minimal code and operational steps on the tested machine.

Disadvantages:

- depends on an undocumented local CLI behavior;
- requires a task binding available to the local process;
- has no proven public remote ingress or connector lifecycle;
- cannot currently be offered as a universal judge/customer path.

**RECOMMENDED:** Keep this as an explicitly labelled `codex-desktop-demo` adapter for the
recorded live demonstration. Do not make it the event protocol or the production claim.

### 7.2 Scheduled pull path

MVP1's H0b/H1 work provides a supported-feature-shaped alternative in which a scheduled turn
polls a Receiver Inbox and only continues when an authenticated event is pending.

Advantages:

- avoids direct business-backend control of the Desktop task;
- demonstrated a no-event gate, Receiver restart persistence, acknowledgement retry, and
  exact-event replay behavior;
- can preserve a sealed bounded receipt inside an existing task.

Disadvantages:

- adds polling latency and potentially many no-op runs;
- current-build Site Tool availability in scheduled turns is empirical, not a public
  compatibility promise;
- sparse watches can create poor cost and battery economics;
- describing it as direct event wake would be inaccurate.

**RECOMMENDED:** Preserve it as an alternative adapter experiment and evidence package. Do
not place it in the main three-minute path unless the selected app tolerates the measured
latency and the public judge flow can reproduce it.

### 7.3 Hosted and paired topologies

The protocol should support, without pretending to have already implemented:

1. local Receiver or Agent-side Receiver;
2. hosted Gateway plus paired local connector;
3. hosted Receiver plus hosted Agent runtime; and
4. a future supported native Agent event API.

The Website Backend-to-Receiver contract should remain stable while the Agent adapter is
replaceable. A hosted topology must not be selected before the chosen app defines latency,
offline, privacy, identity, administration, and cost requirements.

### 7.4 Efficiency rules for the shared protocol

- Keep the event payload minimal: identity, workflow, event type, canonical URL, state and
  artifact versions, sequence, timestamps, correlation, and signature. Do not transport a
  full Agent prompt or mutable business truth.
- Read feedback and business data from the canonical page after re-entry.
- Deduplicate before reserving or dispatching another run.
- Use one run for one accepted event in the challenge scenario.
- Avoid polling when a safe push or outbound paired channel exists.
- Do not create a microservice for each logical component during the challenge. Preserve
  code boundaries while deploying the smallest reliable topology.
- Measure event acceptance, dispatch, task start, page open, first Site Tool, artifact write,
  and human decision separately. A single end-to-end number hides the real bottleneck.

## 8. Recommended combined architecture

```text
Any conforming Host Application
  human UI + authoritative domain state + transactional event intent
                      |
                      | Re-entry Manifest / signed typed event
                      v
Project-owned protocol boundary
  schemas + canonicalization + signatures + test vectors
                      |
                      v
Receiver Core
  consent + Grants + opaque bindings + validation + dedupe + run reservation
                      |
                      v
Agent Continuation Adapter
  Codex Desktop demo | scheduled Inbox | paired connector | future hosted/native
                      |
                      v
Managed Agent context
                      |
                      v
Allowlisted canonical Host page
  fresh state + stage-derived Site Tools + shared artifact + human boundary
```

### 8.1 Proposed module responsibilities

The exact folder names require a decision, but the following logical modules should exist:

```text
protocol/
  JSON schemas, canonical serialization, signature inputs, errors, test vectors

receiver-core/
  Manifest validation, consent, Grants, binding resolution, event acceptance,
  deduplication, run reservation, delivery records, revocation and audit

host-sdk/
  Host-side helpers for creating offers and event intents and validating current state

webmcp-host/
  registration lifecycle, stage/tool replacement, state/revision guards, shared receipts

adapter-contract/
  context capture, receipt persistence, resume, canonical navigation and result evidence

adapters/
  codex-desktop-demo, scheduled-inbox, synthetic fixture, future supported adapters

conformance/
  protocol test vectors, issuer simulator, replay/tamper/stale-state tests

apps/
  generic fixture, selected hero app, optional TenderRelay reference adapter
```

### 8.2 Do not reorganize the repository immediately

The current `mvp/` contains frozen evidence paths and should not be moved merely to make the
tree look cleaner. MVP2 was intentionally added as an isolated sibling. A large folder
reorganization before the submission would create link breakage and regression risk without
proving user value.

**RECOMMENDED incremental sequence:**

1. Keep `mvp/` and `mvp2/` intact while interfaces are compared.
2. Freeze a small protocol v0.1 contract and conformance vectors.
3. Make MVP2 call MVP1-compatible protocol and Receiver interfaces through a thin adapter.
4. Replace MVP2's integrated Grant/event/delivery code one seam at a time.
5. Run both MVP1 conformance tests and MVP2 scenario tests after every seam replacement.
6. Only extract shared packages once two implementations use the same interface.
7. Preserve old evidence against its original commit and paths.

This is safer than copying MVP1 internals into MVP2 or rewriting MVP1 around TenderRelay.

## 9. Protocol proposal scope

The public deliverable can credibly be called an **open protocol proposal and reference
implementation**. It should not yet be called an adopted standard.

An established standard normally needs independent implementations, interoperability, a
change process, and external adoption. The challenge can demonstrate the path toward that
outcome by publishing:

1. a versioned Re-entry Manifest schema;
2. a Receiver-owned Continuation Grant model;
3. a signed Continuation Event schema;
4. delivery, acknowledgement, and human-decision receipt schemas;
5. canonical serialization and signing test vectors;
6. a stable error taxonomy;
7. a conformance suite for issuers and Receivers;
8. one domain-neutral fixture issuer;
9. one polished business Host Adapter; and
10. one or more Agent adapter implementations with explicit proof classifications.

### 9.1 Required protocol invariants

- An event is a wake-up signal, not business truth and not an arbitrary Agent prompt.
- The Host backend remains authoritative for domain state.
- The Receiver owns continuation authority and private context binding.
- The Host receives only opaque workflow-scoped binding material.
- Every event is authenticated, scoped, time-bounded, sequenced, and idempotent.
- Every resumed run returns to an allowlisted canonical URL and reads fresh state.
- The current page state determines available Site Tools.
- Mutating tools validate state version, artifact revision, authorization, and input at
  execution time.
- Consequential commit remains unavailable to the Agent in the selected challenge flow.
- Duplicate delivery cannot produce duplicate runs or Host effects.
- Correlation identifiers join Grant, event, delivery, run, tool, artifact, and human
  decision records without exposing credentials.

### 9.2 Interoperability proof needed before saying “any backend”

The smallest credible portability test is:

```text
independent issuer process or host
  -> authenticated public Receiver endpoint
  -> reusable Receiver validation and Grant resolution
  -> selected Agent adapter
  -> fresh canonical Host page
  -> genuine resumed-stage Site Tool
```

The issuer should be implemented without importing Receiver control logic. It should use
only the published schema, signing rules, and endpoint contract. A second independent Host
Adapter or issuer implementation would materially strengthen the protocol claim.

## 10. Host application boundary

Every business app remains responsible for:

- user and tenant identity;
- workflow ownership and permissions;
- authoritative state and artifact revisions;
- one legitimate later event;
- transactional state transition plus event intent;
- canonical URL construction;
- stage-derived Site Tools;
- domain input validation;
- human decision and receipt; and
- deterministic synthetic reset for the challenge.

The Receiver must not absorb domain logic. It should validate generic event and Grant
constraints, then dispatch the Agent. The resumed Agent must use the Host page to learn what
the event means now.

### 10.1 MVP2-to-shared-layer mapping

| MVP2 surface | Current location | Long-term responsibility |
|---|---|---|
| Tender state and bid/clarification artifacts | `mvp2/lib/core.mjs` | Tender Host Adapter only |
| Re-entry Manifest construction | `mvp2/lib/core.mjs` | Host SDK using shared protocol schema |
| Grant creation and run limits | `mvp2/lib/core.mjs` | Receiver Core |
| Event signature and acceptance | `mvp2/lib/core.mjs` | Shared protocol and Receiver Core |
| Direct Codex queue | `mvp2/server.mjs` | `codex-desktop-demo` Agent adapter |
| State-derived Site Tool registration | `mvp2/public/tender.js` | Host app using a shared lifecycle helper |
| Reviewer state transition | `mvp2/public/reviewer.js` plus server | Tender Host domain transition and outbox intent |
| PASS/WAIT diagnostics | `mvp2/public/diagnostics.*` | Judge-facing projection over correlated shared trace |
| Five focused tests | `mvp2/test/core.test.mjs` | Tender scenario tests plus shared conformance suite |

## 11. Trust, safety, and reliability recommendations

### 11.1 Keep from MVP1

- Receiver-owned consent rather than a website self-granting future Agent authority.
- Opaque Host bindings and private managed-context records.
- One-time context capture and receipt persistence.
- State, artifact-revision, canonical URL, origin, expiry, event-type, and run-budget checks.
- Durable deduplication and atomic run reservation.
- Compare-and-swap for workflow and artifact mutations.
- Enrollment outbox and idempotent receipt destination semantics.
- Redacted public diagnostics and private detailed trace separation.
- Explicit adapter proof classifications such as synthetic, private-current-build, or
  supported-public.

### 11.2 Improve in MVP2 or the selected hero app

- Remove the initial `submit_approved_bid` Site Tool or replace it with a draft/stage action;
  require the consequential transition through an authenticated human UI control.
- Set the challenge Grant to one accepted run unless the scenario requires another bounded
  number and demonstrates why.
- Validate an expected artifact revision on every draft mutation, not only workflow state.
- Commit the Host transition and outbox intent atomically in durable storage.
- Do not use the Host-facing Grant record as the private Agent-context mapping.
- Separate issuer credentials, Receiver-client credentials, Host user identity, and Agent
  adapter credentials.
- Keep development fallback secrets visibly non-production and reject them in any public
  deployment mode.
- Add revocation and expiry behavior to the visible user experience.
- Ensure the final human approval checks the exact artifact revision that the person
  reviewed.
- Treat reviewer, webhook, email, ticket, and document text as untrusted content even after
  event authentication.

### 11.3 Failure modes required for judge hardening

At minimum, the selected vertical slice should visibly or deterministically cover:

- tampered signature;
- duplicate event;
- stale state version;
- stale artifact revision;
- expired or revoked Grant;
- wrong event type or workflow;
- wrong canonical URL or origin;
- Receiver unavailable before acceptance;
- acknowledgement loss after Host effect;
- missing or busy Agent context;
- stale authenticated browser session;
- state changing again during re-entry; and
- human rejection or edit before final commit.

Not every failure needs screen time. The demo should show one duplicate/replay safeguard and
link the remainder to tests and diagnostics.

## 12. Hackathon assessment

The governing rules and current evaluation notes remain in
[`Docs/01-official-rules.md`](../Docs/01-official-rules.md) and
[`Docs/02-submission-evaluation-strategy.md`](../Docs/02-submission-evaluation-strategy.md).
Volatile dates and requirements must be refreshed there rather than copied into this report.

The current official judging model gives equal weight to:

1. WebMCP Leverage;
2. Execution;
3. Potential Impact; and
4. Creativity and Ambition.

The official rules also require a working live URL, public source, a project description,
and a demo video. Judges may rely heavily on the description and video and are not required
to perform a deep local setup.

### 12.1 Comparative competition profile

| Submission shape | WebMCP leverage | Execution | Potential impact | Creativity and ambition | Main risk |
|---|---|---|---|---|---|
| MVP1 alone | Very strong technical evidence | Medium as a fixture | Weak until a real user and app are selected | Very strong | Judges see infrastructure proof, not a coherent product |
| MVP2 alone | Strong genuine two-stage WebMCP | Strong local product flow | Medium; tender need is plausible but unvalidated | Strong | Appears domain-specific and depends on a private local bridge |
| Combined core plus hero app | Very strong | Potentially very strong | Potentially strong with observed user pain | Very strong | Integration or deployment scope expands too far before submission |

**INFERENCE:** The combined shape has the highest winning potential because no single
criterion must subsidize a weak one. MVP1 gives technical credibility and novelty. MVP2's
pattern gives coherent execution. A selected hero workflow and evidence of real pain provide
impact. The protocol-plus-adapter framing supplies ambition without requiring a claim that
the project has already become an industry standard.

### 12.2 What judges should understand in one sentence

> Notifications tell people that a workflow changed; this infrastructure lets a person
> pre-authorize one specific change to return their Agent safely to the live page, current
> state, current tools, and human approval boundary.

### 12.3 What the three-minute demonstration should show

1. A concrete user problem and persistent artifact, not an architecture diagram.
2. A normal human web interface that also exposes genuine domain Site Tools.
3. The Agent reads current state and prepares visible work.
4. The user authorizes one named future event with expiry, one run, and a human boundary.
5. The original page or turn ends.
6. A separate actor or backend commits a real state transition.
7. The Receiver accepts a signed event and returns to the intended task.
8. A fresh canonical page opens and exposes a visibly different tool set.
9. The Agent reads current state and continues the same artifact.
10. The Agent stops; a human reviews the result.
11. A compact diagnostic view shows correlation and duplicate safety.
12. One closing sentence explains that the same Receiver contract can support other Host
    Adapters.

Show the product for most of the video. Use at most one short architecture view to explain
the event-to-page handoff. Keep H1/H2 evidence in the repository or an optional evidence
screen, not in the main narrative.

### 12.4 Public judge path

Neither current implementation proves a universally reproducible public wake into an
arbitrary judge's Codex task. The submission must handle that fact honestly.

**RECOMMENDED layered judge experience:**

- **Public live app:** judges can reset the scenario, invoke genuine Stage-A and Stage-B Site
  Tools, observe dynamic tool replacement, and use the full normal human UI.
- **Recorded genuine re-entry:** the video shows the verified automatic same-task Desktop
  re-entry on the tested environment.
- **Repository evidence:** the conformance tests, redacted trace, runbook, and exact claim
  boundary are public.
- **Optional advanced setup:** a judge may run or pair the Receiver if the path is safe and
  documented, but the baseline product must not require private credentials or an undisclosed
  dependency.

Do not simulate an automatic wake in the public build and describe it as a genuine platform
event. A transparent bounded claim is more credible than a broad claim that fails under
judge testing.

## 13. Hero application selection

TenderRelay remains Reference Scenario A. MVP2 proves that it can explain the mechanism, not
that it is the highest-scoring final domain.

Use the hard gates and weighted scorecard in
[`Core/06-mvp-and-demo.md`](../Docs/Core/06-mvp-and-demo.md). In particular, reject any scenario
where deterministic Host automation is equivalent, prior context does not matter, current
page authority is unnecessary, or the judge cannot see the value in under three minutes.

### 13.1 Candidate comparison

| Candidate | Why the event is natural | Why Agent reasoning may matter | Human boundary | Strength | Risk |
|---|---|---|---|---|---|
| Deployment or incident response | Monitoring or CI reports a failure after an earlier release decision | Analyze current diagnostics against prior release rationale and prepare rollback/remediation | Approve rollback, patch, or deployment | Technical judges understand it quickly; visually dynamic | A deterministic runbook may be sufficient unless the scenario requires synthesis |
| Customer support escalation | Customer replies, SLA breaches, or specialist feedback arrives later | Reconcile prior conversation, policy, account state, and new evidence into a response | Send response, refund, or account change | Broadly understandable and simple to build | Common pattern; notification plus fresh context may be equivalent |
| Grant/application clarification | Reviewer requests evidence after submission | Continue a structured application and evidence narrative | Submit legally consequential response | Strong continuity and human boundary | Similar terminology and credibility issues to tenders |
| Tender clarification | Buyer requests clarification after bid submission | Reuse bid rationale, commitments, and evidence under current portal state | Commercial/legal submission | Already implemented; strong artifact continuity | Procurement explanation, integration realism, and market differentiation |
| Vendor/compliance review | Document or control review changes status | Reconcile policy, evidence, exceptions, and prior rationale | Approve exception or final attestation | Strong event/state/tool change | Can become enterprise-heavy and require too much policy UI |

### 13.2 Working recommendation, not a decision

**RECOMMENDED:** Test a deployment/incident-response scenario first as the provisional hero
because the external event, live state, changed tools, Agent synthesis, and human rollback
boundary are easy for a technical judging panel to observe. The scenario must be designed so
that a deterministic runbook cannot produce the same result; otherwise it fails the Agent
necessity gate.

Keep TenderRelay as:

- a fallback hero if switching domains would jeopardize execution;
- a second reference Host Adapter demonstrating portability; or
- an internal integration fixture for the selected shared interfaces.

Do not build two polished apps. Build one polished hero and keep the other as a small
conformance/reference implementation. Execution is equally weighted and the live URL is a
hard submission requirement.

### 13.3 Minimal scenario validation before selection

For each finalist, collect or document:

- named primary user and external actor;
- frequency and waiting time of the later event;
- current workaround and context-reconstruction cost;
- why prior rationale matters;
- why current page authority matters;
- why deterministic automation is insufficient;
- before/after active user steps;
- consequence retained by the human;
- synthetic data and reset path;
- exact Stage-A and Stage-B tool inventory; and
- a 30-second comprehension test with someone outside the project.

Record the winner in a new app-selection ADR. This report does not select it.

## 14. Recommended implementation sequence

### Priority 0 — protect the current evidence

1. Keep MVP1 evidence, fixtures, and runbooks intact.
2. Keep MVP2 isolated while the shared contract is discussed.
3. Record the MVP2 live replay as a redacted correlated evidence package if it will support
   a public claim.
4. Do not rewrite existing evidence to make it appear that MVP1 and MVP2 were one historical
   run.

### Priority 1 — freeze the smallest shared protocol

1. Write versioned Manifest, Grant, Event, delivery, and receipt schemas.
2. Define canonical serialization and signature test vectors.
3. Define scope, expiry, sequence, state/revision, idempotency, and error rules.
4. Reuse MVP1 validators where they already satisfy the contract.
5. Add a tiny independent issuer conformance client that imports no Receiver internals.

### Priority 2 — make MVP2 a true Host Adapter

1. Keep Tender domain state and Site Tools in MVP2.
2. Route Manifest issuance through the shared Host SDK.
3. Route consent, Grants, bindings, event acceptance, run reservation, and delivery through
   the MVP1 Receiver boundary.
4. Move direct `codex queue` behind the Agent adapter interface.
5. Project MVP1 trace records into MVP2's simple diagnostics UI.
6. Add expected artifact revisions to MVP2 writes.
7. Move final bid submission to human-only UI.

### Priority 3 — prove real modularity

1. Run MVP1 and MVP2 against the same protocol conformance suite.
2. Send an event from an independent process or deployed backend to the Receiver.
3. Confirm the Receiver uses no tender-specific control branch.
4. Confirm a second Host Adapter can change event names, states, tools, and artifacts without
   changing Receiver event logic.
5. Record exact failures for wrong issuer, wrong binding, wrong state, duplicate event, and
   stale artifact.

### Priority 4 — select and build the hero app

1. Apply the canonical hard gates and scorecard.
2. Accept an app-selection ADR.
3. Build only the smallest complete vertical slice.
4. Reuse the shared protocol and Receiver rather than reimplementing them.
5. Keep one persistent artifact, one event, one resumed state, and one human consequence.

### Priority 5 — judge hardening and submission

1. Deploy the exact public Host build.
2. Add deterministic reset and synthetic data.
3. Run a clean checkout and a judge-like Browser discovery test.
4. Verify no private task ID, token, socket path, local database, or mutable trace is public.
5. Record the genuine Desktop re-entry video against the final code.
6. Keep the live site, repository, video, description, and claim boundary synchronized.
7. Freeze feature work before submission packaging.

## 15. Keep, change, and defer

### Keep now

- MVP1 Receiver, adapter, durability, replay, and evidence discipline.
- MVP2 applicant/reviewer split, dynamic Site Tools, canonical re-entry, human-readable
  diagnostics, and visible shared artifact.
- A direct queue adapter for the bounded recorded Desktop demonstration.
- A scheduled Inbox path as separate evidence and possible future adapter.
- TenderRelay as a reference scenario and fallback working app.

### Change before presenting the combined architecture

- Make MVP2 consume shared Receiver and protocol interfaces.
- Separate Host state from Receiver authority.
- Use durable Host transition plus outbox intent.
- Move consequential submission fully to human UI.
- Publish conformance schemas and test vectors.
- Add an independent backend-to-Receiver event test.
- Clearly label adapter proof classes and unsupported platform assumptions.

### Defer unless selected by the app or transport

- production multi-tenancy;
- broad event taxonomies;
- multiple Agent platforms;
- general key-management UI;
- distributed exactly-once claims;
- continuous daemon supervision;
- full offline/device-restart guarantees;
- multiple polished demo apps;
- a large repository reorganization; and
- claims that this proposal is already an adopted standard.

## 16. Key risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Infrastructure consumes the remaining build time | Execution is equally weighted | Freeze a narrow protocol and one hero slice; defer platform breadth |
| Judges see a local trick rather than reusable infrastructure | Direct queue is private and colocated | Show contract separation, independent issuer, shared conformance tests, and explicit adapter boundary |
| Judges see an abstract protocol without user value | MVP1 app is generic | Lead with one polished Host app and measurable workflow pain |
| TenderRelay is mistaken for the product | MVP2 names and tools are tender-specific | Label it reference adapter; keep Core domain-neutral; select app via ADR |
| “Standard” claim appears inflated | No independent adoption exists | Use “open protocol proposal and reference implementation” |
| Public site cannot reproduce the video | Desktop bridge is environment-dependent | Ensure public genuine WebMCP path works; distinguish recorded re-entry evidence from public baseline |
| Agent can perform a consequential commit | MVP2 exposes an initial submit Site Tool | Remove commit tools and enforce authenticated human revision approval |
| Duplicate event produces duplicate work | Delivery retries are normal | Reuse MVP1 dedupe, atomic run reservation, CAS, and idempotent Host writes |
| Receiver learns domain-specific rules | Harms interoperability | Keep domain state and decisions in Host Adapter; Receiver validates generic contract only |
| Refactor breaks frozen evidence | MVP1 paths and hashes support claims | Add adapters incrementally; do not move or rewrite historical artifacts |

## 17. Open decisions for Alex and the team

These questions should be answered explicitly rather than inferred by a future Agent:

1. Is the submission's product layer a Host feature, a reusable integration platform, or an
   installed Agent-side companion?
2. What name describes the infrastructure without claiming an adopted standard?
3. Which hero application passes the canonical scorecard with observed user evidence?
4. Which Agent adapter is the official demo path, and what is its exact proof
   classification?
5. What public judge path works without the builder's private Desktop context?
6. What Receiver ingress topology will be demonstrated from an independent backend?
7. Which protocol fields and signature rules are frozen for v0.1?
8. Does exact-task history add measurable value beyond a bounded continuation capsule?
9. What event latency and no-op cost envelope does the selected app tolerate?
10. Who owns issuer onboarding, Receiver operation, revocation, and user support?
11. Which consequential action and reviewed revision remain human-controlled?
12. Which implementation paths and evidence can be completed without risking the live URL,
    demo, or submission package?

## 18. Recommended decision statement

If the team accepts the direction in this report, the next ADR should say approximately:

> The project will retain the domain-neutral MVP1 as the verified mechanism and Receiver
> reference foundation. MVP2 is accepted as a product-shaped Host Adapter and integration
> experiment, not as a replacement for MVP1 or selection of TenderRelay as the final app.
> The challenge entry will present an open re-entry protocol proposal and reference
> implementation through one separately selected hero application. The Website
> Backend-to-Receiver protocol remains project-owned and Agent transport remains adapter-
> specific. Existing evidence is preserved while shared interfaces are introduced
> incrementally.

This statement still requires an accepted ADR. It is included here to make the proposed
direction unambiguous, not to bypass the decision process.

## 19. Handoff checklist for Alex's Codex

Before making changes based on this report:

1. Read [`Docs/README.md`](../Docs/README.md) and follow its authority and update sequence.
2. Read `Core/00`, ADR-0002, ADR-0004, `Core/03`, `Core/06`, and Research 10.
3. Treat this report as SUPPORTING analysis only.
4. Do not silently select TenderRelay or another app.
5. Do not merge MVP2's integrated Receiver logic into MVP1.
6. Do not move or rewrite frozen MVP1 evidence.
7. Do not promote the direct queue adapter to a public Codex contract.
8. Do not describe scheduled polling as a direct business-event wake.
9. Preserve explicit labels for VERIFIED, INFERENCE, TARGET, RECOMMENDED, and UNKNOWN.
10. Propose an ADR before changing mechanism ownership, app selection, transport, authority,
    or repository structure.
11. Prefer one narrow interface extraction backed by both suites over a big-bang refactor.
12. Re-run MVP1 and MVP2 tests and inspect the complete diff before every commit.

## 20. Final recommendation

The best path is not MVP1 **or** MVP2.

The best path is:

```text
MVP1's rigorous, domain-neutral Receiver and protocol foundation
  + MVP2's clear, stateful, genuinely WebMCP-enabled product experience
  + one evidence-selected hero business workflow
  + one honest, adapter-specific Desktop re-entry demonstration
  + one public, reproducible judge path
```

That combination has the strongest chance of satisfying all four judging dimensions while
remaining technically honest. It also creates the clearest route from a hackathon project to
a reusable infrastructure proposal: a stable backend-to-Receiver contract, a pluggable Agent
adapter boundary, conformance tests, and replaceable Host applications.

The immediate goal should be to prove modularity at one seam and finish one excellent public
experience, not to finish a universal production platform during the challenge.
