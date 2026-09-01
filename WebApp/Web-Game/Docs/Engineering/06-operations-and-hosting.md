# Operations and Hosting

**Status:** TARGET operations plan

## Always-on target

The hosted game needs an application worker, durable database, health endpoint, structured redacted
logs, metrics, and automatic process restart. The user-facing requirement is continuous world
progress and recoverable state, supported by infrastructure rather than an assumption that a process
can never fail.

## Recovery

A failed worker restarts, reads the persisted world clock, resumes due milestones, reclaims expired
leases, and replays unacknowledged outbox records. The deployment must keep migrations backward
compatible with the running snapshot and must preserve a redacted recovery receipt.

## Security and abuse boundary

Server-side ownership, rate limits, command idempotency, version checks, and battle authority are
mandatory. The browser cannot award coins, move a shelter, reveal hidden locations, or transform a
soldier. Secrets and private Agent context remain outside game records and public evidence.

## Proof gates

Before calling the game hosted, verify the actual endpoint, process health, database persistence,
restart recovery, world-clock continuity, command rejection, and a bounded end-to-end Re-entry event.
A local build or successful deploy command does not establish those facts.
