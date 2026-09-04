# Consent, Target, and Grant Status

This module owns Feature 2 of Cloud Receiver v2:

- Organization API-key-authenticated Host-key registration and signed Manifest
  verification;
- opaque Consent session creation and User account approval/decline;
- one durable `(organization, host subject)` binding to one Connector target;
- persisted decision status plus derived Grant `effective_status`; and
- a private configured-authority revocation fence for local verification.

Consent tokens, Host subject references, Organization API keys, and internal
control values are never stored as raw bearer values. Host responses contain no
User account id, Connector credential, delivery target id, or private Grant
fields. Signed Event ingress, target-scoped delivery claims, acknowledgement,
and bounded transport are implemented in their owning modules. Public Grant
inspection/revocation remains intentionally unregistered pending its separate
authority decision.
