import { getD1 } from "@/db";
import {
  assertOfficePermission,
  type AuthorizedOfficeActor,
} from "@/features/office/auth";
import {
  createOfficeDocumentObjectKey,
  officeDocumentClassificationSchema,
  officeDocumentEntityTypeSchema,
  officeDocumentMimeTypeSchema,
  officeDocumentUploadMetadataSchema,
  validateOfficeDocumentFile,
  type OfficeDocumentClassification,
  type OfficeDocumentEntityType,
  type OfficeDocumentMimeType,
  type OfficeDocumentUploadMetadata,
  type OfficeUploadFile,
} from "@/features/office/storage-policy";
import { z } from "zod";

type OfficeStorageBindings = {
  FILES?: R2Bucket;
};

type OfficeDocumentRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  object_key: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  checksum_sha256: string;
  classification: string;
  visibility: string;
  review_status: string;
  revision: number;
  uploaded_by_member_id: string | null;
  created_at: string;
  updated_at: string;
};

type OfficeDocumentListRow = Omit<OfficeDocumentRow, "object_key"> & {
  uploaded_by_name: string | null;
};

export type StoredOfficeDocument = Readonly<{
  id: string;
  entityType: OfficeDocumentEntityType;
  entityId: string;
  objectKey: string;
  originalFilename: string;
  mimeType: OfficeDocumentMimeType;
  sizeBytes: number;
  checksumSha256: string;
  classification: OfficeDocumentClassification;
  visibility: "private" | "restricted";
  reviewStatus: "pending" | "reviewed" | "rejected" | "expired";
  revision: number;
  uploadedByMemberId: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type OfficeDocumentUploadInput = OfficeDocumentUploadMetadata & {
  file: OfficeUploadFile;
};

export type OfficeDocumentDownload = Readonly<{
  metadata: StoredOfficeDocument;
  object: R2ObjectBody;
}>;

export type OfficeDocumentListItem = Readonly<
  Omit<StoredOfficeDocument, "objectKey"> & {
    uploadedByName: string | null;
  }
>;

export type ListOfficeDocumentsOptions = Readonly<{
  query?: string;
  entityType?: OfficeDocumentEntityType;
  classification?: OfficeDocumentClassification;
  reviewStatus?: "pending" | "reviewed" | "rejected" | "expired";
  limit?: number;
  offset?: number;
}>;

export type OfficeStorageErrorCode =
  | "files_binding_unavailable"
  | "object_write_failed"
  | "metadata_write_failed"
  | "metadata_cleanup_failed"
  | "document_not_found"
  | "object_missing"
  | "object_integrity_failed";

export class OfficeStorageError extends Error {
  readonly code: OfficeStorageErrorCode;
  readonly status: 404 | 503;

  constructor(
    code: OfficeStorageErrorCode,
    message: string,
    status: 404 | 503,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "OfficeStorageError";
    this.code = code;
    this.status = status;
  }
}

const storedOfficeDocumentSchema = z.strictObject({
  id: z.string().uuid(),
  entityType: officeDocumentEntityTypeSchema,
  entityId: z.string().uuid(),
  objectKey: z.string().min(1).max(1_024),
  originalFilename: z.string().min(1).max(240),
  mimeType: officeDocumentMimeTypeSchema,
  sizeBytes: z.number().int().positive().safe(),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
  classification: officeDocumentClassificationSchema,
  visibility: z.enum(["private", "restricted"]),
  reviewStatus: z.enum(["pending", "reviewed", "rejected", "expired"]),
  revision: z.number().int().positive(),
  uploadedByMemberId: z.string().uuid().nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

const officeDocumentReviewStatusSchema = z.enum(["pending", "reviewed", "rejected", "expired"]);

const listOfficeDocumentsOptionsSchema = z.strictObject({
  query: z.string().trim().max(120).optional(),
  entityType: officeDocumentEntityTypeSchema.optional(),
  classification: officeDocumentClassificationSchema.optional(),
  reviewStatus: officeDocumentReviewStatusSchema.optional(),
  limit: z.number().int().min(1).max(200).default(100),
  offset: z.number().int().min(0).max(100_000).default(0),
});

async function getStorageBindings(): Promise<OfficeStorageBindings> {
  try {
    const runtime = await import("cloudflare:workers");
    return runtime.env as unknown as OfficeStorageBindings;
  } catch {
    return {};
  }
}

export async function getOptionalOfficeFilesBucket(): Promise<R2Bucket | null> {
  const bindings = await getStorageBindings();
  return bindings.FILES ?? null;
}

export async function getOfficeFilesBucket(): Promise<R2Bucket> {
  const bucket = await getOptionalOfficeFilesBucket();
  if (!bucket) {
    throw new OfficeStorageError(
      "files_binding_unavailable",
      "The private office document store is unavailable in this runtime.",
      503,
    );
  }
  return bucket;
}

function documentFromRow(row: OfficeDocumentRow): StoredOfficeDocument {
  return storedOfficeDocumentSchema.parse({
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    objectKey: row.object_key,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    checksumSha256: row.checksum_sha256,
    classification: row.classification,
    visibility: row.visibility,
    reviewStatus: row.review_status,
    revision: row.revision,
    uploadedByMemberId: row.uploaded_by_member_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function documentListItemFromRow(row: OfficeDocumentListRow): OfficeDocumentListItem {
  const parsed = storedOfficeDocumentSchema.omit({ objectKey: true }).parse({
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    checksumSha256: row.checksum_sha256,
    classification: row.classification,
    visibility: row.visibility,
    reviewStatus: row.review_status,
    revision: row.revision,
    uploadedByMemberId: row.uploaded_by_member_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
  return { ...parsed, uploadedByName: row.uploaded_by_name };
}

function officeDocumentSearchPattern(query: string): string {
  const escaped = query.toLowerCase().replace(/[\\%_]/g, (character) => `\\${character}`);
  return `%${escaped}%`;
}

export async function listOfficeDocuments(
  actor: AuthorizedOfficeActor,
  options: ListOfficeDocumentsOptions = {},
): Promise<OfficeDocumentListItem[]> {
  assertOfficePermission(actor, "documents.read");
  const parsed = listOfficeDocumentsOptionsSchema.parse(options);
  const conditions = ["document.archived_at IS NULL"];
  const bindings: unknown[] = [];

  if (parsed.query) {
    conditions.push("LOWER(document.original_filename) LIKE ? ESCAPE '\\'");
    bindings.push(officeDocumentSearchPattern(parsed.query));
  }
  if (parsed.entityType) {
    conditions.push("document.entity_type = ?");
    bindings.push(parsed.entityType);
  }
  if (parsed.classification) {
    conditions.push("document.classification = ?");
    bindings.push(parsed.classification);
  }
  if (parsed.reviewStatus) {
    conditions.push("document.review_status = ?");
    bindings.push(parsed.reviewStatus);
  }

  const database = await getD1();
  const result = await database
    .prepare(
      `SELECT
        document.id, document.entity_type, document.entity_id, document.original_filename,
        document.mime_type, document.size_bytes, document.checksum_sha256,
        document.classification, document.visibility, document.review_status,
        document.revision, document.uploaded_by_member_id,
        uploader.display_name AS uploaded_by_name,
        document.created_at, document.updated_at
      FROM office_documents document
      LEFT JOIN office_members uploader ON uploader.id = document.uploaded_by_member_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY document.created_at DESC, document.id DESC
      LIMIT ? OFFSET ?`,
    )
    .bind(...bindings, parsed.limit, parsed.offset)
    .all<OfficeDocumentListRow>();

  return result.results.map(documentListItemFromRow);
}

export async function storeOfficeDocument(
  input: OfficeDocumentUploadInput,
  actor: AuthorizedOfficeActor,
): Promise<StoredOfficeDocument> {
  assertOfficePermission(actor, "documents.write");
  const metadata = officeDocumentUploadMetadataSchema.parse({
    entityType: input.entityType,
    entityId: input.entityId,
    classification: input.classification,
  });
  const [database, bucket] = await Promise.all([getD1(), getOfficeFilesBucket()]);
  const file = await validateOfficeDocumentFile(input.file);
  const documentId = crypto.randomUUID();
  const now = new Date().toISOString();
  const objectKey = createOfficeDocumentObjectKey(metadata.entityType, file.mimeType);

  try {
    const storedObject = await bucket.put(objectKey, file.bytes, {
      onlyIf: { etagDoesNotMatch: "*" },
      httpMetadata: {
        contentType: file.mimeType,
        contentDisposition: "attachment",
      },
      customMetadata: {
        documentId,
        checksumSha256: file.checksumSha256,
      },
      sha256: file.checksumBytes,
    });
    if (!storedObject) {
      throw new Error("The randomized R2 object key unexpectedly collided.");
    }
  } catch (error) {
    throw new OfficeStorageError(
      "object_write_failed",
      "The document bytes could not be written to private storage.",
      503,
      { cause: error },
    );
  }

  const storedDocument: StoredOfficeDocument = {
    id: documentId,
    entityType: metadata.entityType,
    entityId: metadata.entityId,
    objectKey,
    originalFilename: file.originalFilename,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    checksumSha256: file.checksumSha256,
    classification: metadata.classification,
    visibility: "private",
    reviewStatus: "pending",
    revision: 1,
    uploadedByMemberId: actor.memberId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await database.batch([
      database
        .prepare(
          "INSERT INTO office_documents (id, entity_type, entity_id, object_key, original_filename, mime_type, size_bytes, checksum_sha256, classification, visibility, review_status, revision, supersedes_document_id, uploaded_by_member_id, reviewed_by_member_id, review_note, reviewed_at, created_at, updated_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          storedDocument.id,
          storedDocument.entityType,
          storedDocument.entityId,
          storedDocument.objectKey,
          storedDocument.originalFilename,
          storedDocument.mimeType,
          storedDocument.sizeBytes,
          storedDocument.checksumSha256,
          storedDocument.classification,
          storedDocument.visibility,
          storedDocument.reviewStatus,
          storedDocument.revision,
          null,
          storedDocument.uploadedByMemberId,
          null,
          null,
          null,
          now,
          now,
          null,
        ),
      database
        .prepare(
          "INSERT INTO office_audit_events (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata, request_id, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          crypto.randomUUID(),
          actor.memberId,
          actor.email,
          "document.uploaded",
          "office_document",
          storedDocument.id,
          JSON.stringify({
            classification: storedDocument.classification,
            entityType: storedDocument.entityType,
            entityId: storedDocument.entityId,
            mimeType: storedDocument.mimeType,
            sizeBytes: storedDocument.sizeBytes,
            checksumSha256: storedDocument.checksumSha256,
          }),
          null,
          null,
          now,
        ),
    ]);
  } catch (metadataError) {
    try {
      await bucket.delete(objectKey);
    } catch (cleanupError) {
      throw new OfficeStorageError(
        "metadata_cleanup_failed",
        "Document metadata failed and the unreferenced private object could not be removed.",
        503,
        { cause: new AggregateError([metadataError, cleanupError]) },
      );
    }
    throw new OfficeStorageError(
      "metadata_write_failed",
      "Document metadata and audit could not be saved; the uploaded object was removed.",
      503,
      { cause: metadataError },
    );
  }

  return storedDocument;
}

export async function getOfficeDocumentDownload(
  documentId: string,
  actor: AuthorizedOfficeActor,
): Promise<OfficeDocumentDownload> {
  assertOfficePermission(actor, "documents.read");
  const parsedId = z.string().uuid().safeParse(documentId);
  if (!parsedId.success) {
    throw new OfficeStorageError("document_not_found", "The requested document was not found.", 404);
  }

  const [database, bucket] = await Promise.all([getD1(), getOfficeFilesBucket()]);
  const row = await database
    .prepare(
      "SELECT id, entity_type, entity_id, object_key, original_filename, mime_type, size_bytes, checksum_sha256, classification, visibility, review_status, revision, uploaded_by_member_id, created_at, updated_at FROM office_documents WHERE id = ? AND archived_at IS NULL LIMIT 1",
    )
    .bind(parsedId.data)
    .first<OfficeDocumentRow>();
  if (!row) {
    throw new OfficeStorageError("document_not_found", "The requested document was not found.", 404);
  }

  const metadata = documentFromRow(row);
  const object = await bucket.get(metadata.objectKey);
  if (!object) {
    throw new OfficeStorageError(
      "object_missing",
      "The document record exists, but its private object is temporarily unavailable.",
      503,
    );
  }
  if (object.size !== metadata.sizeBytes) {
    throw new OfficeStorageError(
      "object_integrity_failed",
      "The stored object did not match its document metadata.",
      503,
    );
  }

  return { metadata, object };
}
