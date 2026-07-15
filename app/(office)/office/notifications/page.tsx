import { AlertTriangle, BellRing, CheckCircle2, Clock3, Mail, MessageSquareText } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficeMetricCard } from "@/components/office/metric-card";
import { OfficeNotificationRetryForm } from "@/components/office/notification-retry-form";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { listOfficeNotificationOutbox } from "@/features/office/notifications/repository";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeDate } from "@/features/office/presentation";
import { isOfficeDatabaseAvailable } from "@/features/office/repository";

export default async function OfficeNotificationsPage() {
  const actor = await requireOfficePermission("notifications.read", "/office/notifications");
  if (!(await isOfficeDatabaseAvailable())) return <OfficeAccessState kind="storage" />;

  const notifications = await listOfficeNotificationOutbox(150);
  const canManage = hasOfficePermission(actor.role, "notifications.manage");
  const pending = notifications.filter((item) => ["pending", "processing"].includes(item.status)).length;
  const sent = notifications.filter((item) => item.status === "sent").length;
  const needsAttention = notifications.filter((item) => ["failed", "dead"].includes(item.status)).length;
  const deferred = notifications.filter((item) => item.errorCode === "provider_not_configured").length;

  return (
    <>
      <OfficePageHeader
        eyebrow="Control / Delivery"
        title="A truthful message queue."
        description="Payment receipts create durable email and SMS delivery intents in the same transaction as the financial record. A message is marked sent only after a configured provider confirms acceptance."
        meta={<span className="office-record-count">{notifications.length} recent events</span>}
      />

      <div className="office-alert office-alert--warning" role="status">
        <AlertTriangle aria-hidden="true" />
        <div>
          <strong>Provider dispatch is intentionally disabled until credentials are configured.</strong>
          <p>Queued records are preserved for a worker and remain auditable. Configure verified email and Bangladesh SMS provider adapters, webhook validation, secrets, and retry policy before enabling automatic delivery.</p>
        </div>
      </div>

      <section className="office-metrics" aria-label="Notification delivery overview">
        <OfficeMetricCard label="Queued" value={String(pending)} note="Pending or currently claimed by a worker." icon={Clock3} />
        <OfficeMetricCard label="Accepted" value={String(sent)} note="Provider acceptance is recorded; final handset delivery may arrive later." icon={CheckCircle2} tone="positive" />
        <OfficeMetricCard label="Attention" value={String(needsAttention)} note="Failed or exhausted messages require review." icon={AlertTriangle} tone="warning" />
        <OfficeMetricCard label="Deferred" value={String(deferred)} note="Waiting for a verified provider configuration." icon={BellRing} />
      </section>

      {notifications.length > 0 ? (
        <div className="office-table-wrap" role="region" aria-label="Email and SMS delivery queue" tabIndex={0}>
          <table className="office-table">
            <thead><tr><th>Message</th><th>Recipient</th><th>State</th><th>Attempts</th><th>Created</th><th>Action</th></tr></thead>
            <tbody>
              {notifications.map((item) => {
                const ChannelIcon = item.channel === "email" ? Mail : MessageSquareText;
                const retryable = canManage && ["failed", "dead"].includes(item.status);
                return (
                  <tr key={item.id}>
                    <td className="office-record-primary"><strong><ChannelIcon aria-hidden="true" /> {item.template}</strong><small>{item.eventType} · {item.locale.toUpperCase()}</small></td>
                    <td><strong>{item.recipientMasked}</strong><small>{item.channel.toUpperCase()}</small></td>
                    <td><OfficeStatusBadge status={item.status} />{item.errorSummary ? <small>{item.errorSummary}</small> : null}</td>
                    <td>{item.attemptCount} / {item.maxAttempts}</td>
                    <td>{formatOfficeDate(item.createdAt)}</td>
                    <td>{retryable ? <OfficeNotificationRetryForm notificationId={item.id} /> : <small>{item.sentAt ? `Accepted ${formatOfficeDate(item.sentAt)}` : "No action required"}</small>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <OfficeEmptyState icon={BellRing} title="The delivery queue is empty." description="When an eligible payment is posted, the receipt notification intent will be created here without delaying the financial transaction." />
      )}
    </>
  );
}
