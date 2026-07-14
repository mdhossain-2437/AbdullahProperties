import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, MessageCircle, Phone } from "lucide-react";
import { company } from "@/lib/company-data";
import { officeConversationSteps } from "@/features/cinematic-experience/home-experience-data";
import styles from "@/features/cinematic-experience/home-experience.module.css";

export function OfficeNextStep() {
  const primaryPhone = company.phones[0];

  return (
    <section className={styles.officeSection} id="visit-office" aria-labelledby="office-next-step-title">
      <div className={styles.experienceShell}>
        <header className={styles.officeHeader}>
          <span className={styles.eyebrow}>Joypurhat office / A real next step</span>
          <h2 id="office-next-step-title">Come with a question. Leave with a named action.</h2>
        </header>

        <div className={styles.officeGrid}>
          <aside className={styles.officeCard} aria-label="Abdullah Properties office details">
            <div className={styles.officeCardTopline}><span>AP / Purbo Bazar</span><span>Direct channels</span></div>
            <div className={styles.officeAddress}>
              <MapPin aria-hidden="true" />
              <address>{company.address.line1}<br />{company.address.line2}<br />{company.address.country}</address>
            </div>
            <div className={styles.officeHours}>
              <Clock3 aria-hidden="true" />
              <div><span>Published office hours</span><strong>{company.hours.display}</strong></div>
            </div>
            <div className={styles.officeLinks}>
              <a href={primaryPhone.href}><Phone aria-hidden="true" />Call {primaryPhone.display}</a>
              <a href={company.whatsapp} rel="noreferrer"><MessageCircle aria-hidden="true" />Open WhatsApp</a>
            </div>
          </aside>

          <div className={styles.officeProcess}>
            <p>
              A useful enquiry does not begin with a sales script. It begins by locating the decision, the missing evidence, and the person responsible for the next move.
            </p>
            <ol role="list">
              {officeConversationSteps.map((step) => (
                <li key={step.index}>
                  <span>{step.index}</span>
                  <div><h3>{step.title}</h3><p>{step.description}</p></div>
                </li>
              ))}
            </ol>
            <Link className={styles.officeAction} href="/contact">Choose your contact channel<ArrowUpRight aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
