# ADR-0021: Adopt Local Host-Key Registration for the Re-entry Event Preview

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Eyad and project team  
**Scope:** Loopback Host-key registration, signature lookup, and event-ingress preview

> **Current disposition:** The runtime implementation and deployment portion of this decision is
> superseded by [ADR-0032](ADR-0032-retire-current-cloud-receiver-runtime.md). The signed-event
> contract remains preserved as historical/application-neutral evidence.

## Context

The Stage 1 Cloud Receiver shell already delegates event acceptance to the unchanged Re-entry
Receiver Core, but its local composition had no configured Host-key resolver. A signed Host event
could therefore not pass the Receiver boundary, and no accepted event could create a pending
delivery for the Local Connector.

The next useful proof is deliberately smaller than production identity: one configured preview
organization must be able to register one Host's Ed25519 public key, persist it, verify a signed
Manifest or Event, and let the existing Receiver Core create a delivery. Consent, Grant control,
Host-effect verification, Agent activation, multi-organization administration, and deployment
remain separate boundaries.

## Decision

### 1. Preview registration route

The loopback preview adds:

```text
POST /v0.1/host-keys
Authorization: Bearer <organization Host API key>
```

The request body has exactly:

```text
host_id
issuer_origin
key_id
public_key_pem
```

The existing configured organization API key authenticates the request. The response returns only
bounded registration metadata and never returns the submitted public-key value or any private
credential. A same-content re-registration is an exact idempotent duplicate. Reusing a Host ID or
issuer/key identity with different content is a conflict.

### 2. Key custody and lookup

The Host keeps its Ed25519 private key on its own backend. Re-entry stores only the public key in
the existing file-backed control SQLite database. Receiver Core key lookup is scoped to the
configured organization, the registered issuer origin, the registered key ID, and the requested
`manifest` or `event` purpose. Unknown or unsupported purposes resolve to no key.

The registration route is a local preview control surface, not a production account, API-key,
rotation, revocation, or recovery system.

### 3. Event-ingress proof

After a trusted test consent authority creates an active Grant and public binding, the existing
Host SDK signs an Event and sends it to `POST /v0.1/events`. Receiver Core resolves the private
Grant through the opaque binding, uses the registered public key for detached signature
verification, atomically consumes the one-run Grant, persists the Event, and creates one pending
delivery. The existing outbound Local Connector then claims that delivery through its unchanged
lease contract.

The preview does not add a consent bypass to runtime code. The end-to-end test uses an explicit
synthetic consent authority only inside the test composition to establish the required precondition.

## Consequences

### Positive

- One real runtime control route now connects Host key registration to the unchanged Receiver Core.
- Public-key registration survives a controlled pairing-store restart.
- A registered signed Host event can be proven to become claimable work.
- Host private keys, Connector credentials, Grants, and managed-context identifiers remain outside
  public registration responses.
- Existing Core protocol routes, schemas, replay rules, and delivery semantics remain unchanged.

### Costs and residual risks

- The preview still supports one configured organization and a single local API key.
- Registration has no production identity, key rotation, revocation, rate limiting, TLS, or abuse
  controls.
- Runtime consent and Host-effect authorities remain unsupported in the default local composition.
- The Local Connector still has no supported Agent adapter and therefore cannot activate Codex.
- The route must be replaced or extended by an accepted production identity contract before public
  hosting.

## Reopen triggers

Reopen before public or multi-tenant use, Host-key rotation or revocation, production account
authentication, deployment, a real consent session, or a selected Host integration that requires
additional issuer or organization semantics.
