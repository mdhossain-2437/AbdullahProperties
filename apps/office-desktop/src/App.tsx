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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandedDocument, documentAmount } from "./components/BrandedDocument";
import { RecordEditor } from "./components/RecordEditor";
import { SyncConsole } from "./components/SyncConsole";
import {
  createQueuedLocalRecord,
  formHasUserContent,
  formPayloadForRecord,
  formatBdt,
  localRecordKindLabel,
  provisionalDocumentNumber,
  recordAmountMinor,
  recordDisplayName,
  recordSummary,
  restoreRecordInput,
  type InvoiceDraftInput,
  type LeadDraftInput,
  type LocalOfficeRecord,
  type LocalRecordInput,
  type LocalRecordKind,
  type NoticeDraftInput,
  type PaymentDraftInput,
} from "./offline/model";
import { addDhakaCalendarDays, getDhakaCalendarDate } from "./offline/dates";
import {
  createOfflineOfficeRepository,
  type OfflineOfficeRepository,
  type OfflineWorkspaceSnapshot,
} from "./offline/repository";

type WorkspaceSection = "overview" | "leads" | "payments" | "invoices" | "notices" | "sync";
type LoadState = "loading" | "ready" | "error";
type AutosaveState = "idle" | "saving" | "saved" | "restored" | "error";

type NavigationItem = {
  readonly key: WorkspaceSection;
  readonly label: string;
  readonly caption: string;
  readonly icon: LucideIcon;
};

type OfficeForms = {
  lead: LeadDraftInput;
  invoice_draft: InvoiceDraftInput;
  payment_acknowledgement: PaymentDraftInput;
  notice_draft: NoticeDraftInput;
};

const navigationItems: readonly NavigationItem[] = [
  { key: "overview", label: "Overview", caption: "Operational pulse", icon: LayoutDashboard },
  { key: "leads", label: "Leads", caption: "Capture & follow-up", icon: Users },
  { key: "payments", label: "Payments", caption: "Provisional capture", icon: CircleDollarSign },
  { key: "invoices", label: "Invoices", caption: "Draft & print", icon: FileText },
  { key: "notices", label: "Notices", caption: "Compose & print", icon: MessageSquareText },
  { key: "sync", label: "Sync center", caption: "Outbox & conflicts", icon: RefreshCw },
] as const;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return fallback;
}

const sectionCopy: Record<WorkspaceSection, { readonly eyebrow: string; readonly title: string; readonly description: string }> = {
  overview: {
    eyebrow: "Office command center / Joypurhat",
    title: "Today’s work, without the noise.",
    description: "Capture safely on this device, keep every pending operation visible, and print provisional documents even when the internet is unavailable.",
  },
  leads: {
    eyebrow: "Lead desk",
    title: "Turn the next conversation into a clear follow-up.",
    description: "Record intent, location, priority and the next useful date. Every entry is available offline.",
  },
  payments: {
    eyebrow: "Collection desk",
    title: "Acknowledge locally. Post only after server review.",
    description: "Offline payment capture remains provisional and cannot allocate an invoice or trigger customer messaging.",
  },
  invoices: {
    eyebrow: "Invoice desk",
    title: "Prepare a branded invoice draft in one focused view.",
    description: "Autosave the working form, queue a validated record and print a clearly marked provisional copy.",
  },
  notices: {
    eyebrow: "Notice desk",
    title: "Write, review and print before anything is issued.",
    description: "Draft Bengali or English notices locally. Official numbering and public verification remain server-owned.",
  },
  sync: {
    eyebrow: "Offline control plane",
    title: "Every queued operation stays accountable.",
    description: "See lifecycle state, retries, conflicts and permission blocks without treating connectivity as proof of delivery.",
  },
};

const kindBySection: Readonly<Partial<Record<WorkspaceSection, LocalRecordKind>>> = {
  leads: "lead",
  payments: "payment_acknowledgement",
  invoices: "invoice_draft",
  notices: "notice_draft",
};

