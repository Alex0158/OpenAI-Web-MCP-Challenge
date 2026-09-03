# SK-TASK-018: CP-18 Hosted Judge Reproduction Pre-Implementation Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-18`
- Owner: Game owner
- Current increment: Cross-functional CP-18 preparation is complete; no runtime code has started.
- Next gate: After CP-17 hosted verification and the required external handoff, run the reviewer packet from a clean browser identity and record independent readback.

## Identity

- Task ID: SK-TASK-018
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: Prepare the clean-identity reviewer runbook and evidence manifest for reproducing the hosted two-player event-to-page journey. The boundary affects durable state, identity, settlement, capability, evidence, or hosted claims.

## Objective

Prepare the clean-identity reviewer runbook and evidence manifest for reproducing the hosted two-player event-to-page journey.

## Success and non-goals

- Success: The linked audit and scenario fixture name the authority, predecessor handoff, positive and
  failure cases, open fields, verification level, and executable reopen trigger.
- Non-goals: Rewriting product behavior for a demo, private developer context, manual state edits, claiming judge reproduction from screenshots, or making submission/eligibility claims without the live rules.

## Scope and authority

- In scope: [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md), [CP-18 scenario fixture](../Scenarios/18-cp18-judge-reproduction-fixtures.md), [CP-17/18 preparation audit](../Validation/51-cp17-cp18-preparation-cross-functional-audit.md), and the owning documents named below.
- Out of scope: Rewriting product behavior for a demo, private developer context, manual state edits, claiming judge reproduction from screenshots, or making submission/eligibility claims without the live rules.
- Allowed actions: Read and write the task-owned preparation documents; run documentation validators; do not edit predecessor runtime or external dependency files.
- Revalidate when: The checkpoint contract, authority, identity, event order, settlement, capability,
  deployment, or claim boundary changes.

## Owning authority

- Owning documents: Engineering/08-development-roadmap-and-checkpoints.md, Design/05-hackathon-demo.md, the closure packet template, and the live submission rules.
- Roadmap dependency: CP-17.
- Cross-functional handoff: CP-18 consumes CP-16/17 evidence and external handoff; it cannot fix their gaps. The final product decision remains separate from the game contract.
- Preparation audits: [CP-10/18 audit](../Validation/10-cp10-cp18-preimplementation-audit.md) and [CP-17/18 preparation audit](../Validation/51-cp17-cp18-preparation-cross-functional-audit.md).

## Evidence status

- Verified: A reviewer must be able to reproduce the named journey without private context and distinguish local, hosted, runtime, capability, and judge evidence.
- Inferred: A single well-instrumented walkthrough with explicit failure and human-boundary branches is the most credible submission package.
- Unknown: Reviewer identity and access, artifact hosting, recording format, external service
  availability, submission fields, and final comparison criteria. The reviewer-facing evidence
  contract is prepared below; live rules and actual hosted results remain authoritative.

## Preparation handoff packet

This packet makes the hosted/judge rehearsal reviewable without private developer context. It does
not publish a URL, choose submission claims, or turn a screenshot into runtime evidence. The
file-level implementation route is indexed in
[`Engineering/10-cp13-cp18-implementation-seam-map.md`](../Engineering/10-cp13-cp18-implementation-seam-map.md).

### Reviewer artifact manifest

Each artifact must carry source/build/contract identity, fixture or hosted world identity, capture
time, owner, and claim limit. Redact secrets and private Agent context before sharing.

| ID | Artifact | Minimum content | Invalidates the packet when |
|---|---|---|---|
| A18-01 | Canonical endpoint and health | URL, build identity, `live`/`ready`/world-readiness readback, capture time | URL or health is inferred from a deploy log |
| A18-02 | Source and contract identity | Exact commit or working-tree identity, `SK-MVP-0.2`, runtime and migration versions | Source or contract cannot be reproduced |
| A18-03 | Architecture/data-flow view | Browser, page transport, worker, store, events, outbox, Receiver/Connector boundary, and authority arrows | Diagram implies browser or Agent authority |
| A18-04 | Causal timeline | Join, dispatch, browser close, world progression, event cursors, loss/respawn, signal, reread, action, restart | Events are narrated without ids/cursors or order |
| A18-05 | Capability and delivery result | Genuine WebMCP discovery/invocation result, external handoff version, signal/delivery identity, or typed limitation | Stub, unsupported result, or missing handoff is labelled as success |
| A18-06 | Recovery receipt | Restart source, process/health state, same world/snapshot/cursor, lease/delivery readback | Recovery is asserted only from process exit code |
| A18-07 | Independent readback | Fresh browser or API read of current state/history and expected revisions | Recording is the only source of truth |
| A18-08 | Screenshots or recording | Reviewer-visible journey with branch labels and no hidden overlays | Frame hides stale, unsupported, or human-boundary state |
| A18-09 | Limitation and claim table | Local/hosted/capability/judge level, `pass`/`gated`/`expected-fail`/`flaky`/`not-run` rows, reopen triggers | Open limitations are omitted or silently downgraded |
| A18-10 | Redaction and retention receipt | Secret scan result, artifact paths/retention, deletion/rotation owner if needed | Credentials, cookies, prompts, or private context remain |

