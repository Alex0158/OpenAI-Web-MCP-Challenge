# Post-H1 Unknowns and Validation Roadmap

**Role:** SUPPORTING technical, product, and business research  
**Status:** Active post-H1 risk register and experiment order; no app or production topology selected  
**Observed:** 2026-08-30  
**Scope:** What H1 changed, what remains unknown, and which experiments should precede a
production-style build

## Executive judgment

The concept is no longer blocked on basic local composability. P0, H0b, and H1 jointly prove
that the tested current Desktop build can preserve a bounded re-entry receipt in one existing
task, regain fresh page-bound WebMCP, enforce an authenticated event gate, continue one
artifact exactly once at the visible-effect layer, recover from one lost acknowledgement,
and stop before human commit.

The concept is still not validated as a product or production architecture. The largest
remaining uncertainty has moved from **can the mechanism run?** to five separate questions:

1. **Which product layer, user workflow, buyer, and integration owner make the mechanism
   worth adopting?**
2. **Is Agent re-entry materially better than a deterministic Host workflow, notification,
   deep link, or fresh Agent with a bounded capsule?**
3. **Can the selected product tolerate the latency, availability, and cost profile of its
   chosen Agent transport?**
4. **Can enrollment, identity, event delivery, and Host effects remain correct across real
   service and browser boundaries?**
5. **Can an independent judge or user reproduce genuine WebMCP without relying on one local
   account, build, task, or machine?**

[Research 05](05-distributed-topology-and-hard-coupling-risk-review.md) remains useful for
the third question. Its production risks remain real, but its full three-process harness
should follow app and transport selection rather than precede them.

## 1. What is now verified

| Surface | Current verdict | Exact boundary |
|---|---|---|
| Page-bound WebMCP composability | **P0 PASS** | Genuine Stage-A and Stage-B tools in one controlled local workflow |
| Same-task bounded receipt continuity | **H0B PASS** | Trigger-only schedule recovered a prior receipt and regained fresh genuine Site Tools |
| No-event authorization gate | **H1 PASS** | `pending: false` stopped before the Host page and produced zero effect |
| Durable local accepted event | **H1 PASS** | One event, run, and delivery survived Receiver process restart in the isolated H1 store |
| Visible-effect idempotency | **H1 PASS** | Lost acknowledgement plus exact semantic retry produced one Host effect and one artifact revision |
| Exact event replay | **H1 PASS** | Replay returned the existing completed delivery and created no second logical work |
| Human stopping behavior | **P0/H1 PASS** | Artifact remained uncommitted and the Agent never received a commit Site Tool |
| Task-scoped Browser runtime cold start | **H2A PASS WITH RECOVERY** | A new Node kernel rebuilt Browser/WebMCP after the old kernel was terminated; full Desktop restart remains open |
| Crash-recoverable enrollment service contract | **H2 PASS** | Atomic enrollment, a stable receipt outbox, separate idempotent durable destination, four real process-crash boundaries, concurrent approval convergence, activation fencing, sealed-receipt purge, and redacted status and trace surfaces; no real Agent destination or production worker is claimed |
| Clean Agent-context Site Tool discovery | **C1 VERIFIED, SAME ENVIRONMENT** | App-held traces show two fresh internal contexts with no prior turns or project-file access discovering the official and local P0 manifests and invoking one manifest-annotated read-only tool each. No mutating Site Tool was invoked; fresh user-visible task, account/workspace, machine, and full-loop portability remain open |
| Documented eligible-model Site Tool discovery and read | **M1 VERIFIED ONCE PER MODEL, SAME ENVIRONMENT** | Controller-assigned Sol and Terra arms discovered the same official and local manifests and completed one current-state invocation per page. Both documentation preflights failed; each actual Site Tool invocation succeeded without invocation retry. This is not model parity, and full Scheduled Task comparison remains open |

Evidence: [H1 verdict](../../mvp/evidence/h1-event-gated-scheduled-reentry-2026-08-30-verdict.md)
and [H2 service-contract verdict](../../mvp/evidence/h2-durable-enrollment-service-contract-2026-08-30-verdict.md).

