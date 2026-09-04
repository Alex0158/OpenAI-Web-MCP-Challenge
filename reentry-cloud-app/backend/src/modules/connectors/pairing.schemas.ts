import { z } from "zod";

const pairingCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-F0-9]{8}$/, "pairing code is invalid");

const deviceName = z
  .string()
  .trim()
  .min(2, "device name is invalid")
  .max(80, "device name is invalid")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 80, "device name is invalid")
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "device name is invalid");

const connectorToken = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/);

export const createPairingSessionSchema = z.object({}).strict();

export const claimPairingSessionSchema = z
  .object({
    pairing_code: pairingCode,
    device_name: deviceName,
  })
  .strict();

export const disconnectConnectorSchema = z
  .object({
    connector_token: connectorToken,
  })
  .strict();

export const deliveryClaimSchema = z
  .object({
    connector_token: z
      .string()
      .min(1)
      .max(4 * 1_024)
      .refine((value) => !/[^\x21-\x7e]/.test(value)),
    claim_token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  })
  .strict();

export type ClaimPairingSession = z.infer<typeof claimPairingSessionSchema>;
export type DisconnectConnector = z.infer<typeof disconnectConnectorSchema>;
export type DeliveryClaim = z.infer<typeof deliveryClaimSchema>;
