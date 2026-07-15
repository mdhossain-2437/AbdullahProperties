"use client";

import type { CSSProperties } from "react";
import { useId } from "react";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import {
  getExploreNavigationGroups,
  getProtectedNavigationLinks,
  isPathCurrent,
} from "@/components/layout/explore-navigation-data";
import type { PublicLocale } from "@/lib/i18n/public-locale";
import styles from "@/components/layout/explore-navigation.module.css";

type ExploreLinkGroupsProps = {
  pathname: string;
  locale: PublicLocale;
  mode: "desktop" | "mobile";
  onNavigate: () => void;
};

type LinkRevealStyle = CSSProperties & { "--item-delay": string };

export function ExploreLinkGroups({ pathname, locale, mode, onNavigate }: ExploreLinkGroupsProps) {
  const headingPrefix = useId();
  const groups = getExploreNavigationGroups(locale);
  const protectedLinks = getProtectedNavigationLinks(locale);
  const isBengali = locale === "bn-BD";

  return (
    <nav
      className={mode === "desktop" ? styles.linkGroupsDesktop : styles.linkGroupsMobile}
      aria-label={isBengali ? "আব্দুল্লাহ প্রোপার্টিজ ঘুরে দেখুন" : "Explore Abdullah Properties"}
    >
      <div className={styles.groupGrid}>
        {groups.map((group, groupIndex) => (
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
            <h2 id={`${headingPrefix}-protected`}>{isBengali ? "সুরক্ষিত কর্মক্ষেত্র" : "Protected workspaces"}</h2>
            <p>{isBengali ? "প্রবেশের পর পরিচয় ও অনুমতি যাচাই করা হয়।" : "Authentication and authorization are required after entry."}</p>
          </div>
        </div>
        <div className={styles.protectedLinks}>
          {protectedLinks.map((item, index) => {
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
