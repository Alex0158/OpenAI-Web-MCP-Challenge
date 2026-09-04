# Connector Pairing

This module owns the first Cloud Receiver v2 Connector boundary:

- an authenticated User creates a short-lived pairing code;
- a cookie-free Local Connector claims it with a device name;
- the first claim returns one raw Connector token;
- a duplicate claim returns metadata without `connector_token`; and
- an authenticated account can list its paired devices through
  `GET /v0.1/account/connectors`, which returns lifecycle metadata only; and
- the Receiver stores only SHA-256 digests for pairing and Connector tokens.

The `POST /v0.1/delivery-claims` route is mounted beside pairing but its claim and lease behavior
is owned by `modules/deliveries/`. Pairing owns Connector identity issuance and digest lookup; it
does not own delivery state, acknowledgement, or public Grant behavior.
