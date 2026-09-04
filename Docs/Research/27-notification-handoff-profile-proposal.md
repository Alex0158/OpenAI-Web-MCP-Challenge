# Research 27: Notification-Handoff Profile Proposal

**Role:** SUPPORTING protocol proposal for TASK-029
**Status:** Proposed; not accepted and not implemented
**Date:** 2026-09-04, Europe/London
**Owner:** Receiver, Local Connector, and Agent Adapter owners

## Claim boundary

This record turns ADR-0046's selected notification-only target into a reviewable protocol proposal.
It is not an ADR, implementation instruction, deployment claim, or evidence that a supported
Desktop task can currently be admitted or woken. Existing v0.1 and v0.2 effect-backed acknowledgement
profiles remain unchanged until an explicit version and migration decision is accepted.

## Recommended completion boundary

Settle notification delivery when the runtime owning the bound existing task has reliably admitted
the correlated notification. A runtime-recognized inbox is eligible only if its contract accepts
responsibility for task addressing, scheduling and recovery. An arbitrary Connector-local backlog
does not meet this boundary. The Receiver does not wait for the Agent to start, read the Browser,
perform a Game action, or finish its work.

```text
signed Event -> Receiver pending Delivery -> Connector staging
             -> owning runtime admits notification for the bound task
             -> trusted correlated handoff report -> Receiver receipt

later Agent turn / Browser / optional Game work: separate evidence, not settlement conditions
```

This is a recommendation under ADR-0046, not evidence of such a runtime capability. A process exit,
an unqualified Adapter `accepted`, an in-memory native response, a stored CLI queue item without
an established wake/recovery contract, or Agent narration cannot establish reliable admission.
The concrete driver must name what commits, who owns recovery, and how a lost response is resolved.

An earlier revision proposed settlement at a private Adapter inbox without clearly naming its
downstream responsibility. That would transfer unfinished delivery responsibility to the Connector.
Such a different completion boundary would need an explicit decision and recovery design; it is
not silently retained here. The owner approved continuing reconciliation, not a particular inbox,
receipt schema, wire version or migration.

## Local binding and Receiver authority

The local Agent Adapter alone resolves the private Grant-to-task binding. It verifies the selected
existing task, owner and unchanged binding generation before dispatch. Raw task locators stay local;
the Host and Receiver neither store them nor select or independently inspect the task.

The Receiver verifies its own authenticated Connector, account/device target, Grant, Event, delivery,
lease and consent scope. It accepts a handoff report only under a named trusted Adapter/Connector
attestation contract. The Connector credential authenticates the reporter; it does not independently
prove what the runtime did. This distributed trust assumption must be explicit in the selected
driver and tests. A report for another task binding, target, Event or delivery is not reusable.

The prior wording that the Receiver resolves a private task record is superseded by this local-only
ownership. The Agent receives event context, not lease/effect credentials or a new user strategy.

## Stable identity and proposed wire boundary

One Receiver delivery must map to one durable handoff identity across process restarts and lease
attempts. Create or recover this mapping before the first runtime call; a new lease is not a new
notification. Serialize competing workers against that identity and retain the binding generation
locally so a changed binding cannot silently redirect an in-flight delivery.

The runtime must provide idempotent admission or authoritative lookup of that same notification.
A Connector journal alone cannot resolve a crash after runtime admission but before the journal
records success. Without a suitable runtime primitive, preserve `unknown` and surface the limitation;
do not claim exactly-once delivery or start an alternative task.

An additive notification profile remains recommended so retained v0.1/v0.2 effect ACKs keep their
meaning. `v0.3`, `POST /v0.3/delivery-handoffs`, `handoff_id` and `notified` are candidate names,
not accepted APIs. Final wire design follows the concrete runtime receipt and the lifetime/version
decision under TASK-027; two independent proposals must not create incompatible meanings for v0.3.

The eventual report needs bounded opaque delivery/handoff correlation, reporter authentication,
evidence sufficient for its admitted boundary, and exact replay/conflict semantics. No raw task ID,
caller-supplied account authority, Game effect token, or arbitrary success boolean may substitute
for that contract. Transport authentication and historical receipt lookup remain access controlled.

## Historical receipt versus a new handoff

These are different operations, even if a future API combines them:

1. **Read an already-recorded receipt.** Authenticate current read authority for the same account
   and delivery scope. Return the historical result without another runtime call. A now-expired
   delivery lease or later Grant revocation does not rewrite successful history. A revoked
   credential is not valid read authority; no anonymous or cross-owner replay is allowed.
2. **Record previously unrecorded admission evidence.** Reconcile only evidence for the original
   stable identity and binding. The protocol must define how admission-time authority is proven
   when the lease has since expired or revocation has occurred. A caller-supplied timestamp alone
   is insufficient. If the ordering cannot be established, retain a visible unknown outcome;
   do not turn it into a new send or an invented success.
3. **Attempt a genuinely new runtime handoff.** Require current valid lease, Grant, target and local
   binding authority. Only authoritative non-admission or a proven idempotent runtime operation
   permits the bounded attempt. Lease expiry by itself is not evidence of non-admission.

Runtime admission and Receiver receipt are separate commits in different processes. No Receiver
database transaction can make both atomic. Runtime deduplication/reconciliation, a durable local
journal and exact Receiver receipt replay must bridge that window. Receiver receipt persistence
and notification-slot release can and should be atomic within its own store.

## Failure and recovery matrix

