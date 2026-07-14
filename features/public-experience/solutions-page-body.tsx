import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { ClosingConversation } from "@/features/public-experience/closing-conversation";
import { solutionPaths, solutionRailWords } from "@/features/public-experience/data";
import { KineticWordRail } from "@/features/public-experience/kinetic-word-rail";
import { OperationsTrustSection } from "@/features/public-experience/operations-trust-section";
import { SectionIntro } from "@/features/public-experience/section-intro";
import styles from "@/features/public-experience/public-experience.module.css";

export function SolutionsPageBody() {
  return (
    <>
      <KineticWordRail words={solutionRailWords} label="Abdullah Properties solution paths" />
      <section className={styles.section}>
        <div className={styles.shell}>
          <SectionIntro
            eyebrow="Four starting points"
            title="Choose the decision you need to make clearer."
            description="Each path begins with questions and evidence rather than an assumed property, price, specification, approval, or outcome."
          />
          <div className={styles.solutionGrid}>
            {solutionPaths.map((path) => (
              <article className={styles.solutionCard} key={path.id}>
                <div className={styles.solutionCardMeta}><span>{path.id}</span><span>{path.audience}</span></div>
                <div>
                  <h3>{path.title}</h3>
                  <p>{path.summary}</p>
                  <ul className={styles.solutionQuestions}>
                    {path.questions.map((question) => <li key={question}><Check aria-hidden="true" /><span>{question}</span></li>)}
                  </ul>
                </div>
                <Link className={styles.textLink} href={path.href}>{path.action} <ArrowUpRight aria-hidden="true" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <OperationsTrustSection />
      <ClosingConversation
        title="Not sure which path fits? Prepare the context first."
        description="The local planner organizes your use, location, timeline, priorities, and next questions without sending your entries."
        href="/property-planner"
        label="Open the property planner"
      />
    </>
  );
}

