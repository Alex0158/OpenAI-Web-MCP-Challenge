# CP-02 Disposable Capability and Runtime Probe

This directory contains a disposable harness for `SK-TASK-001`. It proves the minimum local
runtime and page boundary before durable game implementation starts. It does not contain game
state, gameplay rules, production persistence, or a Re-entry Core adapter.

## Run the process, transport, and persistence probe

Run from the application root with Node.js 24:

```sh
/Users/alex/.nvm/versions/node/v24.13.1/bin/node --no-warnings probe/cp02/run.mjs
```

The runner starts two short-lived workers against a temporary SQLite file. It checks health,
WebSocket snapshots and commands, duplicate idempotency, WAL mode, clean shutdown, and persistence
after restart. No database file is written to the repository.

## Run the browser page probe

Start the page worker with an explicit temporary data file:

```sh
CP02_PORT=8787 CP02_DATA_FILE=/tmp/sleepless-kingdom-cp02-browser.sqlite \
  /Users/alex/.nvm/versions/node/v24.13.1/bin/node --no-warnings probe/cp02/server.mjs
```

Open `http://127.0.0.1:8787/` in the target browser. The page visibly reports Canvas rendering,
realtime connection, the typed command result, page-bound `document.modelContext.registerTool`
registration, and worker health degradation. Stop the worker to verify that the page remains usable
and reports the loss of the realtime worker.

The harness intentionally uses a static page so the browser capability can be isolated. A separate
Next.js runtime smoke is recorded in `SK-EVID-001`; this directory must not become the game's
application shell.
