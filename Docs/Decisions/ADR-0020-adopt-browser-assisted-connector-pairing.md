# ADR-0020: Adopt Browser-Assisted Connector Pairing for the Local Preview

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Eyad and project team  
**Scope:** Stage 2 local Cloud Receiver pairing, Host-user mapping, and Local Connector process

> **Current disposition:** The Cloud Receiver implementation portion of this decision is
> superseded by [ADR-0032](ADR-0032-retire-current-cloud-receiver-runtime.md). The Local Connector
> contract and historical pairing evidence remain preserved; this record is not a current receiver
> integration guide.

## Context

ADR-0019 deliberately stopped the Cloud Receiver at a loopback-only process shell. The existing
Receiver Core already accepts an opaque Connector token and resolves it through a trusted identity
authority, but no runtime pairing, credential custody, Host-user mapping, or Connector process
exists. The next useful proof needs one simple user path without pretending to be a production SaaS
account system, identity provider, or public deployment.

The project owner selected the simplest functional direction: the Connector is a user-started Node
process, a browser page handles approval, and the resulting credential is kept by the Connector.
The mapping must still be explicit: a Host request must reach the Connector belonging to the same
Host user without putting a Connector token in a Manifest or event.

## Decision

### 1. Local preview scope

The first implementation uses one explicitly configured organization and one Host API key. A Host
backend starts a pairing session with a stable opaque `host_subject_ref` derived from its own
authenticated user. Multi-organization account management, billing, a public identity provider,
and a dashboard remain outside this increment.

The pairing control plane lives beside the Cloud Receiver process shell under
`runtime/cloud-receiver/`. It uses a separate file-backed SQLite control store so pairing state
and credential metadata survive a controlled process restart without changing the Receiver Core
schema or authority contracts.

### 2. Browser-assisted one-time pairing

The pairing flow is:

```text
Host backend
  -> creates a short-lived pairing session for host_subject_ref
  -> gives the user a verification URL and short user code
Connector
  -> claims the user code and receives a private device code
Browser
  -> opens the verification URL and approves the Connector
Connector
  -> polls with the device code
Receiver
  -> returns one connector token and records the pairing
```

The browser does not display or return the Connector token. The Connector stores it in a local
credential file with restrictive permissions. Pairing, user, and device codes are short-lived and
are persisted only as digests. The Connector token is derived from a configured local-preview
secret and the pairing identity, so an approved session can return the same token after a controlled
Receiver restart without persisting the raw bearer value. The secret is configuration, never a
tracked file, response, or log value.

This is a small device-code-style flow. It is intentionally not a claim that a production OAuth
authorization server, account login, anti-CSRF session, TLS termination, rate limiting, or abuse
control has been implemented.

### 3. End-to-end Host-user mapping

The Receiver creates one generated `subject_id`, `delivery_target_id`, and `connector_id` for the
approved pairing. It stores the mapping:

```text
(organization_id, host_subject_ref)
  -> subject_id
  -> delivery_target_id
  -> connector_id
```

The Host API key authenticates the organization and the Host backend supplies the opaque user
reference. The browser or Connector cannot choose a subject or delivery target. The existing
Manifest and event contracts remain unchanged: they carry workflow and binding identity, not a
Connector token. A future Receiver-owned consent authority uses the stored Host-user mapping to
select the paired delivery target when it creates the Grant. Later event acceptance resolves the
existing `binding_id` to that Grant, and Connector authentication resolves the token back to the
same target.

### 4. Local Connector process

The Local Connector is a separately runnable Node.js process under `runtime/local-connector/`.
It has four responsibilities:

1. pair through the browser-assisted flow and store its credential locally;
2. poll the Cloud Receiver through the existing outbound `LocalConnectorClient`;
3. claim one delivery and invoke the existing typed Agent Adapter boundary; and
4. submit an acknowledgement only when an independent trusted Host-effect token is available.

The Connector is outbound-only. It does not issue Grants, choose a Host user, select a delivery
target, expose a public listener, receive raw managed-context identifiers, or convert an adapter
result into acknowledgement. An adapter result remains an observation until a trusted Host-effect
authority verifies the actual effect.

### 5. Contract and claim boundary

The existing `/v0.1/events`, `/v0.1/delivery-claims`, and
`/v0.1/delivery-acknowledgements` routes and Receiver Core semantics remain unchanged. Pairing
routes are additive control-plane routes and are not part of the frozen Core protocol kernel.

The increment targets `locally_verified` for the named loopback process, pairing store, pairing
client, Connector process, Host-user mapping, negative cases, and controlled restart. It does not
claim a public Cloud Receiver, production authentication, real account recovery, a supported
Codex adapter, Browser/WebMCP continuation, or deployment.

## Consequences

### Positive

- The user never pastes a reusable bearer token into a terminal.
- Pairing begins from a Host user context, so the Connector is not ambiguously attached to an
  unrelated Receiver account.
- The Receiver remains the authority for Connector identity and delivery-target scope.
- The Local Connector can be tested independently from the eventual Agent platform.
- Raw pairing and Connector credentials remain out of the control database, responses intended for
  the browser, and logs.

### Costs and risks

- The first control plane supports one configured organization rather than a full SaaS account
  model.
- A local-preview HMAC secret is a deployment credential and requires a later production custody
  decision.
- The pairing page is a local proof surface, not a production authenticated consent session.
- Host-user mapping is established at pairing; changing a Host user's identity model requires an
  explicit integration decision.

## Rejected alternatives

- **Paste a long Connector token into the CLI:** rejected because it is easy to leak through shell
  history and does not establish the Host-user mapping.
- **Pair from a generic Receiver home page:** rejected because the Receiver cannot know which Host
  user the Connector belongs to without a later ambiguous linking step.
- **Put the Connector token in the Manifest or event:** rejected because it exposes device
  credentials to the Host workflow and weakens the existing authority boundary.
- **Implement full accounts, organizations, OAuth, consent UI, and Agent activation together:**
  rejected because they are separate authority and failure boundaries.

## Reopen triggers

Reopen before public binding, multi-organization support, production account login, credential
rotation or recovery, browser-session authorization, public control routes, or a selected Host
integration that requires a different user-to-target relationship.
