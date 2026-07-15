"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { ExploreLinkGroups } from "@/components/layout/explore-link-groups";
import { AppImage as Image } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { localizedPublicHref, type PublicLocale } from "@/lib/i18n/public-locale";
import styles from "@/components/layout/explore-navigation.module.css";

type ExploreNavigationProps = {
  pathname: string;
  locale: PublicLocale;
};

export function ExploreNavigation({ pathname, locale }: ExploreNavigationProps) {
  const [open, setOpen] = useState(false);
  const isBengali = locale === "bn-BD";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className={styles.exploreTrigger} type="button" variant="outline">
          {isBengali ? "আরও দেখুন" : "Explore"}
          <Menu aria-hidden="true" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className={styles.dialogOverlay} data-explore-overlay />
        <Dialog.Content className={styles.dialogContent} lang={locale}>
          <div className={styles.dialogHeader}>
            <Link className={styles.panelBrand} href={localizedPublicHref("/", locale)} onClick={() => setOpen(false)}>
              <span className={styles.panelMark} aria-hidden="true">
                <Image
                  src="/brand/logo-mark-inverse.png"
                  alt=""
                  width={56}
                  height={56}
                />
              </span>
              <span>
                <strong>Abdullah Properties</strong>
                <small>{isBengali ? "জয়পুরহাট, বাংলাদেশ" : "Joypurhat, Bangladesh"}</small>
              </span>
            </Link>

            <Dialog.Close asChild>
              <Button className={styles.dialogClose} type="button" variant="ghost" aria-label={isBengali ? "নেভিগেশন বন্ধ করুন" : "Close Explore navigation"}>
                {isBengali ? "বন্ধ করুন" : "Close"}
                <X aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <div className={styles.dialogIntro}>
            <p className={styles.eyebrow}>{isBengali ? "প্ল্যাটফর্ম ঘুরে দেখুন" : "Explore the platform"}</p>
            <Dialog.Title className={styles.dialogTitle}>
              {isBengali ? "সম্পত্তির প্রতিটি সিদ্ধান্তে আরও স্বচ্ছ একটি পথ।" : "Every route to a clearer property decision."}
            </Dialog.Title>
            <Dialog.Description className={styles.dialogDescription}>
              {isBengali
                ? "খোঁজ, যাচাই, বাস্তবায়ন ও গ্রাহকসেবা—একটি সংযুক্ত স্থানীয় আবাসন প্ল্যাটফর্মে প্রয়োজনীয় পথটি বেছে নিন।"
                : "Move from discovery to evidence, delivery, and ongoing client care through one connected local property platform."}
            </Dialog.Description>
          </div>

          <ExploreLinkGroups pathname={pathname} locale={locale} mode="desktop" onNavigate={() => setOpen(false)} />

          <div className={styles.panelFooter}>
            <span>{isBengali ? "আবাসনের ভিত্তি—সমাধানের বিশ্বস্ত ঠিকানা" : "Housing Base Total Solutions"}</span>
            <span>{isBengali ? "স্থানীয় প্রেক্ষাপট · নথিভুক্ত সিদ্ধান্ত · দায়বদ্ধ বাস্তবায়ন" : "Local context · documented decisions · accountable delivery"}</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
