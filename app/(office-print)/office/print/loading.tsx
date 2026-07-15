import styles from "./print-layout.module.css";

export default function OfficePrintLoading() {
  return (
    <section className={styles.state} aria-busy="true" aria-live="polite">
      <span>Protected document</span>
      <h1>Preparing the controlled copy…</h1>
      <p>Authorization and the latest stored document snapshot are being checked before any recipient or financial detail is rendered.</p>
    </section>
  );
}
