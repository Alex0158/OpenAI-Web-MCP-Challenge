# ADR-0022: Adopt Local Consent-Session Preview

**Status:** Accepted  
**Decision date:** 2026-09-01  
**Decision owners:** Eyad and project team  
**Scope:** Loopback Host consent-session HTTP flow and Host SDK handoff

> **Current disposition:** The Cloud Receiver implementation portion of this decision is
> superseded by [ADR-0032](ADR-0032-retire-current-cloud-receiver-runtime.md). The reusable Host
> consent boundary remains preserved; this record is historical preview evidence.

## Context

The Re-entry Core already owns Manifest verification, consent challenges, Receiver-owned Grants,
public bindings, and decision replay. The local Cloud Receiver can register Host public keys and
accept signed Events, but the runtime has no HTTP path connecting a Host page's approval UI to that
Core authority.

The next useful proof is a small end-to-end consent session. It must keep the Host private key,
organization credential, and private Grant inside server-side boundaries while returning only a
public challenge, one opaque decision token, and the public binding.

## Decision

### 1. Preview routes

The loopback preview adds:

```text
POST /v0.1/consent-sessions
POST /v0.1/consent-decisions
Authorization: Bearer <organization Host API key>
```

Session creation accepts exactly `host_subject_ref`, `expected_origin`, and a signed `manifest`.
The Receiver verifies the Manifest through the configured Host-key resolver and requires an
already paired Host subject. It returns a public challenge plus an opaque, one-time
`consent_token`.

Decision submission accepts exactly `challenge_id`, `host_subject_ref`, `action`, and
`consent_token`. The Host server supplies `host_subject_ref` from its authenticated application
session; browser input is not trusted as user identity. The Receiver maps that subject to the
paired Connector target, verifies the opaque token, and delegates the decision to the unchanged
Receiver Core.

### 2. Credential and data boundaries

- The Host private signing key remains on the Host backend.
- The organization API key is used only by server-side Host SDK methods and is never sent by the
  browser.
- The browser receives the public challenge and an opaque decision token only.
- The control store persists only a digest of the decision token, the subject/target mapping, and
  stable decision metadata; it never persists the raw token.
- The Core returns only its public binding. Grant, subject, Connector, and managed-context records
  remain Receiver-private.

The local preview uses the existing configured control secret with a distinct `consent:` HMAC
purpose to derive a repeatable opaque token for exact session replay. Production consent must
replace this with an authenticated Receiver session, CSRF protection, identity binding, rate
limits, and independent key lifecycle.

### 3. Host SDK surface

The server SDK adds:

```js
await sdk.registerHostKey({ hostId });
const session = await sdk.createConsentSession({ manifest, hostSubjectRef });
const approval = await sdk.decideConsent({
  challengeId: session.challenge.challenge_id,
  consentToken: session.consent_token,
  hostSubjectRef,
  action: "approve",
});
```

Next.js route helpers keep the organization credential and authenticated subject on the Host
server. The browser prompt remains presentation-only and submits its action to the Host route.

## Consequences

### Positive

- The intended `Manifest -> challenge -> UI -> approval -> Grant/binding` path is executable in the
  local preview.
- Existing Receiver Core authority and persistence remain the only Grant implementation.
- Duplicate approvals are harmless and conflicting decisions are rejected.
- The Host SDK exposes the connection without asking developers to construct Core decision
  attestations themselves.

### Costs and residual risks

- The preview requires pairing before consent and uses one configured organization.
- Organization API keys and Host application sessions are preview credentials, not production
  identity.
- The browser prompt is hosted by the Host page and is not a trusted Re-entry-origin UI.
- No production account federation, CSRF control, rotation/revocation, TLS, Agent activation, or
  Host-effect acknowledgement is added.

## Reopen triggers

Reopen before public or multi-tenant use, production consent identity, cross-origin browser delivery,
credential rotation or revocation, a different user-to-Connector model, or a selected Host whose
session semantics require a different binding.
