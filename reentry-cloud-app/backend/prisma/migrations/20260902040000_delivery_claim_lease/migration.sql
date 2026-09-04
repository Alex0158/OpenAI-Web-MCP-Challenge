-- Feature 4: durable target-scoped delivery leases and bounded attempts.
ALTER TABLE "cr2_deliveries"
    DROP CONSTRAINT "cr2_deliveries_status_check";

ALTER TABLE "cr2_deliveries"
    ADD COLUMN "current_attempt" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "maximum_attempts" INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN "current_connector_id" TEXT,
    ADD COLUMN "current_claim_token_digest" TEXT,
    ADD COLUMN "current_lease_token_digest" TEXT,
    ADD COLUMN "lease_started_at" TIMESTAMP(3),
    ADD COLUMN "lease_expires_at" TIMESTAMP(3),
    ADD COLUMN "terminal_reason" TEXT,
    ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "cr2_deliveries"
    ADD CONSTRAINT "cr2_deliveries_status_check"
    CHECK ("status" IN ('pending', 'leased', 'retry_exhausted'));

ALTER TABLE "cr2_deliveries"
    ADD CONSTRAINT "cr2_deliveries_current_attempt_check"
    CHECK ("current_attempt" >= 0 AND "current_attempt" <= "maximum_attempts");

ALTER TABLE "cr2_deliveries"
    ADD CONSTRAINT "cr2_deliveries_maximum_attempts_check"
    CHECK ("maximum_attempts" > 0);

CREATE INDEX "cr2_deliveries_status_lease_expires_at_idx"
    ON "cr2_deliveries"("status", "lease_expires_at");

CREATE TABLE "cr2_delivery_attempts" (
    "attempt_id" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "claim_token_digest" TEXT NOT NULL,
    "lease_token_digest" TEXT NOT NULL,
    "lease_started_at" TIMESTAMP(3) NOT NULL,
    "lease_expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cr2_delivery_attempts_pkey" PRIMARY KEY ("attempt_id")
);

CREATE UNIQUE INDEX "cr2_delivery_attempts_claim_token_digest_key"
    ON "cr2_delivery_attempts"("claim_token_digest");
CREATE UNIQUE INDEX "cr2_delivery_attempts_lease_token_digest_key"
    ON "cr2_delivery_attempts"("lease_token_digest");
CREATE UNIQUE INDEX "cr2_delivery_attempts_delivery_id_attempt_key"
    ON "cr2_delivery_attempts"("delivery_id", "attempt");
CREATE INDEX "cr2_delivery_attempts_delivery_id_idx"
    ON "cr2_delivery_attempts"("delivery_id");
CREATE INDEX "cr2_delivery_attempts_connector_id_idx"
    ON "cr2_delivery_attempts"("connector_id");

ALTER TABLE "cr2_delivery_attempts"
    ADD CONSTRAINT "cr2_delivery_attempts_delivery_id_fkey"
    FOREIGN KEY ("delivery_id") REFERENCES "cr2_deliveries"("delivery_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_delivery_attempts"
    ADD CONSTRAINT "cr2_delivery_attempts_connector_id_fkey"
    FOREIGN KEY ("connector_id") REFERENCES "cr2_connectors"("connector_id")
    ON DELETE CASCADE ON UPDATE CASCADE;