### Clean-identity rehearsal

The later implementation should run this order from an independent browser identity. Do not reuse a
developer session, hidden fixture state, or manual database edit.

| Step | Reviewer action | Required readback | Claim limit |
|---:|---|---|---|
| 0 | Open the canonical URL in a clean profile and record source/build identity | URL, health/readiness, contract version, capability state | Hosted entry only |
| 1 | Establish the documented two-player setup | Distinct server-derived scopes, same world id, no private-state crossover | Two-player only if independently reproduced |
| 2 | Dispatch the seeded GATHERER to Rock | Role/tool lock, mission attempt, route, revision | Hosted command ownership |
| 3 | Close the Player A page | Worker and world continue; no browser heartbeat is required | Browser-absence continuity |
| 4 | Observe or advance the documented loss path | Event order, cargo loss, same-soldier respawn, reissue/review outcome | Hosted gameplay only |
| 5 | Inspect the signal/delivery boundary | One signal identity, coalesced context, ack/retry/typed limitation | Re-entry only when genuine handoff exists |
| 6 | Reopen and reread current state/history | Full snapshot, revisions, event digest, capability status | Fresh readback |
| 7 | Perform the bounded recall or record its typed limitation | Committed result or stale/unsupported/human-boundary result | Capability/judge only at proven level |
| 8 | Restart the worker or follow the recovery receipt | Same world/cursor/mission/delivery state, no duplicate effect | Hosted continuity |
| 9 | Capture independent readback and visual evidence | Evidence matches the source and causal timeline | Evidence integrity |
| 10 | Review limitations and close the packet | Every row has `pass`, `gated`, `expected-fail`, `flaky`, or `not-run` outcome and claim limit | Judge claim only if all required gates pass |

### Claim ladder and stop rules

| Claim | Minimum evidence | Stop or downgrade when |
|---|---|---|
| Local contract | Focused tests and file-backed trace | A row is skipped, flaky without disposition, or fixture identity drifts |
| Local slice | CP-16 two-session causal trace and independent readback | Browser contexts are shared or the trace relies on manual state |
| Genuine capability | Same-page WebMCP discovery and invocation evidence | Adapter is unavailable, synthetic, or from another page/session |
| Hosted continuity | Actual endpoint, health, durable store, restart, reconnect, and command ownership | Any host row is inferred or storage/world identity changes |
| Judge reproduction | Clean identity independently reproduces the named hosted journey and artifacts | Private context, hidden setup, missing rules, or unredacted evidence is required |

### Preparation closure

- The reviewer packet now has a fixed artifact vocabulary, rehearsal order, claim ladder, and redaction
  gate without deciding live submission fields prematurely.
- CP-18 remains `specified`; runtime closure requires CP-17 hosted evidence, the required external
  handoff, and the live submission rules applicable at the time.
- Any change to CP-12/13 capability, CP-14 delivery, CP-16 story, host identity, or evidence policy
  reopens this packet before a judge claim.

## Smallest reversible action

After CP-17 hosted verification and the required external handoff, execute the clean-identity
rehearsal above and record independent readback. Stop if the named predecessor fields or authority seam are missing, or if implementation
would require a second state machine, hidden fallback, new contract version, or unowned external behavior.

## Verification and closure target

- Minimum verification: Documentation level 1–2 now; the implementation checkpoint must use the focused
  vectors in [CP-18 scenario fixture](../Scenarios/18-cp18-judge-reproduction-fixtures.md) and the transitive checks named by
  the roadmap.
- Closure target: `specified` for this preparation task; later runtime closure must match actual evidence.
- Rollback or remediation: Preserve the canonical event/identity/ledger boundary, stop at a typed
  failure, and return to the last verified predecessor seam; do not delete evidence or invent state.
- Reopen trigger: Any change to CP-17, the owning contract, or the cross-functional handoff.
