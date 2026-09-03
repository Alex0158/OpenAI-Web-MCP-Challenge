# SK-EVID-074: CP-13 Dynamic Continuation Refresh Runtime Verification

## Identity

- Evidence ID: `SK-EVID-074`
- Related task, contract, and audit: [`SK-TASK-080`](../Tasks/SK-TASK-080-cp13-dynamic-continuation-refresh.md), [`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md), [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md), and [`Validation/100`](../Validation/100-cp13-dynamic-continuation-refresh-cross-functional-audit.md)
- Evidence class: `process-runtime`
- Ladder level: `4` for the local page registrar and server-continuation lifecycle; this is not hosted WebMCP, Agent, or Re-entry delivery evidence
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Source state: Git branch `main`, baseline HEAD `28d74e5` (the preceding Core compatibility documentation/source closure) with the CP-080 Game implementation under test in the working tree
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.20.0`; repository `tsx` runner; TypeScript typecheck
- Test boundary: the real `createWebMcpPageToolRegistrar` with a deterministic local `document.modelContext` registration double and a deterministic page transport double
- External state: no hosted endpoint, Railway, Clerk credential, Cloud Receiver, Local Connector, or external Agent session was used

## Objective and claim boundary

- Behavior under test: One live page generation keeps a single registered `force_recall_soldier` tool while the server-issued continuation changes from signal A to newer signal B.
- Claim this evidence may support: the local registrar refreshes the active signal identity from a newer shelter continuation, rejects the superseded signal, forwards the current signal, ignores an out-of-order older read, and clears the binding on generation stop.
- Claims this evidence cannot support: a real WebMCP adapter invocation, hosted dynamic recall, Cloud Receiver or Local Connector delivery, Codex Thread activation, Agent wake, production identity, provider rollback, or judge reproduction.

## Preconditions and fixture

- The server continuation contract already exposes `signal_id`, `cursor_end`, and `latest_world_time`; this increment does not change that schema, cooldown, coalescing, or server validation policy.
- The test double registers tools in a map and counts registrations. Page reads return signal A at cursor/time `10/100`, newer signal B at `20/200`, then a late signal A response. The recall execute closure is retained to prove that the registration identity is stable.
- The page transport double returns a successful bounded result for the current recall; server authority, ownership, provenance, idempotency, and reconciliation remain the existing production code paths and are not replaced by this test.

## TDD execution

| Step | Replayable procedure | Expected result | Actual result | Status |
|---|---|---|---|---|
| 1 | Run the new continuation-refresh test before changing the registrar | Signal B is not usable through the captured signal-A closure, so the new proof fails | `npm run test:cp13-page-tools` reported `9` passing and `1` expected failing test (`Missing expected rejection`) | **red proof** |
| 2 | Add freshness state to the existing registrar closure, compare `latest_world_time` then `cursor_end`, and retain one registration per generation | A newer signal updates the active identity without duplicate registration; an older late read cannot regress it | Implementation completed in `src/client/webmcp-page-tools.ts`; no route, schema, or server authority changed | **pass** |
| 3 | Run the focused page-tool suite | Signal A rejects after B, signal B forwards, registration count stays one, and stop cleanup remains valid | `npm run test:cp13-page-tools` — `10/10` passed | **pass** |
| 4 | Run adjacent recall and page-recall composition suites | Existing server recall and page composition remain compatible | `npm run test:cp13-recall` — `9/9` passed; `npm run test:cp16-page-recall` — `1/1` passed | **pass** |
| 5 | Run TypeScript and whitespace checks | The implementation is type-safe and introduces no whitespace error | `npm run typecheck` passed; `git diff --check` passed for the changed Game paths | **pass** |

## Assertions

- First eligible continuation registers exactly one `force_recall_soldier` tool.
- The second, newer continuation keeps the same registered function object and changes only the active server signal identity.
- Invoking with signal A after signal B returns `STALE_REENTRY_CONTEXT`; invoking with signal B reaches the existing page transport.
- A late signal-A read cannot rebind the closure to the superseded signal because its continuation metadata is older.
- `stop("unmount")` clears the active identity and registration lifecycle state; no new tool or hidden timer is introduced.
- The human fallback, server-owned page transport, full-snapshot reconciliation, and existing idempotency path are unchanged.

## Cross-functional chain

```text
server-issued shelter continuation
  -> page shelter read
  -> freshness comparison (world time, then cursor)
  -> one existing WebMCP recall closure
  -> signal identity and current revisions forwarded
  -> existing server provenance/ownership/idempotency validation
  -> existing full-snapshot reconciliation
```

The page owns only the short-lived binding needed by the registered tool. The server remains the
authority for whether the signal, soldier, mission, attempt, shelter, and revisions are current.

## Analysis, limitations, and closure

- Result: The local CP-13 registrar lifecycle correction is runtime-verified for one page generation and the named focused suites.
- No contract change: signal rotation and one-active backpressure remain governed by `SK-MVP-0.2` and `ADR-GAME-0009`; this increment only closes the page binding gap that those existing server signals exposed.
- Intentionally unrun: genuine hosted WebMCP dynamic invocation, external Re-entry delivery, Agent wake, independent authenticated browser action, Railway rollback, and judge rehearsal. The current supported browser surface cannot be used to fabricate those claims.
- Reopen if: a host requires duplicate registrations, freshness metadata changes, a current signal is rejected, an older signal is accepted, generation cleanup fails, or the server continuation contract changes.

## Exact conclusion

**The local page registrar now refreshes a single registered recall action to the newest server-issued continuation within a generation and fails closed on superseded signals. This closes the CP-080 local lifecycle increment only; hosted WebMCP, Agent, Re-entry, external delivery, and judge claims remain open.**
