# CLOUD-004: Re-entry Cloud console preview

**Status:** locally verified, loopback-only preview  
**Date:** 2026-09-01  
**Parent task:** [TASK-003](../Tasks/TASK-003-productionize-and-deploy-cloud-receiver.md)  
**Scope:** lightweight product shell for the Cloud Receiver; no public deployment

> **Current disposition:** `DEPRECATED` — this console implementation record is historical
> evidence only. The runtime it describes was retired by [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md).

## Outcome

The Cloud Receiver now has a small product surface that can be opened in a browser:

```text
landing page -> create account or sign in -> organization chooser
             -> organization chooser shows only existing organizations or Create organization
             -> Each organization opens /:organizationId/dashboard
             -> Overview is the focused first tab with Quick connect and Secrets drawers
             -> Activity, Pending work, and Contracts are separate sidebar pages
             -> Quick connect provides framework-specific setup and copyable AI instructions
```

The implementation keeps the control plane and Receiver data plane in one modular Node service.
It uses a separate file-backed SQLite database for account, organization, API-key, and session
records, while the existing Receiver Core and local pairing preview remain the protocol/data-plane
authority.

## Product contract

### Account

The local preview uses a minimal credential shape:

- email (`identity`); and
- password (`password`) with a minimum length of eight characters.

The code and PIN are stored as a salted `scrypt` digest. The browser receives an opaque, seven-day
HttpOnly session cookie; it does not receive the stored credential material.

This is demo authentication, not a production identity system. There is no email verification,
password reset, MFA, anti-abuse service, or production recovery process yet.

### Organization and API key

One account can own multiple organizations. Each organization receives an API key with the form
`re_org_<random secret>`.

- the full secret is returned only when the organization or key is created;
- only a SHA-256 digest and a short prefix are stored;
- the dashboard lists the prefix and status, never the full secret; and
- a key can be revoked without deleting the organization; and
- an owner can delete an organization from the organization manager, which also deletes its
  account-console API keys.

The intended next data-plane step is to make Host ingress authenticate with these organization
keys. The current local Host-key preview still uses its explicitly configured preview credential;
this increment does not claim production enrollment or full account-to-event wiring.

### Activity view

The authenticated dashboard exposes a read-only view of the configured local Receiver instance.
It shows event and delivery lifecycle metadata only: event type, workflow id, delivery status,
attempt counts, and bounded timestamps. It deliberately does not expose event payloads, receipts,
subjects, bindings, connector tokens, or private managed-context data. Because the current preview
Receiver schema does not yet persist account or organization ownership, `receiver_scope` identifies
the configured preview instance rather than claiming per-organization analytics.

## HTTP surface

### Browser pages

| Route | Purpose |
|---|---|
| `GET /` | Public Re-entry Cloud landing page |
| `GET /developer-register` | Create a local preview developer workspace |
| `GET /developer-login` | Sign in to the developer portal |
| `GET /user-register` | Create a user account for Local Connector pairing |
| `GET /user-login` | Sign in to the user pairing portal |
| `GET /user-dashboard` | Create short-lived pairing codes and view connected Macs |
| `GET /register` and `GET /login` | Compatibility redirects to the developer portal |
| `GET /docs` | Public Host SDK setup and integration documentation |
| `GET /dashboard` | Authenticated overview with setup, activity, and next-step summary |
| `GET /dashboard/activity` | Authenticated event history with selectable redacted lifecycle details |
| `GET /dashboard/pending` | Authenticated pending-delivery queue with selectable retry and lease details |
| `GET /dashboard/organizations` | Authenticated organization chooser showing existing organizations or Create organization |
| `GET /:organizationId/dashboard` | Authenticated organization-scoped dashboard; Overview is the default tab |
| `GET /:organizationId/dashboard/activity` | Organization dashboard activity page |
| `GET /:organizationId/dashboard/pending` | Organization dashboard pending-work page |
| `GET /:organizationId/dashboard/contracts` | Organization dashboard protocol-contract page |
| `GET /dashboard/organizations/:id` | Compatibility route to the same organization dashboard |
| `GET /dashboard/quick-connect` | Authenticated Next.js and Node.js setup instructions |
| `GET /assets/reentry-hedgehog-engineer.png` | Same-origin compatibility asset; active pages do not reference it |

### JSON routes

