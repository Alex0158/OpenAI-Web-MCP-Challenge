# Review 05 Adjudication and P1 Trust/Delivery Plan

**Role:** SUPPORTING architecture and security research  
**Status:** Active risk disposition; additive P1 plan, not a rewrite of P0 evidence  
**Observed:** 2026-08-30  
**Scope:** Independent adjudication of Research 05, current P0 correctness findings, and the
minimum trust/delivery seam required before a public production-style claim

## Executive judgment

[Research 05](05-distributed-topology-and-hard-coupling-risk-review.md) correctly identifies
the two largest unresolved production seams: remote-to-local delivery and supported
Receiver-to-Agent/Browser attachment. Its shared-database, delivery, authority, stale-tool,
and hardcoded-coupling findings are also directionally correct.

Two recommendations require revision:

1. Do not build the full three-process connector harness before the Agent transport topology
   is selected through the smaller heartbeat/public-runtime spikes in
   [Research 07](07-supported-reentry-transport-and-heartbeat-spike.md).
2. Do not reject a fresh page merely because its correlation ID differs from the Grant's
   correlation ID. Correlation is observability metadata, not identity or authorization.

The correct architecture is to preserve P0 as the verified composability baseline and add a
separate **P1 Trust/Delivery Seam Harness** once the transport topology is selected.

Since this review was first written, H0b has empirically passed on the current Desktop build:
a same-chat Scheduled Task recovered a sealed bounded receipt, opened a fresh built-in
Browser tab, rediscovered genuine Site Tools, and invoked the stored read-only action without
the private relay. This removes the current-build Browser-join uncertainty for H1. It does
not solve remote event ingestion, public platform support, Agent/app/device restart behavior,
or production delivery semantics.

The later bounded H1 run also passed. It proved a no-event stop, one authenticated durable
event across Receiver process restart, one genuine Host WebMCP effect, lost-acknowledgement
idempotency, exact event replay, and final completion through the genuine Inbox
acknowledgement tool. This narrows current-build R-02 and local effect-idempotency risk. It
does not resolve R-01 remote ingress, separate trust domains, public session/origin identity,
crash-safe enrollment, long-window platform durability, or production delivery operations.

## 1. Verified current findings

| Finding | Current evidence | Disposition |
|---|---|---|
| Private Desktop bridge is not a supported production contract | P0 evidence and official App Server/Browser boundaries | Remains an S0 production gap |
| Same-chat scheduled re-entry can regain Browser and genuine Site Tools | Sealed-context H0b plus event-gated H1 runtime evidence on Desktop `26.825.41651` build `7345` | Current-build mechanism passed; public contract and production reliability remain open |
| Local scheduled delivery can produce one idempotent Host effect | [H1 runtime verdict](../../mvp/evidence/h1-event-gated-scheduled-reentry-2026-08-30-verdict.md) | Passed for one local workflow across Receiver restart, acknowledgement loss, and exact replay; distributed transport remains open |
| Remote backend cannot directly reach loopback Receiver | Network topology | Select polling, outbound channel, hosted runtime, or paired connector |
| Stage-A tools remained registered after backend transition | Genuine current Desktop probe on an isolated local database | Fixed in P0 with registration `AbortSignal` reconciliation plus server fail-closed guards |
| Stale `get_reentry_offer` minted a READY-stage offer | Genuine Site Tool invocation before the fix | Fixed and regression-tested |
| Workflow transition and artifact writes were not consistently SQL CAS | Source audit | Fixed with conditional updates and race tests |
| A committed READY workflow still advertised `continue_artifact` | Source audit | Fixed so only the read-only context tool remains after commit |
| Human commit carries no expected reviewed revision | Source audit | In-method race guard exists; stale-review protection remains a P1 requirement |
| Temporal fields accepted malformed, coercible, or overlong values | Runtime/source test | Canonical timestamp and manifest-horizon guards fixed and regression-tested |
| Consent and commit rely on spoofable fixture headers | Current HTTP source | Remains a public-demo security gap |
| No durable Host outbox or Receiver dispatch queue | Current source | Remains a crash-recovery gap |
| Grant has no revoke/replace lifecycle | Current schema and routes | Remains a lifecycle gap |
| Public workflow response returns the full opaque binding | Current source | Must be removed from public/P1 response surfaces |
| Fixed development keys and broad local file modes exist | Current config and runtime artifacts | Acceptable only inside the controlled fixture |

