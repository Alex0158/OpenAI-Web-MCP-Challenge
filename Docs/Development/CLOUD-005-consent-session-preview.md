# CLOUD-005: Consent-session preview

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Risk profile:** Assured — consent, identity binding, opaque capability, persistence, and
cross-boundary Grant creation  
**Status:** `locally_verified`  
**Opened:** 2026-09-01  
**Branch:** `codex/eyad-reentry-core-foundation`

> **Current disposition:** `DEPRECATED` for the Cloud Receiver implementation — this record is
> historical evidence only. The runtime it describes was retired by [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md);
> the application-neutral consent contract remains separately preserved.

## Objective

Connect the Host SDK's signed Manifest and browser decision prompt to a local Re-entry consent
session. A paired Host user should be able to submit a signed Manifest, receive a public challenge,
approve or decline it through a Host server route, and receive the Receiver-owned public binding
without exposing a private Grant or organization credential to the browser.

## Authority and boundary

- TASK-003 owns the Cloud Receiver lifecycle and next production gate.
- ADR-0007 and ADR-0008 retain the protocol, Host issuance, Receiver Grant, and consent authority
  contracts.
- ADR-0020 retains Host-user-to-Connector pairing.
- ADR-0021 retains Host public-key registration and key lookup.
- ADR-0022 owns this local consent-session HTTP and SDK handoff.

The Host application's authenticated server session is the trusted user boundary for this preview.
The preview is not a production identity or anti-CSRF implementation.

## Planned surfaces

- `runtime/cloud-receiver/src/consent-control.mjs` — authenticated consent session and decision
  routes plus Core consent authority;
- `runtime/cloud-receiver/src/pairing-store.mjs` — durable consent-session metadata and migration;
- `runtime/cloud-receiver/src/local-preview-composition.mjs` — consent authority and route wiring;
- `runtime/host-sdk/src/server.mjs` — server-side session, decision, and Host-key methods;
- `runtime/host-sdk/src/next.mjs` — server route helpers; and
- focused tests and README updates for the full preview flow.

## Falsifiers and stop conditions

- A browser can approve without a valid opaque token, paired subject, or organization credential.
- The consent route returns a private Grant, raw Connector credential, or organization secret.
- Replayed approval creates a second Grant or conflicting action changes the first decision.
- The Host SDK sends organization credentials from its browser entrypoint.
- Consent persistence or migration silently falls back to memory or loses existing pairing state.
- A failed Core decision leaves an unrecoverable stored decision without a bounded retry path.

## Verification result

The increment is locally verified with Node `v22.14.0` and `NODE_OPTIONS=--no-warnings`:

1. Cloud Receiver syntax check: 24 modules; Cloud Receiver tests: 19/19 passed;
2. Host SDK tests: 11/11 passed;
3. Re-entry Core verification: 79/79 tests passed, conformance passed, and package verification
   passed; and
4. repository validators, sensitive scans, repository validation, sensitive-pattern scan, and
   `git diff --check` passed.

Node 24 remains the reproducible closure baseline and was not the runtime executed in this shell.

The strongest supported claim is local loopback/test evidence. No production identity, trusted
browser UI, Agent activation, Host effect, deployment, or public hosting claim is in scope.

## Next gate

Select the supported Agent activation route and selected Host workflow, then replace preview
identity and consent assumptions with the production contracts required by that vertical slice.
