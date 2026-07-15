import type { OfficeLocale } from "@/features/office/types";

export type NotificationChannel = "email" | "sms";

export type NotificationMessage = Readonly<{
  id: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string | null;
  body: string;
  idempotencyKey: string;
}>;

export type NotificationTransportResult =
  | Readonly<{ status: "sent"; providerReference: string }>
  | Readonly<{ status: "deferred"; code: "provider_not_configured" }>
  | Readonly<{ status: "failed"; code: string; retryable: boolean }>;

export interface NotificationTransport {
  readonly channel: NotificationChannel;
  send(message: NotificationMessage): Promise<NotificationTransportResult>;
}

abstract class DisabledNotificationTransport implements NotificationTransport {
  abstract readonly channel: NotificationChannel;

  async send(_message: NotificationMessage): Promise<NotificationTransportResult> {
    void _message;
    return { status: "deferred", code: "provider_not_configured" };
  }
}

export class DisabledEmailTransport extends DisabledNotificationTransport {
  readonly channel = "email" as const;
}

export class DisabledSmsTransport extends DisabledNotificationTransport {
  readonly channel = "sms" as const;
}

const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function normalizeBangladeshPhone(value: string): string | null {
  const compact = value.replace(/[\s()-]/g, "");
  const normalized = compact.startsWith("01") ? `+88${compact}` : compact;
  return E164_PATTERN.test(normalized) ? normalized : null;
}

export type PaymentNotificationContext = Readonly<{
  paymentId: string;
  receiptNumber: string;
  invoiceNumber: string;
  amountDisplay: string;
  balanceDisplay: string;
  trackingUrl: string;
  locale: OfficeLocale;
  email: string | null;
  phone: string | null;
  emailEnabled: boolean;
  smsEnabled: boolean;
}>;

export type PendingNotification = Readonly<{
  channel: NotificationChannel;
  recipient: string;
  template: "payment-receipt-v1";
  locale: OfficeLocale;
  idempotencyKey: string;
  payload: Readonly<{
    receiptNumber: string;
    invoiceNumber: string;
    amountDisplay: string;
    balanceDisplay: string;
    trackingUrl: string;
  }>;
}>;

export function createPaymentNotifications(
  context: PaymentNotificationContext,
): readonly PendingNotification[] {
  const payload = {
    receiptNumber: context.receiptNumber,
    invoiceNumber: context.invoiceNumber,
    amountDisplay: context.amountDisplay,
    balanceDisplay: context.balanceDisplay,
    trackingUrl: context.trackingUrl,
  } as const;
  const notifications: PendingNotification[] = [];

  if (context.emailEnabled && context.email) {
    notifications.push({
      channel: "email",
      recipient: context.email.trim().toLowerCase(),
      template: "payment-receipt-v1",
      locale: context.locale,
      idempotencyKey: `payment:${context.paymentId}:receipt:email:v1`,
      payload,
    });
  }

  const normalizedPhone = context.phone ? normalizeBangladeshPhone(context.phone) : null;
  if (context.smsEnabled && normalizedPhone) {
    notifications.push({
      channel: "sms",
      recipient: normalizedPhone,
      template: "payment-receipt-v1",
      locale: context.locale,
      idempotencyKey: `payment:${context.paymentId}:receipt:sms:v1`,
      payload,
    });
  }

  return notifications;
}
