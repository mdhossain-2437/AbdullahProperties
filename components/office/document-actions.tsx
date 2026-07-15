"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, FileDown, Mail, MessageSquareText, Printer, ShieldCheck } from "lucide-react";
import styles from "./document-actions.module.css";

type DocumentActionsProps = Readonly<{
  backHref: string;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
}>;

function mailtoHref(email: string, subject: string, message: string) {
  return `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}

function smsHref(phone: string, message: string) {
  const recipient = phone.replace(/[^+\d]/g, "");
  return recipient ? `sms:${recipient}?body=${encodeURIComponent(message)}` : null;
}

export function DocumentActions({ backHref, email, phone, subject, message }: DocumentActionsProps) {
  const [status, setStatus] = useState("No action has been handed off yet.");
  const emailLink = email ? mailtoHref(email, subject, message) : null;
  const smsLink = phone ? smsHref(phone, message) : null;

  function openPrintDialog(mode: "print" | "pdf") {
    setStatus(
      mode === "pdf"
        ? "Choose “Save as PDF” in the browser print destination. Office OS cannot confirm that the file was saved."
        : "The browser print dialog is opening. Office OS cannot confirm that printing completed.",
    );
    window.requestAnimationFrame(() => window.print());
  }

  return (
    <aside className={styles.toolbar} aria-label="Document actions">
      <div className={styles.actions}>
        <Link className={styles.action} href={backHref}><ArrowLeft aria-hidden="true" /> Back to record</Link>
        <button className={`${styles.action} ${styles.primary}`} type="button" onClick={() => openPrintDialog("print")}>
          <Printer aria-hidden="true" /> Print
        </button>
        <button className={styles.action} type="button" onClick={() => openPrintDialog("pdf")}>
          <FileDown aria-hidden="true" /> Save PDF
        </button>
        {emailLink ? (
          <a
            className={styles.action}
            href={emailLink}
            onClick={() => setStatus("Your mail app is opening with a prepared message. Sending and delivery happen outside Office OS.")}
          >
            <Mail aria-hidden="true" /> Prepare email
          </a>
        ) : (
          <button className={styles.action} type="button" disabled title="No recipient email is stored"><Mail aria-hidden="true" /> No email</button>
        )}
        {smsLink ? (
          <a
            className={styles.action}
            href={smsLink}
            onClick={() => setStatus("Your messaging app is opening with a prepared message. Sending and delivery happen outside Office OS.")}
          >
            <MessageSquareText aria-hidden="true" /> Prepare SMS
          </a>
        ) : (
          <button className={styles.action} type="button" disabled title="No usable recipient phone is stored"><MessageSquareText aria-hidden="true" /> No SMS</button>
        )}
      </div>
      <p className={styles.note}>
        <ShieldCheck aria-hidden="true" />
        Email and SMS are manual handoffs: no message is sent, no PDF is attached, and no delivery status is recorded by Office OS.
      </p>
      <p className={styles.status} role="status" aria-live="polite">{status}</p>
    </aside>
  );
}
