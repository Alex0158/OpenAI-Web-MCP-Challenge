-- Feature 2: Host-authenticated consent, stable target bindings, and private Grants.
CREATE TABLE "cr2_organizations" (
    "organization_id" TEXT NOT NULL,
    "developer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cr2_organizations_pkey" PRIMARY KEY ("organization_id")
);

CREATE TABLE "cr2_organization_api_keys" (
    "api_key_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "api_key_digest" TEXT NOT NULL,
    "api_key_prefix" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "cr2_organization_api_keys_pkey" PRIMARY KEY ("api_key_id")
);

CREATE TABLE "cr2_host_keys" (
    "host_key_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "issuer_origin" TEXT NOT NULL,
    "key_id" TEXT NOT NULL,
    "public_key_pem" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "cr2_host_keys_pkey" PRIMARY KEY ("host_key_id")
);

CREATE TABLE "cr2_consent_sessions" (
    "consent_session_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "consent_token_digest" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "host_subject_ref_digest" TEXT NOT NULL,
    "expected_origin" TEXT NOT NULL,
    "manifest_id" TEXT NOT NULL,
    "manifest_json" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decision_action" TEXT,
    "decision_at" TIMESTAMP(3),
    "account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cr2_consent_sessions_pkey" PRIMARY KEY ("consent_session_id")
);

CREATE TABLE "cr2_host_subject_bindings" (
    "binding_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "host_subject_ref_digest" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cr2_host_subject_bindings_pkey" PRIMARY KEY ("binding_id")
);

CREATE TABLE "cr2_grants" (
    "grant_id" TEXT NOT NULL,
    "consent_session_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "binding_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "issuer_origin" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "workflow_type" TEXT NOT NULL,
    "canonical_url" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "human_boundary" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "max_runs" INTEGER NOT NULL,
    "runs_remaining" INTEGER NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cr2_grants_pkey" PRIMARY KEY ("grant_id")
);

CREATE UNIQUE INDEX "cr2_organization_api_keys_api_key_digest_key"
    ON "cr2_organization_api_keys"("api_key_digest");
CREATE INDEX "cr2_organization_api_keys_organization_id_idx"
    ON "cr2_organization_api_keys"("organization_id");
CREATE INDEX "cr2_organizations_developer_id_idx"
    ON "cr2_organizations"("developer_id");
CREATE UNIQUE INDEX "cr2_host_keys_organization_id_issuer_origin_key_id_key"
    ON "cr2_host_keys"("organization_id", "issuer_origin", "key_id");
CREATE UNIQUE INDEX "cr2_consent_sessions_challenge_id_key"
    ON "cr2_consent_sessions"("challenge_id");
CREATE UNIQUE INDEX "cr2_consent_sessions_consent_token_digest_key"
    ON "cr2_consent_sessions"("consent_token_digest");
CREATE UNIQUE INDEX "cr2_consent_sessions_organization_id_manifest_id_key"
    ON "cr2_consent_sessions"("organization_id", "manifest_id");
CREATE INDEX "cr2_consent_sessions_organization_id_host_subject_ref_digest_idx"
    ON "cr2_consent_sessions"("organization_id", "host_subject_ref_digest");
CREATE INDEX "cr2_consent_sessions_organization_id_status_idx"
    ON "cr2_consent_sessions"("organization_id", "status");
CREATE UNIQUE INDEX "cr2_host_subject_bindings_organization_id_host_subject_ref_digest_key"
    ON "cr2_host_subject_bindings"("organization_id", "host_subject_ref_digest");
CREATE INDEX "cr2_host_subject_bindings_connector_id_idx"
    ON "cr2_host_subject_bindings"("connector_id");
CREATE UNIQUE INDEX "cr2_grants_consent_session_id_key"
    ON "cr2_grants"("consent_session_id");
CREATE INDEX "cr2_grants_organization_id_binding_id_idx"
    ON "cr2_grants"("organization_id", "binding_id");
CREATE INDEX "cr2_grants_connector_id_idx"
    ON "cr2_grants"("connector_id");

ALTER TABLE "cr2_organizations"
    ADD CONSTRAINT "cr2_organizations_developer_id_fkey"
    FOREIGN KEY ("developer_id") REFERENCES "cr2_developer_accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_organization_api_keys"
    ADD CONSTRAINT "cr2_organization_api_keys_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "cr2_organizations"("organization_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_host_keys"
    ADD CONSTRAINT "cr2_host_keys_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "cr2_organizations"("organization_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_consent_sessions"
    ADD CONSTRAINT "cr2_consent_sessions_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "cr2_organizations"("organization_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_consent_sessions"
    ADD CONSTRAINT "cr2_consent_sessions_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "cr2_user_accounts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cr2_host_subject_bindings"
    ADD CONSTRAINT "cr2_host_subject_bindings_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "cr2_organizations"("organization_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_host_subject_bindings"
    ADD CONSTRAINT "cr2_host_subject_bindings_connector_id_fkey"
    FOREIGN KEY ("connector_id") REFERENCES "cr2_connectors"("connector_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_grants"
    ADD CONSTRAINT "cr2_grants_consent_session_id_fkey"
    FOREIGN KEY ("consent_session_id") REFERENCES "cr2_consent_sessions"("consent_session_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_grants"
    ADD CONSTRAINT "cr2_grants_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "cr2_organizations"("organization_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_grants"
    ADD CONSTRAINT "cr2_grants_binding_id_fkey"
    FOREIGN KEY ("binding_id") REFERENCES "cr2_host_subject_bindings"("binding_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_grants"
    ADD CONSTRAINT "cr2_grants_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "cr2_user_accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_grants"
    ADD CONSTRAINT "cr2_grants_connector_id_fkey"
    FOREIGN KEY ("connector_id") REFERENCES "cr2_connectors"("connector_id")
    ON DELETE CASCADE ON UPDATE CASCADE;
