# Continuation protocol v0.1

This directory publishes the domain-neutral Website Backend-to-Receiver contract used by
MVP2. It is a project proposal and reference implementation, not an adopted standard or an
OpenAI platform API.

- `continuation-manifest.schema.json` describes a signed Host offer.
- `continuation-event.schema.json` describes the signed, prompt-free business signal sent
  to `POST /api/continuations/events`.
- `test-vectors/v0.1.json` freezes canonical HMAC inputs and expected signatures for an
  independent implementation.
- Runtime canonicalization, signing, and strict validation live in
  `../lib/infrastructure/protocol.mjs`.

The event deliberately contains identifiers, scope, state version, canonical URL, timing,
and replay protection. It contains no arbitrary Agent prompt. The Receiver derives the
fixed re-entry instruction from the approved Grant.

HMAC-SHA256 is used only for this local reference build. A deployed implementation should
inject issuer-aware key resolution and an appropriate production key-management and
signature scheme without changing Receiver business logic.
