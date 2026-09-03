# ADR-0025: Adopt the Local Codex Queue Adapter Preview

**Status:** Superseded for invocation choice by ADR-0026; retained as historical local preview  
**Decision date:** 2026-09-01  
**Decision owners:** Eyad and project team  
**Scope:** One Local Connector process containing an opt-in Codex queue adapter

## Context

The Re-entry Core already defines the boundary between a delivery lease and an Agent Adapter.
The Local Connector currently exercises that boundary with an explicit unsupported adapter. The
local machine has a bundled Codex CLI with a `queue --thread --message` command, which is the
smallest available way to test a Connector-to-Codex handoff.

This is a local development preview only. It does not prove that Codex acquired a Browser, opened
the canonical page, discovered WebMCP tools, changed Host state, or completed a human decision.

## Decision

1. The Cloud Receiver remains a separate service boundary.
2. The Local Connector and its Codex adapter are one local Node.js process and one package. The
   adapter is an internal module, not a second server or a second local Receiver.
3. The existing Receiver HTTP contract and `adapter.activate(activation)` port remain unchanged.
4. Codex dispatch is opt-in through an explicit local `--codex-thread` value. The thread reference
   is private local configuration, never an activation field, Receiver payload, log, or public
   result.
5. The adapter creates one fixed continuation message from the validated canonical URL. It does
   not forward arbitrary event text, prompts, Host state, credentials, or lease tokens.
6. A zero exit status means only that the local Codex CLI accepted the queue command. A process
   error, non-zero exit, or timeout becomes an unknown activation outcome. The Connector performs
   no automatic retry and no acknowledgement from this result.
7. The preview uses one configured local Codex session for a single-user exercise. A production
   implementation still needs a Grant-scoped private binding authority, supervised lifecycle,
   outcome reconciliation, and an independently verified Host effect.

This ADR adds a bounded local preview around ADR-0011; it does not select a supported production
Codex, Browser, or WebMCP route and does not weaken the Core authority or human boundary.

## Consequences

- The whole local handoff is testable from the terminal without adding a network service on the
  user's machine.
- The Cloud Receiver remains unaware of Codex process details.
- Queue acceptance is visibly weaker than Agent execution and cannot close a delivery.
- The single-session binding is intentionally insufficient for multi-user or production use.
- A later route-specific ADR must replace this preview before any production or Browser/WebMCP
  claim.

## Verification gate

The preview is locally verified when the Local Connector syntax check, adapter-focused tests, and
full Local Connector test suite pass. Real Codex queueing is a separate manual action and must use
an explicitly disposable or user-selected session.
