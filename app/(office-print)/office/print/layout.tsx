import type { Metadata } from "next";
import styles from "./print-layout.module.css";

export const metadata: Metadata = {
  title: "Protected document | Office OS",
  description: "Authorized Abdullah Properties office document view.",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function OfficePrintLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={styles.surface}><main className={styles.content}>{children}</main></div>;
}
