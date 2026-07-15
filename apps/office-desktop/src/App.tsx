import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bell,
  CheckCircle2,
  CircleDollarSign,
  CloudOff,
  FileText,
  Gauge,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  MessageSquareText,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import {
  createDraftUpsertCommand,
  createLocalInvoiceDraft,
  formatBdt,
  provisionalInvoiceNumber,
  type DraftInput,
  type LocalOfficeDraft,
} from "./offline/model";
import {
  createOfflineOfficeRepository,
  type OfflineOfficeRepository,
  type OfflineWorkspaceSnapshot,
} from "./offline/repository";

type WorkspaceSection = "overview" | "leads" | "payments" | "invoices" | "notices" | "sync";
type LoadState = "loading" | "ready" | "error";

type NavigationItem = {
  readonly key: WorkspaceSection;
  readonly label: string;
  readonly caption: string;
  readonly icon: LucideIcon;
};

const navigationItems: readonly NavigationItem[] = [
  { key: "overview", label: "Overview", caption: "Today at a glance", icon: LayoutDashboard },
  { key: "leads", label: "Leads", caption: "Local follow-up", icon: Users },
  { key: "payments", label: "Payments", caption: "Collections queue", icon: CircleDollarSign },
  { key: "invoices", label: "Invoices", caption: "Draft & print", icon: FileText },
  { key: "notices", label: "Notices", caption: "Issue responsibly", icon: MessageSquareText },
  { key: "sync", label: "Sync center", caption: "Outbox & conflicts", icon: RefreshCw },
] as const;

const sectionCopy: Record<WorkspaceSection, { readonly eyebrow: string; readonly title: string; readonly description: string }> = {
  overview: {
    eyebrow: "Operating desk / Joypurhat",
    title: "One calm view of the work that needs attention.",
    description: "Capture locally, review deliberately, and sync only after the server accepts the operation.",
  },
  leads: {
    eyebrow: "Lead desk",
    title: "Follow the next useful conversation.",
    description: "Prioritize real intent and keep incomplete local records clearly marked until review.",
  },
  payments: {
    eyebrow: "Collection desk",
    title: "Record money without blurring draft and posted states.",
    description: "Offline entries remain provisional. Official receipt numbers and notifications wait for server acceptance.",
  },
  invoices: {
    eyebrow: "Document desk",
    title: "Prepare a clear, printable local invoice draft.",
    description: "Every offline copy carries a provisional number and watermark so it cannot be mistaken for a posted record.",
  },
  notices: {
    eyebrow: "Notice desk",
    title: "Draft the message before it becomes an issued record.",
    description: "Review, approval, issue and delivery remain separate states with an auditable trail.",
  },
  sync: {
    eyebrow: "Offline control plane",
    title: "Know what is local, queued, accepted or conflicted.",
    description: "The outbox is durable; connectivity alone never means an operation reached the server.",
  },
};

const initialForm: DraftInput = {
  customerName: "",
  purpose: "Property installment",
  amount: "",
  notes: "",
  locale: "bn-BD",
};

const emptyWorkspace: OfflineWorkspaceSnapshot = { drafts: [], outbox: [], storage: "browser-preview" };

const demoDrafts = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    commandId: "21111111-1111-4111-8111-111111111111",
    now: new Date("2026-07-15T04:00:00.000Z"),
    input: { customerName: "[DEMO] Joypurhat Buyer", purpose: "Apartment booking discussion", amount: "250000", notes: "Safe demonstration record; no live contact data.", locale: "bn-BD" } satisfies DraftInput,
  },
  {
    id: "12222222-2222-4222-8222-222222222222",
    commandId: "22222222-2222-4222-8222-222222222222",
    now: new Date("2026-07-15T04:10:00.000Z"),
    input: { customerName: "[DEMO] Purbo Bazar Landowner", purpose: "Joint-venture planning", amount: "100000", notes: "Safe demonstration record; no live contact data.", locale: "en-BD" } satisfies DraftInput,
  },
] as const;

async function openOfflineWorkspace() {
  const repository = await createOfflineOfficeRepository();
  const snapshot = await repository.load();
  return { repository, snapshot };
}

