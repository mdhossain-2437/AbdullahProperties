"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { OfficeActionState } from "@/features/office/actions";
import { getAuthorizedOfficeActor } from "@/features/office/auth";
import { retryOfficeNotification } from "@/features/office/notifications/repository";
import { hasOfficePermission } from "@/features/office/permissions";

const notificationIdSchema = z.string().uuid();

export async function retryOfficeNotificationAction(
  _previous: OfficeActionState,
  formData: FormData,
): Promise<OfficeActionState> {
  const actor = await getAuthorizedOfficeActor();
  if (!actor || !hasOfficePermission(actor.role, "notifications.manage")) {
    return { status: "error", message: "Your current office role cannot retry notification delivery." };
  }

  const parsedId = notificationIdSchema.safeParse(formData.get("notificationId"));
  if (!parsedId.success) {
    return { status: "error", message: "The notification reference is invalid. Reload the queue before retrying." };
  }

  try {
    const retried = await retryOfficeNotification(parsedId.data, actor);
    if (!retried) {
      return { status: "error", message: "Only failed or exhausted notifications can be queued again." };
    }
    revalidatePath("/office/notifications");
    revalidatePath("/office/audit");
    return { status: "success", message: "Delivery was returned to the queue. A configured provider worker must accept it before it is marked sent." };
  } catch {
    return { status: "error", message: "The retry was not accepted. No delivery state was changed." };
  }
}
