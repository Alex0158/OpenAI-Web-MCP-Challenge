# Re-entry Core — Trust, Security, and Reliability

**Role:** CANONICAL authority, security, and failure semantics  
**Status:** Target Re-entry Core trust and reliability baseline under ADR-0006 through ADR-0011; the v0.1 protocol, Host SDK, bounded Receiver C1 authority, Connector delivery C2, HTTP adapter, outbound Connector client, forced-restart test-process isolation, and deterministic Agent Adapter C4b are locally verified; mid-transaction crash injection, production process ownership, consent and pairing, private context binding, real Agent activation, real Host-effect verification, and distributed topology remain unverified.  
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
- paired Connector identity, device credentials, delivery leases, and acknowledgements;
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
+ eligible paired Connector and valid delivery lease
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
- separately stored Connector and managed Agent-context bindings.

The permission surface is controlled by the Cloud Receiver or Agent host, not solely by page
content. Website wording is untrusted input and may not hide scope or consequence.

ADR-0008 requires an opaque decision token verified through a trusted Receiver consent-authority
port. The Core accepts no `humanApproved` boolean, approval header, caller-selected subject, or
caller-selected delivery target. A production Cloud shell must still prove its authenticated
session and anti-CSRF implementation before this becomes runtime-verified consent.

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

The event signature is detached from the canonical JSON body. ADR-0007 fixes the v0.1 headers:

- WebMCP-Reentry-Key-Id: issuer key identifier;
- WebMCP-Reentry-Timestamp: signed delivery timestamp;
- WebMCP-Reentry-Signature: Ed25519 signature over timestamp + "." + the exact canonical body.

The Host signs with its Ed25519 private key. The Receiver resolves only an allowlisted public
key by issuer origin, key ID, and purpose; it cannot forge Host data. P0 historically uses
`X-Event-Timestamp` and `X-Event-Signature` with one pinned HMAC secret and no key-ID
header.

Verification requires bounded clock skew, canonical decimal epoch seconds, exact raw bytes
until validation completes, canonical unpadded base64url, and a key trusted for the resolved
Grant issuer. Key provisioning may pin one challenge issuer; general rotation and origin
ownership remain deferred.

The verification caller must supply the trusted origin anchor: the actual page origin for a
Manifest and the stored Grant issuer origin for an event. A declared origin plus a resolver hit
cannot establish authority by itself.

Do not place a signature inside the body and ambiguously claim to sign the entire body.

## 7. Replay, ordering, and idempotency

- event_id is globally unique and has a Cloud Receiver uniqueness constraint.
- event_sequence is monotonic within a workflow event stream and is distinct from state_version.
- Different legitimate events may share one business state version.
- The Receiver atomically reserves a run before acknowledging delivery.
- Mutation tools require an idempotency key and expected artifact revision.
- A duplicate event returns its prior outcome and never starts a second run.
- Out-of-order events are rejected or parked for explicit reconciliation.
- A Connector-generated 32-byte claim token makes exact lease-response replay idempotent while
  only its digest persists.
- One target has at most one unexpired lease; expired leases are reclaimed only below a bounded
  attempt count, and a replaced lease cannot acknowledge.
- Delivery acknowledgement requires a trusted exact Host-effect attestation. Connector or
  adapter progress is never sufficient authority.
- A final late acknowledgement may converge only when its effect occurred inside the final
  lease and Grant window and no newer lease replaced it.

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
| Unpaired Connector claims delivery | Paired-device identity, scoped authorization, short lease | Reject and audit |
| Connector replays or steals a lease | Authenticated target, one active digest-bound claim token, expiry, bounded attempts, and atomic fencing | Preserve pending, retryable, or explicitly exhausted delivery |
| Connector falsely reports completion | Trusted Host-effect attestation bound to delivery, event, workflow, and human boundary | Do not acknowledge |
| Connector exposes inbound device control | Outbound-only protocol and no public local listener | No activation surface |
| Adapter receives authority it does not need | Lease-derived typed activation omits Connector, lease, effect, and raw context credentials | Reject before dispatch |
| Adapter failure creates duplicate activation | One bounded invocation; timeout, exception, or malformed result becomes explicit unknown outcome | No automatic retry or acknowledgement |
| Adapter status is mistaken for a Host effect | ADR-0011 result is observation only; ADR-0009 effect authority remains exclusive | Keep delivery unacknowledged |
| HTTP input is oversized, ambiguous, redirected, or malformed | Exact routes and parsed fields, bounded UTF-8 JSON, no query or content encoding, response bounds, and redirect rejection | Reject without Core transition or fallback |
| Transport leaks credentials or internal failures | Tokens only in no-store request bodies, TLS except literal loopback, and code-only redacted errors | No token, payload, message, or stack disclosure |
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

The new Re-entry Core C1 independently verifies the ADR-0008 authority slice: a challenge alone
creates no Grant, trusted approval creates one private Grant and public binding, and one valid
event atomically commits its record, a private pending delivery, and run-budget consumption.
Exact replay, injected rollback, and file close-and-reopen persistence pass locally on Node 24
and Node 26.

Re-entry Core C2 independently verifies the ADR-0009 delivery slice in one process: an
authenticated target-scoped claim creates one short digest-bound lease, exact response replay
does not spend another attempt, expired workers are fenced, and only a trusted correlated Host-
effect attestation acknowledges. Attempt bounds persist with each delivery; schema migration,
rollback, token non-persistence, and file reopen pass locally. This does not prove production
consent or pairing, an HTTP boundary, a separate Connector process, a real Host effect, OS-crash
recovery, Agent activation, or distributed durability.

Re-entry Core C4 independently verifies the ADR-0011 Agent Adapter contract with a deterministic
no-platform adapter. One live lease derives one immutable activation without Connector, lease,
effect, or raw context credentials. Unsupported, rejected, timeout, exception, malformed-result,
and unknown-outcome paths return bounded observations and never retry or acknowledge. This does
not prove a private context binding, real Agent activation, Browser, WebMCP, or Host effect.

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
delivery. Cloud Receiver acceptance, replay state, pending delivery, Receiver run reservation,
and grant run count commit atomically. Connector lease claim and acknowledgement use separate
atomic transitions and never extend Host or Grant authority.

ADR-0008 makes the first half exact, and C1 verifies it locally: one authenticated event, one
event record, one private pending delivery, and the `1 -> 0` Grant run reservation commit together
before the Host receives acceptance. ADR-0009 and C2 verify separate atomic lease and effect-
acknowledgement transitions locally without claiming a network or process boundary.

The MVP should prefer one durable datastore and an outbox worker. A separate broker is
justified only when the selected runtime makes it necessary.

## 12. Data minimization and retention

### Event data

Version `0.1` includes only the opaque binding, correlation, issuer, workflow, event identity
and sequence, event type, state version, canonical URL, and time. It has no event-specific
payload. Do not include a prompt, goal, Site Tool list, full domain artifact, raw Agent context,
or Receiver Grant identity.

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
