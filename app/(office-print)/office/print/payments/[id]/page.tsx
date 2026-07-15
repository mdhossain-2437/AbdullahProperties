import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandedReceiptDocument } from "@/components/office/branded-document";
import { DocumentActions } from "@/components/office/document-actions";
import { requireOfficePermission } from "@/features/office/auth";
import { buildOfficeDocumentHandoff } from "@/features/office/document-handoff";
import {
  getOfficeInvoice,
  getOfficePayment,
  isOfficeDatabaseAvailable,
} from "@/features/office/repository";
import { trackingUrl } from "@/features/office/tracking";
import styles from "../../print-layout.module.css";

type PaymentPrintPageProps = { params: Promise<{ id: string }> };

export default async function OfficePaymentPrintPage({ params }: PaymentPrintPageProps) {
  const { id } = await params;
  await requireOfficePermission("finance.read", `/office/print/payments/${id}`);
  if (!(await isOfficeDatabaseAvailable())) {
    return <section className={styles.state}><span>Protected document</span><h1>Office storage is unavailable.</h1><p>The receipt was not loaded or exposed. Restore the database binding, then retry from the protected payment register.</p><Link href="/office/payments">Return to payments</Link></section>;
  }

  const payment = await getOfficePayment(id);
  if (!payment?.invoiceId) notFound();
  const invoice = await getOfficeInvoice(payment.invoiceId);
  if (!invoice) notFound();
  const documentNumber = payment.receiptNumber ?? `Provisional ${payment.id.slice(0, 8)}`;
  const handoff = buildOfficeDocumentHandoff({
    documentType: "payment receipt",
    documentNumber,
    verificationUrl: payment.trackingCode ? trackingUrl(payment.trackingCode) : null,
    locale: payment.locale,
  });

  return (
    <>
      <DocumentActions
        backHref="/office/payments"
        email={invoice.customerSnapshot.email}
        phone={invoice.customerSnapshot.phone}
        subject={handoff.subject}
        message={handoff.message}
      />
      <BrandedReceiptDocument payment={payment} invoice={invoice} />
    </>
  );
}
