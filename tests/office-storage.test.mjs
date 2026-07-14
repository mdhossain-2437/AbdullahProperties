import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createOfficeDocumentObjectKey,
  createPrivateDocumentHeaders,
  OFFICE_DOCUMENT_MAX_BYTES,
  validateOfficeDocumentFile,
} from "../features/office/storage-policy.ts";

function uploadFile(bytes, name, type, declaredSize = bytes.byteLength) {
  return {
    name,
    type,
    size: declaredSize,
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    },
  };
}

const fixtures = [
  {
    name: "agreement.pdf",
    type: "application/pdf",
    bytes: new TextEncoder().encode("%PDF-1.7\nminimal-test-document"),
    canonicalExtension: "pdf",
  },
  {
    name: "site-photo.jpeg",
    type: "image/jpeg",
    bytes: Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
    canonicalExtension: "jpg",
  },
  {
    name: "survey.png",
    type: "image/png",
    bytes: Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
    canonicalExtension: "png",
  },
];

test("allows only signature-matched PDF, JPEG, and PNG documents", async () => {
  for (const fixture of fixtures) {
    const validated = await validateOfficeDocumentFile(
      uploadFile(fixture.bytes, fixture.name, fixture.type),
    );
    assert.equal(validated.mimeType, fixture.type);
    assert.equal(validated.extension, fixture.canonicalExtension);
    assert.match(validated.checksumSha256, /^[a-f0-9]{64}$/);
    assert.equal(validated.sizeBytes, fixture.bytes.byteLength);
  }

  await assert.rejects(
    validateOfficeDocumentFile(
      uploadFile(Uint8Array.from([0x47, 0x49, 0x46]), "animation.gif", "image/gif"),
    ),
    (error) => error?.code === "mime_not_allowed",
  );
  await assert.rejects(
    validateOfficeDocumentFile(
      uploadFile(fixtures[2].bytes, "forged.pdf", "application/pdf"),
    ),
    (error) => error?.code === "signature_mismatch",
  );
  await assert.rejects(
    validateOfficeDocumentFile(
      uploadFile(fixtures[0].bytes, "wrong.png", "application/pdf"),
    ),
    (error) => error?.code === "extension_mismatch",
  );
});

test("rejects empty and oversized uploads before reading their bodies", async () => {
  let bodyRead = false;
  const oversized = {
    name: "large.pdf",
    type: "application/pdf",
    size: OFFICE_DOCUMENT_MAX_BYTES + 1,
    async arrayBuffer() {
      bodyRead = true;
      return new ArrayBuffer(0);
    },
  };

  await assert.rejects(
    validateOfficeDocumentFile(oversized),
    (error) => error?.code === "file_too_large",
  );
  assert.equal(bodyRead, false);
  await assert.rejects(
    validateOfficeDocumentFile(uploadFile(new Uint8Array(), "empty.pdf", "application/pdf")),
    (error) => error?.code === "file_empty",
  );
});

test("creates opaque, randomized, date-partitioned R2 object keys", () => {
  const now = new Date("2026-07-14T12:00:00.000Z");
  const first = createOfficeDocumentObjectKey("project", "application/pdf", now);
  const second = createOfficeDocumentObjectKey("project", "application/pdf", now);
  assert.notEqual(first, second);
  assert.match(
    first,
    /^office\/2026\/07\/project\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$/,
  );
  assert.equal(first.includes("agreement"), false);

  assert.equal(
    createOfficeDocumentObjectKey(
      "invoice",
      "image/png",
      now,
      "11111111-1111-4111-8111-111111111111",
    ),
    "office/2026/07/invoice/11111111-1111-4111-8111-111111111111.png",
  );
});

test("builds private attachment-only download headers", () => {
  const headers = createPrivateDocumentHeaders({
    filename: "জমির দলিল.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2_048,
  });
  assert.match(headers.get("content-disposition") ?? "", /^attachment;/);
  assert.match(headers.get("content-disposition") ?? "", /filename\*=UTF-8''/);
  assert.equal(headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(headers.get("content-type"), "application/pdf");
  assert.equal(headers.get("content-length"), "2048");
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("cross-origin-resource-policy"), "same-origin");
  assert.match(headers.get("content-security-policy") ?? "", /sandbox/);
  assert.doesNotMatch(headers.get("content-disposition") ?? "", /[\r\n]/);
});

test("wires FILES, permission checks, cleanup, audit, and visible form states", async () => {
  const [hosting, worker, storage, uploadRoute, downloadRoute, form] = await Promise.all([
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../features/office/storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/(office)/office/documents/upload/route.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../app/(office)/office/documents/[id]/download/route.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../components/office/document-upload-form.tsx", import.meta.url), "utf8"),
  ]);

  assert.equal(JSON.parse(hosting).r2, "FILES");
  assert.match(worker, /FILES: R2Bucket/);
  assert.match(storage, /assertOfficePermission\(actor, "documents\.write"\)/);
  assert.match(storage, /export async function listOfficeDocuments/);
  assert.match(storage, /assertOfficePermission\(actor, "documents\.read"\)/);
  assert.match(storage, /document\.archived_at IS NULL/);
  assert.match(storage, /LIMIT \? OFFSET \?/);
  assert.match(storage, /database\.batch\(/);
  assert.match(storage, /"document\.uploaded"/);
  assert.match(storage, /await bucket\.delete\(objectKey\)/);
  assert.match(uploadRoute, /hasOfficePermission\(actor\.role, "documents\.write"\)/);
  assert.match(uploadRoute, /MAX_MULTIPART_REQUEST_BYTES/);
  assert.match(uploadRoute, /await request\.formData\(\)/);
  assert.match(downloadRoute, /hasOfficePermission\(actor\.role, "documents\.read"\)/);
  assert.match(downloadRoute, /createPrivateDocumentHeaders/);
  assert.match(form, /fetch\(form\.action/);
  assert.match(form, /Upload in progress/);
  assert.match(form, /role=\{state\.status === "error" \? "alert" : "status"\}/);
  assert.match(form, /No document selected/);
});
