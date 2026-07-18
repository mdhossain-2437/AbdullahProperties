import { z } from "zod";

export const OFFICE_DESKTOP_PROTOCOL_VERSION = 1 as const;
export const OFFICE_DESKTOP_PRODUCTION_ORIGIN =
  "https://abdullah-properties-joypurhat.delowarhossain-dev.chatgpt.site" as const;

const uuidSchema = z.string().uuid();
const isoTimestampSchema = z.string().datetime({ offset: true });

export const officeDesktopDeviceCreateSchema = z.strictObject({
  name: z.string().trim().min(2).max(80),
  platform: z.literal("windows"),
});

export const officeDesktopDeviceViewSchema = z.strictObject({
  id: uuidSchema,
  memberId: uuidSchema,
  name: z.string().min(1).max(80),
  platform: z.literal("windows"),
  tokenPrefix: z.string().min(8).max(20),
  status: z.enum(["pending", "active", "revoked"]),
  expiresAt: isoTimestampSchema,
  lastSeenAt: isoTimestampSchema.nullable(),
  createdAt: isoTimestampSchema,
  revokedAt: isoTimestampSchema.nullable(),
  version: z.number().int().positive(),
});

export type OfficeDesktopDeviceView = z.infer<typeof officeDesktopDeviceViewSchema>;

export const officeDesktopDevicePairResponseSchema = z.strictObject({
  protocolVersion: z.literal(OFFICE_DESKTOP_PROTOCOL_VERSION),
  device: officeDesktopDeviceViewSchema,
  activation: z.strictObject({
    scheme: z.literal("OneTimeCode"),
    code: z.string().regex(/^AP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/),
    apiOrigin: z.string().url(),
    expiresAt: isoTimestampSchema,
  }),
});

export const officeDesktopDeviceActivateSchema = z.strictObject({
  code: z.string().trim().toUpperCase().regex(
    /^AP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/,
    "Enter the complete one-time pairing code.",
  ),
  platform: z.literal("windows"),
});

export const officeDesktopDeviceActivateResponseSchema = z.strictObject({
  protocolVersion: z.literal(OFFICE_DESKTOP_PROTOCOL_VERSION),
  device: officeDesktopDeviceViewSchema.extend({ status: z.literal("active") }),
  credential: z.strictObject({
    scheme: z.literal("Bearer"),
    token: z.string(),
    expiresAt: isoTimestampSchema,
  }),
});

export const officeDesktopDeviceListResponseSchema = z.strictObject({
  protocolVersion: z.literal(OFFICE_DESKTOP_PROTOCOL_VERSION),
  devices: z.array(officeDesktopDeviceViewSchema).max(100),
});

export const officeDesktopDeviceRevokeResponseSchema = z.strictObject({
  protocolVersion: z.literal(OFFICE_DESKTOP_PROTOCOL_VERSION),
  device: officeDesktopDeviceViewSchema,
});

export const officeDesktopApiErrorSchema = z.strictObject({
  status: z.literal("error"),
  code: z.string(),
  message: z.string(),
});
