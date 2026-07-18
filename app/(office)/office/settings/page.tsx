import { AlertTriangle, ShieldCheck } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeDemoDataForm } from "@/components/office/demo-data-form";
import { OfficeDesktopDeviceManager } from "@/components/office/desktop-device-manager";
import { OfficePageHeader } from "@/components/office/page-header";
import { requireOfficePermission } from "@/features/office/auth";
import { isOfficeDemoSeedEnabled } from "@/features/office/demo-data";
import { isOfficeDatabaseAvailable } from "@/features/office/repository";
import { listOfficeDesktopDevices } from "@/features/office/desktop-sync-repository";
import { readOfficeDesktopPairingFlash } from "@/features/office/desktop-device-actions";

export default async function OfficeSettingsPage({ searchParams }: { searchParams: Promise<{ desktop?: string }> }) {
  const actor = await requireOfficePermission("settings.manage", "/office/settings");
  if (!(await isOfficeDatabaseAvailable())) return <OfficeAccessState kind="storage" />;
  const demoEnabled = isOfficeDemoSeedEnabled();
  const [desktopDevices, pairing, query] = await Promise.all([
    actor.memberId ? listOfficeDesktopDevices(actor.memberId) : Promise.resolve([]),
    readOfficeDesktopPairingFlash(),
    searchParams,
  ]);
  return (
    <>
      <OfficePageHeader
        eyebrow="Control / Settings"
        title="Safe switches for serious operations."
        description="Environment-gated utilities are isolated from daily workflows and require elevated permission, explicit confirmation, and audit events."
      />
      <section className="office-grid">
        <div className="office-panel office-panel--eight">
          <div className="office-panel__head"><div><span className="office-eyebrow">Test workspace</span><h2>Marked demo records</h2></div><ShieldCheck aria-hidden="true" /></div>
          <div className={`office-alert ${demoEnabled ? "office-alert--warning" : "office-alert--error"}`} role="status">
            <AlertTriangle aria-hidden="true" />
            <div><strong>{demoEnabled ? "Demo seeding is available in this environment." : "Demo seeding is locked."}</strong><p>{demoEnabled ? "The records are fictional, visibly prefixed [DEMO], and contain no live notification destination. Remove or archive them before production reporting." : "Production requires the explicit OFFICE_DEMO_SEED_ENABLED=true environment switch. Keep it unset on the live tenant unless a controlled test is scheduled."}</p></div>
          </div>
          <div className="office-record-composer"><OfficeDemoDataForm enabled={demoEnabled} /></div>
        </div>
        <aside className="office-panel office-panel--four">
          <span className="office-eyebrow">Boundaries</span>
          <h2>What it will not do.</h2>
          <ul className="office-timeline">
            <li><div><strong>No live contact destination</strong><p>The seed cannot accidentally send a real SMS or email.</p></div></li>
            <li><div><strong>No financial posting</strong><p>It does not issue invoices, record payments, or alter balances.</p></div></li>
            <li><div><strong>No silent production data</strong><p>Every record is marked and every creation passes through the audit-enabled repository.</p></div></li>
          </ul>
        </aside>
      </section>
      <div className="office-record-composer">
        {actor.memberId ? (
          <OfficeDesktopDeviceManager initialDevices={desktopDevices} pairing={pairing} noticeCode={query.desktop} />
        ) : (
          <div className="office-alert office-alert--warning" role="status">
            <AlertTriangle aria-hidden="true" />
            <div><strong>Activate the bootstrap owner membership first.</strong><p>A durable Office member identity is required before a revocable Windows credential can be tied to this account.</p></div>
          </div>
        )}
      </div>
    </>
  );
}
