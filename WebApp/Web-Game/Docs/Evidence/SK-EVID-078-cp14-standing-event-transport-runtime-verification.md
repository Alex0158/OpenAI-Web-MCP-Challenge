# SK-EVID-078: CP-14 Standing Event Transport Runtime Verification

## Identity

- Evidence ID: `SK-EVID-078`
- Related task, issue, or decision: [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md), [`TASK-036`](../../../../Docs/Tasks/TASK-036-implement-standing-notification-handoff.md), [`ADR-0049`](../../../../Docs/Decisions/ADR-0049-game-team-standing-integration-and-eyad-release.md)
- Evidence class: `contract`
- Ladder level: `2`
- Executor and date: Project team, 2026-09-04

## Exact identity under test

- Source state: Outer repository `main` at `217df3d`; the Game standing transport and related source
  changes are in the working tree and remain uncommitted. The nested Receiver is a separate
  `saas-boilerplate` repository on `Re-Entry` at `0195a9846024c4f65c62d3922069970ad1b96b92` with
  the additive standing changes in its working tree. Existing collaborator changes were preserved.
- Contract version: `SK-MVP-0.2`; protocol profile `0.2`; Game persistence schema `9`, migration
  `cp14-001`.
- Runtime versions: Node `v24.20.0` for the Game and focused outer-package checks; disposable
  PostgreSQL for the Receiver handoff slice; no browser, hosted endpoint, or production runtime.
- Fixture world and seed: Game fixture `cp14-standing-world`, seed `sleepless-mvp-01`, one shelter
  `shelter-a`, one opaque binding `binding-a`; all identifiers are synthetic.
- Environment and configuration: Game file-backed SQLite fixture; Receiver task-owned loopback
  PostgreSQL database with the two named standing migrations applied. No secret values are recorded.

## Objective and claim boundary

- Behavior under test: server-only mapping of eligible `CargoLostToMonster` signals to strict
  standing v0.2 Event inputs, durable per-binding sequence/context, stable retry identity, and
  narrow queue-acceptance settlement across Game, Core/SDK/Connector, and Receiver contract seams.
- Claim this evidence may support: the named local contract checks accept the strict shape and
  preserve Event identity, sequence, occurrence time, causal version, scope, and queue-acceptance
  boundary in the tested fixtures.
- Claims this evidence cannot support: public package publication, deployed Receiver/source
  identity, production Consent/Grant or binding, Connector process wiring, same-task runtime wake,
  authenticated Browser/WebMCP access, Host effect, Cloud ACK, two-player isolation, or hackathon
  judge reproduction.

## Preconditions and fixture

- Starting state: one persisted Game world and shelter; no pre-existing standing Event context.
- Synthetic identities and seeded actors: one Game player/shelter and two ordered synthetic
  `CargoLostToMonster` transitions under the same binding.
- Real, fake, and stubbed boundaries: Game persistence and mapper are real local code; Event
  publisher and binding resolver are strict injected test doubles; Receiver PostgreSQL tests use a
  disposable loopback database. Receiver app composition was also checked with a typed server-side
  runtime-authority seam; no external network or Agent process was used.

## Execution

- Replayable commands or procedure:

  ```text
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp14-cloud
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp14-causal
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp16-page-recall
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp05
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp08
  ```

  The outer package checks were run from their package directories with Node 24 using the focused
  notification-handoff/runtime-admission, standing Host SDK, and Connector selections recorded in
  [`TASK-036`](../../../../Docs/Tasks/TASK-036-implement-standing-notification-handoff.md). The
  Receiver slice applied `20260904000000_pairing_claim_rate_limit` and
  `20260904010000_standing_notification_handoff` to the disposable PostgreSQL target before its
  focused five-suite run.
- Expected result: strict typed inputs, positive ordered sequence, canonical timestamp, replay of
  the same signal without a new sequence, visible unknown/retryable outcome, and no Game mutation
  outside the publication boundary.
- Actual result: Game typecheck passed; CP-14 transport `5/5`, causal trace `1/1`, page recall `1/1`,
  CP-05 `26/26`, and CP-08 `4/4` passed. Core full checks passed `174/174`; Host SDK standing
  checks passed `27/27`; Connector full verification passed `72` with `12` explicit opt-in v0.2
  skips; Receiver focused verification passed `5` suites / `53` tests, and its standing HTTP
  composition suite passed `21/21` including default fail-closed and explicit authority injection.
  A subsequent five-file standing selection passed `80/80` with the task-owned disposable
  PostgreSQL credentials supplied only through the process environment.
- Status: `pass` for the named local contract scope.
- Output location: command output was consumed in the task session; no raw credentials, tokens,
  private task locators, or mutable database files were written to the repository.

## Assertions

- Player-visible state: transport outcomes do not alter world time, soldier, mission, cargo, coins,
  or page projection.
- Command and failure contract: unsupported event type, scope mismatch, inactive/expired binding,
  unavailable causal Event, invalid occurrence, and malformed Receiver acceptance fail visibly with
  typed terminal or retryable outcomes.
- Persistence, event, and outbox state: schema `9` stores one context per signal and a contiguous
  per-binding sequence; `cursorEnd` is persisted as the causal `state_version`; occurrence is a
  canonical ISO timestamp; `signalId` remains the external `event_id`.
- Exactly-once settlement after duplicate delivery and replay: an ambiguous publisher result keeps
  the same Game delivery retryable and reuses the stored sequence/context; a valid response settles
  only the Game publication row as `receiver_queue_accepted`.
- Ownership denial, stale revision, restart, and reconnect: the mapper requires a server-resolved
  binding and persisted Event cursor; it does not accept browser-selected identity or carry Cloud
  lease/Connector credentials. Migration readback preserves the new tables after store reopen.

## Analysis and closure

- Failure classification: `none` in the named local scope.
- Limitations and residual risk: the Event publisher is injected locally; the Receiver authority is
  only an explicit composition seam and no real runtime authority is supplied in this evidence; no exact external HTTP
  exchange, same-task `admitNotification` implementation, process-to-Game wiring, hosted origin,
  production identity, Browser/WebMCP session, effect authority, or ACK was available. The local
  fresh-`codex exec` adapter remains compatibility preview evidence and is not a fallback.
- Invalidation triggers: any change to Game schema/event/signal contracts, standing v0.2 route or
  receipt fields, source/package identity, Node/runtime, fixture seed, migration, or mapping of
  sequence/occurrence/state version invalidates this record.
- Exact conclusion: the local additive standing Event transport contract is implemented and passes
  its focused checks. It is ready for exact source-pinned conformance and hosted handoff; it is not
  evidence of a deployed or same-task Re-entry runtime.