const sectionByKind: Readonly<Record<LocalRecordKind, WorkspaceSection>> = {
  lead: "leads",
  payment_acknowledgement: "payments",
  invoice_draft: "invoices",
  notice_draft: "notices",
};

function todayDate() {
  return getDhakaCalendarDate();
}

function dateAfter(days: number) {
  return addDhakaCalendarDays(days);
}

function createInitialForms(): OfficeForms {
  const today = todayDate();
  return {
    lead: {
      customerName: "",
      phone: "",
      interest: "",
      location: "Joypurhat",
      followUpDate: "",
      priority: "normal",
      notes: "",
    },
    invoice_draft: {
      customerName: "",
      phone: "",
      email: "",
      purpose: "Property installment",
      amount: "",
      issueDate: today,
      dueDate: dateAfter(30),
      locale: "bn",
      notes: "",
    },
    payment_acknowledgement: {
      customerName: "",
      phone: "",
      email: "",
      amount: "",
      method: "cash",
      reference: "",
      paidAt: today,
      invoiceReference: "",
      locale: "bn",
      notes: "",
    },
    notice_draft: {
      recipientName: "",
      phone: "",
      email: "",
      subject: "",
      body: "",
      effectiveDate: today,
      locale: "bn",
    },
  };
}

const emptyWorkspace: OfflineWorkspaceSnapshot = {
  records: [],
  outbox: [],
  formDrafts: [],
  legacyRecovery: { drafts: [], outboxCount: 0 },
  storage: "browser-preview",
};

function inputForKind(kind: LocalRecordKind, forms: OfficeForms): LocalRecordInput {
  switch (kind) {
    case "lead": return { kind, input: forms.lead };
    case "invoice_draft": return { kind, input: forms.invoice_draft };
    case "payment_acknowledgement": return { kind, input: forms.payment_acknowledgement };
    case "notice_draft": return { kind, input: forms.notice_draft };
  }
}

function updateForms(forms: OfficeForms, value: LocalRecordInput): OfficeForms {
  switch (value.kind) {
    case "lead": return { ...forms, lead: value.input };
    case "invoice_draft": return { ...forms, invoice_draft: value.input };
    case "payment_acknowledgement": return { ...forms, payment_acknowledgement: value.input };
    case "notice_draft": return { ...forms, notice_draft: value.input };
  }
}

function restoreForms(snapshot: OfflineWorkspaceSnapshot) {
  let forms = createInitialForms();
  for (const autosave of snapshot.formDrafts) {
    const restored = restoreRecordInput(autosave.kind, autosave.payload);
    if (restored) forms = updateForms(forms, restored);
  }
  return forms;
}

function workspaceStatus(snapshot: OfflineWorkspaceSnapshot) {
  if (snapshot.legacyRecovery.drafts.length > 0) {
    return `${snapshot.legacyRecovery.drafts.length} record${snapshot.legacyRecovery.drafts.length === 1 ? "" : "s"} from the previous offline format are preserved in the recovery queue.`;
  }
  return snapshot.storage === "sqlite"
    ? "Windows SQLite workspace ready. Local records are available offline."
    : "Browser preview ready. The installed Windows application uses SQLite.";
}

function operationForRecord(record: LocalOfficeRecord, snapshot: OfflineWorkspaceSnapshot) {
  return snapshot.outbox.find((item) => item.draftId === record.draft.draftId) ?? null;
}

function recordLifecycleLabel(record: LocalOfficeRecord, snapshot: OfflineWorkspaceSnapshot) {
  const operation = operationForRecord(record, snapshot);
  if (!operation) return "Saved locally";
  const labels: Readonly<Record<typeof operation.state, string>> = {
    queued: "Queued locally",
    syncing: "Syncing",
    synced: "Server inbox received",
    retry_wait: "Retry scheduled",
    conflict: "Needs review",
    permission_blocked: "Permission blocked",
  };
  return labels[operation.state];
}

