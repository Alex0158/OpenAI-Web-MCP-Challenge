# CLOUD-022 — Cloud Receiver v2 Consent and Developer Experience

**Status:** `verification_pending`  
**Date:** 2026-09-03  
**Owner:** Cloud Receiver v2 web experience  
**Scope:** Active `saas-boilerplate/` consent presentation, Receiver-origin decision guard, frontend session UX, and developer SDK guidance  
**Task:** [TASK-024](../Tasks/TASK-024-build-v2-consent-and-developer-experience.md)  
**Decision:** [ADR-0035](../Decisions/ADR-0035-adopt-cloud-receiver-v2-consent-targeting.md)

## Outcome

The active v2 web experience now carries a Host-created consent request through user login, renders
the prior approved consent visual direction with real Connector choices, persists approve or decline
through the Receiver-owned route, and gives developers an interactive current-SDK integration guide.
Public landing and matching authentication routes also recognize existing user or developer
sessions instead of asking them to sign in again.

This increment is locally code-, browser-, and database-verified. The accepted popup contract now
targets the exact signed Host origin rather than the Receiver itself, and `/consent` alone preserves
the cross-origin opener needed to deliver that notification. Receiver deployment
`dpl_AVGD8hA7bNwhcEykUQ8BMDbEX2sd` now serves the route-scoped opener-policy fix through the stable
public alias. Exact Git-attested source identity and a complete deployed Host-to-Receiver popup run
remain required before claiming production release end to end.

## Red, green, refactor

### Red

- The first renderer test failed because no dedicated consent-page renderer existed.
- A real browser approval from the Receiver-hosted page then failed with
  `403 csrf_origin_invalid`: the decision route trusted the frontend origin even though the page
  submitting the request is served by the Receiver.
- The failed decision left the session pending and created no Grant.
- A renderer test then failed because the completion event targeted the Receiver's own
  `window.location.origin`, which cannot address a different Host origin.
- A route test then failed because global Helmet middleware returned
  `Cross-Origin-Opener-Policy: same-origin` on `/consent`, severing the Host opener before the
  correctly targeted message could be delivered.

### Green

- Added escaped pending, no-device, error, approved, and declined consent states without embedding
  the raw consent token in generated HTML.
- Preserved the exact consent URL through `/user-login?return_to=...` and rejected unsafe return
  destinations.
- Scoped the account decision CSRF check to `RECEIVER_PUBLIC_URL`; the separate frontend origin is
  rejected and verified to leave the consent pending.
- Added session-aware landing actions and login/register bypass for matching existing account
  sessions.
- Added a five-step interactive SDK guide with copyable server/browser examples and explicit
  credential and queued-only Event boundaries.
- Amended ADR-0035 and changed the completion target to the exact signed, Receiver-validated Host
  issuer origin. No wildcard, polling fallback, alternate transport, or weaker SDK check was added.
- Scoped `Cross-Origin-Opener-Policy: unsafe-none` to the Receiver's `/consent` document; all other
  routes retain Helmet's stronger default policy.

### Refactor

- Extracted consent HTML from the controller into one typed renderer.
- Reused the existing landing, authentication, dashboard, icon, typography, and color system.
- Added no dependency, schema, API path, payload field, Connector lifecycle, Grant rule, delivery
  behavior, or deployment change.

## Verification

Executed with Node `v26.8.1`, npm `11.19.0`, and PostgreSQL `14.18`, then repeated on the required
Node `v24.20.0` closure baseline:

```text
Backend focused consent integration: 9/9 tests passed
Consent renderer: 5/5 tests passed
Backend aggregate: 13 suites, 53/53 tests passed
Backend type-check: passed
Backend build: passed
Host SDK syntax and tests: 18/18 tests passed
Frontend lint --max-warnings=0: passed
Frontend type-check: passed
Frontend webpack production build: passed, 19/19 routes generated
```

The production frontend build retained existing Next.js warnings for the deprecated middleware
filename and an Edge-runtime dependency use of `process.cwd`; neither blocked compilation.

The Node 24 repetition passed all 13 backend suites and 53 tests, backend type-check and build, and
all 18 Host SDK tests.

## Runtime and database evidence

A disposable local stack used frontend `http://127.0.0.1:3100`, Receiver
`http://127.0.0.1:4100`, Host SDK demo `http://127.0.0.1:4200`, and PostgreSQL `reentry_web_qa` on
`127.0.0.1:55441`. All six existing v2
migrations were applied.

The browser flow proved:

1. the real Host SDK registered a fresh public key and created a signed consent session;
2. opening the consent URL without a user session redirected to `/user-login` with the exact safe
   consent return path;
3. login returned to the same consent request and displayed the signed Host title, scope, and
   eligible `QA Studio Mac`;
4. the first real approval exposed the origin mismatch as `csrf_origin_invalid` with no database
   mutation;
5. after correcting the message target, the Host still reported that the popup closed because the
   Receiver's global `same-origin` opener policy had severed `window.opener`;
6. after the consent-only opener-policy fix, the popup remained connected, approval closed it
   automatically, and the Host changed to **Approved in Re-entry**;
7. the live Receiver HTML embedded only `http://127.0.0.1:4200` as the completion target while the
   decision sender remained `http://127.0.0.1:4100`;
8. the Host server independently confirmed the approved session, then sent one later Event; and
9. read-only SQL confirmed `status = approved`, `decision_action = approve`,
   `expected_origin = http://127.0.0.1:4200`, `runs_remaining = 0`, one Event, and one pending
   delivery; the Receiver's Host-facing Event result was accepted and queued.

