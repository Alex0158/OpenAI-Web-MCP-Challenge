# TenderRelay Trust, Security, and Reliability

**Role:** CANONICAL authority, security, and failure semantics  
**Status:** MVP control baseline  
**Last updated:** 2026-08-30

## 1. Security objective

Permit one website-originated business event to resume one user-approved Agent workflow
without giving the website arbitrary prompting authority, platform credentials, cross-workflow
access, or permission to perform the final tender submission.

## 2. Assets to protect

- Agent platform credentials and managed context identifiers;
- portal session and bidder identity;
- confidential tender documents, drafts, pricing, and declarations;
- Continuation Grants and revocation state;
- workflow IDs, event integrity, and business state versions;
- human approval decisions and audit records;
- Receiver availability and local or hosted secret material.

## 3. Authority model

Authority is conjunctive. A run is valid only when all of these remain true:

```text
trusted issuer origin
+ valid event signature and time window
+ active workflow-scoped grant
+ allowlisted event type
+ unused event ID and valid event sequence
+ unexpired run budget
+ matching canonical origin and workflow
+ authenticated portal user with current authorization
+ current business state permits the requested draft operation
```

Failure of any condition stops the run before mutation.

## 4. Grant rules

Every Continuation Grant must bind:

- user or organization subject;
- issuer origin;
- workflow type and workflow ID;
- canonical URL or URL template;
- explicit event types;
- approval boundary;
- issue and expiry times;
- maximum total and concurrent runs;
- revocation and current status;
- an opaque portal-facing binding;
- a separately stored Agent-context binding.

The permission surface must be controlled by the Receiver or Agent host, not solely by page
content. Website wording is untrusted input and may not obscure scope or consequence.

## 5. Manifest and key trust

The Receiver accepts a Re-entry Manifest only when:

- the current page origin matches the declared issuer origin;
- the manifest is signed by a key trusted for that origin;
- the key ID resolves through an allowlisted or verified origin-owned key document;
- the manifest is within its validity window;
- the workflow and canonical URL are consistent with the current page;
- requested events and limits fit Receiver policy.

The MVP may pin one issuer key. A production design requires rotation, revocation, key
overlap, compromise recovery, and ownership verification.

## 6. Event authentication contract

The event signature must be detached from the JSON body. The MVP contract is:

- `TenderRelay-Key-Id`: issuer key identifier;
- `TenderRelay-Timestamp`: signed delivery timestamp;
- `TenderRelay-Signature`: signature or MAC over
  `timestamp + "." + exact_raw_request_body`;
- bounded clock skew;
- exact raw bytes retained until verification completes;
- constant-time comparison where a MAC is used.

For a single-portal MVP, HMAC-SHA-256 with a securely provisioned shared secret is
acceptable. A multi-portal protocol should prefer asymmetric signatures so verification
does not require sharing an issuer's signing secret.

Do not place a signature inside the body and then ambiguously claim to sign the entire body.

## 7. Replay, ordering, and idempotency

- `event_id` is globally unique and has a uniqueness constraint at the Gateway.
- `event_sequence` is monotonic within a workflow-event stream and is distinct from business `state_version`.
- Two legitimate event types may refer to the same state version; state version alone must not deduplicate them.
- The Receiver atomically reserves a run before acknowledging delivery.
- Draft tools require an idempotency key and expected artifact revision.
- A duplicate event returns the prior acceptance outcome and never starts a second run.
- Out-of-order events are rejected or parked for explicit reconciliation; they are not silently reordered by the Agent.

## 8. Human approval boundary

The Agent may inspect state and prepare drafts. The MVP does not delegate:

- final bid or clarification submission;
- pricing or commercial commitment;
- legal declarations or attestations;
- extension of grant scope or expiry;
- revocation reversal;
- identity recovery or MFA bypass.

The human UI must show the proposed content, current source revision, material changes, and
the exact consequence of approval. Approval produces a receipt linked to the run and draft.

