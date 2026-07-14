"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ExploreNavigation } from "@/components/layout/explore-navigation";
import { isPathCurrent } from "@/components/layout/explore-navigation-data";
import { MobileExploreNavigation } from "@/components/layout/mobile-explore-navigation";
import { Button } from "@/components/ui/button";
import { siteNavigation } from "@/lib/site-data";
import styles from "@/components/layout/explore-navigation.module.css";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className={`site-shell ${styles.headerInner}`}>
        <BrandLogo preload />
        <nav className={styles.primaryNav} aria-label="Primary navigation">
          {siteNavigation.map((item) => {
            const isCurrent = isPathCurrent(pathname, item.href);
            return (
              <Link className={styles.primaryLink} key={item.href} href={item.href} aria-current={isCurrent ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.desktopActions}>
          <ExploreNavigation pathname={pathname} />
          <Button asChild className={`brand-button brand-button--outline ${styles.talkButton}`}>
            <Link href="/contact">Talk to us</Link>
          </Button>
        </div>
        <MobileExploreNavigation pathname={pathname} />
      </div>
    </header>
  );
}
