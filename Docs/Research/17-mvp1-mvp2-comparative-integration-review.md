# MVP1 and MVP2 Comparative Integration Review

**Role:** SUPPORTING implementation, evidence, and integration review  
**Status:** Preserved named-commit branch review; selective-reuse findings remain useful, while
current architecture sequencing is owned by Core/00 and the later Research 18–20 evidence chain  
**Reviewed:** 2026-08-30, Europe/London  
**Review host:** `main` at `b2e6f97df7f941583b9029016a9b37b48c530ee8`  
**MVP1 validated P0-H2 mechanism/evidence baseline:** `1acf3e28c46cc5f58af27122d6636d10c5155472`  
**D4 harness baseline:** `b2e6f97df7f941583b9029016a9b37b48c530ee8`; harness-ready only, with formal restart arms not yet run  
**MVP2 source:** `origin/codex/mvp2-tenderrelay` at `fab956e3a64c3bc127016266e45441c844e6906d`  
**Earlier reviewed MVP2 snapshot:** `ccbd2427fb00aafdcb0e2ea37ab2a3b46079ddb6`  
**Current common base:** `46b9549302160dc148bb9bcce95a9c76643e1002`

The later contributor tip `3f746694069486d3d48d5c6a26c73942ff6eab42` adds two
documentation reports but no runtime change. Its reconciled candidate-topology and integration
disposition are recorded in [Research 21](21-cloud-receiver-local-connector-candidate-topology.md)
and [Research 22](22-mvp2-selective-integration-provenance.md); they do not widen this named
runtime review.

> This review remains authoritative only for the named snapshots and its bounded selective-reuse
> analysis. It does not describe the current `main` tip or control the next transport experiment.

## Executive judgment

Do **not** merge the complete MVP2 branch into `main` now.

The branch is valuable and should remain intact as a contributor reference. Its latest
modularization materially improves strict protocol validation, Host/Receiver separation,
adapter seams, stage-derived Site Tool lifecycle, and cross-domain conformance coverage. It
also retains a clearer product-shaped two-actor workflow, a visible shared artifact, and a
candidate direct Codex queue adapter. Those strengths can materially improve a later selected
app and the three-minute demonstration.

The current tip fixes several material defects found in the earlier snapshot: exact manifest
and event validation, Grant-bound origin/URL/scope checks, replay-conflict handling, artifact
revision guards, untrusted reviewer content, and Agent-callable human submission. It still does
not replace MVP1's Receiver-owned opaque context authority, activation fence, transactional
durability, delivery/effect acknowledgement, crash recovery, or evidence discipline. Its wire
contract is also a different protocol version. TenderRelay remains an unselected reference
scenario under ADR-0002.

The recommended relationship is:

~~~text
MVP1 = mechanism, authority, durability, adapters, conformance, and evidence foundation
MVP2 = contributor reference for protocol modularity, Host SDK seams, product flow, UI,
       stage choreography, and demo-adapter ideas
Selected app = later Host Adapter chosen through an accepted app-selection ADR
~~~

The intended outcome of reviewing MVP2 is selective reuse after the relevant decision gate,
not winner-takes-all replacement or an indiscriminate source merge.

## 1. Branch and integration facts

The first reviewed MVP2 snapshot was three commits ahead of its old shared baseline:

1. `8f7117c` adds the TenderRelay MVP2 implementation;
2. `f3c243d` adds an integration report; and
3. `ccbd242` moves that report to `mvp-shared/README.md` and links it from the root README.

The current branch later added `354cd76`, which modularizes the continuation infrastructure,
then merged shared `main` through `46b9549` in `a2e83f2`; `fab956e` adds an advisory
modularization review. Four commits visible in the old-to-new branch range came from shared
`main` and are not Eddie-authored MVP2 changes. Current `main` is one D4-harness commit ahead
of the merge base, while MVP2 is six branch commits ahead.

