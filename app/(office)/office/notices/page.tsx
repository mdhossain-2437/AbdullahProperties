import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { listOfficeNotices } from "@/features/office/notices/repository";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeDateTime, humanizeOfficeValue } from "@/features/office/presentation";
import { isOfficeDatabaseAvailable } from "@/features/office/repository";
import type { OfficeNoticeKind, OfficeNoticeStatus } from "@/features/office/types";

export const metadata: Metadata = { title: "Notices | Office OS" };

const kinds = ["general", "payment_reminder", "project_update", "appointment", "handover", "other"] as const satisfies readonly OfficeNoticeKind[];
const statuses = ["draft", "issued", "archived"] as const satisfies readonly OfficeNoticeStatus[];

type NoticeSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asChoice<const T extends readonly string[]>(value: string | undefined, choices: T) {
  return value && choices.includes(value as T[number]) ? value as T[number] : undefined;
}

export default async function OfficeNoticesPage({ searchParams }: { searchParams: NoticeSearchParams }) {
  const actor = await requireOfficePermission("documents.read", "/office/notices");
  if (!(await isOfficeDatabaseAvailable())) return <OfficeAccessState kind="storage" />;

  const params = await searchParams;
  const query = first(params.q)?.trim().toLocaleLowerCase("en").slice(0, 120) || undefined;
  const kind = asChoice(first(params.kind), kinds);
  const status = asChoice(first(params.status), statuses);
  const notices = await listOfficeNotices({ limit: 100 });
  const visibleNotices = notices.filter((notice) => {
    if (kind && notice.kind !== kind) return false;
    if (status && notice.status !== status) return false;
    if (!query) return true;
    return [notice.number, notice.title, notice.contactName, notice.projectName]
      .some((value) => value?.toLocaleLowerCase("en").includes(query));
  });
  const canCreate = hasOfficePermission(actor.role, "documents.write");
  const filtered = Boolean(query || kind || status);

  return (
    <>
      <OfficePageHeader
        eyebrow="Correspondence / Controlled notices"
        title="Words become records only after review."
        description="Draft recipient-aware notices in English or Bangla, issue one immutable version, and hand it off manually with a privacy-preserving verification link."
        meta={<span className="office-record-count">{visibleNotices.length}{notices.length === 100 ? "+" : ""} shown</span>}
        action={canCreate ? <Link className="office-button office-button--accent" href="/office/notices/new"><Plus aria-hidden="true" /> Create notice</Link> : undefined}
      />

      <form className="office-filter-bar" method="get" aria-label="Filter controlled notices">
        <label><span>Search</span><input type="search" name="q" defaultValue={query} maxLength={120} placeholder="Number, title, recipient…" /></label>
        <label><span>Type</span><select name="kind" defaultValue={kind ?? ""}><option value="">All notice types</option>{kinds.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <label><span>Status</span><select name="status" defaultValue={status ?? ""}><option value="">All states</option>{statuses.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <div className="office-filter-bar__actions"><button className="office-button" type="submit"><Search aria-hidden="true" /> Apply</button><Link className="office-button office-button--ghost" href="/office/notices">Clear</Link></div>
      </form>

      {visibleNotices.length > 0 ? (
        <div className="office-table-wrap" role="region" aria-label="Controlled notice register. Scroll horizontally on small screens." tabIndex={0}>
          <table className="office-table">
            <thead><tr><th>Notice</th><th>Recipient</th><th>Project</th><th>Language</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>{visibleNotices.map((notice) => (
              <tr key={notice.id}>
                <td className="office-record-primary"><Link href={`/office/notices/${notice.id}`}><strong>{notice.number ?? `Draft ${notice.id.slice(0, 8)}`}</strong></Link><small>{humanizeOfficeValue(notice.kind)} · {notice.title}</small></td>
                <td>{notice.contactName ?? "General circulation"}</td>
                <td>{notice.projectName ?? "Not linked"}</td>
                <td>{notice.locale === "bn" ? "বাংলা" : "English"}</td>
                <td><OfficeStatusBadge status={notice.status} /></td>
                <td>{formatOfficeDateTime(notice.updatedAt)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <OfficeEmptyState
          icon={FileText}
          title={filtered ? "No notices match these filters." : "Create the first controlled notice."}
          description={filtered ? "Clear or adjust the filters. No notice records were changed." : "Start with a draft, review the recipient and dates, then issue one numbered version when it is ready."}
          action={filtered ? <Link className="office-button" href="/office/notices">Clear filters</Link> : canCreate ? <Link className="office-button" href="/office/notices/new">Create notice</Link> : undefined}
        />
      )}
    </>
  );
}
