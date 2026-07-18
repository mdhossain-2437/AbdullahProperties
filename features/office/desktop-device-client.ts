export type OfficeDesktopDeviceView = Readonly<{
  id: string;
  memberId: string;
  name: string;
  platform: "windows";
  tokenPrefix: string;
  status: "pending" | "active" | "revoked";
  expiresAt: string;
  lastSeenAt: string | null;
  createdAt: string;
  revokedAt: string | null;
  version: number;
}>;

type JsonRecord = Record<string, unknown>;

function objectValue(value: unknown, message: string): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(message);
  return value as JsonRecord;
}

function stringValue(value: unknown, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}

function timestampValue(value: unknown, message: string): string {
  const result = stringValue(value, message);
  if (!Number.isFinite(Date.parse(result))) throw new Error(message);
  return result;
}

function nullableTimestamp(value: unknown, message: string): string | null {
  return value === null ? null : timestampValue(value, message);
}

function parseDevice(value: unknown): OfficeDesktopDeviceView {
  const device = objectValue(value, "The device response is invalid.");
  const status = device.status;
  if (status !== "pending" && status !== "active" && status !== "revoked") {
    throw new Error("The device status is invalid.");
  }
  if (device.platform !== "windows") throw new Error("The device platform is invalid.");
  if (!Number.isInteger(device.version) || Number(device.version) < 1) throw new Error("The device version is invalid.");
  return {
    id: stringValue(device.id, "The device ID is invalid."),
    memberId: stringValue(device.memberId, "The member ID is invalid."),
    name: stringValue(device.name, "The device name is invalid."),
    platform: "windows",
    tokenPrefix: stringValue(device.tokenPrefix, "The token prefix is invalid."),
    status,
    expiresAt: timestampValue(device.expiresAt, "The device expiry is invalid."),
    lastSeenAt: nullableTimestamp(device.lastSeenAt, "The last-sync time is invalid."),
    createdAt: timestampValue(device.createdAt, "The device creation time is invalid."),
    revokedAt: nullableTimestamp(device.revokedAt, "The revocation time is invalid."),
    version: Number(device.version),
  };
}

function protocolEnvelope(value: unknown): JsonRecord {
  const envelope = objectValue(value, "The Office API response is invalid.");
  if (envelope.protocolVersion !== 1) throw new Error("The Office API protocol version is unsupported.");
  return envelope;
}

export function parseOfficeDesktopDevicePairResponse(value: unknown) {
  const envelope = protocolEnvelope(value);
  const activation = objectValue(envelope.activation, "The device activation response is invalid.");
  if (activation.scheme !== "OneTimeCode") throw new Error("The device activation scheme is invalid.");
  const code = stringValue(activation.code, "The one-time pairing code is missing.");
  if (!/^AP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(code)) {
    throw new Error("The one-time pairing code is invalid.");
  }
  return {
    protocolVersion: 1 as const,
    device: parseDevice(envelope.device),
    activation: {
      scheme: "OneTimeCode" as const,
      code,
      apiOrigin: stringValue(activation.apiOrigin, "The Office API origin is missing."),
      expiresAt: timestampValue(activation.expiresAt, "The pairing code expiry is invalid."),
    },
  };
}

export function parseOfficeDesktopDeviceRevokeResponse(value: unknown) {
  const envelope = protocolEnvelope(value);
  return { protocolVersion: 1 as const, device: parseDevice(envelope.device) };
}

export function parseOfficeDesktopApiError(value: unknown): Readonly<{ message: string }> | null {
  try {
    const error = objectValue(value, "");
    if (error.status !== "error") return null;
    return { message: stringValue(error.message, "") };
  } catch {
    return null;
  }
}
