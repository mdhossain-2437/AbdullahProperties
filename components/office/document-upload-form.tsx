"use client";

import { AlertCircle, CheckCircle2, FileCheck2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type {
  OfficeDocumentClassification,
  OfficeDocumentEntityType,
  OfficeDocumentUploadResponse,
} from "@/features/office/storage-policy";

const OFFICE_DOCUMENT_MAX_BYTES = 8 * 1024 * 1024;

type DocumentUploadFormProps = Readonly<{
  entityType: OfficeDocumentEntityType;
  entityId: string;
  defaultClassification?: OfficeDocumentClassification;
}>;

type DocumentUploadViewState = Readonly<{
  status: "idle" | "loading" | "error" | "success";
  message: string;
  documentId?: string;
  fieldErrors?: OfficeDocumentUploadResponse["fieldErrors"];
}>;

const initialUploadState: DocumentUploadViewState = { status: "idle", message: "" };

const classificationOptions = [
  ["general", "General record"],
  ["title_deed", "Title deed"],
  ["mutation", "Mutation record"],
  ["land_tax", "Land-tax record"],
  ["agreement", "Agreement"],
  ["invoice", "Invoice"],
  ["receipt", "Receipt"],
  ["expense_receipt", "Expense receipt"],
  ["approval", "Approval evidence"],
  ["other", "Other controlled document"],
] as const satisfies readonly (readonly [OfficeDocumentClassification, string])[];

const acceptedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const acceptedExtensions: Readonly<Record<string, readonly string[]>> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
};

function clientFileError(file: File): string | null {
  if (!acceptedMimeTypes.has(file.type)) return "Only PDF, JPEG, and PNG documents are accepted.";
  if (file.size <= 0) return "The selected document is empty.";
  if (file.size > OFFICE_DOCUMENT_MAX_BYTES) return "Documents must be 8 MiB or smaller.";
  const extension = file.name.split(".").at(-1)?.toLowerCase() ?? "";
  if (!acceptedExtensions[file.type]?.includes(extension)) {
    return "The filename extension does not match the selected document type.";
  }
  return null;
}

function isUploadResponse(value: unknown): value is OfficeDocumentUploadResponse {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.status === "error" || candidate.status === "success") &&
    typeof candidate.message === "string" &&
    (candidate.documentId === undefined || typeof candidate.documentId === "string") &&
    (candidate.fieldErrors === undefined ||
      (typeof candidate.fieldErrors === "object" && candidate.fieldErrors !== null))
  );
}

function SubmitDocumentButton({
  disabled,
  loading,
}: Readonly<{ disabled: boolean; loading: boolean }>) {
  return (
    <button className="office-button office-button--accent" type="submit" disabled={loading || disabled}>
      <UploadCloud aria-hidden="true" />
      {loading ? "Uploading privately…" : "Upload document"}
    </button>
  );
}

export function DocumentUploadForm({
  entityType,
  entityId,
  defaultClassification = "general",
}: DocumentUploadFormProps) {
  const router = useRouter();
  const [state, setState] = useState<DocumentUploadViewState>(initialUploadState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "idle") return;
    summaryRef.current?.focus();
  }, [state.documentId, state.status]);

  const fileError = clientError ?? state.fieldErrors?.file ?? null;

  return (
    <form
      action="/office/documents/upload"
      method="post"
      encType="multipart/form-data"
      className="office-form"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        if (!selectedFile || clientError) {
          const message = clientError ?? "Choose a document before uploading.";
          setState({ status: "error", message, fieldErrors: { file: message } });
          return;
        }

        const form = event.currentTarget;
        setState({ status: "loading", message: "Validating and storing the document privately…" });
        try {
          const response = await fetch(form.action, {
            method: "POST",
            body: new FormData(form),
            credentials: "same-origin",
          });
          const payload: unknown = await response.json();
          if (!isUploadResponse(payload)) {
            setState({ status: "error", message: "The upload service returned an invalid response." });
            return;
          }
          setState(payload);
          if (payload.status === "success") {
            form.reset();
            setSelectedFile(null);
            setClientError(null);
            router.refresh();
          }
        } catch (error) {
          console.error("Office document upload request failed.", {
            errorName: error instanceof Error ? error.name : "UnknownError",
          });
          setState({
            status: "error",
            message: "The upload service could not be reached. The document was not saved.",
          });
        }
      }}
    >
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityId" value={entityId} />

      {state.status !== "idle" ? (
        <div
          ref={summaryRef}
          className={`office-alert office-alert--${state.status === "loading" ? "warning" : state.status}`}
          role={state.status === "error" ? "alert" : "status"}
          tabIndex={-1}
        >
          {state.status === "success" ? (
            <CheckCircle2 aria-hidden="true" />
          ) : (
            state.status === "loading" ? <UploadCloud aria-hidden="true" /> : <AlertCircle aria-hidden="true" />
          )}
          <div>
            <strong>
              {state.status === "success"
                ? "Stored privately"
                : state.status === "loading"
                  ? "Upload in progress"
                  : "Upload not completed"}
            </strong>
            <p>{state.message}</p>
            {state.documentId ? (
              <a href={`/office/documents/${state.documentId}/download`}>Download the saved document</a>
            ) : null}
          </div>
        </div>
      ) : null}

      <fieldset className="office-form-section">
        <legend>Private document</legend>
        <div className="office-form-grid">
          <label>
            <span>Classification</span>
            <select
              name="classification"
              defaultValue={defaultClassification}
              aria-invalid={Boolean(state.fieldErrors?.classification)}
              aria-describedby={state.fieldErrors?.classification ? "document-classification-error" : undefined}
            >
              {classificationOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {state.fieldErrors?.classification ? (
              <small id="document-classification-error" className="office-field-error">
                {state.fieldErrors.classification}
              </small>
            ) : null}
          </label>

          <label className="office-field--wide">
            <span>PDF, JPEG, or PNG</span>
            <input
              type="file"
              name="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              aria-invalid={Boolean(fileError)}
              aria-describedby="document-upload-help document-upload-file-state"
              onChange={(event) => {
                const nextFile = event.currentTarget.files?.[0] ?? null;
                setSelectedFile(nextFile);
                setClientError(nextFile ? clientFileError(nextFile) : "Choose a document before uploading.");
                setState(initialUploadState);
              }}
            />
            <small id="document-upload-help">
              Maximum 8 MiB. Contents are signature-checked and stored outside the public asset library.
            </small>
            <small
              id="document-upload-file-state"
              className={fileError ? "office-field-error" : undefined}
              aria-live="polite"
            >
              {fileError ?? (selectedFile ? `${selectedFile.name} is ready for server validation.` : "No document selected.")}
            </small>
          </label>
        </div>
      </fieldset>

      <div className="office-form-actions">
        <span><FileCheck2 aria-hidden="true" /> Private · permission checked · audit recorded</span>
        <SubmitDocumentButton
          disabled={!selectedFile || Boolean(clientError)}
          loading={state.status === "loading"}
        />
      </div>
    </form>
  );
}
