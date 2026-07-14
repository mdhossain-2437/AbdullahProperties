import { notFound } from "next/navigation";
import { CmsAccessState } from "@/features/cms/access-state";
import { getCmsPageSession } from "@/features/cms/auth";
import { ContentForm } from "@/features/cms/content-form";
import { getContentEntry, listContentRevisions } from "@/features/cms/repository";

type EditContentPageProps = { params: Promise<{ id: string }> };

export default async function EditContentPage({ params }: EditContentPageProps) {
  const { id } = await params;
  return <Editor id={id} />;
}

async function Editor({ id }: { id: string }) {
  const session = await getCmsPageSession(`/studio/content/${id}`);
  if (!session.authorized) return <main className="studio-page"><div className="studio-shell"><CmsAccessState configured={session.configured} email={session.user.email} /></div></main>;
  const [entry, revisions] = await Promise.all([getContentEntry(id), listContentRevisions(id)]);
  if (!entry) notFound();

  return <main className="studio-page"><div className="studio-shell studio-editor"><header><span className="eyebrow">Content Studio / {entry.type.replace("_", " ")}</span><h1>Edit revision {entry.version}.</h1><p>Saving creates a new immutable revision. If another editor saves first, this form will reject the stale version instead of overwriting it.</p></header><ContentForm entry={entry} role={session.role!} /><section className="studio-history"><div><span className="eyebrow">Audit history</span><h2>{revisions.length} immutable revision{revisions.length === 1 ? "" : "s"}</h2></div><ol>{revisions.map((revision) => <li key={revision.id}><strong>v{revision.version}</strong><span>{new Date(revision.createdAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" })}</span><span>{revision.actorEmail}</span></li>)}</ol></section></div></main>;
}
