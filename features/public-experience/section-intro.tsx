import styles from "@/features/public-experience/public-experience.module.css";

type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionIntro({ eyebrow, title, description }: SectionIntroProps) {
  return (
    <div className={styles.sectionIntroGrid}>
      <span className={styles.sectionEyebrow}>{eyebrow}</span>
      <div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionDescription}>{description}</p>
      </div>
    </div>
  );
}

