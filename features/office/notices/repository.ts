import { getD1 } from "@/db";
import { createTrackingCode } from "@/features/office/tracking";
import { officeInvoicePartySnapshotSchema } from "@/features/office/types";
import {
  createOfficeAuditEvent,
  prepareOfficeAuditInsert,
  type CreateOfficeNoticeInput,
  type IssueOfficeNoticeInput,
  type OfficeInvoicePartySnapshot,
  type OfficeListOptions,
  type OfficeNoticeView,
  type OfficeRepositoryActor,
} from "@/features/office/repository";

type NoticeRow = {
  id: string;
  number: string | null;
  branch_code: string;
  fiscal_year: string | null;
  sequence_value: number | null;
  kind: OfficeNoticeView["kind"];
  title: string;
  body: string;
  locale: OfficeNoticeView["locale"];
  contact_id: string | null;
  contact_name: string | null;
  project_id: string | null;
  project_name: string | null;
  status: OfficeNoticeView["status"];
  recipient_snapshot: string | null;
  company_snapshot: string;
  issue_date: string | null;
  effective_date: string | null;
  expires_at: string | null;
  tracking_code: string | null;
  tracking_issued_at: string | null;
  public_access_revoked_at: string | null;
  template_version: string;
  issued_by_member_id: string | null;
  issued_at: string | null;
  version: number;
  created_by_email: string;
  updated_by_email: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type ContactSnapshotRow = {
  display_name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
};

const NOTICE_SELECT = `SELECT
  notice.id, notice.number, notice.branch_code, notice.fiscal_year, notice.sequence_value,
  notice.kind, notice.title, notice.body, notice.locale, notice.contact_id,
  contact.display_name AS contact_name, notice.project_id, project.name AS project_name,
  notice.status, notice.recipient_snapshot, notice.company_snapshot, notice.issue_date,
  notice.effective_date, notice.expires_at, notice.tracking_code, notice.tracking_issued_at,
  notice.public_access_revoked_at, notice.template_version, notice.issued_by_member_id,
  notice.issued_at, notice.version, notice.created_by_email, notice.updated_by_email,
  notice.created_at, notice.updated_at, notice.archived_at
FROM office_notices notice
LEFT JOIN office_contacts contact ON contact.id = notice.contact_id
LEFT JOIN office_projects project ON project.id = notice.project_id`;

const SEQUENCE_UPSERT = `INSERT INTO office_sequences
  (id, branch_code, fiscal_year, document_type, current_value, version, updated_at)
VALUES (?, ?, ?, 'notice', 1, 1, ?)
ON CONFLICT(branch_code, fiscal_year, document_type)
DO UPDATE SET current_value = current_value + 1, version = version + 1, updated_at = excluded.updated_at`;

function normalizeBranchCode(value: string | undefined): string {
  const normalized = (value ?? "JOY").trim().toUpperCase();
  if (!/^[A-Z0-9]{2,8}$/.test(normalized)) throw new TypeError("Branch code is invalid.");
  return normalized;
}

function normalizeFiscalYear(value: string): string {
  const normalized = value.trim();
  if (!/^\d{4}$/.test(normalized)) throw new TypeError("Fiscal year must use four digits.");
  return normalized;
}

function normalizeEmail(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized.includes("@") || normalized.length > 320) {
    throw new TypeError("Office actor email is invalid.");
  }
  return normalized;
}