The corrected P0 contract suite passed 37 tests before H1; the current combined P0 and H1
suite passes 59 tests. The lifecycle fix also passed a
[genuine same-document Browser test](../../mvp/evidence/site-tool-lifecycle-probe-2026-08-30.json):
after authoritative state changed from `INITIAL` to `READY`, the old Stage-A handle became
stale and the Browser exposed only `get_workflow_context` and `continue_artifact`.

## 2. Why correlation mismatch is not authorization failure

The current Stage-A flow intentionally allows a newly opened canonical page to receive an
opaque binding and then adopt the Grant's correlation for trace continuity. A fresh page has
a new page/session correlation by construction.

Rejecting that legitimate difference would:

- break new-page registration;
- promote a trace identifier into a bearer credential;
- fail to prove the user, browser session, workflow ownership, or origin; and
- contradict Research 05's own warning that correlation is not identity.

The correct P1 control is a short-lived, one-time **registration capability** bound to an
authenticated subject, workflow, canonical origin, Grant, expiry, and nonce. The Receiver
is its sole issuance and consumption authority. The Host records a pending binding attempt
and sends an idempotent acknowledgement; the Receiver consumes the capability and activates
the Grant in one Receiver-side transaction. Lost responses are retried with the same
attempt ID. No cross-store atomic transaction is assumed. Correlation IDs remain non-secret
diagnostic metadata.

## 3. Authority decomposition

P1 must distinguish two permissions:

- **Re-entry authority:** the Receiver Grant decides whether one Agent context may be
  awakened for one bounded event.
- **Action authority:** the Host session, subject, role, current state, page session, and
  artifact revision decide which page operation may execute.

A valid Grant does not authorize Host business effects. A valid Host session does not
authorize future Agent wake. Both checks are required for continuation.

The event remains a wake/gate signal. The canonical page remains business truth.

## 4. Human boundary claim correction

The current P0 proves that:

- no `commit_artifact` Site Tool was exposed; and
- the tested Agent stopped before the visible commit control.

It does not prove that an Agent is technically unable to click the UI or forge the fixture's
`X-Human-Action` header. Official Site Tool documentation explicitly notes that an Agent may
use ordinary browser capabilities when no suitable Site Tool exists.

Therefore, the public claim must remain behavioral until P1 adds authenticated human
authorization. Depending on the selected app's consequence, P1 may require a normal
authenticated session plus CSRF/Origin enforcement, a recent reauthentication, a passkey,
an OS-native approval, or another channel unavailable to the Agent.

## 5. Minimum P1 topology

The logical P1 minimum remains two stores and three roles, implemented only after the
transport decision:

~~~text
Host Web and Host Backend with Host DB
    -> transactional Host outbox
    -> signed typed event
Receiver with Grant, event, run, and delivery DB
    -> durable leased event ticket
Selected Agent transport/runtime
    -> exact managed context
    -> canonical page
    -> current Site Tools
~~~

For H1, the selected provisional transport is a same-chat scheduled pull from a narrow
Receiver Inbox page. The schedule is the wake; the accepted event is the authorization gate.
The Inbox must not carry Host business truth. Deployment may combine processes for this
bounded experiment only if Receiver and Host authority, durable state, and failure behavior
remain separately testable.

## 6. Minimum lifecycle

### Enrollment and binding

~~~text
PENDING_CONSENT
-> AWAITING_RECEIPT
-> AWAITING_HOST_BINDING
-> ACTIVE
-> EXHAUSTED | EXPIRED | REVOKED | FAILED
~~~

