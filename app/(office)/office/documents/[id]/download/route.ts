import { getAuthorizedOfficeActor } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { getOfficeDocumentDownload, OfficeStorageError } from "@/features/office/storage";
import { createPrivateDocumentHeaders } from "@/features/office/storage-policy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DownloadRouteContext = {
  params: Promise<{ id: string }>;
};

function privateErrorResponse(message: string, status: 403 | 404 | 503): Response {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; sandbox",
      "Content-Type": "text/plain; charset=utf-8",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

export async function GET(_request: Request, context: DownloadRouteContext): Promise<Response> {
  const actor = await getAuthorizedOfficeActor();
  if (!actor || !hasOfficePermission(actor.role, "documents.read")) {
    return privateErrorResponse("Office document access is forbidden.", 403);
  }

  const { id } = await context.params;
  try {
    const { metadata, object } = await getOfficeDocumentDownload(id, actor);
    return new Response(object.body, {
      status: 200,
      headers: createPrivateDocumentHeaders({
        filename: metadata.originalFilename,
        mimeType: metadata.mimeType,
        sizeBytes: metadata.sizeBytes,
      }),
    });
  } catch (error) {
    if (error instanceof OfficeStorageError) {
      const message =
        error.code === "document_not_found"
          ? "Office document not found."
          : "Office document storage is temporarily unavailable.";
      return privateErrorResponse(message, error.status);
    }

    console.error("Office document download failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return privateErrorResponse("Office document storage is temporarily unavailable.", 503);
  }
}
