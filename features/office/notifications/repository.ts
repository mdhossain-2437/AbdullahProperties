import { getD1 } from "@/db";
import type { OfficeNotificationOutboxView, OfficeRepositoryActor } from "@/features/office/repository";
import { createOfficeAuditEvent } from "@/features/office/repository";

type NotificationRow = {
  id: string;
  event_type: string;
  entity_type: OfficeNotificationOutboxView["entityType"];
  entity_id: string;
  channel: OfficeNotificationOutboxView["channel"];
  recipient: string;
  template: string;
  locale: OfficeNotificationOutboxView["locale"];
  status: OfficeNotificationOutboxView["status"];
  attempt_count: number;
  max_attempts: number;
  available_at: string;
  error_code: string | null;
  error_summary: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

function maskRecipient(channel: "email" | "sms", recipient: string): string {
  if (channel === "sms") {
    const visible = recipient.slice(-4);
    return `${"•".repeat(Math.max(4, recipient.length - 4))}${visible}`;
  }
  const [local = "", domain = ""] = recipient.split("@");
  const maskedLocal = local.length <= 1 ? "•" : `${local[0]}${"•".repeat(Math.min(5, local.length - 1))}`;
  return domain ? `${maskedLocal}@${domain}` : maskedLocal;
}

function mapNotification(row: NotificationRow): OfficeNotificationOutboxView {
  return {
    id: row.id,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    channel: row.channel,
    recipientMasked: maskRecipient(row.channel, row.recipient),
    template: row.template,
    locale: row.locale,
    status: row.status,
    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,
    availableAt: row.available_at,
    errorCode: row.error_code,
    errorSummary: row.error_summary,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listOfficeNotificationOutbox(
  limit = 100,
): Promise<OfficeNotificationOutboxView[]> {
  const boundedLimit = Math.min(Math.max(Math.trunc(limit), 1), 200);
  const result = await (await getD1())
    .prepare(
      `SELECT id, event_type, entity_type, entity_id, channel, recipient, template, locale,
              status, attempt_count, max_attempts, available_at, error_code, error_summary,
              sent_at, created_at, updated_at
       FROM office_notification_outbox
       ORDER BY created_at DESC, id DESC LIMIT ?`,
    )
    .bind(boundedLimit)
    .all<NotificationRow>();
  return result.results.map(mapNotification);
}

export async function retryOfficeNotification(
  id: string,
  actor: OfficeRepositoryActor,
): Promise<boolean> {
  const database = await getD1();
  const now = new Date().toISOString();
  const audit = createOfficeAuditEvent({
    actor,
    action: "notification.retry_requested",
    entityType: "notification",
    entityId: id,
    metadata: {},
    createdAt: now,
  });
  const results = await database.batch([
    database
      .prepare(
        `UPDATE office_notification_outbox
         SET status = 'pending', available_at = ?, claimed_at = NULL, claim_token = NULL,
             provider_reference = NULL, error_code = NULL, error_summary = NULL,
             attempt_count = 0, updated_at = ?
         WHERE id = ? AND status IN ('failed', 'dead')`,
      )
      .bind(now, now, id),
    database
      .prepare(
        `INSERT INTO office_audit_events
          (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata,
           request_id, ip_hash, created_at)
         VALUES (
           ?, ?, ?, ?, 'notification', ?,
           (SELECT json_object('status', status) FROM office_notification_outbox
            WHERE id = ? AND status = 'pending' AND updated_at = ?),
           ?, ?, ?
         )`,
      )
      .bind(
        audit.id,
        audit.actorMemberId,
        audit.actorEmail,
        audit.action,
        id,
        id,
        now,
        audit.requestId,
        audit.ipHash,
        audit.createdAt,
      ),
  ]);
  return results[0].meta.changes === 1;
}