const demoDefinitions: readonly Readonly<{
  record: LocalRecordInput;
  now: string;
  ids: readonly [string, string, string, string];
}>[] = [
  {
    now: "2026-07-15T04:00:00.000Z",
    ids: ["a1111111-1111-4111-8111-111111111111", "a2111111-2111-4211-8211-211111111111", "a3111111-3111-4311-8311-311111111111", "a4111111-4111-4411-8411-411111111111"],
    record: { kind: "lead", input: { customerName: "[DEMO] Joypurhat Buyer", phone: "+880 1700-000001", interest: "Two-bedroom apartment", location: "Joypurhat Sadar", followUpDate: "2026-07-20", priority: "high", notes: "Demonstration record; no live customer data." } },
  },
  {
    now: "2026-07-15T04:05:00.000Z",
    ids: ["b1111111-1111-4111-8111-111111111111", "b2111111-2111-4211-8211-211111111111", "b3111111-3111-4311-8311-311111111111", "b4111111-4111-4411-8411-411111111111"],
    record: { kind: "invoice_draft", input: { customerName: "[DEMO] Apartment Customer", phone: "+880 1700-000002", email: "demo@example.com", purpose: "Apartment booking installment", amount: "250000", issueDate: "2026-07-15", dueDate: "2026-08-15", locale: "bn", notes: "Demonstration invoice draft." } },
  },
  {
    now: "2026-07-15T04:10:00.000Z",
    ids: ["c1111111-1111-4111-8111-111111111111", "c2111111-2111-4211-8211-211111111111", "c3111111-3111-4311-8311-311111111111", "c4111111-4111-4411-8411-411111111111"],
    record: { kind: "payment_acknowledgement", input: { customerName: "[DEMO] Installment Customer", phone: "+880 1700-000003", email: "", amount: "50000", method: "bank_transfer", reference: "DEMO-REF-001", paidAt: "2026-07-15", invoiceReference: "LOCAL-DEMO-INVOICE", locale: "en", notes: "Provisional demonstration acknowledgement." } },
  },
  {
    now: "2026-07-15T04:15:00.000Z",
    ids: ["d1111111-1111-4111-8111-111111111111", "d2111111-2111-4211-8211-211111111111", "d3111111-3111-4311-8311-311111111111", "d4111111-4111-4411-8411-411111111111"],
    record: { kind: "notice_draft", input: { recipientName: "[DEMO] Purbo Bazar Landowner", phone: "", email: "demo@example.com", subject: "Planning meeting notice", body: "Please review the proposed meeting date.\nBring the available land and identity documents for the initial discussion.", effectiveDate: "2026-07-18", locale: "bn" } },
  },
];

