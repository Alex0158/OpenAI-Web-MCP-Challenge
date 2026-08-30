# Receiver Queue and Wake-Adapter Architecture Review

**Role:** SUPPORTING architecture research and decision input  
**Status:** Open; not an accepted architecture decision  
**Observed:** 2026-08-30  
**Scope:** Receiver delivery durability, Agent availability, scheduled heartbeat re-entry, and
the unresolved join from a supported Agent transport to Browser and genuine page-bound WebMCP

## Executive conclusion

The Host Backend remains the source of truth for business state. The Receiver should own a durable,
authenticated **delivery inbox and ledger**, not a second authoritative copy of the business
workflow. A Codex Heartbeat should not be the source of truth for events and should not run forever
for every Grant. It is a re-entry adapter: a current-platform fallback that gives a bound Agent
task an opportunity to pull pending work when the Agent host becomes available.

This distinction makes the system less fragile:

```text
Authoritative Host transition and event intent
    -> Receiver authenticates, deduplicates, and durably records a delivery
    -> Wake adapter signals or schedules the bound Agent when possible
    -> Agent pulls the pending item and reads fresh page authority
    -> Agent continues the workflow through page-bound WebMCP Site Tools
```

The current MVP already implements separate event, run, delivery, effect, and enrollment-outbox
records. H1 validates Receiver-owned pending delivery plus scheduled pull. D4 was intended to add
Desktop restart evidence, but its first formal no-event attempt was `INCONCLUSIVE`; it has not
validated Desktop re-entry.

The transport question is now narrower than “can an Agent be triggered?” Codex App Server
documents exact `thread/resume` followed by `turn/start`, and the Workspace Agents API documents
server-side triggers with durable queueing, idempotency, and stable conversation keys. Neither path
has been shown to resume an arbitrary local Desktop task **and** regain its built-in Browser and
genuine page-bound WebMCP Site Tools. The unresolved seam is transport-to-Browser/WebMCP join, not
the existence of every possible Agent trigger.

## 1. The design question

The project needs to bridge two different availability domains:

1. A third-party or Website Backend may emit a business event at any time.
2. The Codex Desktop application, Agent task, Browser runtime, or page may be unavailable at that
   exact time.

The design must therefore answer two separate questions:

- **Durability:** Can the event be accepted and retained without Codex being online?
- **Activation:** How does the bound Agent get an opportunity to process that retained event later?

Combining both questions into a single always-on Heartbeat makes the scheduler responsible for
durability, liveness, transport, and task targeting at once. Separating them gives each component
one authority and one failure boundary.

## 2. Current observed MVP behavior

### 2.1 Verified observations

- The local Receiver is independently supervised from the Codex Desktop process tree.
- The Receiver runtime has durable event, inbox, delivery, and effect records. The current test
  harness uses these records to preserve pending work and to check idempotent continuation.
- The H2 enrollment outbox already implements explicit leases, attempts, retry availability,
  durable destination acknowledgement, and terminal delivery. The H1 event-delivery table is
  simpler: it retains `PENDING` work and verifies a committed Host effect before acknowledgement,
  but it has no claim lease or visibility timeout.
- The current re-entry adapter is a scheduled Codex Heartbeat. When the target task receives a
  turn, the Agent uses the page-bound Inbox Site Tool to discover whether a pending event exists.
- The D4 harness uses an independent process observer and relaunch helper to test Desktop close and
  relaunch. The helper is test infrastructure; it is not evidence of a supported public
  Receiver-to-Codex wake API.
- The first formal D4 no-event attempt was `INCONCLUSIVE`: the Desktop did close, but an unrelated
  long-lived relay was misclassified as a Desktop lifecycle process, so automatic relaunch was not
  requested. This result does not establish either success or failure of Desktop continuity.
- Codex App Server has independently passed exact-thread context resume in this repository, but its
  current adapter deliberately proves no Browser or Site Tool contract.
- The Workspace Agents API documents external Agent triggering and durable trigger queueing, but it
  targets a published Workspace Agent rather than an arbitrary local Desktop task and does not
  document the required Browser/WebMCP join.
- No supported path has yet been demonstrated that lets an independent Receiver resume an
  arbitrary local Desktop task while the app is closed and then regain its built-in Browser and
  genuine page-bound WebMCP Site Tools.

