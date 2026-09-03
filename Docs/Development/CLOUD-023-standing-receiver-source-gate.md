# CLOUD-023 — Standing Receiver Kernel and Source Preflight

**Role:** DEVELOPMENT implementation and verification record  
**Status:** Core and Receiver sources locally committed; minimum pinned trace,
exact-commit PostgreSQL upgrade, one-shot Event rollback/retry vector, and Core
standing fresh-process recovery are `locally_verified`; full release conformance
and public controls remain open  
**Date:** 2026-09-04  
**Controls:** ADR-0043 through ADR-0045, TASK-027, TASK-028, TASK-033.

## Objective and bounded outcome

Adopt the standing authority kernel in the independently implemented active
Receiver while preserving v0.1, then prevent an unpinned local corpus from being
mistaken for ADR-0044 committed-source evidence. This record does not reopen the
closed RECORE-007 reference increment or claim Game/product adoption.

## Implemented and verified

The active Receiver `Re-Entry` working tree based on
`6b4826f68bb3634d004c49259d9c5311c660d997` adds five separate standing tables,
strict v0.2 protocol/transport, ordered Event acceptance, one-open-activation
fencing, three-attempt delivery, effect-backed acknowledgement, and internal
Consent/inspection/revocation authority seams. The retained v0.1 models and
contracts are unchanged.

The preceding kernel increment passed 21 backend suites / 154 tests, frontend
and backend type-check/build, reviewed additive migration on disposable
PostgreSQL, and one shared Core scenario through real Express. These are local
working-tree results with deterministic effect authority and internal controls.

The initial source-preflight increment changed only the test wrapper/verifier
and documentation. It defaults to a fixed reviewed commit pin, verifies the
entire Core tree and six governing documents against Git blobs, rejects missing
or modified source and symlinks, isolates Git routing/replacement overrides, and
rechecks identity after the scenario. Explicit development mode never becomes a
release fallback. Tests use retained synthetic Git fixtures, not a copied
normative corpus.

Node `v24.20.0` verification:

- source-preflight suite: 16/16 passed;
- actual default runner: expected `conformance_pin_missing`, before DB setup;
- explicit development Express/PostgreSQL shared trace: 1/1 passed;
- three native syntax checks and whitespace checks: passed;
- governing validator/scanner unit tests: 6/6 and 3/3 passed;
- repository documentation/link/shape validation: passed without staging owner-held work; and
- scoped sensitive scans: no findings. The whole-repository scanner still
  reports the 21 pre-existing Game artifact filename matches recorded by
  RECORE-007; no whole-repository scan pass is claimed.

The [Receiver verification record](../../saas-boilerplate/backend/conformance/standing-v0.2/README.md)
owns exact commands, source fingerprints, dependency-lock identity, migration
scope, fixture retention, and the distinction between reused and rerun results.

## Challenge, reconciliation, and non-goals

The falsifier is a fixed commit name whose actual source is missing or different.
The initially observed Core HEAD `4a71866ac1a5735b22d4931b0d7f555fa2ba306d` did not
contain the standing scenario. Passing an observed-hash run cannot satisfy a
commit pin. The verifier now rejects that class before importing Core or
Receiver code; no fake accepted pin is created.

Core/00, Core/05, Mechanisms 01-02, and TASK-028/TASK-033 are updated only for
the active kernel's bounded evidence. ADR-0043 through ADR-0045 remain aligned:
there is no new authority, protocol, lifetime, target-transfer, or deployment
decision. Public route/session/CSRF behavior is explicitly open in the
[control-plane proposal](../../saas-boilerplate/backend/src/modules/standing/CONTROL-PLANE-PROPOSAL.md),
not promoted into canonical mechanism truth. TASK-027 remains pending for
lifetime and renewal; current finite-expiry wire values do not mean no expiry.

