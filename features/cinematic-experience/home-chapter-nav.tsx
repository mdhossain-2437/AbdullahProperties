"use client";

import { useEffect, useState } from "react";
import type { HomeChapter } from "@/features/cinematic-experience/home-experience-data";
import styles from "@/features/cinematic-experience/home-experience.module.css";

type HomeChapterNavProps = {
  readonly chapters: readonly HomeChapter[];
};

export function HomeChapterNav({ chapters }: HomeChapterNavProps) {
  const [activeId, setActiveId] = useState(chapters[0]?.id ?? "");

  useEffect(() => {
    const sections = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-30% 0px -58% 0px", threshold: [0.01, 0.2, 0.45] },
    );

    const syncVisibility = () => {
      observer.disconnect();
      if (document.visibilityState === "visible") {
        sections.forEach((section) => observer.observe(section));
      }
    };

    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      observer.disconnect();
    };
  }, [chapters]);

  const activeIndex = Math.max(0, chapters.findIndex((chapter) => chapter.id === activeId));
  const progress = chapters.length > 1 ? activeIndex / (chapters.length - 1) : 0;

  return (
    <nav className={styles.chapterNav} aria-label="Homepage story chapters">
      <span className={styles.chapterTrack} aria-hidden="true">
        <span style={{ transform: `scaleY(${progress})` }} />
      </span>
      <ol role="list">
        {chapters.map((chapter, index) => (
          <li key={chapter.id}>
            <a
              href={`#${chapter.id}`}
              aria-current={chapter.id === activeId ? "location" : undefined}
              onClick={() => setActiveId(chapter.id)}
            >
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span>{chapter.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
