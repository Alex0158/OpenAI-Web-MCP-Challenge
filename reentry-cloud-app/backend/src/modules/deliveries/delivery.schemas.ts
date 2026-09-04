import { z } from "zod";

const identifier = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => Buffer.byteLength(value, "utf8") <= 160);

const opaqueToken = z
  .string()
  .min(1)
  .max(4 * 1_024)
  .refine((value) => !/[^\x21-\x7e]/.test(value));

export const deliveryAcknowledgementSchema = z
  .object({
    connector_token: opaqueToken,
    delivery_id: identifier,
    lease_token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    effect_token: opaqueToken,
  })
  .strict();

export type DeliveryAcknowledgement = z.infer<typeof deliveryAcknowledgementSchema>;