Source identity is not full release conformance. Remaining gates include the
reviewed Core and Receiver commits, mandatory v0.1/v0.2 matrix and production
profile, exact migration promotion, required CI/release enforcement, accepted
public controls, production effect authority, Connector selection, and Game
integration. Same-process app reconstruction is not arbitrary crash recovery.

The earlier source snapshots below retain their original working-tree and
missing-pin context. The final Receiver closure section owns the newer source
and migration result; those historical limitations are not current source status.

## Ownership and next gate

No Core implementation, Game, RightSpot, Git index, branch, source commit,
remote branch, production database, or deployment was changed by this
initial source-preflight increment. Existing owner-held changes remain intact. Parent
and Receiver fetch readback showed respectively 65/0 and 0/0 ahead/behind
`origin/main`; neither is a source pin or remote delivery claim.

TASK-028's next gate is source-owner review and exact local Git closure of the
standing corpus and active implementation, followed by a reviewed pin and
conformance rerun. Stop before staging uncertain owner-held files or publishing
unreviewed source. TASK-033 proceeds to public controls only after its exact
contract and TASK-027 lifetime boundary are accepted. No new branch is required.

## Source-owner review and corrections: 2026-09-03

The user authorized source-owner review and local Git closure of standing Core
and related contracts, followed by a real Receiver pin, without a new branch or
push. Review found two concrete gaps before any staging:

1. The SQLite standing Core read time or live authority before `BEGIN IMMEDIATE`.
   A writer-lock wait could admit authority that had expired or been withdrawn,
   or record revocation with a pre-wait timestamp. Challenge, Consent, Event,
   claim, acknowledgement, and revoke now resolve their operation time, live
   authority, and authoritative rows after acquiring the writer lock. Twenty
   deterministic regressions first failed, then all passed after correction.
   The hook executes after a real SQLite `BEGIN IMMEDIATE`, but is not evidence
   of operating-system contention or atomicity across a separate Host database.
   Authority callbacks must remain synchronous, bounded, and non-reentrant.
   Historical Event replay, terminal Consent replay, late valid effects, and
   duplicate revocation semantics are preserved; frozen v0.1 is unchanged.
2. The shared scenario checked only parts of successful responses. It now checks
   exact public approval binding, Event acceptance, and acknowledgement fields,
   type, status, and correlation, including top-level lease Event identity.
   Twenty-one oracle tests cover 18 malformed responses and three positive
   controls. A new test-only lease-field mistake was found by the real Core
   cross-layer test and corrected before the final aggregate and Receiver trace.
   Synthetic oracle tests are not independent Receiver conformance.

The review also reconciles stale active-kernel wording in Core, Mechanisms, and
project indexes. Public controls, lifetime/renewal policy, product adoption, and
production effect authority remain open; no proposal is promoted to an API.

Final local verification for this review:

- Core `npm run verify`: 50-module syntax check, `153/153` tests with no skips,
  unchanged v0.1 process conformance, and package verification; zero runtime
  dependencies, 19 package files, 52,366 packed / 287,291 unpacked bytes.
- Local Connector `npm run verify`: 36-module syntax check; 49 passed, 12 external
  active-v2 tests skipped because that suite's external configuration was not
  supplied. Reference-system and application-demo verification each passed 2/2.
- Active Receiver backend rerun against the verified disposable PostgreSQL 16:
  21 suites / 154 tests passed, no skips. Earlier type-check/build and migration
  verification remain prior evidence, not additional reruns in this review.
- Strengthened real Express/PostgreSQL shared scenario in explicit development
  mode: 1/1 passed. Core HEAD was
  `694f8450bcb65b2d70c5f82d365a9ff50effc10d`; full selected source fingerprint was
  `5eb4c8c2a94e79b4da68616c921f7d996f53545ce18d559424a908e6b480b73b`.
  Receiver HEAD remained `6b4826f68bb3634d004c49259d9c5311c660d997`.
  Both source-identity and release-conformance flags were false, as required.
