import { z } from "zod";

const organizationName = z
  .string()
  .trim()
  .min(1, "organization name is required")
  .max(120, "organization name is too long")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 120, "organization name is too long")
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "organization name is invalid");

export const createOrganizationSchema = z
  .object({ name: organizationName })
  .strict();

export const emptyObjectSchema = z.object({}).strict();

export type CreateOrganization = z.infer<typeof createOrganizationSchema>;
