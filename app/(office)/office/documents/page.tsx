import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileLock2, FileSearch, Plus, Search, ShieldCheck } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import {
  OfficeDocumentUploadSelector,
  type OfficeDocumentTarget,
} from "@/components/office/document-upload-selector";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeDateTime, formatOfficeMoney, humanizeOfficeValue } from "@/features/office/presentation";
import {
  getOfficeDatabaseHealth,
  listOfficeApprovals,
  listOfficeContacts,
  listOfficeExpenses,
  listOfficeInvoices,
  listOfficeLandParcels,
  listOfficeLeads,
  listOfficePayments,
  listOfficeProjects,
} from "@/features/office/repository";
import {
  getOptionalOfficeFilesBucket,
  listOfficeDocuments,
} from "@/features/office/storage";
import type {
  OfficeDocumentClassification,
  OfficeDocumentEntityType,
} from "@/features/office/storage-policy";

export const metadata: Metadata = { title: "Documents | Office OS" };

const entityTypes = ["contact", "lead", "land_parcel", "project", "invoice", "payment", "expense", "approval"] as const satisfies readonly OfficeDocumentEntityType[];
const classifications = ["general", "title_deed", "mutation", "land_tax", "agreement", "invoice", "receipt", "expense_receipt", "approval", "other"] as const satisfies readonly OfficeDocumentClassification[];
const reviewStatuses = ["pending", "reviewed", "rejected", "expired"] as const;

type DocumentSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asChoice<const T extends readonly string[]>(value: string | undefined, choices: T): T[number] | undefined {
  return value && choices.includes(value as T[number]) ? value as T[number] : undefined;
}

function humanFileSize(sizeBytes: number) {
  if (sizeBytes < 1_024) return `${sizeBytes} B`;
  if (sizeBytes < 1_048_576) return `${(sizeBytes / 1_024).toFixed(1)} KiB`;
  return `${(sizeBytes / 1_048_576).toFixed(1)} MiB`;
}

