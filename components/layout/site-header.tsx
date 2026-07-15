"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ExploreNavigation } from "@/components/layout/explore-navigation";
import { isPathCurrent } from "@/components/layout/explore-navigation-data";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { MobileExploreNavigation } from "@/components/layout/mobile-explore-navigation";
import { Button } from "@/components/ui/button";
import { getPublicNavigation, publicShellCopy } from "@/lib/i18n/public-navigation";
import { localeFromPathname, localizedPublicHref } from "@/lib/i18n/public-locale";
import styles from "@/components/layout/explore-navigation.module.css";

export function SiteHeader() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const copy = publicShellCopy[locale];
  const navigation = getPublicNavigation(locale);
  const homeHref = localizedPublicHref("/", locale);

  return (
    <header className="site-header" lang={locale}>
      <div className={`site-shell ${styles.headerInner}`}>
        <BrandLogo preload homeHref={homeHref} homeLabel={copy.logoLabel} />
        <nav className={styles.primaryNav} aria-label={copy.primaryNavigation}>
          {navigation.map((item) => {
            const isCurrent = isPathCurrent(pathname, item.href);
            return (
              <Link className={styles.primaryLink} key={item.href} href={item.href} aria-current={isCurrent ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.desktopActions}>
          <LanguageToggle pathname={pathname} />
          <ExploreNavigation pathname={pathname} locale={locale} />
          <Button asChild className={`brand-button brand-button--outline ${styles.talkButton}`}>
            <Link href={localizedPublicHref("/contact", locale)}>{copy.talk}</Link>
          </Button>
        </div>
        <MobileExploreNavigation pathname={pathname} locale={locale} />
      </div>
    </header>
  );
}