The functional modularization commit changes 29 files with 3,458 additions and 815 deletions
relative to its parent; 27 of those files and 3,384 additions and 772 deletions are under
`mvp2/`. The current contributor-owned implementation remains under `mvp2/`, `mvp-shared/`,
and root README links. It does not require a source merge for inspection or selective reuse.

Mechanical mergeability is not the decision criterion. A complete merge would also place:

- a tender-branded application at the repository root before app selection;
- multiple contributor-authored advisory reports outside the canonical documentation map;
- contributor-reported live evidence without a frozen correlated package; and
- a parallel wire-incompatible Receiver composition with weaker context authority,
  persistence, consent, delivery acknowledgement, and diagnostics

beside the current source of truth. The remote branch already preserves and exposes all of
that work for review, so merging is not required to compare or learn from it.

## 2. Independently checked evidence

### 2.1 MVP1

- **Later updates after the reviewed host SHA:** the D4-hardening checkpoint passed
  **114/114** tests; the current suite passes **118/118** after adding four App Server join-probe
  evidence controls. See the
  [current status](../Core/00-current-status.md) and
  [provisional D4 attempt record](../../mvp/evidence/d4-h2b-first-formal-no-event-inconclusive-2026-08-30.md).
- The current evidence package preserves bounded P0, H0b, H1, H2a, and H2 results.
- C1 clean-context discovery and one M1 discovery-and-read run per documented eligible model
  are separately bounded in Research 14 and Research 15.

### 2.2 MVP2

The branch was inspected without checkout or repository edits. A temporary `git archive`
extraction was used for execution and then moved to Trash after validation.

- Its deterministic suite passes **18/18** tests in total.
- Its explicit cross-domain conformance command passes the relevant **8/8** subset.
- Server and browser JavaScript parse successfully. The update range
  `ccbd242..fab956e` passes `git diff --check`; the full current branch delta from its merge
  base still reports pre-existing blank lines at end of file in three MVP2 public assets.
- The latest tests cover exact protocol schemas, signature and scope validation, replay
  conflict, Host revision guards, adapter classification, module boundaries, a second
  incident-response Host fixture, and state-derived Site Tool lifecycle.
- The adversarial failures reproduced against `ccbd242` are fixed at `fab956e`: wrong origin,
  resume URL, manifest identity, extra event fields, conflicting idempotency payloads, and
  stale artifact writes are rejected.
- The suite still mocks `codex queue` and does not exercise genuine Browser/WebMCP lifecycle,
  dormant Desktop wake, Desktop restart, process crashes, multi-process persistence,
  delivery/effect acknowledgement, or a distributed Host/Receiver deployment.

These are bounded code-level findings against both reviewed snapshots. The earlier defects
remain relevant history but are not current-tip findings.

### 2.3 Contributor-reported live replay

The current shared report describes one clean live same-task Browser/WebMCP replay with the
original applicant page closed before the reviewer event. The earlier `ccbd242` MVP2 README,
not the current modularized README, records Desktop `26.825.51511` with bundled CLI
`0.151.0-alpha.7.2` and says at that snapshot that a clean repeat was still required. The
later shared report records that repeat as performed. No frozen redacted tool-call or
correlated trace package accompanies either claim.

Treat this as a useful contributor report, not canonical project verification. The current
local installation is Desktop `26.825.41651` build `7345` with bundled CLI
`0.151.0-alpha.7.1`, so the two observations are not from an identical client environment.

## 3. What MVP2 does better

MVP2 is stronger than MVP1 in two useful layers.

As reusable composition:

- **Domain-neutral protocol module:** strict manifest and event validators, signed protocol
  objects, JSON schemas, and frozen vectors now have an explicit boundary.
- **Host SDK and adapter seam:** `ContinuationHostSdk`, a Host Adapter interface, and a second
  incident-response fixture demonstrate that infrastructure modules no longer import Tender
  application code.
- **Agent Adapter classification:** the `codex queue` implementation is isolated behind a
  named private-current-build adapter rather than presented as the shared Receiver itself.
