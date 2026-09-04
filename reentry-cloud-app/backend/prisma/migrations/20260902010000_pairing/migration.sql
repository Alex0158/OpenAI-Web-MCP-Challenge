CREATE TABLE "cr2_pairing_sessions" (
    "pairing_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "pairing_code_digest" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMP(3),

    CONSTRAINT "cr2_pairing_sessions_pkey" PRIMARY KEY ("pairing_id")
);

CREATE TABLE "cr2_connectors" (
    "connector_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "pairing_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "connector_token_digest" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "cr2_connectors_pkey" PRIMARY KEY ("connector_id")
);

CREATE UNIQUE INDEX "cr2_pairing_sessions_pairing_code_digest_key"
    ON "cr2_pairing_sessions"("pairing_code_digest");
CREATE INDEX "cr2_pairing_sessions_account_id_idx"
    ON "cr2_pairing_sessions"("account_id");
CREATE UNIQUE INDEX "cr2_connectors_pairing_id_key"
    ON "cr2_connectors"("pairing_id");
CREATE UNIQUE INDEX "cr2_connectors_delivery_target_id_key"
    ON "cr2_connectors"("delivery_target_id");
CREATE UNIQUE INDEX "cr2_connectors_connector_token_digest_key"
    ON "cr2_connectors"("connector_token_digest");
CREATE INDEX "cr2_connectors_account_id_idx"
    ON "cr2_connectors"("account_id");

ALTER TABLE "cr2_pairing_sessions"
    ADD CONSTRAINT "cr2_pairing_sessions_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "cr2_user_accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_connectors"
    ADD CONSTRAINT "cr2_connectors_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "cr2_user_accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_connectors"
    ADD CONSTRAINT "cr2_connectors_pairing_id_fkey"
    FOREIGN KEY ("pairing_id") REFERENCES "cr2_pairing_sessions"("pairing_id")
    ON DELETE CASCADE ON UPDATE CASCADE;
