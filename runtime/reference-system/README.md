# Re-entry complete local reference system

> The Cloud Receiver implementation used by this reference system is deprecated historical
> evidence. Keep this package for local protocol replay only; do not use it or its former hosted
> alias for new integrations or production traffic. See [ADR-0032](../../Docs/Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md).

This package runs the entire currently implementable protocol path with one command. It uses a real
loopback Host page, the SQLite-backed Reentry service, real pairing and consent controls, the real
Local Connector contract, an explicitly evidence-only deterministic Agent, an independent Host-
effect authority, and acknowledgement replay after a Receiver restart.

```text
Reference Host page
  -> signed Manifest
  -> Reentry consent and Grant
  -> signed event and durable delivery
  -> Local Connector lease
  -> deterministic Agent updates the visible Host draft
  -> Host independently proves the effect
  -> Connector acknowledges
  -> Receiver restart preserves the acknowledgement
```

## Run it

Use Node 24 or newer:

```sh
cd runtime/reference-system
npm start
```

The process prints one JSON line for every successful handoff and exits only after restart replay
passes. It creates a fresh temporary state directory and reports that path in the returned API
result, but never prints bearer, consent, lease, signing, or effect tokens.

To keep the final Host page and restarted Receiver available for inspection:

```sh
npm start -- --hold
```

Open the printed `host_url`. The page registers genuine page-bound Site Tools when opened in an
eligible WebMCP browser. The final commit button remains a human-only UI control and is deliberately
not a Site Tool. Press `Ctrl-C` to stop the local services.

Use an explicit reusable state directory when needed:

```sh
npm start -- --state-dir /absolute/path/to/disposable-state
```

## Claim boundary

This is a complete local reference flow, not a production Codex deployment. The deterministic
Agent proves the adapter and effect boundaries but is never used as a product fallback. Current
supported Codex interfaces can resume a thread, but the required standalone join to that Desktop
thread's built-in Browser and page-bound Site Tools has not been proven. TLS, public deployment,
production identity, backup, multi-replica operation, and the selected real Host remain separate
gates.
