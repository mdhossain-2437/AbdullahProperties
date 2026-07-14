import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "@/features/public-experience/public-experience.module.css";

type ClosingConversationProps = {
  title: string;
  description: string;
  href: string;
  label: string;
};

export function ClosingConversation({ title, description, href, label }: ClosingConversationProps) {
  return (
    <section className={styles.pageClosing}>
      <div className={`${styles.shell} ${styles.closingGrid}`}>
        <h2>{title}</h2>
        <div>
          <p>{description}</p>
          <Link className={styles.textLink} href={href}>{label} <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}

