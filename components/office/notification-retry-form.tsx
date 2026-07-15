"use client";

import { useActionState } from "react";
import { RotateCcw } from "lucide-react";
import { OfficeActionFeedback } from "@/components/office/action-feedback";
import { initialOfficeActionState } from "@/features/office/actions";
import { retryOfficeNotificationAction } from "@/features/office/notifications/actions";

export function OfficeNotificationRetryForm({ notificationId }: { notificationId: string }) {
  const [state, action, pending] = useActionState(retryOfficeNotificationAction, initialOfficeActionState);

  return (
    <form action={action} className="office-notification-retry">
      <input type="hidden" name="notificationId" value={notificationId} />
      <button className="office-button office-button--ghost" type="submit" disabled={pending}>
        <RotateCcw aria-hidden="true" />
        {pending ? "Queueing…" : "Retry"}
      </button>
      <OfficeActionFeedback state={state} />
    </form>
  );
}
