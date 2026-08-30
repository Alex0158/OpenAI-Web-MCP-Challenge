# MVP1 and MVP2 Comparative Integration Review

**Role:** SUPPORTING implementation, evidence, and integration review  
**Status:** Current branch review; no app-selection, architecture, or merge decision is promoted to Core by this document alone  
**Reviewed:** 2026-08-30, Europe/London  
**Review host:** `main` at `2ff9bab5dcc6d96f73879ec8737acd0acad0cd3d`  
**MVP1 code/evidence baseline:** `1acf3e28c46cc5f58af27122d6636d10c5155472`; unchanged by the later Knowledge-governance commit  
**MVP2 source:** `origin/codex/mvp2-tenderrelay` at `ccbd2427fb00aafdcb0e2ea37ab2a3b46079ddb6`  
**Common base:** `7aa4813c77e7c2a0d138c5b8cac18bee585f813c`

## Executive judgment

Do **not** merge the complete MVP2 branch into `main` now.

The branch is valuable and should remain intact as a contributor reference. It adds a much
clearer product-shaped two-actor workflow, a visible shared artifact, stage-derived Site Tools,
and a candidate direct Codex queue adapter. Those strengths can materially improve a later
selected app and the three-minute demonstration.

It does not replace MVP1's Receiver, Grant authority, strict event contract, durable delivery,
compare-and-swap writes, replay-conflict handling, crash recovery, or evidence discipline.
Several MVP2 shortcuts would weaken those properties if merged into the shared mechanism.
TenderRelay also remains an unselected reference scenario under ADR-0002.

The recommended relationship is:

~~~text
MVP1 = mechanism, authority, durability, adapters, conformance, and evidence foundation
MVP2 = contributor reference for product flow, UI, stage choreography, and demo-adapter ideas
Selected app = later Host Adapter chosen through an accepted app-selection ADR
~~~

The intended outcome of reviewing MVP2 is selective reuse after the relevant decision gate,
not winner-takes-all replacement or an indiscriminate source merge.

## 1. Branch and integration facts

The MVP2 branch is three commits ahead of the old shared baseline:

1. `8f7117c` adds the TenderRelay MVP2 implementation;
2. `f3c243d` adds an integration report; and
3. `ccbd242` moves that report to `mvp-shared/README.md` and links it from the root README.

The branch adds 15 paths and approximately 2,655 lines. Its net changes are isolated to
`mvp2/`, `mvp-shared/`, and one root README link. It does not modify MVP1, Core, ADRs,
Research, evidence, or project instructions. It therefore has no direct path conflict with
the current pre-app research package.

Mechanical mergeability is not the decision criterion. A complete merge would also place:

- a tender-branded application at the repository root before app selection;
- a 928-line advisory report outside the canonical documentation map;
- contributor-reported live evidence without a frozen correlated package; and
- a weaker integrated Grant, Gateway, Receiver, persistence, and diagnostics design

beside the current source of truth. The remote branch already preserves and exposes all of
that work for review, so merging is not required to compare or learn from it.

## 2. Independently checked evidence

### 2.1 MVP1

- The current deterministic suite passes **88/88** tests.
- The current evidence package preserves bounded P0, H0b, H1, H2a, and H2 results.
- C1 clean-context discovery and one M1 discovery-and-read run per documented eligible model
  are separately bounded in Research 14 and Research 15.

### 2.2 MVP2

The branch was inspected without checkout or repository edits. A temporary `git archive`
extraction was used for execution and then moved to Trash after validation.

- Its five deterministic tests pass **5/5**.
- Server and browser JavaScript parse successfully.
- The tests cover manifest event scope, a boolean approval gate, signature tampering, basic
  duplicate handling, and draft-only second-stage behavior.
- They do not exercise HTTP authentication, WebMCP lifecycle, live queue execution,
  persistence crashes, concurrent writes, exact-schema rejection, secret exposure, delivery
  acknowledgement, or correlated Agent effects.

An additional adversarial reproduction against the extracted commit demonstrated:

- four separately re-signed events with a wrong origin, wrong resume URL, wrong manifest ID,
  or an extra instruction field were accepted;
- a different signed event reusing an existing idempotency key was returned as duplicate
  success rather than a replay conflict; and
- two stale clarification writes both succeeded, with the second silently replacing the first.

These are bounded code-level findings against the reviewed commit, not claims about a future
hardened version.

### 2.3 Contributor-reported live replay

MVP2's README and shared report describe a live same-task Browser/WebMCP replay on Desktop
`26.825.51511` with bundled CLI `0.151.0-alpha.7.2`. The report says the original applicant
tab was closed; the MVP2 README still says that clean repeat is required. No frozen redacted
tool-call or correlated trace package accompanies the branch.

Treat this as a useful contributor report, not canonical project verification. The current
local installation is Desktop `26.825.41651` build `7345` with bundled CLI
`0.151.0-alpha.7.1`, so the two observations are not from an identical client environment.

## 3. What MVP2 does better

MVP2 is stronger than MVP1 as a product-shaped explanation:

- **Two visible actors:** applicant and reviewer make the asynchronous state transition easy
  to understand.
- **One visible artifact:** bid and clarification drafts show what persists across time.
- **Stage-derived Site Tools:** the page visibly changes its tool portfolio between draft,
  review, and changes-requested states.
- **Normal human surfaces:** reviewer and applicant pages remain understandable without first
  learning Receiver internals.
- **Demo choreography:** the state transition, fresh page, changed tools, continued draft,
  and absent submission tool fit a short narrative.
- **Candidate low-no-op adapter:** `codex queue --thread` may be useful for a loaded local
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

### P1 — Reviewer-controlled content is mislabeled by the untrusted-content hint

