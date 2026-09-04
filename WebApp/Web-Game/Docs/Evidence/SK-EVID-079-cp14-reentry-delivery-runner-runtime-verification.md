# SK-EVID-079: CP-14 Re-entry Delivery Runner Runtime Verification

## Identity

- Evidence ID: `SK-EVID-079`
- Related task, issue, or decision: [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md), [`TASK-036`](../../../../Docs/Tasks/TASK-036-implement-standing-notification-handoff.md), [`ADR-0049`](../../../../Docs/Decisions/ADR-0049-game-team-standing-integration-and-eyad-release.md)
- Evidence class: `contract`
- Ladder level: `2`
- Executor and date: Project team, 2026-09-04

## Exact identity under test

- Source state: Outer repository `main` at `217df3d` with the runner, entrypoint wiring, and focused
  test in the working tree. Existing collaborator changes remain uncommitted and were preserved.
- Contract version: `SK-MVP-0.2`; Game persistence schema `9` / migration `cp14-001`.
- Runtime versions: Node `v24.20.0`; Game package `tsx` test runner; no Browser, Receiver network,
  Connector process, hosted origin, or production secret.
- Fixture world and seed: synthetic runner world `world-1`; no gameplay fixture or external identity
  is used because this record tests the process lifecycle contract only.
- Environment and configuration: injected fake `ReentryDeliveryPort` with deterministic wall clock
  and lease identity; the real entrypoint owns the worker observer and shutdown ordering.

## Objective and claim boundary

- Behavior under test: one server-owned `ReentryDeliveryRunner` starts with the runtime, receives
  startup and authoritative-boundary wakeups, invokes the existing durable `ReentryDeliveryPort.pumpOnce`
  at most once at a time, coalesces additional wakeups, exposes typed pump failures, and drains
  before worker shutdown.
- Claim this evidence may support: the Game has a narrow lifecycle driver that can service its
  existing outbox without creating a second queue, timer, world clock, or per-event Thread message;
  repeated wakes are coalesced while one pump is in flight and a failed pump remains observable for
  a later wake.
- Claims this evidence cannot support: construction of a production `StandingReentryTransport`,
  a public Receiver or package, a valid production binding/Grant, Connector claim or same-task
  admission, Agent wake, authenticated Browser/WebMCP access, Game effect, Cloud ACK, hosted
  continuity, or hackathon judge reproduction.

## Preconditions and fixture

- Starting state: a newly constructed runner in `created` state; no durable delivery is claimed by
  the fake port.
- Synthetic identities and seeded actors: `world-1` and `runner-lease-1` only.
- Real, fake, and stubbed boundaries: runner and entrypoint lifecycle code are real; the port is a
  deterministic test double, so no external HTTP or Receiver state transition is exercised.

## Execution

- Replayable commands or procedure:

  ```sh
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp14-runner
  ```

- Expected result: startup requests one wake; concurrent boundary wakes never create concurrent
  `pumpOnce` calls; a pump error is reported without relabelling it as success; stop rejects later
  wakes and waits for the in-flight pump before reaching `stopped`.
- Actual result: Game typecheck passed; the runner suite passed `4/4` tests covering coalescing,
  failure visibility, later wake, shutdown drain, and the entrypoint's authoritative-boundary wake
  filter.
- Status: `pass` for the named local lifecycle contract.
- Output location: command output was consumed in the task session; no credentials, task locators,
  lease tokens, or mutable database files were written to the repository.

## Assertions

- Player-visible state: the runner has no authority to mutate world time, soldiers, missions,
  cargo, coins, page state, or commands.
- Command and failure contract: only the existing port's typed `accepted`, `retryable`, terminal,
  or idle result is observed; runner failures are sent to the optional observer and never converted
  into an acknowledgement.
- Persistence, event, and outbox state: the runner supplies one process-owned Game publication
  lease identity to `pumpOnce`; the port remains responsible for durable claim/ack/retry/terminal
  transitions and external transport mapping.
- Exactly-once settlement after duplicate delivery and replay: the runner does not create or alter
  signal/event identities and does not retry an unknown response itself; the durable port remains the
  only settlement authority.
- Ownership denial, stale revision, restart, and reconnect: shutdown changes the runner generation,
  clears pending wakes, waits for the in-flight operation, and then prevents new wakes. Worker
  shutdown is chained after this drain.

## Analysis and closure

- Failure classification: `none` in the named local scope.
- Limitations and residual risk: the production entrypoint still needs an explicitly configured
  server-only binding resolver, standing Host SDK publisher, and legitimate same-task Adapter before
  this runner can be constructed for a hosted trace. No timer-based polling or hidden retry was
  introduced; a later implementation must preserve that boundary and avoid invoking remote HTTP at
  every 100 ms worker tick without a reviewed delivery-wake policy.
- Invalidation triggers: changes to worker lifecycle, `ReentryDeliveryPort` claim/ack semantics,
  Game schema or outbox shape, protocol-v0.2 identity/sequence rules, Node/runtime, or the runner
  coalescing and shutdown behavior invalidate this record.
- Exact conclusion: the local Game delivery runner lifecycle is implemented and passes its focused
  contract checks. It is ready to be composed with an exact source-pinned transport after the
  production binding/provider and same-task Adapter gates are satisfied; it is not hosted or Agent
  delivery evidence.
