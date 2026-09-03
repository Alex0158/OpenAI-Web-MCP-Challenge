# TASK-029: Integrate Connector Effect Acknowledgement

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `implementation`
- Lifecycle: `pending`
- Priority: `P1`
- Owner: Local Connector, selected Host application, and effect-authority owners.
- Current increment: Select and integrate the real Host-effect authority needed for the default
  Connector to reach effect-backed acknowledgement.
- Next gate: A route-specific accepted decision and executable composition prove one real correlated
  Host effect, acknowledgement, replay, and safe unknown-outcome behavior without auto-acknowledging
  adapter success.
- Dependencies: ADR-0009, ADR-0037, ADR-0038, TASK-001, AUDIT-V2-003 in Core/09, and a selected Host
  effect contract.

## 1. Problem and objective

The default Connector claims and dispatches work but does not obtain effect proof or call its
available acknowledgement client. Separate-process evidence reaches acknowledgement only through a
test-specific effect authority and worker. An unacknowledged successful dispatch can therefore be
reclaimed and repeated until the Receiver exhausts its attempt budget.

The objective is to close the product composition without confusing process completion with a Host
effect.

## 2. Authority and evidence

- ADR-0009 and ADR-0038 own effect-backed acknowledgement.
- ADR-0037 owns lease expiry and bounded reclaim.
- Mechanisms 03–05 own the Connector, effect, Host, and human-boundary separation.
- `CONNECTOR-V2-ACK-001` and `CONNECTOR-V2-E2E-001` prove the current split and test-only completion
  path.

## 3. Scope

After Host application selection, specify effect identity, attestation source, correlation,
authorization, timing, response loss, restart, duplicate effect, stale lease, revocation, and human
boundary. Integrate the minimum real consumer across Host, Connector, and Receiver.

## 4. Non-goals

- acknowledging adapter `accepted`, Codex exit, Browser navigation, narration, or HTTP health;
- adding blind retries, an alternate transport, or a synthetic production verifier;
- selecting a Host application or Agent runtime inside this task; or
- exposing effect or lease credentials to the Agent prompt or browser.

## 5. Verification and closure

Close only with a selected-app true-chain run that separates activation, Host effect, and
acknowledgement; proves exact replay and response-loss recovery; fences stale/wrong effects; and
records the deployed or explicitly local evidence level without overclaiming.

## 6. Reopen condition

Reopen for any changed effect authority, acknowledgement payload, lease timing, retry behavior,
Host correlation, or evidence that the default Connector can dispatch without safe convergence.
