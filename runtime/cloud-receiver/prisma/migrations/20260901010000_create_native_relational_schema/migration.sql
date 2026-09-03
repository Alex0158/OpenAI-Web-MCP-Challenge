-- The snapshot table from 20260901000000 remains as a one-time backfill source.

CREATE TABLE "reentry_accounts" (
    "account_id" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "credential_salt" TEXT NOT NULL,
    "credential_digest" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    CONSTRAINT "reentry_accounts_pkey" PRIMARY KEY ("account_id")
);

CREATE TABLE "reentry_organizations" (
    "organization_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    CONSTRAINT "reentry_organizations_pkey" PRIMARY KEY ("organization_id")
);

CREATE TABLE "reentry_api_keys" (
    "api_key_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "key_digest" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "revoked_at" TEXT,
    CONSTRAINT "reentry_api_keys_pkey" PRIMARY KEY ("api_key_id")
);

CREATE TABLE "reentry_sessions" (
    "session_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "token_digest" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    CONSTRAINT "reentry_sessions_pkey" PRIMARY KEY ("session_id")
);

CREATE TABLE "cloud_pairing_sessions" (
    "pairing_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "host_subject_ref_digest" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "device_code_digest" TEXT NOT NULL,
    "user_code_digest" TEXT NOT NULL,
    "connector_token_digest" TEXT NOT NULL,
    "status" TEXT NOT NULL CHECK ("status" IN ('pending', 'approved', 'consumed', 'expired')),
    "created_at" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "claimed_at" TEXT,
    "approved_at" TEXT,
    "consumed_at" TEXT,
    CONSTRAINT "cloud_pairing_sessions_pkey" PRIMARY KEY ("pairing_id")
);

CREATE TABLE "cloud_connectors" (
    "connector_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "connector_token_digest" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "revoked_at" TEXT,
    CONSTRAINT "cloud_connectors_pkey" PRIMARY KEY ("connector_id")
);

CREATE TABLE "cloud_host_subject_links" (
    "organization_id" TEXT NOT NULL,
    "host_subject_ref_digest" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    CONSTRAINT "cloud_host_subject_links_pkey" PRIMARY KEY ("organization_id", "host_subject_ref_digest")
);

CREATE TABLE "cloud_host_signing_keys" (
    "organization_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "issuer_origin" TEXT NOT NULL,
    "key_id" TEXT NOT NULL,
    "public_key_pem" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    CONSTRAINT "cloud_host_signing_keys_pkey" PRIMARY KEY ("organization_id", "host_id")
);

CREATE TABLE "cloud_consent_sessions" (
    "consent_session_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "host_subject_ref_digest" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "consent_token_digest" TEXT NOT NULL,
    "decision_id" TEXT NOT NULL,
    "status" TEXT NOT NULL CHECK ("status" IN ('pending', 'deciding', 'approved', 'declined')),
    "created_at" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "decision_action" TEXT,
    "decided_at" TEXT,
    CONSTRAINT "cloud_consent_sessions_pkey" PRIMARY KEY ("consent_session_id")
);

CREATE TABLE "product_device_authorizations" (
    "authorization_id" TEXT NOT NULL,
    "device_code_digest" TEXT NOT NULL,
    "browser_token_digest" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "connector_token_digest" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "account_id" TEXT,
    "status" TEXT NOT NULL CHECK ("status" IN ('pending', 'approved', 'denied', 'consumed')),
    "created_at" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "decided_at" TEXT,
    "consumed_at" TEXT,
    CONSTRAINT "product_device_authorizations_pkey" PRIMARY KEY ("authorization_id")
);

CREATE TABLE "product_account_connectors" (
    "connector_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "connector_token_digest" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "revoked_at" TEXT,
    CONSTRAINT "product_account_connectors_pkey" PRIMARY KEY ("connector_id")
);

CREATE TABLE "product_account_pairing_requests" (
    "pairing_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "pairing_code_digest" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "connector_token_digest" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "device_name" TEXT,
    "created_at" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "consumed_at" TEXT,
    CONSTRAINT "product_account_pairing_requests_pkey" PRIMARY KEY ("pairing_id"),
    CONSTRAINT "product_account_pairing_requests_device_check"
      CHECK (("consumed_at" IS NULL AND "device_name" IS NULL)
        OR ("consumed_at" IS NOT NULL AND "device_name" IS NOT NULL))
);

CREATE TABLE "product_account_host_subject_links" (
    "organization_id" TEXT NOT NULL,
    "host_subject_ref_digest" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    CONSTRAINT "product_account_host_subject_links_pkey" PRIMARY KEY ("organization_id", "host_subject_ref_digest")
);