These are current-build, same-user, local experimental facts. They are not inherited by a
different client, account, workspace, model, application, transport, or deployment.

## 2. Highest-priority product unknowns

### U-00 — What is the product, and is the workflow pain observed?

The mechanism could become a feature inside one Host application, an integration platform
for many websites, or an Agent-side companion installed by users. These are different
products with different beneficiaries, buyers, integration owners, operators, distribution,
security, and support burdens. App selection must choose one product layer rather than only
choosing a demo domain.

Every candidate also needs evidence of the current workflow: who reconstructs context, how
often the later event occurs, how long it waits, what workaround exists, which errors or
abandonment occur, and whether the saved work could plausibly exceed Grant and monitoring
friction. A coherent story without an observed problem is not product validation.

### U-01 — Does the Agent continuation create incremental user value?

The current evidence proves execution, not necessity. First compare the Agent with the best
reasonable deterministic Host job or workflow rule. If deterministic automation safely
prepares the same result for the representative event set, Agent reasoning is unnecessary.
Then compare three user-facing controls on the same selected workflow:

1. notification plus deep link;
2. fresh Agent plus bounded continuation capsule; and
3. same-task re-entry plus the same capsule and fresh page authority.

Measure active user time, clarification turns, critical errors, completion, review edits,
latency, and total lifecycle cost, including enrollment, consent, monitoring, revocation,
and failure recovery per useful continuation. If the Agent condition does not beat the
deterministic or notification controls, the concept lacks sufficient automation value. If
exact-task history does not beat the fresh Agent plus capsule, exact-thread continuity should
become optional infrastructure rather than the product thesis.

### U-02 — Is WebMCP materially necessary?

Compare page-bound re-entry with a normal authenticated backend API carrying the same state
and action schema. WebMCP must add at least one material advantage: live user-visible state,
stage-specific capabilities, in-page human controls, lower integration friction, or stronger
shared user/Agent inspectability. If the backend API is equivalent, the concept collapses
toward generic orchestration and becomes weak for a WebMCP challenge.

### U-03 — Which event deserves re-entry?

The final application must define an event whose arrival makes prior work newly actionable,
whose next preparation benefits from Agent reasoning, and whose consequence still warrants a
human boundary. A fast deterministic callback, trivial status change, or event that needs no
prior rationale is a poor fit even if technically easy.

These questions depend on the app selection discussion with Eddy. They should control the
transport and security requirements rather than be retrofitted after infrastructure is built.

## 3. Platform durability inventory and the one remaining pre-app test

The matrix remains the durability inventory, but only D4/H2b should run before app selection.
Use the same sealed receipt and no-event/one-event controls:

| Condition | Required observation | Failure meaning |
|---|---|---|
| Desktop app restart | Same task recovers receipt, Browser, and current Site Tools after restart | Current mechanism depends on process-lifetime state |
| Device sleep and wake | Pending event remains available and the next scheduled turn catches up once | Scheduled pull is unsuitable for unattended local operation |
| Temporary offline period | No effect while offline; one bounded recovery after connectivity returns | Delivery semantics need a hosted or paired runtime |
| Busy foreground task | No cross-task mix-up, duplicate effect, or indefinite starvation | Exact-task scheduling and concurrency are unsafe |
| Client update | Re-run H0b and H1 without changing the proof criteria | Undocumented capability drift is too high |
| Eligible model variation | Sol and Terra separately regain genuine Site Tools in the selected continuation path | Result is model-specific in the selected workflow |
| Account and workspace variation | Feature availability and permissions are explicit and reproducible | Judge/customer access cannot be assumed |
| Schedule jitter and missed interval | Record actual scheduled, start, observe, and completion times | Latency cannot support the selected workflow |

The current H1 proves Receiver **process** restart only. It does not prove Agent app restart,
machine restart, sleep, offline catch-up, or another user environment.

