# SDK-006 — Simple Consented Continuation Flow

**Status:** `separate_process_verified`  
**Date:** 2026-09-03  
**Owner:** Coordinated Host SDK, Cloud Receiver v2, and Local Connector increment  
**Task:** [TASK-025](../Tasks/TASK-025-build-simple-developer-to-connector-flow.md)  
**Decision:** [ADR-0041](../Decisions/ADR-0041-adopt-simple-consented-continuation-facade.md)

## Outcome and claim boundary

The normal Host integration now accepts only an authenticated subject, a bounded continuation
prompt, and a canonical URL. The additive `createReentry()` facade derives the protocol identifiers
and signed Manifest/Event fields, while the existing advanced SDK remains available. The active
Cloud Receiver v2 adds organization, one-time API-key reveal, SDK-guide, and redacted Event-history
surfaces. A consented prompt is delivered as bounded untrusted instruction data, and the Local
Connector places it inside a fixed safety frame before adapter dispatch.

One disposable local composition crossed the real Host SDK, Cloud Receiver v2, PostgreSQL, and a
separately spawned Local Connector worker through effect-backed acknowledgement and exact replay
after Receiver restart. Independent developer and end-user personas exercised the browser-facing
flow and were rerun after their findings were corrected.

This is local and separate-process evidence. It is not a deployed-production, external Codex,
general browser-automation, npm-publication, or arbitrary-business-safety claim. The verified source
is committed, pushed, and merged into the respective root and active-v2 `main` branches; those merge
commits are not deployed from their exact SHAs. An Event `202` remains accepted and queued only.

## Developer flow

```js
const reentry = createReentry({
  receiverOrigin: process.env.REENTRY_RECEIVER_ORIGIN,
  organizationApiKey: process.env.REENTRY_ORGANIZATION_API_KEY,
  hostPrivateKeyPem: process.env.REENTRY_HOST_PRIVATE_KEY_PEM,
});

const request = await reentry.request({
  subject: authenticatedUser.id,
  prompt: "Return to this supplier review when the report is ready.",
  url: "https://app.example/reviews/42",
});

const continuation = await reentry.confirm(request.handle, {
  onApproved: async (approved) => saveOnTheHost(approved),
});

// Later, only after the Host's real business event:
await reentry.trigger(await loadFromTheHost());
```

The browser receives the consent URL, not credentials or the approved continuation. The Host owns
persistence and decides when the later business event is real. The Receiver owns consent, device
selection, delivery, and acknowledgement state.

## Red, green, refactor

- **Red:** focused tests demonstrated the absent simple facade, developer control APIs, redacted
  Event projection, immutable instruction propagation, and Connector safety framing.
- **Green:** the smallest additive implementation reused the existing signed protocol and one-run
  Grant instead of weakening or replacing it.
- **Refactor:** common facade mapping, developer-portal state, and consent copy were consolidated;
  no fallback transport, hidden polling, retry, browser credential, or SDK-owned database was
  added.
- **Persona loop:** the first developer pass found that `pending` did not explicitly communicate
  queued-only status. It now renders `Queued`, alongside attempt and acknowledgement state. The
  first end-user pass found an unobvious signed-out login path and technical `Host`/`Grant` consent
  copy. The landing hero now exposes `Sign in`, and the same consent design uses plain user copy.

## Verification

Executed on the required Node `v24.20.0` baseline unless stated otherwise:

```text
Re-entry Core aggregate verification: 81/81 passed; package and process conformance passed
Host SDK verification: 25/25 passed
Local Connector verification: 47 passed, 12 explicitly opt-in skipped, 0 failed
Cloud Receiver backend aggregate: 14 suites, 56/56 passed
Focused consent suite after copy correction: 9/9 passed
Cloud Receiver Claim contract: 5/5 passed
Cloud Receiver Disconnect contract: 1/1 passed
Cloud Receiver Acknowledgement contract: 5/5 passed in three consecutive complete reruns
Simple SDK full-chain composition: 1/1 passed
Host SDK Next.js sample: 3/3 passed; production build passed
Cloud frontend: type-check passed; lint passed; production build generated 19 routes
Cloud backend: production build passed
SDK npm package dry-run: passed; @4xeoz/re-entry-sdk@0.3.1, 21 selected files
```

