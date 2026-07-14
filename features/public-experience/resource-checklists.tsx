import Link from "next/link";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import type { ChecklistResource } from "@/features/public-experience/types";
import styles from "@/features/public-experience/public-experience.module.css";

type ResourceChecklistsProps = {
  resources: readonly ChecklistResource[];
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function ResourceChecklists({
  resources,
  eyebrow = "Decision resources",
  title = "Practical checklists for better property conversations.",
  description = "Open a checklist, adapt it to the actual property or project, and take the unresolved questions into the relevant professional review.",
}: ResourceChecklistsProps) {
  return (
    <section className={styles.section}>
      <div className={styles.shell}>
        <div className={styles.sectionIntroGrid}>
          <span className={styles.sectionEyebrow}>{eyebrow}</span>
          <div>
            <h2 className={styles.sectionTitle}>{title}</h2>
            <p className={styles.sectionDescription}>{description}</p>
          </div>
        </div>
        <div className={styles.resourcesGrid}>
          {resources.map((resource) => (
            <details className={styles.resourceCard} key={resource.id}>
              <summary className={styles.resourceSummary}>
                <span className={styles.resourceIndex}>{resource.id}</span>
                <span>
                  <span className={styles.resourceCategory}>{resource.category}</span>
                  <h3>{resource.title}</h3>
                  <p>{resource.summary}</p>
                </span>
                <span className={styles.resourceToggle} aria-hidden="true"><Plus /></span>
              </summary>
              <div className={styles.resourceBody}>
                <ul className={styles.checklist}>
                  {resource.items.map((item) => (
                    <li key={item}><Check aria-hidden="true" /><span>{item}</span></li>
                  ))}
                </ul>
                <p className={styles.resourceNote}>{resource.note}</p>
                {resource.relatedLink ? (
                  <Link className={styles.textLink} href={resource.relatedLink.href}>
                    {resource.relatedLink.label} <ArrowUpRight aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

