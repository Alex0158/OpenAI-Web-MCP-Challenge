export const SCHEMA_VERSION = 7;
// Legacy rows cannot recover consented public-key bytes from a mutable key resolver.
export const STANDING_LEGACY_KEY_FINGERPRINT = "__legacy_unpinned__";

const STANDING_LEGACY_KEY_ID = "__migration_unset__";

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

export const STANDING_KEY_PIN_TRIGGERS_SQL = `
CREATE TRIGGER IF NOT EXISTS receiver_standing_grants_key_pin_insert
BEFORE INSERT ON receiver_standing_grants
WHEN
  NEW.issuer_key_id IS NULL
  OR typeof(NEW.issuer_key_id) != 'text'
  OR length(NEW.issuer_key_id) NOT BETWEEN 1 AND 160
  OR instr(NEW.issuer_key_id, char(0)) != 0
  OR substr(NEW.issuer_key_id, 1, 1) NOT GLOB '[A-Za-z0-9]'
  OR NEW.issuer_key_id GLOB '*[^A-Za-z0-9._:-]*'
  OR NEW.issuer_key_fingerprint IS NULL
  OR typeof(NEW.issuer_key_fingerprint) != 'text'
  OR length(NEW.issuer_key_fingerprint) != 43
  OR instr(NEW.issuer_key_fingerprint, char(0)) != 0
  OR NEW.issuer_key_fingerprint GLOB '*[^A-Za-z0-9_-]*'
  OR substr(NEW.issuer_key_fingerprint, 43, 1) NOT GLOB '[AEIMQUYcgkosw048]'
BEGIN
  SELECT RAISE(ABORT, 'standing_grant_key_pin_invalid');
END;

CREATE TRIGGER IF NOT EXISTS receiver_standing_grants_key_pin_update
BEFORE UPDATE OF issuer_key_id, issuer_key_fingerprint ON receiver_standing_grants
WHEN NEW.issuer_key_id IS NOT OLD.issuer_key_id
  OR NEW.issuer_key_fingerprint IS NOT OLD.issuer_key_fingerprint
BEGIN
  SELECT RAISE(ABORT, 'standing_grant_key_pin_immutable');
END;
`;

export const STANDING_AUTHORIZATION_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS receiver_standing_challenges (
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

CREATE TABLE IF NOT EXISTS receiver_standing_grants (
  grant_id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL UNIQUE REFERENCES receiver_standing_challenges(challenge_id),
  manifest_id TEXT NOT NULL,
  binding_id TEXT NOT NULL UNIQUE,
  subject_id TEXT NOT NULL,
  delivery_target_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  issuer_origin TEXT NOT NULL,
  issuer_key_id TEXT NOT NULL DEFAULT '${STANDING_LEGACY_KEY_ID}',
  issuer_key_fingerprint TEXT NOT NULL DEFAULT '${STANDING_LEGACY_KEY_FINGERPRINT}',
  workflow_type TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  human_boundary TEXT NOT NULL,
  instruction TEXT NOT NULL,
  authorization_mode TEXT NOT NULL CHECK (authorization_mode = 'standing'),
  max_active_activations INTEGER NOT NULL CHECK (max_active_activations = 1),
  last_event_sequence INTEGER NOT NULL CHECK (last_event_sequence >= 0),
  revoked_at TEXT,
  receipt_json TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS receiver_standing_events (
  event_id TEXT PRIMARY KEY,
  grant_id TEXT NOT NULL REFERENCES receiver_standing_grants(grant_id),
  event_sequence INTEGER NOT NULL CHECK (event_sequence >= 1),
  canonical_body TEXT NOT NULL,
  acceptance_json TEXT NOT NULL,
  received_at TEXT NOT NULL,
  UNIQUE (grant_id, event_sequence)
) STRICT;

CREATE TABLE IF NOT EXISTS receiver_standing_deliveries (
  delivery_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE REFERENCES receiver_standing_events(event_id),
  grant_id TEXT NOT NULL REFERENCES receiver_standing_grants(grant_id),
  delivery_target_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'leased', 'acknowledged', 'terminal')),
  connector_id TEXT,
  lease_token_digest TEXT UNIQUE,
  leased_at TEXT,
  lease_expires_at TEXT,
  effect_id TEXT UNIQUE,
  effect_attestation_json TEXT,
  acknowledged_at TEXT,
  terminal_reason TEXT,
  handoff_id TEXT,
  runtime_admission_json TEXT,
  handoff_receipt_json TEXT,
  handoff_accepted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (
    (status = 'pending' AND connector_id IS NULL AND lease_token_digest IS NULL
      AND leased_at IS NULL AND lease_expires_at IS NULL AND effect_id IS NULL
      AND effect_attestation_json IS NULL AND acknowledged_at IS NULL
      AND terminal_reason IS NULL)
    OR
    (status = 'leased' AND connector_id IS NOT NULL AND lease_token_digest IS NOT NULL
      AND leased_at IS NOT NULL AND lease_expires_at IS NOT NULL AND effect_id IS NULL
      AND effect_attestation_json IS NULL AND acknowledged_at IS NULL
      AND terminal_reason IS NULL)
    OR
    (status = 'acknowledged' AND connector_id IS NOT NULL AND lease_token_digest IS NOT NULL
      AND leased_at IS NOT NULL AND lease_expires_at IS NOT NULL AND effect_id IS NOT NULL
      AND effect_attestation_json IS NOT NULL AND acknowledged_at IS NOT NULL
      AND terminal_reason IS NULL)
    OR
    (status = 'terminal' AND terminal_reason IS NOT NULL)
  )
) STRICT;

