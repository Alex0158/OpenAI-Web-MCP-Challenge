# TASK-011: Build Dashboard-Issued Connector Pairing

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-01

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P0`
- Owner: Eyad and project team
- Current increment: Replace the normal CLI account-authorization path with dashboard-issued pairing codes; locally verified.
- Next gate: Exercise the new endpoint against the deployed Vercel/Supabase Receiver before making a hosted claim.
- Dependencies: ADR-0030, TASK-009, and the existing Re-entry Core delivery contracts.

## Objective

Make first-run Connector setup one understandable loop:

1. the CLI opens the dedicated Re-entry user account page immediately;
2. the user creates or signs in to a user account;
3. the dashboard creates and shows a short-lived pairing code;
4. the CLI redeems the code and saves the Connector credential; and
5. the existing background Connector continues to use the same delivery protocol.

## 4. Non-goals

- changing Receiver Grant, delivery lease, Codex activation, or acknowledgement semantics;
- adding OAuth, MFA, recovery, billing, or production anti-abuse controls;
- exposing account cookies, organization API keys, or Connector credentials to the browser or Codex;
- deleting the older compatibility endpoints before their evidence is no longer needed; or
- claiming public deployment or cross-machine reliability from local tests.

## Verification

- v1 product databases migrate to v2 without resetting existing rows;
- an authenticated dashboard request creates a code and never returns a Connector token;
- the CLI claim accepts the displayed code, rejects malformed or expired codes, and returns typed
  credentials;
- the claimed Connector is visible through the account Connector list and can claim existing work;
- the CLI help and package README describe the new flow; and
- Cloud Receiver, Local Connector, Re-entry Core, and governance checks are run with runtime names
  recorded.

## 5. Verification and closure

- Cloud Receiver: 27 tests passed on Node 26.8.1, including the fresh dashboard-code HTTP flow and
  the v1-to-v2 product-store migration path.
- Local Connector: 30 tests passed on Node 26.8.1.
- Re-entry Core: `npm run verify` passed 80 tests, conformance, and package verification.
- Repository validators, sensitive scans, and `git diff --check` passed.

## 6. Reopen condition

Reopen if the normal CLI path again requires a hidden browser approval, if code redemption is not
atomic, or if account and Connector credentials cross their stated boundaries.
