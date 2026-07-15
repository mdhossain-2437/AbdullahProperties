import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandedNoticeDocument } from "@/components/office/branded-document";
import { DocumentActions } from "@/components/office/document-actions";
import { requireOfficePermission } from "@/features/office/auth";
import { buildOfficeDocumentHandoff } from "@/features/office/document-handoff";
import { getOfficeNotice } from "@/features/office/notices/repository";
import { isOfficeDatabaseAvailable } from "@/features/office/repository";
import { trackingUrl } from "@/features/office/tracking";
import styles from "../../print-layout.module.css";

type NoticePrintPageProps = { params: Promise<{ id: string }> };

export default async function OfficeNoticePrintPage({ params }: NoticePrintPageProps) {
  const { id } = await params;
  await requireOfficePermission("documents.read", `/office/print/notices/${id}`);
  if (!(await isOfficeDatabaseAvailable())) {
    return <section className={styles.state}><span>Protected document</span><h1>Office storage is unavailable.</h1><p>The notice was not loaded or exposed. Restore the database binding, then retry from its protected record.</p><Link href={`/office/notices/${id}`}>Return to notice</Link></section>;
  }

  const notice = await getOfficeNotice(id);
  if (!notice) notFound();
  const documentNumber = notice.number ?? `Draft ${notice.id.slice(0, 8)}`;
  const handoff = buildOfficeDocumentHandoff({
    documentType: "notice",
    documentNumber,
    verificationUrl: notice.trackingCode ? trackingUrl(notice.trackingCode) : null,
    locale: notice.locale,
  });

  return (
    <>
      <DocumentActions
        backHref={`/office/notices/${notice.id}`}
        email={notice.recipientSnapshot?.email ?? null}
        phone={notice.recipientSnapshot?.phone ?? null}
        subject={handoff.subject}
        message={handoff.message}
      />
      <BrandedNoticeDocument notice={notice} />
    </>
  );
}
