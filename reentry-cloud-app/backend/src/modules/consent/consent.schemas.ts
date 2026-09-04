import { z } from "zod";

const identifier = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);

const origin = z.string().trim().min(1).max(512);

export const registerHostKeySchema = z
  .object({
    host_id: identifier,
    issuer_origin: origin,
    key_id: identifier,
    public_key_pem: z.string().min(1).max(16_384),
  })
  .strict();

export const createConsentSessionSchema = z
  .object({
    host_subject_ref: z
      .string()
      .trim()
      .min(1)
      .max(512)
      .refine((value) => !/[\u0000-\u001f\u007f]/.test(value)),
    expected_origin: origin,
    manifest: z.unknown(),
  })
  .strict();

const consentToken = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const accountConsentDecisionSchema = z.discriminatedUnion("action", [
  z
    .object({
      consent_token: consentToken,
      action: z.literal("approve"),
      connector_id: identifier,
    })
    .strict(),
  z
    .object({
      consent_token: consentToken,
      action: z.literal("decline"),
    })
    .strict(),
]);

export type RegisterHostKey = z.infer<typeof registerHostKeySchema>;
export type CreateConsentSession = z.infer<typeof createConsentSessionSchema>;
export type AccountConsentDecision = z.infer<typeof accountConsentDecisionSchema>;