- **Stage Tool Registry:** `AbortSignal`-based retirement gives a reusable implementation
  pattern for removing stale Site Tools when Host state changes.

As a product-shaped explanation:

- **Two visible actors:** applicant and reviewer make the asynchronous state transition easy
  to understand.
- **One visible artifact:** bid and clarification drafts show what persists across time.
- **Stage-derived Site Tools:** the page visibly changes its tool portfolio between draft,
  review, and changes-requested states.
- **Normal human surfaces:** reviewer and applicant pages remain understandable without first
  learning Receiver internals.
- **Demo choreography:** the state transition, fresh page, changed tools, continued draft,
  and absent submission tool fit a short narrative.
- **Candidate low-overhead adapter:** `codex queue --thread` may be useful for a loaded local
  Desktop task and avoids the structural polling cost of repeated Scheduled Task checks.
- **Diagnostics layout:** the card-based evidence view is a useful presentation pattern if it
  is later backed by real correlated evidence.

These strengths improve comprehensibility and execution. They do not by themselves validate
user pain, product necessity, public portability, or a production transport.

## 4. What MVP1 must continue to own

MVP1 is materially stronger on the reusable mechanism:

- Receiver-owned consent and private managed-context authority;
- opaque Host binding rather than raw task identity in the Host;
- strict signed-event schemas and canonical origin/URL constraints;
- conflict-sensitive replay handling;
- durable SQLite records, compare-and-swap state and artifact revisions;
- run reservation, delivery tickets, effect receipts, acknowledgement, and idempotent effects;
- revocation, expiry, run budgets, and activation fencing;
- enrollment outbox and idempotent durable receipt delivery;
- process-crash, acknowledgement-loss, concurrent approval, and SIGKILL coverage; and
- correlated redacted evidence with explicit claim boundaries.

The shared mechanism must not be replaced by MVP2's integrated JSON state or synchronous
accept-then-queue path.

## 5. Material MVP2 risks

### P1 — Context authority remains a raw global Desktop binding

`CONTINUATION_CONTEXT_ID` configures one process-global raw task ID, which the Desktop demo
adapter passes directly to `codex queue --thread`. The Host does not receive it, and the
adapter exposes only a digest, but the Receiver does not capture context per Grant, resolve an
opaque Host binding, or fence activation on durable context delivery. Preserve MVP1's
Receiver-owned context capture, sealed receipt, opaque binding, and activation fence.

### P1 — The new wire protocol is incompatible with MVP1

MVP2 v0.1 uses camelCase protocol objects with an embedded signature. MVP1 uses strict
snake_case contracts, detached envelope authentication, opaque `agent_binding`, correlation,
sequence, delivery tickets, and effect receipts. Both can be internally coherent, but direct
reuse would be a wire-breaking protocol change. A shared protocol ADR and versioned migration
or adapter boundary must precede any import.

### P1 — Accepted delivery is still not durable Agent completion

MVP2 now persists the local aggregate before dispatch, but `JsonFileStateStore` is a single
`.tmp` rename without a database transaction, multi-process lock, lease, retry queue, dead
letter state, destination acknowledgement, or Host effect receipt. Adapter failure makes a run
terminal `failed`; `dispatchPending()` retries only `reserved` runs. A `queued` status proves
only that the private CLI transport accepted a message.

### P1 — The external sender is not a distributed topology proof

The external-backend simulator is a separate process and validates network ingress, but it
requests a Host-generated event from the same combined server and posts it back to that same
server. It does not separate Host state, signing-key custody, identity, or deployment failure
domains. It is a useful fixture to evolve, not evidence that hard coupling has been removed.

### P1 — Human consent is outside Site Tools but remains caller asserted

Moving Grant activation and final submission out of the Site Tool inventory is a material
improvement. However, `/api/grants/attach` still accepts caller-supplied `humanApproved: true`;
that boolean is not a Receiver-owned authenticated consent action or a receipt bound to the
exact Grant and artifact revision.

### P1 — Diagnostics still overstate delivery and human-boundary proof

