"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import type { DecisionStoryChapter } from "@/features/cinematic-experience/decision-story-data";
import styles from "@/features/cinematic-experience/decision-story.module.css";

type DecisionStoryProps = {
  readonly chapters: readonly DecisionStoryChapter[];
  readonly id?: string;
};

type WordRevealProps = {
  readonly text: string;
};

function WordReveal({ text }: WordRevealProps) {
  return (
    <span className={styles.wordReveal}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(" ").map((word, index) => (
          <span className={styles.wordMask} key={`${word}-${index}`}>
            <span className={styles.word}>{word}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

export function DecisionStory({ chapters, id }: DecisionStoryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealedChapterIds, setRevealedChapterIds] = useState<ReadonlySet<string>>(() => new Set());
  const chapterRefs = useRef<Array<HTMLLIElement | null>>([]);
  const activeChapter = chapters[activeIndex] ?? chapters[0];

  useEffect(() => {
    const chapterNodes = chapterRefs.current.filter((node): node is HTMLLIElement => node !== null);

    if (chapterNodes.length === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!visibleEntry) {
          return;
        }

        const nextIndex = Number((visibleEntry.target as HTMLElement).dataset.chapterIndex);
        if (Number.isInteger(nextIndex) && chapters[nextIndex]) {
          setActiveIndex(nextIndex);
          setRevealedChapterIds((current) => {
            const chapterId = chapters[nextIndex].id;
            return current.has(chapterId) ? current : new Set([...current, chapterId]);
          });
        }
      },
      {
        rootMargin: "-24% 0px -52% 0px",
        threshold: [0.12, 0.35, 0.58],
      },
    );

    const syncObserverVisibility = () => {
      if (document.visibilityState === "hidden") {
        observer.disconnect();
        return;
      }

      chapterNodes.forEach((node) => observer.observe(node));
    };

    syncObserverVisibility();
    document.addEventListener("visibilitychange", syncObserverVisibility);
    return () => {
      document.removeEventListener("visibilitychange", syncObserverVisibility);
      observer.disconnect();
    };
  }, [chapters]);

  if (!activeChapter) {
    return null;
  }

  const activateChapter = (index: number) => {
    const selectedChapter = chapters[index];
    if (!selectedChapter) {
      return;
    }

    setActiveIndex(index);
    setRevealedChapterIds((current) => (
      current.has(selectedChapter.id) ? current : new Set([...current, selectedChapter.id])
    ));
  };

  return (
    <section className={styles.story} id={id} aria-labelledby="decision-story-heading">
      <div className={styles.storyHeader}>
        <div>
          <span className={styles.eyebrow}>The Abdullah way / 01–{String(chapters.length).padStart(2, "0")}</span>
          <h2 id="decision-story-heading">A property decision is a story of what becomes clear.</h2>
        </div>
        <p>
          Follow the working sequence from the first question to the record that stays useful after handover. Scroll to read, or choose a chapter directly.
        </p>
      </div>

      <div className={styles.storyLayout}>
        <aside className={styles.stage} aria-label="Active process chapter">
          <div className={styles.stageTopline}>
            <span>Chapter {activeChapter.id}</span>
            <span>{String(activeIndex + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}</span>
          </div>

          <div className={styles.stageMedia} key={activeChapter.id}>
            <Image
              src={activeChapter.image}
              alt={activeChapter.imageAlt}
              fill
              sizes="(max-width: 820px) 100vw, 46vw"
            />
            <div className={styles.stageVeil} />
            <div className={styles.stageCaption}>
              <span>{activeChapter.eyebrow}</span>
              <p>Illustrative brand study. Confirm live project and property information directly.</p>
            </div>
          </div>

          <nav className={styles.chapterNav} aria-label="Decision story chapters">
            {chapters.map((chapter, index) => (
              <a
                key={chapter.id}
                href={`#decision-story-chapter-${chapter.id}`}
                aria-current={index === activeIndex ? "step" : undefined}
                aria-label={`Go to chapter ${chapter.id}: ${chapter.title}`}
                onClick={() => activateChapter(index)}
              >
                <span>{chapter.id}</span>
              </a>
            ))}
          </nav>
        </aside>

        <ol className={styles.chapters} role="list">
          {chapters.map((chapter, index) => {
            const isActive = index === activeIndex;
            const isRevealed = revealedChapterIds.has(chapter.id);

            return (
              <li
                className={`${styles.chapter} ${isActive ? styles.chapterActive : ""} ${isRevealed ? styles.chapterRevealed : ""}`}
                data-chapter-index={index}
                id={`decision-story-chapter-${chapter.id}`}
                key={chapter.id}
                ref={(node) => {
                  chapterRefs.current[index] = node;
                }}
              >
                <article>
                  <div className={styles.chapterMeta}>
                    <span>{chapter.id}</span>
                    <span>{chapter.eyebrow}</span>
                    <ArrowDown aria-hidden="true" />
                  </div>
                  <h3><WordReveal text={chapter.title} /></h3>
                  <p className={styles.chapterSummary}>{chapter.summary}</p>
                  <div className={styles.evidenceBlock}>
                    <span>{chapter.evidenceLabel}</span>
                    <ul role="list">
                      {chapter.evidence.map((item) => (
                        <li key={item}><Check aria-hidden="true" />{item}</li>
                      ))}
                    </ul>
                  </div>
                  <Link className={styles.chapterLink} href={chapter.href}>
                    {chapter.action}<ArrowUpRight aria-hidden="true" />
                  </Link>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