- Source-pin fixture tests were rerun: 16/16 passed. The real default pinned
  entrypoint again stopped with `conformance_pin_missing` before database setup;
  that expected refusal is not a passing conformance run.
- Governance validator/scanner unit tests passed 6/6 and 3/3. The normal
  index-scoped repository validator passed, but does not include untracked
  candidates. An explicit read-only check of all 67 modified/untracked parent
  candidate files found one blocker: the existing untracked
  `TASK-033-build-standing-authorization-v0.2.md` violates the task-filename
  grammar. Its `v0.2` suffix must become `v0-2` and its Task index link must be
  updated before staging; the original is retained pending exact scope approval.
  No markdown/link, English, or sensitive-pattern finding accompanied that
  filename failure. The 24 Receiver candidate files passed the corresponding
  scoped markdown/link, English, and sensitive checks; both Git whitespace
  checks passed. No index was changed to obtain these results.
- The full parent sensitive scanner still failed on the same 21 Game artifact
  filename matches in seven files. No full-repository security pass or clean
  all-candidate governance gate is claimed.

The shared standing corpus remains a minimum sequential trace, not the full
negative/race/forced multi-row rollback/no-mutation matrix. Restart reconstructs
stores/apps in the same process, not a fresh-process crash recovery. Historical
SQLite migration fixtures derived from current DDL are not frozen historical
schema evidence. Source pre/post checking is not an immutable filesystem, and
does not verify Receiver commit cleanliness, executable modes, dependency lock,
migration promotion, or CI enforcement.

The review initially stopped at the mixed documentation boundary. The user has
now approved local closure: first preserve the selection and already accepted
standing contracts in one documentation-only commit, then commit the reviewed
Core/consumer implementation, and create a real Receiver pin. This avoids
inventing a selection-only historical version of documents that already encode
the accepted two-cycle target. No decision or product authority changes.

TASK-033 was renamed to `TASK-033-build-standing-authorization-v0-2.md` and its
Task index link updated. Its bytes were identical before and after the rename;
the old filename remains in the historical failed-check description above only.
No validator was weakened and no Task content was removed.
Once its valid filename allowed deeper validation, the final index check exposed
three required Task headings that were present under incompatible section numbers.
The existing content was retained and headings normalized to the Task schema
(`4. Non-goals`, `5. Verification and closure`, `6. Reopen condition`).

The approved scope is 36 exact parent documentation files plus 31 Core/consumer
files, with any result writeback limited to those same owning documents. Game,
RightSpot, sibling source, and unknown untracked paths remain excluded. The
independent Receiver working tree is not committed by this local Core closure;
its pin and verification record remain an explicit bounded local change.
Game coordination granted a narrow parent index/commit window at
`5b67cd6be960b7cc699b392a7a1f1a37a3fccf4c`. No branch creation, push, production
migration, deployment, or publication is authorized. Later Game pushes must not
incidentally publish these local-only ancestors.

Fresh pre-commit verification on Node `v24.20.0` / npm `10.9.2` passed Core
`153/153`, 50-module syntax, v0.1 conformance, and package checks (zero runtime
dependencies, 19 files, 52,740 packed / 288,274 unpacked bytes). Connector passed
49 tests with 12 explicit external-test skips; reference-system and application-
demo each passed 2/2. Source-pin fixture tests passed 16/16. These tests ran at
the above parent HEAD with the reviewed working-tree source; they do not by
themselves establish the subsequent committed-source or pinned result.

## Local committed-source result: 2026-09-03

The approved documentation/accepted-contract cohort was committed locally as
`abcbbaa6df8168e8d62f6cb95aca700968759df9` (36 files). The reviewed Core/consumer
cohort was then committed as `58d8d71b2508084cf749e3d618d5ce5ae3feec51` (31 files).
Both commits exclude every Game/RightSpot path and preserve other local changes.

