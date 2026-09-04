import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI runs from the backend workspace, while local secrets are kept at
// the repository root. Existing shell, Docker, or Vercel values win because
// dotenv does not override values that are already present.
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => typeof value === "string" && value.trim().length > 0);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Generation can run without a live database. Deployments should provide
    // the migration URL, while the runtime prefers the old Cloud Receiver
    // session-pooler variable.
    url:
      firstNonEmpty(
        process.env.DIRECT_URL,
        process.env.CLOUD_RECEIVER_RUNTIME_DATABASE_URL,
        process.env.DATABASE_URL
      ) ?? "postgresql://prisma-generate-only.invalid:5432/postgres",
  },
});