function App() {
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("overview");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [workspace, setWorkspace] = useState<OfflineWorkspaceSnapshot>(emptyWorkspace);
  const [forms, setForms] = useState<OfficeForms>(() => createInitialForms());
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Opening the local office workspace…");
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);
  const repositoryRef = useRef<OfflineOfficeRepository | null>(null);
  const workspaceScrollRef = useRef<HTMLDivElement | null>(null);

  const loadWorkspace = useCallback(async (restoreAutosaves = false) => {
    setLoadState("loading");
    try {
      const repository = await createOfflineOfficeRepository();
      const snapshot = await repository.load();
      repositoryRef.current = repository;
      setWorkspace(snapshot);
      if (restoreAutosaves) {
        setForms(restoreForms(snapshot));
        if (snapshot.formDrafts.length > 0) setAutosaveState("restored");
      }
      setSelectedRecordId((current) => current ?? snapshot.records[0]?.draft.draftId ?? null);
      setLoadState("ready");
      setStatusMessage(workspaceStatus(snapshot));
    } catch (error) {
      setLoadState("error");
      setStatusMessage(errorMessage(error, "The local workspace could not be opened."));
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void loadWorkspace(true), 0);
    return () => window.clearTimeout(task);
  }, [loadWorkspace]);

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

  const activeKind = kindBySection[activeSection] ?? null;
  const activeInput = useMemo(
    () => activeKind ? inputForKind(activeKind, forms) : null,
    [activeKind, forms],
  );

  useEffect(() => {
    if (!activeInput || !formHasUserContent(activeInput) || !repositoryRef.current) return;
    let cancelled = false;
    setAutosaveState("saving");
    const timeout = window.setTimeout(() => {
      void repositoryRef.current?.saveFormDraft({
        kind: activeInput.kind,
        payload: formPayloadForRecord(activeInput),
        updatedAt: new Date().toISOString(),
      }).then(() => {
        if (!cancelled) setAutosaveState("saved");
      }).catch(() => {
        if (!cancelled) setAutosaveState("error");
      });
    }, 850);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [activeInput]);

  const refreshWorkspace = useCallback(async () => {
    const repository = repositoryRef.current;
    if (!repository) return;
    const snapshot = await repository.load();
    setWorkspace(snapshot);
    setStatusMessage(workspaceStatus(snapshot));
  }, []);

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("en-BD");
  const visibleRecords = useMemo(() => {
    const base = normalizedQuery
      ? workspace.records
      : activeKind
        ? workspace.records.filter((record) => record.kind === activeKind)
        : workspace.records;
    if (!normalizedQuery) return base;
    return base.filter((record) => [
      recordDisplayName(record),
      recordSummary(record),
      provisionalDocumentNumber(record),
      localRecordKindLabel(record.kind),
    ].join(" ").toLocaleLowerCase("en-BD").includes(normalizedQuery));
  }, [activeKind, normalizedQuery, workspace.records]);

  const selectedRecord = workspace.records.find((record) => record.draft.draftId === selectedRecordId)
    ?? visibleRecords[0]
    ?? null;
  const pendingCount = workspace.outbox.filter((item) => item.state === "queued" || item.state === "retry_wait").length;
  const conflictCount = workspace.outbox.filter((item) => item.state === "conflict" || item.state === "permission_blocked").length;
  const financialDraftValue = workspace.records.reduce((sum, record) => sum + recordAmountMinor(record), 0);
  const section = sectionCopy[activeSection];
  const autosaveLabel = autosaveState === "saving"
    ? "Saving working draft…"
    : autosaveState === "saved"
      ? "Working draft autosaved on this device."
      : autosaveState === "restored"
        ? "A previous working draft was restored."
        : autosaveState === "error"
          ? "Autosave failed. Keep this window open and retry."
          : "Changes autosave after a short pause.";

  async function handleCreateRecord(value: LocalRecordInput) {
    setFormError(null);
    const result = createQueuedLocalRecord(value);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    const repository = repositoryRef.current;
    if (!repository) {
      setFormError("The local workspace is still opening.");
      return;
    }

    setIsSaving(true);
    try {
      await repository.commitRecord(result.commit);
      await repository.clearFormDraft(value.kind);
      setForms((current) => updateForms(current, inputForKind(value.kind, createInitialForms())));
      await refreshWorkspace();
      setSelectedRecordId(result.draft.draftId);
      setAutosaveState("idle");
      setStatusMessage(`${localRecordKindLabel(value.kind)} saved and queued locally. It is not yet an official server record.`);
    } catch (error) {
      setFormError(errorMessage(error, "The local record could not be committed."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLoadDemo() {
    const repository = repositoryRef.current;
    if (!repository) return;
    setIsSaving(true);
    try {
      for (const definition of demoDefinitions) {
        const ids = [...definition.ids];
        const result = createQueuedLocalRecord(definition.record, {
          now: () => new Date(definition.now),
          createId: () => ids.shift() ?? crypto.randomUUID(),
        });
        if (!result.ok) throw new Error(result.message);
        await repository.commitRecord(result.commit);
      }
      await refreshWorkspace();
      setStatusMessage("Four clearly marked demonstration records are ready for testing.");
    } catch (error) {
      setStatusMessage(errorMessage(error, "Demonstration records could not be loaded."));
    } finally {
      setIsSaving(false);
    }
  }

  function navigate(sectionKey: WorkspaceSection) {
    setActiveSection(sectionKey);
    setFormError(null);
    if (workspaceScrollRef.current) workspaceScrollRef.current.scrollTop = 0;
    const kind = kindBySection[sectionKey];
    const first = kind ? workspace.records.find((record) => record.kind === kind) : workspace.records[0];
    if (first) setSelectedRecordId(first.draft.draftId);
  }

  function openRecord(record: LocalOfficeRecord) {
    setSelectedRecordId(record.draft.draftId);
    if (!normalizedQuery) setActiveSection(sectionByKind[record.kind]);
  }

  if (loadState === "loading") {
    return (
      <main className="system-state" aria-busy="true">
        <img src="/brand/logo-primary.png" alt="Abdullah Properties" />
        <LoaderCircle className="state-spinner" aria-hidden="true" />
        <h1>Opening your local office.</h1>
        <p>SQLite records, autosaves and the durable outbox are loading on this device.</p>
      </main>
    );
  }

  if (loadState === "error") {
    return (
      <main className="system-state">
        <CloudOff aria-hidden="true" />
        <h1>The local workspace is unavailable.</h1>
        <p>{statusMessage}</p>
        <button className="primary-button" type="button" onClick={() => void loadWorkspace(true)}>
          <RotateCcw aria-hidden="true" /> Retry local storage
        </button>
      </main>
    );
  }

  return (
    <div className="office-app">
      <aside className="office-sidebar">
        <button className="office-brand" type="button" onClick={() => navigate("overview")} aria-label="Abdullah Properties Office home">
          <img src="/brand/logo-inverse.png" alt="Abdullah Properties" />
          <span>Office OS · Desktop</span>
        </button>
        <nav className="office-navigation" aria-label="Office sections">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.key}
                className="office-navigation__item"
                aria-label={`${item.label}: ${item.caption}`}
                title={`${item.label} — ${item.caption}`}
                aria-current={activeSection === item.key ? "page" : undefined}
                onClick={() => navigate(item.key)}
              >
                <Icon aria-hidden="true" />
                <span><strong>{item.label}</strong><small>{item.caption}</small></span>
              </button>
            );
          })}
        </nav>
        <div className="device-trust">
          <ShieldCheck aria-hidden="true" />
          <div><strong>Local-first</strong><span>Official status comes only from the server.</span></div>
        </div>
      </aside>

      <main className="office-workspace">
        <header className="workspace-bar">
          <div className="workspace-search">
            <Search aria-hidden="true" />
            <label className="sr-only" htmlFor="office-search">Search local records</label>
            <input id="office-search" data-testid="office-search" type="search" placeholder="Search name, reference or record type" value={searchQuery} onChange={(event) => setSearchQuery(event.currentTarget.value)} />
          </div>
          <div className="workspace-actions">
            <span className={`connection-pill ${isOnline ? "is-online" : "is-offline"}`}>
              {isOnline ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
              {isOnline ? "Online · local queue protected" : "Offline · local work ready"}
            </span>
            <button className="icon-button" type="button" aria-label="Notification delivery status" title="Notification delivery status" onClick={() => setStatusMessage("Email and SMS remain queued on the server. This device never claims delivery without provider confirmation.")}>
              <Bell aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="workspace-scroll" ref={workspaceScrollRef}>
          <section className="workspace-intro" aria-labelledby="workspace-title">
            <div>
              <p className="workspace-eyebrow">{section.eyebrow}</p>
              <h1 id="workspace-title">{section.title}</h1>
              <p>{section.description}</p>
            </div>
            {activeSection === "overview" ? (
              <button className="primary-button" type="button" onClick={() => navigate("invoices")}><Plus aria-hidden="true" /> New invoice</button>
            ) : activeSection !== "sync" ? (
              <span className="section-record-count">{visibleRecords.length.toString().padStart(2, "0")} local records</span>
            ) : null}
          </section>

          <div className="truth-banner" role="status" aria-live="polite">
            <div><CheckCircle2 aria-hidden="true" /><span>{normalizedQuery ? `${visibleRecords.length} local search result${visibleRecords.length === 1 ? "" : "s"}.` : statusMessage}</span></div>
            <button type="button" onClick={() => void refreshWorkspace()} aria-label="Refresh local workspace"><RefreshCw aria-hidden="true" /> Refresh</button>
          </div>

          {normalizedQuery ? (
            <SearchResults
              records={visibleRecords}
              workspace={workspace}
              selectedRecord={selectedRecord}
              onSelect={openRecord}
              onClear={() => setSearchQuery("")}
            />
          ) : null}

          {activeSection === "overview" && !normalizedQuery ? (
            <Overview
              workspace={workspace}
              records={visibleRecords}
              pendingCount={pendingCount}
              conflictCount={conflictCount}
              financialDraftValue={financialDraftValue}
              selectedRecord={selectedRecord}
              onOpenRecord={openRecord}
              onLoadDemo={() => void handleLoadDemo()}
              isSaving={isSaving}
            />
          ) : null}

          {activeKind && activeInput && !normalizedQuery ? (
            <RecordDesk
              kind={activeKind}
              value={activeInput}
              workspace={workspace}
              records={visibleRecords}
              selectedRecord={selectedRecord}
              onSelectRecord={openRecord}
              onChange={(value) => setForms((current) => updateForms(current, value))}
              onSubmit={(value) => void handleCreateRecord(value)}
              isSaving={isSaving}
              formError={formError}
              autosaveLabel={autosaveLabel}
            />
          ) : null}

          {activeSection === "sync" && !normalizedQuery ? (
            <SyncConsole workspace={workspace} isOnline={isOnline} onRefresh={refreshWorkspace} />
          ) : null}
        </div>
      </main>
    </div>
  );
}

