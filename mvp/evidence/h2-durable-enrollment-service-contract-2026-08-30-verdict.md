# H2 Durable Enrollment Service-Contract Verdict

Date: 2026-08-30  
Claim: `H2_SERVICE_CONTRACT_PASS`  
Verdict: **PASS — local synthetic service contract only**

## Decision

The opt-in H2 implementation passes the bounded service contract for crash-safe enrollment,
sealed receipt delivery, idempotent activation, authority fencing, and redacted public
surfaces. The focused H2 suite passed 30 of 30 tests, and the complete MVP suite passed 88 of
88 tests, with no failures, skips, or todos.

This result closes the local service-contract part of the enrollment crash gap. It does not
prove that Codex Desktop or a hosted continuation service accepts durable enrollment, and it
does not establish a production deployment architecture.

## Verified gates

- **Atomic approval:** one transaction commits the Challenge transition, Grant, Inbox
  authority, sealed receipt outbox row, and stable dispatch identity. Duplicate approval
  converges on the same enrollment.
- **Crash before approval commit:** a real child-process `SIGKILL` after all writes but before
  commit produces no partial enrollment after reopen.
- **Crash after approval commit:** a real child-process `SIGKILL` before the response preserves
  exactly one retry-safe enrollment.
- **Crash after destination commit:** a real child-process `SIGKILL` before Receiver
  acknowledgement produces one idempotent redelivery and no second destination receipt.
- **Crash after Receiver delivery commit:** a real child-process `SIGKILL` before response
  preserves `DELIVERED` and causes no redispatch.
- **Concurrent approval and dispatch:** two independent approval processes converge on one
  Grant and one outbox record; concurrent dispatch attempts converge on one destination
  receipt and one completion.
- **Lease ownership:** token-bound compare-and-swap transitions prevent a stale worker from
  overwriting a newer delivery, while an abandoned lease can be reclaimed without duplication.
- **Authority fence:** revocation is revalidated immediately before sink dispatch. Revocation
  before claim or between lease validation and the dispatch fence reaches no destination.
- **Activation order:** Grant and Inbox authority remain non-active until receipt acknowledgement
  and exact Host binding are both present. No event run can begin earlier.
- **Receipt integrity:** authenticated encryption and exact schema, context, intent, expiry, and
  binding checks fail closed on tampering, wrong keys, unexpected fields, context mutation,
  intent mismatch, expiry, or destination conflict.
- **Binding semantics:** an exact retry stays idempotent after workflow advance; a different
  binding remains stage-gated, and an expired retry is rejected.
- **Bounded worker:** a separate Node process can execute one pending delivery through the H2
  one-shot entrypoint and its explicitly selected trace path.
- **Secret exclusion:** automated checks cover the Receiver database and sidecars, trace,
  consent status, and workflow status. Raw capability material, key representations, the full
  canonical receipt, opaque binding, and managed context do not appear on those surfaces.

## Verification record

```text
node --test test/h2-durable-enrollment.test.mjs test/h2-process-evidence.test.mjs
30 passed, 0 failed, 0 skipped, 0 todo

npm test
88 passed, 0 failed, 0 skipped, 0 todo
```

The test contract uses isolated Receiver and synthetic durable-destination SQLite stores. The
worker process and crash probes are real independent Node processes; the destination remains a
test adapter rather than a real Desktop or hosted continuation endpoint.

## Reliability and security interpretation

H2 uses a transactional outbox on the Receiver side and stable idempotency at the synthetic
destination. Its honest semantic claim is **at-least-once dispatch plus destination
idempotency**, not distributed exactly-once delivery. This follows the duplicate-delivery
boundary described by the [AWS transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).

The sealed receipt uses authenticated encryption and explicit context binding. The
[OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
supports the authenticated-encryption direction but also makes clear why production key
management remains separate work. The crash tests exercise SQLite's documented
[atomic-commit model](https://www.sqlite.org/atomiccommit.html) through independent processes
and signals provided by Node's [child-process API](https://nodejs.org/api/child_process.html).

## Explicit nonclaims

- The destination is a synthetic isolated SQLite adapter, not a real Codex Desktop task or
  hosted continuation service.
- No real Desktop or hosted delivery is proven.
- The one-shot worker is not a production daemon, supervisor, scheduler, or operational retry
  service.
- No production KMS, key rotation, re-encryption, multi-tenant isolation, remote topology,
  cross-origin trust, production authentication, or Internet ingress is proven.
- No product demand, product value, user willingness to grant authority, or advantage over
  deterministic Host automation is proven.
- The result is not distributed exactly-once delivery.

## Redaction boundary

This package contains no raw run identifiers, Inbox capabilities, Desktop task identifiers,
cryptographic keys, opaque bindings, or managed-context values. The machine-readable record is
[`h2-durable-enrollment-service-contract-2026-08-30.json`](h2-durable-enrollment-service-contract-2026-08-30.json).