The Agent adapter card passes when a run is merely `queued`, and the human-boundary card is a
static source scan rather than a correlated runtime inventory and effect proof. The visual
layout is reusable; the pass logic is not. It should project MVP1-style event, delivery,
genuine Site Tool, Host effect, replay, and human-boundary evidence.

### P2 — Current-tip runtime evidence and documentation lag the code

The 18-test modularized tip has no frozen genuine Browser/WebMCP, Desktop wake, restart,
crash, or distributed-store evidence package. `mvp-shared/README.md` adds the new 18-test
result but retains an unreconciled earlier paragraph describing approximately 1,700 lines and
five tests. Preserve the contributor report as history, but do not use it to substantiate
current-tip runtime or portability claims.

## 6. Direct queue transport probe

The current bundled CLI exposes:

~~~text
codex queue --thread <THREAD> --message <TEXT>
~~~

The [official Codex overview](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
does not document this exact command or promise unattended task wake. Local CLI help is
therefore current-build evidence, not a public platform SLA.

A bounded current-build Q0 probe produced two distinct results:

1. Queueing to an unloaded spawned sub-agent failed explicitly because direct app-server
   input is not allowed for that target class.
2. Queueing to an unloaded persistent ordinary task returned a queued message identifier,
   but the task remained `notLoaded` and started no new turn during the initial ten-second
   observation window or a later status-and-history recheck. No Browser or WebMCP call
   occurred.

Verdict:

> **Q0 PARTIAL / WAKE NOT PROVEN.** The command exists and can enqueue for at least one
> persistent task class, but successful enqueue is not evidence that a dormant task was
> awakened or that Browser/WebMCP was reacquired.

MVP2's direct queue path is therefore a candidate **loaded-task private demo adapter**, not a
replacement for the currently evidenced Scheduled Task wake or a supported external Receiver
contract. A future probe must distinguish enqueue, task activation, first Agent token, fresh
Browser acquisition, Site Tool invocation, Host effect, and acknowledgement.

No self-contained Q0 trace or evidence package is stored in the repository. Treat the probe
as an app-held local observation until a frozen, redacted package is captured.

## 7. Selective reuse map

| MVP2 asset or pattern | Disposition | Required adaptation |
|---|---|---|
| Protocol schemas, validators, and frozen vectors | Reuse shape after protocol decision | Reconcile field model, signatures, opaque binding, correlation, sequence, delivery, and effect contracts under an ADR |
| `ContinuationHostSdk` and Host Adapter interface | Strong selective-reuse candidate | Implement the selected app behind the interface while preserving MVP1 Receiver authority |
| Incident-response second Host fixture | Reuse as conformance seed | Point it at the selected shared protocol and add genuine cross-process evidence |
| Applicant/reviewer workflow and visual layout | Reuse after app selection | Generalize only if the selected Host workflow needs the same two-actor shape |
| Visible shared bid/clarification artifact | Reuse as scenario pattern | Preserve its new state/artifact revision guards and align them with MVP1 authority checks |
| Stage-derived `AbortSignal` tool lifecycle | Reuse | Minimize outputs, keep all tool data untrusted, and retain server-side state guards |
| External sender fixture | Reuse as a test seed | Split Host store, key custody, identity, and process/deployment boundary before claiming distributed topology |
| Agent Adapter interface | Reuse | Keep transport proof classification explicit and inject per-Grant resolved context |
| `codex queue` invocation | Isolate as private demo adapter | Prove dormant-task wake, validate exact target identity, add durable dispatch and acknowledgement, prohibit arbitrary event prompts |
| Diagnostics cards | Reuse presentation only | Back every pass with correlated MVP1 trace/effect evidence; remove hardcoded checks |
| Tender state machine | Reference scenario | Do not make it Core product truth without an accepted app ADR |
| `ContinuationApplication` composition | Reuse only as an example | Do not replace MVP1 Receiver core, activation fence, or delivery/effect protocol |
| JSON file persistence | Do not reuse for shared mechanism | Keep durable records, compare-and-swap, outbox, and crash tests |
| Boolean human approval | Do not reuse | Use authenticated human action bound to the exact artifact revision |
| Current live-replay claims | Do not promote | Repeat under a frozen, redacted, current-build evidence protocol |

## 8. Integration gates

Keep the remote branch intact and discoverable. Do not merge or cherry-pick it into `main`
until the gate for the relevant asset class is met:

1. **Product and Tender assets:** the mandatory full app-selection ADR chooses TenderRelay or
   another workflow that materially reuses its product shape.
2. **Domain-neutral protocol, SDK, and conformance assets:** an accepted mechanism/protocol
   decision, consistent with ADR-0004, defines the versioned wire contract and compatibility
   path before those assets enter the shared mechanism.
3. **Direct queue adapter:** a bounded transport experiment and recorded adapter decision
   select `codex queue` for current-build demonstration behind MVP1's authority and delivery
   contracts.

After the applicable gate:

1. import only the assets authorized for that class, preserving Eddie's authorship and commit
   provenance;
2. keep product assets under the selected app, protocol/SDK assets under the decided versioned
   mechanism boundary, and transport code behind the Agent Adapter boundary;
3. fix the P1 findings relevant to the imported class before any live or deployment claim;
4. run the current MVP1 mechanism suite, which contains 118 tests after the later D4 and App Server
   join-probe evidence-control updates, plus the
   applicable protocol, Host-Adapter conformance, and MVP2 scenario tests;
5. capture frozen evidence appropriate to the class, including a genuine WebMCP and Agent
   trace for any runtime or demo claim; and
6. update Core, the accepted ADR or adapter decision, evidence ledger, and submission material
   together.

## 9. What this review changes

MVP2 does not close product value, app selection, public judge portability, production
identity, or durable distributed delivery. Its current tip contributes five high-value seams
or ideas:

1. reconcile its strict protocol schemas, validators, and frozen vectors with MVP1 under a
   versioned protocol decision;
2. reuse the Host SDK, Host/Agent Adapter interfaces, and second-domain conformance fixture as
   a modularity foundation;
3. use a product-shaped two-actor Host Adapter instead of showing the generic fixture as the
   final experience;
4. make the shared artifact and state-derived Site Tool lifecycle visible in the main demo;
   and
5. investigate direct queue as a narrowly classified current-build adapter, while measuring
   actual wake rather than treating enqueue as completion.

The current order is maintained in the
[canonical status](../Core/00-current-status.md). Research 18 retains the Receiver-ledger and
replaceable-wake-adapter frame, but its prospective App Server step is superseded by later
runtime evidence. Both standalone App
Server Browser-join variants have since failed on the tested current build: the cold owned thread's
Browser selector returned `iab-unavailable` before page access, without identifying which Browser or
session precondition was absent, and exact warm resume returned an active-writer rejection.
Those tested standalone Desktop joins are removed from current selection unless a materially
different supported contract or topology appears. Select the app with Eddie, run
selected-app product and WebMCP controls, and harden only the transport that the app actually
needs. Evaluate a published Workspace Agent only as a conditional distinct hosted runtime when
entitlement and the selected app justify it; require its own Browser/WebMCP evidence boundary.
Keep D4 frozen as optional compatibility evidence unless the selected local topology makes it
material. Scheduled Heartbeat remains a bounded fallback experiment, not the core mechanism or a
production transport. A further direct-queue wake
probe remains optional adapter research, not a prerequisite for those gates.

## 10. Nonclaims

This review does not select TenderRelay, merge Eddie's branch, reject future use of MVP2,
prove that `codex queue` never wakes any task class, or invalidate the contributor-reported
live run. It does not claim that the 18 MVP2 tests or eight conformance checks are defective;
they pass within their bounded scope. It records why those tests and reports remain
insufficient to replace MVP1's mechanism, context authority, transactional durability,
delivery/effect acknowledgement, and evidence foundation.
