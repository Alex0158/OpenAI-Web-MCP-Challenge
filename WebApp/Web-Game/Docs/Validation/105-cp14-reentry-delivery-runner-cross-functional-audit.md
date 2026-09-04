# CP-14 Re-entry Delivery Runner Cross-Functional Audit

**Status:** LOCAL RUNNER LIFECYCLE VERIFIED; PRODUCTION COMPOSITION AND HOSTED GATES OPEN  
**Date:** 2026-09-04  
**Task:** [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md)  
**Evidence:** [`SK-EVID-079`](../Evidence/SK-EVID-079-cp14-reentry-delivery-runner-runtime-verification.md)  
**Governing task:** [`TASK-036`](../../../../Docs/Tasks/TASK-036-implement-standing-notification-handoff.md)  
**Decision:** [`ADR-0049`](../../../../Docs/Decisions/ADR-0049-game-team-standing-integration-and-eyad-release.md)

## Audit question

Does the Game have a safe process-owned driver for the existing Re-entry outbox, and does its
lifecycle avoid turning a high-frequency world clock into a second queue or a flood of Thread
messages?

## Source and environment identity

- Outer repository: `main` at `217df3d`; runner and entrypoint changes remain in a shared working
  tree with unrelated collaborator changes.
- Game: Node `v24.20.0`, `SK-MVP-0.2`, schema `9` / `cp14-001`.
- Test boundary: injected deterministic port and clocks; no Receiver, Connector, Browser, hosted
  endpoint, or production credentials.

## Cross-functional audit

| Boundary | Verified local behavior | Residual gate before hosted claim |
|---|---|---|
| Worker/world clock | `WorldWorker.onAdvance` is an observer only; completed authoritative world boundaries request a delivery wake without changing world time. Interpolation ticks do not request delivery. | A production trace must show the runner uses the configured world identity and does not advance or recover the world itself. |
| Frequency/backpressure | One `pumpOnce` is in flight at a time; repeated boundary wakes become one pending wake and do not enqueue one operation per event. | Measure the hosted boundary-wake policy and confirm no Receiver HTTP request is made for a 100 ms interpolation tick or when no slot is pending. |
| Game outbox | The existing `ReentryDeliveryPort` remains the sole claim/ack/retry/terminal authority and receives one process-owned Game lease identity. | Compose it with the actual schema-9 store and prove accepted, retryable, terminal, unknown, and expired-lease paths against the exact Receiver contract. |
| Transport | Runner observes only the port result; it cannot see or settle Cloud leases, Connector claims, handoff receipts, Agent wake, or effects. | Construct the port with a server-only standing binding resolver and Host SDK publisher using source-pinned artifacts; no browser or prompt secret may enter the path. |
| Error handling | Pump errors are reported to an observer and do not become success; a later explicit wake can retry through the durable port. | Hosted operations must record error code, delivery identity, and claim ceiling without blind resend or unknown-to-success conversion. |
| Shutdown | Runner enters `draining`, clears pending wakes, waits for in-flight work, then worker shutdown proceeds; wakes after drain are ignored. | Hosted shutdown/readiness evidence must show no new publication starts after drain and no in-flight lease is falsely acknowledged by process exit. |
| External continuation | No local runner result claims same-task admission or downstream action. | Eyad's release must provide a qualified existing-task Adapter, Receiver handoff receipt, authenticated page read, WebMCP evidence, and any effect as separate observations. |

## Verification readback

The named local checks passed as recorded in [`SK-EVID-079`](../Evidence/SK-EVID-079-cp14-reentry-delivery-runner-runtime-verification.md):

- Game Node 24 typecheck passed.
- `test:cp14-runner` passed `4/4`, covering single-flight coalescing, error visibility with a
  later wake, shutdown drain, and the entrypoint's authoritative-boundary wake filter.

These are contract-level lifecycle results. They do not replace the standing Event transport result
in [`SK-EVID-078`](../Evidence/SK-EVID-078-cp14-standing-event-transport-runtime-verification.md)
or raise its hosted/same-task claim ceiling.

## Acceptance and stop matrix

Advance this increment only when all of these remain true:

1. The runner is the only Game-side delivery driver; no second queue, timer, worker, or per-event
   Thread message is added.
2. The port still owns durable claim, lease, retry, settlement, and unknown outcomes; the runner
   never acknowledges a delivery by process exit or natural-language Agent output.
3. The production constructor receives a server-only binding/provider/publisher composition and
   fails closed when that composition is absent; no fixture binding or client-selected identity is
   promoted.
4. Remote polling or wake frequency is bounded by completed world boundaries plus startup recovery;
   no autonomous 100 ms interpolation tick becomes a network request without a pending delivery
   policy.
5. Shutdown/readiness evidence proves in-flight work drains before worker/store close and that a
   late wake cannot start another operation.

Stop if a runner result is interpreted as notification handoff, Agent wake, page/WebMCP use, effect,
or ACK; if the runner adds a hidden retry/timer; if a Cloud lease crosses into Game code; or if a
production construction requires raw task locators, credentials, or prompts.

## Audit decision

The Game-side runner is a coherent, minimal lifecycle seam at ladder level 2. It closes the process
driver preparation needed to keep the durable outbox live, but it does not close production transport
composition, exact cross-repo conformance, same-task admission, hosted deployment, Browser/WebMCP,
or Game-effect evidence. Those remain the next bounded implementation and Eyad release gates.
