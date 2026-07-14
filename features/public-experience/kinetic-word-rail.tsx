"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import styles from "@/features/public-experience/public-experience.module.css";

type KineticWordRailProps = {
  words: readonly string[];
  label: string;
};

export function KineticWordRail({ words, label }: KineticWordRailProps) {
  const rootRef = useRef<HTMLElement>(null);
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
    <section
      ref={rootRef}
      className={`${styles.kineticRail} ${paused ? styles.railPaused : ""}`}
      aria-label={label}
      data-enhanced="false"
      data-kinetic-rail="true"
      data-running="false"
    >
      <p className={styles.visuallyHidden}>{words.join(". ")}.</p>
      <div className={styles.railViewport} aria-hidden="true">
        <div className={styles.railTrack}>
          {[0, 1].map((group) => (
            <div className={styles.railGroup} key={group}>
              {words.map((word) => (
                <span className={styles.railWord} key={`${group}-${word}`}>{word}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.railControls}>
        <button
          type="button"
          className={styles.railButton}
          aria-pressed={paused}
          aria-label={paused ? "Resume moving text" : "Pause moving text"}
          onClick={() => setPaused((current) => !current)}
        >
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        </button>
      </div>
    </section>
  );
}
