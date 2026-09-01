import { defineConfig } from "prisma/config";

// Prisma generate needs a syntactically valid URL even when no migration is running.
// Migrations always require DIRECT_URL to be supplied by the operator.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? "postgresql://prisma-generate-only.invalid:5432/postgres",
  },
});
