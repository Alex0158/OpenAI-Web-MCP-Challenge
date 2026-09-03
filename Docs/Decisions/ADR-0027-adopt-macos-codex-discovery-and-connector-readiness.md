# ADR-0027: Adopt macOS Codex Discovery and Connector Readiness Checks

**Status:** Accepted local preview
**Decision date:** 2026-09-01
**Decision owners:** Eyad and project team
**Scope:** Local Connector installation, macOS Codex discovery, and pre-claim readiness

## Context

The Local Connector preview could start Codex only through one hard-coded ChatGPT application
path. It also accepted a host project path without checking that the directory existed or was
usable. A missing Codex installation or bad path was discovered only after the Receiver had
already leased work.

The intended improvement is compatibility and diagnosis on supported macOS installations. It does
not select a production Agent runtime or change the Receiver delivery protocol.

## Decision

1. The Local Connector remains one outbound-only Node.js process and keeps the existing pairing,
   claim, lease, activation, and acknowledgement contracts.
2. `doctor` is a read-only local readiness check. It verifies Node.js 24 or newer, resolves the
   Codex CLI, runs `codex --version`, and optionally validates the absolute, readable, writable
   Host project directory.
3. Codex resolution uses this order: `--codex-binary`, `CODEX_BINARY`, the current `PATH`, common
   macOS command directories, and the `/Applications` or user `Applications` ChatGPT/Codex app
   bundles.
4. `claim-once --codex-cd ...` performs the same directory and Codex checks before claiming a
   delivery. A failed preflight does not consume Receiver work.
5. A fresh `codex exec` process remains the only Agent dispatch preview. The Connector does not
   download software, log in, bypass Browser permissions, resume a prior session, or map a
   Browser/WebMCP context.

## Consequences

- A supported Mac can use a PATH-installed or bundled Codex executable without editing source.
- Installation errors become short, actionable Connector error codes.
- The Connector still requires Node.js 24 or newer, an authenticated local Codex installation,
  a usable Host project directory, and a reachable Receiver.
- A successful Codex process exit still does not prove Browser acquisition, WebMCP execution,
  Host-effect verification, or acknowledgement.

## Verification gate

The increment is locally verified when the discovery, preflight, adapter, pairing, and Connector
package tests pass, and the current Mac's installed Codex binary passes `--version` through the
discovery module. Cross-machine and deployed Receiver verification remain separate evidence.