H2a now proves a narrower durability fact: loss of the controlled task's Node Browser kernel
does not permanently break the scheduled join. A new kernel recovered within the same turn,
but only after the Agent learned the cold runtime's mandatory confirmation and WebMCP
documentation gate and retried. The parent tool service and Desktop app remained alive. This
narrows process-lifetime risk without satisfying the first row of the matrix.

Run exactly one paired D4/H2b full-Desktop-restart experiment next, using the protocol in
[Research 11](11-platform-durability-and-cold-start-audit.md). Defer sleep/offline, busy-task,
client-update, full Scheduled Task model comparison, and account/workspace variation until the
selected app makes them material. D3 is diagnostic only after a D4 failure.

M1 satisfies only the bounded discovery-and-read portion of the eligible-model row in the
same installed environment. App-held traces show one fresh Sol arm and one Terra arm
discovering the same official and local genuine Site Tools and completing one invocation per
page. It does not test Scheduled Task execution, receipt recovery, event reasoning, mutation,
quality, latency, or usage; those comparisons belong inside the selected-app study. A future
public evidence package must also capture model assignment and redacted runtime traces in a
self-contained form.

## 4. Enrollment and lifecycle unknowns

### U-04 — Crash-safe Inbox provisioning and real receipt delivery

The historical H1 setup approves the base Grant before creating the Inbox. The H2 spike now
closes that concrete local service-contract gap: approval atomically persists a non-active
Grant, Inbox, and outbox; a sealed receipt can be redispatched with a stable dispatch ID; an
idempotent separate durable destination tolerates acknowledgement loss; and activation is
fenced until receipt delivery and exact binding acknowledgement. Real `SIGKILL` tests and
independent approval processes prove recovery and convergence. The current full suite passes
88 tests.

The remaining question is whether the selected real destination can implement the same
durable acknowledgement and idempotency contract. H2 uses a synthetic SQLite destination
and one-shot worker; it does not prove a hosted or Desktop transport, production supervision,
key rotation and recovery, multi-tenant isolation, destination retention policy, or production
identity and authorization.

### U-05 — Revocation, replacement, expiry, and key rotation

H1 uses one short-lived Grant and private runtime keys. It does not prove revocation during a
pending delivery, Grant replacement, issuer onboarding, signing-key rotation, capability
rollover, or audit retention. These are required before a persistent integration claim.

## 5. Production topology and identity unknowns

### U-06 — How does a remote event reach the Receiver?

A remote backend cannot reach a user's loopback Receiver. The bounded H1 route avoids that
specific push by making the scheduled task poll a local Receiver Inbox, but a real backend
still needs one explicit ingress topology:

- hosted Receiver plus scheduled or hosted Agent pull;
- Local Receiver with an authenticated outbound connection;
- paired local connector with a hosted event gateway; or
- a supported native event trigger if the platform later exposes one.

Do not select among these before the app defines latency, offline, privacy, deployment, and
administration requirements. Do not describe scheduled pull as direct business-event wake.

### U-07 — Who is the authenticated actor at every boundary?

The production contract must separately identify the event issuer, Receiver service, Host
user and tenant, managed Agent context, browser session, workflow owner, page instance, and
human approver. A correlation ID and canonical URL are diagnostics and routing metadata, not
authorization. Public HTTPS, Origin/CSRF policy, session binding, one-time registration
capability, and page nonce remain untested.

### U-08 — Can genuine WebMCP survive schema and page lifecycle changes?

P0 proved current-document tool removal with `AbortSignal`, and H1 rediscovered tools after
fresh navigation. Production still needs tool-surface version negotiation, incompatible
schema handling, redirects, multiple tabs, stale authenticated sessions, wrong-user pages,
and mid-turn state changes.

## 6. Distributed reliability unknowns

H1 intentionally used one local process and store. H2 adds separate Receiver and destination
stores plus independent process crash and concurrency tests for enrollment receipt delivery,
but it does not test the selected production topology. The project has not yet tested:

