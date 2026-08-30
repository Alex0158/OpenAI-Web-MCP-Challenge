# WebMCP Re-entry Workflow — Trust, Security, and Reliability

**Role:** CANONICAL authority, security, and failure semantics  
**Status:** Target domain-neutral trust and reliability baseline; bounded P0/H1/H2 evidence exists, while production reliability remains unverified.  
**Last updated:** 2026-08-31

## 1. Security objective

Permit one website-originated business event to create one bounded authenticated pending
delivery for a user-approved Agent workflow, while keeping Agent activation, page authority,
platform credentials, cross-workflow access, and the selected application's human decision
boundary separate.

## 2. Protected assets

- Agent platform credentials and managed context identifiers;
- host application session and user identity;
- domain records, artifacts, decisions, and sensitive content;
- Continuation Grants and revocation state;
- workflow IDs, event integrity, state versions, and artifact revisions;
- human approval decisions and receipts;
- Receiver availability, signing material, and audit records.

The selected application must add domain-specific assets, consequences, and regulatory
constraints before implementation.

## 3. Authority model

Authority is conjunctive. A run is valid only when every condition remains true:

~~~text
trusted issuer origin
+ valid event signature and time window
+ active workflow-scoped grant
+ allowlisted event type
+ unused event ID and valid event sequence
+ unexpired run budget
+ matching canonical origin and workflow
+ authenticated user with current host-app authorization
+ current business state permits the requested operation
+ expected artifact revision still matches
~~~

Failure of any condition stops before mutation.

## 4. Grant rules

Every Continuation Grant binds:

- user or organization subject;
- issuer origin;
- workflow type and workflow ID;
- canonical URL or URL pattern;
- explicit event type;
- human decision boundary;
- issue and expiry times;
- maximum total and concurrent runs;
- revocation and current status;
- opaque host-facing binding;
- separately stored managed Agent-context binding.

The permission surface is controlled by the Receiver or Agent host, not solely by page
content. Website wording is untrusted input and may not hide scope or consequence.

## 5. Re-entry offer and key trust

The Receiver accepts a Re-entry Manifest only when:

- the current page origin matches the declared issuer origin;
- the manifest is signed by a key trusted for that origin;
- the key identifier resolves through an allowlisted or verified origin-owned source;
- the manifest is inside its validity window;
- the workflow and canonical URL match the current page;
- requested event, limits, and boundary fit Receiver policy.

The MVP may pin one issuer key. A production design needs rotation, revocation, key overlap,
ownership verification, and compromise recovery.

### 5.1 Trusted Continuation Receipt

A Trusted Continuation Receipt:

- is generated only by the Receiver after Manifest validation and an authenticated
  Receiver-owned human consent action;
- is derived only from normalized allowlisted Grant fields and typed continuation intent;
- is persisted through a Receiver- or Agent-host-controlled adapter, never authored by the
  page, event payload, or Agent;
- is bound to the exact Grant, origin, workflow, canonical URL, authorized event type,
  expiry, and human boundary;
- contains no arbitrary prompt, business-state assertion, raw managed-context identifier,
  platform credential, or full domain artifact; and
- fails closed when missing, altered, expired, revoked, ambiguous, or inconsistent with the
  accepted delivery.

The receipt is trusted only as Receiver-authored continuation context. It is enrollment
output, not the future business event, and it does not independently authorize activation or
mutation. The future event must still be authenticated and deduplicated, the Grant must still
be live, the selected adapter must still obtain an eligible runtime, and the Host page must
still revalidate current identity, state, and revision.

## 6. Event authentication contract

The signature is detached from the JSON body. The provisional mechanism-level headers are:

- WebMCP-Reentry-Key-Id: issuer key identifier;
- WebMCP-Reentry-Timestamp: signed delivery timestamp;
- WebMCP-Reentry-Signature: signature or MAC over timestamp + "." + exact raw request body.

These are target header names, not the frozen P0 wire contract. P0 uses
`X-Event-Timestamp` and `X-Event-Signature` with one pinned HMAC secret and no key-ID
header.

