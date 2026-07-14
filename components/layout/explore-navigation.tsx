"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { ExploreLinkGroups } from "@/components/layout/explore-link-groups";
import { AppImage as Image } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import styles from "@/components/layout/explore-navigation.module.css";

type ExploreNavigationProps = {
  pathname: string;
};

export function ExploreNavigation({ pathname }: ExploreNavigationProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className={styles.exploreTrigger} type="button" variant="outline">
          Explore
          <Menu aria-hidden="true" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className={styles.dialogOverlay} data-explore-overlay />
        <Dialog.Content className={styles.dialogContent}>
          <div className={styles.dialogHeader}>
            <Link className={styles.panelBrand} href="/" onClick={() => setOpen(false)}>
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
                <small>Joypurhat, Bangladesh</small>
              </span>
            </Link>

            <Dialog.Close asChild>
              <Button className={styles.dialogClose} type="button" variant="ghost" aria-label="Close Explore navigation">
                Close
                <X aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <div className={styles.dialogIntro}>
            <p className={styles.eyebrow}>Explore the platform</p>
            <Dialog.Title className={styles.dialogTitle}>
              Every route to a clearer property decision.
            </Dialog.Title>
            <Dialog.Description className={styles.dialogDescription}>
              Move from discovery to evidence, delivery, and ongoing client care through one connected local property platform.
            </Dialog.Description>
          </div>

          <ExploreLinkGroups pathname={pathname} mode="desktop" onNavigate={() => setOpen(false)} />

          <div className={styles.panelFooter}>
            <span>Housing Base Total Solutions</span>
            <span>Local context · documented decisions · accountable delivery</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
