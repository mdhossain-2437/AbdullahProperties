import { z } from "zod";
import { getD1 } from "@/db";
import type { AuthorizedOfficeActor } from "@/features/office/auth";
import type { OfflineOutboxOperation } from "@/features/office/offline-core";
import { hasOfficePermission, type OfficePermission } from "@/features/office/permissions";
import { officeRoleSchema, type OfficeRole } from "@/features/office/types";
import {
  OFFICE_DESKTOP_CREDENTIAL_LIFETIME_DAYS,
  OFFICE_DESKTOP_ACTIVATION_LIFETIME_MINUTES,
  OFFICE_DESKTOP_ACTIVATION_MAX_ATTEMPTS,
  OFFICE_DESKTOP_REQUESTS_PER_MINUTE,
  assertDesktopOperationCanSync,
  classifyDesktopSyncReplay,
  createDesktopDeviceCredential,
  createDesktopPairingCode,
  DesktopSyncCapabilityError,
  hashDesktopDeviceCredential,
  hashDesktopPairingCode,
  hashDesktopSyncOperation,
  officeDesktopDeviceViewSchema,
  parseSafeDesktopDraftPayload,
  type OfficeDesktopDeviceView,
  type OfficeDesktopSyncResult,
  type SafeDesktopDraftType,
} from "@/features/office/desktop-sync-contract";

type DesktopDeviceRow = {
  id: string;
  member_id: string;
  name: string;
  platform: "windows";
  token_prefix: string;
  status: "pending" | "active" | "revoked";
  expires_at: string;
  last_seen_at: string | null;
  created_at: string;
  revoked_at: string | null;
  version: number;
};

type DesktopCredentialRow = DesktopDeviceRow & {
  member_email: string;
  member_display_name: string;
  member_role: string;
  member_status: string;
};

type DesktopPairingRow = DesktopDeviceRow & {
  code_hash: string;
  activation_expires_at: string;
  attempt_count: number;
  consumed_at: string | null;
};

type ExistingDraftRow = {
  aggregate_id: string;
  aggregate_type: SafeDesktopDraftType;
  client_operation_id: string;
  idempotency_key: string;
  operation_hash: string;
  server_version: number;
};

const DEVICE_SELECT = `SELECT id, member_id, name, platform, token_prefix, status, expires_at,
  last_seen_at, created_at, revoked_at, version
FROM office_desktop_devices`;

export type AuthorizedDesktopDevice = Readonly<{
  device: OfficeDesktopDeviceView;
  member: Readonly<{
    id: string;
    email: string;
    displayName: string;
    role: OfficeRole;
  }>;
}>;

export type OfficeDesktopInboxDraft = Readonly<{
  aggregateId: string;
  aggregateType: SafeDesktopDraftType;
  payload: Readonly<Record<string, unknown>>;
  status: "received" | "materialized" | "rejected";
  serverVersion: number;
  sourceDeviceId: string;
  sourceDeviceName: string;
  createdByMemberId: string;
  createdByName: string;
  createdByEmail: string;
  clientCreatedAt: string;
  acceptedAt: string;
  materializedEntityType: string | null;
  materializedEntityId: string | null;
  reviewedAt: string | null;
}>;

export class OfficeDesktopRepositoryError extends Error {
  constructor(
    readonly code:
      | "active_membership_required"
      | "device_limit_reached"
      | "device_not_found"
      | "device_revoke_forbidden"
      | "activation_invalid"
      | "rate_limited"
      | "storage_unavailable",
    message: string,
  ) {
    super(message);
    this.name = "OfficeDesktopRepositoryError";
  }
}

function deviceFromRow(row: DesktopDeviceRow): OfficeDesktopDeviceView {
  return officeDesktopDeviceViewSchema.parse({
    id: row.id,
    memberId: row.member_id,
    name: row.name,
    platform: row.platform,
    tokenPrefix: row.token_prefix,
    status: row.status,
    expiresAt: row.expires_at,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
    version: row.version,
  });
}

