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

## Recommendation

Add an explicit v0.3 notification-handoff profile. Keep the existing effect acknowledgement route
and its `effect_token` semantics for retained compatibility callers; do not reinterpret an old
`acknowledged` row as notification success. A v0.3 delivery may reach terminal `notified` only when
the paired Connector and its private Agent Adapter have durably accepted one bounded notification for
the exact bound task. The Receiver must not wait for a later Agent turn, Browser read, Game mutation,
or business result.

The trusted chain is:

```
signed Event -> Receiver Delivery -> paired Connector -> private Adapter inbox -> bound task
                                      durable handoff receipt
```

The Adapter's `accepted` result is sufficient only when the Adapter contract says that it means a
durable, idempotent enqueue into the bound task's private notification inbox. A generic process
accept, a Codex exit code, narration, HTTP health, or a scheduled poll is not that receipt.

## Proposed wire profile

The new profile is additive and versioned. The exact route name is still subject to implementation
review; this proposal uses `POST /v0.3/delivery-handoffs` as a readable placeholder.

Request fields are deliberately opaque and bounded:

```json
{
  "connector_token": "private connector credential",
  "delivery_id": "receiver delivery id",
  "lease_token": "current delivery lease",
  "handoff": {
    "type": "bound_task_notification",
    "version": "0.3",
    "handoff_id": "connector-generated idempotency key",
    "outcome": "bound_task_queued"
  }
}
```

The Connector supplies no raw task locator, account secret, effect credential, or browser authority.
The Receiver resolves the bound task from its private binding record. `outcome` is restricted to
`bound_task_queued` and `bound_task_coalesced`; the second value means a notification for the same
bound task and delivery was already present and is an idempotent success. An Adapter must not report
success before its durable inbox write (or the equivalent durable coalescing record) commits.

The response contains no secret and is safe to repeat:

```json
{
  "profile": "0.3",
  "delivery_id": "...",
  "handoff_id": "...",
  "notified": true,
  "duplicate": false
}
```

`duplicate: true` is still a terminal notification receipt for the exact same correlation. It is
not permission to acknowledge another delivery or to change a task binding.

## Trust and correlation requirements

Before accepting a handoff the Receiver must, in one bounded operation:

1. authenticate the paired Connector identity;
2. re-read the current delivery lease and require the exact `delivery_id` and `lease_token`;
3. require the delivery's Grant, Event, target, consent, and binding scope to be current;
4. require the private Adapter binding to resolve to the same existing task and owner;
5. verify `handoff.type`, profile version, and `handoff_id` syntax and replay state; and
6. record the receipt and release the v0.3 delivery slot only after the Adapter's durable acceptance.

The Connector identity is necessary but not sufficient: a Connector paired to another task, a stale
worker, a revoked Grant, a mismatched Event, and a lease from another target must all fail closed.
The Agent receives only the bounded notification payload and fresh Host entry point defined by the
binding; it never receives Receiver credentials or an instruction to impersonate user intent.

## State and transaction boundary

The v0.3 state machine is isolated from retained effect profiles:

```
PENDING -> LEASED -> NOTIFIED
             |          |
             +--expiry--+--exact replay returns the same receipt
```

An implementation should lock or compare-and-set the delivery, re-check lease and revocation inside
the transaction, look up an existing handoff by `(delivery_id, handoff_id)`, and return the prior
receipt on an exact replay. A conflicting handoff id, different delivery, or different target is a
typed denial. The receipt and slot release must be durable together; a crash cannot expose `NOTIFIED`
without the stored receipt, nor release a slot before the handoff is durable.

No existing v0.1/v0.2 query, `acknowledged` field, effect token, or retry counter should silently
change meaning. New rows or a version discriminator are preferred so old consumers cannot claim a
notification they did not understand.

## Failure and recovery matrix

| Condition | Receiver result | Connector/Adapter action |
|---|---|---|
| Connector identity conflict | typed denial; delivery remains recoverable | stop and surface pairing mismatch |
| Wrong task, Grant, Event, target, or consent | typed denial; no slot release | do not retry unchanged request |
| Stale or expired lease | typed denial; normal bounded reclaim applies | reacquire only through the normal claim path |
| Revoked binding or Grant | terminal denial; no notification | stop and require fresh consent/binding |
| Adapter durable enqueue succeeds, response is lost | retry exact `(delivery_id, handoff_id)` | return the stored receipt; never create a second inbox item |
| Adapter unavailable before durable enqueue | retryable handoff failure; lease remains bounded | retry within the explicit Connector budget |
| Adapter returns unknown outcome | do not mark `NOTIFIED` | reconcile by exact handoff id or let lease expiry reclaim |
| Receiver restarts after durable receipt | stored receipt is returned | Connector retries exact request |
| Existing v0.2 caller | old route and semantics remain | no automatic profile mixing |

Retry limits, backoff, and the meaning of an unknown outcome must be accepted with the profile. A
retry must be bounded and idempotent, not a loop that prevents the Agent from working. Busy-task
coalescing is part of the Adapter inbox contract; it is separate from Receiver delivery state and
must not be inferred from an HTTP 2xx alone.

## Cross-module ownership

- **Host/SDK:** creates the user-consented binding request and displays only a safe continuation
  status; it does not mint a notification receipt.
- **Receiver:** owns Grant/Event correlation, lease, revocation, receipt, and slot release.
- **Local Connector:** owns private credential custody, exact handoff retry journal, and no raw
  secret in logs or Agent input.
- **Agent Adapter:** owns task lookup and the durable, idempotent private inbox; it reports accepted
  only after the inbox boundary.
- **Agent task:** decides whether to act after reading fresh Host state; notification is an input,
  not proof that work occurred.
- **Game/Host application:** remains an optional business consumer and is outside delivery settlement.

## Minimum acceptance matrix

Before accepting this proposal and implementing it, prove at least:

1. one signed Event reaches the exact bound task and returns a durable `notified` receipt;
2. two Events for one Consent/task remain separately correlated and do not cross scopes;
3. exact replay after response loss is idempotent and releases only one slot;
4. stale lease, wrong Connector, wrong task, revoked Grant, and conflicting handoff are denied;
5. Receiver and Connector restart recovery does not duplicate the private inbox item;
6. Adapter unavailable and unknown outcomes remain bounded and observable; and
7. retained v0.1/v0.2 effect acknowledgement and existing delivery queries still pass unchanged.

## Decisions still required

The owner must accept or revise: the final v0.3 route/profile name, the trusted Adapter inbox
attestation, `handoff_id` and receipt retention, retry/unknown-outcome budget, busy-task coalescing
semantics, slot release timing, and storage/migration compatibility. Implementation must not begin by
silently choosing these values in code.

## Non-goals and reopen triggers

This proposal does not solve Desktop admission, select a supported Agent runtime, provide a Browser
transport, publish a package, deploy a Receiver, or monitor business completion. Reopen it if the
private Adapter cannot prove durable task-scoped enqueue, if a new authority or transport is required,
if the Receiver must wait for business work, or if compatibility requires changing old effect ACK
semantics.
