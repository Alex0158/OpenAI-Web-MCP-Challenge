# CLOUD-009: macOS Local Connector Readiness

**Role:** IMPLEMENTATION AND VERIFICATION RECORD
**Status:** `locally_verified`
**Opened:** 2026-09-01
**Task:** [TASK-008](../Tasks/TASK-008-polish-macos-local-connector.md)
**Decision:** [ADR-0027](../Decisions/ADR-0027-adopt-macos-codex-discovery-and-connector-readiness.md)

> Historical compatibility record. The device-authorization flow described below is preserved as
> evidence for the earlier preview. The former normal path used the dashboard-issued pairing code
> in [CLOUD-011](CLOUD-011-dashboard-issued-connector-pairing.md); the Cloud Receiver it depended
> on is now deprecated under [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md).
> The [Local Connector README](../../runtime/local-connector/README.md) remains the current
> reusable Connector surface, but it requires an accepted Receiver origin.

## Objective

Make the Local Connector fail before delivery claim when the supported Node version, Codex
executable, or Host project directory is not ready, then document the user-visible setup flow.

## Implemented surface

- `runtime/local-connector/src/codex-discovery.mjs` resolves and verifies Codex and validates the
  Host project directory;
- `runtime/local-connector/src/main.mjs` adds `doctor`, strict command flags, Node preflight, and
  preflight-before-claim ordering, plus a guided `start` path that pairs only when needed;
- `runtime/local-connector/src/terminal-ui.mjs` provides readable TTY status output while keeping
  piped output and `--json` machine-readable;
- `runtime/local-connector/src/codex-exec-adapter.mjs` reuses the same directory and Codex
  discovery rules for direct library construction;
- `runtime/local-connector/test/codex-discovery.test.mjs` covers PATH, app-bundle, explicit-path,
  version, directory, and Node checks; and
- `runtime/local-connector/README.md` documents installation, pairing, claiming, and limits.

## Intended user flow

```text
install Node 24 + Codex
  -> npm start -- --receiver <Receiver origin> --codex-cd <Host project>
  -> guided CLI runs doctor checks
  -> Host backend creates a one-time pairing code
  -> user enters the code when prompted
  -> Connector claims the code and opens the Receiver approval page
  -> user clicks Approve
  -> Connector polls and stores one local 0600 credential file
  -> claim-once preflights Codex and the Host project
  -> Receiver leases one delivery
  -> Connector starts one fresh `codex exec` process
```

Pairing remains outbound from the Connector. The Receiver never opens a connection into the
user's machine. The credential authorizes Connector delivery only; it is never placed in the
Codex prompt.

## Verification

The Local Connector syntax check and complete package suite pass: 15 modules and 17 tests on the
available Node runtime. A direct current-Mac preflight found
`/Applications/ChatGPT.app/Contents/Resources/codex` and verified `codex-cli 0.151.0-alpha.7.2`.
The repository's Node 24 baseline, remote Receiver reachability, Codex login state, Browser
permission, Browser/WebMCP acquisition, Host effect, and acknowledgement remain separate claims.

## Reopen conditions

Reopen if a supported Codex installation uses a different executable contract, if preflight still
allows a missing prerequisite to consume work, or if a selected Agent runtime supplies a different
authoritative Browser/session binding.
