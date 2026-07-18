import { Laptop, ShieldCheck } from "lucide-react";
import {
  createOfficeDesktopPairingAction,
  dismissOfficeDesktopPairingAction,
  revokeOfficeDesktopDeviceAction,
  type OfficeDesktopPairingFlash,
} from "@/features/office/desktop-device-actions";
import type { OfficeDesktopDeviceView } from "@/features/office/desktop-sync-contract";

function formatTimestamp(value: string | null): string {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
}

const desktopNotice: Readonly<Record<string, string>> = {
  "pairing-ready": "The one-time pairing code is ready below.",
  "pairing-dismissed": "The displayed pairing code was dismissed. Generate a new one if needed.",
  revoked: "Desktop access was revoked immediately.",
  "invalid-device-name": "Use a device name containing 2 to 80 characters.",
  "pairing-failed": "The pairing request could not be completed. No credential was exposed.",
  "invalid-device": "The selected device identifier is invalid.",
  "revoke-failed": "The device could not be revoked. Refresh and retry.",
  "access-denied": "Your current Office role cannot manage native devices.",
};

export function OfficeDesktopDeviceManager({
  initialDevices,
  pairing,
  noticeCode,
}: {
  initialDevices: readonly OfficeDesktopDeviceView[];
  pairing: OfficeDesktopPairingFlash | null;
  noticeCode?: string;
}) {
  const notice = noticeCode ? desktopNotice[noticeCode] : null;
  return (
    <section className="office-panel office-panel--wide office-device-manager" aria-labelledby="desktop-device-title">
      <div className="office-panel__head">
        <div><span className="office-eyebrow">Native access / Device trust</span><h2 id="desktop-device-title">Pair Windows without exposing its credential.</h2></div>
        <Laptop aria-hidden="true" />
      </div>

      <div className="office-alert office-alert--warning">
        <ShieldCheck aria-hidden="true" />
        <div><strong>The browser receives only a ten-minute, one-use code.</strong><p>The installed app exchanges it directly with the pinned hosted API and protects the resulting 30-day credential with Windows DPAPI.</p></div>
      </div>

      {notice ? <div className={`office-alert ${noticeCode?.includes("failed") || noticeCode?.includes("invalid") || noticeCode === "access-denied" ? "office-alert--error" : "office-alert--success"}`} role="status"><div><strong>Device access update</strong><p>{notice}</p></div></div> : null}

      <form className="office-inline-form office-device-manager__pair" action={createOfficeDesktopPairingAction}>
        <label><span>Device name</span><input name="name" minLength={2} maxLength={80} placeholder="Joypurhat front desk" required /></label>
        <p>Creates a pending device and a one-time pairing code. It does not put the bearer in JavaScript, clipboard, URL, email, or logs.</p>
        <button className="office-button office-button--accent" type="submit">Create pairing code</button>
      </form>

      {pairing ? (
        <div className="office-device-credential" role="status" aria-live="polite">
          <div><strong>{pairing.deviceName} pairing code</strong><p>Type this into the installed app before {formatTimestamp(pairing.expiresAt)}. It works once.</p></div>
          <code>{pairing.code}</code>
          <form action={dismissOfficeDesktopPairingAction}><button className="office-button office-button--ghost" type="submit">Dismiss code</button></form>
        </div>
      ) : null}

      <div className="office-device-list" aria-label="Paired Windows devices">
        {initialDevices.length > 0 ? initialDevices.map((device) => (
          <article key={device.id} className="office-device-row">
            <Laptop aria-hidden="true" />
            <div>
              <strong>{device.name}</strong>
              <p>{device.status === "pending" ? "Awaiting one-time activation" : `Token ${device.tokenPrefix}…`} · Created {formatTimestamp(device.createdAt)} · Last sync {formatTimestamp(device.lastSeenAt)}</p>
              <small>Credential expires {formatTimestamp(device.expiresAt)}</small>
            </div>
            <span className="office-status" data-status={device.status}>{device.status}</span>
            {device.status !== "revoked" ? (
              <form action={revokeOfficeDesktopDeviceAction}>
                <input type="hidden" name="deviceId" value={device.id} />
                <button className="office-button office-button--ghost" type="submit">Revoke</button>
              </form>
            ) : null}
          </article>
        )) : (
          <div className="office-empty office-device-list__empty"><Laptop aria-hidden="true" /><h2>No Windows device is paired.</h2><p>Create a code only when the installed app is ready.</p></div>
        )}
      </div>
    </section>
  );
}
