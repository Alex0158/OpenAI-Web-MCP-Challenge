# ADR-0026: Start a Fresh Local Codex Session for the Connector Preview

**Status:** Accepted local preview; not a production Agent selection  
**Decision date:** 2026-09-01  
**Decision owners:** Eyad and project team  
**Scope:** One Local Connector process invoking one fresh local Codex session per delivery

## Context

The previous local preview used `codex queue` and required a private existing-thread reference.
That adds mapping work without helping the first end-to-end demonstration. The useful preview is
smaller: the Local Connector claims a delivery and starts a new Codex session with the page context
and the next safe action already written into its prompt.

## Decision

1. The Cloud Receiver remains a separate service boundary.
2. The Local Connector and its Agent Adapter remain one local Node.js process and one package.
3. Every opted-in delivery starts a new local Codex session with `codex exec`.
4. The CLI requires an explicit local host-project directory through `--codex-cd`. No existing
   Codex thread is looked up, resumed, or mapped.
5. The adapter builds one fixed prompt from the validated continuation: canonical page, workflow,
   event, state version, and human boundary. It tells Codex to read the current page, use its
   current WebMCP tools, prepare the next safe step, and stop before the consequential human
   boundary.
6. The local working directory and Codex executable are private Connector configuration. They are
   never sent to the Receiver or included in the activation result.
7. A successful process exit proves only local Codex process completion. It does not prove Browser
   acquisition, page-bound WebMCP execution, Host effect, or acknowledgement. Process failure and
   timeout become `outcome_unknown`, with no automatic retry or fallback.

This supersedes ADR-0025's invocation choice only. It does not select a production Codex,
Browser, or WebMCP route and does not weaken the Core activation or human-approval boundary.

## Consequences

- The first local demonstration has no session-mapping step.
- The context Codex needs is explicit and inspectable in the generated prompt.
- A fresh CLI session may not inherit another session's Browser or page state; the prompt must
  direct it to the canonical page and current WebMCP surface.
- The preview remains local and bounded. It is not evidence of a supported public Agent runtime.

## Verification gate

The preview is locally verified when the Local Connector syntax check, fresh-session adapter tests,
and full Local Connector test suite pass. Running the real Codex command remains an explicit manual
action and is not part of automated tests.
