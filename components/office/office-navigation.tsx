"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Building2,
  CheckSquare2,
  ClipboardCheck,
  FileClock,
  FolderLock,
  Gauge,
  HandCoins,
  MapPinned,
  Menu,
  ReceiptText,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { OfficeNavigationGroup, OfficeNavigationItem } from "@/features/office/navigation";

const icons = {
  overview: Gauge,
  people: Users,
  land: MapPinned,
  projects: Building2,
  tasks: CheckSquare2,
  invoices: ReceiptText,
  payments: HandCoins,
  expenses: Banknote,
  approvals: ClipboardCheck,
  documents: FolderLock,
  reports: BarChart3,
  team: BadgeCheck,
  audit: FileClock,
} as const;

function isCurrentRoute(pathname: string, href: string) {
  return pathname === href || (href !== "/office" && pathname.startsWith(`${href}/`));
}

function NavigationItems({ groups, closeOnNavigate = false }: { groups: readonly OfficeNavigationGroup[]; closeOnNavigate?: boolean }) {
  const pathname = usePathname();

  return groups.map((group) => (
    <section className="office-nav__group" key={group.label} aria-labelledby={`office-nav-${group.label.toLowerCase()}`}>
      <h2 id={`office-nav-${group.label.toLowerCase()}`}>{group.label}</h2>
      <div>
        {group.items.map((item: OfficeNavigationItem) => {
          const Icon = icons[item.icon];
          const link = (
            <Link href={item.href} aria-current={isCurrentRoute(pathname, item.href) ? "page" : undefined}>
              <Icon aria-hidden="true" />
              <span><strong>{item.label}</strong><small>{item.description}</small></span>
            </Link>
          );

          return closeOnNavigate ? <SheetClose asChild key={item.href}>{link}</SheetClose> : <div key={item.href}>{link}</div>;
        })}
      </div>
    </section>
  ));
}

export function OfficeDesktopNavigation({ groups }: { groups: readonly OfficeNavigationGroup[] }) {
  return <nav className="office-nav office-nav--desktop" aria-label="Office workspace"><NavigationItems groups={groups} /></nav>;
}

export function OfficeMobileNavigation({ groups }: { groups: readonly OfficeNavigationGroup[] }) {
  return (
    <div className="office-mobile-bar">
      <BrandLogo tone="dark" />
      <Sheet>
        <SheetTrigger asChild>
          <Button className="office-mobile-menu" variant="outline" size="icon-lg" aria-label="Open office navigation"><Menu aria-hidden="true" /></Button>
        </SheetTrigger>
        <SheetContent className="office-nav-sheet" side="left">
          <SheetHeader>
            <SheetTitle>Abdullah Office</SheetTitle>
            <SheetDescription>Relationships, delivery, money, and control.</SheetDescription>
          </SheetHeader>
          <nav className="office-nav office-nav--mobile" aria-label="Office workspace"><NavigationItems groups={groups} closeOnNavigate /></nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
