"use client";

import { FileUp } from "lucide-react";
import { useState } from "react";
import { DocumentUploadForm } from "@/components/office/document-upload-form";
import type { OfficeDocumentEntityType } from "@/features/office/storage-policy";

export type OfficeDocumentTarget = Readonly<{
  entityType: OfficeDocumentEntityType;
  entityId: string;
  label: string;
  context: string;
}>;

export function OfficeDocumentUploadSelector({
  targets,
}: Readonly<{ targets: readonly OfficeDocumentTarget[] }>) {
  const [selectedKey, setSelectedKey] = useState("");
  const selectedTarget = targets.find(
    (target) => `${target.entityType}:${target.entityId}` === selectedKey,
  );

  if (targets.length === 0) {
    return (
      <div className="office-alert office-alert--warning" role="status">
        <FileUp aria-hidden="true" />
        <div>
          <strong>No eligible record is available for an attachment.</strong>
          <p>Create or obtain access to a contact, lead, land file, project, invoice, payment, expense, or approval before uploading evidence.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="office-form">
      <fieldset className="office-form-section">
        <legend>Attach to an office record</legend>
        <p className="office-form-section__note">
          Choose the record that gives this document its retention and access context. The private object is never placed in the public media library.
        </p>
        <div className="office-form-grid">
          <label className="office-field--wide">
            <span>Office record</span>
            <select value={selectedKey} onChange={(event) => setSelectedKey(event.currentTarget.value)}>
              <option value="">Choose a record</option>
              {targets.map((target) => {
                const key = `${target.entityType}:${target.entityId}`;
                return <option key={key} value={key}>{target.label} · {target.context}</option>;
              })}
            </select>
          </label>
        </div>
      </fieldset>

      {selectedTarget ? (
        <DocumentUploadForm
          key={selectedKey}
          entityType={selectedTarget.entityType}
          entityId={selectedTarget.entityId}
        />
      ) : (
        <div className="office-alert office-alert--warning" role="status">
          <FileUp aria-hidden="true" />
          <div><strong>Choose a record to continue.</strong><p>The upload controls appear only after the attachment context is explicit.</p></div>
        </div>
      )}
    </div>
  );
}
