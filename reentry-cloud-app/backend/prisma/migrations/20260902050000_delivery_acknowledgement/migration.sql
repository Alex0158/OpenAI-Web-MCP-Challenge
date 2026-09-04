-- Feature 5: effect-backed acknowledgement and durable final delivery state.
ALTER TABLE "cr2_deliveries"
    DROP CONSTRAINT "cr2_deliveries_status_check";

ALTER TABLE "cr2_deliveries"
    ADD COLUMN "effect_id" TEXT,
    ADD COLUMN "effect_attestation_json" TEXT,
    ADD COLUMN "acknowledged_at" TIMESTAMP(3);

ALTER TABLE "cr2_deliveries"
    ADD CONSTRAINT "cr2_deliveries_status_check"
    CHECK ("status" IN ('pending', 'leased', 'retry_exhausted', 'acknowledged', 'cancelled'));

CREATE UNIQUE INDEX "cr2_deliveries_effect_id_key"
    ON "cr2_deliveries"("effect_id");
