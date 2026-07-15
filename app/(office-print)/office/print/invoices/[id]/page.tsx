import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandedInvoiceDocument } from "@/components/office/branded-document";
import { DocumentActions } from "@/components/office/document-actions";
import { requireOfficePermission } from "@/features/office/auth";
import { buildOfficeDocumentHandoff } from "@/features/office/document-handoff";
import { getOfficeInvoice, isOfficeDatabaseAvailable } from "@/features/office/repository";
import { trackingUrl } from "@/features/office/tracking";
import styles from "../../print-layout.module.css";

type InvoicePrintPageProps = { params: Promise<{ id: string }> };

export default async function OfficeInvoicePrintPage({ params }: InvoicePrintPageProps) {
  const { id } = await params;
  await requireOfficePermission("finance.read", `/office/print/invoices/${id}`);
  if (!(await isOfficeDatabaseAvailable())) {
    return <section className={styles.state}><span>Protected document</span><h1>Office storage is unavailable.</h1><p>The invoice was not loaded or exposed. Restore the database binding, then retry from its protected record.</p><Link href={`/office/invoices/${id}`}>Return to invoice</Link></section>;
  }

  const invoice = await getOfficeInvoice(id);
  if (!invoice) notFound();
  const documentNumber = invoice.number ?? `Draft ${invoice.id.slice(0, 8)}`;
  const handoff = buildOfficeDocumentHandoff({
    documentType: "invoice",
    documentNumber,
    verificationUrl: invoice.trackingCode ? trackingUrl(invoice.trackingCode) : null,
    locale: invoice.locale,
  });

  return (
    <>
      <DocumentActions
        backHref={`/office/invoices/${invoice.id}`}
        email={invoice.customerSnapshot.email}
        phone={invoice.customerSnapshot.phone}
        subject={handoff.subject}
        message={handoff.message}
      />
      <BrandedInvoiceDocument invoice={invoice} />
    </>
  );
}