Verification requires bounded clock skew, exact raw bytes until validation completes, and
constant-time comparison when a MAC is used.

For a single-host MVP, HMAC-SHA-256 with a securely provisioned shared secret is acceptable.
A multi-host design should prefer asymmetric signatures so verification does not require
sharing an issuer's signing secret.

Do not place a signature inside the body and ambiguously claim to sign the entire body.

## 7. Replay, ordering, and idempotency

- event_id is globally unique and has a Gateway uniqueness constraint.
- event_sequence is monotonic within a workflow event stream and is distinct from state_version.
- Different legitimate events may share one business state version.
- The Receiver atomically reserves a run before acknowledging delivery.
- Mutation tools require an idempotency key and expected artifact revision.
- A duplicate event returns its prior outcome and never starts a second run.
- Out-of-order events are rejected or parked for explicit reconciliation.

## 8. Human decision boundary

The selected application must name one consequential outcome the Agent cannot cross.
Examples include submission, publication, payment, legal commitment, irreversible change,
or approval of another person's work.

The Agent may inspect state and prepare bounded work. The mechanism never delegates:

- extension of grant scope or expiry;
- revocation reversal;
- identity recovery or MFA bypass;
- a domain consequence that has not been explicitly designed, reviewed, and approved.

The human interface shows the proposal, source state, material changes, and consequence.
The human decision produces a receipt correlated with the run and artifact.

## 9. Threat and control matrix

| Threat | Required control | Safe failure |
|---|---|---|
| Malicious page requests broad authority | Receiver-owned permission UI, origin binding, minimum defaults | No grant |
| Event injects arbitrary instructions | Typed schema, bounded data, no prompt field | Reject event |
| Forged event | Detached signature, trusted key, timestamp check | Reject and audit |
| Replay or duplicate delivery | Unique event ID, sequence, atomic run reservation | Return prior outcome |
| Host learns Agent credentials | Opaque binding and Receiver-only context store | Revoke binding safely |
| Wrong user, tenant, or workflow resumes | Subject, origin, workflow, URL, and auth binding | Terminal run failure |
| Stale event causes action | Canonical state read and expected version check | No mutation |
| Tool metadata or output injects instructions | Treat definitions and results as untrusted; narrow schemas | Stop or request review |
| Page or event forges a continuation plan | Receiver-generated typed receipt, allowlisted fields, trusted persistence path, and live Grant/event match | No activation or mutation |
| Tool registration changes unexpectedly | Verify origin, stage, tool roles, names, and schemas | Fail closed |
| Login expires or MFA appears | User-mediated recovery only | Pause without bypass |
| Human and Agent edit concurrently | Optimistic revision check and visible conflict | Preserve both versions |
| Revocation races with delivery | Atomic grant status and run reservation rule | Deterministic visible outcome |
| Receiver unavailable before durable commit | Host outbox retries; Receiver acknowledges only after durable commit; expiry and dead letter are target controls | No false acknowledgement, silent loss, or action |
| Run loops or spends unexpectedly | One event, one reserved run, timeout, action budget | Cancel and explain |
| Sensitive data leaks into event or logs | Field allowlist, data minimization, redaction | Reject disallowed data |

## 10. Reliability model

**TARGET:** Delivery is durable at least once, and Host effects converge idempotently to one
result through state validation. The project does not claim distributed exactly-once
delivery.

Target observable records remain separate:

- event accepted, rejected, or expired;
- delivery pending, leased, retryable, acknowledged, or dead-lettered;
- wake attempt queued, dispatched, failed, or coalesced;
- Host effect not applied or applied;
- run resuming, opening page, verifying, continuing, awaiting human, completed, or failed;
- grant active, expired, revoked, or exhausted;
- artifact current, conflicted, approved, rejected, or committed.

Every transition records actor, time, correlation ID, reason, and previous state.

### Current additive evidence boundary

The clean historical P0 run proves one authenticated happy-path dispatch and duplicate
suppression: one event produced one run and exact replay produced no second run or artifact
write. It does not prove the target reliability model above.

