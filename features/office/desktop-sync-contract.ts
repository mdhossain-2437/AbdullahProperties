import { z } from "zod";
import {
  offlineOutboxOperationSchema,
  type JsonObject,
  type JsonValue,
  type OfflineOutboxOperation,
} from "./offline-core.ts";
import { OFFICE_DESKTOP_PROTOCOL_VERSION } from "./desktop-device-contract.ts";

export {
  OFFICE_DESKTOP_PROTOCOL_VERSION,
  officeDesktopApiErrorSchema,
  officeDesktopDeviceActivateResponseSchema,
  officeDesktopDeviceActivateSchema,
  officeDesktopDeviceCreateSchema,
  officeDesktopDeviceListResponseSchema,
  officeDesktopDevicePairResponseSchema,
  officeDesktopDeviceRevokeResponseSchema,
  officeDesktopDeviceViewSchema,
} from "./desktop-device-contract.ts";
export type { OfficeDesktopDeviceView } from "./desktop-device-contract.ts";

export const OFFICE_DESKTOP_MAX_REQUEST_BYTES = 256 * 1024;
export const OFFICE_DESKTOP_MAX_OPERATIONS = 25;
export const OFFICE_DESKTOP_REQUESTS_PER_MINUTE = 60;
export const OFFICE_DESKTOP_CREDENTIAL_LIFETIME_DAYS = 30;
export const OFFICE_DESKTOP_ACTIVATION_LIFETIME_MINUTES = 10;
export const OFFICE_DESKTOP_ACTIVATION_MAX_ATTEMPTS = 5;

const uuidSchema = z.string().uuid();
const isoTimestampSchema = z.string().datetime({ offset: true });
const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date in YYYY-MM-DD format.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }, "Use a real calendar date.");
const optionalEmailSchema = z.union([z.literal(""), z.string().email().max(160)]);
const optionalPhoneSchema = z
  .string()
  .max(32)
  .refine(
    (value) => value === "" || /^\+?[0-9][0-9\s-]{7,30}$/.test(value),
    "Enter a valid phone number.",
  );

export const officeDesktopSyncRequestSchema = z.strictObject({
  protocolVersion: z.literal(OFFICE_DESKTOP_PROTOCOL_VERSION),
  operations: z
    .array(offlineOutboxOperationSchema)
    .min(1)
    .max(OFFICE_DESKTOP_MAX_OPERATIONS),
});

export const officeDesktopSyncResultStatusSchema = z.enum([
  "accepted",
  "duplicate",
  "conflict",
  "permission_blocked",
  "rejected",
]);

export const officeDesktopSyncResultSchema = z.strictObject({
  clientOperationId: uuidSchema,
  idempotencyKey: uuidSchema,
  aggregateType: z.enum([
    "contact",
    "lead",
    "invoice_draft",
    "payment_acknowledgement",
    "notice_draft",
  ]),
  aggregateId: uuidSchema,
  status: officeDesktopSyncResultStatusSchema,
  serverRecordId: uuidSchema.optional(),
  serverVersion: z.number().int().positive().optional(),
  error: z
    .strictObject({
      code: z.string().min(1).max(80),
      message: z.string().min(1).max(500),
      retryable: z.boolean(),
    })
    .optional(),
});

export type OfficeDesktopSyncResult = z.infer<typeof officeDesktopSyncResultSchema>;

export type DesktopSyncReceiptIdentity = Readonly<{
  aggregateId: string;
  aggregateType: SafeDesktopDraftType;
  clientOperationId: string;
  idempotencyKey: string;
  operationHash: string;
}>;

export function classifyDesktopSyncReplay(
  operation: OfflineOutboxOperation,
  operationHash: string,
  existing: DesktopSyncReceiptIdentity,
): "duplicate" | "conflict" {
  return existing.aggregateId === operation.aggregateId &&
    existing.aggregateType === operation.aggregateType &&
    existing.clientOperationId === operation.clientOperationId &&
    existing.idempotencyKey === operation.idempotencyKey &&
    existing.operationHash === operationHash
    ? "duplicate"
    : "conflict";
}

