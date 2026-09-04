# CP-14 Standing Event Transport Runtime Cross-Functional Audit

**Status:** LOCAL ADDITIVE CONTRACT VERIFIED; EXTERNAL SAME-TASK AND HOSTED GATES OPEN  
**Date:** 2026-09-04  
**Task:** [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md)  
**Evidence:** [`SK-EVID-078`](../Evidence/SK-EVID-078-cp14-standing-event-transport-runtime-verification.md)  
**Governing task:** [`TASK-036`](../../../../Docs/Tasks/TASK-036-implement-standing-notification-handoff.md)  
**Decision:** [`ADR-0049`](../../../../Docs/Decisions/ADR-0049-game-team-standing-integration-and-eyad-release.md), [`ADR-GAME-0039`](../Decisions/ADR-GAME-0039-cp14-bound-task-notification-adoption.md)

## Audit question

Does the team-owned implementation connect the Game's real-time signal boundary to the standing
v0.2 contract without crossing authority, identity, retry, or claim boundaries, and is the remaining
work explicit enough for Eyad to publish and deploy the reviewed artifacts?

## Source and environment identity

- Outer repository: `main` at `217df3d`; the implementation increment remains uncommitted in a
  shared worktree containing unrelated collaborator changes.
- Game: Node `v24.20.0`, `SK-MVP-0.2`, schema `9` / `cp14-001`, synthetic file-backed SQLite fixture.
- Receiver: separate `saas-boilerplate` `Re-Entry` working tree based on `0195a9846024c4f65c62d3922069970ad1b96b92`,
  disposable loopback PostgreSQL with the two standing migrations applied.
- No hosted endpoint, public registry artifact, Browser session, or production secret was used.

## Cross-functional audit

| Boundary | Verified local behavior | Residual gate before hosted claim |
|---|---|---|
| Game event and signal | `CargoLostToMonster` remains the only selected signal; existing cooldown/coalescing and Game publication lease remain authoritative. | A live trace must prove the exact production event source and one-active burst behavior. |
| Event identity/order | `signalId` maps to `event_id`; schema-9 persistence allocates a positive contiguous per-binding sequence and replays the same context after response loss. | Cross-repo conformance must prove the same sequence, duplicate, gap, and out-of-order semantics against the designated Receiver. |
| Binding and scope | The mapper accepts only a server-side resolver result, checks Grant/event/origin/URL/status/expiry, and never puts raw task locators or lease credentials in Game data. | Enrollment must create the production binding and prove same-user, same-shelter, wrong-owner, revocation, and restart behavior. |
| Time and causality | `occurred_at` is canonical and durable; the selected eligible Event cursor is checked and persisted as `state_version`. | The release packet must freeze the production time conversion and page-read causal contract. |
| Receiver acceptance | Strict standing acceptance is mapped to the narrow `receiver_queue_accepted` boundary; terminal/retryable/unknown outcomes stay typed. | Exact Receiver HTTP/source conformance and hosted `202` readback are required; queue acceptance cannot be called wake or effect. |
| Receiver authority composition | The Receiver `createApp` accepts a server-side `standingRuntimeAdmissionAuthority` option, validates `verifyAdmission`, and leaves the default app fail-closed. | The deployed entrypoint must inject the real runtime/Adapter authority; an absent option is a deliberate capability failure, not a handoff success. |
| Receiver handoff | Local Receiver has an additive handoff route, attestation shape, controls, migration, and focused tests. | A runtime-owned same-task admission authority and an exact handoff receipt must be wired through the Connector and deployed Receiver. |
| Connector/Adapter | Local Connector derives stable `handoff_id`, accepts only a qualified runtime attestation, reports `unsupported`/`outcome_unknown`, and has no fresh-task fallback in the standing branch. | A legitimate Adapter must target the enrolled existing task, preserve the authenticated page context, and prove no fresh `codex exec` substitution. |
| Page/WebMCP and effect | Game and page contracts retain fresh scoped reads and optional `force_recall_soldier`; no local transport result claims them. | Hosted same-task wake, authenticated page read, genuine WebMCP discovery, no-action, optional action, and independent effect authority require separate evidence. |
| Release ownership | Implementation is team-owned; publication/deployment remains Eyad-owned under ADR-0049. | Source SHA, package/tarball integrity, migration, deployment identity, health/readiness, and hosted trace must be read back after Eyad's release. |

## Verification readback

The named local checks passed as recorded in [`SK-EVID-078`](../Evidence/SK-EVID-078-cp14-standing-event-transport-runtime-verification.md):

- Game typecheck; CP-14 transport `5/5`; causal trace `1/1`; page recall `1/1`; CP-05 `26/26`; and
  CP-08 `4/4`.
- Core full notification/runtime-admission checks `174/174`; Host SDK standing checks `27/27`;
  Connector full verification `72` passed with `12` opt-in skips; Receiver disposable
  PostgreSQL handoff/control slice `5` suites / `53` tests.

These results are focused contract evidence. They do not reopen or replace the prior full-suite
records, and the skipped or unavailable hosted/runtime boundaries remain unknown.

## Acceptance and stop matrix

The implementation may advance to Eyad's release packet only when all of these are true:

1. Core, Receiver, Host SDK, Connector, and Game source identities are pinned to exact SHAs or
   immutable package integrity; no `latest` or deprecated `runtime/cloud-receiver/` path is used.
2. Shared positive/negative vectors pass for Event signature, sequence, duplicate, replay, scope,
   expiry, revocation, one-active backpressure, handoff attestation, and response-loss behavior.
3. The production enrollment path creates one standing Consent/Grant and private binding to the
   already selected task; wrong-user, wrong-player, and stale/revoked bindings fail closed.
4. The deployed Receiver composition injects the real server-side runtime admission authority;
   the default app's missing-authority response remains fail-closed.
5. The Connector's Adapter returns a runtime-owned attestation for that existing task. A process
   exit, Connector credential, task locator, prompt, or natural-language response is insufficient.
6. A hosted trace records queue acceptance, notification handoff, same-task wake, page read,
   WebMCP discovery, no-action/action, and any effect/ACK as separate observations.
7. Eyad's deployment readback matches the packet and records rollback/stop conditions without
   exposing secrets.

Stop immediately if any route is guessed, an unknown response is relabelled success, a retry creates
a new Event or task, a second queue appears, a Cloud lease crosses into Game/page code, a credential
or raw task locator crosses into transport/prompt/URL/logs, or the hosted build cannot be matched to
the reviewed source.

## Audit decision

The team-owned local increment is coherent and contract-verified at ladder level 2. It closes the
Game-to-standing Event mapping preparation and provides a concrete source surface for conformance.
It does not close CP-14. The next bounded work is exact cross-repo conformance, legitimate same-task
Adapter wiring, and a redacted release packet for Eyad; publication and deployment remain separate
post-implementation gates.
