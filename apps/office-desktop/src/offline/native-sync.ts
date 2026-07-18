import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import {
  offlineOutboxOperationSchema,
  type OfflineOutboxOperation,
} from "../../../../features/office/offline-core.ts";
import { OFFICE_DESKTOP_PRODUCTION_ORIGIN } from "../../../../features/office/desktop-device-contract.ts";

export const MAX_NATIVE_SYNC_BATCH_SIZE = 25;

const isoTimestampSchema = z.string().datetime({ offset: true });
const uuidSchema = z.string().uuid();

export const devicePairingCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^AP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/, "Enter the complete pairing code.");

export const deviceCredentialStatusSchema = z.strictObject({
  connected: z.boolean(),
  protection: z.literal("windows-dpapi-current-user"),
  apiOrigin: z.string().nullable(),
  deviceId: uuidSchema.nullable(),
  deviceName: z.string().min(1).max(80).nullable(),
  expiresAt: isoTimestampSchema.nullable(),
  storedAt: z.union([isoTimestampSchema, z.string().regex(/^\d{1,20}$/)]).nullable(),
}).superRefine((status, context) => {
  const connectedFields = [status.apiOrigin, status.deviceId, status.deviceName, status.expiresAt];
  if (status.connected && connectedFields.some((value) => value === null)) {
    context.addIssue({
      code: "custom",
      message: "A connected device status is missing required metadata.",
    });
  }
});

export type DeviceCredentialStatus = z.infer<typeof deviceCredentialStatusSchema>;

const syncErrorSchema = z.strictObject({
  code: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  retryable: z.boolean(),
});

export const nativeSyncResponseSchema = z.strictObject({
  protocolVersion: z.literal(1),
  serverTime: isoTimestampSchema,
  results: z.array(z.strictObject({
    clientOperationId: uuidSchema,
    idempotencyKey: uuidSchema,
    aggregateType: z.enum(["lead", "invoice_draft", "notice_draft"]),
    aggregateId: uuidSchema,
    status: z.enum(["accepted", "duplicate", "conflict", "permission_blocked", "rejected"]),
    serverRecordId: uuidSchema.optional(),
    serverVersion: z.number().int().positive().optional(),
    error: syncErrorSchema.optional(),
  })).max(MAX_NATIVE_SYNC_BATCH_SIZE),
});

export type NativeSyncResponse = z.infer<typeof nativeSyncResponseSchema>;

export function parseDevicePairingCode(value: string): string {
  const result = devicePairingCodeSchema.safeParse(value);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The pairing code is invalid.");
  }
  return result.data;
}

export function normalizeApiOrigin(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter the HTTPS origin of the Abdullah Properties website.");
  }
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("The Office API address must be an origin without a path, credentials, query, or fragment.");
  }
  const isDebugLocalhost = import.meta.env?.DEV === true &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !isDebugLocalhost) {
    throw new Error("The Office API requires HTTPS outside local development.");
  }
  if (url.origin !== OFFICE_DESKTOP_PRODUCTION_ORIGIN && !isDebugLocalhost) {
    throw new Error("This release connects only to the verified Abdullah Properties service.");
  }
  return url.origin;
}

export function isNativeDesktopRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function assertNativeDesktopRuntime(): void {
  if (!isNativeDesktopRuntime()) {
    throw new Error("Device pairing is available only in the installed Windows application.");
  }
}

export function selectEligibleQueuedOperations(
  operations: readonly OfflineOutboxOperation[],
  limit = MAX_NATIVE_SYNC_BATCH_SIZE,
  nowMilliseconds = Date.now(),
): readonly OfflineOutboxOperation[] {
  const batchLimit = z.number().int().min(1).max(MAX_NATIVE_SYNC_BATCH_SIZE).parse(limit);
  return operations
    .filter((operation) => (
      (
        operation.state === "queued" ||
        (
          operation.state === "retry_wait" &&
          operation.nextAttemptAt !== null &&
          Date.parse(operation.nextAttemptAt) <= nowMilliseconds
        )
      ) &&
      operation.command === "create" &&
      operation.expectedServerVersion === null &&
      (
        operation.aggregateType === "lead" ||
        operation.aggregateType === "invoice_draft" ||
        operation.aggregateType === "notice_draft"
      )
    ))
    .slice(0, batchLimit)
    .map((operation) => offlineOutboxOperationSchema.parse(operation));
}

export async function getDeviceCredentialStatus(): Promise<DeviceCredentialStatus> {
  assertNativeDesktopRuntime();
  const value = await invoke<unknown>("get_device_credential_status");
  return deviceCredentialStatusSchema.parse(value);
}

export async function pairDeviceWithCode(
  apiOriginValue: string,
  pairingCodeValue: string,
): Promise<DeviceCredentialStatus> {
  assertNativeDesktopRuntime();
  const apiOrigin = normalizeApiOrigin(apiOriginValue);
  const pairingCode = parseDevicePairingCode(pairingCodeValue);
  const value = await invoke<unknown>("activate_device", {
    value: {
      apiOrigin,
      pairingCode,
    },
  });
  return deviceCredentialStatusSchema.parse(value);
}

export async function disconnectDevice(): Promise<DeviceCredentialStatus> {
  assertNativeDesktopRuntime();
  const value = await invoke<unknown>("remove_device_credential");
  return deviceCredentialStatusSchema.parse(value);
}

export async function syncQueuedOfficeOperations(): Promise<NativeSyncResponse> {
  assertNativeDesktopRuntime();
  // Rust selects and validates the canonical operations directly from SQLite.
  // The webview cannot substitute an operation payload or idempotency identity.
  const value = await invoke<unknown>("sync_office_operations");
  return nativeSyncResponseSchema.parse(value);
}
