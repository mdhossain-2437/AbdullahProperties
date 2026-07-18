import {
  CheckCircle2,
  CloudOff,
  KeyRound,
  Laptop,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Unplug,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  disconnectDevice,
  getDeviceCredentialStatus,
  isNativeDesktopRuntime,
  pairDeviceWithCode,
  selectEligibleQueuedOperations,
  syncQueuedOfficeOperations,
  type DeviceCredentialStatus,
  type NativeSyncResponse,
} from "../offline/native-sync";
import { OFFICE_DESKTOP_PRODUCTION_ORIGIN } from "../../../../features/office/desktop-device-contract";
import type { OfflineWorkspaceSnapshot } from "../offline/repository";
import "./sync-console.css";

type Feedback = Readonly<{
  kind: "idle" | "working" | "success" | "error";
  message: string;
}>;

const idleFeedback: Feedback = { kind: "idle", message: "" };

function displayTimestamp(value: string | null | undefined): string {
  if (!value) return "Not available";
  const numericValue = /^\d+$/.test(value) ? Number(value) * 1_000 : Date.parse(value);
  if (!Number.isFinite(numericValue)) return "Not available";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(numericValue));
}

function aggregateLabel(value: string): string {
  switch (value) {
    case "lead": return "Lead";
    case "invoice_draft": return "Invoice draft";
    case "notice_draft": return "Notice draft";
    case "payment_acknowledgement": return "Payment acknowledgement";
    case "contact": return "Contact";
    default: return "Office record";
  }
}

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function resultSummary(response: NativeSyncResponse): string {
  const accepted = response.results.filter((item) => item.status === "accepted").length;
  const duplicate = response.results.filter((item) => item.status === "duplicate").length;
  const needsReview = response.results.length - accepted - duplicate;
  return `${accepted} received by the server inbox, ${duplicate} already received, ${needsReview} require review.`;
}

