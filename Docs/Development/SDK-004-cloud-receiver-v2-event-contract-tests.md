# SDK-004 — Cloud Receiver v2 Signed Event Contract Tests

**Task:** [TASK-018](../Tasks/TASK-018-prepare-sdk-v2-event-contract-tests.md)
**Decision:** [ADR-0036](../Decisions/ADR-0036-adopt-cloud-receiver-v2-signed-event-ingress.md)
**Source contract:** [Feature 03 — Signed Host Event Ingress](../Cloud-Receiver-Handoff/v2-build/03-signed-event-ingress.md)
**SDK integration map:** [SDK to Cloud Receiver v2 Integration Contract](../Cloud-Receiver-Handoff/v2-build/08-sdk-cloud-receiver-integration.md)
**Status:** `closed` — SDK Event contract verified against the exact Feature 3 commit
**Repository surfaces:** root SDK tests plus nested `saas-boilerplate/` Receiver source at the exact supplied SHA

## Objective

Exercise the SDK's actual `sendEvent()` request builder against the real v2 Receiver and a
disposable PostgreSQL database after Feature 3 is reported green. The suite stops at Event ingress:
it does not call Delivery Claim, acknowledgement, an Agent, or any alternate transport.

## Test matrix

| ID | Boundary | Expected result | Current disposition |
|---|---|---|---|
| `SDK-V2-EVENT-001` | SDK `sendEvent()` -> `POST /v0.1/events` | Exact canonical signed envelope; no `Authorization`; `202` continuation acceptance | Passed against `b851c320fae0505e3cf098f979d149e04ab44310` |
| `SDK-V2-EVENT-002` | Identical SDK Event replay | `202`, same identifiers, `duplicate: true`; no second run consumption | Passed against `b851c320fae0505e3cf098f979d149e04ab44310` |
| `SDK-V2-EVENT-003` | Mutated Event signature | `401`, `{error:{code:"event_signature_invalid"}}`; Grant unchanged | Passed against `b851c320fae0505e3cf098f979d149e04ab44310` |
| `SDK-V2-EVENT-004` | Valid Event for expired Grant | `410`, `{error:{code:"grant_expired"}}`; Grant unchanged | Passed against `b851c320fae0505e3cf098f979d149e04ab44310` |
| `SDK-V2-EVENT-005` | Valid Event for revoked Grant | `422`, `{error:{code:"grant_revoked"}}`; Grant unchanged | Passed against `b851c320fae0505e3cf098f979d149e04ab44310` |
| `SDK-V2-EVENT-006` | Valid Event with wrong issuer origin | `422`, `{error:{code:"event_origin_mismatch"}}`; Grant unchanged | Passed against `b851c320fae0505e3cf098f979d149e04ab44310` |
| `SDK-V2-EVENT-007` | Canonical body with invalid sequence | `422`, `{error:{code:"event_sequence_invalid"}}`; Grant unchanged | Passed against `b851c320fae0505e3cf098f979d149e04ab44310` |

## Contract assertions

The valid request must be exactly:

```http
POST /v0.1/events
Accept: application/json
Content-Type: application/json

{
  "body": "<canonical JSON Event body>",
  "headers": {
    "WebMCP-Reentry-Key-Id": "<registered key id>",
    "WebMCP-Reentry-Timestamp": "<epoch seconds>",
    "WebMCP-Reentry-Signature": "<base64url Ed25519 signature>"
  }
}
```

The signature is verified over the exact UTF-8 bytes `<timestamp>.<body>`. The request has no
organization `Authorization` header, and the organization API key is absent from both headers and
body. The SDK's Core verifier checks the canonical Event fields and signature in the test.

The first acceptance must be exactly:

```json
{
  "type": "webmcp.continuation_acceptance",
  "protocol_version": "0.1",
  "event_id": "event_123",
  "correlation_id": "correlation_123",
  "accepted": true,
  "duplicate": false,
  "status": "accepted"
}
```

The duplicate uses the same shape and identifiers with only `duplicate: true`. Neither response
contains `claimed`, `delivery_id`, `lease_token`, `effect_token`, `acknowledged`, or any other
claim/acknowledgement signal. `202` means accepted and queued only.

## Harness and assumptions

The opt-in test source is
[`runtime/host-sdk/test/cloud-receiver-v2.event.contract.mjs`](../../runtime/host-sdk/test/cloud-receiver-v2.event.contract.mjs).
It:

- creates unique Host key, organization, account, Connector, consent, Grant, and binding fixtures
  through the actual Feature 2 flow;
- leaves the Connector process stopped so acceptance cannot depend on Connector liveness;
- uses the existing SDK `createEvent()`/`sendEvent()` path and the Core verifier;
- mutates only captured Event request bodies for negative cases, preserving the production SDK;
- checks the approved Grant's effective status and `runs_remaining` after each rejection and after
  exact duplicate replay; and
- cleans only its own fixtures from the disposable database.

Expiry is arranged by moving the test Grant's `expiresAt` into the past; revocation uses the
configured internal Feature 2 authority. No public Grant route is added or assumed.

The exact error code/status pairs are aligned with the existing Core contract and are intentionally
strict. If Feature 3 returns a different stable code, record the exact mismatch and leave TASK-018
open; do not accept a fallback or coerce the response.

## Red evidence — 2026-09-02

- Source syntax passed with `node --check`.
- The default opt-out command skipped all seven cases as designed.
- The opt-in red run used Node `v26.8.1`, a fresh disposable PostgreSQL `14.18` database, and the
  clean Receiver commit `f67e741dd0392dd04f14d7d02764b7c0a7179dc5`, whose local `HEAD` matched
  `origin/main` at the time. The current Feature 2 schema has no `/v0.1/events` route.
- All seven cases were blocked: valid and duplicate cases received `404 http_route_not_found`; each
  negative case received that same route error instead of its expected bounded Event/Grant error.
- This red baseline remains historical evidence only; the green exact-commit result is recorded below.

## Green evidence and closure

Verify the Cloud checkout before execution:

```sh
git -C saas-boilerplate rev-parse HEAD
git -C saas-boilerplate rev-parse origin/main
```

Both values resolved to the supplied SHA before execution:
`b851c320fae0505e3cf098f979d149e04ab44310`. The checkout was clean, and its four migrations were
applied to a new disposable PostgreSQL `14.18` database. The opt-in suite ran with Node `v26.8.1`
and the Connector process stopped.

- `SDK-V2-EVENT-001` through `SDK-V2-EVENT-007`: `7/7` passed, `0` failed.
- The normal SDK syntax check passed, and `npm test` passed `18/18`, `0` failed.
- The suite confirmed the canonical signed envelope, no organization API key on `/v0.1/events`,
  the exact `202` acceptance, exact duplicate response without another run, and bounded
  signature/Grant/origin/Event errors without mutation.
- The `202` response contained no claim, lease, effect, or acknowledgement field; it was treated as
  continuation acceptance/queueing only.
- A first run on this SHA exposed two test-fixture defects: the valid fixture used a canonical URL
  different from the Grant, and the invalid-sequence fixture attempted the Core constructor that
  correctly rejects sequence `2` before transport. Those test-only fixtures were corrected; the clean
  rerun above passed without changing SDK production code.

This record and TASK-018 are closed for the Feature 3 Event boundary. Delivery Claim, Agent
activation, and Acknowledgement remain separate gates.

No polling, fallback route, alternate transport, or production SDK change is part of this record.
