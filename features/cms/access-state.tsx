import Link from "next/link";
import { LockKeyhole } from "lucide-react";

type AccessStateProps = { configured: boolean; email: string };

export function CmsAccessState({ configured, email }: AccessStateProps) {
  return (
    <div className="studio-state">
      <LockKeyhole aria-hidden="true" />
      <span className="eyebrow">CMS authorization</span>
      <h1>{configured ? "This account is not an approved editor or owner." : "The CMS allowlists are not configured."}</h1>
      <p>Signed in as <strong>{email}</strong>. CMS access is fail-closed and requires this address in server-side <code>CMS_ALLOWED_EMAILS</code> for editing or <code>CMS_OWNER_EMAILS</code> for approval and publishing.</p>
      <Link className="studio-button" href="/">Return to the public site</Link>
    </div>
  );
}