function getWorkspaceStatus(snapshot: OfflineWorkspaceSnapshot) {
  return snapshot.storage === "sqlite"
    ? "Local SQLite workspace ready."
    : "Browser preview ready. Native builds use local SQLite.";
}

function App() {
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("overview");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [workspace, setWorkspace] = useState<OfflineWorkspaceSnapshot>(emptyWorkspace);
  const [form, setForm] = useState<DraftInput>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Opening the encrypted local workspace…");
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);
  const repositoryRef = useRef<OfflineOfficeRepository | null>(null);
  const customerNameRef = useRef<HTMLInputElement>(null);

  const loadWorkspace = useCallback(async () => {
    setLoadState("loading");
    setStatusMessage("Opening the local workspace…");
    try {
      const { repository, snapshot } = await openOfflineWorkspace();
      repositoryRef.current = repository;
      setWorkspace(snapshot);
      setLoadState("ready");
      setStatusMessage(getWorkspaceStatus(snapshot));
    } catch (error) {
      setLoadState("error");
      setStatusMessage(error instanceof Error ? error.message : "The local workspace could not be opened.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void openOfflineWorkspace()
      .then(({ repository, snapshot }) => {
        if (cancelled) return;
        repositoryRef.current = repository;
        setWorkspace(snapshot);
        setLoadState("ready");
        setStatusMessage(getWorkspaceStatus(snapshot));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadState("error");
        setStatusMessage(error instanceof Error ? error.message : "The local workspace could not be opened.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const selectedDraft = workspace.drafts[0] ?? null;
  const pendingCount = workspace.outbox.filter((item) => item.state === "pending").length;
  const section = sectionCopy[activeSection];
  const totalDraftValue = useMemo(
    () => workspace.drafts.reduce((total, draft) => total + draft.payload.amountMinor, 0),
    [workspace.drafts],
  );

  const refreshWorkspace = useCallback(async () => {
    if (!repositoryRef.current) return;
    const snapshot = await repositoryRef.current.load();
    setWorkspace(snapshot);
  }, []);

  async function handleSaveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const result = createLocalInvoiceDraft(form);
    if (!result.ok || !result.draft) {
      setFormError(result.ok ? "The local draft could not be created." : result.message);
      return;
    }
    if (!repositoryRef.current) {
      setFormError("The local workspace is not ready yet.");
      return;
    }

    setIsSaving(true);
    try {
      await repositoryRef.current.saveDraftAndQueue(result.draft, createDraftUpsertCommand(result.draft));
      await refreshWorkspace();
      setForm(initialForm);
      setStatusMessage("Draft saved locally and queued. It is not yet an official server record.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The draft could not be saved locally.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLoadDemo() {
    if (!repositoryRef.current) return;
    setIsSaving(true);
    try {
      for (const demo of demoDrafts) {
        const result = createLocalInvoiceDraft(demo.input, { now: () => demo.now, createId: () => demo.id });
        if (!result.ok || !result.draft) continue;
        const command = createDraftUpsertCommand(result.draft, { now: () => demo.now, createId: () => demo.commandId });
        await repositoryRef.current.saveDraftAndQueue(result.draft, command);
      }
      await refreshWorkspace();
      setStatusMessage("Two clearly marked demo drafts are available for testing.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Demo drafts could not be loaded.");
    } finally {
      setIsSaving(false);
    }
  }

  function focusNewDraft() {
    setActiveSection("invoices");
    window.setTimeout(() => customerNameRef.current?.focus(), 0);
  }

  if (loadState === "loading") {
    return (
      <main className="system-state" aria-busy="true">
        <img src="/brand/logo-primary.png" alt="Abdullah Properties" />
        <LoaderCircle className="state-spinner" aria-hidden="true" />
        <h1>Opening your local office.</h1>
        <p>Drafts and the sync outbox stay on this device while the workspace starts.</p>
      </main>
    );
  }

  if (loadState === "error") {
    return (
      <main className="system-state">
        <CloudOff aria-hidden="true" />
        <h1>The local workspace is unavailable.</h1>
        <p>{statusMessage}</p>
        <button className="primary-button" type="button" onClick={() => void loadWorkspace()}>
          <RotateCcw aria-hidden="true" /> Retry local storage
        </button>
      </main>
    );
  }

  return (
    <div className="office-app">
      <aside className="office-sidebar">
        <a className="office-brand" href="#workspace-title" aria-label="Abdullah Properties Office home">
          <img src="/brand/logo-inverse.png" alt="Abdullah Properties" />
          <span>Office OS</span>
        </a>

        <nav className="office-navigation" aria-label="Office sections">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.key}
                className="office-navigation__item"
                aria-current={activeSection === item.key ? "page" : undefined}
                onClick={() => setActiveSection(item.key)}
              >
                <Icon aria-hidden="true" />
                <span><strong>{item.label}</strong><small>{item.caption}</small></span>
              </button>
            );
          })}
        </nav>

        <div className="device-trust">
          <ShieldCheck aria-hidden="true" />
          <div><strong>Local-first</strong><span>Official status comes from the server.</span></div>
        </div>
      </aside>

      <main className="office-workspace">
        <header className="workspace-bar">
          <div className="workspace-search">
            <Search aria-hidden="true" />
            <label className="sr-only" htmlFor="office-search">Search local records</label>
            <input id="office-search" type="search" placeholder="Search local drafts" disabled title="Search activates when the local index is connected." />
          </div>
          <div className="workspace-actions">
            <span className={`connection-pill ${isOnline ? "is-online" : "is-offline"}`}>
              {isOnline ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
              {isOnline ? "Online · sync adapter pending" : "Offline · local work ready"}
            </span>
            <button className="icon-button" type="button" aria-label="Notifications" title="No unread notifications">
              <Bell aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="workspace-scroll">
          <section className="workspace-intro" aria-labelledby="workspace-title">
            <div>
              <p className="workspace-eyebrow">{section.eyebrow}</p>
              <h1 id="workspace-title">{section.title}</h1>
              <p>{section.description}</p>
            </div>
            <button className="primary-button" type="button" onClick={focusNewDraft}>
              <Plus aria-hidden="true" /> New local invoice
            </button>
          </section>

          <div className="truth-banner" role="status" aria-live="polite">
            <div><CheckCircle2 aria-hidden="true" /><span>{statusMessage}</span></div>
            <button type="button" onClick={() => void refreshWorkspace()} aria-label="Refresh local workspace">
              <RefreshCw aria-hidden="true" /> Refresh
            </button>
          </div>

          <section className="metric-grid" aria-label="Local office summary">
            <article><span>Local drafts</span><strong>{workspace.drafts.length.toString().padStart(2, "0")}</strong><small>Saved on this device</small></article>
            <article><span>Pending outbox</span><strong>{pendingCount.toString().padStart(2, "0")}</strong><small>Awaiting secure server sync</small></article>
            <article><span>Draft value</span><strong>{formatBdt(totalDraftValue)}</strong><small>Not posted revenue</small></article>
            <article><span>Conflicts</span><strong>00</strong><small>No unresolved local conflict</small></article>
          </section>

          <div className="workspace-grid">
            <section className="panel work-panel" aria-labelledby="local-work-title">
              <div className="panel-heading">
                <div><span>Local queue</span><h2 id="local-work-title">Drafts that need review</h2></div>
                <button className="text-button" type="button" onClick={() => setActiveSection("sync")}>Review outbox</button>
              </div>

              {workspace.drafts.length === 0 ? (
                <div className="empty-state">
                  <Inbox aria-hidden="true" />
                  <h3>No local drafts yet.</h3>
                  <p>Start one offline or load two clearly marked demonstration records.</p>
                  <button className="secondary-button" type="button" onClick={() => void handleLoadDemo()} disabled={isSaving}>Load demo drafts</button>
                </div>
              ) : (
                <div className="draft-list">
                  {workspace.drafts.map((draft) => (
                    <article className="draft-row" key={draft.id}>
                      <span className="draft-row__mark" aria-hidden="true">AP</span>
                      <div><strong>{draft.payload.customerName}</strong><span>{draft.payload.purpose}</span></div>
                      <div><strong>{formatBdt(draft.payload.amountMinor)}</strong><span>{provisionalInvoiceNumber(draft)}</span></div>
                      <span className="status-badge">Queued locally</span>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="panel sync-panel" aria-labelledby="sync-readiness-title">
              <div className="sync-orbit" data-online={isOnline} aria-hidden="true"><Gauge /><span>{pendingCount}</span></div>
              <span>Sync readiness</span>
              <h2 id="sync-readiness-title">Local data is safe. Server push is gated.</h2>
              <p>{isOnline ? "Connectivity is available, but a device-authenticated sync endpoint must be configured before sending." : "Keep working. The outbox will remain on this device until connectivity and server authentication are both ready."}</p>
              <dl>
                <div><dt>Storage</dt><dd>{workspace.storage === "sqlite" ? "SQLite" : "Browser preview"}</dd></div>
                <div><dt>Delivery claims</dt><dd>Disabled</dd></div>
                <div><dt>Official numbering</dt><dd>Server only</dd></div>
              </dl>
            </aside>
          </div>

          <div className="document-grid">
            <section className="panel draft-form-panel" aria-labelledby="draft-form-title">
              <div className="panel-heading"><div><span>Offline capture</span><h2 id="draft-form-title">New provisional invoice</h2></div></div>
              <form className="draft-form" onSubmit={(event) => void handleSaveDraft(event)} noValidate>
                <label>Customer or account name<input ref={customerNameRef} value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.currentTarget.value })} autoComplete="off" /></label>
                <label>Purpose<input value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.currentTarget.value })} /></label>
                <label>Amount (BDT)<input inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.currentTarget.value })} placeholder="0.00" /></label>
                <label>Invoice language<select value={form.locale} onChange={(event) => setForm({ ...form, locale: event.currentTarget.value === "en-BD" ? "en-BD" : "bn-BD" })}><option value="bn-BD">বাংলা</option><option value="en-BD">English</option></select></label>
                <label className="form-wide">Internal note<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.currentTarget.value })} rows={3} /></label>
                {formError ? <p className="form-error" role="alert">{formError}</p> : null}
                <div className="form-actions form-wide">
                  <span>Autosave begins after a valid local draft exists.</span>
                  <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? <LoaderCircle className="button-spinner" aria-hidden="true" /> : <Plus aria-hidden="true" />} Save locally</button>
                </div>
              </form>
            </section>

            <section className="invoice-preview-shell" aria-labelledby="invoice-preview-title">
              <div className="invoice-toolbar">
                <div><span>Print preview</span><h2 id="invoice-preview-title">Provisional document</h2></div>
                <button className="secondary-button" type="button" onClick={() => window.print()} disabled={!selectedDraft}><Printer aria-hidden="true" /> Print / Save PDF</button>
              </div>
              {selectedDraft ? <InvoicePreview draft={selectedDraft} /> : <div className="invoice-empty"><FileText aria-hidden="true" /><p>Create or load a local draft to preview the branded invoice.</p></div>}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function InvoicePreview({ draft }: { readonly draft: LocalOfficeDraft }) {
  return (
    <article className="invoice-preview">
      <img className="invoice-watermark" src="/brand/logo-mark.png" alt="" aria-hidden="true" />
      <header>
        <img src="/brand/logo-primary.png" alt="Abdullah Properties" />
        <div><span>PROVISIONAL</span><strong>{provisionalInvoiceNumber(draft)}</strong></div>
      </header>
      <div className="invoice-title"><span>Local invoice draft</span><h3>{draft.payload.purpose}</h3><p>Created {new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeZone: "Asia/Dhaka" }).format(new Date(draft.createdAt))}</p></div>
      <dl>
        <div><dt>Bill to</dt><dd>{draft.payload.customerName}</dd></div>
        <div><dt>Status</dt><dd>Queued locally</dd></div>
        <div><dt>Amount</dt><dd>{formatBdt(draft.payload.amountMinor)}</dd></div>
      </dl>
      {draft.payload.notes ? <p className="invoice-note">{draft.payload.notes}</p> : null}
      <footer><span>2nd Floor, Pouro Market, Purbo Bazar, Joypurhat</span><strong>NOT POSTED · SERVER CONFIRMATION REQUIRED</strong></footer>
    </article>
  );
}

export default App;
