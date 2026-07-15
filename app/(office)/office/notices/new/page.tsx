import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeNoticeForm } from "@/components/office/notice-forms";
import { OfficePageHeader } from "@/components/office/page-header";
import { requireOfficePermission } from "@/features/office/auth";
import { getOfficeLocalDate, humanizeOfficeValue } from "@/features/office/presentation";
import {
  isOfficeDatabaseAvailable,
  listOfficeContactOptions,
  listOfficeProjectOptions,
} from "@/features/office/repository";

export const metadata: Metadata = { title: "Create notice | Office OS" };

export default async function OfficeCreateNoticePage() {
  await requireOfficePermission("documents.write", "/office/notices/new");
  if (!(await isOfficeDatabaseAvailable())) return <OfficeAccessState kind="storage" />;

  const [contacts, projects] = await Promise.all([
    listOfficeContactOptions({ status: "active", limit: 200 }),
    listOfficeProjectOptions({ limit: 200 }),
  ]);

  return (
    <>
      <OfficePageHeader
        eyebrow="Correspondence / New draft"
        title="Write once. Review before it travels."
        description="Create a protected plain-text notice with explicit recipient, project, language, and validity context. Drafting never sends or publishes the record."
        action={<Link className="office-button office-button--ghost" href="/office/notices"><ArrowLeft aria-hidden="true" /> Notices</Link>}
      />
      <section className="office-create-panel" aria-labelledby="notice-form-title">
        <div className="office-form-intro">
          <span className="office-eyebrow">Controlled authoring</span>
          <h2 id="notice-form-title">The meaning matters more than the template.</h2>
          <p>Use direct, respectful language and record only necessary business information. The server validates every field and snapshots the selected recipient when the draft is created.</p>
        </div>
        <OfficeNoticeForm
          contacts={contacts.map((contact) => ({ ...contact, detail: humanizeOfficeValue(contact.detail) }))}
          projects={projects}
          issueDate={getOfficeLocalDate()}
        />
      </section>
    </>
  );
}
