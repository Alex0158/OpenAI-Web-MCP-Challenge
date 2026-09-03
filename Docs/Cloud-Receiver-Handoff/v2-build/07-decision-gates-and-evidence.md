# v2 Decision Gates and Evidence Record

This file keeps unresolved API choices visible while allowing the closed feature work to begin.
It is not permission to invent a new protocol contract.

## Decision gates

| Gate | Current agreement | Still required before that feature closes |
|---|---|---|
| Grant revocation route | Receiver owns irreversible revocation; Host backend authenticates it. | Exact public route, request body, response, and versioned status/error contract. Internal authority tests may start first. |
| Host-subject rebind/decommission | Moving a subject requires an explicit operation and must not happen through approval replay. | Exact route, authentication, whether old Grants remain valid, and how existing deliveries are handled. |
| Effect authority | Host/trusted service issues opaque token; Receiver verifies exact delivery context. | Production adapter ownership and invocation contract. Test authority may be injected for ACK cases. |
| Effective status surface | Persist decision `status`; derive `effective_status`. | Confirm the exact v2 read surface and response shape that exposes `effective_status`. |
| v2 implementation surface | v1 is retired; v2 must be a new bounded implementation. | Record the actual v2 package path, task owner, test command, and deployment profile before the first red run. |

Do not hide an open gate behind a guessed route, fallback transport, or compatibility alias. Mark the
feature `blocked-at-decision-gate` if its exact public contract is required and not yet accepted.

## Evidence record template

Copy one block per test ID. Keep secrets and raw identifiers out of the record.

```text
feature:
test_id:
runner:
commit:
runtime:
database:
authority_fixture:
red_result:
green_result:
refactor_result:
durable_state_assertion:
status: passed | blocked | failed
notes:
```

## Feature handoff checklist

- [ ] Red tests fail for the intended missing behavior, not because the harness is broken.
- [ ] Green implementation is the smallest code and schema change that satisfies the contract.
- [ ] Durable state is inspected for transactions, replay, scope, and history retention.
- [ ] Refactor preserves every previous test and the Local Connector wire contract.
- [ ] Secrets are absent from logs, test output, fixtures, and evidence.
- [ ] The feature's exit condition is recorded before the next feature begins.
- [ ] Any unresolved public API decision is linked to this file and not silently implemented.

## Final acceptance

The replacement is ready for a complete review only when these conditions all hold:

```text
pair
-> safely replay pairing
-> approve one fixed target
-> sign and accept Event
-> claim lease
-> reject stale/wrong claims
-> verify Host effect
-> acknowledge
-> replay acknowledgement
```

All `PAIR`, `CONSENT`, `TARGET`, `REVOKE`, `EVENT`, `CLAIM`, `ACK`, and `HTTP` IDs must pass against
the Cloud Receiver v2 service. No test may depend on the retired v1 runtime.

