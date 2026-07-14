"use client";

import type { CSSProperties } from "react";
import { useId } from "react";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import {
  exploreNavigationGroups,
  isPathCurrent,
  protectedNavigationLinks,
} from "@/components/layout/explore-navigation-data";
import styles from "@/components/layout/explore-navigation.module.css";

type ExploreLinkGroupsProps = {
  pathname: string;
  mode: "desktop" | "mobile";
  onNavigate: () => void;
};

type LinkRevealStyle = CSSProperties & { "--item-delay": string };

export function ExploreLinkGroups({ pathname, mode, onNavigate }: ExploreLinkGroupsProps) {
  const headingPrefix = useId();

  return (
    <nav
      className={mode === "desktop" ? styles.linkGroupsDesktop : styles.linkGroupsMobile}
      aria-label="Explore Abdullah Properties"
    >
      <div className={styles.groupGrid}>
        {exploreNavigationGroups.map((group, groupIndex) => (
          <section className={styles.linkGroup} key={group.id} aria-labelledby={`${headingPrefix}-${group.id}`}>
            <div className={styles.groupHeading}>
              <span aria-hidden="true">{group.id}</span>
              <h2 id={`${headingPrefix}-${group.id}`}>{group.label}</h2>
            </div>
            <ul className={styles.linkList}>
              {group.links.map((item, linkIndex) => {
                const style: LinkRevealStyle = { "--item-delay": `${100 + (groupIndex * 5 + linkIndex) * 28}ms` };

                return (
                  <li className={styles.linkItem} key={item.href} style={style}>
                    <Link
                      className={styles.navigationLink}
                      href={item.href}
                      aria-current={isPathCurrent(pathname, item.href) ? "page" : undefined}
                      onClick={onNavigate}
                    >
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <section className={styles.protectedGroup} aria-labelledby={`${headingPrefix}-protected`}>
        <div className={styles.protectedHeading}>
          <LockKeyhole aria-hidden="true" />
          <div>
            <h2 id={`${headingPrefix}-protected`}>Protected workspaces</h2>
            <p>Authentication and authorization are required after entry.</p>
          </div>
        </div>
        <div className={styles.protectedLinks}>
          {protectedNavigationLinks.map((item, index) => {
            const style: LinkRevealStyle = { "--item-delay": `${580 + index * 40}ms` };

            return (
              <Link
                className={`${styles.protectedLink} ${styles.linkItem}`}
                key={item.href}
                style={style}
                href={item.href}
                aria-current={isPathCurrent(pathname, item.href) ? "page" : undefined}
                onClick={onNavigate}
              >
                <span><strong>{item.label}</strong><small>{item.description}</small></span>
                <ArrowUpRight aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>
    </nav>
  );
}