| Condition | Required behavior |
|---|---|
| Wrong account, Connector, target or local task binding | No new handoff; visible denial without another target or fresh task |
| Only Connector staging has committed | Still pending; do not report task notification as delivered |
| Runtime admits the notification; its reply is lost | Look up or idempotently reconcile the same notification; without that capability keep unknown |
| Runtime admission is known; Receiver acknowledgement reply is lost | Replay the same handoff report or read its receipt; never re-notify the task |
| Connector restarts before/after a runtime call | Recover the original identity and binding generation; never create a new identity to bypass ambiguity |
| Lease expires or another worker claims the delivery | Fence new calls by current authority and consult the existing journal/runtime identity; expiry does not authorize blind resend |
| Revocation precedes a new authorized handoff | Deny new work; do not reopen the Grant or rebind to another task |
| Historical receipt exists, then lease expires or Grant is revoked | Preserve receipt truth; permit only authenticated scoped history read, not renewed execution |
| Agent is interrupted, does nothing, or produces no Game effect | No redelivery of a successfully handed-off notification |
| Runtime is conclusively unavailable before admission | Bounded pending/recovery under an accepted retry and backlog policy; keep authorization distinct from availability |
| Retained v0.1/v0.2 caller | Preserve the old route, rows and effect-backed meaning; no automatic profile mixing |

Retry budgets, time bounds and receipt/journal retention must be set from the selected runtime's
capabilities. Garbage collection must not make an old ambiguous notification look new. Tests must
cover the negative cases, not just successful replay inside one process.

## Busy tasks, duplicate delivery and event bursts

Exact delivery replay is not coalescing different Events. The former returns the same admission
record; it cannot settle an unrelated Event. Cross-Event grouping needs retained member correlation,
scope boundaries and an accepted rule for which signals may be summarized or must remain distinct.

For the smallest profile, preserve each Event's identity and source while bounding pending work and
wake frequency. Do not interrupt a busy task indefinitely. A later change must remain eligible for
a subsequent fresh-state check, including a change that arrives after the Agent's last state read.
Task/runtime scheduling owns this behavior; the Receiver does not watch Game progress to decide it.
Exact grouping, wake cadence, limits and overflow behavior remain review decisions, not defaults
chosen implicitly by the receipt schema. Receiver backpressure must be explicit, not silent loss.

## Revocation and offline boundaries

Known revocation, expired execution authority and stale workers prohibit new handoffs. Already
admitted notifications cannot be recalled by revoking the Grant. Revocation can race between the
last distributed authorization check and runtime admission; document the supported cutoff and
in-flight limitation rather than promising instantaneous cross-process cancellation.

Offline authorization retention remains the approved direction. It does not guarantee runtime
availability, unlimited backlog or permanent credentials. An offline revocation request is pending
until the Receiver confirms it; a local execution stop is separate. No device-wide revocation cascade,
task replacement or automatic credential-renewal policy is selected by this proposal.

## Integration ownership

- **Host/SDK:** authenticated business signals and safe public binding/status; no receipt minting.
- **Receiver:** Grant/Event/device authority, leases, authenticated handoff reports, receipt and slot
  persistence; no raw-task lookup or Agent business monitoring.
- **Existing Local Connector and its Adapter:** legitimate runtime driver, private binding,
  stable dispatch journal, runtime reconciliation, bounded failure and credential custody.
- **Owning task runtime:** the selected admission, scheduling and recovery contract; not assumed
  from the existence of a CLI command or private messaging method.
- **Agent and Game:** strategy, fresh page/tool decisions and optional independently verified
  business effects; no obligation to manufacture an effect for Receiver settlement.

Reuse the existing Connector's pairing, credentials, outbound claim and Adapter seam. Compare MVP 1's
actual launcher/caller assumptions before promoting necessary code. Neither the frozen MVP nor the
experimental probe becomes a parallel production Connector. TASK-035 owns legitimate runtime and
binding feasibility; this proposal cannot supply that evidence.

## Minimum acceptance matrix

After the semantic and route decision, implementation must prove:

1. one signed Event reaches the exact bound task through the named reliable admission boundary;
2. two Events reuse one Consent and task while retaining separate correlation;
3. runtime-response loss, Receiver-response loss, restart and cross-lease replay do not blindly
   produce another notification;
4. stale/wrong-owner/wrong-binding/revoked cases are denied at their defined authority boundary;
5. historical receipt reads remain truthful and private after expiry or revocation;
6. busy-task bursts remain bounded and preserve a later fresh-state check without business polling;
7. interrupted work and deliberate no-action do not reopen completed delivery;
8. receipt persistence and slot release converge without pretending to share a transaction with
   the runtime; and
9. retained finite/effect-backed profiles and their stored history remain unchanged.

Actual task wake and genuine Browser/WebMCP evidence remain separate acceptance observations under
TASK-034. Passing receipt fixtures does not prove those capabilities or a hosted deployment.

## Decisions still required and non-goals

First identify and accept the concrete task-runtime admission, ownership and lost-response contract.
If only Connector-local durable staging is possible, present the changed responsibility to the owner;
do not quietly call it task delivery. Then accept the receipt attestation, stable correlation and
retention, revocation cutoff, busy/overflow policy, and one coordinated wire/storage migration design.
An approved product direction does not pre-approve all these technical choices.

This proposal neither changes code nor selects a supported Desktop API. It does not authorize a
launcher, listener, native call, new task, App configuration change, publication, deployment or
business-completion monitoring. Reopen if reliable task admission cannot be established without
different custody, authority or user-visible semantics.
