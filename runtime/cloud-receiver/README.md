# Re-entry Cloud Receiver

> **DEPRECATED — 2026-09-02:** This package and its hosted preview are retired. The source,
> commands, tests, and deployment notes below are preserved as historical evidence only. Do not
> create new integrations, credentials, traffic, or production data for this receiver. The default
> Vercel entry point returns `410 receiver_deprecated`; a replacement cloud service must be defined
> and verified separately.

The product preview combines a browser account, organizations and server keys, Receiver Core,
account-owned consent, durable delivery, and account-linked Connector devices in one loopback
service.

> Historical boundary: the account-first path and the Supabase/Prisma hosted adapter were MVP
> previews. They were never a production deployment: they had no production TLS termination, email
> verification, account recovery, rate limiting, abuse controls, or general multi-instance capacity
> claim.

Former hosted preview URL: [https://re-entry-weld.vercel.app](https://re-entry-weld.vercel.app).
The former Vercel project was named `re-entry-cloud`; its short automatic hostname
`re-entry-cloud.vercel.app` is already owned by another Vercel account, so `re-entry-weld.vercel.app`
was the deployment alias. `/healthz`, `/readyz`, the canonical developer auth routes, and
the existing-session user dashboard were externally verified. The full hosted auth and pairing
write path remains historical evidence and is not a current availability or production-readiness
claim.

## Historical hosted MVP configuration (deprecated)

The former Vercel function used Supabase PostgreSQL through Prisma. The configuration below is
preserved for historical investigation only. Do not create or rotate credentials for this retired
receiver, and never commit any values:

```text
DATABASE_URL  # Supabase transaction-mode pooler, port 6543, with pgbouncer=true
CLOUD_RECEIVER_RUNTIME_DATABASE_URL  # Supabase session-mode pooler, port 5432, for runtime locks
DIRECT_URL    # Supabase direct or session-mode URL for Prisma migrations
CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET
```

Historically, mutating runtime traffic used `CLOUD_RECEIVER_RUNTIME_DATABASE_URL` because the preview serialized
writes with a PostgreSQL advisory transaction lock; acquisition is fail-fast, so contention returns
a bounded `503 receiver_busy` response instead of hanging or crashing the function. Read-only
`GET` requests skip the lock and still use the same transaction-mode-compatible persistence path.
Supabase transaction-mode pooling does not support advisory locks. `DATABASE_URL` remains the
local/backward-compatible fallback when the runtime-specific variable is not set. Schema migration
commands use `DIRECT_URL`:

```sh
npm run db:generate
DIRECT_URL='[set privately]' npm run db:migrate
```

The former Vercel deployment used `npm run vercel-build`, which ran the additive migration with
`DIRECT_URL` or the configured session-mode runtime URL before generating the Prisma client. This
keeps a new function from going live before its native tables exist.

The former Vercel adapter persisted the account, organization, device, consent, event, and delivery
records in native Prisma/Postgres tables. The old snapshot table is used only once to backfill an
existing preview database, then remains empty for rollback visibility. The synchronous Core still
runs against temporary SQLite files during this preview, so requests remain serialized and this is
not a high-throughput production persistence model.

The durable tables are grouped by business responsibility:

```text
identity:     reentry_accounts, reentry_organizations, reentry_api_keys, reentry_sessions
devices:      cloud_connectors, cloud_host_signing_keys, product_account_connectors,
              product_account_pairing_requests, product_device_authorizations
continuation: product_account_consent_sessions, receiver_challenges, receiver_grants,
              receiver_events, receiver_deliveries, receiver_delivery_states,
              receiver_delivery_attempts
```

The additive migration created these tables without deleting the old snapshot table. After the
migration is deployed, the first ordinary request imports any existing snapshots and writes the
relational rows atomically. Confirm the first request and `/readyz` before removing the old table in
a later cleanup migration.

## Historical error contract (deprecated)

Browser and API failures use a small public envelope and never expose stack traces, database
messages, secrets, or connection details:

```json
{ "error": { "code": "account_exists" } }
```

Typical responses are `422` for invalid input, `401` for a missing or invalid session, `403` for
an authorization failure, `404` for a missing record, `409` for a conflict such as a duplicate
account, `410` for an expired continuation, `503` for an unavailable or busy Receiver, and `500`
for an unexpected failure. The browser translates known codes into actionable messages. Retry a
`503 receiver_busy` response only after its `Retry-After` interval; a `receiver_internal_error`
response means the request was not completed.

`GET /readyz` returns `200 {"status":"ready"}` when the persistence boundary is available and a
bounded `503` response when it is not. It does not allow a readiness exception to become a
function crash.

## Historical local preview (deprecated)

The commands in this section reproduce the retired local composition only. They are not an
installation or deployment path for new work.

Requirements: Node.js 24 or newer.

```sh
npm install
npm start
```

Open `http://127.0.0.1:43224`. The preview creates private local state under
`~/.reentry/receiver-preview`, including a generated Receiver secret and four SQLite databases.
Set `CLOUD_RECEIVER_PORT` or `REENTRY_LOCAL_STATE_DIR` only when the defaults conflict with another
local process.

```text
create Re-entry account
  -> create organization + reveal its Host API key once
  -> install the Local Connector on a Mac
  -> sign in through the user portal, click Pair this Mac, and enter the code in the CLI
  -> add the Host SDK to the website server
  -> Host sends signed Manifest and receives a consent URL
  -> person approves on Re-entry and chooses the connected Mac
  -> Host receives an opaque binding and later sends a signed Event
  -> Local Connector claims the delivery and opens Codex
```

The former first-run path started in the Connector: it opened the dedicated user account page, then
the signed-in user lands on `/user-dashboard` and clicks **Pair this Mac**. That user dashboard creates
a short-lived code; the CLI redeems it and receives the delivery-only Connector credential. Developer
credentials remain on the separate `/developer-login`, `/developer-register`, and `/dashboard` path.
The older verification URL
and approval page remain below as compatibility evidence.

The Host never receives the Re-entry account id, Connector id, Connector token, or browser session.
The Connector never receives the organization key or Host signing key.

## Historical account-first routes (deprecated)

```text
POST /api/auth/register                    browser account
POST /api/auth/login
GET  /developer-register                   developer registration portal
GET  /developer-login                      developer login portal
GET  /user-register                         dedicated user page for first-time Mac pairing
GET  /user-login                            dedicated user page for returning Mac pairing
GET  /user-dashboard                        user portal for creating Connector pairing codes
POST /api/organizations                    organization + one-time API key
POST /v0.1/account/pairing-sessions        authenticated dashboard creates a short-lived code
POST /v0.1/account/pairing-sessions/claim  CLI redeems the code and receives Connector credentials
POST /v0.1/device-authorizations           legacy Connector-started authorization
POST /v0.1/device-authorizations/poll      legacy compatibility route
POST /v0.1/device-authorizations/decision  legacy compatibility route
GET  /v0.1/account/connectors              account lists connected Macs
POST /v0.1/host-keys                       Host registers a public signing key
POST /v0.1/consent-sessions                Host sends a signed Manifest
GET  /consent?token=...                    Re-entry-owned account consent page
GET  /v0.1/consent-sessions/:id            Host reads approval and opaque binding
POST /v0.1/events                          Host sends the signed business event
POST /v0.1/delivery-claims                 Connector polls for approved work
```

`/login` and `/register` remain compatibility redirects to the developer portal. They are not
canonical entry points, and the Connector never opens them.

## Verify the preserved historical loop

```sh
npm run verify
```

The suite includes a preserved real HTTP happy path from user account registration through dashboard Mac
pairing-code redemption, Host-key
registration, signed consent, opaque binding, signed Event, and Connector delivery claim.

## Historical coding-agent prompt

```text
Do not set up or integrate the deprecated Re-entry Cloud Receiver runtime from this repository.
Read ADR-0032-retire-current-cloud-receiver-runtime.md and use the reusable Re-entry Core contracts
for new work. The commands and tests in runtime/cloud-receiver/README.md may be used only to inspect
or reproduce historical evidence. Do not print, commit, or copy API-key secrets, signing keys,
session cookies, Connector credentials, SQLite files, or generated Receiver secrets.
```

<details>
<summary>Retired Stage 1 and legacy Host-code preview notes</summary>

The material below is retained for protocol traceability. It is not the current account-first
product path.

This directory contains the loopback Cloud Receiver process and the smallest browser-assisted
pairing and consent preview around the existing application-neutral Receiver Core. It proves how a
Host user gets mapped to one outbound Local Connector and how a Host approval creates one
Receiver-owned Grant without pretending that production identity, TLS, or public deployment
already exists.

## What connects to what

```text
trusted deployment composition
  -> Receiver Core + file-backed SQLite + authority ports
  -> Stage 1 HTTP service shell
       GET  /healthz
       GET  /readyz
       POST /v0.1/host-keys
       POST /v0.1/consent-sessions
       POST /v0.1/consent-decisions
       POST /v0.1/events
       POST /v0.1/delivery-claims
       POST /v0.1/delivery-acknowledgements
       POST /v0.1/pairing-sessions
       POST /v0.1/pairing-sessions/claim
       POST /v0.1/pairing-sessions/poll
       POST /v0.1/pairing-sessions/approve
       GET  /pairing?code=...
```

The shell owns only listener lifecycle, operational readiness, bounded server settings, and
graceful resource closure. The existing Re-entry Core still owns all Manifest, Grant, event, lease,
replay, and acknowledgement semantics. Pairing is an additive control-plane surface beside the
Core; it does not change the three versioned Core routes.

## Local preview boundary

- Node.js 24 or newer;
- literal `127.0.0.1` or `::1` binding only;
- one file-backed SQLite database for Receiver state and one for pairing state;
- one explicit trusted composition module that supplies real authority ports;
- one configured organization and Host API key;
- one organization-authenticated Host public-key registration;
- one browser-assisted, short-lived pairing session;
- one organization-authenticated consent session for an already paired Host user;
- one generated subject, delivery target, and Connector identity per approved Host user; and
- exact redacted health and readiness responses; and
- graceful `SIGINT` or `SIGTERM` shutdown.

The local preview does not provide production accounts, multi-organization administration, TLS
termination, anti-CSRF protection, rate limiting, credential rotation, production consent identity,
Host private-key custody, Host-effect verification, a supported Agent adapter, or a deployment
claim. Its consent route is a real local integration around the Core authority, but its configured
organization credential and Host application session boundary are preview-only. The Host public-key
registration is only a local preview control route; it is not a production account or key-lifecycle
system.
Unsupported Core authorities fail visibly; they are not development fallbacks.

## Verify

Run with Node 24:

```sh
npm run verify
```

The suite includes the generic Core flow, pairing and consent flows, controlled pairing-store
reopen, the Connector client, the local preview composition, and child-process lifecycle checks.

## Start contract

`npm start` requires a trusted local ESM composition module exporting:

```js
export function createCloudReceiverComposition() {
  return {
    receiver,
    controlHandler,
    readiness,
    close,
  };
}
```

Configuration:

| Variable | Meaning |
|---|---|
| `CLOUD_RECEIVER_COMPOSITION_MODULE` | Required absolute path to the trusted composition module |
| `CLOUD_RECEIVER_HOST` | Optional literal loopback host; defaults to `127.0.0.1` |
| `CLOUD_RECEIVER_PORT` | Optional integer from 0 through 65535; defaults to `8080` |

The composition should normally use `createSqliteReceiverComposition` and provide its database path
and authority ports. Startup and shutdown logs contain only bounded event codes, listener address,
port, profile, and signal; they do not include configuration paths, credentials, request bodies, or
private Receiver state.

For a local lifecycle smoke only, the test composition can be used with an absolute temporary
database path. It rejects every protocol authority and is not a development or production fallback:

```sh
CLOUD_RECEIVER_COMPOSITION_MODULE="$PWD/test/fixtures/composition.mjs" \
CLOUD_RECEIVER_DATABASE_PATH="/absolute/path/to/receiver.sqlite" \
CLOUD_RECEIVER_PORT=8080 \
npm start
```

Then inspect `http://127.0.0.1:8080/healthz` and `http://127.0.0.1:8080/readyz`.

## Start the pairing preview (historical; deprecated)

From this directory, with Node 24:

```sh
PREVIEW_DIR="$(mktemp -d)"
CLOUD_RECEIVER_COMPOSITION_MODULE="$PWD/src/local-preview-composition.mjs" \
CLOUD_RECEIVER_DATABASE_PATH="$PREVIEW_DIR/receiver.sqlite" \
CLOUD_RECEIVER_HOST_API_KEY="host-preview-api-key" \
CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET="connector-preview-secret" \
CLOUD_RECEIVER_PORT=43218 \
npm start
```

The pairing database defaults to `receiver.sqlite.pairing.sqlite`. The Host backend starts a
pairing session for its own authenticated user reference:

```sh
curl -s -X POST http://127.0.0.1:43218/v0.1/pairing-sessions \
  -H 'Authorization: Bearer host-preview-api-key' \
  -H 'Content-Type: application/json' \
  --data '{"host_subject_ref":"host_user_001"}' | jq .
```

Before the Host can enroll a signed Manifest or send a signed Event, register its Ed25519 public
key. The private key stays on the Host backend and is never sent to Reentry:

```sh
curl -s -X POST http://127.0.0.1:43218/v0.1/host-keys \
  -H 'Authorization: Bearer host-preview-api-key' \
  -H 'Content-Type: application/json' \
  --data "$(jq -n \
    --arg public_key_pem "$HOST_PUBLIC_KEY_PEM" \
    '{host_id:"host_preview_001",issuer_origin:"https://host.example",key_id:"host_key_preview_001",public_key_pem:$public_key_pem}')" | jq .
```

This registration enables Reentry's existing Core signature verification. The local preview now
connects the Host server consent calls to that same Core authority:

```text
signed Manifest + paired Host subject
  -> POST /v0.1/consent-sessions
  -> public challenge + one opaque consent token
  -> Host-page prompt
  -> POST /v0.1/consent-decisions with approve or decline
  -> Receiver-owned Grant + public binding (approval only)
```

The organization API key is required on both consent calls and stays on the Host server. The
browser prompt is presentation-only; it must call a Host-owned route, which supplies the
authenticated Host subject and forwards the decision to Reentry. An active Receiver Grant is
still required before an Event can create a delivery. The default local preview deliberately leaves
Host-effect verification and Agent activation unsupported.

Give the returned `user_code` to the Connector. It opens the returned browser URL, the user clicks
Approve, and the Connector stores its credential locally:

```sh
cd ../local-connector
npm start -- pair \
  --receiver http://127.0.0.1:43218 \
  --code 'ABCD-EFGH-IJKL-MNOP' \
  --credential-file "$PREVIEW_DIR/connector-credentials.json"
```

The one-shot delivery check is:

```sh
npm start -- claim-once \
  --credential-file "$PREVIEW_DIR/connector-credentials.json"
```

`claim-once` is a manual poll for this preview. The built-in CLI adapter intentionally reports
that managed-context activation is unsupported and never sends an acknowledgement. A future
selected Agent adapter and independent Host-effect verifier are separate work.

## Start the Re-entry Cloud product preview (historical; deprecated)

To reproduce the retired branded landing page and local developer console, use the historical
product composition instead:

```sh
PREVIEW_DIR="$(mktemp -d)"
CLOUD_RECEIVER_COMPOSITION_MODULE="$PWD/src/product-preview-composition.mjs" \
CLOUD_RECEIVER_DATABASE_PATH="$PREVIEW_DIR/receiver.sqlite" \
CLOUD_RECEIVER_HOST_API_KEY="host-preview-api-key" \
CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET="connector-preview-secret" \
CLOUD_RECEIVER_PORT=43218 \
npm start
```

Open `http://127.0.0.1:43218/`:

1. choose **Create workspace**;
2. enter an email and password;
3. use **Overview** for the setup sequence and historical signal summary;
4. open **Activity** or **Pending work** to inspect selectable lifecycle details;
5. use **Organizations** to create or delete workspaces before entering one;
6. open an organization workspace to see only its keys and install steps, then rotate or revoke
   its preview API keys;
7. use **Quick connect** for the Next.js or Node.js server setup instructions, keeping the
one-time secret in the Host backend environment rather than a committed file.

Open `http://127.0.0.1:43218/docs` for the public Developer Docs page. It explains the SDK install,
server environment, consent and event methods, request flow, and which values belong on the Host
server versus in the browser.

The landing page follows the supplied ShopVibe direction adapted for Re-entry: a near-white canvas,
bold Poppins headlines, Nunito body copy, Space Mono protocol labels, fuchsia action pills,
cyan/yellow signal accents, and one lightweight WebGL mesh shader in the hero. The page keeps a
single product story, a compact `manifest -> grant -> delivery` strip, and a practical setup section
with Local machine and Developer tabs. The shared hand-drawn hedgehog engineer mascot is no longer
referenced by the active UI. The landing, auth, and dashboard screens use a simple text-only
`re-entry` wordmark; the mascot asset route remains available for compatibility.

This retired preview was the first product shell around the Cloud Receiver. The account console was real
file-backed local state, but its three-digit/four-digit credential is intentionally demo-only and
its organization key is not yet the credential used by the existing fixed local Host-key/event
preview. The activity panel is a redacted, read-only projection of the configured Receiver
database; it does not claim per-organization analytics. Connecting dashboard keys to production
Host ingress is the next auth/data-plane gate.

</details>