### 2.2 Interpretation boundaries

The following statements are working interpretations, not platform guarantees:

- A scheduled Heartbeat is a workable current-client pull adapter for a bounded demonstration.
- A task can use persisted managed context and a stored receipt to rediscover the canonical page
  after a later turn.
- A Receiver can preserve a pending event while the Agent host is absent, provided the Receiver
  process and its storage remain available.

The MVP must not turn these observations into claims of direct push delivery, production
availability, public scheduler semantics, or exactly-once execution.

## 3. Responsibility separation

The proposed ownership model is:

| Responsibility | Owner | Required behavior |
|---|---|---|
| Workflow authority | Website Backend/page | Remain the authoritative source for current workflow state and permitted next actions |
| Event intent | Website Backend/outbox | Commit the authoritative business transition and bounded event intent atomically |
| Event ingress | Gateway/Receiver | Authenticate the source, validate Grant scope and event type, deduplicate, and commit a durable delivery record |
| Delivery durability | Receiver delivery ledger | Retain authenticated pending work while Codex, Browser, or the Website is unavailable |
| Agent activation | Wake adapter | Use direct wake when supported; otherwise use a bounded Heartbeat or an approved local relaunch path |
| Event consumption | Bound Agent task | Pull the pending item through a genuine page-bound Inbox tool and read fresh authority |
| Workflow effect | Website page tools | Apply an idempotent effect only after the Agent has verified current state |
| Human boundary | Agent/page contract | Stop before the explicitly human-owned commit or irreversible action |

The Receiver delivery ledger is therefore not a replacement for either Host authority or a wake
mechanism. It is the decoupling layer that makes Agent availability optional at event-ingress time.

## 4. Why an always-on Heartbeat is a weak primary design

Using a permanent Heartbeat for each active Grant would work as a polling workaround, but it has
unfavorable system properties:

- **Cost:** Empty turns consume scheduler and Agent resources even when no event exists.
- **Latency:** Event delivery is bounded by the polling interval rather than by event arrival.
- **Availability coupling:** A scheduler outage or closed Desktop can prevent the check even though
  the Receiver has safely stored the event.
- **State duplication:** The scheduler starts to act like a second event store, while the Receiver
  already owns event identity, scope, and durability.
- **Lifecycle leakage:** Long-lived schedules can outlive Grant expiry, task deletion, app updates,
  or user intent unless they are explicitly fenced and stopped.
- **Retry ambiguity:** A busy or unavailable target can cause scheduler retries that are difficult
  to distinguish from a new business event without a strict dispatch ledger.
- **Security exposure:** Passing event details through a recurring prompt expands the authority and
  leakage surface. The prompt should remain trigger-only; the Agent should pull current authority
  from the page.

These are reasons to demote Heartbeat from a primary event mechanism, not reasons to remove it from
the MVP. It remains a reasonable bounded compatibility adapter while the supported
transport-to-Browser/WebMCP join is unresolved.

## 5. Delivery-ledger-first target architecture

### 5.1 Event path

After the Host commits its authoritative transition and outbox intent, Receiver acceptance should
require only the event issuer and Receiver:

```text
Third-party or Website Backend
    -> authenticated Receiver ingress
    -> Grant and event-type validation
    -> idempotency check
    -> durable PENDING delivery record
    -> immediate acknowledgement to the sender
```

Codex does not need to be connected for this path to succeed. If the Receiver is temporarily
unable to commit the item, the sender receives a failure and may retry; the Receiver must not
acknowledge an event before its durable state is committed.

### 5.2 Activation path

Activation is asynchronous and replaceable:

```text
PENDING delivery record
    -> direct wake adapter, when a supported transport exists
    -> otherwise bounded scheduled pull or approved local relaunch adapter
    -> bound Agent task becomes available
```

The activation adapter should carry only a safe correlation to the bound task. It should not carry
the full event payload, Inbox bearer, Grant secret, or page authority in a scheduler prompt.

### 5.3 Agent consumption path

When the task becomes available, the Agent should:

1. Re-enter the canonical page through the stored receipt or managed context.
2. Rediscover the current-stage genuine WebMCP Site Tools.
3. Read fresh authoritative workflow state.
4. Pull or acknowledge the pending queue item through the page-bound Inbox tool.
5. Continue only if the event is authorized, current, and applicable.
6. Apply an idempotent effect, acknowledge the delivery, and stop at the human boundary.