- Host transition plus outbox atomicity;
- Receiver offline while a remote backend emits;
- separate Host, issuer, Receiver, and connector stores;
- network timeout before or after acceptance;
- retry leases, backoff, dead-letter handling, and operational repair;
- multiple events, ordering, supersession, or concurrency;
- connector restart or a missing/busy Agent task;
- Grant expiry or revocation during delivery; or
- conflicting Host state after event acceptance.

After app and transport selection, the smallest P1 harness should separate the real trust and
failure boundaries chosen by that topology. It should not mechanically reproduce three
processes if the selected runtime has different boundaries.

## 7. Human authority and consequence unknowns

P0 and H1 prove behavioral stopping and absence of an Agent-callable commit tool. They do not
prove that only an authenticated authorized human can commit, that the reviewer saw the exact
artifact revision later committed, or that a stale approval is rejected. The selected app
must define the consequential action, reviewer identity, expected reviewed revision, audit
record, and recovery after rejection or change request.

## 8. Commercial and operating unknowns

The bounded H1 used four scheduled turns over roughly seven minutes. That is a feasibility
cost, not a unit-economics result. Official documentation now supplies shared-usage context,
but no dedicated Scheduled Task per-run price or accounting rule. Continuous one-minute
polling can create up to 1,440 checks per day per watch. Research 16 now supplies a
watch-window calculator and hard transport falsifiers, but the following inputs remain
unknown:

- expected events per Grant and no-op checks per useful continuation;
- event-to-result latency distribution and user tolerance;
- model, Browser, network, battery, and support cost;
- willingness to grant future scoped authority;
- consent fatigue, failure comprehension, and recovery effort;
- avoided-error value and saved active-attention time; and
- whether a customer will install or administer a local connector if required.

If the selected workflow requires seconds-level response, works while the device is offline,
or creates thousands of sparse watches, bounded Desktop polling should be rejected as the
production route.

## 9. Recommended verification order

1. **Freeze H1 evidence and nonclaims.** Completed for the 2026-08-30 run.
2. **Specify and test crash-safe enrollment recovery at the service-contract level.**
   Completed by the bounded H2 spike; preserve its synthetic-destination and one-shot-worker
   nonclaims.
3. **Preserve the verified same-environment C1 and M1 smokes.**
   App-held source traces verify the official-control and local P0 calls, while the redacted
   repo package is not a self-contained public audit artifact. Do not promote C1 to an
   independent account, machine, public deployment, or judge pass, or M1 to parity.
4. **Run one paired D4/H2b restart experiment.** This is the final app-neutral durability kill
   test; a pass is current-build compatibility evidence, and a failure may trigger D3 only as
   a diagnostic split.
5. **Select the product layer and demo app using observed workflow evidence.** Then run C2 in
   a fresh user-visible task with a capture-time evidence package and run the
   product kill tests: Agent versus deterministic automation and notification, exact task
   versus bounded capsule, and WebMCP page versus backend API.
6. **Derive and accept a transport ADR from the selected app's latency, offline, privacy,
   administration, and cost requirements.** Scheduled pull
   remains an experiment unless the measured product envelope fits it.
7. **Run only the platform-durability and transport measurements material to that selected
   route.** Do not expand generic pre-app infrastructure after the H2 and clean-room gates.
8. **Build the additive P1 distributed seam for that topology:** separate authorities,
   authenticated identity and origin, durable outbox/delivery, revocation, retry, and
   human-action enforcement.
9. **Run a public HTTPS clean-room reproduction** on an independent account or judge-like
   environment before claiming deployability or submission readiness.

## 10. Current decision boundary

The correct current statement is:

> The bounded local re-entry mechanism is technically feasible on the tested Desktop build,
> and its crash-recoverable enrollment contract is feasible against a synthetic durable
> destination. Product necessity, platform durability, real destination transport,
> cross-boundary trust, clean-room reproducibility, and commercial viability remain unproven.

The next major build should be selected by evidence from the app and transport decisions, not
by the visual completeness of the original architecture diagram.
