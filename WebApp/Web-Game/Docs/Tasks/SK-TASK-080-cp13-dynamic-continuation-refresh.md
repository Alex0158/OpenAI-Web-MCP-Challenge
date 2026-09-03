# SK-TASK-080: CP-13 Dynamic Continuation Refresh

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-13`
- Owner: Game owner
- Current increment: The page registrar keeps one continuation-bound recall registration per generation and refreshes its active identity to a newer server-issued signal. The red-to-green proof, focused suites, typecheck, runtime evidence, and cross-functional audit are recorded in [`SK-EVID-074`](../Evidence/SK-EVID-074-cp13-dynamic-continuation-refresh-runtime-verification.md) and [`Validation/100`](../Validation/100-cp13-dynamic-continuation-refresh-cross-functional-audit.md).
- Next gate: None for this task's named local registrar lifecycle scope. A supported authenticated WebMCP read of a rotated continuation and a dynamic Agent action remain independent CP-13/CP-14 gates.

## Identity

- Task ID: `SK-TASK-080`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: This is a narrow WebMCP capability-lifecycle correction. It crosses page registration, server-issued continuation identity, signal cooldown rotation, stale-command handling, and full-snapshot reconciliation, but it does not change the accepted command or server authority.

## Objective

Keep one live page generation useful across successive server-issued continuation signals. When a fresh
`inspect_shelter_state` read returns a newer continuation, the already registered
`force_recall_soldier` tool must validate the current signal identity while preserving one tool
registration and the existing server-authoritative command path.

## Success and non-goals

- Success: The first eligible continuation registers one `force_recall_soldier` tool.
- Success: A later read in the same generation with a newer signal updates the closure used by that
  existing tool; the registrar does not register a duplicate tool or reset the four read tools.
- Success: A stale invocation carrying the previous signal returns `STALE_REENTRY_CONTEXT`; an
  invocation carrying the current signal reaches the existing page transport and reconciliation hook.
- Success: Out-of-order reads cannot move the active closure back to an older continuation when the
  continuation metadata identifies the newer signal.
- Success: Reconnect, stale projection, unmount, and registration failure continue to abort the whole
  generation and leave the human fallback unchanged.
- Non-goals: Changing signal cooldown/coalescing policy, adding a second active continuation, exposing
  opaque bindings or credentials, changing `force_recall_soldier` input schema, adding arbitrary
  command tools, changing server ownership/provenance validation, or claiming hosted WebMCP/Agent
  delivery.

## Scope and authority

- In scope: `src/client/webmcp-page-tools.ts`, the focused registrar tests, and Game-owned task,
  evidence, validation, and index documents.
- Out of scope: `reentry-core/`, Cloud Receiver/Local Connector, Railway, Clerk, database schema,
  server mission transitions, RightSpot, and collaborator-owned CP-14 files.
- Owning contract: [`Engineering/05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md),
  [`Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md), and the accepted
  [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md).
- Related page lifecycle audit: [`Validation/75`](../Validation/75-cp13-page-tools-runtime-cross-functional-audit.md).

## Design decision

The page keeps one registered tool per registration generation, but its closure holds the latest
server-issued continuation identity. A later shelter read may refresh that identity only when its
continuation metadata is at least as new as the active read. This avoids duplicate registration APIs,
keeps the accepted schema stable, and makes a previous signal fail closed after cooldown rotation.
The server remains the authority: the page supplies only the signal identity and current revisions,
and the existing gateway validates ownership, provenance, idempotency, and live state.

## Smallest reversible action

Add one red test that reads signal A, reads signal B in the same generation, proves only one recall
registration exists, rejects signal A, and forwards signal B. Add only the state needed to compare
continuation freshness and reset it on `stop`; do not alter server routes or command contracts.

## Verification and closure target

- Minimum verification: focused CP-13 registrar test, affected CP-13 page-tool test file, typecheck,
  `git diff --check`, and affected documentation validation.
- Closure target: `runtime_verified` for the registrar lifecycle correction; hosted WebMCP, Agent wake,
  external delivery, and judge reproduction remain separate claims.
- Reopen trigger: duplicate tool registrations, an older signal replacing a newer one, a current signal
  being rejected, a stale signal being accepted, generation cleanup failure, or any server contract
  change.

## Implementation result

- The registrar now keeps the active server signal identity in the existing generation closure and
  refreshes it only when `latest_world_time` or, as a tie-breaker, `cursor_end` advances.
- A late read with older continuation metadata cannot rebind the action. The old signal fails closed
  with `STALE_REENTRY_CONTEXT`, while the current signal follows the existing page transport,
  server-authoritative recall transition, and full-snapshot reconciliation.
- No route, schema, persistence, signal cooldown, coalescing, WebMCP registration count, or external
  Receiver/Connector surface changed.

## Runtime closure

- `npm run test:cp13-page-tools` — `10/10` passed.
- `npm run test:cp13-recall` — `9/9` passed.
- `npm run test:cp16-page-recall` — `1/1` passed.
- `npm run typecheck` — passed.
- `git diff --check` — passed for the changed Game paths.
- The evidence packet is [`SK-EVID-074`](../Evidence/SK-EVID-074-cp13-dynamic-continuation-refresh-runtime-verification.md);
  the cross-functional audit is [`Validation/100`](../Validation/100-cp13-dynamic-continuation-refresh-cross-functional-audit.md).

## Claim limit

This task closes only the local page registrar refresh boundary. It does not establish genuine hosted
WebMCP dynamic invocation, Agent wake, Re-entry delivery, Cloud Receiver/Local Connector behavior,
provider rollback, independent browser action, or judge reproduction.
