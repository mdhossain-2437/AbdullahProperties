import { getOptionalD1 } from "@/db";
import { isTrackingCode, maskRecipientName } from "@/features/office/tracking";

type TrackingRow = {
  document_type: "invoice" | "receipt" | "notice";
  number: string;
  document_date: string | null;
  status: string;
  recipient_name: string | null;
  revoked_at: string | null;
};

export type PublicTrackingResult =
  | Readonly<{ state: "unavailable" }>
  | Readonly<{ state: "not_found" }>
  | Readonly<{
      state: "verified" | "revoked";
      documentType: TrackingRow["document_type"];
      number: string;
      documentDate: string | null;
      status: string;
      recipientMasked: string;
    }>;

const TRACKING_QUERY = `SELECT document_type, number, document_date, status, recipient_name, revoked_at
FROM (
  SELECT 'invoice' AS document_type, invoice.number AS number, invoice.issue_date AS document_date,
         invoice.status AS status, contact.display_name AS recipient_name,
         invoice.public_access_revoked_at AS revoked_at
  FROM office_invoices invoice
  INNER JOIN office_contacts contact ON contact.id = invoice.contact_id
  WHERE invoice.tracking_code = ? AND invoice.number IS NOT NULL

  UNION ALL

  SELECT 'receipt' AS document_type, payment.receipt_number AS number,
         payment.paid_at AS document_date, payment.status AS status,
         contact.display_name AS recipient_name, payment.public_access_revoked_at AS revoked_at
  FROM office_payments payment
  INNER JOIN office_contacts contact ON contact.id = payment.contact_id
  WHERE payment.tracking_code = ? AND payment.receipt_number IS NOT NULL

  UNION ALL

  SELECT 'notice' AS document_type, notice.number AS number, notice.issue_date AS document_date,
         notice.status AS status, contact.display_name AS recipient_name,
         notice.public_access_revoked_at AS revoked_at
  FROM office_notices notice
  LEFT JOIN office_contacts contact ON contact.id = notice.contact_id
  WHERE notice.tracking_code = ? AND notice.number IS NOT NULL
)
LIMIT 1`;

export async function getPublicTrackingResult(code: string): Promise<PublicTrackingResult> {
  if (!isTrackingCode(code)) return { state: "not_found" };
  const database = await getOptionalD1();
  if (!database) return { state: "unavailable" };

  let row: TrackingRow | null;
  try {
    row = await database
      .prepare(TRACKING_QUERY)
      .bind(code, code, code)
      .first<TrackingRow>();
  } catch (error) {
    if (
      error instanceof Error &&
      /no such table|no such column|schema/i.test(error.message)
    ) {
      return { state: "unavailable" };
    }
    throw error;
  }

  if (!row) return { state: "not_found" };
  return {
    state: row.revoked_at ? "revoked" : "verified",
    documentType: row.document_type,
    number: row.number,
    documentDate: row.document_date,
    status: row.status,
    recipientMasked: maskRecipientName(row.recipient_name ?? "Private recipient"),
  };
}

