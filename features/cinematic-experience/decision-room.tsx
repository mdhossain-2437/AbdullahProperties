import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { decisionRoutes } from "@/features/cinematic-experience/home-experience-data";
import styles from "@/features/cinematic-experience/home-experience.module.css";

export function DecisionRoom() {
  return (
    <section className={styles.decisionRoom} id="choose-route" aria-labelledby="decision-room-title">
      <div className={styles.experienceShell}>
        <header className={styles.decisionHeader}>
          <div>
            <span className={styles.eyebrow}>Decision room / Choose your route</span>
            <h2 id="decision-room-title">Start with the question that is actually yours.</h2>
          </div>
          <p>
            Buyer, landowner, and project conversations need different evidence. Open your route to see the questions that make the first discussion more useful.
          </p>
        </header>

        <div className={styles.routeList}>
          {decisionRoutes.map((route, index) => (
            <details className={styles.route} key={route.id} name="property-decision-route" open={index === 0}>
              <summary>
                <span className={styles.routeIndex}>{route.index}</span>
                <span className={styles.routeLabel}>{route.label}</span>
                <strong>{route.title}</strong>
                <span className={styles.routeToggle} aria-hidden="true" />
              </summary>
              <div className={styles.routeBody}>
                <div className={styles.routePrompt}>
                  <span>Start here</span>
                  <p>{route.prompt}</p>
                </div>
                <div className={styles.routeQuestions}>
                  <span>Questions to carry</span>
                  <ul role="list">
                    {route.questions.map((question) => (
                      <li key={question}><Check aria-hidden="true" />{question}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.routeOutcome}>
                  <span>Useful outcome</span>
                  <p>{route.outcome}</p>
                  <Link href={route.href}>{route.action}<ArrowUpRight aria-hidden="true" /></Link>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
