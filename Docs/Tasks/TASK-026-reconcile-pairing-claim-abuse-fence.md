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

### Proposed decision package (not accepted)

The supporting [Research 26 proposal](../Research/26-pairing-claim-abuse-fence-proposal.md) recommends
one bounded contract for review. It is preparation only; it does not amend ADR-0033 or authorize
runtime, schema, Connector, or deployment changes.

1. Keep the eight-uppercase-hex secret code and add the already-public `pairing_id` as a required
   claim field. The active v2 preview has no compatibility promise for the current request shape, so
   the existing claim route may be amended only after the consumer inventory is confirmed; an
   independently retained consumer requires a separately versioned route instead.
2. Resolve the pairing row by `pairing_id`, compare the submitted code digest, and keep the raw code
   out of storage and logs. Wrong but well-formed codes increment a durable per-pair counter
   atomically. Attempts one through five return the stable not-found response; the sixth atomically
   records the terminal count and returns `410 pairing_expired`. A valid claim after five wrong
   attempts still succeeds; a terminal sixth wrong attempt fences later claims. Exact consumed-code
   replay remains tokenless and does not consume an attempt.
3. Add a durable application-level source bucket for every anonymous claim request: thirty requests
   per ten-minute window, keyed by an HMAC of the trusted ingress client identity and window. It
   returns `429 pairing_rate_limited` with `Retry-After`; it is atomic across replicas and survives
   restart. A missing or untrusted client identity, or an unavailable limiter store, must fail closed
   rather than trust arbitrary forwarding headers or bypass the fence. Platform edge limits remain
   an extra layer, not the contract.
4. Use generic responses for unknown `pairing_id`, wrong code, and wrong code against a consumed
   pairing, so the route does not become a pairing-state oracle. Do not include code, token, source
   identity, or database details in responses or logs.
5. Preserve one-time Connector-token issuance, immutable delivery-target binding, exact duplicate
   replay, disconnect, delivery-lease, and Grant semantics. The abuse fence is a pairing boundary;
   it must not widen any downstream authority.

The package remains **proposed** until the project accepts the request shape/version, the exact
rate-window values, the trusted-ingress configuration, the terminal error wording, and the
consumer/rollback inventory in an ADR amendment or replacement.

## 6. Reopen condition

Reopen for changed code entropy, request identity, attempt semantics, rate-limit scope, replay,
terminal response, or evidence that deployment-layer controls differ from the accepted design.
