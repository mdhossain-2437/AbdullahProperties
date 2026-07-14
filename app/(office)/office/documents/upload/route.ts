import { getAuthorizedOfficeActor } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import {
  OFFICE_DOCUMENT_MAX_BYTES,
  officeDocumentUploadMetadataSchema,
  OfficeDocumentValidationError,
  type OfficeDocumentUploadField,
  type OfficeDocumentUploadResponse,
  type OfficeUploadFile,
} from "@/features/office/storage-policy";
import { OfficeStorageError, storeOfficeDocument } from "@/features/office/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_MULTIPART_REQUEST_BYTES = OFFICE_DOCUMENT_MAX_BYTES + 1024 * 1024;

function uploadResponse(
  body: OfficeDocumentUploadResponse,
  status: 201 | 400 | 403 | 413 | 415 | 503,
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; sandbox",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

function uploadFile(value: FormDataEntryValue | null): OfficeUploadFile | null {
  return value && typeof value !== "string" ? value : null;
}

function metadataFieldErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): Partial<Record<OfficeDocumentUploadField, string>> {
  const errors: Partial<Record<OfficeDocumentUploadField, string>> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "");
    if (
      (field === "entityType" || field === "entityId" || field === "classification") &&
      !errors[field]
    ) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

export async function POST(request: Request): Promise<Response> {
  const actor = await getAuthorizedOfficeActor();
  if (!actor || !hasOfficePermission(actor.role, "documents.write")) {
    return uploadResponse(
      { status: "error", message: "An authorized office role is required to upload documents." },
      403,
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    return uploadResponse(
      { status: "error", message: "Document uploads require multipart form data." },
      415,
    );
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_REQUEST_BYTES) {
    return uploadResponse(
      { status: "error", message: "The upload request is too large. Documents must be 8 MiB or smaller." },
      413,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.warn("Office document multipart parsing failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return uploadResponse(
      { status: "error", message: "The upload request could not be read." },
      400,
    );
  }

  const metadata = officeDocumentUploadMetadataSchema.safeParse({
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
    classification: formData.get("classification"),
  });
  if (!metadata.success) {
    return uploadResponse(
      {
        status: "error",
        message: "Review the document link and classification.",
        fieldErrors: metadataFieldErrors(metadata.error.issues),
      },
      400,
    );
  }

  const file = uploadFile(formData.get("file"));
  if (!file) {
    return uploadResponse(
      {
        status: "error",
        message: "Choose a PDF, JPEG, or PNG document.",
        fieldErrors: { file: "Choose a document before uploading." },
      },
      400,
    );
  }

  try {
    const document = await storeOfficeDocument({ ...metadata.data, file }, actor);
    return uploadResponse(
      {
        status: "success",
        message: `${document.originalFilename} was stored privately and is awaiting review.`,
        documentId: document.id,
      },
      201,
    );
  } catch (error) {
    if (error instanceof OfficeDocumentValidationError) {
      return uploadResponse(
        { status: "error", message: error.message, fieldErrors: { file: error.message } },
        400,
      );
    }

    console.error("Office document upload failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: error instanceof OfficeStorageError ? error.code : "unexpected_error",
    });
    return uploadResponse(
      {
        status: "error",
        message:
          error instanceof OfficeStorageError && error.code === "files_binding_unavailable"
            ? "Private document storage is not configured yet. No document was saved."
            : "The document could not be saved. No partial metadata record was kept.",
      },
      503,
    );
  }
}
