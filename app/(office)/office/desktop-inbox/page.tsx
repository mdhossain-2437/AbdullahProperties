import Link from "next/link";
import { ArrowUpRight, Inbox, Laptop, ShieldCheck } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { listOfficeDesktopInboxDrafts } from "@/features/office/desktop-sync-repository";
import { formatOfficeDate } from "@/features/office/presentation";
import { isOfficeDatabaseAvailable } from "@/features/office/repository";

function payloadText(payload: Readonly<Record<string, unknown>>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function titleFor(aggregateType: "lead" | "invoice_draft" | "notice_draft", payload: Readonly<Record<string, unknown>>) {
  if (aggregateType === "notice_draft") return payloadText(payload, "subject") ?? "Untitled notice draft";
  return payloadText(payload, "customerName") ?? "Unnamed customer draft";
}

function detailFor(aggregateType: "lead" | "invoice_draft" | "notice_draft", payload: Readonly<Record<string, unknown>>) {
  if (aggregateType === "lead") return payloadText(payload, "interest") ?? "Lead details require review";
  if (aggregateType === "invoice_draft") return payloadText(payload, "purpose") ?? "Invoice purpose requires review";
  return payloadText(payload, "recipientName") ?? "Notice recipient requires review";
}

function destinationFor(aggregateType: "lead" | "invoice_draft" | "notice_draft") {
  if (aggregateType === "lead") return "/office/leads";
  if (aggregateType === "invoice_draft") return "/office/invoices#new-invoice";
  return "/office/notices/new";
}

function materializedDestination(entityType: string, entityId: string) {
  if (entityType === "lead") return `/office/leads`;
  if (entityType === "invoice") return `/office/invoices/${entityId}`;
  if (entityType === "notice") return `/office/notices/${entityId}`;
  return "/office/desktop-inbox";
}

export default async function OfficeDesktopInboxPage() {
  await requireOfficePermission("settings.manage", "/office/desktop-inbox");
  if (!(await isOfficeDatabaseAvailable())) return <OfficeAccessState kind="storage" />;
  const drafts = await listOfficeDesktopInboxDrafts(200);
  const waiting = drafts.filter((draft) => draft.status === "received").length;

  return (
    <>
      <OfficePageHeader
        eyebrow="Control / Native intake"
        title="Desktop work reaches a visible review inbox."
        description="A native sync acknowledgement means the encrypted device request reached this server register. It does not issue a number, post money, change a balance, or send a notification. Authorised staff must review and continue through the relevant server workflow."
        meta={<span className="office-record-count">{waiting} awaiting review</span>}
      />

      <div className="office-alert office-alert--warning" role="note">
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>Server received is not the same as official.</strong>
          <p>Invoice, notice, receipt and payment authority stays behind the existing approval, numbering, posting and delivery controls.</p>
        </div>
      </div>

      {drafts.length === 0 ? (
        <OfficeEmptyState
          icon={Inbox}
          title="No native drafts have reached the server inbox."
          description="Pair an authorised Windows device and sync an eligible lead, invoice draft, or notice draft. Local payment acknowledgements remain on the device."
          action={<Link className="office-button" href="/office/settings">Open device settings</Link>}
        />
      ) : (
        <div className="office-table-wrap">
          <table className="office-table">
            <thead><tr><th>Draft</th><th>Source</th><th>Received</th><th>Status</th><th>Review path</th></tr></thead>
            <tbody>{drafts.map((draft) => (
              <tr key={draft.aggregateId}>
                <td>
                  <strong>{titleFor(draft.aggregateType, draft.payload)}</strong>
                  <small>{draft.aggregateType.replaceAll("_", " ")} · {detailFor(draft.aggregateType, draft.payload)}</small>
                  <details>
                    <summary>Validated source payload</summary>
                    <pre className="office-code-block">{JSON.stringify(draft.payload, null, 2)}</pre>
                  </details>
                </td>
                <td><span><Laptop aria-hidden="true" /> {draft.sourceDeviceName}</span><small>{draft.createdByName} · {draft.createdByEmail}</small></td>
                <td>{formatOfficeDate(draft.acceptedAt)}<small>Client {formatOfficeDate(draft.clientCreatedAt)}</small></td>
                <td><OfficeStatusBadge status={draft.status} /></td>
                <td>
                  {draft.materializedEntityId ? (
                    <Link href={materializedDestination(draft.materializedEntityType ?? "", draft.materializedEntityId)}>Open server record <ArrowUpRight aria-hidden="true" /></Link>
                  ) : (
                    <Link href={destinationFor(draft.aggregateType)}>Continue controlled workflow <ArrowUpRight aria-hidden="true" /></Link>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
