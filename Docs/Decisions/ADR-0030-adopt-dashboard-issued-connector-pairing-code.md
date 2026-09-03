# ADR-0030: Adopt Dashboard-Issued Connector Pairing Codes

**Status:** Accepted local preview  
**Decision date:** 2026-09-01  
**Decision owners:** Eyad and project team  
**Scope:** Re-entry account enrollment and Local Connector first-run UX

> **Current disposition:** The Cloud Receiver implementation described here is superseded by
> [ADR-0032](ADR-0032-retire-current-cloud-receiver-runtime.md). The Local Connector pairing UX
> remains preserved as historical preview evidence and must not target the former receiver.

## Context

The account-first preview still made the CLI create a hidden device authorization, open a
verification URL, and wait for a browser approval. That makes the first-run authority difficult to
understand and caused the CLI and hosted Receiver to depend on a multi-step polling handshake.

The intended user experience is simpler: the person starts the Connector, creates or signs in to a
Re-entry user account in the browser, clicks **Pair this Mac** in the dashboard, and types the
short-lived code into the CLI.

## Decision

1. The authenticated Re-entry dashboard creates the pairing request by calling
   `POST /v0.1/account/pairing-sessions`.
2. The Receiver stores only a digest of the short-lived pairing code. The dashboard displays the
   raw code once with its expiry.
3. The CLI opens the dedicated user account page `/user-register?next=/user-dashboard` immediately
   when the pairing flow starts. After authentication, both registration and login land on the
   user portal `/user-dashboard`, whose only setup action is **Pair this Mac**. Its alternate link
   goes to `/user-login` or `/user-register`; developer registration and organization credentials
   remain on `/developer-register`, `/developer-login`, and `/dashboard`.
4. The CLI redeems the code with
   `POST /v0.1/account/pairing-sessions/claim`, sending the code and the local device name.
5. The Receiver atomically creates the account-linked Connector record, consumes the code, and
   returns one delivery-only Connector credential. The credential is saved only in the local
   Connector store.
6. The existing Receiver-owned Grant, delivery lease, Codex activation, and acknowledgement
   contracts remain unchanged. The older device-authorization endpoints remain available only as
   compatibility evidence and are no longer the normal CLI path.

7. User account setup has its own `/user-register`, `/user-login`, and `/user-dashboard` pages.
   Developer registration, organization creation, and Host API keys remain on the canonical
   `/developer-register`, `/developer-login`, and `/dashboard` surfaces. The legacy `/register` and
   `/login` paths redirect to the developer portal. The CLI never opens the developer credential flow.

## Flow

```text
CLI -> user: show Re-entry account URL
CLI -> browser: open /user-register?next=/user-dashboard
user -> Re-entry: create account or sign in
Re-entry -> user: redirect to /user-dashboard; developer credentials stay separate
user -> user dashboard: click Pair this Mac
dashboard -> Receiver: authenticated POST /v0.1/account/pairing-sessions
Receiver -> dashboard: pairing_code + expiry
user -> CLI: type pairing code
CLI -> Receiver: POST /v0.1/account/pairing-sessions/claim
Receiver -> CLI: connector credentials
CLI -> macOS: save credential and start background Connector
```

## Consequences

- First-run responsibility is visible: the account dashboard creates the pairing and the CLI
  redeems it.
- No Host-generated pairing code, browser token, account cookie, or organization API key reaches
  the Local Connector.
- The code is intentionally short-lived and single-use; the credential remains revocable and
  delivery-only.
- The dashboard and CLI now share a small explicit HTTP contract.
- Public deployment, production authentication, anti-abuse controls, and broad macOS support remain
  outside this local-preview decision.

## Supersession

This decision supersedes the Connector enrollment portion of ADR-0028. ADR-0028 still describes the
accepted separation between developer organization credentials, user account identity, Connector
credentials, and Re-entry-owned consent.

## Verification gate

The decision is locally verified when a fresh account can create a dashboard pairing code, a fresh
CLI can redeem it, the resulting Connector appears in the account list, and the existing delivery
path accepts that Connector credential without exposing account or Host secrets.
