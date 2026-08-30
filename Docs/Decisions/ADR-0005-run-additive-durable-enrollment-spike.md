# ADR-0005: Run an Additive Crash-Recoverable Enrollment Spike

**Status:** Accepted  
**Evidence status:** Passed at the bounded service-contract level  
**Decision date:** 2026-08-30  
**Decision owners:** Alex and project team  
**Scope:** Pre-app-selection enrollment durability validation

## Context

The bounded H1 experiment proved one event-gated Scheduled Task continuation, Receiver
restart after event acceptance, acknowledgement-loss retry, and one idempotent Host effect.
It did not prove that enrollment survives a crash or lost response.

The current heartbeat enrollment path has a concrete dual-write gap:

1. Receiver approval persists and activates a Grant through the existing continuation
   adapter.
2. The HTTP handler then creates the heartbeat Inbox in a separate operation.
3. The Inbox stores only a digest of its bearer handle, while the raw Inbox URL is returned
   once in the approval response.

A crash between the two operations can leave an active Grant without an Inbox. A crash or
lost response after Inbox creation can leave a committed Inbox whose bearer capability
cannot be recovered or safely redispatched. The current Desktop receipt adapter also lacks
a stable destination-side dispatch idempotency contract.

This is a mechanism-level reliability question. It does not depend on the final application,
business event, customer, or deployment topology.

## Decision

1. Add a separate **H2 durable-enrollment spike** to test the service contract. Do not
   retrofit or silently alter the frozen P0 or bounded H1 paths.
2. In H2 mode, one human approval transaction must atomically persist the decided challenge,
   Grant, Inbox, and one receipt-outbox row. It must perform no external dispatch.
3. Keep the Grant and Inbox non-active until both conditions hold:
   - the enrollment receipt has a durable destination acknowledgement; and
   - the exact Host binding has been acknowledged through the genuine binding contract.
4. Use an at-least-once outbox worker with a stable `dispatch_id`, bounded leases, and an
   idempotent destination. The same dispatch ID and receipt digest must produce one
   destination-visible receipt; the same dispatch ID with another digest is a conflict.
5. Seal the recoverable receipt with authenticated encryption under a dedicated H2 key.
   Bind the schema version, dispatch ID, Grant ID, and Inbox ID as authenticated associated
   data. Purge ciphertext after durable destination acknowledgement and retain only bounded
   audit metadata and digests.
6. Use an isolated durable synthetic destination for the spike. It must have a separate
   SQLite store and must support injected acknowledgement loss after its own commit. An
   in-memory fake or a write inside the Receiver transaction is insufficient evidence.
7. Keep events fail-closed until enrollment is active. Early events and wrong binding,
   origin, workflow, context, expiry, key, ciphertext, or digest must create no run or
   authority.
8. Preserve all existing P0 and H1 behavior when H2 mode is disabled, and rerun the full
   baseline suite after the spike.

This follows the transactional-outbox boundary: commit local state and an outbox record in
one transaction, accept possible duplicate delivery, and make the destination idempotent.
See [AWS Prescriptive Guidance: Transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).
The sealed-receipt design follows the minimum-storage, authenticated-encryption, and
key/data-separation principles in the
[OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html).

## Required evidence gates

The spike passes only if it proves all of the following with isolated test data:

- a crash before approval commit leaves no Grant, Inbox, or outbox row;
- a crash after approval commit but before response returns the same logical enrollment
  after restart;
- a pending or expired-lease outbox row is reclaimed with the same dispatch ID;
- destination commit followed by acknowledgement loss creates multiple attempts but one
  destination-visible receipt;
- a completed destination acknowledgement is not resent after restart;
- concurrent or duplicate approval creates one Grant, one Inbox, and one outbox row;
- no event is accepted before durable receipt delivery and exact binding acknowledgement;
- wrong or missing keys and tampered ciphertext fail closed;
- delivered ciphertext is purged;
- secret scans find no raw Inbox capability, sealing key, or plaintext full durable receipt
  in the Receiver database/WAL, trace, status responses, or public evidence; the existing
  opaque binding and managed-context mapping remain private Receiver authority state and
  must not appear in status responses, traces, or public evidence; and
- H2-disabled behavior and all existing P0/H1 tests remain unchanged.

Committed-crash cases should use process termination or an equivalent boundary that proves
restart recovery, not only an exception rolled back inside one process.

## Evidence result

The additive H2 spike passed these gates on 2026-08-30. The focused H2 suite passed 30 of
30 tests, and the full project suite passed 88 of 88 tests with H2 disabled by default for
the historical P0 and H1 paths. Process-level evidence uses real `SIGKILL` boundaries before
approval commit, after approval commit, after destination commit before acknowledgement,
and after Receiver delivery commit. Two independent approval processes also converge on one
logical enrollment and one duplicate result.

The implementation additionally proves lease-token compare-and-swap, a stable dispatch ID,
an idempotent separate SQLite destination, pre-dispatch authority fencing, exact receipt
schema and intent validation, authenticated-encryption failure closure, ciphertext purge,
and bounded status and trace redaction. See the
[H2 service-contract verdict](../../mvp/evidence/h2-durable-enrollment-service-contract-2026-08-30-verdict.md).

The runnable `npm run worker:h2:once` command is a bounded one-shot outbox worker for the
spike. It is not a continuously supervised production daemon.

## Consequences

### Positive

- The most concrete remaining enrollment failure is tested before it can be hidden by a
  larger distributed build.
- The result remains useful under scheduled pull, a paired local connector, or a hosted
  Agent runtime.
- A future real transport receives an explicit durable-acknowledgement and idempotency
  contract rather than inheriting fixture behavior by assumption.

### Costs and risks

- The spike adds a small state machine, worker, encryption boundary, and second test store.
- Passing with a synthetic destination does not prove that ChatGPT Desktop or any later
  connector implements the same destination contract.
- A local sealing key demonstrates fail-closed recovery mechanics, not production key
  management, rotation, backup, or multi-tenant isolation.
- The synthetic destination proves a durable idempotency contract, not delivery into a real
  Desktop task, hosted Agent, or production connector.
- The result proves at-least-once delivery plus destination idempotency, not distributed
  exactly-once execution.
- The synthetic destination must retain the delivered raw receipt because it represents the
  managed Agent context. That destination-side retention is in scope for idempotency, but
  production retention, access control, and deletion policy remain unproven.

## Non-goals

This decision does not select the final application, build a hosted broker, add a real
Desktop receipt worker, choose the production ingress topology, claim exactly-once Agent
wake, implement tenant administration, or reopen the frozen P0 evidence boundary.