At the latter exact commit, the fixed Receiver pin passed the real
Express/PostgreSQL standing trace in `pinned` mode: 1/1, with
`source_identity_verified: true` and `release_conformance_verified: false`.
The Core loopback/SQLite shared trace was rerun separately at the same commit:
1/1. The selected Core/spec source SHA-256 was
`5eb4c8c2a94e79b4da68616c921f7d996f53545ce18d559424a908e6b480b73b`.
This supersedes the earlier absent-pin/development-only result, not its historical
evidence or the remaining release gates.

The final evidence-only parent writeback may advance HEAD without changing any
selected Core/spec bytes. The Receiver record and fixed `core-pin.json` own the
final exact SHA and post-writeback rerun; the pin must be advanced explicitly and
verified again, never replaced by a floating branch. An unrelated future parent
commit likewise requires a reviewed pin change or an exact checkout at the pin.

Receiver HEAD remains `6b4826f68bb3634d004c49259d9c5311c660d997` on `Re-Entry`;
the standing implementation, migration, harness, pin, and local verification
record remain intentionally uncommitted. Thus neither Receiver exact-source
release nor two-repository remote delivery is claimed. The unchanged dependency
lock SHA-256 is
`3f4354370ec3fa4a965c8434c6e8dd3c80be238dcb6fa7c42747719ac8275314`;
the standing SQL migration SHA-256 is
`e707a57e7b7330428ba96d0212bfc75516df26ea583904674996d739f70843c1`.
Readback of the verified localhost disposable PostgreSQL 16 instance confirmed
six baseline migrations and `20260903193000_standing_authorization_v02` finished.
No production database or runtime was targeted; uniquely named test rows remain
retained. The preceding 154-test backend/type-check/build evidence was not rerun
by this documentation/pin-only closure.

Final staged repository validation passed after the Task filename and headings
were corrected; validator/scanner unit tests passed 6/6 and 3/3. Exact staged
sensitive scans passed separately for 36 documentation and 31 source files.
The whole-repository scanner still reports the same 21 Game artifact filename
matches; no whole-repository security pass, CI result, push, or release approval
is claimed. The next gate is reviewed Receiver source/migration closure and the
complete mandatory matrix/release enforcement under TASK-028, plus the separate
lifetime and public-control decisions under TASK-027/TASK-033.

## Receiver local source and exact-commit upgrade closure: 2026-09-03

The user approved bounded source review, corrections, disposable migration
verification, and local Git closure on the existing `Re-Entry` branch. This is an
`Assured` increment under TASK-028: one falsifiable outcome is an exact Receiver
commit whose additive upgrade retains pre-existing v0.1 rows and constraints.
No new branch, remote delivery, deployment, production migration, public control,
lifetime decision, Game work, or dependency upgrade is included.

Independent runtime/security and migration reviews identified two P2 defects:

1. Absolute-form HTTP request targets bypassed the standing raw-target guard,
   fatal body decoder, and no-store policy; OPTIONS could exit through CORS.
   Two regression tests initially failed (16 existing transport tests passed).
   Express's parsed path now selects rejection policy only; the unchanged raw
   allowlist still accepts only exact origin-form kernel routes. Both tests now
   pass across six aliases each; focused transport is 18/18. Independent raw
   probes confirm retained v0.1 and valid v0.2 behavior. A malformed single-slash
   URI probe was rejected by Node before Express and was not mislabelled as an
   application response.
2. The migration suite upserted the v0.1 sentinel before checking it, which could
   mask lost rows. Its title now states post-migration compatibility. A new
   exact-commit rehearsal shares the test-only seeder, applies the six baseline
   migrations first, seeds once, applies the seventh migration, and compares all
   v0.1 rows/catalog before any post-upgrade seeding or constraint probes.

