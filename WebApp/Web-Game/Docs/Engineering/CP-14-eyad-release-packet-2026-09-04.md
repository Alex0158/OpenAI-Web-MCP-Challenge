# CP-14 Release Packet: Standing v0.2 Game-to-Existing-Task Handoff

**Packet status:** Draft release handoff; local implementation is verified, publication and hosted
readback are open
**Prepared:** 2026-09-04
**Implementation owner:** Project team
**Release owner:** Eyad
**Scope:** Sleepless Kingdom `CargoLostToMonster` standing notification path
**Governing records:** [`TASK-036`](../../../../Docs/Tasks/TASK-036-implement-standing-notification-handoff.md),
[`ADR-0049`](../../../../Docs/Decisions/ADR-0049-game-team-standing-integration-and-eyad-release.md),
[`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md)

## Purpose and claim boundary

This packet is the source-pinned handoff from the project team to Eyad after the additive finite
protocol-v0.2 implementation increment. It tells a reviewer exactly what must be frozen, tested,
published, deployed, and read back before the hackathon submission can claim hosted standing
continuity.

The current candidate proves local contract/runtime composition only. It does not yet prove a public
package, a deployed Receiver, a production Consent/Grant, an independent Connector process, a
legitimate same-task runtime admission, an authenticated Browser/WebMCP read, a Game effect, or an
ACK. Those claims are raised only by the named readback gates below.

No secret value, raw task locator, lease token, private binding, or mutable database is part of this
packet. Eyad supplies deployment secrets through the platform's protected configuration surface;
the packet records names, identities, and observations only.

## Selected vertical slice

The release target is one bounded standing relationship:

1. The Game server resolves one approved public binding for one player and shelter.
2. An eligible `CargoLostToMonster` signal becomes one signed standing v0.2 Event with a durable
   positive sequence, canonical occurrence time, causal page version, and stable `event_id`.
3. The Receiver accepts the Event and creates at most one active Delivery for the binding.
4. The Connector claims the Delivery and asks a private, qualified Adapter to admit the notification
   to the already bound existing task.
5. The Receiver records a separate notification-handoff receipt only after the runtime-owned
   admission attestation and current lease/scope checks pass.
6. The existing task rereads the authenticated canonical Game page and genuine WebMCP capabilities,
   then chooses action, deliberate no-action, or a human decision.
7. A later eligible signal reuses the same Consent, Grant, and existing task. It never creates a
   fresh task or a second queue.

The Receiver handoff receipt settles notification delivery only. Queue acceptance, handoff, Agent
wake, page read, WebMCP call, optional command, and resulting Game effect remain separate evidence.

## Candidate identity to freeze

Complete every `TBD` value only after the reviewed implementation paths are committed. Do not
replace a value with a mutable branch name, `latest`, an unreviewed build, or a value read from an
unrelated deployment.

| Artifact | Required immutable identity | Current observation | Freeze value |
|---|---|---|---|
| Outer repository | Git commit containing the reviewed Game/Core/SDK/Connector changes | `main` at `217df3d` with implementation files still in the working tree | `TBD` |
| Game | Outer commit plus `WebApp/Web-Game` path and schema migration | schema `9`, migration `cp14-001` | `TBD` |
| Core | Git commit, package manifest, and source integrity | `@webmcp-challenge/reentry-core@0.1.0`, private local package | `TBD` |
| Host SDK | Git commit, package version, tarball SHA-256, export map | local candidate `@4xeoz/re-entry-sdk@0.3.1`, includes `./standing-server` | `TBD` |
| Local Connector | Git commit, package version, tarball SHA-256, export map | local candidate `@4xeoz/re-entry@0.2.20`, standing handoff dispatch in source | `TBD` |
| Receiver | Separate repository commit and deployment source identity | `saas-boilerplate` `Re-Entry` at `0195a9846024c4f65c62d3922069970ad1b96b92` plus working-tree standing changes | `TBD` |
| Receiver migration | Exact ordered migration directory and applied migration readback | `20260904000000_pairing_claim_rate_limit`; `20260904010000_standing_notification_handoff` | `TBD` |
| Runtime | Node major/minor and package-manager lockfile | Node 24 baseline | `TBD` |
| Public Game origin | Canonical HTTPS origin and page path used in the Grant | hosted Game origin is recorded by CP-17 evidence; CP-14 target path remains to be filled | `TBD` |
| Receiver origin | Exact HTTPS origin used by Host SDK and Connector | candidate local/preview origins exist; production origin is not verified in this packet | `TBD` |
| Release identifier | Human-readable identifier that joins all rows above | no release identifier assigned | `TBD` |

The current observations are provenance context, not release values. A package version must be
unique in its registry and must describe the actual tarball. If a registry already contains the
observed version, Eyad assigns the next reviewed version and updates every dependent manifest and
hash before publication.

## What the project team has implemented

The following paths are in the current local candidate and have focused green evidence:

- `reentry-core/src/notification-handoff.mjs` and `reentry-core/src/runtime-admission.mjs` provide
  strict v0.2 attestation, receipt, result, and client boundary validators while leaving v0.1
  behavior unchanged.
- `runtime/host-sdk/src/standing-server.mjs` provides a server-only standing Host wrapper for Host
  key registration, Consent session creation/status, and signed Event publication.
- `runtime/local-connector/src/local-connector.mjs` derives stable handoff identity, asks a private
  Adapter for same-task admission, reports `admitted`/`unsupported`/`outcome_unknown`, and calls
  the additive Receiver handoff route. `runtime/local-connector/src/handoff-journal.mjs` reserves
  each identity before runtime invocation, quarantines runtime-pending/unknown outcomes, and
  retries only a previously attested Receiver handoff. The existing fresh `codex exec` Adapter
  remains compatibility preview only and is not a fallback.
- `saas-boilerplate/backend/` contains the additive handoff migration, strict v0.2 control routes,
  same-user consent/revocation controls, private-state replay validation, an explicit
  `createApp({ standingRuntimeAdmissionAuthority })` server-side composition seam, and focused
  Receiver tests. The default app remains fail-closed when the option is absent. The Receiver is a
  separate Git/deployment boundary.
- `WebApp/Web-Game/src/server/standing-reentry-transport.ts` maps only server-resolved eligible
  Game signals, persists schema-9 sequence/context, and returns the narrow
  `receiver_queue_accepted` boundary through the existing Game publication port.
- `WebApp/Web-Game/src/server/reentry-delivery-runner.ts` and `src/server/entrypoint.ts` drive that
  existing port from startup and completed world boundaries with one in-flight pump, coalesced
  wakeups, interpolation-tick suppression, observable errors, and shutdown drain. It adds no second
  queue, timer, world clock, or downstream settlement.

The private Receiver replay path now validates both the canonical stored receipt and the canonical
stored runtime attestation, including the receipt's `runtime_admission_ref`. Corrupted or mismatched
private state fails closed as `delivery_private_state_invalid` instead of returning historical
success.

## Local verification already completed

Run from the exact frozen source after replacing the current working-tree observations with the
final commit values. These are the focused commands used for the current local candidate:

### Game

```sh
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp14-cloud
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp14-causal
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp16-page-recall
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp05
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp08
```

Current result: typecheck green; CP-14 transport `5/5`, runner `4/4`, causal trace `1/1`, page
recall `1/1`, CP-05 `26/26`, and CP-08 `4/4`.

### Core, Host SDK, and Connector

Run the focused Node 24 selections recorded in TASK-036. The current result is Core `174/174`,
standing Host SDK `27/27`, and Connector `81` passed with `12` explicit opt-in v0.2 checks skipped
because no hosted Receiver was supplied; Connector syntax covers `43` modules. A skipped opt-in
check is not a hosted pass.

### Receiver

Apply only the two named migrations to the task-owned disposable PostgreSQL database, then run the
backend type-check and the focused standing suites. The current task baseline is `5` suites / `53`
tests passed; the later five-file standing selection passed `80/80`, including the explicit app
composition seam. Do not report the previous whole-backend aggregate with missing race-database
variables as green; its failures are outside this focused result.

Record each command, runtime, source identity, pass/skip count, and claim ceiling in the current
standing transport/runner evidence records [`SK-EVID-078`](../Evidence/SK-EVID-078-cp14-standing-event-transport-runtime-verification.md)
and [`SK-EVID-079`](../Evidence/SK-EVID-079-cp14-reentry-delivery-runner-runtime-verification.md),
or a new superseding record after source freeze. Do not copy credentials, task locators, or mutable
database files.

## Current public artifact and deployment readback

Read-only checks on 2026-09-04 confirm that the recorded Preview is alive, but it is not yet the
CP-14 standing release:

- `https://cloud-receiver-delta.vercel.app/health` returned HTTP `200` with `success=true` and
  `db=up`; `/readyz` returned HTTP `200` with `status=ready`.
- A CORS preflight supplied with the hosted Game origin returned `204`, but the response allowed
  only `https://re-entry-weld.vercel.app`. The hosted Game origin is therefore not admitted by the
  current Preview contract.
- Read-only `GET` probes for `/v0.2/events`, `/v0.2/delivery-notification-handoffs`,
  `/v0.2/host-keys`, and `/v0.2/consent-sessions` returned the Preview's `404 Route not found`
  response. These probes do not attempt a POST or create authority; they are a deployment-shape
  check, not a substitute for the exact standing route test.
- The npm registry currently reports `@4xeoz/re-entry@0.2.20` and
  `@4xeoz/re-entry-sdk@0.3.2`. The published Connector export map does not contain the local
  standing queue/task-binding modules, and the published SDK export map does not contain
  `./standing-server`. The local Connector candidate must not reuse the already-published
  `0.2.20` bytes; the release owner assigns a new reviewed version after source freeze.

These observations raise no hosted continuity claim. They are a hard release gate: Eyad must deploy
the source-pinned Receiver routes and publish artifact bytes whose exports match the frozen packet
before any Game origin, Connector installation, Consent/Grant, or same-task trace is attempted.

## Freeze gate before handing to Eyad

The project team closes the local implementation gate only when all of the following are true:

1. Every reviewed source change is committed under the correct repository boundary. Unrelated
   collaborator changes remain untouched and are listed separately.
2. Outer and nested repository status, exact commits, package manifests, lockfiles, and migration
   directories are recorded. `git diff --check` is clean for the reviewed paths.
3. Core, Host SDK, Connector, Receiver, and Game focused checks rerun from the frozen commits.
4. The exact standing request/receipt, duplicate/replay, lease, expiry, revocation, wrong-scope,
   busy, out-of-order, response-loss, restart, and private-state-corruption vectors are green.
5. A legitimate same-task Adapter contract is identified. It must resolve the private binding by
   trusted owner/runtime authority, return the strict attestation, and never create a fresh task.
   If the runtime cannot provide idempotent admission or authoritative lookup after a lost response,
   keep the outcome `unknown` and do not claim automatic crash recovery.
6. The hosted Game origin, Receiver origin, production binding, and authenticated page/session path
   are documented without putting secrets in code or transport.

Until item 5 exists, the candidate may be released as a contract artifact for joint integration but
cannot be called a complete same-task demonstration. Eyad must not publish a package that silently
falls back to fresh `codex exec`.

## Eyad publication and deployment actions

After the freeze gate, Eyad performs these release actions in order:

1. Review the packet against the exact commits and verify every package tarball SHA-256 locally.
2. Build and publish uniquely versioned Host SDK and Connector packages from the reviewed source.
   Keep the Core source pin and bundle integrity identical to the packet. Do not publish from a dirty
   tree or use `latest` in the Game integration.
3. Deploy the exact Receiver commit, including the two named migrations, to the chosen HTTPS origin.
   Configure production secrets only through the deployment provider. Set the public Receiver origin
   and CORS/cookie values to the exact reviewed Game/Receiver topology.
4. Install the published versions in the Connector/Host runtime, or use the immutable reviewed
   tarballs if publication is intentionally deferred. The installed package identity must match the
   packet exactly.
5. Configure the legitimate runtime admission authority and private existing-task binding. Compose
   the Receiver with `createApp({ standingRuntimeAdmissionAuthority })` in the server-only
   deployment entrypoint; do not derive the authority from a request token or caller boolean. Verify
   one same-task Adapter call before sending a Game Event; a process exit or queued message alone is
   insufficient. If the authority cannot be supplied, leave the Receiver fail-closed and stop the
   hosted handoff claim.
6. Run the hosted readback matrix below. If any identity, route, migration, scope, or runtime
   observation differs, stop the release and return a typed failure rather than editing the packet
   to fit the deployment.

Eyad's action is publication/deployment only. It does not authorize a new protocol field, fresh-task
fallback, direct Game secret, second queue, hidden retry, or reinterpretation of effect ACK.

## Hosted readback matrix

Record each row with UTC time, exact release identifier, source/package identity, redacted correlation
IDs, observed status, and claim ceiling.

| Boundary | Required readback | Pass condition | Stop condition |
|---|---|---|---|
| Source | Deployment/build reports the packet's Receiver commit | Exact SHA matches | Mutable branch, unknown build, or mismatch |
| Packages | Registry/runtime metadata and tarball integrity | Name/version/hash/export match | Same version with different content, missing standing export, or `latest` |
| Health | `/healthz` and `/readyz` from the public Receiver | Liveness and migration/readiness both pass | Only a generic HTTP success or live-but-not-ready process |
| Migration | Provider/runtime migration table readback | Both named migrations applied once | Missing, reordered, or untracked migration |
| Enrollment | One informed Consent and finite Grant | Same user/target, binding scope, expiry, and revocation read back | Cross-account, client-selected task, or hidden rebinding |
| Game Event | Two ordered `CargoLostToMonster` Events | Same binding/task, stable IDs, sequence 1 then 2, no duplicate sequence | New Consent per signal, gap, wrong scope, or per-event task message |
| Queue | Receiver acceptance and one-active behavior | Queue receipt is separate from handoff and effect | `202` called wake/effect, or task flood |
| Handoff | Qualified Adapter attestation and Receiver receipt | One known handoff receipt; exact replay returns `duplicate=true` | Connector auth/process exit treated as runtime proof |
| Runtime | Existing task turns and attribution | Same existing task receives the notification; no fresh task | New task, wrong owner, unverified or fabricated admission |
| Page/WebMCP | Authenticated canonical page read and genuine tool discovery | Independent page/tool evidence references the same Event/task | Unauthenticated page, generic tool, or narration-only evidence |
| Game effect | Optional command and resulting revision | Separate Game authority confirms exact action/idempotency/revision | Handoff/ACK used as effect proof |
| Negative paths | Revoked, expired, wrong-scope, duplicate, busy, response-loss, restart | Typed visible outcomes and no cross-player mutation | Unknown relabelled success, blind resend, or leakage |

The hosted readback is the only evidence that may raise claims from local contract scope to hosted
continuity. A failed deployment remains an open release gate; it does not change the local evidence
or justify a fallback architecture.

## Rollback and recovery

Rollback is a release operation, not a Game Event operation. Eyad records the previous known-good
Receiver commit, package versions, migration state, and deployment revision before changing them.
If deployment is unhealthy, restore the previous application revision without deleting the database
or rewriting standing deliveries. Re-run `/healthz`, `/readyz`, migration readback, and the exact
source/package identity check.

For an ambiguous handoff response, preserve the stable delivery and handoff identities. Reconcile
the same receipt or leave the outcome `unknown`; never create a new task, increment the Event
sequence, or resend blindly. Revocation and expiry fence new deliveries while an already recorded
receipt remains historical truth.

## Explicit non-goals and reopen triggers

- No public claim is made from this draft, a local `202`, a successful package build, or a deployment
  attempt.
- No until-revoked v0.3 wire profile, gameplay change, effect-token reuse, browser credential, raw
  task locator, direct private-Core signer, second queue, or per-signal Thread message is added.
- Reopen TASK-036 and this packet if the standing route/receipt fields, source identity, package
  exports, Game schema/event mapping, same-task Adapter authority, hosted origin, or migration identity
  changes.

## Handoff acknowledgement

Eyad should return one signed-off note containing:

- the final packet/release identifier;
- exact source SHAs and package/tarball hashes;
- the deployed Receiver origin and revision;
- applied migration identities;
- focused and hosted command results;
- the same-task Adapter/runtime authority used; and
- any residual gate that prevents a stronger claim.

Until that note and readback exist, [`TASK-036`](../../../../Docs/Tasks/TASK-036-implement-standing-notification-handoff.md)
remains `in_progress` with local implementation green and hosted release open.
