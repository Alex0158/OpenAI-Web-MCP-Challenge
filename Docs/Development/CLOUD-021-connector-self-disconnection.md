# CLOUD-021 — Connector Self-Disconnection

**Status:** `hosted_runtime_verified` — exact Git closure pending
**Date:** 2026-09-03
**Owner:** Cloud Receiver v2 and Local Connector integration team
**Scope:** Active v2 Connector lifecycle and subsequent hosted release evidence only; no retired Receiver, public Grant, or presence change
**Task:** [TASK-023](../Tasks/TASK-023-build-connector-self-disconnection.md)
**Decision:** [ADR-0040](../Decisions/ADR-0040-adopt-connector-self-disconnection.md)
**Contract:** [Feature 01 — Pairing and Connector Credentials](../Cloud-Receiver-Handoff/v2-build/01-pairing-and-credentials.md)

## Objective and closure level

Implement the smallest lifecycle change that makes one Connector's local disconnect and durable
Receiver authority converge. The behavior increment closed at `locally_verified`; a later,
separately authorized release action deployed the unchanged candidate and added the bounded hosted
evidence below.

## Red phase

The Local Connector focused command on Node `v26.8.1` was:

```sh
node --test test/pairing-client.test.mjs test/disconnect-lifecycle.test.mjs
```

Result before implementation: `3/6` passed and `3/6` failed at the intended missing boundaries:
the lifecycle module did not exist and the pairing client had no `disconnectConnector` method.

The Receiver focused command ran against a disposable local PostgreSQL database after all six
existing migrations were applied:

```sh
npm test -- --runInBand \
  src/modules/connectors/test/pairing.test.ts \
  src/modules/consent/test/consent.test.ts \
  src/modules/system-health/test/http.test.ts
```

Result before implementation: `16/21` passed and `5/21` failed only because
`POST /v0.1/connectors/disconnect` and its known-method handling returned `404` instead of the
specified responses. The first attempt without a configured test database was a harness failure
and is not counted as Red evidence.

## Minimal implementation

- Hash and atomically revoke one known Connector token with replay-safe timestamp preservation.
- Add the exact v2 HTTP controller, schema, route, and known-method policy.
- Add an exact Local Connector client operation and a small remote-before-local lifecycle helper.
- Map `revoked_at` to **Disconnected** and periodically refresh the signed-in account device list.
- Reuse the existing consent and delivery eligibility fences; add no schema migration.

## Green verification

Receiver focused verification against disposable PostgreSQL passed `3/3` suites and `21/21` tests:

```sh
npm test -- --runInBand \
  src/modules/connectors/test/pairing.test.ts \
  src/modules/consent/test/consent.test.ts \
  src/modules/system-health/test/http.test.ts
```

This includes first-use revocation, expired-token self-revocation, replay timestamp preservation,
unknown-token rejection, account-list projection, claim exclusion, consent-device exclusion, strict
body validation, known-method handling, and response-header policy.

The complete Receiver backend aggregate then passed `13/13` suites and `53/53` tests. Backend
type-check and build passed. Frontend type-check and lint passed. A fresh isolated webpack production
build generated all `19/19` pages and passed with the existing Next.js middleware-deprecation and
Edge-runtime dependency warnings.

The Local Connector aggregate passed syntax validation for `36` modules and `45/45` enabled tests,
with `0` failures and `12` intentionally opt-in cross-repository cases skipped. The new opt-in real
Receiver/Connector contract test then passed `1/1` against the disposable database. It proves the
actual pairing client and credential store, remote-first lifecycle, retained and revoked database
row, account-list projection, delivery-claim rejection, local credential removal, and replay-safe
second disconnection. `npm pack --dry-run --json` also passed for `@4xeoz/re-entry@0.2.19`; its
`32` package entries include `src/disconnect-lifecycle.mjs`, and the CLI entry point remains
executable.

## Browser and database evidence

An isolated frontend on `localhost:3011`, active v2 Receiver on `localhost:4011`, and disposable
account exercised the real user journey:

1. the dashboard issued a one-time code;
2. the real Local Connector pairing client claimed it and saved a temporary credential;
3. within the existing polling window the code changed to **Used** and **Browser Verification Mac**
   appeared as **Paired**;
4. the remote-first lifecycle returned `remote_disconnected: true`,
   `remote_duplicate: false`, and removed only its temporary credential; and
5. after the five-second account-list refresh, the unchanged page displayed both the used-code
   message and device row as **Disconnected**.

The browser console contained no warnings or errors. A read-only SQL query joined the Connector and
pairing-session rows and proved the Connector remained present, `revoked_at IS NOT NULL`, and the
pairing session remained consumed. A filesystem readback proved the temporary credential was absent.

## Runtime and Git state

