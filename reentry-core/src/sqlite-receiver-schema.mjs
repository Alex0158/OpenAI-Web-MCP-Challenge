export const SCHEMA_VERSION = 3;

const BASE_SCHEMA_SQL = `
CREATE TABLE receiver_challenges (
  challenge_id TEXT PRIMARY KEY,
  manifest_id TEXT NOT NULL UNIQUE,
  manifest_json TEXT NOT NULL,
  expected_origin TEXT NOT NULL,
  effective_expires_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined')),
  decision_id TEXT UNIQUE,
  decision_action TEXT CHECK (decision_action IN ('approve', 'decline')),
  subject_id TEXT,
  created_at TEXT NOT NULL,
  decided_at TEXT,
  CHECK (
    (status = 'pending' AND decision_id IS NULL AND decision_action IS NULL
      AND subject_id IS NULL AND decided_at IS NULL)
    OR
    (status = 'approved' AND decision_id IS NOT NULL AND decision_action = 'approve'
      AND subject_id IS NOT NULL AND decided_at IS NOT NULL)
    OR
    (status = 'declined' AND decision_id IS NOT NULL AND decision_action = 'decline'
      AND subject_id IS NOT NULL AND decided_at IS NOT NULL)
  )
) STRICT;

CREATE TABLE receiver_grants (
  grant_id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL UNIQUE REFERENCES receiver_challenges(challenge_id),
  manifest_id TEXT NOT NULL,
  binding_id TEXT NOT NULL UNIQUE,
  subject_id TEXT NOT NULL,
  delivery_target_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  issuer_origin TEXT NOT NULL,
  workflow_type TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  human_boundary TEXT NOT NULL,
  instruction TEXT NOT NULL,
  runs_remaining INTEGER NOT NULL CHECK (runs_remaining IN (0, 1)),
  revoked_at TEXT,
  receipt_json TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE receiver_events (
  event_id TEXT PRIMARY KEY,
  grant_id TEXT NOT NULL UNIQUE REFERENCES receiver_grants(grant_id),
  canonical_body TEXT NOT NULL,
  acceptance_json TEXT NOT NULL,
  received_at TEXT NOT NULL
) STRICT;

CREATE TABLE receiver_deliveries (
  delivery_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE REFERENCES receiver_events(event_id),
  grant_id TEXT NOT NULL UNIQUE REFERENCES receiver_grants(grant_id),
  delivery_target_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status = 'pending'),
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX receiver_deliveries_pending
  ON receiver_deliveries(status, delivery_target_id, created_at);
`;

