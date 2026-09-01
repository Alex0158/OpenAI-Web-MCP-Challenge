# Re-entry Cloud Receiver

The product preview combines a browser account, organizations and server keys, Receiver Core,
account-owned consent, durable delivery, and account-linked Connector devices in one loopback
service.

> Current boundary: the account-first path and the Supabase/Prisma hosted adapter are MVP previews.
> This is not a production deployment: it has no production TLS termination, email verification,
> account recovery, rate limiting, abuse controls, or general multi-instance capacity claim.

Hosted smoke-test URL: [https://cloud-receiver-mu.vercel.app](https://cloud-receiver-mu.vercel.app).
The public deployment is a preview of the same account-first flow; it does not change the local
preview's production-readiness boundary.

## Hosted MVP configuration

The Vercel function uses Supabase PostgreSQL through Prisma. Keep these values in Vercel project
secrets or an untracked local environment file; never commit them:

```text
DATABASE_URL  # Supabase transaction-mode pooler, port 6543, with pgbouncer=true
DIRECT_URL    # Supabase direct or session-mode URL for Prisma migrations
CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET
```

Runtime traffic uses `DATABASE_URL`. Schema migration commands use `DIRECT_URL`:

```sh
npm run db:generate
DIRECT_URL='[set privately]' npm run db:migrate
```

The Vercel adapter serializes the existing preview stores through a Prisma-managed Postgres
snapshot table. This preserves the current protocol behavior while keeping the implementation
small; it is deliberately not a high-throughput production persistence model.

## Start the product preview

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
  -> install the Local Connector on a Mac and approve it in this account
  -> add the Host SDK to the website server
  -> Host sends signed Manifest and receives a consent URL
  -> person approves on Re-entry and chooses the connected Mac
  -> Host receives an opaque binding and later sends a signed Event
  -> Local Connector claims the delivery and opens Codex
```

When the Connector opens its verification URL, Re-entry shows a connector-specific account
choice screen instead of sending the person straight to the generic login page. **Create an
account** and **Log in** both preserve the pending device request and return to the final
**Connect this Mac** approval. Signing in alone never authorizes the device.

The Host never receives the Re-entry account id, Connector id, Connector token, or browser session.
The Connector never receives the organization key or Host signing key.

## Current account-first routes

```text
POST /api/auth/register                    browser account
POST /api/auth/login
POST /api/organizations                    organization + one-time API key
POST /v0.1/device-authorizations           Connector starts browser authorization
POST /v0.1/device-authorizations/poll      Connector waits for approval
POST /v0.1/device-authorizations/decision  Re-entry browser approves the Mac
GET  /v0.1/account/connectors              account lists connected Macs
POST /v0.1/host-keys                       Host registers a public signing key
POST /v0.1/consent-sessions                Host sends a signed Manifest
GET  /consent?token=...                    Re-entry-owned account consent page
GET  /v0.1/consent-sessions/:id            Host reads approval and opaque binding
POST /v0.1/events                          Host sends the signed business event
POST /v0.1/delivery-claims                 Connector polls for approved work
```

## Verify the complete loop

```sh
npm run verify
```

The suite includes a real HTTP happy path from account registration through Mac approval, Host-key
registration, signed consent, opaque binding, signed Event, and Connector delivery claim.

## Give this to a coding agent

```text
Run the Re-entry Cloud Receiver local product preview from this repository. Read
runtime/cloud-receiver/README.md and Docs/Decisions/ADR-0028-adopt-account-first-connector-authorization.md
first. Use Node.js 24 or newer, run npm install and npm run verify, then start it with `npm start`.
Do not print, commit, or copy API-key secrets, signing keys, session cookies, Connector credentials,
SQLite files, or the generated Receiver secret. Treat loopback success as local evidence only and
report public deployment, TLS, account recovery, and production identity as unverified.
```

<details>
<summary>Stage 1 and legacy Host-code preview notes</summary>

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

## Start the pairing preview

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

## Start the Re-entry Cloud product preview

To open the branded landing page and local developer console, use the product composition instead:

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
3. use **Overview** for the setup sequence and current signal summary;
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

This preview is the first product shell around the Cloud Receiver. The account console is real
file-backed local state, but its three-digit/four-digit credential is intentionally demo-only and
its organization key is not yet the credential used by the existing fixed local Host-key/event
preview. The activity panel is a redacted, read-only projection of the configured Receiver
database; it does not claim per-organization analytics. Connecting dashboard keys to production
Host ingress is the next auth/data-plane gate.

</details>
