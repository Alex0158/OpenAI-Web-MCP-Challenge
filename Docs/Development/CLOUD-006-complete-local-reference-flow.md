# CLOUD-006: Complete local reference flow

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Risk profile:** Assured — cross-process-style Host, Receiver, Connector, Agent, effect, consent,
and persistence boundaries  
**Status:** `locally_verified`  
**Opened:** 2026-09-01  
**Branch:** `codex/eyad-reentry-core-foundation`

> **Current disposition:** `DEPRECATED` for the Cloud Receiver implementation — this record is
> historical evidence only. The runtime it describes was retired by [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md);
> the reusable protocol path remains evidence, not a production integration.

## Objective

Provide one runnable local reference consumer that crosses the complete accepted protocol path:

```text
generic Host page
-> signed Manifest
-> paired Connector and Receiver-owned consent
-> scoped Grant and public binding
-> signed Host event
-> durable delivery and Connector lease
-> deterministic evidence-only Agent action
-> independent Host-effect proof
-> delivery acknowledgement
-> restart-safe acknowledgement replay
```

The falsifiable outcome is one command that emits every named handoff and finishes only after the
Host's visible draft changed, the Receiver acknowledged independently verified Host effect, a
second claim is idle, and acknowledgement replay survives a Receiver-store reopen.

## Authority and boundary

- TASK-003 owns the Cloud Receiver and Local Connector lifecycle.
- ADR-0007 through ADR-0014 own protocol, Receiver, delivery, Agent-adapter, and private-context
  boundaries.
- ADR-0011 permits a deterministic adapter as contract evidence but forbids it as a production
  fallback.
- ADR-0019 through ADR-0022 own the loopback service, pairing, Host-key, and consent previews.

This increment selects no Host product, production identity, public deployment, or Codex adapter.
It therefore does not require a new architecture ADR. The reference Agent is named and fenced as
evidence-only, and its result is never accepted as Host-effect proof.

## Implemented surfaces

- `runtime/reference-system/` — one generic Host page, reference Host authority, full-flow runner,
  tests, and operator instructions;
- `runtime/cloud-receiver/src/local-preview-composition.mjs` — explicit injection of a test Host-
  effect authority while the default preview continues to fail unsupported acknowledgement; and
- current Task and Development indexes after verification.

## Non-goals

- claim supported Codex Desktop wake, Browser acquisition, or genuine Agent-driven Site Tool use;
- turn the deterministic adapter into a hidden or automatic product fallback;
- select the final Host application or implement human-consequential submission;
- replace production authentication, TLS, deployment, backup, or multi-replica work; or
- commit, push, deploy, publish, or spend external resources.

## Falsifiers and stop conditions

- The adapter can acknowledge a delivery without a separate Host-effect token.
- The Host effect does not match the exact delivery, event, correlation, and workflow.
- The reference page exposes the human-consequence action as a Site Tool.
- Pairing, consent, or Host credentials appear in public logs or tracked state.
- The default local preview silently gains a successful effect authority.
- Restart loses the acknowledged delivery or permits a second pending claim.

## Verification result

The increment is locally verified on the repository's Node 24 baseline using Node `v24.20.0`:

1. `runtime/reference-system`: syntax passed and 2/2 complete-flow and human-boundary tests passed;
2. `runtime/cloud-receiver`: syntax passed and 19/19 tests passed;
3. `runtime/host-sdk`: 11/11 tests passed;
4. `runtime/local-connector`: syntax passed and 2/2 tests passed;
5. `reentry-core`: syntax, 79/79 tests, process-isolated conformance, and package verification
   passed; and
6. repository validator tests, repository validation, sensitive scans, direct new-file secret and
   English-only scans, and `git diff --check` passed.

An additional Node `v22.14.0` runtime smoke ran the one-command flow, held both services open, read
the visible Host state as `READY_FOR_HUMAN` with artifact revision 1 and no human commit, received
HTTP 200 from the Host page, and received HTTP 200 with `ready` from the reopened Receiver.

The strongest supported closure is `locally_verified` for the complete generic reference flow.
The deterministic Agent is evidence-only; no supported Codex/Desktop activation, live Agent-driven
Site Tool invocation, public deployment, production identity, or selected-Host claim is made.

No new ADR or Mechanism change was required because the implementation consumes the accepted
ports without changing their authority: the default preview still rejects Host-effect
acknowledgement, the injected Host authority independently verifies effect, and the adapter result
contains no effect token.

The work is uncommitted and unpushed in the existing dirty worktree. No Git index, remote, external
service, deployment, or credential state was changed.

## Next gate

After local closure, select and prove a supported real Agent-to-Browser-to-page-bound-WebMCP route,
then select the first real Host application and production deployment profile.