| Route | Purpose |
|---|---|
| `GET /api/session` | Report the current session |
| `POST /api/auth/register` | Create an account and session; it creates no organization |
| `POST /api/auth/login` | Authenticate and create a session |
| `POST /api/auth/logout` | Destroy the current session |
| `GET /api/organizations` | List organizations owned by the session account |
| `POST /api/organizations` | Create an organization and return its new API key once |
| `DELETE /api/organizations/:id` | Delete an owned organization and cascade-delete its account-console API keys |
| `GET /api/organizations/:id/api-keys` | List key prefixes and statuses |
| `POST /api/organizations/:id/api-keys` | Create and return a new API key once |
| `POST /api/organizations/:id/api-keys/:id/revoke` | Revoke one organization key |
| `GET /api/activity` | Return redacted event and pending-delivery metadata for the configured Receiver instance |
| `POST /v0.1/account/pairing-sessions` | Create a short-lived Connector pairing code for the signed-in user |
| `POST /v0.1/account/pairing-sessions/claim` | Redeem a pairing code from the Local Connector |
| `GET /v0.1/account/connectors` | List the signed-in user’s connected Macs |

All JSON requests are bounded and exact enough for this preview. Responses are `no-store`; HTML
uses an inline CSP, and the active landing, auth, and dashboard screens use a text-only Re-entry
wordmark. The existing mascot asset route remains available for compatibility, but no active page
references it. The console loads the ShopVibe-inspired Poppins/Nunito/Space Mono stack from Google
Fonts and writes server responses into DOM text nodes rather than treating them as HTML.

## Product personality

The landing-page direction follows the supplied ShopVibe analysis while keeping Re-entry's own
protocol vocabulary:

- near-white canvas (`#fafafa`), ink typography, fuchsia actions (`#d946ef`), and cyan/yellow
  signal accents (`#22d3ee` / `#facc15`);
- Poppins headlines, Nunito body copy, Space Mono protocol labels, and pill CTAs;
- one continuously animated element per viewport: a self-contained WebGL mesh shader behind the
  hero, with visibility and reduced-motion pausing built in;
- a text-only `re-entry` wordmark shared by the public, auth, and console surfaces; and
- product copy reduced to one hero, a compact `manifest -> grant -> delivery` strip, and one
  practical setup section, so the energy serves the actual Re-entry model without redundant
  marketing sections.

This increment applies the visual direction to the landing, auth, and dashboard surfaces. The
landing page gives local-machine and developer audiences separate setup tabs. After authentication,
the dashboard begins with a focused organization chooser: no sidebar, metrics, events, or setup
content appear until the user chooses or creates an organization. Each organization then opens
`/:organizationId/dashboard`, a clean scoped shell with Overview first and sidebar pages for
Activity, Pending work, and Contracts. Overview intentionally has only two primary actions:
Quick connect opens a right-side drawer with Next.js/Node setup, environment variables, and
copyable instructions for an AI coding agent; Secrets opens a right-side drawer with the
organization ID, key prefixes/status, and one-time key creation/reveal. Activity and pending
delivery rows remain selectable and show available redacted lifecycle metadata in a detail panel.
The existing account and session behavior is unchanged. A public Developer Docs page now explains
the SDK setup, exact consent and delivery flow, available server methods, and
Host/browser/Re-entry/Connector boundaries.

## Evidence

Validated locally on 2026-09-01:

- `npm run check:syntax` passed for the Cloud Receiver package with 27 modules;
- `node --test test/dashboard-control.test.mjs` passed: landing page, protected dashboard redirect,
  registration, session cookie, dashboard access, authenticated activity projection, organization
  listing, organization workspace rendering, second-organization creation, and owned-organization
  deletion with key cascade;
- `node --test test/receiver-activity.test.mjs` passed: empty Receiver activity, redacted event
  projection, pending delivery, and acknowledged-delivery transition;
- `NODE_OPTIONS=--disable-warning=ExperimentalWarning npm run verify` passed all 21 Cloud Receiver
  tests on the current Node 22 runtime; the package declares Node 24 as its baseline;
- a live loopback process using `src/product-preview-composition.mjs` returned successful landing,
  registration, authenticated dashboard, organization listing, and organization creation results,
  served the mascot asset as `image/png`, and an HTML smoke check confirmed the landing audience
  tabs plus the organization-scoped dashboard, its Activity/Pending/Contracts routes, sidebar,
  Quick connect drawer, Secrets drawer, and copyable setup markers;
- an earlier in-app browser inspection at `127.0.0.1` confirmed the text-only wordmark, absence of
  active mascot references, dashboard organization/key actions, and the landing hero shader.
- the public `/docs` page returned `200` without authentication and its rendered content included
  organization-key setup, SDK consent methods, request flow, and browser trust-boundary guidance.

## Non-goals and reopen conditions

This record does not prove public hosting, TLS, production identity, multi-tenant isolation,
credential recovery/rotation, account-scoped activity analytics, real consent or Grant creation,
Browser SDK delivery, Host business effect verification, Codex activation, or deployment. Reopen
this increment when dashboard keys are connected to the Host event-ingress authority, Receiver
activity is account-scoped, or production authentication and deployment are selected.
