# Abdullah Properties Office Desktop

A compact Windows client for the Abdullah Properties office workflow. It uses the public brand system but treats local work, server-accepted work, and customer delivery as separate states.

## Current delivery boundary

The frontend, offline domain model, SQLite migration, least-privilege Tauri capability, local draft/outbox repository, branded provisional invoice, print/PDF flow, responsive states, and browser-preview fallback are implemented.

The native `.exe` is not built on this machine because the required Rust and Microsoft C++ toolchains are not installed. They must be installed and reviewed explicitly before running `npm run tauri build`. A website deployment does not install or distribute the desktop executable.

Real server synchronization, SMS, and email delivery are intentionally disabled until these production contracts exist:

- device-bound authentication and revocation;
- an approved, versioned office sync API;
- server-side idempotency and optimistic revision checks;
- a conflict-resolution policy and audit ownership;
- configured delivery providers, credentials, retry worker, and consent policy.

Connectivity alone never changes an item to `synced`, and an offline invoice never receives an official invoice number.

## Architecture

```text
React UI
  -> OfflineOfficeRepository port
      -> SQLite adapter in Tauri (authoritative local cache)
      -> localStorage adapter in browser preview (development only)
  -> local_drafts + sync_outbox in one transaction
  -> future authenticated sync transport
      -> Abdullah Properties server API
      -> authoritative D1/PostgreSQL record
      -> server number, audit event and notification outbox
```

Local lifecycle:

```text
local_draft -> queued -> syncing -> synced
                         |   |
                         |   +-> failed -> queued
                         +-----> conflict -> reviewed resolution
```

The SQLite migration keeps drafts, outbox commands, and conflicts separate. Idempotency keys bind an operation to a draft revision. Claims include attempt count and lease fields so a future sync worker can recover after a crash without double-posting.

## Security posture

- Only the `main` window receives SQL read/load/close and explicit SQL execute permissions.
- Remote URLs are not trusted or granted Tauri capabilities.
- CSP denies remote scripts, frames, objects, and form submission.
- SQLite statements use bound parameters.
- Browser preview data is clearly non-production and is never treated as encrypted storage.
- Official numbering, payment posting, SMS/email delivery, and recipient data stay server-owned.
- Production builds should be code-signed; update signing and key custody must be designed before auto-update is enabled.

## Development

```powershell
npm install
npm run check
```

Browser preview:

```powershell
npm run dev
```

Native development, after installing the official Windows prerequisites:

```powershell
npm run tauri dev
```

Native release, after device-auth and sync contracts are complete:

```powershell
npm run tauri build
```

## Verification

`npm run check` runs TypeScript validation, offline-domain tests, and the optimized Vite build. Rust compilation and the Windows installer remain separate gates because this workstation currently has no Rust toolchain.
