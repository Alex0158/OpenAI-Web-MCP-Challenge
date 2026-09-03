# SK-EVID-073: CP-17 Read-Restore Compatibility Runtime Verification

## Identity

- Evidence ID: `SK-EVID-073`
- Related task, contract, and decision: [`SK-TASK-079`](../Tasks/SK-TASK-079-cp17-authenticated-cross-scope-denial-rehearsal.md), [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md), [`SK-EVID-069`](SK-EVID-069-cp17-hosted-restart-backup-continuity-runtime-verification.md), [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md), and [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
- Evidence class: `process-runtime`
- Ladder level: `4` for reopening the hosted-origin artifact through the real Game persistence implementation; this is not provider-level restore evidence
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Game repository `main`, HEAD `93dd8ec` (`docs(game): reconcile cp17 task routing`)
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.20.0`; the repository `tsx` runner
- Backup artifact: `/tmp/sleepless-kingdom-cp17-pre-restart-20260903.sqlite`
- Backup SHA-256: `9d8448dc20f0e58ddc662354d4112665de64aaae913a3f110a4f715c7a5c71d7`
- Restore rehearsal copy: a fresh `/tmp/sleepless-kingdom-cp17-read-restore.XXXXXX/world.sqlite` directory created for this run and left outside the repository
- Hosted provenance: The source backup was downloaded from the Railway Volume during the restart slice recorded by `SK-EVID-069`; this rehearsal did not write to Railway or to the source artifact

## Objective and claim boundary

- Behavior under test: A consistent SQLite backup can be reopened through the same `PersistenceStore` implementation used by the Game, pass schema and recovery validation, and expose the same world, identity, economy, mission, and event records.
- Claim this evidence may support: The preserved CP-17 operational copy is readable by the current Game persistence code on Node 24; SQLite integrity, foreign keys, schema metadata, world/event continuity, shelter identity/economy, mission inventory, and event replay validation pass on a disposable copy; the source backup remains unchanged.
- Claims this evidence cannot support: A Railway provider restore, replacing the live Volume, a production rollback, power-loss recovery, hosted cross-player denial, WebMCP dynamic action, Cloud Receiver or Local Connector delivery, Agent wake, judge reproduction, or `hosted_verified` closure.

## Preconditions and fixture

- Starting state: `SK-EVID-069` had already produced and hash-verified the backup outside the repository. The hosted service was not contacted during this run.
- Source artifact checks: A read-only `node:sqlite` connection was used for the original backup; the source hash was captured before and after the rehearsal.
- Disposable restore: The backup was copied to a newly created temporary directory. The copy was opened with `createPersistenceStore({ dbPath })`, then `open()` and `recoverWorld("sleepless-mvp-01")` were called.
- Real and fake boundaries: SQLite and `PersistenceStore` were real. No browser, Clerk credential, Railway write, production endpoint, or test bypass was used.

## Execution

| Step | Replayable procedure | Expected result | Actual result | Status |
|---|---|---|---|---|
| 1 | Hash the preserved backup and open it read-only with `node:sqlite`; run `PRAGMA integrity_check` and `PRAGMA foreign_key_check` | The artifact is internally consistent and has no foreign-key violations | `integrity_check=ok`; `foreign_key_check` returned zero rows; SHA-256 was `9d8448dc20f0e58ddc662354d4112665de64aaae913a3f110a4f715c7a5c71d7` | **pass** |
| 2 | Read the schema metadata, world row, snapshot row, shelter rows, mission/attempt/event counts from the original backup | The expected CP-17 world and schema are present before reopening | Schema `8`, contract `SK-MVP-0.2`, event version `1`, snapshot version `1`, migration `cp06-004`; world `sleepless-mvp-01`, world time `4659`, event cursor `251`; snapshot cursor `0`; two shelters with coins `15` and `10`; five missions, six attempts, and `251` events | **pass** |
| 3 | Copy the backup to a fresh temporary path and open the copy with the real `PersistenceStore` on Node 24 | The current Game persistence implementation accepts the backup without a migration or compatibility failure | `open()` passed; metadata matched; `journalMode=wal`; `foreignKeys=1`; `listWorldIds()` returned only `sleepless-mvp-01` | **pass** |
| 4 | Call `recoverWorld("sleepless-mvp-01")` and read the server records through `PersistenceStore` | Recovery validates the snapshot hash and event order, then exposes the same durable state | Recovery returned snapshot `world-snapshot-sleepless-mvp-01`, snapshot cursor `0`, and `251` replay events; world cursor `251`; two players, ten soldiers, four resources, five missions, six attempts, and `251` events were readable; shelter identities and coins matched the source | **pass** |
| 5 | Hash the original backup again after the copy was opened and closed | Read-restore work must not mutate the source artifact | The source SHA-256 remained `9d8448dc20f0e58ddc662354d4112665de64aaae913a3f110a4f715c7a5c71d7`; `backup_hash_unchanged=true` | **pass** |

The executed runtime used the following commands, with a fresh temporary directory for each run:

```sh
env PATH="/opt/homebrew/opt/node@24/bin:$PATH" node --version
shasum -a 256 /tmp/sleepless-kingdom-cp17-pre-restart-20260903.sqlite
env PATH="/opt/homebrew/opt/node@24/bin:$PATH" node --input-type=module
env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npx tsx -e 'import { createPersistenceStore } from "./src/server/persistence/store.ts"; /* open, recoverWorld, and read the bounded records described above */'
```

## Assertions

- Player-visible state: This rehearsal is persistence-only; it read the same two player identities, shelter mappings, positions, and coin totals but did not drive a browser.
- Command and failure contract: No command was submitted. `PersistenceStore.open()` and `recoverWorld()` failed closed if schema, snapshot hash, event order, or world cursor were incompatible; they returned successfully for this artifact.
- Persistence, event, and outbox state: Schema metadata, world cursor, snapshot cursor/hash, mission inventory, attempt inventory, and all `251` Domain Events were readable; the source backup was unchanged.
- Exactly-once settlement after duplicate delivery and replay: Not exercised by this rehearsal; the existing CP-05/CP-16 evidence remains the authority for those behaviors.
- Ownership denial, stale revision, restart, and reconnect: Not exercised here; hosted denial remains under `SK-TASK-079`, and hosted restart/reconnect remains under `SK-EVID-069`.

## Analysis and closure

- Failure classification: A preliminary output-only SQL readback used a double-quoted string literal for `singleton` and failed with a query error. It created no artifact mutation; the corrected Node 24 readback and the full `PersistenceStore` rehearsal passed.
- Limitations and residual risk: The temporary copy was opened locally and is not a provider restore. No Railway Volume was replaced, no live world was rolled back, and no power-loss or provider snapshot retention claim was tested.
- Invalidation triggers: Changes to the persistence schema, `SK-MVP-0.2` contract, `recoverWorld` validation, the Railway backup source, the runtime major version, or the backup hash invalidate this record.
- Exact conclusion: The hash-verified CP-17 operational backup can be reopened and recovered by the current Game persistence implementation on a disposable copy without changing the source artifact. This closes the local read-restore compatibility rehearsal only; hosted denial, provider-level rollback, and full CP-17 closure remain open.