CREATE TABLE "product_account_consent_sessions" (
    "consent_session_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "host_subject_ref_digest" TEXT NOT NULL,
    "consent_token_digest" TEXT NOT NULL,
    "decision_id" TEXT NOT NULL,
    "status" TEXT NOT NULL CHECK ("status" IN ('pending', 'deciding', 'approved', 'declined')),
    "account_id" TEXT,
    "connector_id" TEXT,
    "subject_id" TEXT,
    "delivery_target_id" TEXT,
    "created_at" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "decision_action" TEXT,
    "decided_at" TEXT,
    "binding_json" TEXT,
    CONSTRAINT "product_account_consent_sessions_pkey" PRIMARY KEY ("consent_session_id")
);

CREATE TABLE "receiver_challenges" (
    "challenge_id" TEXT NOT NULL,
    "manifest_id" TEXT NOT NULL,
    "manifest_json" TEXT NOT NULL,
    "expected_origin" TEXT NOT NULL,
    "effective_expires_at" TEXT NOT NULL,
    "status" TEXT NOT NULL CHECK ("status" IN ('pending', 'approved', 'declined')),
    "decision_id" TEXT,
    "decision_action" TEXT,
    "subject_id" TEXT,
    "created_at" TEXT NOT NULL,
    "decided_at" TEXT,
    CONSTRAINT "receiver_challenges_pkey" PRIMARY KEY ("challenge_id")
);

CREATE TABLE "receiver_grants" (
    "grant_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "manifest_id" TEXT NOT NULL,
    "binding_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "issuer_origin" TEXT NOT NULL,
    "workflow_type" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "canonical_url" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "human_boundary" TEXT NOT NULL,
    "runs_remaining" INTEGER NOT NULL CHECK ("runs_remaining" IN (0, 1)),
    "revoked_at" TEXT,
    "receipt_json" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    CONSTRAINT "receiver_grants_pkey" PRIMARY KEY ("grant_id")
);

CREATE TABLE "receiver_events" (
    "event_id" TEXT NOT NULL,
    "grant_id" TEXT NOT NULL,
    "canonical_body" TEXT NOT NULL,
    "acceptance_json" TEXT NOT NULL,
    "received_at" TEXT NOT NULL,
    CONSTRAINT "receiver_events_pkey" PRIMARY KEY ("event_id")
);

CREATE TABLE "receiver_deliveries" (
    "delivery_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "grant_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "status" TEXT NOT NULL CHECK ("status" = 'pending'),
    "created_at" TEXT NOT NULL,
    CONSTRAINT "receiver_deliveries_pkey" PRIMARY KEY ("delivery_id")
);

CREATE TABLE "receiver_delivery_states" (
    "delivery_id" TEXT NOT NULL,
    "status" TEXT NOT NULL CHECK ("status" IN ('pending', 'leased', 'retry_exhausted', 'acknowledged', 'cancelled')),
    "maximum_attempts" INTEGER NOT NULL,
    "current_attempt" INTEGER NOT NULL,
    "current_connector_id" TEXT,
    "current_lease_token_digest" TEXT,
    "leased_at" TEXT,
    "lease_expires_at" TEXT,
    "effect_id" TEXT,
    "effect_attestation_json" TEXT,
    "acknowledged_at" TEXT,
    "terminal_reason" TEXT,
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "receiver_delivery_states_pkey" PRIMARY KEY ("delivery_id"),
    CONSTRAINT "receiver_delivery_states_attempt_check"
      CHECK ("current_attempt" >= 0 AND "current_attempt" <= "maximum_attempts")
);

CREATE TABLE "receiver_delivery_attempts" (
    "delivery_id" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "connector_id" TEXT NOT NULL,
    "lease_token_digest" TEXT NOT NULL,
    "leased_at" TEXT NOT NULL,
    "lease_expires_at" TEXT NOT NULL,
    CONSTRAINT "receiver_delivery_attempts_pkey" PRIMARY KEY ("delivery_id", "attempt")
);

CREATE UNIQUE INDEX "reentry_accounts_identity_key" ON "reentry_accounts"("identity");
CREATE INDEX "reentry_organizations_account_idx" ON "reentry_organizations"("account_id", "created_at");
CREATE UNIQUE INDEX "reentry_api_keys_digest_key" ON "reentry_api_keys"("key_digest");
CREATE INDEX "reentry_api_keys_organization_idx" ON "reentry_api_keys"("organization_id", "created_at");
CREATE UNIQUE INDEX "reentry_sessions_token_digest_key" ON "reentry_sessions"("token_digest");
CREATE INDEX "reentry_sessions_expiry_idx" ON "reentry_sessions"("expires_at");

