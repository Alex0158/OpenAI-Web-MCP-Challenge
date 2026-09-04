# ADR-GAME-0040: Authorize Cross-Stack CP-14 Implementation with Eyad Release Handoff

**Status:** Accepted owner decision; implementation open  
**Date:** 2026-09-04  
**Scope:** Sleepless Kingdom CP-14 adapter and its coordinated outer Re-entry implementation

## Context

ADR-GAME-0038 records that the Game-facing Re-entry source is already in outer `main`, while the
Cloud Receiver remains in the separate `saas-boilerplate` boundary. ADR-GAME-0039 adopts the same
existing-task notification target and keeps queue acceptance, notification handoff, Agent wake,
page read, optional action, and Game effect as separate observations. The current scoped task and
audit still describe external Core/Receiver/Connector implementation as an Eddy handoff gate.

The project owner has now authorized the current project team to implement the exact missing
cross-stack behavior. Eyad remains the final package publication and hosted deployment owner.

## Decision

1. The product and Game semantics in ADR-GAME-0039 remain unchanged. `CargoLostToMonster` remains
   the first signal; Game world authority, cooldown/coalescing, publication outbox lease, identity,
   revision, idempotency, page contract, and human boundary are preserved.
2. The outer [TASK-036](../../../../Docs/Tasks/TASK-036-implement-standing-notification-handoff.md)
   may implement the shared Core, Host SDK, Local Connector, and Receiver surfaces required to
   satisfy CP-14. The Game child may implement only its own mapping, persistence, transport adapter,
   tests, evidence, and documentation under this tree.
3. `reentry-core/` and `mvp/` remain read-only dependencies from the Game project's perspective.
   Shared-source edits happen at the outer repository boundary and are consumed only after their
   exact contract and tests are reviewed.
4. Same-task continuation is mandatory. A missing or unsupported legitimate task-admission path is
   a visible residual gate. The adapter must not search for another task, create a fresh task, or
   substitute the historical local fresh-session preview.
5. The Receiver may settle the additive finite-v0.2 notification profile at trusted handoff. It
   must not reuse effect-backed ACK or `effect_token`, wait for a Game effect, or report Agent/page/
   WebMCP observations as part of the handoff receipt.
6. Eyad receives the immutable release packet and performs package publication and hosted deployment
   only after local conformance, security, and source-identity gates pass. The Game must not claim
   hosted or published status from source presence or an attempted deployment.

## Cross-boundary contract

The Game maps one durable eligible signal to one approved server-side Receiver binding. It supplies
only contract-approved event identity, positive external sequence, stable occurrence time, workflow,
causal state version, scope, and canonical URL. The mapping never carries Connector credentials,
leases, private task locators, signing keys, prompts, or arbitrary payloads. The Game owns its
publication lease; the Receiver owns its delivery lease; the Connector owns local task admission.

The minimum CP-14 trace proves two ordered signals under one Consent/Grant/task, response-loss and
restart identity recovery, one-active/backpressure, revocation, wrong-scope denial, same-task wake,
authenticated page read, genuine WebMCP discovery, and separate action/no-action/interruption
outcomes. A local queue response is not any of those later observations.

## Consequences

This removes the external coding dependency for the current increment and lets the team close a
single vertical path against one reviewed contract. It increases our responsibility for shared
authority, schema, and release-artifact correctness. The exact route, receipt, migration, and
runtime attestation remain controlled by outer ADR-0049/TASK-036; this Game ADR does not invent a
second Game-side protocol.

## Alternatives rejected

- **Game-only adapter with Eddy-only external implementation:** preserves ownership separation but
  leaves the selected path blocked at an unverified handoff and does not satisfy the owner's current
  delivery objective.
- **Fresh-session preview:** easier to invoke but fails the accepted same-task continuity target.
- **Effect-backed completion:** conflicts with notification-only settlement and rejects legitimate
  no-action or interrupted Agent work.

## Reopen trigger

Reopen before implementation expands if the shared runtime requires different task custody,
client-selected identity, a new Game authority, a changed event/cooldown policy, an effect-backed
completion guarantee, or a v0.3 lifetime migration. Reopen at closure if hosted source/package
readback does not match the reviewed release packet.