The Grant must not become ACTIVE merely because a follow-up message was dispatched. The
Receiver must atomically consume the one-time registration capability and activate the
Grant after an idempotent Host acknowledgement. A retry returns the prior activation result;
Host-side pending state alone carries no re-entry authority.

### Event and dispatch

Use these semantics:

- Host business transition and Host outbox row commit atomically;
- Receiver durably accepts one `event_id` and body hash before returning `202`;
- one logical run and one dispatch job exist per accepted event;
- transport is at least once;
- Agent wake may be duplicated after acknowledgement loss;
- Host mutations use one idempotency key, request hash, page session, and SQL CAS; and
- the visible effect is exactly once even if wake is not.

Do not claim platform-level exactly-once Agent resumption without a supported transport
contract that proves it.

## 7. Page and mutation contract

A fresh canonical page should expose or bind:

- authenticated subject and workflow ownership;
- current state and state version;
- current artifact revision;
- short-lived page-session nonce;
- tool-surface version or hash; and
- human-boundary status.

Every mutation should require normal Host authorization, a current page session, expected
state and artifact revisions, and an idempotency key/request hash. Reusing the same key with
the same payload returns the prior result; reusing it with a different payload is a conflict.

Registration `AbortSignal` is supported by the current Desktop Browser and should remove
state-inapplicable tools. Server-side validation remains mandatory because a stale document,
unsupported browser, registration race, or ordinary browser action can bypass the visual
inventory.

## 8. Exact P1 test gates

### Consent, binding, and revocation

- unauthenticated approval creates no Grant;
- missing or wrong CSRF/Origin proof creates no Grant;
- a spoofed human-action header creates no Grant;
- registration capability with wrong subject, workflow, origin, or expiry fails;
- duplicate binding returns the same result and creates no second authority;
- an event before binding acknowledgement creates no run;
- revoke before reserve creates no run;
- revoke after a completed effect preserves the audit receipt and does not pretend rollback.

### Outbox and recovery

- a Host transition cannot commit without its outbox row;
- Receiver downtime followed by restart eventually delivers the event;
- crash after Receiver commit but before response returns the same run on retry;
- expired worker lease retries dispatch;
- adapter-send acknowledgement loss may repeat wake but creates one Host effect;
- retry exhaustion becomes a visible dead-letter state.

### State, tools, and effect correctness

- two writers using one revision produce one success and one conflict;
- a stale Stage-A document cannot issue an offer, bind, or prepare after transition;
- a fresh Stage-B document exposes only current tools;
- incompatible tool-surface version pauses continuation;
- repeated mutation idempotency key produces one effect; and
- human commit against a stale reviewed revision conflicts.

### Privacy and deployment

- public responses and evidence contain no managed context, raw binding, bearer, raw event
  body, task ID, local path, or secret;
- runtime directories and databases are private to the service user;
- public mode refuses fixed fixture keys and omits all test routes; and
- public errors use bounded codes rather than adapter or local-runtime content.

## 9. What can be done before app selection

App-independent work:

- strict versioned manifest and event validation;
- state-derived tool lifecycle and server-side fail-closed checks;
- SQL CAS and effect idempotency;
- Host outbox and Receiver dispatch state machines;
- Grant revocation and replacement mechanics;
- public/private evidence separation and redaction scanning; and
- the supported transport kill tests in Research 07.

Work that must wait for the selected app:

- real subject and organization model;
- roles and tenant boundaries;
- consequence-specific human approval;
- data retention, privacy, and regulatory overlays;
- exact event authority and domain reconciliation; and
- economic retry/latency targets.

## 10. Current decision

P0 remains a valid controlled composability proof. It is not a production-security or
distributed-delivery proof.

H0b and bounded H1 have passed on the current build. The immediate technical priority is no
longer another local happy path; it is to test platform durability and select a production
transport only after the demo application's latency, availability, security, and economic
requirements are known. The enrollment response-loss gap remains explicit: the current
fixture cannot recover a one-time Inbox capability after approval if its delivery is lost.
No demo application or production topology is selected by this document.
