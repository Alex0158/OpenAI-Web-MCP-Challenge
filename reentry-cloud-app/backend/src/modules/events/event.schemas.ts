import { z } from "zod";

const identifier = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => Buffer.byteLength(value, "utf8") <= 160);

const eventTimestamp = z
  .string()
  .max(27)
  .refine((value) => {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
  });

const eventBodySchema = z
  .object({
    type: z.string(),
    protocol_version: z.string(),
    event_id: identifier,
    correlation_id: identifier,
    binding_id: identifier,
    issuer_origin: z.string().min(1).max(2_048),
    workflow_id: identifier,
    event_type: identifier,
    event_sequence: z.number().int().refine((value) => Number.isSafeInteger(value)),
    state_version: z.number().int().refine((value) => Number.isSafeInteger(value)),
    occurred_at: eventTimestamp,
    canonical_url: z.string().min(1).max(2_048),
  })
  .strict();

const eventHeadersSchema = z
  .object({
    "WebMCP-Reentry-Key-Id": identifier,
    "WebMCP-Reentry-Timestamp": z.string(),
    "WebMCP-Reentry-Signature": z.string(),
  })
  .strict();

export const eventEnvelopeSchema = z
  .object({
    body: z.string(),
    headers: eventHeadersSchema,
  })
  .strict();

export type EventEnvelope = z.infer<typeof eventEnvelopeSchema>;
export type ContinuationEvent = z.infer<typeof eventBodySchema>;

export { eventBodySchema };
