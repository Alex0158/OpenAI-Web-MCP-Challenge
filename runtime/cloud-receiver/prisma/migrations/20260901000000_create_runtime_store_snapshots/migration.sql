-- CreateTable
CREATE TABLE "reentry_runtime_store_snapshots" (
    "store_name" TEXT NOT NULL,
    "payload" BYTEA NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reentry_runtime_store_snapshots_pkey" PRIMARY KEY ("store_name")
);
