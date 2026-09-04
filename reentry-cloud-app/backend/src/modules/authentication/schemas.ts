import { z } from "zod";

const makeCredentialsSchema = () =>
  z
    .object({
      email: z.string().trim().toLowerCase().email("must be a valid email address"),
      password: z
        .string()
        .min(8, "must be at least 8 characters")
        .max(72, "must be at most 72 characters"),
    })
    .strict();

// Separate exports keep the two account entry points explicit even though
// their first credential contract is intentionally the same.
export const userCredentialsSchema = makeCredentialsSchema();
export const developerCredentialsSchema = makeCredentialsSchema();

export type UserCredentials = z.infer<typeof userCredentialsSchema>;
export type DeveloperCredentials = z.infer<typeof developerCredentialsSchema>;