export const DELIVERY_STATE_SCHEMA_SQL = `
CREATE TABLE receiver_delivery_states (
  delivery_id TEXT PRIMARY KEY REFERENCES receiver_deliveries(delivery_id),
  status TEXT NOT NULL CHECK (
    status IN ('pending', 'leased', 'retry_exhausted', 'acknowledged', 'cancelled')
  ),
  maximum_attempts INTEGER NOT NULL CHECK (maximum_attempts BETWEEN 1 AND 100),
  current_attempt INTEGER NOT NULL CHECK (current_attempt BETWEEN 0 AND 100),
  current_connector_id TEXT,
  current_lease_token_digest TEXT UNIQUE,
  leased_at TEXT,
  lease_expires_at TEXT,
  effect_id TEXT UNIQUE,
  effect_attestation_json TEXT,
  acknowledged_at TEXT,
  terminal_reason TEXT CHECK (
    terminal_reason IS NULL OR terminal_reason IN (
      'grant_expired', 'grant_revoked', 'attempt_limit_reached'
    )
  ),
  updated_at TEXT NOT NULL,
  CHECK (
    current_attempt <= maximum_attempts
  ),
  CHECK (
    (
      status = 'pending' AND current_attempt = 0 AND current_connector_id IS NULL
      AND current_lease_token_digest IS NULL AND leased_at IS NULL
      AND lease_expires_at IS NULL AND effect_id IS NULL
      AND effect_attestation_json IS NULL AND acknowledged_at IS NULL
      AND terminal_reason IS NULL
    ) OR (
      status = 'leased' AND current_attempt >= 1 AND current_connector_id IS NOT NULL
      AND current_lease_token_digest IS NOT NULL AND leased_at IS NOT NULL
      AND lease_expires_at IS NOT NULL AND effect_id IS NULL
      AND effect_attestation_json IS NULL AND acknowledged_at IS NULL
      AND terminal_reason IS NULL
    ) OR (
      status = 'retry_exhausted' AND current_attempt >= 1
      AND current_connector_id IS NOT NULL AND current_lease_token_digest IS NOT NULL
      AND leased_at IS NOT NULL AND lease_expires_at IS NOT NULL
      AND effect_id IS NULL AND effect_attestation_json IS NULL
      AND acknowledged_at IS NULL AND terminal_reason IS NOT NULL
    ) OR (
      status = 'acknowledged' AND current_attempt >= 1
      AND current_connector_id IS NOT NULL AND current_lease_token_digest IS NOT NULL
      AND leased_at IS NOT NULL AND lease_expires_at IS NOT NULL
      AND effect_id IS NOT NULL AND effect_attestation_json IS NOT NULL
      AND acknowledged_at IS NOT NULL AND terminal_reason IS NULL
    ) OR (
      status = 'cancelled' AND current_attempt = 0 AND current_connector_id IS NULL
      AND current_lease_token_digest IS NULL AND leased_at IS NULL
      AND lease_expires_at IS NULL AND effect_id IS NULL
      AND effect_attestation_json IS NULL AND acknowledged_at IS NULL
      AND terminal_reason IN ('grant_expired', 'grant_revoked')
    )
  )
) STRICT;

CREATE TABLE receiver_delivery_attempts (
  delivery_id TEXT NOT NULL REFERENCES receiver_deliveries(delivery_id),
  attempt INTEGER NOT NULL CHECK (attempt BETWEEN 1 AND 100),
  connector_id TEXT NOT NULL,
  lease_token_digest TEXT NOT NULL UNIQUE,
  leased_at TEXT NOT NULL,
  lease_expires_at TEXT NOT NULL,
  PRIMARY KEY (delivery_id, attempt)
) STRICT;

CREATE INDEX receiver_delivery_states_claimable
  ON receiver_delivery_states(status, lease_expires_at, delivery_id);

CREATE INDEX receiver_deliveries_target_order
  ON receiver_deliveries(delivery_target_id, created_at, delivery_id);
`;

export const CONSENTED_INSTRUCTION_SCHEMA_SQL = `
ALTER TABLE receiver_grants
  ADD COLUMN instruction TEXT NOT NULL DEFAULT 'Continue this approved workflow.';

UPDATE receiver_grants
SET instruction = (
  SELECT json_extract(c.manifest_json, '$.display.reason')
  FROM receiver_challenges c
  WHERE c.challenge_id = receiver_grants.challenge_id
);
`;

export const SCHEMA_SQL = `${BASE_SCHEMA_SQL}\n${DELIVERY_STATE_SCHEMA_SQL}`;

export const DELIVERY_DETAIL_SELECT = `
  SELECT
    d.delivery_id,
    d.event_id,
    d.grant_id,
    d.delivery_target_id,
    d.created_at,
    s.status,
    s.maximum_attempts,
    s.current_attempt,
    s.current_connector_id,
    s.current_lease_token_digest,
    s.leased_at,
    s.lease_expires_at,
    s.effect_id,
    s.effect_attestation_json,
    s.acknowledged_at,
    s.terminal_reason,
    s.updated_at,
    g.subject_id,
    g.binding_id AS grant_binding_id,
    g.correlation_id,
    g.issuer_origin AS grant_issuer_origin,
    g.workflow_id,
    g.event_type,
    g.canonical_url,
    g.expires_at AS grant_expires_at,
    g.revoked_at AS grant_revoked_at,
    g.human_boundary,
    g.instruction,
    g.receipt_json,
    e.canonical_body,
    e.received_at
  FROM receiver_deliveries d
  JOIN receiver_delivery_states s ON s.delivery_id = d.delivery_id
  JOIN receiver_grants g ON g.grant_id = d.grant_id
  JOIN receiver_events e ON e.event_id = d.event_id
`;
