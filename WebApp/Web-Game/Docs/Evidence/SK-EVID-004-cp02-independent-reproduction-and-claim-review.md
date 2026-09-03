# SK-EVID-004: CP-02 Independent Reproduction and Claim-Scope Review

## Identity

- Evidence ID: `SK-EVID-004`
- Related task, issue, or decision: `SK-TASK-001`, `SK-ISSUE-001`, `SK-EVID-001`, `ADR-GAME-0008`
- Evidence class: `process-runtime` for the reproduction, plus a `static` review of the page
  capability claim
- Ladder level: Level 4 for the reproduced worker and persistence path; Level 1 for the claim-scope
  review
- Executor and date: Independent reviewer session, 2026-09-02, Europe/London
- Purpose: Re-execute the CP-02 probe from a different session and test whether the recorded
  conclusion in [`SK-EVID-001`](SK-EVID-001-cp02-capability-and-runtime-probe.md) matches what the
  harness actually proves

## Exact identity under test

- Source state: working tree at `WebApp/Web-Game/`, outer repository `HEAD f49e1ca` on `main`, with
  the uncommitted governance, contract, and `probe/cp02/` changes present.
- Contract version: `SK-MVP-0.1` in the probe command envelope. No gameplay state exists or was
  mutated.
- Runtime executed: Node.js `v24.13.1` at
  `/Users/alex/.nvm/versions/node/v24.13.1/bin/node`, the exact runtime named by `SK-EVID-001`. The
  session default runtime is Node.js `v26.5.0`; it was not used for the reproduction.
- Environment: macOS arm64, loopback-only worker, temporary SQLite file under the system temporary
  directory.
- Browser and session: **none**. See the claim boundary below.

## Objective and claim boundary

- Behavior under test: whether the CP-02 harness reproduces its recorded result under a different
  executor, and whether the conclusion recorded for the page capability is supported by what the
  harness measures.
- Claim this evidence may support: the Node-side worker lifecycle, typed realtime exchange,
  idempotency, WAL persistence, and restart recovery reproduce independently; and the recorded
  WebMCP result has a narrower scope than the word "supported" conveys.
- Claims this evidence cannot support: anything about browser behavior observed in this session. The
  reviewer did **not** open the probe page, did not exercise `document.modelContext`, and did not
  re-test any adapter. The WebMCP portion of this record is a source review of
  `probe/cp02/public/index.html` plus a reading of the result already recorded in `SK-EVID-001`. It
  neither confirms nor contradicts the browser observations in that record.

## Execution

Command, run twice in the same session:

```sh
/Users/alex/.nvm/versions/node/v24.13.1/bin/node --no-warnings probe/cp02/run.mjs
```

Result: `pass` on both runs, process exit code `0`.

| Assertion | Observed |
|---|---|
| Worker start health | `ok: true`, `service: cp02-probe`, `node: v24.13.1` |
| Initial realtime projection | `probe-snapshot-0`, `probe_event_count: 0` |
| Typed command result | `ok: true`, `duplicate: false`, `probe-snapshot-1`, `probe_event_count: 1` |
| Duplicate idempotency key | `duplicate: true`, original event returned, no second event created |
| SQLite mode | `journal_mode: wal`, `synchronous: 2` |
| Event count before restart | `1` |
| Event count after restart | `1`, same `event_id` |

The two runs produced different `event_id` values (`probe-event-5b7b5285…` and
`probe-event-5e3237b3…`) with identical result structure, which confirms live execution rather than a
cached or replayed output.

Status: `pass` for every Node-side assertion recorded in `SK-EVID-001`.

## Finding 1 — the Node-side CP-02 result reproduces independently

`SK-EVID-001`'s process-runtime claims hold under a second executor on the named runtime. Worker
lifecycle, typed command and projection exchange, idempotency, WAL configuration, and restart
persistence are confirmed. No discrepancy was found between the recorded result and the reproduced
result.

## Finding 2 — "WebMCP: supported" is an API-presence check, not a capability proof

The page's determination is, in full, at `probe/cp02/public/index.html:68-87`:

