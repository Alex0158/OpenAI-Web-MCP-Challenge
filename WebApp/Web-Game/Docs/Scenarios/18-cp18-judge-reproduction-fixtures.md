# CP-18 Hosted Judge Reproduction Fixtures

**Status:** Preparation fixture; runtime verification remains open  
**Checkpoint:** CP-18  
**Contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Audits:** [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md), [CP-17/18 preparation audit](../Validation/51-cp17-cp18-preparation-cross-functional-audit.md)  
**Task:** [SK-TASK-018](../Tasks/SK-TASK-018-cp18-judge-reproduction-preimplementation-pack.md)  
**Purpose:** Prepare the clean-identity reviewer runbook and evidence manifest for reproducing the hosted two-player event-to-page journey.

These vectors are preparation inputs and observable outcomes. They do not create a new rule, schema,
event, command, transport, host, or external service contract. A fake clock, network, browser, or
external stub is a test instrument only.

## Fixture and authority boundary

- Contract version: SK-MVP-0.2 unless the owning task explicitly records a later accepted version.
- Dependency: CP-17.
- Owning authority: Engineering/08-development-roadmap-and-checkpoints.md, Design/05-hackathon-demo.md, the closure packet template, and the live submission rules.
- Cross-functional handoff: CP-18 consumes CP-16/17 evidence and external handoff; it cannot fix their gaps. The final product decision remains separate from the game contract.
- Scope: Reviewer runbook, clean identity, architecture/data-flow diagram, causal timeline, capability result, recovery receipt, screenshots/recording, known limitations, redaction, and claim boundaries.
- Non-goals: Rewriting product behavior for a demo, private developer context, manual state edits, claiming judge reproduction from screenshots, or making submission/eligibility claims without the live rules.

## Evidence classification

- Verified inputs: A reviewer must be able to reproduce the named journey without private context and distinguish local, hosted, runtime, capability, and judge evidence.
- Preparation inference: A single well-instrumented walkthrough with explicit failure and human-boundary branches is the most credible submission package.
- Open fields: clean identity/access, artifact links and retention, recording/screenshots, external
  Receiver/Connector availability, submission fields, and comparison rubric. The artifact and claim
  boundaries are prepared below; live submission rules remain authoritative.

## Vectors

### J18-01 — Clean reviewer start

**Given:** An independent browser identity has the hosted URL and no developer session state.  
**When:** The reviewer follows the runbook.  
**Then:** The page loads, capability/readiness state is truthful, and fixture reset/join steps are documented.

### J18-02 — Two-player journey

**Given:** The reviewer has two permitted sessions or the documented two-player setup.  
**When:** The gatherer-loss trace runs.  
**Then:** The reviewer can observe world continuation, event history, respawn, and projection without private context.

### J18-03 — Re-entry evidence

**Given:** The hosted event and external handoff are available.  
**When:** The reviewer follows signal, page reread, and bounded recall steps.  
**Then:** The packet shows the exact signal/result and labels any unavailable capability or typed late outcome.

### J18-04 — Recovery evidence

**Given:** The worker restarts or the documented recovery receipt is available.  
**When:** The reviewer reconnects.  
**Then:** The same world and event history are read back; no duplicate settlement is observed.

### J18-05 — Independent readback

**Given:** The reviewer inspects current state and event history independently of the recording.  
**When:** The expected causal fields are checked.  
**Then:** Claims are tied to observable source/runtime evidence, not narration alone.

### J18-06 — Known limitation

**Given:** A route, capability, external, or balance limitation remains open.  
**When:** The reviewer encounters it.  
**Then:** The limitation is shown with its typed outcome and does not become an unverified success claim.

### J18-07 — Artifact integrity

**Given:** Architecture, timeline, screenshots, logs, and claim table are assembled.  
**When:** The redaction and source identity checks run.  
**Then:** Artifacts contain no secrets/private context and point to the exact hosted/runtime evidence.

## Reviewer rehearsal runbook

Run this procedure only after CP-17 hosted continuity is verified and the required external handoff
is versioned. The reviewer must use an independent browser identity and must be able to stop at a
typed limitation without changing the product or database.

