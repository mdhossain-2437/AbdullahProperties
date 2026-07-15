"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import type { PublicLocale } from "@/lib/i18n/public-locale";
import styles from "./footer-ghost-marquee.module.css";

function BrandSignature({ locale, duplicate = false }: { locale: PublicLocale; duplicate?: boolean }) {
  const isBengali = locale === "bn-BD";
  return (
    <span
      className={`${styles.group} ${duplicate ? styles.duplicate : ""}`}
      aria-hidden="true"
    >
      <Image
        className={styles.mark}
        src="/brand/logo-mark-inverse.png"
        alt=""
        width={332}
        height={309}
        sizes="(max-width: 640px) 15vw, 9vw"
      />
      <span className={styles.name} lang={isBengali ? "bn" : "en"}>
        {isBengali ? "আব্দুল্লাহ প্রোপার্টিজ" : "Abdullah Properties"}
      </span>
    </span>
  );
}

type FooterGhostMarqueeProps = {
  readonly locale?: PublicLocale;
};

export function FooterGhostMarquee({ locale = "en-BD" }: FooterGhostMarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const isBengali = locale === "bn-BD";

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    root.dataset.enhanced = "true";
    let isIntersecting = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncPlayback = () => {
      const canAnimate =
        isIntersecting &&
        document.visibilityState === "visible" &&
        !reducedMotion.matches &&
        !paused;

      root.dataset.running = String(canAnimate);
    };

    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          ([entry]) => {
            isIntersecting = entry?.isIntersecting ?? false;
            syncPlayback();
          },
          { rootMargin: "120px 0px", threshold: 0 },
        );

    if (observer) {
      observer.observe(root);
    } else {
      isIntersecting = true;
    }
    document.addEventListener("visibilitychange", syncPlayback);
    reducedMotion.addEventListener("change", syncPlayback);
    syncPlayback();

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      reducedMotion.removeEventListener("change", syncPlayback);
    };
  }, [paused]);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-enhanced="false"
      data-running="false"
      data-footer-ghost-marquee="true"
    >
      <div className={styles.track} aria-hidden="true">
        <BrandSignature locale={locale} />
        <BrandSignature locale={locale} duplicate />
      </div>
      <button
        type="button"
        className={styles.motionControl}
        aria-label={paused
          ? isBengali ? "ফুটারের ব্র্যান্ড অ্যানিমেশন চালু করুন" : "Resume footer brand animation"
          : isBengali ? "ফুটারের ব্র্যান্ড অ্যানিমেশন থামান" : "Pause footer brand animation"}
        aria-pressed={paused}
        onClick={() => setPaused((current) => !current)}
      >
        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
      </button>
    </div>
  );
}
