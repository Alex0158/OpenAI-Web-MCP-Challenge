# CP-13 Dynamic Continuation Refresh Cross-Functional Audit

**Status:** LOCAL REGISTRAR REFRESH VERIFIED; HOSTED WEBMCP AND AGENT DELIVERY REMAIN OPEN  
**Date:** 2026-09-03  
**Checkpoint:** CP-13  
**Task:** [`SK-TASK-080`](../Tasks/SK-TASK-080-cp13-dynamic-continuation-refresh.md)  
**Evidence:** [`SK-EVID-074`](../Evidence/SK-EVID-074-cp13-dynamic-continuation-refresh-runtime-verification.md)  
**Related implementation:** [`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Audit question and verdict

Does the CP-13 page registrar remain correct when the durable signal slot rotates while the same
page generation is still connected?

**Verdict:** Yes for the local registrar boundary. The page keeps one registered recall tool, refreshes
its active signal identity only from a newer server continuation, rejects the superseded signal, and
ignores an out-of-order older read. Generation stop still clears the binding. No server contract,
signal policy, or authority boundary changed. Hosted WebMCP, Agent, Re-entry, and external delivery
remain separate evidence gates.

## Why this increment was needed

The server may rotate an acknowledged or terminal signal slot after its cooldown and expose a new
`signal_id` on a later `inspect_shelter_state` read. The original page registrar registered one recall
closure per generation and captured the first signal forever. That left a live page with a valid newer
server grant but an obsolete client closure. The gap was a lifecycle mismatch, not a reason to add a
second tool registration or a new server authority.

## Evidence reviewed

- [`SK-EVID-074`](../Evidence/SK-EVID-074-cp13-dynamic-continuation-refresh-runtime-verification.md): red-to-green registrar test, focused suites, typecheck, and claim limits.
- [`SK-TASK-080`](../Tasks/SK-TASK-080-cp13-dynamic-continuation-refresh.md): bounded design decision and reopen conditions.
- [`Validation/75`](75-cp13-page-tools-runtime-cross-functional-audit.md): existing page lifecycle, server-scope, continuation, reconciliation, and unsupported-UX audit.
- [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md): existing server-authoritative recall transition.
- [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md): signal coalescing, cooldown, and one-active delivery policy.
- [`Engineering/05`](../Engineering/05-api-and-webmcp.md): page-bound tool and server gateway boundary.

## Findings by decision impact

| Severity | Finding | Cross-functional effect | Disposition |
|---|---|---|---|
| Resolved | One registration generation now keeps a mutable active server signal identity | A rotated continuation remains usable without duplicate WebMCP registration or a page-side second authority | Verified in EVID-074 |
| Resolved | Freshness is ordered by `latest_world_time`, then `cursor_end` | A late response from an older read cannot roll the closure back to a superseded signal | Verified in EVID-074 |
| Resolved | A superseded signal fails with the existing `STALE_REENTRY_CONTEXT` path | Old Agent action cannot bypass the current server grant; current signal still reaches the existing transport | Verified in EVID-074 and existing recall tests |
| Resolved | Stop/unmount continues to clear registration and active binding | Reconnect, stale projection, socket failure, and unmount do not leave a usable stale closure | Verified by the existing lifecycle suite and CP-080 regression |
| Accepted boundary | The server still rotates signals under the existing cooldown/coalescing policy | The page does not change event eligibility, delivery frequency, or durable outbox behavior | No contract change; ADR-GAME-0009 remains authoritative |
| Open | Real adapter delivery of a newly rotated continuation | A local registration double cannot prove a hosted WebMCP host or Agent will read and invoke the refreshed action | Requires approved supported-session evidence |

## Cross-functional chain check

```text
durable event and signal rotation
  -> server-scoped inspect_shelter_state read
  -> continuation freshness gate
  -> one registered force_recall_soldier closure
  -> current signal plus revisions sent through page transport
  -> server ownership/provenance/idempotency/revision validation
  -> existing recall transition
  -> full client_snapshot reconciliation
```

The chain preserves the following boundaries:

- The server chooses the world, player, shelter, soldier, mission, attempt, signal, and revisions.
- The page stores only the active signal identity needed to reject stale invocations during this generation.
- The page never applies an optimistic phase, route, cargo, coin, or event mutation.
- The page does not create a timer, queue, worker, store, or duplicate WebMCP tool.
- A stale or out-of-order read cannot create a new authority or silently fall back to the old grant.

## Race and failure matrix

| Risk | Control | Result |
|---|---|---|
| New signal after initial registration | Rebind the existing closure only when continuation metadata is newer | Pass locally |
| Older read arrives after newer read | Compare world time and cursor before rebinding | Pass locally |
| Same signal read repeats with advanced metadata | Keep identity and advance freshness metadata | Pass locally |
| Malformed freshness on a different signal | Do not rebind without safe ordering metadata | Pass by fail-closed implementation |
| Recall uses superseded signal | Existing typed stale-context rejection | Pass locally |
| Recall uses current signal | Existing page transport and server transition | Pass locally |
| Reconnect or unmount during refresh | Generation and AbortController checks, then cleanup | Pass by existing lifecycle tests |
| Duplicate registration | One registration counter and stable function identity | Pass locally |
| Server authority bypass | Server route and gateway remain unchanged | Pass by composition; no new bypass |
| High-frequency events | Existing server coalescing/cooldown remains in force | No new page-side signal loop introduced |

## Verification disposition

- `npm run test:cp13-page-tools` — `10/10` passed, including the new refresh/race proof.
- `npm run test:cp13-recall` — `9/9` passed.
- `npm run test:cp16-page-recall` — `1/1` passed.
- `npm run typecheck` — passed with no TypeScript errors.
- `git diff --check` — passed for the changed Game paths.
- Documentation self-tests and the repository validator remain required at commit closure. The known
  collaborator-owned `SK-TASK-076` missing-`Next gate` finding is not caused by this increment and is
  not changed here.

## Exact conclusion and next gate

**CP-080 closes the local dynamic-continuation binding gap without changing the accepted page or
server contracts.** No further local gate remains for this task. The next independent gate is a
supported authenticated WebMCP session that reads a newer continuation and invokes the refreshed
action through the approved page seam; no credentials, arbitrary request injection, or polyfill is
allowed to manufacture that evidence.

Reopen this audit if the continuation schema, server signal ordering, registration lifecycle, or
server recall authority changes, or if a supported host exposes a different registration/readback
semantics.