| Step | Reviewer action | Required readback | Outcome if unavailable |
|---:|---|---|---|
| 0 | Open the canonical URL in a clean profile | URL, build/source identity, contract version, health/readiness, capability status | Hosted entry is gated |
| 1 | Establish two permitted sessions | Distinct server-derived scopes, same world id, no private-state crossover | Record two-session limitation; no judge claim |
| 2 | Dispatch the seeded GATHERER to Rock | Role/tool lock, mission attempt, route, revision | Record typed command failure |
| 3 | Close Player A's page | Worker/world continue and page absence is visible in evidence | Record continuity failure |
| 4 | Observe the seeded monster loss path | Ordered events, cargo destruction, same-identity respawn, reissue/review result | Stop and preserve first causal mismatch |
| 5 | Inspect Re-entry delivery | Signal identity, coalesced digest, external version, ack/retry or typed limitation | Keep capability/external claim gated |
| 6 | Reopen and reread | Full snapshot, mission/history, current revisions, capability state | Record reconnect/read failure |
| 7 | Perform bounded recall or show typed late/unsupported result | One command result, no duplicate transition, human boundary preserved | Do not narrate a success |
| 8 | Restart worker or inspect recovery receipt | Same world/snapshot/cursor, delivery and lease status, no duplicate effect | Hosted continuity remains open |
| 9 | Independently verify the timeline | Readback matches source events and recording | Artifact is evidence-incomplete |
| 10 | Apply redaction and claim review | No secrets/private context; every row has outcome and claim limit | Invalidate or quarantine the packet |

## Artifact manifest and claim table

The reviewer packet should carry the following artifacts. Each must include source/build/contract
identity, capture time, and the highest claim it supports.

| Artifact | Required fields | Claim supported |
|---|---|---|
| Endpoint and health receipt | Canonical URL, build id, `live`/`ready`/world readiness, capture time | Hosted entry/readiness |
| Architecture/data-flow diagram | Browser, page transport, worker, store, events, outbox, external boundary, authority arrows | Architecture explanation |
| Causal timeline | Join, dispatch, close, world progression, event ids/cursors, loss/respawn, signal, reread, recall, restart | Local or hosted causal story |
| Capability/delivery receipt | Genuine WebMCP discovery/invocation, external version, signal/delivery identity, or typed limitation | Capability/Re-entry only when genuine |
| Recovery receipt | Restart source, snapshot/cursor/world identity, lease/delivery status, duplicate check | Hosted continuity |
| Independent readback | Fresh state/history read and expected revisions | Evidence independent of recording |
| Visual evidence | Screenshots/recording with stale, unsupported, and human-boundary labels | Reviewer comprehension |
| Limitations and claims | Local/hosted/capability/judge rows, `pass`/`gated`/`expected-fail`/`flaky`/`not-run` reasons, reopen triggers | Honest submission claims |
| Redaction/retention receipt | Secret scan, artifact paths, retention owner, rotation/deletion action if required | Shareability and safety |

The packet is judge-reproducible only when a clean identity can independently reproduce the named
hosted story and every required artifact is available. A local stub, unsupported adapter, deploy log,
or narrated screenshot remains a lower-level claim.

## Shared assertions

- The owning server/worker authority remains the only state-changing authority.
- Revisions, idempotency, world identity, and causal event identity prevent duplicate effects.
- A projection, test stub, screenshot, or delivery envelope cannot replace durable game state.
- Cross-module handoffs use the owning mechanism's state and event boundary; no consumer invents a
  second role, mission, ledger, clock, route, or external delivery path.
- Positive, negative, boundary, retry, restart, browser-absent, and unsupported-capability outcomes
  remain distinguishable in evidence.
- A run repeated with the same fixture, seed, event order, and command versions produces the same
  authoritative result, unless an explicitly open production policy is being measured.

## Open implementation fields

- clean identity/access and permitted two-session setup;
- artifact hosting, links, retention, and recording format;
- external Receiver/Connector availability and exact handoff version;
- live submission fields and comparison rubric;

These fields may be filled only inside the checkpoint authority, with rationale and verification.
A value that changes an accepted contract, human consequence, external handoff, or settlement boundary
requires an explicit decision before implementation.

## Non-goals

This fixture is a planning aid. It does not prove runtime, slice, hosted, or judge reproduction and
does not authorize code outside its checkpoint.
