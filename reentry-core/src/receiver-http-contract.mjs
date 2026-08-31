export const RECEIVER_HTTP_ROUTES = Object.freeze({
  event: "/v0.1/events",
  claim: "/v0.1/delivery-claims",
  acknowledgement: "/v0.1/delivery-acknowledgements",
});

export const RECEIVER_HTTP_LIMITS = Object.freeze({
  requestBytes: 16 * 1_024,
  responseBytes: 32 * 1_024,
});

export const RECEIVER_HTTP_CONTENT_TYPE = "application/json";

export const CLAIM_REQUEST_FIELDS = Object.freeze([
  "connector_token",
  "claim_token",
]);

export const ACKNOWLEDGEMENT_REQUEST_FIELDS = Object.freeze([
  "connector_token",
  "delivery_id",
  "lease_token",
  "effect_token",
]);
