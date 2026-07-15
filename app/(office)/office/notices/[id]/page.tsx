import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { BrandedNoticeDocument } from "@/components/office/branded-document";
import { OfficeIssueNoticeForm } from "@/components/office/notice-forms";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { getOfficeNotice } from "@/features/office/notices/repository";
import { hasOfficePermission } from "@/features/office/permissions";
import { getOfficeLocalDate } from "@/features/office/presentation";
import { isOfficeDatabaseAvailable } from "@/features/office/repository";

type NoticeDetailPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: NoticeDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Notice ${id.slice(0, 8)} | Office OS`, robots: { index: false, follow: false } };
}

export default async function OfficeNoticeDetailPage({ params }: NoticeDetailPageProps) {
  const { id } = await params;
  const actor = await requireOfficePermission("documents.read", `/office/notices/${id}`);
  if (!(await isOfficeDatabaseAvailable())) return <OfficeAccessState kind="storage" />;
  const notice = await getOfficeNotice(id);
  if (!notice) notFound();
  const canIssue = notice.status === "draft" && hasOfficePermission(actor.role, "documents.review");

  return (
    <>
      <OfficePageHeader
        eyebrow="Notice / Versioned correspondence"
        title={notice.number ?? "Unissued notice draft"}
        description="This protected record preserves its recipient, company, language, dates, and content. The dedicated print view provides branded output and explicit manual handoff actions."
        meta={<OfficeStatusBadge status={notice.status} />}
        action={<div className="office-page-actions"><Link className="office-button office-button--ghost" href="/office/notices"><ArrowLeft aria-hidden="true" /> Notices</Link><Link className="office-button office-button--accent" href={`/office/print/notices/${notice.id}`}><Printer aria-hidden="true" /> Print / PDF</Link></div>}
      />

      {canIssue ? (
        <section className="office-record-composer">
          <OfficeIssueNoticeForm
            noticeId={notice.id}
            version={notice.version}
            fiscalYear={(notice.issueDate ?? getOfficeLocalDate()).slice(0, 4)}
          />
        </section>
      ) : null}

      <div className="office-alert" role="note">
        <ShieldCheck aria-hidden="true" />
        <div><strong>Sharing remains an explicit staff action.</strong><p>The print view can open a prepared email or SMS, but it does not attach files, send messages, or claim delivery.</p></div>
      </div>

      <BrandedNoticeDocument notice={notice} />
    </>
  );
}