The reviewed 28-path Receiver cohort was committed locally as
`9156e68fe9b988f2ec7423d1c93930da3a105d4e`. It includes the existing standing
kernel/migration/conformance delta, the HTTP correction, and upgrade verifier;
only four pre-existing tracked integration files changed. No Game or RightSpot
path entered the nested repository commit. Subsequent evidence-only writeback
does not change this executable source identity.

Fresh verification on Node `v24.20.0`, npm `10.9.2`:

| Check | Result | Claim limit |
| --- | --- | --- |
| Backend aggregate | 21 suites / 156 tests passed, no skips | Local v0.1/standing regressions; not full shared conformance |
| Root type-check and build | Passed | Backend and frontend; existing Next.js middleware warning retained |
| Prisma schema validation | Passed | Static schema only |
| Source-pin fixture suite | 16/16 passed | Fixed Core source identity, not release conformance |
| Upgrade guard/record suite | 5/5 passed | Exact endpoint, source/lock inputs, migration-record failures |
| Pinned real Express/PostgreSQL trace after source commit | 1/1 passed | Internal Consent/control and deterministic effect authority |
| Exact-commit fresh PostgreSQL upgrade | Passed | Six baseline migrations, old fixture, seventh migration, old-state readback |
| Post-upgrade constraint probes | 6/6 passed | Same new disposable database; no resets/deletions |

The minimum shared trace records Receiver commit `9156e68...` and unchanged Core
pin `28d74e589b16e43f167aa82652220b7b182502d1`; selected Core/spec SHA-256 remains
`5eb4c8c2a94e79b4da68616c921f7d996f53545ce18d559424a908e6b480b73b`.
An isolated exact-commit Core checkout prevents concurrent Game-only shared-main
commits from being substituted for the reviewed pin. `source_identity_verified`
is true; `release_conformance_verified` remains false.

The upgrade used a newly provisioned, verified task-only PostgreSQL 16.14
container at `127.0.0.1:55433/reentry_closure`, separate from the retained port
55432 regression database. Storage is tmpfs with no host volume. All seven
Prisma migration checksums matched the committed SQL and finished successfully.
Thirteen baseline tables and ten fixture rows matched before and immediately
after upgrade, and again after the six constraint probes. The snapshot SHA-256 is
`5b3521a28cd21d395436c7c14a6fc7c3851967ccc98f5f0737f35b5cc0daf292`.
Migration SQL and dependency-lock hashes remain respectively
`e707a57e7b7330428ba96d0212bfc75516df26ea583904674996d739f70843c1` and
`3f4354370ec3fa4a965c8434c6e8dd3c80be238dcb6fa7c42747719ac8275314`.
Credential values and local fixture snapshots are not tracked. Temporary source,
migration, and database fixtures remain retained for inspection.

The rehearsal compares old columns, rows, indexes, constraints, user-defined
triggers, ACL/RLS, and policies. It excludes internal triggers added by the new
standing foreign keys. New `RESTRICT` references can prevent deletion of
referenced existing parents; this is not a claim of unchanged parent-deletion
behavior or verified production-role access.

Reconciliation: ADR-0043 through ADR-0045 and normative mechanism semantics are
`aligned`; no accepted authority or contract changed. Core/00, Core/05,
Mechanisms 01-03, TASK-028/TASK-033, and the Development index are `updated` only
for source/evidence status. Earlier working-tree results are `historical`.
Public controls/lifetime and the observed separate-read inspection snapshot
remain `open` in the proposal; no unaccepted public transaction contract was
implemented. Full shared failure/race/no-mutation and forced rollback vectors,
fresh-process crash and application rollback proof, deployed-role verification,
and mandatory CI/release enforcement remain `unverified` under TASK-028.