If the Agent or page is unavailable, the item remains pending or returns to a retryable state. The
event should not be silently discarded merely because one wake attempt failed.

## 6. Minimum Receiver delivery contract

One status field should not conflate event acceptance, delivery ownership, wake attempts, Agent
execution, and Host effects. A clearer minimum model separates four ledgers:

```text
Event:        ACCEPTED | REJECTED | EXPIRED
Delivery:     PENDING -> LEASED -> ACKNOWLEDGED
                 |          |
                 +-> RETRYABLE -> DEAD_LETTER
Wake attempt: QUEUED -> DISPATCHED | FAILED | COALESCED
Host effect:  NOT_APPLIED -> APPLIED
```

`ACKNOWLEDGED` is terminal. A lost acknowledgement is recovered through delivery-lease expiry and
idempotent effect lookup before terminal acknowledgement; it must not transition an acknowledged
delivery back to retryable. Expiry or dead-letter handling may occur before Agent processing, not
only after it starts.

Each item should be bound to at least:

- an authenticated event identifier and idempotency key;
- the Grant and workflow binding;
- an allowlisted event type;
- creation time, expiry time, and delivery-attempt metadata;
- a claim lease or visibility timeout;
- an acknowledgement or effect receipt reference;
- a bounded retry/dead-letter policy.

The intended guarantee is **durable at-least-once delivery with idempotent effects**. The delivery
ledger may expose an item more than once after a lease or acknowledgement failure, but the Website
effect must converge to one result for the same idempotency key.

The delivery ledger should contain enough information to select and authorize work, not replace
the Website Backend as workflow authority. The Agent must still read the page's current state
before acting.

For the current single-consumer happy-path MVP, the existing `heartbeat_deliveries` record is
enough to demonstrate durable pending work and idempotent acknowledgement. Add a claim lease only
when testing concurrent consumers or crash recovery; do not build a production broker before the
runtime topology is selected.

## 7. Heartbeat policy for the current MVP

The MVP can keep the scheduled Heartbeat, but it should be explicitly bounded and treated as an
adapter:

- Use a one-shot or short lease-bound schedule for a validation arm.
- Arm it only while the Grant is valid and the test target is intentionally active.
- Prefer one watcher per bound inbox or task over one perpetual watcher per event.
- Stop or pause it after a successful acknowledgement, expiry, revocation, or terminal failure.
- Do not put URL, Grant, event, bearer, or opaque binding values in the prompt.
- Record dispatch, retry, and acknowledgement separately so an empty poll is not reported as
  delivery.
- Treat missed-run catch-up, closed-app dispatch, and scheduler retries as separate experiments.

This is sufficient to demonstrate the pull adapter without making it the permanent architecture.
The final product narrative should say that the Receiver preserves work and the Agent resumes on
its next available or signalled turn.

## 8. D4 mapping and priority

D4 is an optional compatibility experiment for one local scheduled-pull topology: the Receiver
remains alive while the Desktop host disappears and an external test helper later relaunches it.
It is not the architecture-defining wake test and is no longer the highest-leverage next step.

### D4 no-event arm

- Close and relaunch Desktop under external observation.
- Allow one scheduled turn after relaunch.
- Require the Agent to inspect the Receiver Inbox and stop with no event and no workflow effect.

This checks that re-entry does not cause an unauthorized continuation.

### D4 event arm

- Close Desktop while the Receiver remains available.
- Accept one authenticated event into the Receiver's pending state.
- Relaunch Desktop and allow the bound task to pull the event.
- Require fresh page authority, one idempotent effect, one acknowledgement, and a stop before
  `COMMIT_ARTIFACT`.

This would check the delivery-ledger pull path across a Desktop availability boundary.

### What a D4 pass would and would not prove

A valid D4 pass would support the claim that the current client can perform Receiver-backed,
scheduled re-entry after a same-machine Desktop restart. It would not prove:

- direct Receiver-to-Thread push wake;
- a public or stable Codex API contract;
- machine reboot, sleep, offline catch-up, or cross-device recovery;
- production daemon availability or multi-user isolation;
- the value of a selected domain application.