function normalizeActorEmail(email: string): string {
  return z.string().trim().email().max(320).parse(email).toLowerCase();
}

function expiryFrom(now: Date): string {
  return new Date(
    now.valueOf() + OFFICE_DESKTOP_CREDENTIAL_LIFETIME_DAYS * 24 * 60 * 60 * 1_000,
  ).toISOString();
}

function activationExpiryFrom(now: Date): string {
  return new Date(
    now.valueOf() + OFFICE_DESKTOP_ACTIVATION_LIFETIME_MINUTES * 60 * 1_000,
  ).toISOString();
}

export async function createOfficeDesktopDevice(
  input: Readonly<{ name: string; platform: "windows" }>,
  actor: AuthorizedOfficeActor,
  now = new Date(),
): Promise<Readonly<{
  device: OfficeDesktopDeviceView;
  activationCode: string;
  activationExpiresAt: string;
}>> {
  if (!actor.memberId || actor.source !== "membership") {
    throw new OfficeDesktopRepositoryError(
      "active_membership_required",
      "Activate an Office membership before pairing a desktop device.",
    );
  }

  const database = await getD1();
  const countRow = await database
    .prepare(
      "SELECT COUNT(*) AS count FROM office_desktop_devices WHERE member_id = ? AND status IN ('pending', 'active') AND expires_at > ?",
    )
    .bind(actor.memberId, now.toISOString())
    .first<{ count: number }>();
  if ((countRow?.count ?? 0) >= 10) {
    throw new OfficeDesktopRepositoryError(
      "device_limit_reached",
      "Revoke an unused device before pairing another one.",
    );
  }

  const id = crypto.randomUUID();
  const activationCode = createDesktopPairingCode();
  const codeHash = await hashDesktopPairingCode(activationCode);
  const tokenHash = `pending:${id}`;
  const tokenPrefix = "pending";
  const createdAt = now.toISOString();
  const expiresAt = expiryFrom(now);
  const activationExpiresAt = activationExpiryFrom(now);
  const email = normalizeActorEmail(actor.email);
  const auditId = crypto.randomUUID();

  await database.batch([
    database
      .prepare(
        `INSERT INTO office_desktop_devices
          (id, member_id, name, platform, token_hash, token_prefix, status, expires_at,
           last_seen_at, created_at, revoked_at, revoked_by_email, version)
         VALUES (?, ?, ?, 'windows', ?, ?, 'pending', ?, NULL, ?, NULL, NULL, 1)`,
      )
      .bind(id, actor.memberId, input.name.trim(), tokenHash, tokenPrefix, expiresAt, createdAt),
    database
      .prepare(
        `INSERT INTO office_desktop_pairing_codes
          (device_id, code_hash, expires_at, attempt_count, consumed_at, created_at)
         VALUES (?, ?, ?, 0, NULL, ?)`,
      )
      .bind(id, codeHash, activationExpiresAt, createdAt),
    database
      .prepare(
        `INSERT INTO office_audit_events
          (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata,
           request_id, ip_hash, created_at)
         VALUES (?, ?, ?, 'desktop_device.pairing_started', 'desktop_device', ?, ?, NULL, NULL, ?)`,
      )
      .bind(
        auditId,
        actor.memberId,
        email,
        id,
        JSON.stringify({
          name: input.name.trim(),
          platform: input.platform,
          activationExpiresAt,
          credentialLifetimeDays: OFFICE_DESKTOP_CREDENTIAL_LIFETIME_DAYS,
        }),
        createdAt,
      ),
  ]);

  const row = await database
    .prepare(`${DEVICE_SELECT} WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<DesktopDeviceRow>();
  if (!row) throw new Error("The pending desktop device could not be read.");
  return { device: deviceFromRow(row), activationCode, activationExpiresAt };
}

export async function activateOfficeDesktopDevice(
  input: Readonly<{ code: string; platform: "windows" }>,
  now = new Date(),
): Promise<Readonly<{ device: OfficeDesktopDeviceView; credential: string }>> {
  const codeHash = await hashDesktopPairingCode(input.code);
  const database = await getD1();
  const current = await database
    .prepare(
      `SELECT device.id, device.member_id, device.name, device.platform, device.token_prefix,
              device.status, device.expires_at, device.last_seen_at, device.created_at,
              device.revoked_at, device.version, pairing.code_hash,
              pairing.expires_at AS activation_expires_at, pairing.attempt_count,
              pairing.consumed_at
       FROM office_desktop_pairing_codes pairing
       INNER JOIN office_desktop_devices device ON device.id = pairing.device_id
       WHERE pairing.code_hash = ? LIMIT 1`,
    )
    .bind(codeHash)
    .first<DesktopPairingRow>();
  const timestamp = now.toISOString();
  if (
    !current ||
    current.platform !== input.platform ||
    current.status !== "pending" ||
    current.consumed_at !== null ||
    current.activation_expires_at <= timestamp ||
    current.attempt_count >= OFFICE_DESKTOP_ACTIVATION_MAX_ATTEMPTS
  ) {
    throw new OfficeDesktopRepositoryError(
      "activation_invalid",
      "The pairing code is invalid, expired, or already used.",
    );
  }

  const credential = createDesktopDeviceCredential();
  const tokenHash = await hashDesktopDeviceCredential(credential);
  const tokenPrefix = credential.slice(0, 15);
  const expiresAt = expiryFrom(now);
  const nextVersion = current.version + 1;
  const results = await database.batch([
    database
      .prepare(
        `UPDATE office_desktop_pairing_codes
         SET consumed_at = ?, attempt_count = attempt_count + 1
         WHERE device_id = ? AND code_hash = ? AND consumed_at IS NULL
           AND expires_at > ? AND attempt_count < ?`,
      )
      .bind(
        timestamp,
        current.id,
        codeHash,
        timestamp,
        OFFICE_DESKTOP_ACTIVATION_MAX_ATTEMPTS,
      ),
    database
      .prepare(
        `UPDATE office_desktop_devices
         SET token_hash = ?, token_prefix = ?, status = 'active', expires_at = ?, version = ?
         WHERE id = ? AND status = 'pending' AND version = ?`,
      )
      .bind(tokenHash, tokenPrefix, expiresAt, nextVersion, current.id, current.version),
    database
      .prepare(
        `INSERT INTO office_audit_events
          (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata,
           request_id, ip_hash, created_at)
         SELECT ?, member.id, member.email, 'desktop_device.activated', 'desktop_device',
                device.id, json_object('platform', device.platform, 'expiresAt', device.expires_at),
                NULL, NULL, ?
         FROM office_desktop_devices device
         INNER JOIN office_members member ON member.id = device.member_id
         WHERE device.id = ? AND device.status = 'active' AND device.version = ?`,
      )
      .bind(crypto.randomUUID(), timestamp, current.id, nextVersion),
  ]);
  if (results.some((result) => result.meta.changes !== 1)) {
    throw new OfficeDesktopRepositoryError(
      "activation_invalid",
      "The pairing code changed before activation completed. Generate a new code.",
    );
  }

  const activated = await database
    .prepare(`${DEVICE_SELECT} WHERE id = ? LIMIT 1`)
    .bind(current.id)
    .first<DesktopDeviceRow>();
  if (!activated || activated.status !== "active") {
    throw new Error("The activated desktop device could not be read.");
  }
  return { device: deviceFromRow(activated), credential };
}

export async function listOfficeDesktopDevices(memberId: string): Promise<OfficeDesktopDeviceView[]> {
  const parsedMemberId = z.string().uuid().parse(memberId);
  const result = await (await getD1())
    .prepare(`${DEVICE_SELECT} WHERE member_id = ? ORDER BY created_at DESC, id DESC`)
    .bind(parsedMemberId)
    .all<DesktopDeviceRow>();
  return result.results.map(deviceFromRow);
}

export async function listOfficeDesktopInboxDrafts(
  limit = 100,
): Promise<OfficeDesktopInboxDraft[]> {
  const boundedLimit = z.number().int().min(1).max(200).parse(limit);
  const result = await (await getD1())
    .prepare(
      `SELECT draft.aggregate_id, draft.aggregate_type, draft.payload, draft.status,
              draft.server_version, draft.source_device_id, device.name AS source_device_name,
              draft.created_by_member_id, member.display_name AS created_by_name,
              draft.created_by_email, draft.client_created_at, draft.accepted_at,
              draft.materialized_entity_type, draft.materialized_entity_id, draft.reviewed_at
       FROM office_desktop_drafts draft
       INNER JOIN office_desktop_devices device ON device.id = draft.source_device_id
       INNER JOIN office_members member ON member.id = draft.created_by_member_id
       ORDER BY draft.accepted_at DESC, draft.aggregate_id DESC
       LIMIT ?`,
    )
    .bind(boundedLimit)
    .all<{
      aggregate_id: string;
      aggregate_type: SafeDesktopDraftType;
      payload: string;
      status: "received" | "materialized" | "rejected";
      server_version: number;
      source_device_id: string;
      source_device_name: string;
      created_by_member_id: string;
      created_by_name: string;
      created_by_email: string;
      client_created_at: string;
      accepted_at: string;
      materialized_entity_type: string | null;
      materialized_entity_id: string | null;
      reviewed_at: string | null;
    }>();
  return result.results.map((row) => ({
    aggregateId: row.aggregate_id,
    aggregateType: row.aggregate_type,
    payload: z.record(z.string(), z.unknown()).parse(JSON.parse(row.payload)),
    status: row.status,
    serverVersion: row.server_version,
    sourceDeviceId: row.source_device_id,
    sourceDeviceName: row.source_device_name,
    createdByMemberId: row.created_by_member_id,
    createdByName: row.created_by_name,
    createdByEmail: row.created_by_email,
    clientCreatedAt: row.client_created_at,
    acceptedAt: row.accepted_at,
    materializedEntityType: row.materialized_entity_type,
    materializedEntityId: row.materialized_entity_id,
    reviewedAt: row.reviewed_at,
  }));
}

export async function revokeOfficeDesktopDevice(
  deviceId: string,
  actor: AuthorizedOfficeActor,
  now = new Date(),
): Promise<OfficeDesktopDeviceView> {
  const id = z.string().uuid().parse(deviceId);
  const database = await getD1();
  const current = await database
    .prepare(`${DEVICE_SELECT} WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<DesktopDeviceRow>();
  if (!current) {
    throw new OfficeDesktopRepositoryError("device_not_found", "The desktop device was not found.");
  }
  if (current.member_id !== actor.memberId && !hasOfficePermission(actor.role, "settings.manage")) {
    throw new OfficeDesktopRepositoryError(
      "device_revoke_forbidden",
      "You cannot revoke another member's device.",
    );
  }

  if (current.status === "revoked") return deviceFromRow(current);
  const revokedAt = now.toISOString();
  const nextVersion = current.version + 1;
  const email = normalizeActorEmail(actor.email);
  const results = await database.batch([
    database
      .prepare(
        `UPDATE office_desktop_devices
         SET status = 'revoked', revoked_at = ?, revoked_by_email = ?, version = ?
         WHERE id = ? AND status IN ('pending', 'active') AND version = ?`,
      )
      .bind(revokedAt, email, nextVersion, id, current.version),
    database
      .prepare(
        `INSERT INTO office_audit_events
          (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata,
           request_id, ip_hash, created_at)
         SELECT ?, ?, ?, 'desktop_device.revoked', 'desktop_device', id,
                 json_object('previousStatus', ?, 'version', ?), NULL, NULL, ?
         FROM office_desktop_devices WHERE id = ? AND status = 'revoked' AND version = ?`,
      )
      .bind(
        crypto.randomUUID(),
        actor.memberId,
        email,
        current.status,
        nextVersion,
        revokedAt,
        id,
        nextVersion,
      ),
  ]);
  if (results[0].meta.changes !== 1 || results[1].meta.changes !== 1) {
    throw new Error("The device changed before revocation completed.");
  }
  const revoked = await database
    .prepare(`${DEVICE_SELECT} WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<DesktopDeviceRow>();
  if (!revoked) throw new Error("The revoked desktop device could not be read.");
  return deviceFromRow(revoked);
}

export async function authenticateOfficeDesktopCredential(
  credential: string,
  now = new Date(),
): Promise<AuthorizedDesktopDevice | null> {
  const tokenHash = await hashDesktopDeviceCredential(credential);
  const row = await (await getD1())
    .prepare(
      `SELECT device.id, device.member_id, device.name, device.platform, device.token_prefix,
              device.status, device.expires_at, device.last_seen_at, device.created_at,
              device.revoked_at, device.version, member.email AS member_email,
              member.display_name AS member_display_name, member.role AS member_role,
              member.status AS member_status
       FROM office_desktop_devices device
       INNER JOIN office_members member ON member.id = device.member_id
       WHERE device.token_hash = ? LIMIT 1`,
    )
    .bind(tokenHash)
    .first<DesktopCredentialRow>();
  if (
    !row ||
    row.status !== "active" ||
    row.member_status !== "active" ||
    row.expires_at <= now.toISOString()
  ) {
    return null;
  }

  return {
    device: deviceFromRow(row),
    member: {
      id: row.member_id,
      email: normalizeActorEmail(row.member_email),
      displayName: row.member_display_name,
      role: officeRoleSchema.parse(row.member_role),
    },
  };
}

function rateLimitWindow(now: Date): string {
  const value = new Date(now);
  value.setUTCSeconds(0, 0);
  return value.toISOString();
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function consumeOfficeDesktopIngressRateLimit(
  request: Request,
  credential: string,
  now = new Date(),
): Promise<Readonly<{ allowed: boolean; retryAfterSeconds: number }>> {
  const database = await getD1();
  const windowStartedAt = rateLimitWindow(now);
  const updatedAt = now.toISOString();
  const networkIdentity = request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim()
    || "unavailable";
  const identities = [
    {
      kind: "network" as const,
      hash: await sha256Hex(`abdullah-office-ingress-v1:network:${networkIdentity}`),
      limit: 180,
    },
    {
      kind: "credential_prefix" as const,
      hash: await sha256Hex(`abdullah-office-ingress-v1:credential:${credential.slice(0, 15)}`),
      limit: 90,
    },
  ];
  let allowed = true;
  for (const identity of identities) {
    const id = `${identity.hash}:${windowStartedAt}`;
    await database
      .prepare(
        `INSERT INTO office_desktop_ingress_rate_limits
          (id, identity_hash, kind, window_started_at, request_count, updated_at)
         VALUES (?, ?, ?, ?, 1, ?)
         ON CONFLICT(identity_hash, window_started_at)
         DO UPDATE SET request_count = request_count + 1, updated_at = excluded.updated_at`,
      )
      .bind(id, identity.hash, identity.kind, windowStartedAt, updatedAt)
      .run();
    const row = await database
      .prepare(
        "SELECT request_count FROM office_desktop_ingress_rate_limits WHERE identity_hash = ? AND window_started_at = ? LIMIT 1",
      )
      .bind(identity.hash, windowStartedAt)
      .first<{ request_count: number }>();
    if ((row?.request_count ?? identity.limit + 1) > identity.limit) allowed = false;
  }
  if (allowed && now.getUTCSeconds() < 2) {
    const cutoff = new Date(now.valueOf() - 24 * 60 * 60 * 1_000).toISOString();
    await database
      .prepare("DELETE FROM office_desktop_ingress_rate_limits WHERE window_started_at < ?")
      .bind(cutoff)
      .run();
  }
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((new Date(windowStartedAt).valueOf() + 60_000 - now.valueOf()) / 1_000),
  );
  return { allowed, retryAfterSeconds };
}

export async function consumeOfficeDesktopRateLimit(
  deviceId: string,
  now = new Date(),
): Promise<Readonly<{ allowed: boolean; limit: number; remaining: number; resetAt: string }>> {
  const database = await getD1();
  const windowStartedAt = rateLimitWindow(now);
  const id = `${deviceId}:${windowStartedAt}`;
  const updatedAt = now.toISOString();
  await database
    .prepare(
      `INSERT INTO office_desktop_rate_limits
        (id, device_id, window_started_at, request_count, updated_at)
       VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(device_id, window_started_at)
       DO UPDATE SET request_count = request_count + 1, updated_at = excluded.updated_at`,
    )
    .bind(id, deviceId, windowStartedAt, updatedAt)
    .run();
  const row = await database
    .prepare(
      "SELECT request_count FROM office_desktop_rate_limits WHERE device_id = ? AND window_started_at = ? LIMIT 1",
    )
    .bind(deviceId, windowStartedAt)
    .first<{ request_count: number }>();
  const count = row?.request_count ?? OFFICE_DESKTOP_REQUESTS_PER_MINUTE + 1;
  const resetAt = new Date(new Date(windowStartedAt).valueOf() + 60_000).toISOString();
  if (count === 1) {
    const cutoff = new Date(now.valueOf() - 24 * 60 * 60 * 1_000).toISOString();
    await database
      .prepare("DELETE FROM office_desktop_rate_limits WHERE window_started_at < ?")
      .bind(cutoff)
      .run();
  }
  return {
    allowed: count <= OFFICE_DESKTOP_REQUESTS_PER_MINUTE,
    limit: OFFICE_DESKTOP_REQUESTS_PER_MINUTE,
    remaining: Math.max(0, OFFICE_DESKTOP_REQUESTS_PER_MINUTE - count),
    resetAt,
  };
}

export async function markOfficeDesktopDeviceSeen(deviceId: string, now = new Date()): Promise<void> {
  await (await getD1())
    .prepare(
      "UPDATE office_desktop_devices SET last_seen_at = ? WHERE id = ? AND status = 'active'",
    )
    .bind(now.toISOString(), deviceId)
    .run();
}

function requiredPermission(aggregateType: SafeDesktopDraftType): OfficePermission {
  switch (aggregateType) {
    case "lead":
      return "crm.write";
    case "invoice_draft":
      return "finance.write";
    case "notice_draft":
      return "documents.write";
  }
}

function operationResult(
  operation: OfflineOutboxOperation,
  result: Omit<OfficeDesktopSyncResult, "clientOperationId" | "idempotencyKey" | "aggregateType" | "aggregateId">,
): OfficeDesktopSyncResult {
  return {
    clientOperationId: operation.clientOperationId,
    idempotencyKey: operation.idempotencyKey,
    aggregateType: operation.aggregateType,
    aggregateId: operation.aggregateId,
    ...result,
  };
}

async function findExistingDraft(operation: OfflineOutboxOperation): Promise<ExistingDraftRow | null> {
  return (await getD1())
    .prepare(
      `SELECT aggregate_id, aggregate_type, client_operation_id, idempotency_key,
              operation_hash, server_version
       FROM office_desktop_drafts
       WHERE aggregate_id = ? OR client_operation_id = ? OR idempotency_key = ?
       LIMIT 1`,
    )
    .bind(operation.aggregateId, operation.clientOperationId, operation.idempotencyKey)
    .first<ExistingDraftRow>();
}

function resultForExisting(
  operation: OfflineOutboxOperation,
  operationHash: string,
  existing: ExistingDraftRow,
): OfficeDesktopSyncResult {
  if (classifyDesktopSyncReplay(operation, operationHash, {
    aggregateId: existing.aggregate_id,
    aggregateType: existing.aggregate_type,
    clientOperationId: existing.client_operation_id,
    idempotencyKey: existing.idempotency_key,
    operationHash: existing.operation_hash,
  }) === "duplicate") {
    return operationResult(operation, {
      status: "duplicate",
      serverRecordId: existing.aggregate_id,
      serverVersion: existing.server_version,
    });
  }
  return operationResult(operation, {
    status: "conflict",
    error: {
      code: "idempotency_conflict",
      message: "An operation, idempotency key, or aggregate identifier already represents different content.",
      retryable: false,
    },
  });
}

export async function syncOfficeDesktopOperation(
  operation: OfflineOutboxOperation,
  authorization: AuthorizedDesktopDevice,
  now = new Date(),
): Promise<OfficeDesktopSyncResult> {
  try {
    assertDesktopOperationCanSync(operation);
    const parsed = parseSafeDesktopDraftPayload(operation);
    const permission = requiredPermission(parsed.aggregateType);
    if (!hasOfficePermission(authorization.member.role, permission)) {
      return operationResult(operation, {
        status: "permission_blocked",
        error: {
          code: "office_permission_required",
          message: `Office permission ${permission} is required for this draft.`,
          retryable: false,
        },
      });
    }

    const operationHash = await hashDesktopSyncOperation(operation);
    const existing = await findExistingDraft(operation);
    if (existing) return resultForExisting(operation, operationHash, existing);

    const database = await getD1();
    const acceptedAt = now.toISOString();
    try {
      await database.batch([
        database
          .prepare(
            `INSERT INTO office_desktop_drafts
              (aggregate_id, aggregate_type, draft_id, draft_local_revision,
               client_operation_id, idempotency_key, operation_hash, payload, status,
               server_version, source_device_id, created_by_member_id, created_by_email,
               client_created_at, accepted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'received', 1, ?, ?, ?, ?, ?)`,
          )
          .bind(
            operation.aggregateId,
            parsed.aggregateType,
            operation.draftId,
            operation.draftLocalRevision,
            operation.clientOperationId,
            operation.idempotencyKey,
            operationHash,
            JSON.stringify(parsed.payload),
            authorization.device.id,
            authorization.member.id,
            authorization.member.email,
            operation.createdAt,
            acceptedAt,
          ),
        database
          .prepare(
            `INSERT INTO office_audit_events
              (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata,
               request_id, ip_hash, created_at)
             VALUES (?, ?, ?, 'desktop_draft.received', ?, ?, ?, ?, NULL, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            authorization.member.id,
            authorization.member.email,
            parsed.aggregateType,
            operation.aggregateId,
            JSON.stringify({
              deviceId: authorization.device.id,
              clientOperationId: operation.clientOperationId,
              draftLocalRevision: operation.draftLocalRevision,
              protocolVersion: 1,
            }),
            operation.clientOperationId,
            acceptedAt,
          ),
      ]);
    } catch (error) {
      if (error instanceof Error && /UNIQUE constraint|_unique\b/i.test(error.message)) {
        const raced = await findExistingDraft(operation);
        if (raced) return resultForExisting(operation, operationHash, raced);
      }
      throw error;
    }

    return operationResult(operation, {
      status: "accepted",
      serverRecordId: operation.aggregateId,
      serverVersion: 1,
    });
  } catch (error) {
    if (error instanceof DesktopSyncCapabilityError) {
      return operationResult(operation, {
        status: error.resultStatus,
        error: { code: error.code, message: error.message, retryable: error.retryable },
      });
    }
    if (error instanceof z.ZodError) {
      return operationResult(operation, {
        status: "rejected",
        error: {
          code: "payload_invalid",
          message: error.issues[0]?.message ?? "The draft payload is invalid.",
          retryable: false,
        },
      });
    }
    throw error;
  }
}