All 28 staged Receiver source files, the evidence-only Receiver README, and the
nine coordinated parent documents passed scoped Markdown/link, English,
sensitive-pattern, byte-identity, and whitespace checks; governance unit tests
passed 6/6 and scanner tests 3/3. Full parent repository validation passed. The
full sensitive-pattern scan still reports the same 21 Game artifact-name matches
outside this increment; no whole-repository security pass is claimed and no
unrelated file was changed. Parent documentation Git closure uses the separately
coordinated nine-path window. No push, CI pass, production migration, deployment,
publication, or full TASK-028/TASK-033 closure is claimed.

## Post-writeback exact-pin refresh: 2026-09-03

The parent evidence commits after the original pin changed three files inside
the selected Core/spec inventory. A pinned Receiver run with the old
`28d74e...` pin stopped before database access with the expected
`conformance_source_commit_mismatch`. After reviewing the exact changes, the
Receiver pin was advanced to Core commit
`84f5082c5701c7a2bb4d233b511134898434a249` in nested commit `1368741`.

The refreshed verification is:

- source-pin fixtures: `16/16` passed;
- migration upgrade guards: `5/5` passed;
- pinned Express/PostgreSQL standing trace: `1/1` passed at Receiver commit
  `7faf527aca7710a26ee03c2c4beec0e2c7edf8c0`, Core source SHA-256
  `6c7688a074c3d99bca6cba1945b79200db4b8f4b0455edef55f2f3659095cb65`, and
  Node `v26.5.0`; and
- full backend aggregate: `21/21` suites and `158` tests passed with no skips
  or failures on the task-owned loopback PostgreSQL baseline.

The pin refresh verifies the current selected Core/spec bytes and the minimum
shared standing trace after documentation drift. It does not close the full
negative/race/forced-rollback/fresh-process matrix, public control or lifetime
decisions, release enforcement, production effect authority, deployment, or
hosted readback. The current highest supported state remains local committed
source and minimum pinned trace verified; TASK-028 remains `verification_pending`.

## Shared ordering-vector increment: 2026-09-03

The shared standing-v0.2 scenario now covers one future-sequence failure slice.
It submits signed Event sequence `2` while sequence `1` is still expected. The
Core reference and pinned Receiver both return the exact non-retryable
`409 event_sequence_out_of_order` error, preserve Grant sequence `0` with no
active Delivery, and accept that same Event after sequence `1` is acknowledged.
This is a shared rejection, no-mutation, and eventual-acceptance proof; it does
not change the accepted protocol or production code.

Exact evidence for this increment:

- Core scenario contract and cross-layer tests: `24/24` passed;
- source-pin fixtures: `16/16` passed;
- pinned Express/PostgreSQL Receiver trace: `1/1` passed;
- Core commit: `4565ccc5773ee70905b8e5f7bf2b65440f83edfc`;
- selected Core/spec SHA-256: `583e541ff41884449ebc5547e9655b3eb4ef34f9db4120236c6354a4dbfba499`;
- Receiver commit: `82e2f5712343625225fe4cda603ede7e2d53c4fb`; and
- runtime: Node `v26.5.0`, `release_conformance_verified: false`.

The full backend aggregate was not rerun for this oracle-only increment; the
previous `21/21` suites and `158` tests remain prior evidence because Receiver
production source, schema, and migration bytes are unchanged. The mandatory
concurrent race, forced rollback, fresh-process recovery, release-enforcement,
public-control, lifetime, and production gates remain open under TASK-028.

## Active-v2 delivery profile increment: 2026-09-03

The active Receiver's implementation-specific delivery profile was rerun against
the task-owned loopback PostgreSQL baseline. One focused test reclaims exactly
three lease attempts, retires each prior claim token, reaches
`retry_exhausted` with `attempt_limit_reached`, releases the standing slot, and
accepts the next Event sequence without a fourth attempt.

Exact evidence for this increment:

