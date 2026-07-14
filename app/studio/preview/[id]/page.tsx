import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CmsAccessState } from "@/features/cms/access-state";
import { getCmsPageSession } from "@/features/cms/auth";
import { getContentEntry } from "@/features/cms/repository";

type PreviewPageProps = { params: Promise<{ id: string }> };

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  return <Preview id={id} />;
}

async function Preview({ id }: { id: string }) {
  const session = await getCmsPageSession(`/studio/preview/${id}`);
  if (!session.authorized) return <main className="studio-page"><div className="studio-shell"><CmsAccessState configured={session.configured} email={session.user.email} /></div></main>;
  const entry = await getContentEntry(id);
  if (!entry) notFound();

  return <main className="studio-preview"><div className="studio-preview__bar"><span>Protected preview / {entry.status.replace("_", " ")} / v{entry.version}</span><Link href={`/studio/content/${entry.id}`}><ArrowLeft aria-hidden="true" />Return to editor</Link></div><article><header><span className="eyebrow">{entry.type.replace("_", " ")} / {entry.verification.replace("_", " ")}</span><h1>{entry.title}</h1><p>{entry.excerpt}</p></header><div className="studio-preview__body">{entry.payload.sections.map((section, index) => <section key={`${section.heading}-${index}`}><span>0{index + 1}</span><div><h2>{section.heading}</h2><p>{section.body}</p></div></section>)}</div></article></main>;
}
