# Research 26: Pairing Claim Abuse-Fence Proposal

**Role:** SUPPORTING security and implementation decision proposal  
**Status:** Proposed, not an accepted protocol or authorization to change runtime  
**Date:** 2026-09-03  
**Owner:** [TASK-026](../Tasks/TASK-026-reconcile-pairing-claim-abuse-fence.md)

## 1. Objective and authority boundary

ADR-0033 accepts an anonymous Local Connector claim with an eight-character code, at most five
failed claims, and a terminal sixth response. The active implementation can only find a pairing
row when the submitted code is already correct, so a wrong guess never reaches `failedAttempts`.
The route also has no durable application-level limiter. This leaves the accepted abuse boundary
without an enforceable identity.

This proposal selects a concrete direction for ADR review. It records a recommendation, not an
accepted change. Until an ADR amendment or replacement is accepted, the current v2 request, schema,
error behavior, and Connector release remain authoritative and the known gap remains open.

## 2. Verified current constraints

The following facts were checked against the active v2 source and documents:

- `POST /v0.1/account/pairing-sessions/claim` currently accepts exactly
  `{ pairing_code, device_name }` without a cookie or Organization key.
- The generated code is eight uppercase hexadecimal characters and only its SHA-256 digest is
  persisted. The dashboard response already contains a non-secret `pairing_id`.
- A correct first claim atomically creates one Connector and one immutable delivery target and
  returns the raw Connector token once. An exact consumed-code replay returns metadata with
  `duplicate: true` and no raw token.
- `PairingSession.failedAttempts` exists, but a wrong digest has no row match and therefore cannot
  increment it. The current authentication limiter is not attached to the anonymous claim route
  and its in-memory default is not a distributed production control.
- Current ADR wording says that the sixth failed claim returns `410 pairing_expired`; the current
  implementation rejects at the existing counter boundary and has no test for either path.

These are source observations, not evidence of an exploited production service. The proposal does
not claim that the existing eight-character code is safe without the missing fence.

## 3. Alternatives considered

| Alternative | Strength | Blocking weakness |
|---|---|---|
| Keep `{ pairing_code, device_name }` and rely on an edge or in-memory limiter | No request or schema change | No per-pair identity; restart and multi-instance behavior are undefined; a platform firewall is not an application contract |
| Replace the code with a much longer secret and remove the per-pair budget | One input and no row-correlation field | Changes the accepted UX and ADR semantics; still needs a durable source limiter and does not preserve the documented fifth/sixth boundary |
| Add a public code prefix or embedded pairing hint | One input can still correlate a row | Requires a new uniqueness/lifecycle rule for hints and another code format; the hint becomes a second secret-like value to document and test |
| **Require `pairing_id` with the existing code and add a durable source bucket** | Preserves short-code UX, one-time issuance, tokenless replay, and exact per-pair budget while making wrong guesses addressable | Guided CLI asks for one extra non-secret field; the active preview request and clients need a coordinated contract revision |

The last option is recommended because it fixes the missing identity with the least change to the
secret itself and keeps the security boundary explicit. The extra field is a public locator, not a
credential; the code remains the only secret in the claim request.

## 4. Recommended claim contract

### Request and lookup

The claim body becomes strict and exact:

```json
{
  "pairing_id": "pairing_123",
  "pairing_code": "A1B2C3D4",
  "device_name": "Mac One"
}
```

The Receiver first resolves the row by `pairing_id`, then compares the submitted code against the
stored digest. It must not look up by a raw code, store a raw code, or expose whether an arbitrary
identifier exists. `device_name` remains a display value only and is ignored on exact replay.

The active v2 preview may amend the existing route after the complete consumer inventory confirms
that clients are jointly controlled and unpublished. If any independently retained or deployed
consumer still sends the old body, do not make the field silently optional; introduce a separately
versioned claim route and release the matching Connector instead. Old clients must never receive a
weaker, unbounded fallback path.

### Per-pair failure semantics

`failedAttempts` is a durable count of wrong, well-formed codes for that pairing. The transaction
must serialize the following outcomes:

| Condition | Result | Mutation |
|---|---|---|
| Unknown `pairing_id`, malformed body, or wrong code for an unknown/consumed row | Stable generic not-found or validation error | No pairing-row mutation |
| Wrong code, attempts 0–4 | `404 pairing_not_found` | Increment to 1–5 atomically |
| Wrong code, attempts 5 | `410 pairing_expired` | Increment to terminal count 6 atomically |
| Wrong code after terminal count, or ordinary expiry | `410 pairing_expired` | No further count increase |
| Correct live code, including after five wrong attempts | `200` with one raw token only on first claim | Consume once, create one Connector and target atomically |
| Exact correct replay after consumption | `200`, `duplicate: true`, metadata only | No attempt or Connector mutation |