CREATE UNIQUE INDEX "cloud_pairing_sessions_device_digest_key" ON "cloud_pairing_sessions"("device_code_digest");
CREATE UNIQUE INDEX "cloud_pairing_sessions_user_digest_key" ON "cloud_pairing_sessions"("user_code_digest");
CREATE UNIQUE INDEX "cloud_pairing_sessions_connector_token_key" ON "cloud_pairing_sessions"("connector_token_digest");
CREATE INDEX "cloud_pairing_sessions_expiry_idx" ON "cloud_pairing_sessions"("status", "expires_at");
CREATE INDEX "cloud_pairing_sessions_subject_idx" ON "cloud_pairing_sessions"("organization_id", "host_subject_ref_digest", "created_at");
CREATE UNIQUE INDEX "cloud_connectors_target_key" ON "cloud_connectors"("delivery_target_id");
CREATE UNIQUE INDEX "cloud_connectors_token_key" ON "cloud_connectors"("connector_token_digest");
CREATE UNIQUE INDEX "cloud_host_subject_links_subject_key" ON "cloud_host_subject_links"("subject_id");
CREATE UNIQUE INDEX "cloud_host_subject_links_target_key" ON "cloud_host_subject_links"("delivery_target_id");
CREATE UNIQUE INDEX "cloud_host_subject_links_connector_key" ON "cloud_host_subject_links"("connector_id");
CREATE UNIQUE INDEX "cloud_host_signing_keys_issuer_key" ON "cloud_host_signing_keys"("organization_id", "issuer_origin", "key_id");
CREATE UNIQUE INDEX "cloud_consent_sessions_challenge_key" ON "cloud_consent_sessions"("challenge_id");
CREATE UNIQUE INDEX "cloud_consent_sessions_token_key" ON "cloud_consent_sessions"("consent_token_digest");
CREATE UNIQUE INDEX "cloud_consent_sessions_decision_key" ON "cloud_consent_sessions"("decision_id");
CREATE INDEX "cloud_consent_sessions_subject_idx" ON "cloud_consent_sessions"("organization_id", "host_subject_ref_digest", "created_at");

CREATE UNIQUE INDEX "product_device_authorizations_device_key" ON "product_device_authorizations"("device_code_digest");
CREATE UNIQUE INDEX "product_device_authorizations_browser_key" ON "product_device_authorizations"("browser_token_digest");
CREATE UNIQUE INDEX "product_device_authorizations_connector_key" ON "product_device_authorizations"("connector_id");
CREATE UNIQUE INDEX "product_device_authorizations_token_key" ON "product_device_authorizations"("connector_token_digest");
CREATE UNIQUE INDEX "product_device_authorizations_subject_key" ON "product_device_authorizations"("subject_id");
CREATE UNIQUE INDEX "product_device_authorizations_target_key" ON "product_device_authorizations"("delivery_target_id");
CREATE INDEX "product_device_authorizations_expiry_idx" ON "product_device_authorizations"("status", "expires_at");
CREATE UNIQUE INDEX "product_account_connectors_target_key" ON "product_account_connectors"("delivery_target_id");
CREATE UNIQUE INDEX "product_account_connectors_token_key" ON "product_account_connectors"("connector_token_digest");
CREATE INDEX "product_account_connectors_account_idx" ON "product_account_connectors"("account_id", "created_at", "connector_id");
CREATE UNIQUE INDEX "product_account_pairing_requests_code_key" ON "product_account_pairing_requests"("pairing_code_digest");
CREATE UNIQUE INDEX "product_account_pairing_requests_connector_key" ON "product_account_pairing_requests"("connector_id");
CREATE UNIQUE INDEX "product_account_pairing_requests_token_key" ON "product_account_pairing_requests"("connector_token_digest");
CREATE UNIQUE INDEX "product_account_pairing_requests_subject_key" ON "product_account_pairing_requests"("subject_id");
CREATE UNIQUE INDEX "product_account_pairing_requests_target_key" ON "product_account_pairing_requests"("delivery_target_id");
CREATE INDEX "product_account_pairing_requests_expiry_idx" ON "product_account_pairing_requests"("expires_at", "consumed_at");
CREATE INDEX "product_account_host_subject_links_connector_idx" ON "product_account_host_subject_links"("connector_id", "created_at");
CREATE UNIQUE INDEX "product_account_consent_sessions_challenge_key" ON "product_account_consent_sessions"("challenge_id");
CREATE UNIQUE INDEX "product_account_consent_sessions_token_key" ON "product_account_consent_sessions"("consent_token_digest");
CREATE UNIQUE INDEX "product_account_consent_sessions_decision_key" ON "product_account_consent_sessions"("decision_id");
CREATE INDEX "product_account_consent_sessions_organization_idx" ON "product_account_consent_sessions"("organization_id", "created_at", "consent_session_id");