```text
if document.modelContext is absent, or registerTool is not a function  -> "unsupported"
await modelContext.registerTool({...}) without throwing                -> "supported (cp02_inspect_probe registered)"
a thrown error                                                          -> "registration error"
```

Two conditions therefore produce the label `supported`: the API surface exists, and one call did not
throw. The check does not establish that an Agent can enumerate the tool, that an Agent can invoke
it, or that an invocation reaches the page handler and returns a typed result.

This is not a hypothetical gap. `SK-EVID-001` records that the adapter's `fetchTools()` returned
`gpt-5.6-luna does not support command "webmcp_list_tools"`, so enumeration was attempted and failed
in the same session that produced the `supported` label.

`SK-EVID-001` itself states this limitation accurately in its Analysis and Limitations sections, and
`SK-ISSUE-001` tracks it. The narrowing applies to the word carried forward into the page label, the
roadmap's `VERIFIED LOCAL` status, and any downstream summary, not to the honesty of the evidence
record.

## Finding 3 — the sequencing consequence

CP-02 exists to prove "the real page capability **before building the game**", and its reopen trigger
names a browser that "cannot ... expose the required page capability". The half of that capability
that the competition thesis depends on — an Agent discovering and invoking a page-bound tool — is
currently deferred to CP-13 and CP-14.

That places nine checkpoints of durable implementation, CP-04 through CP-12, ahead of the
first evidence that the mechanism in [`../Blueprint/02-core-concept-and-competition-thesis.md`](../Blueprint/02-core-concept-and-competition-thesis.md)
and [`../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md`](../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md)
is reachable at all.

The exposure is bounded: CP-04 through CP-12 build the world worker, persistence, clock, map,
movement, missions, economy, combat, and Canvas, none of which depend on WebMCP, and `G-MVP-13`
already requires the human dashboard to remain fully usable without it. The cost of a negative result
is the Re-entry demonstration, not the application. The concern is the ordering, not the plan.

## Finding 4 — a proven configuration already exists in this repository and is not cited

The outer frozen MVP1 evidence records the exact capability CP-02 could not obtain. From
`mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md`, Q4:

> its genuine page-bound inventory contained exactly `get_workflow_context` and `continue_artifact`.
> The latter was invoked without REST, DOM automation, generic MCP, or a substitute browser.

Genuine page-bound WebMCP discovery **and** invocation has therefore already been achieved inside
this repository, in some recorded configuration. This materially strengthens the assumption stated in
`SK-ISSUE-001` — that the limitation is adapter-specific rather than a defect in the page
registration — and it supplies a concrete target configuration to test against.

Before this review, no current game authority record directly cited that frozen evidence. This
record names it as a contextual precedent; it still requires an exact-game-page probe before it can
support a current game capability claim.

## Finding 5 — four observations on `SK-ISSUE-001`

The issue is well formed and its falsifier is correct. Four points are offered for the owner's
decision rather than asserted as defects.

| Observation | Current | Consideration |
|---|---|---|
| Priority | `P1` | The gap can invalidate the competition thesis rather than a gameplay rule. [`../Issues/README.md`](../Issues/README.md) directs prioritization by highest credible impact and dependency order, which may place this at `P0`. |
| State | `blocked` | [`../Issues/README.md`](../Issues/README.md) defines `blocked` as a named decision, authority, or state preventing meaningful progress. Finding 4 shows a cheap, currently available action, which makes `ready` the more accurate label. |
| Next gate | "before CP-13/CP-14" | This defers rather than schedules. A gate that can run in parallel with CP-04 would retire the risk about nine checkpoints earlier at low cost. |
| Evidence | Cites `SK-EVID-001` only | Adding the frozen MVP1 P0 Q4 record would upgrade the adapter-specific assumption to a supported inference and name the configuration to reproduce. |

## Analysis and closure

- Failure classification: none for the reproduced Node path. The WebMCP scope issue is classified as
  `evidence` — the measurement is sound and honestly recorded, but the label it produces is broader
  than the measurement supports.
