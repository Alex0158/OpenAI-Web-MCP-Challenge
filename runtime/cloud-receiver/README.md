# Cloud Receiver — Stage 1 Shell

This directory contains the first real process shell around the existing application-neutral
Receiver Core. It proves local service composition and lifecycle without pretending that
production identity, consent, pairing, TLS, or public deployment already exists.

## What connects to what

```text
trusted deployment composition
  -> Receiver Core + file-backed SQLite + authority ports
  -> Stage 1 HTTP service shell
       GET  /healthz
       GET  /readyz
       POST /v0.1/events
       POST /v0.1/delivery-claims
       POST /v0.1/delivery-acknowledgements
```

The shell owns only listener lifecycle, operational readiness, bounded server settings, and
graceful resource closure. The existing Re-entry Core still owns all Manifest, Grant, event,
lease, replay, and acknowledgement semantics. The three versioned protocol routes are delegated
unchanged to its HTTP adapter.

## Stage 1 boundary

- Node.js 24 or newer;
- literal `127.0.0.1` or `::1` binding only;
- one absolute file-backed SQLite database path;
- one explicit trusted composition module that supplies real authority ports;
- exact redacted health and readiness responses; and
- graceful `SIGINT` or `SIGTERM` shutdown.

There is no runtime fake identity, in-memory fallback, public listener, TLS termination,
organization control plane, Browser SDK, consent route, Connector pairing, real Host-effect
verifier, Agent adapter, or deployment claim in this stage. Synthetic authorities exist only in
tests.

## Verify

Run with Node 24:

```sh
npm run verify
```

The suite includes one generic flow through signed event acceptance, Connector claim, trusted
Host-effect acknowledgement, SQLite close/reopen, and exact acknowledgement replay. It also starts
the shell as a child process and closes it through `SIGTERM`.

## Start contract

`npm start` requires a trusted local ESM composition module exporting:

```js
export function createCloudReceiverComposition() {
  return {
    receiver,
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
