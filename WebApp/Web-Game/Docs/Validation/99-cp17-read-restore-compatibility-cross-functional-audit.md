# CP-17 Read-Restore Compatibility Cross-Functional Audit

**Status:** LOCAL READ-RESTORE COMPATIBILITY VERIFIED; HOSTED ROLLBACK REMAINS OPEN  
**Date:** 2026-09-03  
**Checkpoint:** CP-17  
**Task:** [`SK-TASK-079`](../Tasks/SK-TASK-079-cp17-authenticated-cross-scope-denial-rehearsal.md)  
**Evidence:** [`SK-EVID-073`](../Evidence/SK-EVID-073-cp17-read-restore-compatibility-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Question and verdict

Can the preserved CP-17 SQLite operational copy be reopened through the same Game persistence code and
recover the same world and durable records without mutating the source artifact?

**Verdict:** Yes for the disposable local compatibility rehearsal. The original backup passed SQLite
integrity and foreign-key checks; a fresh copy opened through `PersistenceStore` on Node 24 with the
expected schema, WAL, and foreign-key settings; `recoverWorld` validated the snapshot and contiguous
event cursor; and the world, two shelter identities/economies, mission inventory, attempts, resources,
players, and `251` events were read back. The source backup hash remained unchanged. This does not
prove replacing or restoring the live Railway Volume.

## Evidence reviewed

- [`SK-EVID-073`](../Evidence/SK-EVID-073-cp17-read-restore-compatibility-runtime-verification.md): read-only source checks, disposable copy, real `PersistenceStore.open()`, `recoverWorld()`, bounded record readback, and source-hash preservation.
- [`SK-EVID-069`](../Evidence/SK-EVID-069-cp17-hosted-restart-backup-continuity-runtime-verification.md): hosted-origin backup creation, hash verification, restart continuity, and its explicit no-restore claim limit.
- [`SK-EVID-070`](../Evidence/SK-EVID-070-cp17-authenticated-cross-scope-denial-runtime-verification.md): local production-like ownership and no-mutation boundary.
- [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md): one-service, one-Volume, one-writer topology.

## Findings by decision impact

| Severity | Finding | Cross-functional effect | Disposition |
|---|---|---|---|
| Resolved | The preserved artifact passed `integrity_check` and had zero foreign-key violations | The recovery input is structurally readable before application-level validation | Retain the hash and source path in the redacted evidence packet |
| Resolved | The current Game `PersistenceStore` opened a disposable copy with schema `8`, contract `SK-MVP-0.2`, WAL, and foreign keys enabled | Hosted restart recovery uses the same schema and persistence implementation rather than a separate parser | Keep one persistence authority and fail closed on incompatible metadata |
| Resolved | `recoverWorld` returned the expected snapshot and `251` replay events with a contiguous world cursor | Snapshot hash validation and event replay can reconstruct the named world from the copy | Preserve snapshot/event cursor checks during future schema changes |
| Resolved | Both shelter identities and coin totals, player/roster/resource counts, missions, attempts, and events matched the source readback | Identity, economy, mission, and causal history remain present across a read-restore boundary | Treat this as compatibility evidence, not a live rollback claim |
| Resolved | The source backup hash was unchanged after the copy was opened and closed | The rehearsal cannot silently rewrite or corrupt the recovery source | Keep restore rehearsals on disposable copies |
| High | No Railway provider restore or live Volume replacement was attempted | Provider rollback mechanics, downtime, and post-restore admission remain unknown | Keep the hosted rollback row explicitly open unless a separately approved rehearsal is required |

## Cross-functional chain check

```text
hash-verified hosted-origin backup
  -> read-only SQLite integrity and foreign-key checks
  -> disposable copy
  -> Game PersistenceStore.open()
  -> schema/WAL/foreign-key compatibility
  -> recoverWorld() snapshot and event validation
  -> world, identity, shelter economy, mission, and event readback
  -> unchanged source hash
```

The chain passed through backup provenance, SQLite integrity, application persistence, snapshot/event
recovery, and identity/economy readback. It did not cross the live Railway restore boundary.

## Minimum next verification

Keep the current hosted Player A and Player B identities unchanged. If an approved authenticated
request seam becomes available, send exactly one foreign-soldier command per direction and capture the
typed `403`/`NOT_OWNER` response with no state change. A provider-level rollback remains optional and
must use a separately approved, reversible procedure; do not infer it from this local copy rehearsal.

## Claim limits and reopen triggers

This audit supports local read-restore compatibility at ladder level 4 and preserves the hosted
backup provenance already recorded at ladder level 6. It does not support a Railway provider restore,
production rollback, power-loss recovery, authenticated hosted denial, WebMCP dynamic action, Cloud
Receiver or Local Connector delivery, Agent wake, judge reproduction, or `hosted_verified` closure.
Reopen if the backup hash, source deployment, Volume topology, persistence schema, recovery validator,
or contract version changes.
