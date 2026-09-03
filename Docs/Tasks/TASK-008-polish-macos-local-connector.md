# TASK-008: Polish the macOS Local Connector Installation Path

**Role:** CANONICAL task lifecycle record
**Registered:** 2026-09-01

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Eyad and project team
- Current increment: Make the local Connector diagnose its macOS and Codex prerequisites before
  claiming work and document installation and pairing.
- Next gate: Cross-Mac and deployed Receiver exercise remain separate evidence gates.
- Dependencies: TASK-003, TASK-007, and ADR-0027.

## Objective

Make the Local Connector practical to install on supported Mac machines that already have Codex,
without changing the Receiver protocol or claiming a supported Browser/WebMCP runtime.

## Current gap and evidence

- The previous preview used one hard-coded ChatGPT app path.
- A missing executable or unusable Host directory could consume a delivery before failure was
  visible.
- Pairing and fresh-session dispatch already have local protocol tests, but installation readiness
  was not a first-class command.

## Required outcome

1. Discover Codex through explicit configuration, PATH, and common macOS app locations.
2. Verify Node, Codex version, and the Host project directory before a CLI delivery claim.
3. Add a read-only `doctor` command with bounded JSON output and actionable errors.
4. Document prerequisites, installation, pairing, one-shot claiming, credential custody, and the
   remaining preview boundaries.

## 4. Non-goals

- production Receiver deployment, TLS termination, or account administration;
- automatic software installation, login, or credential recovery;
- a background daemon, scheduler, retry policy, or second Receiver;
- Browser permission bypass, Browser/WebMCP attachment, or existing-session mapping; or
- changing Core authority, delivery leases, or acknowledgement semantics.

## 5. Verification and closure

Close after the focused discovery and adapter tests, the complete Local Connector package tests,
syntax verification, and current-truth writeback pass. Keep cross-Mac, deployed, Browser, and
WebMCP claims explicitly unverified until separately exercised.

## 6. Reopen condition

Reopen if supported macOS discovery, pre-claim readiness, workspace validation, installation
guidance, or the stated preview boundary changes.
