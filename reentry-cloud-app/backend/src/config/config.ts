import path from "node:path";
import { randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { z } from "zod";
import type { SignOptions, Secret } from "jsonwebtoken";

// The backend is commonly started from its workspace, but local secrets are
// kept in the repository root. Load both locations without overriding values
// supplied by Docker, Vercel, or the shell.
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

/**
 * Environment validation for the small Cloud Receiver 2 auth service.
 *
 * DATABASE_URL remains the generic fallback. The existing receiver uses
 * CLOUD_RECEIVER_RUNTIME_DATABASE_URL for its Supabase session-pooler URL, so
 * that name takes precedence when both are supplied.
 */

const isProduction = process.env.NODE_ENV === "production";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional()
);

const optionalPostgresUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .string()
    .refine(
      (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "must be a PostgreSQL connection URL"
    )
    .optional()
);

const envSchema = z
  .object({
    NODE_ENV: z.string().default("development"),
    PORT: z.coerce.number().int().min(0).max(65535).default(4000),

    DATABASE_URL: optionalPostgresUrl,
    CLOUD_RECEIVER_RUNTIME_DATABASE_URL: optionalPostgresUrl,
    DIRECT_URL: optionalPostgresUrl,

    JWT_SECRET: isProduction
      ? z.string().min(32, "must be at least 32 characters in production")
      : z.string().min(1).default("dev-only-insecure-jwt-secret"),

    SESSION_DAYS: z.coerce.number().int().min(1).max(30).default(7),

    FRONTEND_URL: isProduction
      ? z.string().min(1, "is required in production (CORS depends on it)")
      : z.string().default("http://localhost:3000"),

    RECEIVER_PUBLIC_URL: optionalText,

    // Set to ".example.com" in production when the frontend and API are on
    // different subdomains. Leave it unset for localhost development.
    COOKIE_DOMAIN: optionalText,

    // These names are carried forward for the eventual connector surface.
    // They are deliberately optional and unused by this auth-only slice.
    CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET: optionalText,
    CLOUD_RECEIVER_VERIFICATION_ORIGIN: optionalText,
    CLOUD_RECEIVER_GRANT_CONTROL_TOKEN: optionalText,
  })
  .superRefine((value, context) => {
    if (!value.CLOUD_RECEIVER_RUNTIME_DATABASE_URL && !value.DATABASE_URL) {
      context.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "DATABASE_URL or CLOUD_RECEIVER_RUNTIME_DATABASE_URL is required",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;
const databaseUrl = env.CLOUD_RECEIVER_RUNTIME_DATABASE_URL ?? env.DATABASE_URL;

if (!databaseUrl) {
  // The superRefine above produces the user-facing validation error. This is
  // only a type-narrowing guard for the exported config object.
  process.exit(1);
}

const sessionTtlMs = env.SESSION_DAYS * 24 * 60 * 60 * 1000;

export const appConfig = {
  nodeEnv: env.NODE_ENV,
  isProduction,
  port: env.PORT,
  databaseUrl,
  jwtSecret: env.JWT_SECRET as Secret,
  sessionTtlMs,
  // jsonwebtoken accepts a number of SECONDS for expiresIn.
  jwtExpiresIn: (sessionTtlMs / 1000) as SignOptions["expiresIn"],
  frontendUrl: env.FRONTEND_URL,
  cookieDomain: env.COOKIE_DOMAIN,
  receiverPublicUrl: env.RECEIVER_PUBLIC_URL ?? `http://localhost:${env.PORT}`,
  // Production must configure this private authority explicitly. Tests get a
  // process-local value so the internal revocation seam is usable without
  // placing a credential in the repository or test output.
  grantControlToken:
    env.CLOUD_RECEIVER_GRANT_CONTROL_TOKEN ??
    (!isProduction ? randomBytes(32).toString("base64url") : undefined),
};