## 9. Threat and control matrix

| Threat | Required control | Safe failure |
|---|---|---|
| Malicious page requests broad authority | Receiver-owned permission UI, origin binding, minimum defaults | No grant created |
| Arbitrary prompt injection through event | Typed event schema, bounded data, no instruction field | Event rejected |
| Forged event | Detached signature, trusted key, timestamp validation | Event rejected and audited |
| Replay or duplicate delivery | Unique event ID, sequence check, atomic run reservation | Return prior outcome |
| Portal learns Agent credentials | Opaque binding; Receiver-only context store | Binding can be revoked without credential exposure |
| Wrong tenant or workflow resumes | Subject, tenant, origin, workflow, and URL binding | Terminal run failure |
| Stale event causes action | Canonical state read and expected version check | No mutation |
| Tool metadata or result injects instructions | Treat definitions/results as untrusted; narrow schemas and outputs | Agent stops or requests review |
| Registration race or third-party script changes tools | Verify expected origin, stage, names, and schemas; observe registrations | Fail closed on unexpected surface |
| Expired login or MFA challenge | User-mediated recovery only | Run pauses without bypass |
| Human and Agent edit concurrently | Optimistic revision check and visible conflict resolution | Preserve both revisions |
| Revocation races with delivery | Atomic grant status and run reservation rule | Revocation wins unless run was already visibly reserved |
| Receiver offline | Durable queue, retry budget, expiry, dead letter | No lost silent action |
| Run loops or spends unexpectedly | One event, one reserved run, timeout and action budget | Cancel and show reason |
| Confidential data leaks into event/logs | Identifier-only events, field allowlist, log redaction | Reject oversized or disallowed fields |

## 10. Reliability model

Delivery is at least once; effects are exactly once from the user's perspective through
idempotency and state validation.

Required states are observable rather than inferred:

- event created, dispatched, accepted, rejected, or dead-lettered;
- run queued, resuming, opening page, verifying, awaiting human, completed, or failed;
- grant active, expired, revoked, or exhausted;
- draft current, conflicted, approved, rejected, or submitted.

Every state transition records actor, timestamp, correlation ID, reason, and previous state.

## 11. Transactional delivery

The tender business transition and its outbox record commit atomically. An outbox relay
retries delivery. Gateway acceptance and replay state commit atomically. Receiver run
reservation and grant run count commit atomically.

The MVP should prefer one durable datastore and an outbox worker. Introducing Redis or a
separate message broker is justified only if the selected runtime requires it.

## 12. Data minimization and retention

### Event payload

Include workflow identifiers, event type, versions, canonical URL, timestamps, and the
minimum event-specific identifier. Do not include full tender documents or response drafts.

### Audit

Store hashes or bounded summaries where full payload retention is unnecessary. Redact
credentials, session data, secrets, and unnecessary document content.

### Retention

The MVP must define a demonstrable deletion/reset path for synthetic data. Production
retention, legal hold, subject access, and organization policy are deferred but explicitly
unresolved.

## 13. MVP control baseline

Before public demonstration, the MVP must have:

- one pinned issuer origin and key;
- one event type and strict JSON schema;
- detached event signature verification;
- unique event IDs and workflow event sequence;
- transactional outbox or equivalent durable state;
- opaque Agent binding;
- grant expiry, revocation, and one-run limit;
- expected state and artifact revision checks;
- visible human approval;
- redacted correlated logs;
- duplicate, invalid-signature, wrong-workflow, expired-grant, and stale-state tests.

## 14. Production controls deliberately deferred

- multi-tenant enterprise administration and role federation;
- general issuer onboarding and public key infrastructure;
- cross-device Receiver migration and disaster recovery;
- regulatory data residency and legal hold programs;
- broad event taxonomies and policy engines;
- security certification, penetration testing, and formal protocol standardization.

Deferred does not mean unnecessary. These items are outside the challenge proof, not solved.