function mapNotice(row: NoticeRow): OfficeNoticeView {
  return {
    id: row.id,
    number: row.number,
    branchCode: row.branch_code,
    fiscalYear: row.fiscal_year,
    sequenceValue: row.sequence_value,
    kind: row.kind,
    title: row.title,
    body: row.body,
    locale: row.locale,
    contactId: row.contact_id,
    contactName: row.contact_name,
    projectId: row.project_id,
    projectName: row.project_name,
    status: row.status,
    recipientSnapshot: row.recipient_snapshot
      ? officeInvoicePartySnapshotSchema.parse(JSON.parse(row.recipient_snapshot))
      : null,
    companySnapshot: officeInvoicePartySnapshotSchema.parse(JSON.parse(row.company_snapshot)),
    issueDate: row.issue_date,
    effectiveDate: row.effective_date,
    expiresAt: row.expires_at,
    trackingCode: row.tracking_code,
    trackingIssuedAt: row.tracking_issued_at,
    publicAccessRevokedAt: row.public_access_revoked_at,
    templateVersion: row.template_version,
    issuedByMemberId: row.issued_by_member_id,
    issuedAt: row.issued_at,
    version: row.version,
    createdByEmail: row.created_by_email,
    updatedByEmail: row.updated_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export async function getOfficeNoticeContactSnapshot(
  contactId: string,
): Promise<OfficeInvoicePartySnapshot | null> {
  const row = await (await getD1())
    .prepare(
      "SELECT display_name, address, email, phone FROM office_contacts WHERE id = ? AND status = 'active' LIMIT 1",
    )
    .bind(contactId)
    .first<ContactSnapshotRow>();
  if (!row) return null;
  return officeInvoicePartySnapshotSchema.parse({
    name: row.display_name,
    address: row.address ?? "Address not recorded",
    email: row.email,
    phone: row.phone,
    taxIdentifier: null,
  });
}

export async function listOfficeNotices(
  options: OfficeListOptions = {},
): Promise<OfficeNoticeView[]> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const offset = Math.min(Math.max(options.offset ?? 0, 0), 100_000);
  const result = await (await getD1())
    .prepare(`${NOTICE_SELECT} ORDER BY notice.updated_at DESC, notice.id DESC LIMIT ? OFFSET ?`)
    .bind(limit, offset)
    .all<NoticeRow>();
  return result.results.map(mapNotice);
}

export async function getOfficeNotice(id: string): Promise<OfficeNoticeView | null> {
  const row = await (await getD1())
    .prepare(`${NOTICE_SELECT} WHERE notice.id = ? LIMIT 1`)
    .bind(id)
    .first<NoticeRow>();
  return row ? mapNotice(row) : null;
}

export async function createOfficeNotice(
  input: CreateOfficeNoticeInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeNoticeView> {
  const database = await getD1();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const actorEmail = normalizeEmail(actor.email);
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 3 || title.length > 180) throw new TypeError("Notice title is invalid.");
  if (body.length < 10 || body.length > 12_000) throw new TypeError("Notice body is invalid.");
  const company = officeInvoicePartySnapshotSchema.parse(input.company);
  const recipient = input.recipient
    ? officeInvoicePartySnapshotSchema.parse(input.recipient)
    : null;
  const snapshot = JSON.stringify({
    id,
    kind: input.kind,
    title,
    body,
    locale: input.locale,
    contactId: input.contactId ?? null,
    projectId: input.projectId ?? null,
    status: "draft",
    issueDate: input.issueDate ?? null,
    effectiveDate: input.effectiveDate ?? null,
    expiresAt: input.expiresAt ?? null,
    version: 1,
  });
  const audit = createOfficeAuditEvent({
    actor,
    action: "notice.created",
    entityType: "notice",
    entityId: id,
    metadata: { kind: input.kind, locale: input.locale, status: "draft" },
    createdAt: now,
  });

  await database.batch([
    database
      .prepare(
        `INSERT INTO office_notices
          (id, number, branch_code, fiscal_year, sequence_value, kind, title, body, locale,
           contact_id, project_id, status, recipient_snapshot, company_snapshot, issue_date,
           effective_date, expires_at, tracking_code, tracking_issued_at,
           public_access_revoked_at, template_version, issued_by_member_id, issued_at, version,
           created_by_email, updated_by_email, created_at, updated_at, archived_at)
         VALUES (?, NULL, 'JOY', NULL, NULL, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, NULL,
                 NULL, NULL, 'ap-notice-v1', NULL, NULL, 1, ?, ?, ?, ?, NULL)`,
      )
      .bind(
        id,
        input.kind,
        title,
        body,
        input.locale,
        input.contactId ?? null,
        input.projectId ?? null,
        recipient ? JSON.stringify(recipient) : null,
        JSON.stringify(company),
        input.issueDate ?? null,
        input.effectiveDate ?? null,
        input.expiresAt ?? null,
        actorEmail,
        actorEmail,
        now,
        now,
      ),
    database
      .prepare(
        "INSERT INTO office_notice_revisions (id, notice_id, version, snapshot, actor_email, created_at) VALUES (?, ?, 1, ?, ?, ?)",
      )
      .bind(crypto.randomUUID(), id, snapshot, actorEmail, now),
    prepareOfficeAuditInsert(database, audit),
  ]);

  const notice = await getOfficeNotice(id);
  if (!notice) throw new Error("Created notice could not be read.");
  return notice;
}

export async function issueOfficeNotice(
  input: IssueOfficeNoticeInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeNoticeView> {
  const database = await getD1();
  const current = await getOfficeNotice(input.noticeId);
  if (!current) throw new Error("Notice was not found.");
  if (current.status !== "draft") throw new Error("Only a draft notice can be issued.");
  if (current.version !== input.expectedVersion) throw new Error("Notice changed before issuing.");
  const branchCode = normalizeBranchCode(input.branchCode);
  const fiscalYear = normalizeFiscalYear(input.fiscalYear);
  const now = new Date().toISOString();
  const nextVersion = current.version + 1;
  const trackingCode = createTrackingCode("ntc");
  const actorEmail = normalizeEmail(actor.email);
  const audit = createOfficeAuditEvent({
    actor,
    action: "notice.issued",
    entityType: "notice",
    entityId: current.id,
    metadata: { fromStatus: "draft", toStatus: "issued", version: nextVersion },
    createdAt: now,
  });

  const results = await database.batch([
    database
      .prepare(SEQUENCE_UPSERT)
      .bind(crypto.randomUUID(), branchCode, fiscalYear, now),
    database
      .prepare(
        `UPDATE office_notices
         SET number = ? || '-NTC-' || ? || '-' || printf('%06d',
               (SELECT current_value FROM office_sequences
                WHERE branch_code = ? AND fiscal_year = ? AND document_type = 'notice')),
             branch_code = ?, fiscal_year = ?,
             sequence_value = (SELECT current_value FROM office_sequences
               WHERE branch_code = ? AND fiscal_year = ? AND document_type = 'notice'),
             status = 'issued', issue_date = COALESCE(issue_date, substr(?, 1, 10)),
             tracking_code = ?, tracking_issued_at = ?, issued_by_member_id = ?, issued_at = ?,
             version = ?, updated_by_email = ?, updated_at = ?
         WHERE id = ? AND status = 'draft' AND version = ? AND number IS NULL
           AND sequence_value IS NULL AND tracking_code IS NULL`,
      )
      .bind(
        branchCode,
        fiscalYear,
        branchCode,
        fiscalYear,
        branchCode,
        fiscalYear,
        branchCode,
        fiscalYear,
        now,
        trackingCode,
        now,
        actor.memberId,
        now,
        nextVersion,
        actorEmail,
        now,
        current.id,
        current.version,
      ),
    database
      .prepare(
        `INSERT INTO office_notice_revisions (id, notice_id, version, snapshot, actor_email, created_at)
         SELECT ?, id, version,
                json_object('id', id, 'number', number, 'kind', kind, 'title', title, 'body', body,
                            'locale', locale, 'status', status, 'issueDate', issue_date,
                            'effectiveDate', effective_date, 'expiresAt', expires_at, 'version', version),
                ?, ?
         FROM office_notices WHERE id = ? AND status = 'issued' AND version = ?`,
      )
      .bind(crypto.randomUUID(), actorEmail, now, current.id, nextVersion),
    database
      .prepare(
        `INSERT INTO office_audit_events
          (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata,
           request_id, ip_hash, created_at)
         VALUES (
           ?, ?, ?, ?, 'notice', ?,
           (SELECT json_object('number', number, 'fromStatus', 'draft', 'toStatus', status,
                               'version', version)
            FROM office_notices WHERE id = ? AND status = 'issued' AND version = ?),
           ?, ?, ?
         )`,
      )
      .bind(
        audit.id,
        audit.actorMemberId,
        audit.actorEmail,
        audit.action,
        current.id,
        current.id,
        nextVersion,
        audit.requestId,
        audit.ipHash,
        audit.createdAt,
      ),
  ]);

  if (results[1].meta.changes !== 1 || results[2].meta.changes !== 1) {
    throw new Error("Notice changed before issuing completed.");
  }
  const notice = await getOfficeNotice(current.id);
  if (!notice) throw new Error("Issued notice could not be read.");
  return notice;
}
