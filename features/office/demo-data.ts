import { z } from "zod";
import { OFFICE_DEMO_CONFIRMATION } from "@/features/office/demo-data-contract";
import {
  createOfficeContact,
  createOfficeLead,
  createOfficeTask,
  listOfficeContacts,
  listOfficeLeads,
  listOfficeTasks,
  type OfficeRepositoryActor,
} from "@/features/office/repository";

export const officeDemoConfirmationSchema = z.literal(OFFICE_DEMO_CONFIRMATION);

const DEMO_MARKER = "[DEMO]";

export function isOfficeDemoSeedEnabled(environment: Readonly<Record<string, string | undefined>> = process.env): boolean {
  return environment.OFFICE_DEMO_SEED_ENABLED === "true" || environment.NODE_ENV !== "production";
}

function futureDate(days: number): string {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  value.setUTCHours(10, 0, 0, 0);
  return value.toISOString();
}

export type OfficeDemoSeedResult = Readonly<{
  contactsCreated: number;
  leadsCreated: number;
  tasksCreated: number;
}>;

export async function seedOfficeDemoData(actor: OfficeRepositoryActor): Promise<OfficeDemoSeedResult> {
  if (!isOfficeDemoSeedEnabled()) throw new Error("Office demo seeding is disabled in this environment.");

  let contactsCreated = 0;
  let leadsCreated = 0;
  let tasksCreated = 0;
  const contactDefinitions = [
    {
      key: "rahim",
      displayName: `${DEMO_MARKER} Rahim Uddin`,
      kind: "buyer" as const,
      organizationName: null,
      address: "Pouro Market area, Joypurhat",
      notes: "Fictional test record. Do not contact or use for live commercial decisions.",
    },
    {
      key: "karim",
      displayName: `${DEMO_MARKER} Karim Mia`,
      kind: "landowner" as const,
      organizationName: null,
      address: "Joypurhat Sadar, Joypurhat",
      notes: "Fictional test record. Do not contact or use for live land verification.",
    },
    {
      key: "traders",
      displayName: `${DEMO_MARKER} North Bengal Traders`,
      kind: "vendor" as const,
      organizationName: "North Bengal Traders — fictional",
      address: "Joypurhat, Bangladesh",
      notes: "Fictional test record. No real vendor relationship is represented.",
    },
  ] as const;

  const contacts = new Map<string, string>();
  for (const definition of contactDefinitions) {
    const existing = (await listOfficeContacts({ query: definition.displayName, limit: 20 }))
      .find((item) => item.displayName === definition.displayName);
    if (existing) {
      contacts.set(definition.key, existing.id);
      continue;
    }
    const created = await createOfficeContact({
      kind: definition.kind,
      displayName: definition.displayName,
      organizationName: definition.organizationName,
      address: definition.address,
      notes: definition.notes,
    }, actor);
    contacts.set(definition.key, created.id);
    contactsCreated += 1;
  }

  const leadDefinitions = [
    { key: "rahim", title: `${DEMO_MARKER} Family apartment consultation`, serviceType: "buy" as const, stage: "qualified" as const, priority: "high" as const, value: 7_500_000, dueDays: 2 },
    { key: "karim", title: `${DEMO_MARKER} Joint-venture land discussion`, serviceType: "land_development" as const, stage: "site_visit" as const, priority: "normal" as const, value: 12_000_000, dueDays: 4 },
  ] as const;

  const createdLeadIds = new Map<string, string>();
  for (const definition of leadDefinitions) {
    const existing = (await listOfficeLeads({ query: definition.title, limit: 20 }))
      .find((item) => item.title === definition.title);
    if (existing) {
      createdLeadIds.set(definition.key, existing.id);
      continue;
    }
    const contactId = contacts.get(definition.key);
    if (!contactId) throw new Error(`The demo contact ${definition.key} is unavailable.`);
    const created = await createOfficeLead({
      contactId,
      title: definition.title,
      source: "Demo dataset — non-production",
      serviceType: definition.serviceType,
      stage: definition.stage,
      priority: definition.priority,
      estimatedValueMinor: definition.value * 100,
      currency: "BDT",
      nextActionAt: futureDate(definition.dueDays),
    }, actor);
    createdLeadIds.set(definition.key, created.id);
    leadsCreated += 1;
  }

  const taskDefinitions = [
    { title: `${DEMO_MARKER} Call buyer and confirm apartment brief`, description: "Test the lead follow-up workflow. This is fictional data and must not trigger a real message.", priority: "high" as const, dueDays: 1, contactKey: "rahim", leadKey: "rahim" },
    { title: `${DEMO_MARKER} Prepare site-visit checklist`, description: "Test ownership, due date, and relationship links for a land discussion.", priority: "normal" as const, dueDays: 3, contactKey: "karim", leadKey: "karim" },
    { title: `${DEMO_MARKER} Review sample vendor quotation`, description: "A standalone test task for the vendor record. No commercial approval is implied.", priority: "low" as const, dueDays: 5, contactKey: "traders", leadKey: null },
  ] as const;

  for (const definition of taskDefinitions) {
    const existing = (await listOfficeTasks({ query: definition.title, limit: 20 }))
      .find((item) => item.title === definition.title);
    if (existing) continue;
    const contactId = contacts.get(definition.contactKey);
    if (!contactId) throw new Error(`The demo contact ${definition.contactKey} is unavailable.`);
    await createOfficeTask({
      title: definition.title,
      description: definition.description,
      priority: definition.priority,
      reporterMemberId: actor.memberId,
      contactId,
      leadId: definition.leadKey ? createdLeadIds.get(definition.leadKey) ?? null : null,
      dueAt: futureDate(definition.dueDays),
    }, actor);
    tasksCreated += 1;
  }

  return { contactsCreated, leadsCreated, tasksCreated };
}