The first formal no-event attempt remains `INCONCLUSIVE`, and the event arm was never run. Freeze
D4 at that result. Rerun it only if the team later selects a local connector or relaunch adapter
whose product contract makes same-machine Desktop restart recovery material.

## 9. Open questions that still require validation

1. **App Server Browser join:** Can an exact `thread/resume` plus `turn/start` regain an eligible
   Browser, open the stored canonical URL, and genuinely invoke a page-bound WebMCP Site Tool
   without the private relay, Scheduled Heartbeat, DOM automation, REST, or substitute tools?
2. **Workspace Agent topology:** If App Server cannot perform that join, can a published Workspace
   Agent receive an external trigger and reach an equivalent genuine page-bound WebMCP surface?
   This would be a different runtime claim, not continuation of an arbitrary local Desktop task.
3. **Local Desktop wake:** If the product requires the existing Desktop task, is a supported local
   connector contract available, or would the product depend on an undocumented bridge?
4. **Closed-app scheduler semantics:** If bounded Heartbeat remains a fallback, what happens to a
   one-shot while Desktop is closed, and can missed-run catch-up be distinguished from dispatch?
5. **Wake adapter ownership:** Should relaunch and wake belong to a local OS agent, the Receiver,
   or a platform-provided scheduler?
6. **Delivery claim protocol:** Can claim, retry, acknowledgement, and idempotent effect receipts be
   recovered safely after Receiver, Agent, or Browser failure?
7. **Binding lifecycle:** How are Grant expiry, revocation, task deletion, and queued events fenced
   against a late wake?
8. **Latency and economics:** What watch-window, polling, and wake costs are acceptable for the
   target product, and when does a push adapter become necessary?
9. **Multi-event ordering:** Should events be ordered per workflow, coalesced, or independently
   processed when several events arrive while the Agent is unavailable?
10. **Fresh authority:** How does the Agent prove that a page re-entry is current and bound to the
   same workflow rather than merely opening a URL with stale context?

## 10. Recommended documentation position

Until a production Agent adapter is selected, Core documents should use this claim boundary:

> The Host Backend owns authoritative business state. The Receiver owns a durable authenticated
> delivery inbox. A bound Agent resumes through an available continuation adapter, re-enters the
> authoritative page, and uses fresh genuine page-bound WebMCP Site Tools to continue. The current
> MVP proves one bounded scheduled-pull adapter; production transport remains unselected.

Avoid these stronger, currently unsupported statements:

- “The Receiver directly wakes any Codex Thread.”
- “Every Grant requires a permanent Heartbeat.”
- “The scheduler guarantees delivery while Desktop is closed.”
- “The event is exactly-once delivered.”

Do not create a new ADR merely to restate the already accepted separation in ADR-0004. Create or
update an ADR when the team selects a concrete Agent adapter, changes authority ownership, or
commits to delivery-lease semantics beyond the current MVP. This report itself is supporting
analysis and does not select a final host application, domain, or platform transport.

## References

- [`ADR-0004`](../Decisions/ADR-0004-separate-event-protocol-from-agent-transport.md) — separates the project-owned event protocol from platform-specific Agent transport.
- [`Research 07`](07-supported-reentry-transport-and-heartbeat-spike.md) — official capability boundary and scheduled re-entry spike.
- [`Research 09`](09-heartbeat-business-viability-and-bounded-use.md) — bounded Heartbeat economics and production claim limits.
- [`Research 16`](16-scheduled-pull-unit-economics-and-transport-kill-model.md) — polling economics and transport kill conditions.
- [`D4/H2b runbook`](../../mvp/D4_H2B_RUNBOOK.md) — current Desktop restart and independent Receiver validation protocol.
- [`First formal D4 attempt`](../../mvp/evidence/d4-h2b-first-formal-no-event-inconclusive-2026-08-30.md) — preserved `INCONCLUSIVE` restart attempt.
- [Codex App Server](https://learn.chatgpt.com/docs/app-server) — documented exact thread resume and turn start; Browser/WebMCP join remains unproven.
- [Workspace Agents API](https://learn.chatgpt.com/workspace-agents/trigger-runs) — documented server-side trigger, durable queue, idempotency, and stable conversation key for published Workspace Agents.
- [Scheduled Tasks](https://learn.chatgpt.com/docs/automations) — documented same-chat scheduling and current Desktop/app-availability boundary.
