"use client";

import { useRef } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { AppImage } from "@/components/ui/app-image";
import styles from "./cinematic-home-hero.module.css";

export function CinematicHomeHero() {
  const heroRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imageOffset = useTransform(scrollYProgress, [0, 1], ["-3.5%", "3.5%"]);

  return (
    <section className={styles.hero} id="story-start" ref={heroRef} aria-labelledby="home-hero-title">
      <div className="site-shell">
        <div className={styles.intro}>
          <div className={styles.lead}>
            <span className={styles.chapter}>Joypurhat / Housing base</span>
            <p>
              Property decisions carry real weight. We connect local context, clear advice, and delivery thinking so the next move feels considered.
            </p>
          </div>

          <h1 className={styles.title} id="home-hero-title">
            <span className="sr-only">Property decisions, made clear.</span>
            <span className={styles.titleVisual} aria-hidden="true">
              <span className={styles.lineMask}>
                <span className={styles.line}>Property</span>
              </span>
              <span className={`${styles.lineMask} ${styles.lineMaskTwo}`}>
                <span className={`${styles.line} ${styles.lineTwo}`}>
                  <span className={styles.titleSignal} />
                  decisions,
                </span>
              </span>
              <span className={`${styles.lineMask} ${styles.lineMaskThree}`}>
                <span className={`${styles.line} ${styles.lineThree}`}>made clear.</span>
              </span>
            </span>
          </h1>
        </div>

        <div className={styles.stage}>
          <motion.div
            className={styles.imagePlane}
            style={shouldReduceMotion ? undefined : { y: imageOffset }}
          >
            <AppImage
              className={styles.image}
              src="/properties/joypurhat-residence.jpg"
              alt="Illustrative contemporary residential entrance for the Abdullah Properties brand"
              fill
              preload
              sizes="(max-width: 760px) 100vw, 1240px"
            />
          </motion.div>

          <div className={styles.veil} aria-hidden="true" />

          <div className={styles.searchPanel}>
            <span className={styles.eyebrow}>Housing support / Joypurhat</span>
            <h2>Looking for a home, land partner, or project route?</h2>
            <form action="/properties" className={styles.searchForm} role="search">
              <label>
                <span className="sr-only">Search by location or property type</span>
                <input name="q" placeholder="Search by location or property type" />
              </label>
              <button type="submit" aria-label="Search properties">
                <Search aria-hidden="true" />
              </button>
            </form>
            <nav className={styles.chips} aria-label="Popular property filters">
              <Link href="/properties?type=Residential">Residential</Link>
              <Link href="/properties?type=Commercial">Commercial</Link>
              <Link href="/properties?type=Mixed-use">Mixed-use</Link>
            </nav>
          </div>

          <div className={styles.stageIndex}>
            <span>AP / 01</span>
            <span>Illustrative property study</span>
          </div>
        </div>
      </div>
    </section>
  );
}
