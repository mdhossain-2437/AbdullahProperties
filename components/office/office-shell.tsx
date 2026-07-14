import Link from "next/link";
import { ArrowUpRight, CircleUserRound, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { OfficeDesktopNavigation, OfficeMobileNavigation } from "@/components/office/office-navigation";
import type { OfficeNavigationGroup } from "@/features/office/navigation";

type OfficeShellProps = {
  children: React.ReactNode;
  groups: readonly OfficeNavigationGroup[];
  user: { displayName: string; email: string };
  roleLabel: string;
};

export function OfficeShell({ children, groups, user, roleLabel }: OfficeShellProps) {
  return (
    <div className="office-surface">
      <a className="office-skip-link" href="#office-main">Skip to office content</a>
      <OfficeMobileNavigation groups={groups} />
      <aside className="office-sidebar">
        <div className="office-sidebar__brand">
          <BrandLogo tone="dark" />
          <span>Office OS / Joypurhat</span>
        </div>
        <OfficeDesktopNavigation groups={groups} />
        <div className="office-account">
          <CircleUserRound aria-hidden="true" />
          <div><strong>{user.displayName}</strong><span>{roleLabel}</span><small>{user.email}</small></div>
          <Link href="/signout-with-chatgpt?return_to=/" aria-label="Sign out of the office workspace"><LogOut aria-hidden="true" /></Link>
        </div>
      </aside>
      <div className="office-workspace">
        <header className="office-command-bar">
          <div><span>Abdullah Properties</span><strong>Operating system</strong></div>
          <div className="office-command-bar__actions">
            <Link href="/studio">Content Studio <ArrowUpRight aria-hidden="true" /></Link>
            <Link href="/">Public website <ArrowUpRight aria-hidden="true" /></Link>
          </div>
        </header>
        <main id="office-main" className="office-main" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}

