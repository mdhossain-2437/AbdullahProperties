"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { ExploreLinkGroups } from "@/components/layout/explore-link-groups";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { AppImage as Image } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import styles from "@/components/layout/explore-navigation.module.css";
import { localizedPublicHref, type PublicLocale } from "@/lib/i18n/public-locale";

type MobileExploreNavigationProps = {
  pathname: string;
  locale: PublicLocale;
};

export function MobileExploreNavigation({ pathname, locale }: MobileExploreNavigationProps) {
  const [open, setOpen] = useState(false);
  const isBengali = locale === "bn-BD";

  return (
    <div className={styles.mobileOnly}>
      <LanguageToggle pathname={pathname} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className={styles.mobileTrigger} type="button" variant="outline" size="icon" aria-label={isBengali ? "নেভিগেশন খুলুন" : "Open Explore navigation"}>
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>

        <SheetContent className={styles.mobilePanel} side="right" showCloseButton={false} lang={locale}>
          <SheetHeader className={styles.mobileHeader}>
            <div className={styles.mobileHeaderRow}>
              <Link className={styles.panelBrand} href={localizedPublicHref("/", locale)} onClick={() => setOpen(false)}>
                <span className={styles.panelMark} aria-hidden="true">
                  <Image src="/brand/logo-mark-inverse.png" alt="" width={48} height={48} />
                </span>
                <span>
                  <strong>Abdullah Properties</strong>
                  <small>{isBengali ? "জয়পুরহাট, বাংলাদেশ" : "Joypurhat, Bangladesh"}</small>
                </span>
              </Link>

              <SheetClose asChild>
                <Button className={styles.mobileClose} type="button" variant="ghost" size="icon" aria-label={isBengali ? "নেভিগেশন বন্ধ করুন" : "Close Explore navigation"}>
                  <X aria-hidden="true" />
                </Button>
              </SheetClose>
            </div>

            <p className={styles.eyebrow}>{isBengali ? "প্ল্যাটফর্ম ঘুরে দেখুন" : "Explore the platform"}</p>
            <SheetTitle className={styles.mobileTitle}>{isBengali ? "সঠিক পথটি খুঁজে নিন।" : "Find the right route."}</SheetTitle>
            <SheetDescription className={styles.mobileDescription}>
              {isBengali
                ? "সম্পত্তি খোঁজ, নথিভুক্ত সিদ্ধান্ত, বাস্তবায়ন ও গ্রাহকসেবা—একটি স্থানীয় প্ল্যাটফর্মে।"
                : "Property discovery, documented decisions, delivery, and client care in one local platform."}
            </SheetDescription>
          </SheetHeader>

          <ExploreLinkGroups pathname={pathname} locale={locale} mode="mobile" onNavigate={() => setOpen(false)} />

          <div className={styles.mobileFooter}>
            <SheetClose asChild>
              <Link className={styles.mobileTalk} href={localizedPublicHref("/contact", locale)}>
                {isBengali ? "কথা বলুন" : "Talk to us"}
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </SheetClose>
            <p>{isBengali ? "আবাসনের ভিত্তি · জয়পুরহাট" : "Housing Base Total Solutions · Joypurhat"}</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
