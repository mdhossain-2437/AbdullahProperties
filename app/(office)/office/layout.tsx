import type { Metadata } from "next";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeShell } from "@/components/office/office-shell";
import { getOfficePageSession } from "@/features/office/auth";
import { officeNavigation } from "@/features/office/navigation";
import { hasOfficePermission } from "@/features/office/permissions";
import officeCss from "./office.css?raw";

export const metadata: Metadata = {
  title: { absolute: "Office OS | Abdullah Properties" },
  description: "Protected operating workspace for Abdullah Properties.",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const roleLabels = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Operations manager",
  sales: "Sales",
  projects: "Projects",
  accounts: "Accounts",
  viewer: "Read-only viewer",
} as const;

export default async function OfficeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getOfficePageSession("/office");

  if (!session.authorized || !session.actor) {
    return <><style>{officeCss}</style><div className="office-surface office-surface--gate"><OfficeAccessState kind="denied" email={session.user.email} /></div></>;
  }

  const actor = session.actor;
  const groups = officeNavigation
    .map((group) => ({ ...group, items: group.items.filter((item) => hasOfficePermission(actor.role, item.permission)) }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <style>{officeCss}</style>
      <OfficeShell groups={groups} user={actor} roleLabel={roleLabels[actor.role]}>{children}</OfficeShell>
    </>
  );
}
