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
general browser-automation, npm-publication, committed-source, or arbitrary-business-safety claim.
An Event `202` remains accepted and queued only.

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

The Connector package has a separate release boundary. Registry `@4xeoz/re-entry@0.2.20` reports
root `gitHead` `733d77f`, but that commit records package version `0.2.14`. Its immutable tarball
bundles a Core client whose strict continuation shape omits `instruction`, while active v2 returns
that consented field. A Node `v24.20.0` representative claim response through the tarball returned
`connector_response_invalid`; the PM-approved `CONNECTOR-V2-E2E-001` run used the current checkout.
AUDIT-V2-012 and TASK-032 own the compatible Connector release and clean-consumer gate.

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

- Root branch: `codex/eyad-reentry-core-foundation`
- Root pre-existing `HEAD`: `733d77f97cca34429e2784dcf39663256dd3544b`
- Active v2 nested branch: `main`
- Active v2 pre-existing `HEAD`: `e0d6b72f724aad7462b6a62c0591a081eac8cb66`
- Both worktrees contain concurrent owner-held changes; neither SHA contains this increment.
- No commit, push, deployment, alias promotion, Supabase migration, npm publication, or production
  smoke was performed for this increment.

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