`get_current_tender_state` returns `/api/state`, which can contain reviewer-controlled
clarification feedback, while its manifest sets `untrustedContentHint: false`. A later
dedicated feedback tool applies the opposite hint to the same class of text. The annotation
does not make either output trusted; the
[official Site Tools security model](https://learn.chatgpt.com/docs/webmcp) treats all website
tool definitions and results as untrusted. Here it contradicts the result provenance and can
mislead compatible consumers. The common state tool must either omit reviewer text or identify
and structure it as untrusted content.

### P1 — The Gateway does not enforce the complete manifest/event contract

The signature canonicalizer includes origin, manifest, resume URL, and nonce, but acceptance
does not compare them with the Grant or canonical Host authority and does not reject extra
top-level keys. A valid signature therefore authenticates a wider payload than the approved
contract. MVP1's exact schema, canonical URL, origin, workflow, event, state, and replay
checks must remain authoritative.

### P1 — Idempotency conflict is treated as duplicate success

Matching either event ID or idempotency key returns the first event as a harmless duplicate
without proving semantic payload equality. A reused key with a different signed payload must
fail closed as conflict.

### P1 — Accepted delivery is not durable Agent completion

MVP2 accepts the event and consumes run budget before synchronously invoking
`codex queue --thread`. Failure creates a failed record, but there is no outbox, lease, retry,
destination acknowledgement, Host effect receipt, or Agent completion proof. A `queued`
status proves only that the CLI accepted a message.

### P1 — Human approval is caller-supplied data

The initial `submit_approved_bid` Site Tool accepts `approved: true`, and the core checks only
that boolean. It does not prove an authenticated human actor or an exact reviewed artifact.
Consequential transition must remain outside Agent-callable Site Tools or require a separate
authenticated approval receipt bound to the artifact revision.

### P1 — Diagnostics can report false passes

The human-boundary card is hardcoded to pass, delivery passes on `queued`, and draft evidence
uses a shared audit event that does not prove which actor or Site Tool produced it. The visual
layout is reusable; the pass logic is not. It should project MVP1-style correlated event,
delivery, tool, effect, replay, and human-boundary evidence.

### P2 — Artifact updates are last-write-wins

Clarification writes carry no expected artifact revision and use no compare-and-swap. A stale
Agent result can silently overwrite newer human or Agent work.

### P2 — Fixture security is not deployment security

The server contains a fallback development HMAC secret, unauthenticated reviewer, reset,
mutation, and diagnostics routes, and a public diagnostics payload containing Grant, event,
run, audit, and a short task-binding hash. These can remain only in an explicitly local,
synthetic fixture and must not support a public deployment claim.

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
| Applicant/reviewer workflow and visual layout | Reuse after app selection | Generalize only if the selected Host workflow needs the same two-actor shape |
| Visible shared bid/clarification artifact | Reuse as scenario pattern | Add expected artifact revision and MVP1 authority checks |
| Stage-derived `AbortController` tool lifecycle | Reuse | Minimize outputs, correct untrusted annotations, retain server-side state guards |
| `codex queue` invocation | Isolate as private demo adapter | Prove dormant-task wake, validate exact target identity, add durable dispatch and acknowledgement, prohibit arbitrary event prompts |
| Diagnostics cards | Reuse presentation only | Back every pass with correlated MVP1 trace/effect evidence; remove hardcoded checks |
| Tender state machine | Reference scenario | Do not make it Core product truth without an accepted app ADR |
| Integrated Grant/Gateway/Receiver core | Do not reuse | Keep MVP1 Receiver and strict protocol boundaries |
| JSON file persistence | Do not reuse for shared mechanism | Keep durable records, compare-and-swap, outbox, and crash tests |
| Boolean human approval | Do not reuse | Use authenticated human action bound to the exact artifact revision |
| Current live-replay claims | Do not promote | Repeat under a frozen, redacted, current-build evidence protocol |

## 8. Integration gates

Keep the remote branch intact and discoverable. Do not merge or cherry-pick it into `main`
until one of these explicit gates is met:

1. an accepted app-selection or Host-Adapter ADR chooses TenderRelay or a workflow that
   materially reuses its product shape; or
2. a separate adapter experiment selects `codex queue` for current-build demonstration and
   imports only that adapter behind MVP1's authority and delivery contracts.

After either gate:

1. import only the needed implementation assets, preserving Eddie's authorship and commit
   provenance;
2. keep them under the selected app or adapter boundary rather than the shared Receiver core;
3. fix the P1 findings before any live or deployment claim;
4. run MVP1's 88-test suite plus Host-Adapter conformance and the selected MVP2 scenario tests;
5. capture a frozen WebMCP and Agent trace on the actual current client; and
6. update Core, the accepted ADR, evidence ledger, and submission material together.

## 9. What this review changes

MVP2 does not close product value, app selection, public judge portability, production
identity, or durable distributed delivery. It does contribute three high-value ideas:

1. use a product-shaped two-actor Host Adapter instead of showing the generic fixture as the
   final experience;
2. make the shared artifact and stage-specific tool change visible in the main demo; and
3. investigate direct queue as a narrowly classified current-build adapter, while measuring
   actual wake rather than treating enqueue as completion.

The existing order remains evidence-driven: run the already specified D4/H2b restart test,
select the app with Eddy, run selected-app product and WebMCP controls, then select and harden
only the transport that the app actually needs. A further direct-queue wake probe is optional
adapter research, not a prerequisite for those gates.

## 10. Nonclaims

This review does not select TenderRelay, merge Eddie's branch, reject future use of MVP2,
prove that `codex queue` never wakes any task class, or invalidate the contributor-reported
live run. It does not claim that the five MVP2 tests are defective; they pass within their
limited scope. It records why those tests and reports are insufficient to replace MVP1's
mechanism, security, durability, and evidence foundation.
