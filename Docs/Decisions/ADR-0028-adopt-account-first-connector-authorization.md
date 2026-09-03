# ADR-0028: Adopt Account-First Connector Authorization and Re-entry-Owned Consent

**Status:** Accepted local preview  
**Decision date:** 2026-09-01  
**Decision owners:** Eyad and project team  
**Scope:** Browser account identity, Connector authorization, Host consent handoff, and local process UX

> The Connector-enrollment portion of this decision is superseded by [ADR-0030](ADR-0030-adopt-dashboard-issued-connector-pairing-code.md).
> The account boundary, credential separation, Re-entry-owned consent, and delivery conclusions remain in force.

> **Current disposition:** The Cloud Receiver runtime implementation described here is superseded
> by [ADR-0032](ADR-0032-retire-current-cloud-receiver-runtime.md). The reusable account, consent,
> and delivery conclusions remain design evidence, not a current hosted integration.

## Context

The local preview proves browser-assisted pairing, Receiver-owned Grants, Connector delivery, and a
fresh Codex process, but its user journey begins inside a Host application. A Host backend creates a
pairing code, the user moves that code into a CLI, and the Host page forwards a browser consent
decision. That sequence makes every Host feel like a new installation and gives the Host too much
responsibility for Re-entry account and consent presentation.

The intended product model has two distinct customers and credentials:

- a developer owns Re-entry organizations and uses an organization API key only from a Host backend;
- an end user owns a Re-entry account and authorizes one or more local Connector devices in the
  Re-entry web application.

Those identities may meet in one consent decision, but neither credential crosses into the other
boundary.

## Decision

1. **Connector-initiated device authorization.** The Local Connector requests a short-lived device
   authorization, opens the returned Re-entry verification URL, and polls with an unguessable device
   secret. The user signs in to Re-entry and approves the named device. No Host-generated pairing code
   is required in the normal path.
2. **Account-linked Connector credential.** Approval creates one account-to-Connector link and returns
   a revocable, delivery-only credential exactly once to the polling Connector. The credential is
   stored locally with restrictive permissions and is not exposed to Host code, browser JavaScript,
   or Codex context.
3. **Re-entry-owned consent.** A Host backend authenticates with its organization API key and submits a
   signed Manifest. The Receiver returns a short-lived Re-entry consent URL and opaque challenge
   handle. The Browser SDK may present a top-layer explanation, but the approval controls and account
   session are rendered and owned by Re-entry.
4. **Explicit device selection.** The signed-in account approves or denies the Host request and, when
   more than one eligible device exists, selects the target Connector. The Receiver creates the
   private Grant and Host-subject binding only after this decision. The Host receives opaque status
   and binding values, never the Re-entry account identifier or Connector credential.
5. **Outbound background Connector.** After first authorization, the Local Connector may run as a
   long-lived user process or macOS user service. It performs bounded outbound polling, claims through
   the accepted lease protocol, starts one fresh Codex process with validated continuation context,
   and reports the existing acknowledgement states. It opens no inbound port.
6. **Credential separation.** Organization API keys stay in the Host backend. Browser consent tokens
   are short-lived and single-purpose. Account session cookies stay in the Re-entry origin. Connector
   credentials authorize only the account-linked delivery surface.
7. **Local-preview limit.** This decision selects the product-preview user journey, not a production
   OAuth implementation, public deployment, supported Codex Browser attachment, or final Host.

## Protocol checkpoints

```text
Connector -> Receiver: start device authorization
Receiver  -> Connector: device_secret + verification_url + expiry
Browser   -> Receiver: authenticated approve(device, account)
Connector -> Receiver: poll(device_secret)
Receiver  -> Connector: connector credential (once)

Host backend -> Receiver: organization API key + signed Manifest
Receiver     -> Host backend: consent_url + challenge_id
Browser SDK  -> Re-entry: user opens consent_url
User/browser -> Receiver: authenticated approve or deny + device choice
Receiver     -> Host backend: opaque status + binding_id

Host backend -> Receiver: signed Event referencing binding_id
Connector    -> Receiver: outbound claim
Connector    -> Codex: fresh session + bounded continuation context
Connector    -> Receiver: activation/effect/acknowledgement state
```

Each arrow has one sender and one authority. Polling is always initiated by the Local Connector;
the Cloud Receiver never reaches into the user's Mac.

## Superseded preview choices

- ADR-0020 remains historical evidence for Host-code-first local pairing, but its normal pairing
  journey and Host-subject-at-pair-time requirement are superseded by this account-first preview.
- ADR-0022 remains historical evidence for the first consent-session contract, but its Host-page
  decision-forwarding journey is superseded by Re-entry-owned authenticated consent for this preview.

The underlying Receiver Grant authority and explicit human approval requirement are not superseded.

## Consequences

- The one-time setup begins in the Connector and Re-entry account, not in each Host website.
- Returning users normally see only the Host's brief SDK handoff and the Re-entry approval surface;
  they do not revisit the CLI.
- The Receiver must maintain account-to-device state and join it to a Host subject only after
  consent. Dashboard API keys must authenticate real product-preview Host routes rather than exist as
  disconnected UI data.
- A browser popup can be blocked unless opened from a user gesture. The SDK must expose this state
  visibly and must not silently approve or fall back to Host-owned controls.
- Background reliability needs bounded polling, visible health, graceful stop, and user-service
  lifecycle checks; local tests do not establish deployment or cross-machine reliability.

## Verification gate

The decision is locally verified only when a fresh account can authorize a fresh Connector without
a Host code, the same credential is reused after restart, a dashboard-issued organization key can
create a signed consent challenge, the authenticated Re-entry page can approve and bind a target
device, and one resulting delivery reaches the existing Connector/Codex activation seam without
credential leakage.
