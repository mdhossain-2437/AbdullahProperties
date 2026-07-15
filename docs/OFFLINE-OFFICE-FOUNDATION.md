# Offline Office Foundation

Status: implementation-ready shared core; native shell intentionally blocked until its Windows toolchain is approved.

## Boundary and chosen trade-off

`features/office/offline-core.ts` is the durable protocol seam between the existing Office OS and a future Windows client. It is pure TypeScript with Zod validation and has no Next.js, Cloudflare, SQL, or Tauri dependency. The native application may therefore share lifecycle, payload, retry, identity, and storage contracts without importing web Server Actions or trusting browser state.

The current increment does **not** claim to be a Windows executable. This workstation has WebView2, Node.js, npm, and Microsoft Print to PDF, but it does not have Rust, Cargo, MSVC, or MSBuild. A verified Tauri 2 binary requires user-approved installation of **Rust stable-MSVC** and **Visual Studio 2022 C++ Build Tools**.

## Data flow

```text
form edit -> editing -> autosave -> local_saved
local_saved -> atomic draft + outbox commit -> queued
queued -> leased by one worker -> syncing
syncing -> synced | retry_wait | conflict | permission_blocked
retry_wait -> queued when due
conflict / permission_blocked -> visible human or authorization resolution -> queued
```

Draft payloads are finite, acyclic JSON objects. Local revisions are optimistic concurrency tokens. Every submitted command contains separately branded UUID `clientOperationId` and UUID `idempotencyKey`; retrying a command reuses both values. An adapter must return `duplicate` for an identical replay and `idempotency_conflict` when the same key is presented with different normalized command content.

## Storage adapter contract

A SQLite/Tauri adapter implements `OfflineStoragePort` with these guarantees:

- `saveDraft` uses compare-and-set against `expectedLocalRevision`.
- `commitDraftAndEnqueue` persists the exact saved draft revision and inserts its outbox operation in one transaction.
- `claimReadyOperations` atomically leases a bounded, ordered batch so two workers cannot send the same command concurrently.
- `compareAndSetOperation` checks both previous state and attempt count.
- queued/retry/conflict records survive process termination; no exception is swallowed or treated as success.
- SQLite enables foreign keys, WAL journaling, a busy timeout, and transaction durability appropriate to financial drafts.

The port exposes atomic business methods instead of a database transaction callback. This keeps SQL handles out of renderer code and across no native IPC boundary.

## Retry and reconciliation

Retry delay is capped exponential backoff with symmetric jitter. Time, policy, and the random source are inputs, so tests remain deterministic. Once `maxAttempts` is reached the scheduler returns `null`; the service must create a visible reconciliation item instead of looping forever. Finance conflicts never use last-write-wins.

Connectivity indicators are advisory. The future native sync worker must prove reachability against an authenticated health/sync endpoint, then apply exponential backoff after actual request failures.

## Finance and notification safety

Offline invoice and installment entry remains useful, but server posting is authoritative:

- offline output is a branded **DRAFT / PROVISIONAL** document with a local reference and pending-sync watermark;
- official invoice and receipt sequences are allocated only by the server's atomic branch/year sequence;
- the server revalidates current balance, role, membership, device status, and idempotency before posting;
- a conflict preserves the provisional record for review instead of silently reallocating money;
- SMS and email credentials never enter the desktop app; successful server posting creates the notification outbox record.

Local SQLite is not automatically encrypted by this foundation. Until encrypted storage and an approved retention policy exist, a native client must cache only the minimum operational data, keep device credentials in an encrypted secret store, require Windows device protection, and exclude sensitive KYC/title-document bytes.

## Next implementation increment

1. Obtain approval for and install the missing Rust/MSVC toolchain.
2. Implement an encrypted-credential device-pairing flow; the current Sites-injected identity headers cannot be spoofed by a desktop client.
3. Build the SQLite adapter and run crash/reopen, duplicate replay, lease expiry, conflict, revoked-device, and migration tests.
4. Add the bundled React/Tauri shell and branded provisional print view.
5. Add versioned server sync routes and notification outbox dispatch only after a verified provider is selected.
