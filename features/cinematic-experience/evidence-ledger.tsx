import Link from "next/link";
import { ArrowUpRight, Check, CircleHelp, FileSearch } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import styles from "@/features/cinematic-experience/home-experience.module.css";

const ledgerRows = [
  {
    id: "published",
    label: "Published",
    title: "What the public record currently says",
    icon: Check,
    items: ["Project name: Nirapad Nibas", "Published locality: Dhanmondi, Joypurhat", "Abdullah Properties is the published company contact"],
  },
  {
    id: "confirm",
    label: "Must confirm",
    title: "What still needs direct evidence",
    icon: CircleHelp,
    items: ["Ownership, plans, specifications, and approvals", "Current construction status, pricing, and availability", "Commercial terms, responsibilities, and delivery timing"],
  },
  {
    id: "next",
    label: "Next useful step",
    title: "Turn uncertainty into a reviewable question",
    icon: FileSearch,
    items: ["Name the claim you need to rely on", "Request the relevant current record", "Use qualified legal or technical review where required"],
  },
] as const;

export function EvidenceLedger() {
  return (
    <section className={styles.evidenceLedger} aria-labelledby="evidence-ledger-title">
      <div className={styles.experienceShell}>
        <div className={styles.evidenceGrid}>
          <div className={styles.evidenceIntro}>
            <span className={styles.eyebrow}>Nirapad Nibas / Evidence ledger</span>
            <h2 id="evidence-ledger-title">Publish what is known. Keep every gap visible.</h2>
            <p>
              This public ledger separates confirmed website information from the records a real property decision still requires. It does not replace professional verification.
            </p>
            <Link href="/projects/nirapad-nibas">Open the project dossier<ArrowUpRight aria-hidden="true" /></Link>
          </div>

          <div className={styles.evidenceMedia}>
            <Image src="/projects/building-signage.jpg" alt="Illustrative Abdullah Properties project identity study" fill sizes="(max-width: 820px) 100vw, 38vw" />
            <span>Illustrative brand study / verify live information</span>
          </div>

          <div className={styles.ledgerRows}>
            {ledgerRows.map((row, index) => {
              const Icon = row.icon;
              return (
                <details key={row.id} open={index === 0}>
                  <summary>
                    <Icon aria-hidden="true" />
                    <span>{row.label}</span>
                    <strong>{row.title}</strong>
                    <span className={styles.ledgerToggle} aria-hidden="true" />
                  </summary>
                  <ul role="list">
                    {row.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </details>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
