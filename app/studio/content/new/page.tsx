import { CmsAccessState } from "@/features/cms/access-state";
import { getCmsPageSession } from "@/features/cms/auth";
import { ContentForm } from "@/features/cms/content-form";

export default async function NewContentPage() {
  const session = await getCmsPageSession("/studio/content/new");
  if (!session.authorized) return <main className="studio-page"><div className="studio-shell"><CmsAccessState configured={session.configured} email={session.user.email} /></div></main>;

  return <main className="studio-page"><div className="studio-shell studio-editor"><header><span className="eyebrow">Content Studio / new</span><h1>Start a structured draft.</h1><p>New entries cannot publish immediately. Save a draft or send it to review, then verify the facts before publication.</p></header><ContentForm role={session.role!} /></div></main>;
}