CREATE UNIQUE INDEX IF NOT EXISTS receiver_standing_deliveries_one_open
  ON receiver_standing_deliveries(grant_id)
  WHERE status IN ('pending', 'leased');

CREATE INDEX IF NOT EXISTS receiver_standing_deliveries_target_pending
  ON receiver_standing_deliveries(delivery_target_id, status, created_at, delivery_id);

CREATE UNIQUE INDEX IF NOT EXISTS receiver_standing_deliveries_handoff_id
  ON receiver_standing_deliveries(handoff_id)
  WHERE handoff_id IS NOT NULL;

${STANDING_KEY_PIN_TRIGGERS_SQL}
`;

export const STANDING_ISSUER_KEY_SCHEMA_SQL = `
ALTER TABLE receiver_standing_grants
  ADD COLUMN issuer_key_id TEXT NOT NULL DEFAULT '${STANDING_LEGACY_KEY_ID}';

UPDATE receiver_standing_grants
SET issuer_key_id = COALESCE((
  SELECT CASE WHEN json_valid(c.manifest_json)
    THEN CASE WHEN json_type(c.manifest_json, '$.signature.key_id') = 'text'
      THEN json_extract(c.manifest_json, '$.signature.key_id')
      ELSE NULL END
    ELSE NULL END
  FROM receiver_standing_challenges c
  WHERE c.challenge_id = receiver_standing_grants.challenge_id
), '${STANDING_LEGACY_KEY_ID}');
`;

export const STANDING_KEY_FINGERPRINT_SCHEMA_SQL = `
ALTER TABLE receiver_standing_grants
  ADD COLUMN issuer_key_fingerprint TEXT NOT NULL DEFAULT '${STANDING_LEGACY_KEY_FINGERPRINT}';

-- This deterministic security-disable marker is not a historical user revocation.
UPDATE receiver_standing_grants
SET revoked_at = created_at
WHERE revoked_at IS NULL;
`;

export const STANDING_NOTIFICATION_HANDOFF_SCHEMA_SQL = `
ALTER TABLE receiver_standing_deliveries
  ADD COLUMN handoff_id TEXT;

ALTER TABLE receiver_standing_deliveries
  ADD COLUMN runtime_admission_json TEXT;

ALTER TABLE receiver_standing_deliveries
  ADD COLUMN handoff_receipt_json TEXT;

ALTER TABLE receiver_standing_deliveries
  ADD COLUMN handoff_accepted_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS receiver_standing_deliveries_handoff_id
  ON receiver_standing_deliveries(handoff_id)
  WHERE handoff_id IS NOT NULL;
`;

export const SCHEMA_SQL = `${BASE_SCHEMA_SQL}\n${DELIVERY_STATE_SCHEMA_SQL}\n${STANDING_AUTHORIZATION_SCHEMA_SQL}`;

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

export const STANDING_DELIVERY_DETAIL_SELECT = `
  SELECT
    d.delivery_id,
    d.event_id,
    d.grant_id,
    d.delivery_target_id,
    d.status,
    d.connector_id,
    d.lease_token_digest,
    d.leased_at,
    d.lease_expires_at,
    d.effect_id,
    d.effect_attestation_json,
    d.acknowledged_at,
    d.terminal_reason,
    d.handoff_id,
    d.runtime_admission_json,
    d.handoff_receipt_json,
    d.handoff_accepted_at,
    d.created_at,
    d.updated_at,
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
    g.authorization_mode,
    g.max_active_activations,
    g.last_event_sequence,
    g.receipt_json,
    e.event_sequence,
    e.canonical_body,
    e.received_at
  FROM receiver_standing_deliveries d
  JOIN receiver_standing_grants g ON g.grant_id = d.grant_id
  JOIN receiver_standing_events e ON e.event_id = d.event_id
`;