The dry-run describes the current checkout, not the registry artifact. Read-only registry
verification on 2026-09-03 returned published `0.3.1` with `gitHead` `9864ba0`; that commit predates
and does not export `createReentry()`. The developer persona inspected the guide but did not install
the registry package, so its visual pass did not catch the install/import mismatch. AUDIT-V2-011 and
TASK-031 own the release and clean-consumer gate.

## Release-readiness audit: 2026-09-04

The current `runtime/host-sdk/` source is at the parent repository's local release-candidate state.
Its package manifest and lockfile now both identify version `0.3.1`; `npm ci --ignore-scripts
--dry-run` confirmed the metadata is internally consistent. On Node `v26.5.0` with npm `11.17.0`,
`npm run verify` passed syntax checks and `25/25` SDK tests.
`npm pack --dry-run --json` also passed for the unchanged checkout version `0.3.1`; the candidate
shape contains `24` files, including the `createReentry()` server export and the bundled standing
Core source. The dry-run is an inspection only and does not create a registry artifact.

Registry readback still returns `@4xeoz/re-entry-sdk@0.3.1` at Git commit
`9864ba09b79a76641d8662502ccf918cd3fd4b3b`, which predates the facade. The checkout therefore has
passing release-candidate evidence but is not a releasable immutable version: no version bump,
commit, publication, portal change, deployment, or clean-consumer registry check was performed.
TASK-031 remains open for an explicitly approved new version, exact provenance, portal alignment,
and post-publication verification. The earlier Node 24 dry-run count of `21` selected files remains
historical evidence for that earlier checkout state.

### Local tarball clean-consumer probe: 2026-09-04

The current checkout was packed to a temporary directory with `npm pack --json` and installed into
a fresh `npm init -y` consumer on Node `v26.5.0` with npm `11.17.0`. The generated
`@4xeoz/re-entry-sdk@0.3.1` tarball contained `24` files, including the bundled Core source; the
consumer installed it successfully and imported the public `@4xeoz/re-entry-sdk/server` entrypoint.
The probe observed `createReentry` as a function and the installed package version as `0.3.1`.
Temporary package and consumer directories were outside the repository and no registry or
production state was changed.

This proves the current checkout's tarball/export shape and does not prove that the registry's
immutable `0.3.1` artifact contains the facade, nor does it close version provenance, publication,
portal alignment, deployment, or external-runtime gates. A first probe also attempted the private
`./package.json` subpath and failed with Node `ERR_PACKAGE_PATH_NOT_EXPORTED`; that was a test-script
mistake, not a package failure, and the corrected public-entrypoint probe passed.

The same SDK clean-consumer import was rerun on the required Node `v24.18.0` baseline with npm
`11.16.0` and passed for `@4xeoz/re-entry-sdk@0.3.1` (`createReentry` exported as a function). The
Connector tarball probe was also rerun on that baseline: `@4xeoz/re-entry@0.2.20` installed into a
fresh consumer, its bundled Core client accepted a canonical delivery lease with a non-empty
`continuation.instruction`, and the instruction was preserved in the normalized result. These are
checkout-tarball compatibility results; the published registry artifacts and exact-source release
identity remain unverified.

The Connector package has a separate release boundary. Registry `@4xeoz/re-entry@0.2.20` reports
root `gitHead` `733d77f`, but that commit records package version `0.2.14`. Its immutable tarball
bundles a Core client whose strict continuation shape omits `instruction`, while active v2 returns
that consented field. A Node `v24.20.0` representative claim response through the tarball returned
`connector_response_invalid`; the PM-approved `CONNECTOR-V2-E2E-001` run used the current checkout.
AUDIT-V2-012 and TASK-032 own the compatible Connector release and clean-consumer gate.

## Connector release-readiness audit: 2026-09-04

The clean `runtime/local-connector/` checkout passed `npm run verify` on Node `v26.5.0` with npm
`11.17.0`: its syntax check covered `36` modules, `49` enabled tests passed, and `12` external
active-v2 tests were explicitly skipped because their Receiver/database configuration was not
supplied. `npm pack --dry-run --json` passed without creating a tarball and described `35` files,
including the bundled Core client with the active instruction-bearing continuation fields and the
standing-v0.2 source modules. The package version remains the unchanged `0.2.20` checkout version.

This is current-checkout release-candidate evidence only. It does not prove a new immutable version,
registry compatibility, active-v2 Claim/full-chain execution, publication, deployment, or the
selected-product notification handoff. The registry `0.2.20` mismatch and its `instruction` rejection
remain the release defect owned by TASK-032; no package file or version was changed in this audit.

