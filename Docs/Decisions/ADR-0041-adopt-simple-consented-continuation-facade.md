# ADR-0041 — Adopt a Simple Consented Continuation Facade

**Status:** Accepted  
**Date:** 2026-09-03  
**Owners:** Project manager, Host SDK, Cloud Receiver v2, Local Connector  
**Related:** ADR-0007 through ADR-0011, ADR-0035 through ADR-0039, TASK-025

## Decision

Re-entry will add an additive, server-only SDK facade for the normal integration path while
retaining the existing advanced Host SDK and protocol `0.1` contracts.

The normal developer supplies only:

- the authenticated Host subject;
- one bounded continuation prompt; and
- one canonical same-origin URL.

The facade derives the internal workflow identifier and type, state versions, event type, display
title, offer and Grant windows, one-run scope, and human-boundary identifier. It then uses the
existing signed Manifest, Receiver-owned consent, public binding, signed Event, delivery, and
acknowledgement contracts. The advanced methods remain available for applications that need
domain-specific control.

On each explicit `request`, the facade performs the existing idempotent public Host-key
registration before creating the Consent session. It uses a generated workflow identifier that
does not encode or deterministically hash the Host subject. Registration failure ends the request;
the facade does not create a Consent session, cache success, retry, or choose another route.

The prompt is signed as `manifest.display.reason`, displayed to the user before approval, and
stored with the Consent session. After approval it may be copied into the private delivery
continuation as `instruction`. That field is bounded to the existing display-reason limit and is
explicitly untrusted task context. It cannot change the canonical URL, Event, Grant, delivery
target, current Host state, available WebMCP tools, or human boundary.

The Local Connector places the instruction inside a fixed safety frame. The Agent must still open
the exact canonical URL, read fresh authoritative state, use only currently available WebMCP
tools, and stop before the consequential human action.

The facade lifecycle is:

```text
request({ subject, prompt, url })
-> idempotent Host public-key registration
-> Receiver consent URL + serializable server-only request handle
-> confirm(handle)
-> approved serializable server-only continuation
-> trigger(continuation)
-> existing signed Event acceptance (202 means queued only)
```

The caller persists the server-only request handle and approved continuation using its existing
application storage. The SDK adds no database, hidden polling, retry, alternate transport, or
browser credential storage.

## Security and authority boundaries

- Organization API keys and Host private signing keys remain Host-server-only.
- The browser receives only the consent URL, consent-session identifier, and safe public status.
- The prompt is visible during consent and cannot be changed after approval.
- The prompt is data, not system authority. It is never accepted from the later Event request.
- Event acceptance, delivery, Agent dispatch, Host effect, and acknowledgement remain separate.
- The Receiver still owns consent, target selection, Grant creation, and delivery authority.
- The Host page and its backend remain authoritative for current state and business effects.

## Developer portal

The active Cloud Receiver v2 developer portal will expose the minimum self-service control plane:

1. list and create owned organizations;
2. create, list, and revoke organization API keys, revealing a new secret once;
3. retain the interactive SDK guide; and
4. list redacted organization-scoped Event and delivery lifecycle metadata.

The portal does not expose raw Event bodies, bindings, subjects, Connector credentials, private
receipts, signing private keys, or consent tokens.

## Consequences

The common integration becomes a three-operation lifecycle without asking developers to construct
protocol objects. Internally, the strict signed protocol and one-run consent boundary remain
unchanged. The delivery and Agent activation contracts gain one bounded, consented instruction
field, so Cloud Receiver, Core validation, Local Connector, tests, and documentation must move
together.

This facade is application-neutral, but it does not make every business workflow automatically
safe or valid. A Host still needs real authentication, a durable business trigger, authoritative
page state, current WebMCP tools, and a human-only consequence boundary.

## Reversal

The facade can be removed without removing the advanced SDK. Reversing instruction propagation
requires removing the field from Receiver delivery, Core activation validation, and Connector
prompt construction in one coordinated compatibility change.
