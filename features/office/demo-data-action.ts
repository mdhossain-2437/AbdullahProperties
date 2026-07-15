"use server";

import { revalidatePath } from "next/cache";
import type { OfficeActionState } from "@/features/office/actions";
import { getAuthorizedOfficeActor } from "@/features/office/auth";
import {
  isOfficeDemoSeedEnabled,
  officeDemoConfirmationSchema,
  seedOfficeDemoData,
} from "@/features/office/demo-data";
import { hasOfficePermission } from "@/features/office/permissions";

export async function loadOfficeDemoDataAction(
  _previous: OfficeActionState,
  formData: FormData,
): Promise<OfficeActionState> {
  const actor = await getAuthorizedOfficeActor();
  if (!actor || !hasOfficePermission(actor.role, "settings.manage")) {
    return { status: "error", message: "Only an owner or administrator can load the demo dataset." };
  }
  if (!isOfficeDemoSeedEnabled()) {
    return { status: "error", message: "Demo seeding is disabled. Set OFFICE_DEMO_SEED_ENABLED=true only in the intended test environment." };
  }
  const confirmation = officeDemoConfirmationSchema.safeParse(formData.get("confirmation"));
  if (!confirmation.success) {
    return { status: "error", message: "Type LOAD DEMO DATA exactly to confirm this auditable test-data operation.", fieldErrors: { confirmation: "The confirmation phrase does not match." } };
  }

  try {
    const result = await seedOfficeDemoData(actor);
    revalidatePath("/office");
    revalidatePath("/office/leads");
    revalidatePath("/office/contacts");
    revalidatePath("/office/tasks");
    revalidatePath("/office/audit");
    return {
      status: "success",
      message: `Demo dataset ready: ${result.contactsCreated} contacts, ${result.leadsCreated} leads, and ${result.tasksCreated} tasks created. Existing marked records were preserved without duplication.`,
    };
  } catch {
    return { status: "error", message: "The demo dataset could not be completed. Existing committed records remain clearly marked [DEMO]; retry is idempotent at the record level." };
  }
}