- command: `../node_modules/.bin/jest src/modules/standing/test/standing-delivery-profile.test.ts --runInBand --forceExit`;
- Jest result: `1/1` suite and `1/1` test passed;
- runtime: Node `v26.5.0` against the task-owned `127.0.0.1:55432/reentry_baseline` database;
- Receiver checkout: `96227925fb7c63041fba98910fda0a0f2f17d12f2`; production standing source last changed in `9156e68`; and
- no production database, migration, deployment, or external service was touched.

This closes the active-v2 lease/reclaim profile as a local implementation
check. It is not shared normative conformance: the full distinct-Event race,
forced rollback, fresh-process recovery, release-enforcement, public-control,
lifetime, and production gates remain open under TASK-028.

## Shared duplicate-vector increment: 2026-09-03

The shared standing-v0.2 scenario now submits the same signed Event envelope
concurrently twice. The Core reference and pinned Receiver converge on one
fresh `202` acceptance and one `202` duplicate response for the same Event ID;
the sequence/Delivery contract therefore creates one activation rather than
duplicating work. The earlier future-sequence rejection/no-mutation vector
remains in the same shared oracle.

Exact evidence for this increment:

- Core scenario contract and cross-layer tests: `24/24` passed;
- source-pin fixtures: `16/16` passed;
- pinned Express/PostgreSQL Receiver trace: `1/1` passed;
- Core commit: `68a306eef6b977ee530a6ac75754ad4c3a12dd64`;
- selected Core/spec SHA-256: `0723f2db654bbe6088e46dc970bb482edfb27d59ddf62b8ec2a6e4aafc24b9fb`;
- Receiver commit: `fa5de9de162f5746d00179200c8ba41320af1408`; and
- runtime: Node `v26.5.0`, `release_conformance_verified: false`.

The full backend aggregate was not rerun for this oracle-only increment; the
previous `21/21` suites and `158` tests remain prior evidence because Receiver
production source, schema, and migration bytes are unchanged. The mandatory
distinct-Event race, forced rollback, fresh-process recovery, release-enforcement,
public-control, lifetime, and production gates remain open under TASK-028.

## Shared distinct-Event sequence race increment: 2026-09-03

The pinned shared standing scenario now submits two distinct signed Event
envelopes for the same next sequence concurrently. The Core reference and pinned
Receiver converge on one fresh `202` acceptance and one exact `409`
`event_sequence_conflict` response with `retryable: false`; replaying the losing
envelope remains the same conflict, while the Grant sequence and one open Delivery
reflect only the winner. Future-sequence rejection/no-mutation and same-envelope
duplicate convergence remain in the same shared oracle.

Exact evidence for this increment:

- Core scenario contract and cross-layer tests: `26/26` passed;
- Core full verification: `157/157` tests passed, with syntax, conformance, and package checks green;
- source-pin fixtures: `16/16` passed;
- pinned Express/PostgreSQL Receiver trace: `1/1` passed;
- Core commit: `8e953b25eb7994ee84deb8517c8d036a7f7c5f58`;
- selected Core/spec SHA-256: `caccfd962bfb55040681cde9e13c8bbc15705a3db7e72a3306fc9e3fcd00d9f9`;
- Receiver commit: `4112d88dc60285f0f7551cecab9c8d99332ec897`; and
- runtime: Node `v26.5.0`, `release_conformance_verified: false`.

The full backend aggregate was not rerun for this oracle increment; the prior
`21/21` suites and `158` tests remain bounded evidence because Receiver
production source, schema, and migration bytes are unchanged. This does not
close forced rollback, fresh-process recovery, release-enforcement, public-control,
lifetime, or production gates under TASK-028.

## Shared Event identity-conflict increment: 2026-09-03

The pinned shared standing scenario now resubmits an already accepted Event ID
with a different canonical body. The Core reference and pinned Receiver return
the exact non-retryable `409 event_identity_conflict` response. The Grant
sequence remains at `1` and the existing open Delivery remains unchanged, so a
changed payload cannot converge as a duplicate or create another activation.

Exact evidence for this increment:

