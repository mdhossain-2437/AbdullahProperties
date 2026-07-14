"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { ExploreLinkGroups } from "@/components/layout/explore-link-groups";
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

type MobileExploreNavigationProps = {
  pathname: string;
};

export function MobileExploreNavigation({ pathname }: MobileExploreNavigationProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.mobileOnly}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className={styles.mobileTrigger} type="button" variant="outline" size="icon" aria-label="Open Explore navigation">
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>

        <SheetContent className={styles.mobilePanel} side="right" showCloseButton={false}>
          <SheetHeader className={styles.mobileHeader}>
            <div className={styles.mobileHeaderRow}>
              <Link className={styles.panelBrand} href="/" onClick={() => setOpen(false)}>
                <span className={styles.panelMark} aria-hidden="true">
                  <Image src="/brand/logo-mark-inverse.png" alt="" width={48} height={48} />
                </span>
                <span>
                  <strong>Abdullah Properties</strong>
                  <small>Joypurhat, Bangladesh</small>
                </span>
              </Link>

              <SheetClose asChild>
                <Button className={styles.mobileClose} type="button" variant="ghost" size="icon" aria-label="Close Explore navigation">
                  <X aria-hidden="true" />
                </Button>
              </SheetClose>
            </div>

            <p className={styles.eyebrow}>Explore the platform</p>
            <SheetTitle className={styles.mobileTitle}>Find the right route.</SheetTitle>
            <SheetDescription className={styles.mobileDescription}>
              Property discovery, documented decisions, delivery, and client care in one local platform.
            </SheetDescription>
          </SheetHeader>

          <ExploreLinkGroups pathname={pathname} mode="mobile" onNavigate={() => setOpen(false)} />

          <div className={styles.mobileFooter}>
            <SheetClose asChild>
              <Link className={styles.mobileTalk} href="/contact">
                Talk to us
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </SheetClose>
            <p>Housing Base Total Solutions · Joypurhat</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