In particular:

- the fixture consumes the event and run budget before adapter dispatch and has no
  crash-recovery retry for a failed dispatch;
- the frozen P0 path persists the Grant as `ACTIVATING` before the enrollment follow-up and
  has no crash-recovery contract for that dual-write sequence; the later H2 spike tests a
  separate additive durable-enrollment design rather than silently changing P0; and
- a first independent rehearsal failed after run reservation because the relay forwarded a
  `read_thread` result larger than its 64 KiB client limit. The corrected trusted relay now
  validates the single observed `thread.id` contract, returns only a compact identity proof,
  forwards no task content, and fails closed on malformed, mismatched, conflicting, or
  multiple identity payloads. A post-fix rehearsal completed successfully without raising
  the client limit; and
- the current Desktop relay is an undocumented same-user local bridge without a supported
  production lifecycle contract.

H1 adds one durable `PENDING` delivery across a Receiver restart and one effect-backed
acknowledgement-loss retry. It does not implement a delivery claim lease or visibility
timeout.

H2 adds a crash-recoverable enrollment outbox with stable dispatch identity, leases, and an
idempotent synthetic SQLite destination. It does not prove delivery to a real Desktop task,
hosted Agent, or production connector, and its one-shot worker is not a supervised daemon.

D4 remains `INCONCLUSIVE` and supplies no Desktop restart continuity evidence. Therefore,
current evidence supports bounded additive mechanism and service-contract claims, not a
general claim of production-safe enrollment, durable external Agent delivery, supported
wake, or distributed exactly-once effects.

The standalone App Server is also not a current Desktop wake path: the cold thread's Browser
selector returned `iab-unavailable` before page access, without identifying the absent
precondition, while exact warm resume returned an active-writer rejection for the supplied
task. The warm public JSON does not independently prove writer ownership or the primed Browser
state. Neither failure is repaired
by weakening the Browser requirement or substituting another execution surface.

## 11. Transactional delivery

The host business transition and outbox record commit atomically. An outbox relay retries
delivery. Gateway acceptance and replay state commit atomically. Receiver run reservation
and grant run count commit atomically.

The MVP should prefer one durable datastore and an outbox worker. A separate broker is
justified only when the selected runtime makes it necessary.

## 12. Data minimization and retention

### Event data

Include workflow identifiers, event type, versions, canonical URL, time, and the minimum
event-specific identifier. Do not include the full domain artifact by default.

### Audit data

Store hashes or bounded summaries when full payload retention is unnecessary. Redact
credentials, session data, secrets, and unrelated content.

### Retention

The MVP must provide a deterministic reset and deletion path for synthetic data. Production
retention, legal hold, subject access, and organization policy remain unresolved until the
domain is selected.

## 13. Domain security overlay

Before the demo app becomes implementation-ready, add:

- named protected data and worst credible consequence;
- user roles and decision rights;
- tenant or workspace boundary;
- domain authorization checks for every tool role;
- prohibited Agent actions;
- required human decision evidence;
- domain-specific retention and privacy constraints;
- abuse cases unique to the selected event and artifact.

The generic mechanism controls do not replace this domain review.

## 14. MVP control baseline

Before public demonstration, the MVP must have:

- one pinned issuer origin and key;
- one event type with a strict schema;
- detached event signature verification;
- unique event IDs and workflow event sequence;
- transactional outbox or equivalent durable state;
- opaque Agent binding;
- grant expiry, revocation, and one-run limit;
- current state and artifact revision checks;
- visible human decision boundary;
- redacted correlated logs;
- duplicate, invalid-signature, wrong-workflow, expired-grant, stale-state, and conflict tests.

## 15. Production controls deliberately deferred

- multi-tenant enterprise administration and role federation;
- general issuer onboarding and public key infrastructure;
- cross-device Receiver migration and disaster recovery;
- domain regulatory programs;
- broad event taxonomies and policy engines;
- formal protocol standardization;
- security certification and penetration testing.

Deferred means outside the challenge proof, not solved.