### Connector local tarball clean-consumer probe: 2026-09-04

The current Connector checkout was packed to a temporary directory with `npm pack --json` and
installed into a fresh `npm init -y` consumer on Node `v26.5.0` with npm `11.17.0`. The generated
`@4xeoz/re-entry@0.2.20` tarball contained `35` files and bundled `@webmcp-challenge/reentry-core`.
Using the bundled Core client, the clean consumer accepted a canonical v0.1 delivery lease carrying
the active `continuation.instruction`, preserved that field, sent the expected credential-free claim
request shape, and rejected an empty instruction with `connector_response_invalid`.

This proves the current checkout's package bundle and instruction validation in a clean consumer. It
does not prove that registry `0.2.20` contains the same source, nor does it close exact provenance,
version assignment, pairing-contract migration, active-v2 Claim/full-chain execution, publication,
deployment, or the selected-product notification handoff. Temporary package and consumer directories
were outside the repository and no registry or production state was changed.

The first Acknowledgement aggregate run produced one noncanonical transport response in ACK-003
and finished `4/5`. The isolated case passed immediately, followed by three complete `5/5` runs.
No production change was made for a non-reproduced harness observation; it remains a reopen signal
if it recurs.

The first backend aggregate attempt loaded a stale local database override and stopped before test
execution. Clearing that override and explicitly selecting the disposable PostgreSQL instance
produced the recorded `56/56` result.

## Runtime and database evidence

The disposable stack used Receiver `http://127.0.0.1:43240`, frontend
`http://127.0.0.1:43241`, and PostgreSQL on `127.0.0.1:55439`.

- Browser authentication retained both user and developer sessions and redirected authenticated
  login routes to their dashboards.
- The developer persona created and selected `Persona Studio`, inspected digest/prefix-only API-key
  metadata, used the simple SDK guide, and viewed a populated redacted Event row.
- Event `event_f8a7b963-e862-4a79-8d49-b8124b837fac` appeared as `Queued`, attempt `0`, and
  acknowledgement `Never`; no credential or Event body appeared in the portal.
- The end-user persona saw `Persona Mac` as paired and eligible, and verified the same signed prompt,
  source, one-run boundary, device choice, decline action, and approval action without deciding the
  live consent request.
- Read-only database inspection confirmed one owned organization, digest-only API-key rows, the
  paired device, approved consent facts, and the redacted pending Event projection.
- The separate-process integration independently proved the terminal acknowledged state and exact
  restart replay, then removed only its uniquely generated test rows.

Screenshots:

- `/private/tmp/reentry-developer-sdk-guide.png`
- `/private/tmp/reentry-developer-events-updated.png`
- `/private/tmp/reentry-user-persona-devices.png`
- `/private/tmp/reentry-consent-persona-updated.png`

## Source and delivery state

- Root review branch: `codex/reentry-main-candidate-preview`; root candidate SHA:
  `4713024a027a8834745ecccaf88ee85f93cf2885`; root `main` merge commit:
  `cdcc0a81aee0b58767ff8450f9a6757339974f92`
- Active v2 review branch: `codex/cloud-receiver-v2-clean-integration`; active-v2 candidate SHA:
  `0d7bc3c4282fd3db2e9558874a0941ece3df13f5`; active-v2 `main` merge commit:
  `6b4826f68bb3634d004c49259d9c5311c660d997`
- Both candidates are merged into their respective `main` branches; original owner-held worktrees
  remain untouched.
- Exact-SHA Node 24 `CONNECTOR-V2-E2E-001` rerun: 1/1 passed with zero failures or skips before
  the documentation-only follow-up.
- No deployment, alias promotion, Supabase migration, npm publication, or production smoke was
  performed from these merge commits.

## Residual gates and reopen conditions

A production release still requires exact committed source, clean integration of concurrent work,
a new SDK version whose registry artifact contains the facade, a new Connector version whose bundled
Core consumes the active instruction-bearing lease, corrected portal/install guidance, deployment
from that source, a production organization/key, a complete deployed consent-to-Event run, an
authorized Connector, and evidence of the selected concrete Agent/Browser/WebMCP adapter.

Reopen for any mutable post-consent instruction, cross-organization portal read, stored raw API key,
browser-visible server credential, canonical-URL mismatch, prompt treated as authority, hidden
retry/fallback, Event `202` represented as completion, failed acknowledgement, or persona-blocking
onboarding step.