export const officeDesktopSyncResponseSchema = z.strictObject({
  protocolVersion: z.literal(OFFICE_DESKTOP_PROTOCOL_VERSION),
  serverTime: isoTimestampSchema,
  results: z.array(officeDesktopSyncResultSchema).max(OFFICE_DESKTOP_MAX_OPERATIONS),
});

export const officeDesktopLeadPayloadSchema = z.strictObject({
  customerName: z.string().trim().min(2).max(100),
  phone: optionalPhoneSchema,
  interest: z.string().trim().min(3).max(160),
  location: z.string().trim().max(120),
  followUpDate: z.union([z.literal(""), localDateSchema]),
  priority: z.enum(["normal", "high"]),
  notes: z.string().max(1_000),
});

export const officeDesktopInvoiceDraftPayloadSchema = z
  .strictObject({
    customerName: z.string().trim().min(2).max(100),
    phone: optionalPhoneSchema,
    email: optionalEmailSchema,
    purpose: z.string().trim().min(3).max(160),
    amountMinor: z.number().int().positive().safe(),
    currency: z.literal("BDT"),
    issueDate: localDateSchema,
    dueDate: localDateSchema,
    locale: z.enum(["en", "bn"]),
    notes: z.string().max(1_000),
  })
  .superRefine((value, context) => {
    if (value.dueDate < value.issueDate) {
      context.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date cannot be earlier than issue date.",
      });
    }
  });

export const officeDesktopNoticeDraftPayloadSchema = z.strictObject({
  recipientName: z.string().trim().min(2).max(100),
  phone: optionalPhoneSchema,
  email: optionalEmailSchema,
  subject: z.string().trim().min(3).max(180),
  body: z.string().trim().min(10).max(4_000),
  effectiveDate: localDateSchema,
  locale: z.enum(["en", "bn"]),
});

export const safeDesktopDraftTypes = ["lead", "invoice_draft", "notice_draft"] as const;
export type SafeDesktopDraftType = (typeof safeDesktopDraftTypes)[number];

export function parseSafeDesktopDraftPayload(
  operation: OfflineOutboxOperation,
): Readonly<{ aggregateType: SafeDesktopDraftType; payload: JsonObject }> {
  switch (operation.aggregateType) {
    case "lead":
      return { aggregateType: operation.aggregateType, payload: officeDesktopLeadPayloadSchema.parse(operation.payload) };
    case "invoice_draft":
      return {
        aggregateType: operation.aggregateType,
        payload: officeDesktopInvoiceDraftPayloadSchema.parse(operation.payload),
      };
    case "notice_draft":
      return {
        aggregateType: operation.aggregateType,
        payload: officeDesktopNoticeDraftPayloadSchema.parse(operation.payload),
      };
    case "payment_acknowledgement":
      throw new DesktopSyncCapabilityError(
        "financial_posting_disabled",
        "Payment acknowledgement sync is disabled until payments.post and optimistic balance checks are enforced server-side.",
        "permission_blocked",
      );
    case "contact":
      throw new DesktopSyncCapabilityError(
        "aggregate_not_supported",
        "Contact sync is not enabled by desktop protocol v1.",
        "rejected",
      );
  }
}

export class DesktopSyncCapabilityError extends Error {
  readonly retryable = false;
  readonly code: string;
  readonly resultStatus: "permission_blocked" | "rejected" | "conflict";

  constructor(
    code: string,
    message: string,
    resultStatus: "permission_blocked" | "rejected" | "conflict",
  ) {
    super(message);
    this.name = "DesktopSyncCapabilityError";
    this.code = code;
    this.resultStatus = resultStatus;
  }
}

