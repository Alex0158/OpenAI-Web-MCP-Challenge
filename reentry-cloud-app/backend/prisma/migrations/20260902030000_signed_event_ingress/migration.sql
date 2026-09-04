-- Feature 3: signed Event receipts and durable pending deliveries.
CREATE TABLE "cr2_events" (
    "event_id" TEXT NOT NULL,
    "grant_id" TEXT NOT NULL,
    "binding_id" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "issuer_origin" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_sequence" INTEGER NOT NULL,
    "state_version" BIGINT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "canonical_url" TEXT NOT NULL,
    "canonical_body" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cr2_events_pkey" PRIMARY KEY ("event_id"),
    CONSTRAINT "cr2_events_event_sequence_check" CHECK ("event_sequence" = 1),
    CONSTRAINT "cr2_events_state_version_check" CHECK ("state_version" >= 0)
);

CREATE TABLE "cr2_deliveries" (
    "delivery_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "grant_id" TEXT NOT NULL,
    "delivery_target_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cr2_deliveries_pkey" PRIMARY KEY ("delivery_id"),
    CONSTRAINT "cr2_deliveries_status_check" CHECK ("status" = 'pending')
);

CREATE UNIQUE INDEX "cr2_events_grant_id_key"
    ON "cr2_events"("grant_id");
CREATE INDEX "cr2_events_binding_id_idx"
    ON "cr2_events"("binding_id");
CREATE UNIQUE INDEX "cr2_deliveries_event_id_key"
    ON "cr2_deliveries"("event_id");
CREATE UNIQUE INDEX "cr2_deliveries_grant_id_key"
    ON "cr2_deliveries"("grant_id");
CREATE INDEX "cr2_deliveries_delivery_target_id_status_created_at_idx"
    ON "cr2_deliveries"("delivery_target_id", "status", "created_at");

ALTER TABLE "cr2_events"
    ADD CONSTRAINT "cr2_events_grant_id_fkey"
    FOREIGN KEY ("grant_id") REFERENCES "cr2_grants"("grant_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_deliveries"
    ADD CONSTRAINT "cr2_deliveries_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "cr2_events"("event_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cr2_deliveries"
    ADD CONSTRAINT "cr2_deliveries_grant_id_fkey"
    FOREIGN KEY ("grant_id") REFERENCES "cr2_grants"("grant_id")
    ON DELETE CASCADE ON UPDATE CASCADE;
