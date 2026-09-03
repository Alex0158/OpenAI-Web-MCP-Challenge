# SK-EVID-047: CP-13 Page Tools Local Runtime Verification

**Status:** LOCAL IMPLEMENTATION VERIFIED; canonical-page capability is recorded separately in [`SK-EVID-049`](SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md); dynamic Agent/Re-entry evidence remains open  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md)  
**Challenge:** [`Validation/74`](../Validation/74-cp13-page-tools-implementation-preimplementation-challenge.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Fixture:** [`Scenario/13`](../Scenarios/13-cp13-webmcp-fixtures.md) and the persisted G2 local fixture

## Question

Does the CP-13 page implementation keep one server authority while exposing the four accepted bounded
reads and a continuation-gated recall action through the local fixture page transport, with safe
schema/readback, scope, pagination, unsupported behavior, and full-snapshot reconciliation?

## Exact identity and environment

- Source root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Git branch: `main`; no commit, push, deployment, or external write was performed for this increment.
- Contract version: `SK-MVP-0.2`.
- Runtime: Node `v24.20.0` selected through `/opt/homebrew/opt/node@24/bin`.
- Fixture: isolated file-backed temporary SQLite databases; page HTTP test uses the explicit
  `sleepless-mvp-01` fixture and the server-issued `fixture-binding-a` session.
- Capability test instrument: a disposable in-process `modelContext` test double only. It is not
  WebMCP adapter evidence and is not used to claim page capability.

## Executed commands

```text
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp13-page-tools
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-projection
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-fixture
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-reconnect
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-dispatch
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp13-recall
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp06
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp08
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp08-cadence
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp09
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp10
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp11
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp11-hunter
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-publication
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-intent
```

Results in the source window:

- TypeScript completed with no errors.
- `test:cp13-page-tools`: **9/9 passed**.
- `test:cp12-projection`: **5/5 passed**.
- `test:cp12-fixture`: **10/10 passed**.
- `test:cp12-reconnect`: **3/3 passed**.
- `test:cp12-dispatch`: **31/31 passed**.
- `cp13-recall-transition`: **9/9 passed**.
- CP-06 clock/coordinator/scheduler: **21/21 passed**.
- CP-08 movement snapshot/cadence/gateway: **4/4, 5/5, and 7/7 passed**.
- CP-09 dispatch/route: **20/20 passed**; CP-10 combined extraction/cadence: **49/49 passed**.
- CP-11 combat/hunter: **7/7 and 6/6 passed**.
- CP-12 publication/continuous-intent: **24/24 and 13/13 passed**.

## Observed proof

| Boundary | Result | What the local proof establishes |
|---|---|---|
| Contract parser | Pass | Read inputs are closed objects; history accepts only bounded cursor/limit fields; recall requires distinct command/idempotency identity, stable mission IDs, revisions, and `signal_id`. Unknown fields and invalid limits fail closed. |
| Single authority | Pass | Gateway read and recall methods enqueue on the existing `WorkerCommandGateway`; the page route never constructs a worker, store, resolver, or queue. |
| Server scope | Pass | The HTTP endpoint derives world/player/binding/shelter from the HttpOnly fixture session. Query identity is rejected and the read projection returns only the resolved player scope. |
| HTTP transport boundaries | Pass | An existing session still cannot add query identity, use a non-JSON media type, exceed the 8 KiB page-tool body limit, or submit unknown input fields; each request is rejected before the gateway receives a page operation. |
| Stale in-flight response | Pass | A read response that resolves after `stop("reconnect")` is rejected with `AbortError`; the old generation cannot register a continuation, invoke reconciliation, or return stale page data, and all old tools remain cleared. |
| Bounded reads | Pass | Shelter state contains fixed Wood/Rock counts and revisions; `agent_snapshot_v1` omits exploration/blocked arrays; missions are capped at five fixture rows and omit route waypoints. |
| History | Pass | Results use the existing visibility predicate, default/max limits of 20/50, and opaque cursors signed to world/player/shelter scope. A foreign scope cursor is rejected before rows are returned. |
| Continuation gate | Pass | A page recall tool appears only after the shelter read returns a durable server signal slot with bounded action `force_recall_soldier`. Missing or mismatched signal provenance is typed `STALE_REENTRY_CONTEXT`. |
| Recall transition | Pass | The page transport delegates to the previously verified server recall transition; the local trace reaches `RETURNING`, preserves the route/cargo identity, and returns metadata with `full_snapshot_required: true`. |
| Duplicate and failure behavior | Pass | Repeating the same recall body replays the durable result with `duplicate: true`; no second transition is written. Initial registration failure, initial schema/readback mismatch, and continuation recall readback mismatch abort the active generation, remove registered tools, and leave a visible human-controls fallback. Disabled fixture mode returns `WEBMCP_UNAVAILABLE` without setting a session cookie. |
| Schema readback | Pass | The registrar compares recursively canonicalized JSON Schema meaning, so host object-key reordering does not create a false mismatch. |
| Registration lifecycle | Pass | The test double observes four initial reads, one dynamic recall registration per generation (including concurrent shelter-read race protection), readback-gated readiness, abort-based removal of all tools on unmount, and fail-closed cleanup for registration/readback errors. |
| Human fallback and reconciliation | Pass | Unsupported or failed capability states remain visible; a committed recall invokes the existing full realtime resync callback and never applies an optimistic route, phase, cargo, or coin update. |
| Stale projection cleanup | Pass | Invalid frames, rejected/stale projections, missing snapshots, socket errors, reconnects, and unmount abort the active registration generation. |

## Post-verification race hardening

The concurrent continuation-registration case first failed with two `registerTool` calls, proving the
race before the fix. A later-read case also proved that the recall tool could be observed as ready before
its schema readback completed. A stale-response case then resolved an ignored-abort fetch after reconnect
and proved that old data could be returned before the guard. The page registrar now uses a per-generation
promise lock so concurrent `inspect_shelter_state` callbacks await one registration, share its readback
result, only mark the recall tool ready after semantic readback succeeds, and reject every response from
a stopped generation.

The focused Green rerun passed:

- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp13-page-tools` — **9/9 passed**;
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp13-recall` — **9/9 passed**;
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-projection` — **5/5 passed**;
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` — passed; and
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run build` — passed with Next.js `16.3.4`.

The failure-path falsifiers passed in the same page suite: a host registration rejection after a partial
initial registration, an initial semantic schema/readback mismatch, and a continuation-bound recall
readback mismatch each end in visible `error` status, unregister every tool in the generation, and keep
the human-controls fallback message. No domain request is inferred from these capability failures.

After the stale-generation guard, the transitive lifecycle checks were rerun:

- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-reconnect` — **3/3 passed**; and
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp12-projection` — **5/5 passed**.

These checks confirm that reconnect scope retention and server-owned projection behavior remain
unchanged while late page responses are rejected.

This hardening changes no server contract, signal policy, or external capability claim. The canonical
page WebMCP gate remains open as described below.

## Implementation boundary proved

- [`src/shared/page-tool-contract.ts`](../../src/shared/page-tool-contract.ts) owns the external
  snake-case names, closed schemas, bounded history parameters, and parser.
- [`src/server/entrypoint.ts`](../../src/server/entrypoint.ts) owns the local-only POST transport,
  readiness/session/body gates, typed page failures, and fixture grant provider.
- [`src/server/world-projection.ts`](../../src/server/world-projection.ts) maps the full server snapshot
  to fixed page read models without creating a second projection authority.
- [`src/server/worker-command-gateway.ts`](../../src/server/worker-command-gateway.ts) serializes all
  page reads and recall with the existing FIFO.
- [`src/client/webmcp-page-tools.ts`](../../src/client/webmcp-page-tools.ts) owns capability detection,
  semantic same-page readback, dynamic grant registration, and AbortController generation cleanup.
- [`src/client/live-game-projection.tsx`](../../src/client/live-game-projection.tsx) starts the registrar
  only after the first accepted full snapshot and stops it on every stale/reconnect lifecycle.

## Claim boundary and remaining gate

This record supports a local implementation/slice claim at ladder level 4 for the named fixture HTTP,
gateway, page registrar, and projection lifecycle. The fake `modelContext` is a contract instrument;
it does not prove genuine WebMCP discovery or invocation.

The assigned GPT-5.6 Sol subagent reviewed the canonical seam but had no callable WebMCP discovery,
built-in browser, or dynamic tool-search adapter in its 471-tool inventory. It therefore did not run a
REST, DOM, headless-browser, or polyfill substitute. A fresh supported canonical-page run remains the
ladder-level 6 gate for `SK-TASK-061`; until that evidence exists, the task remains
`verification_pending` and no canonical Agent claim is made.

## Invalidation triggers

Invalidate this record if the page endpoint, `SK-MVP-0.2` schemas, server session binding, signal-slot
provenance, full-snapshot reconciliation path, WebMCP registration/readback API, fixture seed, or Node
runtime changes. A supported adapter result for the canonical page must be recorded separately rather
than editing this local result into a stronger claim.
