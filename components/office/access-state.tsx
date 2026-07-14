import Link from "next/link";
import { Database, LockKeyhole, ShieldAlert } from "lucide-react";

type OfficeAccessStateProps =
  | { kind: "denied"; email: string }
  | { kind: "storage"; email?: string }
  | { kind: "permission"; permission: string };

export function OfficeAccessState(props: OfficeAccessStateProps) {
  const Icon = props.kind === "storage" ? Database : props.kind === "permission" ? ShieldAlert : LockKeyhole;
  const title = props.kind === "storage"
    ? "The office database is not ready."
    : props.kind === "permission"
      ? "This workspace area needs another role."
      : "This account is not an office member.";
  const description = props.kind === "storage"
    ? "The protected interface will not fall back to browser storage or pretend a record was saved. Apply the checked office migration before operational use."
    : props.kind === "permission"
      ? `Your current role does not include ${props.permission}. Ask an owner to review the membership rather than sharing credentials.`
      : `Authentication succeeded for ${props.email}, but Abdullah Properties has not granted this account an active office role.`;

  return (
    <main className="office-gate">
      <section>
        <Icon aria-hidden="true" />
        <span className="office-eyebrow">Protected operations</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div><Link className="office-button" href="/">Return to the public website</Link><Link className="office-button office-button--ghost" href="/signout-with-chatgpt?return_to=/">Sign out</Link></div>
      </section>
    </main>
  );
}

