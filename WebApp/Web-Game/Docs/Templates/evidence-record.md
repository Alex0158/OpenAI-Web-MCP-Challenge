# Evidence Record Template

## Identity

- Evidence ID: `SK-EVID-NNN`
- Related task, issue, or decision: `<IDs>`
- Evidence class: `<static | contract | aggregate | process-runtime | slice-chain | capability | hosted>`
- Ladder level: `<1-7>`
- Executor and date: `<who and when>`

## Exact identity under test

- Source state: `<commit or working-tree identity>`
- Contract version: `<SK-MVP-*>`
- Runtime versions: `<Node, browser, database, and any other executed runtime>`
- Fixture world and seed: `<seed>`
- Environment and configuration: `<identity>`

## Objective and claim boundary

- Behavior under test: `<contract and owning section>`
- Claim this evidence may support: `<exact claim>`
- Claims this evidence cannot support: `<limits>`

## Preconditions and fixture

- Starting state: `<state>`
- Synthetic identities and seeded actors: `<identities>`
- Real, fake, and stubbed boundaries: `<classification>`

## Execution

- Replayable commands or procedure: `<steps>`
- Expected result: `<result>`
- Actual result: `<result>`
- Status: `<pass | fail | gated | skipped | expected-fail | flaky | not-run>`
- Output location: `<path or reference>`

## Assertions

- Player-visible state: `<assertion>`
- Command and failure contract: `<assertion>`
- Persistence, event, and outbox state: `<assertion>`
- Exactly-once settlement after duplicate delivery and replay: `<assertion>`
- Ownership denial, stale revision, restart, and reconnect: `<assertion>`

## Analysis and closure

- Failure classification: `<product | test | fixture | environment | evidence | unknown>`
- Limitations and residual risk: `<limits>`
- Invalidation triggers: `<changes that void this record>`
- Exact conclusion: `<bounded statement>`
