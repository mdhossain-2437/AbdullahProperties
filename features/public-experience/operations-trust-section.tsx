import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { trustPrinciples } from "@/features/public-experience/data";
import type { PublicExperienceLink, TrustPrinciple } from "@/features/public-experience/types";
import styles from "@/features/public-experience/public-experience.module.css";

type OperationsTrustSectionProps = {
  id?: string;
  title?: string;
  description?: string;
  principles?: readonly TrustPrinciple[];
  link?: PublicExperienceLink;
};

export function OperationsTrustSection({
  id,
  title = "Trust grows when the decision record stays visible.",
  description = "A useful property process distinguishes evidence from assumptions, names the responsible decision, and keeps unresolved questions visible instead of converting them into claims.",
  principles = trustPrinciples,
  link = { href: "/process", label: "Review the published process" },
}: OperationsTrustSectionProps) {
  return (
    <section className={styles.sectionDark} id={id}>
      <div className={styles.shell}>
        <div className={styles.trustHeader}>
          <div>
            <span className={styles.sectionEyebrow}>Public operations standard</span>
            <h2 className={styles.sectionTitle}>{title}</h2>
          </div>
          <p>{description}</p>
        </div>
        <div className={styles.trustGrid}>
          {principles.map((principle) => (
            <article className={styles.trustItem} key={principle.id}>
              <span className={styles.trustIndex}>{principle.id}</span>
              <h3>{principle.title}</h3>
              <p>{principle.summary}</p>
            </article>
          ))}
        </div>
        <div className={styles.trustNote}>
          <ShieldCheck aria-hidden="true" />
          <span>
            This is a decision and communication standard, not evidence of ownership, approval, availability, price, specification, timing, ranking, or performance. Confirm material claims directly and use qualified professional review where required.
          </span>
          <Link className={styles.textLink} href={link.href}>
            {link.label} <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
