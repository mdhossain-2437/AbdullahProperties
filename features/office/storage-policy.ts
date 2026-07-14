import { z } from "zod";

export const OFFICE_DOCUMENT_MAX_BYTES = 8 * 1024 * 1024;

export const officeDocumentMimeTypeSchema = z.enum([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export const officeDocumentEntityTypeSchema = z.enum([
  "contact",
  "lead",
  "land_parcel",
  "project",
  "invoice",
  "payment",
  "expense",
  "approval",
]);

export const officeDocumentClassificationSchema = z.enum([
  "general",
  "title_deed",
  "mutation",
  "land_tax",
  "agreement",
  "invoice",
  "receipt",
  "expense_receipt",
  "approval",
  "other",
]);

export const officeDocumentUploadMetadataSchema = z.strictObject({
  entityType: officeDocumentEntityTypeSchema,
  entityId: z.string().uuid(),
  classification: officeDocumentClassificationSchema,
});

export type OfficeDocumentMimeType = z.infer<typeof officeDocumentMimeTypeSchema>;
export type OfficeDocumentEntityType = z.infer<typeof officeDocumentEntityTypeSchema>;
export type OfficeDocumentClassification = z.infer<typeof officeDocumentClassificationSchema>;
export type OfficeDocumentUploadMetadata = z.infer<typeof officeDocumentUploadMetadataSchema>;
export type OfficeDocumentUploadField = "entityType" | "entityId" | "classification" | "file";
export type OfficeDocumentUploadResponse = Readonly<{
  status: "error" | "success";
  message: string;
  documentId?: string;
  fieldErrors?: Partial<Record<OfficeDocumentUploadField, string>>;
}>;

export type OfficeUploadFile = Readonly<{
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

export type ValidatedOfficeDocumentFile = Readonly<{
  originalFilename: string;
  mimeType: OfficeDocumentMimeType;
  extension: "pdf" | "jpg" | "png";
  sizeBytes: number;
  bytes: ArrayBuffer;
  checksumSha256: string;
  checksumBytes: ArrayBuffer;
}>;

export type OfficeDocumentValidationCode =
  | "file_required"
  | "file_empty"
  | "file_too_large"
  | "mime_not_allowed"
  | "extension_mismatch"
  | "signature_mismatch";

export class OfficeDocumentValidationError extends Error {
  readonly code: OfficeDocumentValidationCode;

  constructor(code: OfficeDocumentValidationCode, message: string) {
    super(message);
    this.name = "OfficeDocumentValidationError";
    this.code = code;
  }
}

const extensionByMimeType = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const satisfies Record<OfficeDocumentMimeType, "pdf" | "jpg" | "png">;

const acceptedExtensions = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
} as const satisfies Record<OfficeDocumentMimeType, readonly string[]>;

function fileExtension(filename: string): string {
  const separator = filename.lastIndexOf(".");
  return separator >= 0 ? filename.slice(separator + 1).toLowerCase() : "";
}

function hasExpectedSignature(bytes: Uint8Array, mimeType: OfficeDocumentMimeType): boolean {
  if (mimeType === "application/pdf") {
    return (
      bytes.length >= 5 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    );
  }
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

function sanitizedBaseFilename(filename: string): string {
  const leaf = filename.replaceAll("\\", "/").split("/").at(-1) ?? "";
  return Array.from(leaf)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && !(code >= 127 && code <= 159);
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeOfficeDocumentFilename(
  filename: string,
  mimeType: OfficeDocumentMimeType,
): string {
  const extension = extensionByMimeType[mimeType];
  const cleaned = sanitizedBaseFilename(filename);
  const separator = cleaned.lastIndexOf(".");
  const stem = (separator > 0 ? cleaned.slice(0, separator) : cleaned)
    .replace(/["\\]/g, "_")
    .trim()
    .slice(0, 200);
  return `${stem || "document"}.${extension}`;
}

function checksumHex(checksum: ArrayBuffer): string {
  return Array.from(new Uint8Array(checksum), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function validateOfficeDocumentFile(
  file: OfficeUploadFile | null,
): Promise<ValidatedOfficeDocumentFile> {
  if (!file) {
    throw new OfficeDocumentValidationError("file_required", "Choose a PDF, JPEG, or PNG document.");
  }
  if (!Number.isSafeInteger(file.size) || file.size <= 0) {
    throw new OfficeDocumentValidationError("file_empty", "The selected document is empty or invalid.");
  }
  if (file.size > OFFICE_DOCUMENT_MAX_BYTES) {
    throw new OfficeDocumentValidationError("file_too_large", "Documents must be 8 MiB or smaller.");
  }

  const mimeResult = officeDocumentMimeTypeSchema.safeParse(file.type.trim().toLowerCase());
  if (!mimeResult.success) {
    throw new OfficeDocumentValidationError(
      "mime_not_allowed",
      "Only PDF, JPEG, and PNG documents are accepted.",
    );
  }
  const mimeType = mimeResult.data;
  const extension = fileExtension(file.name);
  const extensions: readonly string[] = acceptedExtensions[mimeType];
  if (!extensions.includes(extension)) {
    throw new OfficeDocumentValidationError(
      "extension_mismatch",
      "The filename extension does not match the selected document type.",
    );
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength !== file.size || bytes.byteLength > OFFICE_DOCUMENT_MAX_BYTES) {
    throw new OfficeDocumentValidationError(
      "file_too_large",
      "The uploaded document size did not match its declared size or exceeded 8 MiB.",
    );
  }
  if (!hasExpectedSignature(new Uint8Array(bytes), mimeType)) {
    throw new OfficeDocumentValidationError(
      "signature_mismatch",
      "The document contents do not match its PDF, JPEG, or PNG type.",
    );
  }

  const checksumBytes = await crypto.subtle.digest("SHA-256", bytes);
  return {
    originalFilename: sanitizeOfficeDocumentFilename(file.name, mimeType),
    mimeType,
    extension: extensionByMimeType[mimeType],
    sizeBytes: bytes.byteLength,
    bytes,
    checksumSha256: checksumHex(checksumBytes),
    checksumBytes,
  };
}

export function createOfficeDocumentObjectKey(
  entityType: OfficeDocumentEntityType,
  mimeType: OfficeDocumentMimeType,
  now = new Date(),
  randomId = crypto.randomUUID(),
): string {
  const parsedEntityType = officeDocumentEntityTypeSchema.parse(entityType);
  const parsedMimeType = officeDocumentMimeTypeSchema.parse(mimeType);
  const parsedRandomId = z.string().uuid().parse(randomId);
  const year = String(now.getUTCFullYear()).padStart(4, "0");
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `office/${year}/${month}/${parsedEntityType}/${parsedRandomId}.${extensionByMimeType[parsedMimeType]}`;
}

function rfc5987Value(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function asciiFilenameFallback(value: string): string {
  const fallback = Array.from(value)
    .map((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code <= 126 && character !== '"' && character !== "\\" ? character : "_";
    })
    .join("");
  return fallback || "document";
}

export function createPrivateDocumentHeaders(input: Readonly<{
  filename: string;
  mimeType: OfficeDocumentMimeType;
  sizeBytes: number;
}>): Headers {
  const mimeType = officeDocumentMimeTypeSchema.parse(input.mimeType);
  const sizeBytes = z.number().int().nonnegative().safe().parse(input.sizeBytes);
  const filename = sanitizeOfficeDocumentFilename(input.filename, mimeType);
  const disposition = `attachment; filename="${asciiFilenameFallback(filename)}"; filename*=UTF-8''${rfc5987Value(filename)}`;
  return new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Disposition": disposition,
    "Content-Length": String(sizeBytes),
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; sandbox",
    "Content-Type": mimeType,
    "Cross-Origin-Resource-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Download-Options": "noopen",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });
}