The sixth wrong claim is therefore the terminal transition. A row lock or compare-and-set must
prevent two concurrent wrong claims from losing increments or allowing a valid claim after the
terminal transition. A concurrent valid first claim may win before a sixth wrong claim; once it
consumes the row, later wrong codes remain generic and cannot create or reassign a Connector.

The response code for wrong guesses is intentionally indistinguishable from an unknown identifier.
The terminal `410` is retained from ADR-0033 and does not disclose whether the cause was expiry or
the abuse fence. Exact duplicate replay continues to omit `connector_token` entirely.

### Cross-source request budget

Per-pair accounting cannot protect guesses against unknown identifiers. Every anonymous claim
request therefore reserves one entry in a durable source bucket:

- **Limit:** 30 requests per trusted source per ten-minute window (recommended starting value).
- **Key:** HMAC of the normalized trusted ingress client identity plus window start. Store the
  keyed digest, count, window expiry, and no raw IP or forwarding header.
- **Response:** `429 pairing_rate_limited` and a bounded `Retry-After` value. The response contains
  no remaining count, pair existence, or source details.
- **Atomicity:** PostgreSQL upsert/increment (or an equivalent durable transaction) is the source
  of truth across replicas and process restarts. Retention cleanup may remove expired buckets only
  after their window is closed.
- **Ingress identity:** use the configured trusted proxy/client address. Never trust an arbitrary
  `X-Forwarded-For` value. If the deployment cannot establish a trusted identity or the limiter
  store is unavailable, reject with a generic bounded service failure rather than bypassing the
  control.

The source budget applies to malformed-but-shape-valid anonymous attempts and duplicate replays as
well as first claims. This keeps the route simple and bounds resource use; the CLI can retry after
the returned delay. It does not replace the per-pair terminal count.

## 5. Cross-functional effects

| Surface | Required preparation after acceptance | Boundary preserved |
|---|---|---|
| User dashboard | Show/copy `pairing_id` and code as a pair, with a short explanation that both are needed | Dashboard never receives or displays the Connector token |
| Local Connector CLI | Prompt for or accept `--pairing-id` alongside the existing code; send both; keep credential-file custody unchanged | Connector remains outbound-only and cannot create Grants |
| Shared schemas and migration | Add only the identity/index and durable limiter state required by the accepted design; preserve existing consumed/expired history | No raw code, token, or source identity persistence |
| Receiver route/service | Add strict parsing, row-correlated atomic accounting, source bucket, generic errors, and fail-closed store handling | One-time issuance, immutable target, disconnect, lease, and ACK contracts stay unchanged |
| Operations | Configure the trusted ingress identity and HMAC pepper; expose bounded counters/outcomes without secrets | Edge rate limiting is supplementary, not a substitute |
| Evidence and docs | Extend PAIR tests, restart/concurrency matrix, runbook, Mechanism 03, Core/04, Core/09, and ADR-0033 together | No closure claim from component tests alone |

The extra CLI field is a small setup cost paid once per device. It avoids making the short secret
longer and gives the service a stable, non-secret row identity for the exact abuse budget.

## 6. Failure, concurrency, and recovery cases

The accepted implementation must prove all of these without secret-bearing fixtures or logs:

1. Five wrong codes increment exactly to five; a valid code then succeeds and returns one token.
2. The sixth wrong code records the terminal count and returns `410`; later valid claims cannot
   consume the pairing.
3. Concurrent wrong claims produce no lost updates and never create a Connector; a concurrent pair
   of valid claims produces one token and one tokenless duplicate response.
4. Unknown identifiers consume only the source bucket, never a guessed pairing row. The 31st request
   in one window returns `429`; a later window is allowed after `Retry-After`.
5. Close/reopen or restart preserves the per-pair count and source bucket; an in-memory reset cannot
   reopen a terminal pairing or bypass the source budget.
6. A database/limiter outage does not fall back to an unbounded in-memory or platform-only path.
7. Logs, errors, snapshots, and test output contain neither raw code nor Connector token and do not
   reveal arbitrary pairing existence.

## 7. Acceptance and implementation gate

Before code or migration work, the project must accept one ADR amendment or replacement that fixes:

- whether the existing v0.1 claim route is revised under a coordinated preview release or a new
  route version is required;
- the required `pairing_id` request field and dashboard/CLI presentation;
- the 30-per-10-minute source budget, trusted-ingress configuration, and fail-closed behavior;
- the exact sixth-failure and rate-limit error codes, status, and `Retry-After` policy; and
- the consumer, rollback, migration, and old-client rejection inventory.

After acceptance, implementation proceeds with red tests first: parser/shape, five-plus-six
attempts, exact replay, concurrent claims, source bucket, restart, outage, and sensitive-output
checks. Core/04, Core/09, Mechanism 03, the active Receiver guide, Local Connector guide, and
Development evidence must be synchronized before TASK-026 can close.

No production deployment, public compatibility claim, code entropy change, Grant change, delivery
change, or Game behavior is included in this proposal.
