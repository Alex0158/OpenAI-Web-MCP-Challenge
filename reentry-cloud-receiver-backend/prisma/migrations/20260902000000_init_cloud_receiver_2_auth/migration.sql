-- Cloud Receiver 2 keeps user and developer credentials in separate tables.
-- Separate tables intentionally allow the same email to exist once in each
-- account type without introducing roles or a shared account hierarchy.
CREATE TABLE "cr2_user_accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cr2_user_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cr2_developer_accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cr2_developer_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cr2_user_accounts_email_key" ON "cr2_user_accounts"("email");
CREATE UNIQUE INDEX "cr2_developer_accounts_email_key" ON "cr2_developer_accounts"("email");
