"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { siteNavigation } from "@/lib/site-data";

function isPathCurrent(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-shell site-header__inner">
        <BrandLogo />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {siteNavigation.map((item) => {
            const isCurrent = isPathCurrent(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={isCurrent ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button asChild className="brand-button brand-button--outline site-header__cta">
          <Link href="/contact">Talk to us</Link>
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button className="mobile-menu-trigger" variant="outline" size="icon" aria-label="Open navigation">
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent className="mobile-sheet" side="right">
            <SheetHeader>
              <SheetTitle>Explore Abdullah Properties</SheetTitle>
              <SheetDescription>Housing Base Total Solutions in Joypurhat.</SheetDescription>
            </SheetHeader>
            <nav className="mobile-nav" aria-label="Mobile navigation">
              {siteNavigation.map((item, index) => (
                <SheetClose asChild key={item.href}>
                  <Link href={item.href} aria-current={isPathCurrent(pathname, item.href) ? "page" : undefined}>
                    <span>0{index + 1}</span>
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <Link className="mobile-nav__contact" href="/contact">Start a conversation</Link>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