export function SyncConsole({
  workspace,
  isOnline,
  onRefresh,
}: {
  readonly workspace: OfflineWorkspaceSnapshot;
  readonly isOnline: boolean;
  readonly onRefresh: () => Promise<void>;
}) {
  const nativeRuntime = useMemo(() => isNativeDesktopRuntime(), []);
  const retryWaiting = workspace.outbox.some((operation) => operation.state === "retry_wait");
  const [retryClock, setRetryClock] = useState(() => Date.now());
  const eligible = useMemo(
    () => selectEligibleQueuedOperations(workspace.outbox, undefined, retryClock),
    [retryClock, workspace.outbox],
  );
  const paymentQueueCount = workspace.outbox.filter(
    (operation) => operation.aggregateType === "payment_acknowledgement" && operation.state === "queued",
  ).length;
  const stateCounts = workspace.outbox.reduce<Record<string, number>>((counts, operation) => {
    counts[operation.state] = (counts[operation.state] ?? 0) + 1;
    return counts;
  }, {});
  const [credential, setCredential] = useState<DeviceCredentialStatus | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(() => nativeRuntime
    ? { kind: "working", message: "Checking the Windows credential vault…" }
    : idleFeedback);
  const [lastSync, setLastSync] = useState<NativeSyncResponse | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const lastAutoAttempt = useRef("");
  const working = feedback.kind === "working";

  useEffect(() => {
    if (!retryWaiting) return;
    const timer = window.setInterval(() => setRetryClock(Date.now()), 5_000);
    return () => window.clearInterval(timer);
  }, [retryWaiting]);

  useEffect(() => {
    if (!nativeRuntime) return;
    let active = true;
    void getDeviceCredentialStatus()
      .then((status) => {
        if (!active) return;
        setCredential(status);
        setFeedback({
          kind: "success",
          message: status.connected
            ? "This device is protected and ready for authenticated sync."
            : "No device credential is stored on this Windows account.",
        });
      })
      .catch((error: unknown) => {
        if (active) setFeedback({ kind: "error", message: messageFrom(error, "Credential status could not be read.") });
      });
    return () => { active = false; };
  }, [nativeRuntime]);

  const synchronize = useCallback(async (source: "manual" | "automatic" = "manual") => {
    setFeedback({
      kind: "working",
      message: `${source === "automatic" ? "Automatic reconnect sync" : "Sync"} is sending up to ${eligible.length} canonical local operations…`,
    });
    try {
      const response = await syncQueuedOfficeOperations();
      setLastSync(response);
      await onRefresh();
      setFeedback({ kind: "success", message: resultSummary(response) });
    } catch (error) {
      lastAutoAttempt.current = "";
      await onRefresh().catch(() => undefined);
      setFeedback({ kind: "error", message: messageFrom(error, "The sync attempt could not finish. Local records remain queued.") });
    }
  }, [eligible.length, onRefresh]);

  useEffect(() => {
    if (!isOnline) lastAutoAttempt.current = "";
    if (
      !autoSyncEnabled ||
      !nativeRuntime ||
      !credential?.connected ||
      !isOnline ||
      working ||
      eligible.length === 0
    ) return;
    const fingerprint = eligible
      .map((operation) => `${operation.clientOperationId}:${operation.attemptCount}:${operation.nextAttemptAt ?? "now"}`)
      .join(":");
    if (lastAutoAttempt.current === fingerprint) return;
    const timer = window.setTimeout(() => {
      lastAutoAttempt.current = fingerprint;
      void synchronize("automatic");
    }, 5_000);
    return () => window.clearTimeout(timer);
  }, [autoSyncEnabled, credential?.connected, eligible, isOnline, nativeRuntime, synchronize, working]);

  async function pairDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback({ kind: "working", message: "Exchanging the one-time code with the verified service…" });
    try {
      const status = await pairDeviceWithCode(OFFICE_DESKTOP_PRODUCTION_ORIGIN, pairingCode);
      setCredential(status);
      setPairingCode("");
      setFeedback({ kind: "success", message: "Device connected. The one-time code was consumed and the credential is protected by Windows." });
    } catch (error) {
      setFeedback({ kind: "error", message: messageFrom(error, "The device could not be connected.") });
    }
  }

  async function disconnect() {
    if (!window.confirm("Remove this device credential from Windows? Unsynchronized local records will remain on this computer.")) return;
    setFeedback({ kind: "working", message: "Removing the protected device credential…" });
    try {
      const status = await disconnectDevice();
      setCredential(status);
      setLastSync(null);
      setFeedback({ kind: "success", message: "The protected credential was removed. Local records were not deleted." });
    } catch (error) {
      setFeedback({ kind: "error", message: messageFrom(error, "The protected credential could not be removed.") });
    }
  }

  return (
    <div className="native-sync-layout">
      <section className="metric-grid" aria-label="Sync summary">
        <article><span>Eligible</span><strong>{eligible.length.toString().padStart(2, "0")}</strong><small>Safe draft creates</small></article>
        <article><span>Retry wait</span><strong>{(stateCounts.retry_wait ?? 0).toString().padStart(2, "0")}</strong><small>Backoff scheduled</small></article>
        <article><span>Needs review</span><strong>{((stateCounts.conflict ?? 0) + (stateCounts.permission_blocked ?? 0)).toString().padStart(2, "0")}</strong><small>Never silently discarded</small></article>
        <article><span>Server inbox</span><strong>{(stateCounts.synced ?? 0).toString().padStart(2, "0")}</strong><small>Received for review</small></article>
      </section>

      <div className="native-sync-grid">
        <section className="panel native-sync-pairing" aria-labelledby="native-pairing-title">
          <div className="panel-heading">
            <div><span>Device trust</span><h2 id="native-pairing-title">Windows connection</h2></div>
            {credential?.connected ? <ShieldCheck aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
          </div>

          {!nativeRuntime ? (
            <div className="native-sync-empty" role="status">
              <CloudOff aria-hidden="true" />
              <div><strong>Browser preview only</strong><p>Install and open the Windows application to use the protected credential vault and native sync client.</p></div>
            </div>
          ) : credential?.connected ? (
            <div className="native-sync-device" data-testid="connected-device">
              <div className="native-sync-device__icon"><Laptop aria-hidden="true" /></div>
              <div>
                <span>Connected device</span>
                <h3>{credential.deviceName}</h3>
                <p>{credential.apiOrigin}</p>
                <dl>
                  <div><dt>Protection</dt><dd>Windows DPAPI · current user</dd></div>
                  <div><dt>Expires</dt><dd>{displayTimestamp(credential.expiresAt)}</dd></div>
                  <div><dt>Device ID</dt><dd><code>{credential.deviceId}</code></dd></div>
                </dl>
              </div>
              <button className="native-sync-text-button" type="button" onClick={() => void disconnect()} disabled={working}>
                <Unplug aria-hidden="true" /> Disconnect
              </button>
            </div>
          ) : (
            <form className="native-sync-form" onSubmit={(event) => void pairDevice(event)}>
              <p>On the hosted website, open <strong>Office → Settings → Pair Windows device</strong>, create a code, then enter it here within ten minutes.</p>
              <div className="native-sync-service" role="note"><ShieldCheck aria-hidden="true" /><span>Verified service<br /><code>{OFFICE_DESKTOP_PRODUCTION_ORIGIN}</code></span></div>
              <label>
                <span>One-time pairing code</span>
                <input
                  value={pairingCode}
                  onChange={(event) => setPairingCode(event.currentTarget.value.toUpperCase())}
                  placeholder="AP-ABCD-2345"
                  inputMode="text"
                  autoCapitalize="characters"
                  spellCheck={false}
                  autoComplete="off"
                  required
                />
              </label>
              <button className="primary-button" type="submit" disabled={working || pairingCode.trim().length === 0}>
                {working ? <LoaderCircle className="is-spinning" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
                Protect & connect
              </button>
            </form>
          )}

          {feedback.kind !== "idle" ? (
            <div className={`native-sync-feedback is-${feedback.kind}`} role={feedback.kind === "error" ? "alert" : "status"} aria-live="polite">
              {feedback.kind === "working" ? <LoaderCircle className="is-spinning" aria-hidden="true" /> : feedback.kind === "error" ? <CloudOff aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
              <p>{feedback.message}</p>
            </div>
          ) : null}
        </section>

        <aside className="panel native-sync-action" aria-labelledby="native-sync-action-title">
          <div className="native-sync-orbit" data-ready={Boolean(credential?.connected && isOnline && eligible.length > 0)} aria-hidden="true">
            <RefreshCw />
            <span>{eligible.length}</span>
          </div>
          <span>Authenticated transfer</span>
          <h2 id="native-sync-action-title">Sync safe drafts when the office is ready.</h2>
          <p>Rust reads the canonical operations directly from SQLite. The webview cannot replace the payload, identity, or revision.</p>
          <div className="native-sync-readiness">
            <div>{isOnline ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}<span>{isOnline ? "Network available" : "Working offline"}</span></div>
            <div><ShieldCheck aria-hidden="true" /><span>{credential?.connected ? "Device authenticated" : "Pairing required"}</span></div>
          </div>
          <label className="native-sync-auto">
            <input
              type="checkbox"
              checked={autoSyncEnabled}
              onChange={(event) => {
                lastAutoAttempt.current = "";
                setAutoSyncEnabled(event.currentTarget.checked);
              }}
            />
            <span><strong>Auto-sync after reconnect</strong><small>Waits 5 seconds, then sends only eligible safe drafts.</small></span>
          </label>
          <button
            className="primary-button native-sync-now"
            type="button"
            onClick={() => void synchronize("manual")}
            disabled={working || !nativeRuntime || !credential?.connected || !isOnline || eligible.length === 0}
          >
            {working ? <LoaderCircle className="is-spinning" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
            Sync {eligible.length > 0 ? `${eligible.length} safe draft${eligible.length === 1 ? "" : "s"}` : "now"}
          </button>
          {lastSync ? <small>Server time {displayTimestamp(lastSync.serverTime)} · {resultSummary(lastSync)}</small> : null}
        </aside>
      </div>

      {paymentQueueCount > 0 ? (
        <aside className="native-sync-guardrail" role="note">
          <ShieldCheck aria-hidden="true" />
          <div><strong>{paymentQueueCount} payment acknowledgement{paymentQueueCount === 1 ? " remains" : "s remain"} local.</strong><p>Payments require server-side posting permission, allocation checks, and audit completion. Desktop protocol v1 will not transmit them as official collections.</p></div>
        </aside>
      ) : null}

      <section className="panel sync-table-panel" aria-labelledby="outbox-title">
        <div className="panel-heading"><div><span>Durable outbox</span><h2 id="outbox-title">Operation ledger</h2></div><span className={`connection-pill ${isOnline ? "is-online" : "is-offline"}`}>{isOnline ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}{isOnline ? "Network available" : "Working offline"}</span></div>
        {workspace.outbox.length === 0 ? (
          <div className="native-sync-empty"><CheckCircle2 aria-hidden="true" /><div><strong>The outbox is clear.</strong><p>Validated local records appear here when they are queued.</p></div></div>
        ) : (
          <div className="sync-operation-list">
            {workspace.outbox.map((operation) => (
              <article key={operation.clientOperationId}>
                <div><strong>{aggregateLabel(operation.aggregateType)}</strong><span>{operation.command} · revision {operation.draftLocalRevision}</span></div>
                <code>{operation.clientOperationId}</code>
                <div><span className="status-badge">{operation.state.replaceAll("_", " ")}</span><small>Attempts {operation.attemptCount}</small></div>
                {operation.lastFailure ? <p role="alert">{operation.lastFailure.message}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
