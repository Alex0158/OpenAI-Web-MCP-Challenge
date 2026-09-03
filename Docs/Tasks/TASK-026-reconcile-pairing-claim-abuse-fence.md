# TASK-026: Reconcile Pairing Claim Abuse Fence

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `decision`
- Lifecycle: `pending`
- Priority: `P0`
- Owner: Project team and Cloud Receiver v2 security owner.
- Current increment: Select one enforceable abuse-control contract for the anonymous v2 pairing
  claim without weakening one-time token issuance or tokenless exact replay.
- Next gate: An accepted ADR amendment or replacement decision specifies the claim identity,
  attempt/rate limit, terminal behavior, concurrency semantics, and focused red tests.
- Dependencies: ADR-0033, AUDIT-V2-001 in Core/09, TASK-012, and the Primary Development Runbook.

## 1. Problem and objective

ADR-0033 requires at most five failed pairing claims and a terminal sixth response. The active
request carries only an eight-hex-character code. The service can find a row only when that code is
already correct, never increments `failedAttempts`, and applies no limiter to the anonymous claim
route. The documented per-pairing failure budget therefore has no enforceable identity for wrong
guesses.

The objective is to decide a coherent abuse fence before wider preview or production use.

## 2. Authority and evidence

- ADR-0033 owns the accepted pairing contract.
- Core/04 owns the system security boundary; Mechanism 03 owns pairing-to-delivery integration.
- Current evidence is `pairing.service.ts`, `pairing.routes.ts`, the Prisma `PairingSession`, the
  authentication-only rate limiter, and PAIR-001 through PAIR-006.
- This task records a decision need; it does not make the current code or a proposed alternative
  normative.

## 3. Scope

Choose and specify one bounded design, including entropy, correlatable identity if any, atomic
attempt accounting, deployment-layer rate limits, exact error behavior, replay, race handling,
restart persistence, observability, and secret-free tests. Reconcile ADR-0033 and the owning Core and
Mechanism documents before implementation.

## 4. Non-goals

- changing pairing code or schema before the decision is accepted;
- adding CAPTCHA, alternate pairing transports, hidden retry, or account credentials to the CLI;
- exposing raw pairing or Connector tokens in storage, logs, or tests; or
- claiming that an unspecified platform firewall closes the application contract.

## 5. Verification and closure

Close only after the accepted contract has focused tests for the attempt/rate boundary, concurrent
claims, terminal response, exact duplicate replay, restart, and secret absence; the implementation
and migration decision are verified; and Core/04, Core/09, Mechanism 03, and Development evidence
agree.

## 6. Reopen condition

Reopen for changed code entropy, request identity, attempt semantics, rate-limit scope, replay,
terminal response, or evidence that deployment-layer controls differ from the accepted design.