export function assertDesktopOperationCanSync(operation: OfflineOutboxOperation): void {
  if (operation.command !== "create") {
    throw new DesktopSyncCapabilityError(
      "command_not_supported",
      "Desktop protocol v1 accepts create commands only.",
      "rejected",
    );
  }
  if (operation.state !== "queued" && operation.state !== "syncing") {
    throw new DesktopSyncCapabilityError(
      "operation_state_invalid",
      "Only queued or actively leased operations may be submitted.",
      "rejected",
    );
  }
  if (operation.expectedServerVersion !== null) {
    throw new DesktopSyncCapabilityError(
      "unexpected_server_version",
      "Create commands cannot carry an existing server version.",
      "conflict",
    );
  }
  parseSafeDesktopDraftPayload(operation);
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export const officeDesktopBearerCredentialSchema = z
  .string()
  .regex(/^apd_v1_[A-Za-z0-9_-]{43}$/, "The desktop credential is malformed.");

export function formatDesktopDeviceCredential(entropy: Uint8Array): string {
  if (entropy.byteLength !== 32) throw new RangeError("Desktop credentials require 256 bits of entropy.");
  return officeDesktopBearerCredentialSchema.parse(`apd_v1_${base64Url(entropy)}`);
}

export function createDesktopDeviceCredential(): string {
  const entropy = new Uint8Array(32);
  crypto.getRandomValues(entropy);
  return formatDesktopDeviceCredential(entropy);
}

const pairingAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createDesktopPairingCode(): string {
  const entropy = new Uint8Array(8);
  crypto.getRandomValues(entropy);
  const value = Array.from(entropy, (byte) => pairingAlphabet[byte % pairingAlphabet.length]).join("");
  return `AP-${value.slice(0, 4)}-${value.slice(4)}`;
}

export async function hashDesktopPairingCode(code: string): Promise<string> {
  const normalized = code.trim().toUpperCase();
  if (!/^AP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(normalized)) {
    throw new TypeError("The desktop pairing code is malformed.");
  }
  return sha256(normalized);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export async function hashDesktopDeviceCredential(credential: string): Promise<string> {
  return sha256(officeDesktopBearerCredentialSchema.parse(credential));
}

function canonicalJson(value: JsonValue): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const object = value as JsonObject;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(",")}}`;
}

export async function hashDesktopSyncOperation(operation: OfflineOutboxOperation): Promise<string> {
  const normalized = offlineOutboxOperationSchema.parse(operation);
  return sha256(
    canonicalJson({
      schemaVersion: normalized.schemaVersion,
      clientOperationId: normalized.clientOperationId,
      idempotencyKey: normalized.idempotencyKey,
      draftId: normalized.draftId,
      draftLocalRevision: normalized.draftLocalRevision,
      aggregateType: normalized.aggregateType,
      aggregateId: normalized.aggregateId,
      command: normalized.command,
      payload: normalized.payload,
      expectedServerVersion: normalized.expectedServerVersion,
      createdAt: normalized.createdAt,
    }),
  );
}

export function readBearerCredential(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;
  const match = /^Bearer ([^\s]+)$/.exec(authorization);
  if (!match) return null;
  const parsed = officeDesktopBearerCredentialSchema.safeParse(match[1]);
  return parsed.success ? parsed.data : null;
}

export class DesktopApiRequestError extends Error {
  readonly status: 400 | 413 | 415;

  constructor(status: 400 | 413 | 415, message: string) {
    super(message);
    this.name = "DesktopApiRequestError";
    this.status = status;
  }
}

export async function readBoundedJson(request: Request, maximumBytes: number): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new DesktopApiRequestError(415, "This endpoint requires application/json.");
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    throw new DesktopApiRequestError(413, "The request body is too large.");
  }

  if (!request.body) throw new DesktopApiRequestError(400, "The JSON request body is missing.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      byteLength += result.value.byteLength;
      if (byteLength > maximumBytes) {
        await reader.cancel();
        throw new DesktopApiRequestError(413, "The request body is too large.");
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new DesktopApiRequestError(400, "The JSON request body is invalid.");
  }
}

export const desktopPrivateResponseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; sandbox",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

export function desktopJsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(body, {
    status,
    headers: { ...desktopPrivateResponseHeaders, ...headers },
  });
}