- Runtime executed: Node `v26.8.1`, npm `11.19.0`, PostgreSQL `14.18`.
- Database: disposable local PostgreSQL at `127.0.0.1:55439`, database
  `reentry_disconnect_test`; all six existing v2 migrations were applied.
- The repository's Node 24 reproducible baseline was unavailable and therefore remains unexecuted.
- Root repository: branch `codex/eyad-reentry-core-foundation`, pre-existing `HEAD`
  `733d77f97cca34429e2784dcf39663256dd3544b`.
- Active v2 nested repository: branch `main`, pre-existing `HEAD`
  `e0d6b72f724aad7462b6a62c0591a081eac8cb66`.
- Neither SHA contains this increment. Both worktrees contain concurrent owner-held changes, so no
  exact implementation commit, push, or CI result is claimed. The deployment identities below bind
  the hosted artifacts, but they do not replace an exact source commit.

## Hosted deployment evidence

The exact locally verified source snapshot was released on 2026-09-03 without a schema migration:

- Cloud Receiver v2 deployment `dpl_4vMNbw715xvuLdh5X5zQnnfrKC1Y` is `Ready` at
  `https://cloud-receiver-rd1w4l5ct-eyads-projects-b54e035a.vercel.app` and is assigned to
  `https://cloud-receiver-delta.vercel.app`.
- Re-entry Cloud deployment `dpl_8Wy1bUScjdps4ZVscbHeH93f5sFq` is `Ready` at
  `https://re-entry-cloud-hljqpl4x9-eyads-projects-b54e035a.vercel.app` and is assigned to
  `https://re-entry-weld.vercel.app`.
- The Receiver is a Vercel `preview` deployment behind the public alias because only the Preview
  environment currently contains its required runtime variables. The frontend is a Vercel
  `production` deployment. This distinction remains visible and is not relabeled.
- Before aliasing, `/readyz` returned `200 {"status":"ready"}`, an unknown 43-character Connector
  token returned the expected `403 connector_identity_invalid` from
  `POST /v0.1/connectors/disconnect`, and browser preflight from
  `https://re-entry-weld.vercel.app` returned `204` with that exact allowed origin.
- The same three probes passed through the public Receiver alias after cutover. The public landing,
  user login, and user dashboard routes returned `200`; `/consent` without a token returned the
  expected `307` handoff to the Receiver consent route.
- Vercel returned no error-level entries for either deployment in the bounded fifteen-minute
  release window. Absence of matching logs is not evidence that no future runtime error can occur.

Subsequent real cross-origin browser evidence found a release-blocking gap outside the Connector
disconnect route: global Helmet `Cross-Origin-Opener-Policy: same-origin` on the deployed Receiver
severs `window.opener`, so the consent popup cannot notify and close back into its Host even though
the deployed renderer uses the signed Host issuer as `postMessage` target origin. A route-scoped
`Cross-Origin-Opener-Policy: unsafe-none` fix now exists locally and has local integration/browser
evidence, but it was written after this deployment and has not been released. Specifically,
deployment `dpl_4vMNbw715xvuLdh5X5zQnnfrKC1Y` was created at `05:59:23` Europe/London from
`consent.controller.ts` SHA-256
`ebbd20c3f7d176314bc7344c15041aa160fcae5c6545935efba4de6a209e15e6`; the local fixed controller
has mtime `06:16:41` and SHA-256
`f549cd48405fd7b66f6596641e53adebf0805972860223269baf2dfc5344e67c`. Therefore the live
deployment is not production-complete and does not prove hosted Host-to-Receiver popup completion.

Immediately before upload, the Receiver aggregate again passed `13/13` suites and `53/53` tests;
backend type-check and build, frontend type-check and lint, and a fresh isolated frontend production
build of all `19/19` routes also passed. The tested consent files retained identical SHA-256 hashes
before upload and after alias readback, so no concurrent edit entered between verification and the
deployed snapshot.

## Cross-layer reconciliation

- **Updated:** Feature 01 wire contract, Core business flow, ADR-0040, Task, Development evidence,
  active-v2 README, backend README, and Local Connector README now describe the same lifecycle.
- **Aligned:** existing `revoked_at` persistence, consent eligibility, delivery eligibility, and
  account-list ownership remain authoritative; no migration or public Grant route was needed.
- **Historical:** `runtime/cloud-receiver/` remains retired and was not changed by this increment.
- **Unverified:** Node 24, committed/pushed identity, CI, a credentialed hosted disconnect journey,
  the corrected hosted popup opener policy, and a full hosted account/pairing/consent/delivery
  journey.

## Non-goals and reopen conditions

No browser-session sign-out, dashboard revoke action, Connector deletion, heartbeat, online
presence, public Grant route, retired Receiver edit, npm publish, or deployment is included. Reopen
under the triggers in ADR-0040.
