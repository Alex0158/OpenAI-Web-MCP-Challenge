# Implementation Template

## Intended behavior

`<Observable contract after the change.>`

## Ownership

- Owning mechanism, chain, or capability: `<IDs and links>`
- Owning contract section: `<link and section>`
- Affected code and data owners: `<paths>`
- Existing unrelated changes: `<inventory and preservation rule>`

## Current evidence and failure proof

- Reproduction or failing test: `<evidence>`
- If no automated failure proof: `<equivalent evidence and its limitation>`

## Affected surfaces

- World authority and ownership checks: `<impact>`
- Identity and revisions: `<impact>`
- Cargo, coin, and settlement: `<impact>`
- World clock, due-work order, and replay: `<impact>`
- Persistence, snapshot, and outbox: `<impact>`
- Page, command, WebMCP, and Re-entry boundary: `<impact>`
- Explicitly unaffected: `<surfaces>`

## Plan

1. `<smallest coherent reversible change>`
2. `<targeted verification>`
3. `<authority regression: duplicate, stale, replay, restart, race, exactly-once>`
4. `<current-truth and evidence update>`

## Test-driven loop

- Red: `<failing contract test or equivalent failure proof before implementation>`
- Green: `<smallest implementation that makes the focused proof pass>`
- Refactor: `<behavior-preserving cleanup after green, with rerun result>`
- Exception and limitation: `<why an automated red phase was not feasible, if applicable>`

## Stop and recovery

- Stop if: `<condition>`
- Rollback or forward remediation: `<path>`

## Execution receipt

- Exact files changed: `<list>`
- Commands run: `<record>`
- Unrelated changes preserved: `<evidence>`

## Verification

- Level 1 static: `<result>`
- Level 2 targeted: `<result>`
- Authority regression: `<result>`
- Higher levels: `<result or explicitly not run>`

## Record and closure

- Updated truth: `<paths>`
- Evidence: `<SK-EVID-* and paths>`
- Closure label: `<exact label>`
- Residual risk and owner: `<risk>`
- Reopen trigger: `<condition>`