- Core scenario contract and cross-layer tests: `28/28` passed;
- Core full verification: `159/159` tests passed, with syntax, conformance, and package checks green;
- source-pin fixtures: `16/16` passed;
- pinned Express/PostgreSQL standing trace: `1/1` passed;
- Core commit: `270c8e88a645d2624d29d70b455e64efca177cb7`;
- selected Core/spec SHA-256: `71dfbf55a32cbca9f3089d672dca808c99116a61fb4c3ff7c7981c30f14eb714`;
- Receiver commit: `a92f9403e134ca2c3a8e6249f117b24284e3988c`; and
- runtime: Node `v26.5.0`, `release_conformance_verified: false`.

The full backend aggregate was not rerun for this oracle increment; the prior
`21/21` suites and `158` tests remain bounded evidence because Receiver
production source, schema, and migration bytes are unchanged. The mandatory
forced rollback, fresh-process recovery, release-enforcement, public-control,
lifetime, and production gates remain open under TASK-028.

## Shared Event transaction rollback increment: 2026-09-04

The shared standing-v0.2 scenario now injects a one-shot failure after the Event
and Grant sequence writes but before Delivery creation. The Core reference and
pinned Receiver return the exact non-retryable `500 receiver_internal_error`
response, leave the Grant sequence and active Delivery state unchanged, and
accept the exact same signed Event envelope after the fixture fault is removed.
That retry completes its normal claim, dispatch, effect, and acknowledgement
cycle, so a post-write failure does not consume sequence or strand partial work.

Evidence for this increment:

- Core scenario contract and cross-layer tests: `30/30` passed;
- Core full verification: `161/161` tests passed, with syntax, conformance, and package checks green;
- source-pin fixtures: `16/16` passed;
- pinned Express/PostgreSQL Receiver trace: `1/1` passed, including the expected one-shot injected `500`;
- Core commit: `1446d73aa3e66533547471728ad8fa5344d51f9e`;
- selected Core/spec SHA-256: `6210d7724417e0533c77d5989e8ffdd3c404af4063ac9d70d70db9b622f73d45`;
- Receiver commit: `3972456e510e5c78c26d7eefa396b761e450e749`; and
- runtime: Node `v26.5.0`, `release_conformance_verified: false`.

The failure is injected only by disposable test fixtures; no production source,
schema, migration, or deployment path changed. The full backend aggregate was
not rerun for this fixture-only increment; the prior `21/21` suites and `158`
tests remain bounded evidence. This closes the shared one-shot post-write
rollback/retry vector, not forced process termination, fresh-process recovery,
release-enforcement, public-control, lifetime, or production gates.

## Standing Core fresh-process recovery increment: 2026-09-04

An independent test-only child process created the standing Grant and committed one
pending Delivery in SQLite, then was terminated with `SIGKILL`. A new OS process
opened the same database and exact source, observed the same active Grant with
sequence `1` and one open activation, claimed the pending Delivery, acknowledged
one newly authorized Host effect, and replayed the original Event as an exact
duplicate. The raw Connector, decision, control, claim, and effect fixture tokens
were absent from the database, WAL, journal, and SHM bytes.

Evidence for this Core-only increment:

- focused test `node --test test/standing-fresh-process.test.mjs`: `1/1` passed;
- three independent stability reruns: `3/3` passed;
- Core syntax check: `52` modules passed;
- implementation commit: `0945cecf912107ea1aee86da260201da7f17556b`; and
- runtime: Node `v26.5.0`.

The fixture reuses the existing standing Host SDK, Core, SQLite store, and process
RPC. No production source, protocol, schema, package, route, or deployment behavior
changed. This closes only the committed standing Core/SQLite fresh-process boundary;
the active Receiver/PostgreSQL equivalent, forced termination during a transaction,
supervision, distributed ownership, release conformance, deployment, and production
durability remain open. The next increment is the equivalent active Receiver trace.
