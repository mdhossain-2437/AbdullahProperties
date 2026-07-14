"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import styles from "./footer-ghost-marquee.module.css";

function BrandSignature({ duplicate = false }: { duplicate?: boolean }) {
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
      <span className={styles.name}>Abdullah Properties</span>
    </span>
  );
}

export function FooterGhostMarquee() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

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
        <BrandSignature />
        <BrandSignature duplicate />
      </div>
      <button
        type="button"
        className={styles.motionControl}
        aria-label={paused ? "Resume footer brand animation" : "Pause footer brand animation"}
        aria-pressed={paused}
        onClick={() => setPaused((current) => !current)}
      >
        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
      </button>
    </div>
  );
}
