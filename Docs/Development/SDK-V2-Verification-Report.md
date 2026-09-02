# SDK v2 Verification Report

**Date:** 2026-09-02  
**Result:** Local SDK-to-Cloud-Receiver v2 contract verified  
**Receiver commit:** `f67e741dd0392dd04f14d7d02764b7c0a7179dc5`

## Conclusion

The unchanged SDK works with the tested Cloud Receiver v2 consent contract for Host-key
registration, consent-session creation, consent status, and browser handoff. No polling, fallback,
alternate route, or production SDK change was added.

## Verification results

| Check | Result |
|---|---:|
| `SDK-V2-001` through `SDK-V2-004` against the actual Receiver app | **4/4 passed** |
| Normal SDK syntax and unit/adapter suite | **18/18 passed** |
| Cloud Receiver backend regression | **5/5 suites; 17/17 tests passed** |
| Real browser approve popup | **Passed** |
| Real browser decline popup | **Passed** |

The backend regression includes `CONSENT-004`, which verifies the public completion message and
that failed decisions emit no message.

## Browser evidence

Google Chrome headless, driven through Playwright, ran the actual browser SDK prompt and opened the
Receiver consent popup. Both flows:

- returned HTTP `200` from `/v0.1/account-consent-decisions`;
- delivered exactly `reentry.consent.complete` with `consent_session_id` and the decision status;
- matched the expected popup source and Receiver origin; and
- closed the popup through the unchanged SDK.

Approve produced Receiver status `approved` with effective status `active`. Decline produced status
`declined` with no binding.

## Contract coverage

- Host-key registration sends the public Ed25519 key with organization Bearer authentication and
  accepts the `webmcp.reentry_host_key` envelope plus idempotent replay.
- Consent-session creation sends the complete SDK-signed Manifest and accepts the opaque
  `webmcp.reentry_consent_session` envelope and `/consent?token=...` URL.
- Consent status exposes pending and approved state with only the public binding shape; Connector,
  delivery-target, account, and API-key values remain private.
- Browser completion is accepted only from the exact consent origin and popup source. The SDK does
  not treat the popup message alone as proof of approval; Host status confirmation remains required.

## Evidence boundary and assumptions

- The Receiver was tested from the clean nested `saas-boilerplate/` clone at the commit above; its
  local `main` is four commits ahead of `origin/main` and has not been pushed.
- Tests used Node `v26.8.1`, Homebrew PostgreSQL `14.18`, and a fresh disposable database on
  `127.0.0.1:55436`. The database was stopped after verification and credentials were supplied only
  in the shell.
- The real browser run used the explicit same-origin local configuration
  `FRONTEND_URL=RECEIVER_PUBLIC_URL=http://127.0.0.1:4010`.
- This is local process evidence only. It does not prove deployment, a hosted endpoint, a split-origin
  deployment, or full product integration. Event ingress, delivery, acknowledgement, and public
  Grant control remain separate gates.

## Records

- [SDK-003](SDK-003-cloud-receiver-v2-contract-tests.md) — detailed contract test record.
- [TASK-016](../Tasks/TASK-016-prepare-sdk-v2-contract-tests.md) — task lifecycle and closure evidence.
- [SDK-to-Cloud Receiver v2 integration contract](../Cloud-Receiver-Handoff/v2-build/08-sdk-cloud-receiver-integration.md) — cross-team handoff.
- [Contract test source](../../runtime/host-sdk/test/cloud-receiver-v2.contract.mjs) — opt-in real-app test.