function SearchResults({
  records,
  workspace,
  selectedRecord,
  onSelect,
  onClear,
}: {
  readonly records: readonly LocalOfficeRecord[];
  readonly workspace: OfflineWorkspaceSnapshot;
  readonly selectedRecord: LocalOfficeRecord | null;
  readonly onSelect: (record: LocalOfficeRecord) => void;
  readonly onClear: () => void;
}) {
  const selectedMatch = selectedRecord && records.some((record) => record.draft.draftId === selectedRecord.draft.draftId)
    ? selectedRecord
    : records[0] ?? null;
  return (
    <div className="search-results-layout" data-testid="search-results">
      <div className="search-results-heading">
        <div><span>Cross-module search</span><h2>{records.length} matching local record{records.length === 1 ? "" : "s"}</h2></div>
        <button className="secondary-button" type="button" onClick={onClear}>Clear search</button>
      </div>
      <div className="document-grid">
        <RecordList title="Search results" records={records} workspace={workspace} selectedRecord={selectedMatch} onSelect={onSelect} />
        <section className="invoice-preview-shell" aria-labelledby="search-preview-title">
          <div className="invoice-toolbar"><div><span>Selected match</span><h2 id="search-preview-title">Local record preview</h2></div></div>
          {selectedMatch ? <BrandedDocument record={selectedMatch} /> : <div className="invoice-empty"><Search aria-hidden="true" /><p>No local record matches this search.</p></div>}
        </section>
      </div>
    </div>
  );
}