The first controlled-browser run exposed a product header problem rather than an unavoidable test
limitation: the Receiver itself sent `Cross-Origin-Opener-Policy: same-origin`. With the route-scoped
header correction, the same controlled Chrome flow completed through native `window.opener`; no
fallback, polling path, wildcard target, or browser approval authority was introduced.

Browser diagnostics contained no console warnings or errors after the fix. Evidence screenshots:

- `/private/tmp/reentry-v2-session-aware-home.png`
- `/private/tmp/reentry-v2-sdk-documentation.png`
- `/private/tmp/reentry-v2-consent-screen.png`
- `/private/tmp/reentry-v2-consent-approved.png`
- `/private/tmp/reentry-v2-sdk-handoff-exact-origin.png`
- `/private/tmp/reentry-v2-consent-cross-origin.png`
- `/private/tmp/reentry-v2-consent-approved-cross-origin.png`
- `/private/tmp/reentry-v2-host-approved-popup-complete.png`

Connector self-disconnection was implemented concurrently under
[CLOUD-021](CLOUD-021-connector-self-disconnection.md), with non-overlapping ownership. Its paired
and disconnected screenshots remain separate evidence and are not relabeled as this increment's
work.

## Source and delivery state

- Root branch: `codex/eyad-reentry-core-foundation`
- Root pre-existing `HEAD`: `733d77f97cca34429e2784dcf39663256dd3544b`
- Active v2 nested branch: `main`
- Active v2 pre-existing `HEAD`: `e0d6b72f724aad7462b6a62c0591a081eac8cb66`
- Both worktrees contain concurrent owner-held changes. Neither SHA includes this increment.
- Receiver deployment: `dpl_AVGD8hA7bNwhcEykUQ8BMDbEX2sd`, unique URL
  `https://cloud-receiver-hgvd0slxr-eyads-projects-b54e035a.vercel.app`, served publicly by
  `https://cloud-receiver-delta.vercel.app`.
- Vercel reports the deployment as `READY` with target `preview`; the stable public alias was moved
  only after candidate verification. This is not a claim that Vercel's separate Production
  environment is configured.
- Web-app deployment: `dpl_8Wy1bUScjdps4ZVscbHeH93f5sFq`, served by
  `https://re-entry-weld.vercel.app`.
- Candidate and post-alias probes both returned `200` from `/healthz`, `200` from `/readyz`, and
  `204` from the user-login CORS preflight for `https://re-entry-weld.vercel.app`.
- `/consent?token=invalid` returned the expected typed `404 consent_token_invalid` with
  `Cross-Origin-Opener-Policy: unsafe-none`; `/healthz` and an unrelated `404` retained
  `Cross-Origin-Opener-Policy: same-origin`.
- The deployed working-tree files were hashed immediately before release:
  `consent.controller.ts` is
  `f549cd48405fd7b66f6596641e53adebf0805972860223269baf2dfc5344e67c` and
  `consent-page.ts` is
  `ecfea7ec3ad2fddeef6066573e0aceadf1129deeead5cbfbf6ea02d9b3d7bd95`.
- Authenticated production-browser checks loaded the landing page, redirected `/user-login` to the
  existing user dashboard session, listed three paired Macs, and loaded the Devices, Contracts, and
  Guide routes without captured console errors. Contracts remain explicitly preview data, and
  device rename, revoke, activity, and live-presence controls remain placeholders.
- The Guide route still renders public `Sign in` and `Start connecting` actions while the same
  browser has an authenticated user session. This separate frontend inconsistency was not mixed
  into the Receiver release.
- Bounded Vercel CLI logs correlated the probes and active Connector polling with this deployment;
  a `--level error` query returned no entries. The separate observability connector returned `403`,
  so centralized error aggregation remains unavailable rather than being treated as zero errors.
- The deployment build reported the existing dependency backlog of three moderate and four high
  audit findings. No forced dependency or Prisma downgrade was included in this narrow release.
- This is bounded upload evidence, not Git attestation: no commit SHA contains the deployed
  working-tree snapshot. CI, a complete deployed popup decision, and production-readiness are not
  claimed by this record.

## Read-only hosted alias recheck: 2026-09-04

The stable aliases were rechecked without credentials or state-changing requests. The Receiver
returned `200 {"status":"ok"}` from `/healthz` and `200 {"status":"ready"}` from `/readyz`. An
invalid consent token returned the expected typed `404 {"error":{"code":"consent_token_invalid"}}`;
that response retained `Cross-Origin-Opener-Policy: unsafe-none`, while `/healthz` retained the
default `same-origin` policy. A frontend-origin `OPTIONS` preflight for
`/v1/auth/users/logout` returned `204` with the configured `https://re-entry-weld.vercel.app`
origin and credentials enabled. The frontend alias root returned `200` and the expected Next.js
HTML shell.

These are current public route/header smokes only. They do not prove exact Git attestation, a
credentialed popup decision, Host-server confirmation, later Event delivery, database mutation,
Connector completion, or production environment configuration.

## Residual verification gate

The target-origin contract mismatch is resolved: the Receiver sends only to the exact signed Host
issuer origin, while the SDK continues to require the exact Receiver sender and popup source before
asking the Host server to confirm status. The route-scoped opener policy is deployed, and the
complete local cross-origin browser flow is verified. The remaining gates are an exact Git identity
containing the final source and one complete deployed Host consent creation, popup decision,
Host-server confirmation, and later Event run with an authorized production test organization. No
production API key was created or borrowed for this release check, and no fallback, wildcard target,
polling path, or browser authority was added.

## Reopen conditions

Reopen for any consent payload or authority change, weaker origin or return-path validation,
credential exposure, different Event `202` meaning, SDK export change, changed dashboard session
model, or failed cross-origin completion proof.
