import type { CSSProperties } from "react";
import type { ProcessPhase } from "@/features/public-experience/types";
import styles from "@/features/public-experience/public-experience.module.css";

type StickyProcessStoryProps = {
  eyebrow: string;
  title: string;
  description: string;
  phases: readonly ProcessPhase[];
  note?: string;
};

type StackingStyle = CSSProperties & { "--stack-offset": string };

export function StickyProcessStory({ eyebrow, title, description, phases, note }: StickyProcessStoryProps) {
  return (
    <section className={styles.section}>
      <div className={`${styles.shell} ${styles.processLayout}`}>
        <div className={styles.processAside}>
          <span className={styles.sectionEyebrow}>{eyebrow}</span>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p>{description}</p>
          {note ? <small className={styles.processAsideNote}>{note}</small> : null}
        </div>
        <ol className={styles.processList}>
          {phases.map((phase, index) => {
            const stackingStyle: StackingStyle = {
              "--stack-offset": `${index * 10}px`,
              zIndex: index + 1,
            };

            return (
              <li className={styles.processCard} key={phase.id} style={stackingStyle}>
                <article>
                  <div className={styles.processCardTop}>
                    <span className={styles.processCardIndex}>{phase.id}</span>
                    <span className={styles.sectionEyebrow}>{phase.eyebrow}</span>
                  </div>
                  <h3>{phase.title}</h3>
                  <p className={styles.processCardSummary}>{phase.summary}</p>
                  <dl className={styles.processEvidenceGrid}>
                    <div className={styles.processEvidenceItem}>
                      <dt>Evidence</dt>
                      <dd>{phase.evidence}</dd>
                    </div>
                    <div className={styles.processEvidenceItem}>
                      <dt>Responsibility</dt>
                      <dd>{phase.responsibility}</dd>
                    </div>
                    <div className={styles.processEvidenceItem}>
                      <dt>Decision gate</dt>
                      <dd>{phase.decisionGate}</dd>
                    </div>
                    <div className={styles.processEvidenceItem}>
                      <dt>Expected next step</dt>
                      <dd>{phase.nextStep}</dd>
                    </div>
                  </dl>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