export default async function OfficeDocumentsPage({ searchParams }: { searchParams: DocumentSearchParams }) {
  const actor = await requireOfficePermission("documents.read", "/office/documents");
  const health = await getOfficeDatabaseHealth();
  if (!health.healthy) return <OfficeAccessState kind="storage" />;

  const params = await searchParams;
  const query = first(params.q)?.trim().slice(0, 120) || undefined;
  const entityType = asChoice(first(params.entityType), entityTypes);
  const classification = asChoice(first(params.classification), classifications);
  const reviewStatus = asChoice(first(params.reviewStatus), reviewStatuses);
  const canWrite = hasOfficePermission(actor.role, "documents.write");
  const filesAvailable = canWrite ? Boolean(await getOptionalOfficeFilesBucket()) : false;
  const documents = await listOfficeDocuments(actor, { query, entityType, classification, reviewStatus, limit: 100 });
  const filtered = Boolean(query || entityType || classification || reviewStatus);

  const canReadCrm = canWrite && hasOfficePermission(actor.role, "crm.read");
  const canReadLand = canWrite && hasOfficePermission(actor.role, "land.read");
  const canReadProjects = canWrite && hasOfficePermission(actor.role, "projects.read");
  const canReadFinance = canWrite && hasOfficePermission(actor.role, "finance.read");
  const canReadExpenses = canWrite && hasOfficePermission(actor.role, "expenses.read");
  const canReadApprovals = canWrite && hasOfficePermission(actor.role, "approvals.read");

  const [contacts, leads, landParcels, projects, invoices, payments, expenses, approvals] = filesAvailable ? await Promise.all([
    canReadCrm ? listOfficeContacts({ status: "active", limit: 25 }) : Promise.resolve([]),
    canReadCrm ? listOfficeLeads({ limit: 25 }) : Promise.resolve([]),
    canReadLand ? listOfficeLandParcels({ limit: 25 }) : Promise.resolve([]),
    canReadProjects ? listOfficeProjects({ limit: 25 }) : Promise.resolve([]),
    canReadFinance ? listOfficeInvoices({ limit: 25 }) : Promise.resolve([]),
    canReadFinance ? listOfficePayments({ limit: 25 }) : Promise.resolve([]),
    canReadExpenses ? listOfficeExpenses({ limit: 25 }) : Promise.resolve([]),
    canReadApprovals ? listOfficeApprovals({ limit: 25 }) : Promise.resolve([]),
  ]) : [[], [], [], [], [], [], [], []] as const;

  const targets: OfficeDocumentTarget[] = [
    ...contacts.map((record) => ({ entityType: "contact" as const, entityId: record.id, label: record.displayName, context: humanizeOfficeValue(record.kind) })),
    ...leads.map((record) => ({ entityType: "lead" as const, entityId: record.id, label: record.title, context: record.contactName })),
    ...landParcels.map((record) => ({ entityType: "land_parcel" as const, entityId: record.id, label: record.title, context: record.referenceCode })),
    ...projects.map((record) => ({ entityType: "project" as const, entityId: record.id, label: record.name, context: record.code })),
    ...invoices.map((record) => ({ entityType: "invoice" as const, entityId: record.id, label: record.number ?? "Draft invoice", context: record.contactName })),
    ...payments.map((record) => ({ entityType: "payment" as const, entityId: record.id, label: record.receiptNumber ?? "Unnumbered payment", context: formatOfficeMoney(record.amountMinor, record.currency) })),
    ...expenses.map((record) => ({ entityType: "expense" as const, entityId: record.id, label: record.number ?? record.category, context: formatOfficeMoney(record.amountMinor, record.currency) })),
    ...approvals.map((record) => ({ entityType: "approval" as const, entityId: record.id, label: `${humanizeOfficeValue(record.kind)} approval`, context: humanizeOfficeValue(record.entityType) })),
  ];

  return (
    <>
      <OfficePageHeader
        eyebrow="Delivery / Private evidence"
        title="Evidence stays attached to the work."
        description="Searchable metadata is kept in the protected office database while PDF and image bytes stay in private object storage. Downloads are permission-checked, attachment-only, no-store responses."
        meta={<span className="office-record-count">{documents.length}{documents.length === 100 ? "+" : ""} shown</span>}
        action={canWrite && filesAvailable ? <a className="office-button office-button--accent" href="#upload-document"><Plus aria-hidden="true" /> Upload evidence</a> : undefined}
      />

      <div className="office-alert office-alert--warning" role="note">
        <ShieldCheck aria-hidden="true" />
        <div><strong>Private does not mean ungoverned</strong><p>Upload only necessary business evidence. Never use this first-release store for national ID images, payment card data, secrets, or material requiring a retention policy Abdullah Properties has not approved.</p></div>
      </div>

      <form className="office-filter-bar" method="get" aria-label="Filter private documents">
        <label><span>Filename</span><input type="search" name="q" defaultValue={query} maxLength={120} placeholder="Agreement, survey, receipt…" /></label>
        <label><span>Record type</span><select name="entityType" defaultValue={entityType ?? ""}><option value="">All record types</option>{entityTypes.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <label><span>Classification</span><select name="classification" defaultValue={classification ?? ""}><option value="">All classifications</option>{classifications.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <label><span>Review state</span><select name="reviewStatus" defaultValue={reviewStatus ?? ""}><option value="">All review states</option>{reviewStatuses.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <div className="office-filter-bar__actions"><button className="office-button" type="submit"><Search aria-hidden="true" /> Apply</button><Link className="office-button office-button--ghost" href="/office/documents">Clear</Link></div>
      </form>

      <section className="office-records" aria-labelledby="document-register-title">
        <div className="office-records__head"><div><span className="office-eyebrow">Controlled metadata register</span><h2 id="document-register-title">Private documents</h2></div><span className="office-record-count">No object keys exposed</span></div>
        {documents.length > 0 ? (
          <div className="office-table-wrap" role="region" aria-label="Private document register. Scroll horizontally on small screens." tabIndex={0}>
            <table className="office-table">
              <thead><tr><th>Document</th><th>Attached record</th><th>Classification</th><th>Uploaded by</th><th>Review</th><th>Private access</th></tr></thead>
              <tbody>{documents.map((document) => (
                <tr key={document.id}>
                  <td className="office-record-primary"><strong>{document.originalFilename}</strong><small>{humanFileSize(document.sizeBytes)} · revision {document.revision} · SHA-256 {document.checksumSha256.slice(0, 12)}…</small></td>
                  <td>{humanizeOfficeValue(document.entityType)}<small>{document.entityId.slice(0, 8)}…</small></td>
                  <td>{humanizeOfficeValue(document.classification)}</td>
                  <td>{document.uploadedByName ?? "Authenticated bootstrap"}<small>{formatOfficeDateTime(document.createdAt)}</small></td>
                  <td><OfficeStatusBadge status={document.reviewStatus} /></td>
                  <td><a className="office-button office-button--ghost" href={`/office/documents/${document.id}/download`}><Download aria-hidden="true" /> Download</a></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <OfficeEmptyState
            icon={filtered ? FileSearch : FileLock2}
            title={filtered ? "No private documents match these filters." : "Attach the first piece of controlled evidence."}
            description={filtered ? "Clear or adjust the metadata filters. Private objects remain unchanged." : "Choose an eligible office record, classify the evidence, and upload a signature-checked PDF, JPEG, or PNG."}
            action={filtered ? <Link className="office-button" href="/office/documents">Clear filters</Link> : canWrite && filesAvailable ? <a className="office-button" href="#upload-document">Upload evidence</a> : undefined}
          />
        )}
      </section>

      {canWrite ? (
        <section id="upload-document" className="office-create-panel" aria-labelledby="upload-document-title">
          <div className="office-form-intro"><span className="office-eyebrow">Private intake</span><h2 id="upload-document-title">Attach evidence to its source record.</h2><p>The browser performs a quick check; the server independently validates size, MIME, extension, and file signature before private storage and audit metadata are committed.</p></div>
          {filesAvailable ? <OfficeDocumentUploadSelector targets={targets} /> : <div className="office-alert office-alert--error" role="alert"><FileLock2 aria-hidden="true" /><div><strong>Private object storage is unavailable.</strong><p>Existing metadata remains readable, but uploads stay disabled so no file is mistaken for a saved document. Verify the FILES binding before retrying.</p></div></div>}
        </section>
      ) : (
        <div className="office-alert office-alert--warning"><FileLock2 aria-hidden="true" /><div><strong>Read-only document access</strong><p>Your role may inspect and download permitted evidence but cannot upload new objects.</p></div></div>
      )}
    </>
  );
}