- Limitations and residual risk: this record contains no browser observation of any kind. External
  Agent discovery and invocation remain unproven for this application, as `SK-ISSUE-001` states.
- Invalidation triggers: changes to `probe/cp02/`, the Node or browser version, the page capability
  surface, the selected adapter, the transport, the persistence contract, or the `SK-MVP-*` version.
- Exact conclusion: **CP-02's process-runtime result is independently reproduced and sound.** Its
  page-capability result proves that `document.modelContext.registerTool` exists and accepts a
  registration in the recorded browser, and nothing further. CP-03 may proceed on that basis, because
  CP-04 through CP-12 do not depend on WebMCP. The recommended change is not to reopen CP-02 but to
  bring the `SK-ISSUE-001` gate forward and point it at the configuration named in Finding 4.

## Recommended disposition

The following list is the independent reviewer's proposed disposition. The primary-session
adjudication below accepts only the items explicitly recorded there.

1. Keep CP-02 closed. Its Node-side result is reproduced and its evidence record is accurate.
2. Consider narrowing the wording carried forward, so that "page-side registration accepted" is
   distinguished from "WebMCP supported" in the roadmap status, the probe page label, and any summary.
3. Re-scope `SK-ISSUE-001` per Finding 5: reconsider priority, change `blocked` to `ready`, move the
   gate to run alongside CP-04, and add the frozen MVP1 P0 Q4 citation.
4. Run one bounded follow-up probe that serves the existing page from `probe/cp02/` in the
   configuration recorded by frozen MVP1 P0, attempting enumeration and invocation of
   `cp02_inspect_probe`. Record the result as a new `SK-EVID-*` whether it passes or fails.
5. Do not add a simulated or fallback tool path under any outcome, as `SK-ISSUE-001` already requires.

## Primary-session adjudication — 2026-09-02

**Review status:** ACCEPTED WITH QUALIFICATIONS

The primary session reviewed this record against the current game issue, roadmap, contract, and
the frozen MVP1 Q4 evidence. The findings are useful and the core disposition is accepted. This
section records the decision boundary for the next implementation session; it does not claim a new
browser result.

### Accepted findings

1. The Node-side result is an independent re-execution of the same disposable harness and supports
   the process-runtime claims at the stated local level.
2. A successful page-side `registerTool` call does not prove Agent discovery or invocation. The
   downstream wording must preserve that distinction.
3. The external Agent capability gate can run in parallel with CP-04 through CP-12 because those
   checkpoints do not depend on Agent invocation. It remains a prerequisite for CP-13 and CP-14.
4. No simulated or silent fallback is permitted.

### Corrections and qualifications

- CP-04 through CP-12 contain **nine** checkpoints. The earlier "roughly eleven" count was an
  arithmetic error and has been corrected above.
- "Independent" means an independent session re-executed the named script. It does not mean an
  independent implementation or a second Browser/WebMCP observation.
- The frozen MVP1 Q4 result is an environment and host-path precedent. It does not prove that the
  Sleepless Kingdom page or its current adapter can discover and invoke a game tool; that exact
  page must still be tested.
- The suggested `P0` priority and `ready` state are policy options, not evidence conclusions. The
  primary session keeps `SK-ISSUE-001` at `blocked` / `P1` because the gate still blocks CP-13 and
  CP-14, while CP-04 through CP-12 remain actionable.

### Adopted disposition

1. Keep CP-02 closed at its verified scope: worker/runtime behavior and page-side registration.
2. Keep the wording boundary explicit in current summaries and future evidence.
3. Continue the CP-04 route under `SK-TASK-003`. The existing parent route already permits the
   external capability probe to run in parallel, so this adjudication does not register a duplicate
   task.
4. Before CP-13 or CP-14, run one bounded probe against the exact game page using the known
   supported Browser configuration, and record a fresh `SK-EVID-*` for both discovery and invocation,
   whether the result passes or fails.
5. Reconsider the issue state and priority only after that exact-game-page result. The gameplay
   contract, Re-entry timing policy, and implementation route do not change here.