type OverviewProps = {
  readonly workspace: OfflineWorkspaceSnapshot;
  readonly records: readonly LocalOfficeRecord[];
  readonly pendingCount: number;
  readonly conflictCount: number;
  readonly financialDraftValue: number;
  readonly selectedRecord: LocalOfficeRecord | null;
  readonly onOpenRecord: (record: LocalOfficeRecord) => void;
  readonly onLoadDemo: () => void;
  readonly isSaving: boolean;
};

function Overview({ workspace, records, pendingCount, conflictCount, financialDraftValue, selectedRecord, onOpenRecord, onLoadDemo, isSaving }: OverviewProps) {
  return (
    <>
      <section className="metric-grid" aria-label="Local office summary">
        <article><span>Local records</span><strong>{workspace.records.length.toString().padStart(2, "0")}</strong><small>Available on this device</small></article>
        <article><span>Pending outbox</span><strong>{pendingCount.toString().padStart(2, "0")}</strong><small>Awaiting authenticated sync</small></article>
        <article><span>Provisional value</span><strong>{formatBdt(financialDraftValue)}</strong><small>Not posted revenue</small></article>
        <article><span>Needs review</span><strong>{conflictCount.toString().padStart(2, "0")}</strong><small>Conflict or permission block</small></article>
      </section>
      <div className="workspace-grid">
        <RecordList title="Recent local work" records={records} workspace={workspace} selectedRecord={selectedRecord} onSelect={onOpenRecord} onLoadDemo={onLoadDemo} isSaving={isSaving} />
        <aside className="panel sync-panel" aria-labelledby="sync-readiness-title">
          <div className="sync-orbit" data-online="false" aria-hidden="true"><Gauge /><span>{pendingCount}</span></div>
          <span>Sync readiness</span>
          <h2 id="sync-readiness-title">Offline work is ready. Server pairing is still gated.</h2>
          <p>The desktop protocol is durable and versioned. A device-authenticated API must be deployed before records can leave this computer.</p>
          <dl>
            <div><dt>Storage</dt><dd>{workspace.storage === "sqlite" ? "SQLite" : "Preview"}</dd></div>
            <div><dt>Official numbering</dt><dd>Server only</dd></div>
            <div><dt>Delivery claims</dt><dd>Disabled locally</dd></div>
          </dl>
        </aside>
      </div>
      {workspace.legacyRecovery.drafts.length > 0 ? (
        <section className="panel legacy-recovery" aria-labelledby="legacy-recovery-title">
          <div className="panel-heading">
            <div><span>Upgrade safety</span><h2 id="legacy-recovery-title">Previous offline work preserved for review</h2></div>
            <small>{workspace.legacyRecovery.outboxCount} legacy queue operation{workspace.legacyRecovery.outboxCount === 1 ? "" : "s"}</small>
          </div>
          <p>
            These records came from the first local database format. They are intentionally not
            re-sent or converted automatically because the old payload contract cannot prove the
            same financial and identity guarantees. Review and copy the source details before dismissal.
          </p>
          <div className="legacy-recovery__list">
            {workspace.legacyRecovery.drafts.map((draft) => (
              <details key={draft.id}>
                <summary>
                  <strong>{draft.entityType.replaceAll("_", " ")}</strong>
                  <span>{draft.legacyStatus} · revision {draft.localRevision} · {new Date(draft.updatedAt).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</span>
                </summary>
                <code>{draft.id}</code>
                <pre>{JSON.stringify(draft.payload, null, 2)}</pre>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

type RecordDeskProps = {
  readonly kind: LocalRecordKind;
  readonly value: LocalRecordInput;
  readonly workspace: OfflineWorkspaceSnapshot;
  readonly records: readonly LocalOfficeRecord[];
  readonly selectedRecord: LocalOfficeRecord | null;
  readonly onSelectRecord: (record: LocalOfficeRecord) => void;
  readonly onChange: (value: LocalRecordInput) => void;
  readonly onSubmit: (value: LocalRecordInput) => void;
  readonly isSaving: boolean;
  readonly formError: string | null;
  readonly autosaveLabel: string;
};

function RecordDesk({ kind, value, workspace, records, selectedRecord, onSelectRecord, onChange, onSubmit, isSaving, formError, autosaveLabel }: RecordDeskProps) {
  const selectedForKind = selectedRecord?.kind === kind ? selectedRecord : records.find((record) => record.kind === kind) ?? null;
  return (
    <div className="record-desk">
      <RecordList title={`${localRecordKindLabel(kind)} records`} records={records.filter((record) => record.kind === kind)} workspace={workspace} selectedRecord={selectedForKind} onSelect={onSelectRecord} />
      <div className="document-grid">
        <section className="panel draft-form-panel" aria-labelledby="record-editor-title">
          <div className="panel-heading"><div><span>Offline capture</span><h2 id="record-editor-title">New {localRecordKindLabel(kind).toLowerCase()}</h2></div></div>
          <RecordEditor value={value} onChange={onChange} onSubmit={onSubmit} isSaving={isSaving} error={formError} autosaveLabel={autosaveLabel} />
        </section>
        <section className="invoice-preview-shell" aria-labelledby="document-preview-title">
          <div className="invoice-toolbar">
            <div>
              <span>Selected record</span>
              <h2 id="document-preview-title">Provisional preview</h2>
              {kind === "invoice_draft" ? <p className="invoice-toolbar__hint">A4 portrait · customer + office half-page copies</p> : null}
            </div>
            <button className="secondary-button" type="button" onClick={() => window.print()} disabled={!selectedForKind}>
              <Printer aria-hidden="true" /> {kind === "invoice_draft" ? "Print 2 copies / PDF" : "Print / Save PDF"}
            </button>
          </div>
          {selectedForKind ? <BrandedDocument record={selectedForKind} /> : <div className="invoice-empty"><FileText aria-hidden="true" /><p>Save or select a local {localRecordKindLabel(kind).toLowerCase()} to preview it.</p></div>}
        </section>
      </div>
    </div>
  );
}

type RecordListProps = {
  readonly title: string;
  readonly records: readonly LocalOfficeRecord[];
  readonly workspace: OfflineWorkspaceSnapshot;
  readonly selectedRecord: LocalOfficeRecord | null;
  readonly onSelect: (record: LocalOfficeRecord) => void;
  readonly onLoadDemo?: () => void;
  readonly isSaving?: boolean;
};

function RecordList({ title, records, workspace, selectedRecord, onSelect, onLoadDemo, isSaving = false }: RecordListProps) {
  return (
    <section className="panel work-panel records-panel" aria-labelledby={`record-list-${title.replaceAll(" ", "-").toLowerCase()}`}>
      <div className="panel-heading">
        <div><span>Local workspace</span><h2 id={`record-list-${title.replaceAll(" ", "-").toLowerCase()}`}>{title}</h2></div>
        <small>{records.length.toString().padStart(2, "0")} records</small>
      </div>
      {records.length === 0 ? (
        <div className="empty-state">
          <Inbox aria-hidden="true" />
          <h3>No matching local records.</h3>
          <p>Create one offline{onLoadDemo ? " or load safe demonstration data" : ""}.</p>
          {onLoadDemo ? <button className="secondary-button" type="button" onClick={onLoadDemo} disabled={isSaving}>Load demo workspace</button> : null}
        </div>
      ) : (
        <div className="draft-list" data-testid="record-list">
          {records.map((record) => (
            <button type="button" className="draft-row record-row" data-selected={selectedRecord?.draft.draftId === record.draft.draftId} key={record.draft.draftId} onClick={() => onSelect(record)}>
              <span className="draft-row__mark" aria-hidden="true">{localRecordKindLabel(record.kind).slice(0, 2).toUpperCase()}</span>
              <div><strong>{recordDisplayName(record)}</strong><span>{recordSummary(record)}</span></div>
              <div><strong>{documentAmount(record)}</strong><span>{provisionalDocumentNumber(record)}</span></div>
              <span className="status-badge">{recordLifecycleLabel(record, workspace)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default App;
