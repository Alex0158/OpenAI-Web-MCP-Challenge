# Research 27: Notification-Handoff Profile Proposal

**Role:** SUPPORTING protocol proposal for TASK-029
**Status:** Concrete profile proposed and not implemented; first-version assurance accepted in ADR-0046
**Date:** 2026-09-04, Europe/London
**Owner:** Receiver, Local Connector, and Agent Adapter owners

## Claim boundary

This record turns ADR-0046's selected notification-only target into a reviewable protocol proposal.
It is not an ADR, implementation instruction, deployment claim, or evidence that a supported
Desktop task can currently be admitted or woken. Existing v0.1 and v0.2 effect-backed acknowledgement
profiles remain unchanged until an explicit version and migration decision is accepted.

## Accepted assurance and proposed concrete completion contract

ADR-0046's 2026-09-04 amendment accepts qualified, correlated acceptance by the App/runtime owning
the bound existing task as first-version delivery. Its concrete invocation and attestation contract
must establish exact-task notification acceptance, not just Connector-local staging. Runtime crash
recovery is not a prerequisite for this first-version assurance. The Receiver does not wait for the
Agent to start, read the Browser, perform a Game action, or finish its work.

```text
signed Event -> Receiver pending Delivery -> Connector staging
             -> owning runtime admits notification for the bound task
             -> trusted correlated handoff report -> Receiver receipt

later Agent turn / Browser / optional Game work: separate evidence, not settlement conditions
```

This is an accepted assurance, not evidence of such a runtime capability or acceptance of this
proposal's wire/storage details. A process exit, unqualified Adapter `accepted`, arbitrary native
response, stored CLI queue item, or Agent narration does not establish exact-task acceptance.
The concrete driver must name what its response proves, the scheduling boundary and response-loss
behavior. A qualified response need not promise App-crash durability; see the accepted limit below.

An earlier revision proposed settlement at a private Adapter inbox without clearly naming its
downstream responsibility. That would transfer unfinished delivery responsibility to the Connector.
Such a different completion boundary would need an explicit decision and recovery design; it is
not silently retained here. The accepted runtime-acceptance assurance does not select a particular
inbox, receipt schema, wire version or migration.

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

Automatic recovery of an uncertain submission requires idempotent runtime admission or authoritative
lookup of that same notification. Those capabilities are not prerequisites to specifying a bounded
single-attempt profile. Before any call, persist its stable identity, binding generation and attempt
reservation. A post-call crash or timeout remains durable `unknown` without automatic resend when
no runtime reconciliation primitive exists. A Connector journal cannot prove what the runtime did
between admission and the local success record; do not claim exactly-once delivery or start another
task. The unknown delivery's slot disposition remains an explicit decision below.

An additive notification profile preserves retained v0.1/v0.2 effect ACK meanings. This proposal's
earlier `v0.3`, `POST /v0.3/delivery-handoffs` and `notified` examples were never accepted APIs.
[ADR-0049](../Decisions/ADR-0049-game-team-standing-integration-and-eyad-release.md) now owns the
bounded finite-v0.2 implementation target under TASK-036. Follow that coordinated contract-freeze
gate; this research must not establish a competing route or collide with TASK-027's lifetime profile.
The accepted assurance alone does not prove a runtime receipt or make the target route implemented.

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
database transaction can make both atomic. Where runtime deduplication or authoritative lookup
exists, it may resolve an uncertain submission; otherwise the durable local journal preserves
unknown and forbids blind resend. Exact Receiver receipt replay recovers a lost response after a
known acceptance report without another runtime call. Receiver receipt persistence and notification-
slot release can and should be atomic within its own store. This does not make App acceptance
crash-durable.

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
| Qualified acceptance is known, then the App crashes before preserving the notification or starting a turn | No Receiver resend on that basis; accepted first-version loss risk, not guaranteed wake |
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

## Smallest coordinated remediation

The architecture review confirms three connected implementation gaps, not a reason to replace the
Cloud/outbound Connector topology. Retain pairing, credential custody, signed delivery validation
and the existing Adapter seam. The selected-product change must close these boundaries together:

| Boundary | Required implementation | Falsifier |
|---|---|---|
| Enrollment and private binding | Capture the exact task through trusted runtime context; verify owner/Grant scope; persist and recover the same binding generation. | A first Event chooses the task, restart loses it, or a wrong binding reaches the driver. |
| Notification driver | Make one permitted exact-task handoff; distinguish its result from Agent execution, Browser use and business completion. | A fresh process substitutes for the task, or a delivery timeout cancels the ongoing task. |
| Receipt and recovery | Persist qualified handoff or explicit unknown under stable correlation; coordinate Receiver receipt and slot release using an accepted profile. | An unknown send is blindly repeated, a late process exit is promoted to receipt evidence, or no Game effect causes redelivery. |

TASK-034's actual wake/Browser evidence closes the product trace; it is not a prerequisite to
specifying these semantics. TASK-035's permitted runtime invocation remains a prerequisite to any
live call. Neither a fixture nor agreement with this plan creates that invocation capability.

### First-version assurance accepted; unknown-slot disposition still open

The owner accepted the narrower assurance in ADR-0046: qualified exact-task runtime acceptance,
without a promise of recovery after an App crash. An accepted notification may be lost before a turn
starts; the Receiver does not resend on that basis. A later Event is not a guaranteed remedy,
especially when the lost Event is the last one. Label this runtime acceptance, never crash-durable
delivery or guaranteed wake. Stronger runtime-backed crash recovery is not a first-version prerequisite.

The accepted assurance preserves unknown after a lost reply and prohibits blind resend. Unknown
handling does not revoke the Grant. Its queue consequence remains a separate decision: pause the
affected lane pending resolution, or retain the unknown record while explicitly releasing the slot for newer
Events. The former can delay later reminders; the latter accepts an unresolved earlier reminder and
needs bounded scheduling. Neither behavior, a new receipt API, wire version or migration is selected
by the owner's acceptance of this first-version assurance.

## Minimum acceptance matrix

After the semantic and route decision, implementation must prove:

1. one signed Event reaches the exact bound task through the named qualified acceptance boundary;
2. two Events reuse one Consent and task while retaining separate correlation;
3. runtime-response loss, Receiver-response loss, restart and cross-lease replay do not blindly
   produce another notification;
4. stale/wrong-owner/wrong-binding/revoked cases are denied at their defined authority boundary;
5. historical receipt reads remain truthful and private after expiry or revocation;
6. busy-task bursts remain bounded and preserve a later fresh-state check without business polling;
7. interrupted work, deliberate no-action and post-acceptance App crash do not reopen completed delivery;
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
business-completion monitoring. Reopen if qualified task acceptance cannot be established without
different custody, authority or user-visible semantics.
