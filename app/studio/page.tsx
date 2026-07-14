import Link from "next/link";
import { ArrowUpRight, Database, FilePenLine, History, Plus, ShieldCheck } from "lucide-react";
import { CmsAccessState } from "@/features/cms/access-state";
import { seedCuratedContentAction } from "@/features/cms/actions";
import { getCmsPageSession } from "@/features/cms/auth";
import { isCmsDatabaseAvailable, listContentEntries } from "@/features/cms/repository";

type StudioPageProps = { searchParams: Promise<{ seeded?: string; access?: string }> };

export default async function StudioPage({ searchParams }: StudioPageProps) {
  const query = await searchParams;
  const session = await getCmsPageSession("/studio");
  if (!session.authorized) return <main className="studio-page"><div className="studio-shell"><CmsAccessState configured={session.configured} email={session.user.email} /></div></main>;

  const databaseAvailable = await isCmsDatabaseAvailable();
  const entries = databaseAvailable ? await listContentEntries() : [];
  const published = entries.filter((entry) => entry.status === "published").length;
  const inReview = entries.filter((entry) => entry.status === "in_review").length;

  return (
    <main className="studio-page">
      <div className="studio-shell">
        <header className="studio-header">
          <div><span className="eyebrow">Abdullah Properties / protected</span><h1>Content Studio</h1><p>Draft, review, verify, publish, and audit low-risk editorial content without exposing company identity or property claims to generic editing.</p></div>
          <div className="studio-header__account"><ShieldCheck aria-hidden="true" /><span>{session.role === "owner" ? "Owner publisher" : "Approved editor"}</span><strong>{session.user.displayName}</strong></div>
        </header>

        {query.seeded === "1" ? <div className="studio-alert studio-alert--success" role="status"><ShieldCheck aria-hidden="true" /><div><strong>Curated content imported</strong><p>Existing insights and area guides are now revisioned CMS entries.</p></div></div> : null}
        {query.access === "owner-required" ? <div className="studio-alert studio-alert--error" role="alert"><ShieldCheck aria-hidden="true" /><div><strong>Owner action required</strong><p>Only an approved owner can import published curated content.</p></div></div> : null}

        {!databaseAvailable ? (
          <section className="studio-state"><Database aria-hidden="true" /><span className="eyebrow">Storage state</span><h2>The D1 binding is unavailable.</h2><p>The editor will not fall back to browser storage. Connect the configured <code>DB</code> binding and apply the checked migration.</p></section>
        ) : (
          <>
            <section className="studio-metrics" aria-label="Content workflow summary">
              <article><span>Entries</span><strong>{entries.length}</strong><Database aria-hidden="true" /></article>
              <article><span>In review</span><strong>{inReview}</strong><FilePenLine aria-hidden="true" /></article>
              <article><span>Published</span><strong>{published}</strong><ShieldCheck aria-hidden="true" /></article>
              <article><span>Revision model</span><strong>Immutable</strong><History aria-hidden="true" /></article>
            </section>

            <section className="studio-collection">
              <div className="studio-collection__head"><div><span className="eyebrow">Editorial collection</span><h2>Structured entries</h2></div><Link className="studio-button studio-button--primary" href="/studio/content/new"><Plus aria-hidden="true" />New entry</Link></div>
              {entries.length === 0 ? (
                <div className="studio-empty"><Database aria-hidden="true" /><h3>No entries yet.</h3><p>{session.role === "owner" ? "Import the curated public insights and area guides as the safe editorial baseline, or create a new draft." : "Create a structured draft and send it to an approved owner when it is ready for publication."}</p><div>{session.role === "owner" ? <form action={seedCuratedContentAction}><button className="studio-button studio-button--primary" type="submit">Import curated content</button></form> : null}<Link className="studio-button" href="/studio/content/new">Create a blank draft</Link></div></div>
              ) : (
                <div className="studio-table" role="table" aria-label="CMS content entries">
                  <div className="studio-table__row studio-table__row--head" role="row"><span role="columnheader">Entry</span><span role="columnheader">Workflow</span><span role="columnheader">Verification</span><span role="columnheader">Revision</span><span role="columnheader">Action</span></div>
                  {entries.map((entry) => <div className="studio-table__row" role="row" key={entry.id}><div role="cell" aria-label={`Entry: ${entry.title}, ${entry.type.replace("_", " ")} / ${entry.slug}`}><strong>{entry.title}</strong><span>{entry.type.replace("_", " ")} / {entry.slug}</span></div><span role="cell" aria-label={`Workflow: ${entry.status.replace("_", " ")}`} data-status={entry.status}>{entry.status.replace("_", " ")}</span><span role="cell" aria-label={`Verification: ${entry.verification.replace("_", " ")}`}>{entry.verification.replace("_", " ")}</span><span role="cell" aria-label={`Revision: ${entry.version}`}>v{entry.version}</span><div role="cell" aria-label={`Actions for ${entry.title}`}><Link href={`/studio/content/${entry.id}`} aria-label={`Edit ${entry.title}`}>Edit <ArrowUpRight aria-hidden="true" /></Link><Link href={`/studio/preview/${entry.id}`} aria-label={`Preview ${entry.title}`}>Preview</Link></div></div>)}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