CREATE UNIQUE INDEX "receiver_challenges_manifest_key" ON "receiver_challenges"("manifest_id");
CREATE UNIQUE INDEX "receiver_challenges_decision_key" ON "receiver_challenges"("decision_id");
CREATE UNIQUE INDEX "receiver_grants_challenge_key" ON "receiver_grants"("challenge_id");
CREATE UNIQUE INDEX "receiver_grants_binding_key" ON "receiver_grants"("binding_id");
CREATE UNIQUE INDEX "receiver_events_grant_key" ON "receiver_events"("grant_id");
CREATE UNIQUE INDEX "receiver_deliveries_event_key" ON "receiver_deliveries"("event_id");
CREATE UNIQUE INDEX "receiver_deliveries_grant_key" ON "receiver_deliveries"("grant_id");
CREATE INDEX "receiver_deliveries_pending_idx" ON "receiver_deliveries"("status", "delivery_target_id", "created_at");
CREATE INDEX "receiver_deliveries_target_idx" ON "receiver_deliveries"("delivery_target_id", "created_at", "delivery_id");
CREATE UNIQUE INDEX "receiver_delivery_states_lease_key" ON "receiver_delivery_states"("current_lease_token_digest");
CREATE UNIQUE INDEX "receiver_delivery_states_effect_key" ON "receiver_delivery_states"("effect_id");
CREATE INDEX "receiver_delivery_states_claimable_idx" ON "receiver_delivery_states"("status", "lease_expires_at", "delivery_id");
CREATE UNIQUE INDEX "receiver_delivery_attempts_lease_key" ON "receiver_delivery_attempts"("lease_token_digest");

ALTER TABLE "reentry_organizations"
  ADD CONSTRAINT "reentry_organizations_account_fk"
  FOREIGN KEY ("account_id") REFERENCES "reentry_accounts"("account_id") ON DELETE CASCADE;
ALTER TABLE "reentry_api_keys"
  ADD CONSTRAINT "reentry_api_keys_organization_fk"
  FOREIGN KEY ("organization_id") REFERENCES "reentry_organizations"("organization_id") ON DELETE CASCADE;
ALTER TABLE "reentry_sessions"
  ADD CONSTRAINT "reentry_sessions_account_fk"
  FOREIGN KEY ("account_id") REFERENCES "reentry_accounts"("account_id") ON DELETE CASCADE;
ALTER TABLE "product_account_connectors"
  ADD CONSTRAINT "product_account_connectors_account_fk"
  FOREIGN KEY ("account_id") REFERENCES "reentry_accounts"("account_id") ON DELETE CASCADE;
ALTER TABLE "product_account_pairing_requests"
  ADD CONSTRAINT "product_account_pairing_requests_account_fk"
  FOREIGN KEY ("account_id") REFERENCES "reentry_accounts"("account_id") ON DELETE CASCADE;
ALTER TABLE "product_account_host_subject_links"
  ADD CONSTRAINT "product_account_host_subject_links_connector_fk"
  FOREIGN KEY ("connector_id") REFERENCES "product_account_connectors"("connector_id");
ALTER TABLE "receiver_grants"
  ADD CONSTRAINT "receiver_grants_challenge_fk"
  FOREIGN KEY ("challenge_id") REFERENCES "receiver_challenges"("challenge_id");
ALTER TABLE "receiver_events"
  ADD CONSTRAINT "receiver_events_grant_fk"
  FOREIGN KEY ("grant_id") REFERENCES "receiver_grants"("grant_id");
ALTER TABLE "receiver_deliveries"
  ADD CONSTRAINT "receiver_deliveries_event_fk"
  FOREIGN KEY ("event_id") REFERENCES "receiver_events"("event_id");
ALTER TABLE "receiver_deliveries"
  ADD CONSTRAINT "receiver_deliveries_grant_fk"
  FOREIGN KEY ("grant_id") REFERENCES "receiver_grants"("grant_id");
ALTER TABLE "receiver_delivery_states"
  ADD CONSTRAINT "receiver_delivery_states_delivery_fk"
  FOREIGN KEY ("delivery_id") REFERENCES "receiver_deliveries"("delivery_id");
ALTER TABLE "receiver_delivery_attempts"
  ADD CONSTRAINT "receiver_delivery_attempts_delivery_fk"
  FOREIGN KEY ("delivery_id") REFERENCES "receiver_deliveries"("delivery_id");
