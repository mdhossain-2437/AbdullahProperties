# Abdullah Properties Office Desktop

A compact Windows client for Abdullah Properties office work. It uses the public brand system while keeping local work, server-received review work, authoritative records, and customer delivery as separate, visible states.

## Current delivery boundary

The source currently supports local lead capture, provisional invoice drafts, provisional payment acknowledgements, notice drafts, form autosave, a durable SQLite outbox, local search, branded document previews, and print/Save as PDF through the Windows print dialog. Browser preview uses `localStorage` for development only; a native Tauri run uses the app-local SQLite database.

This is now an offline-first, device-authenticated engineering release. An active Office member starts pairing from `/office/settings` and receives only a ten-minute, one-use code. The native client exchanges that code directly with the pinned hosted origin, protects the resulting 30-day revocable bearer with Windows DPAPI for the current user, and can synchronize queued **lead, invoice draft, and notice draft creates** through the versioned `/api/office/v1/sync` endpoint. The browser never receives or copies the long-lived bearer.

The connected boundary is deliberately narrow. No desktop action currently:

- pulls authoritative changes or edits an accepted server draft;
- allocates an official invoice, receipt, or notice number;
- posts a payment or changes an authoritative balance;
- sends email, SMS, push, or in-app notifications;
- proves that a record was delivered merely because Windows reports network connectivity.

Every printable offline document must therefore remain visibly marked `PROVISIONAL` or `LOCAL`. The hosted server remains responsible for membership and permission checks, optimistic revision validation, official numbering, audit ownership, payment allocation, tracking QR creation, and notification outbox delivery.

## Offline and sync contract

```text
form edit -> local autosave
review + save -> atomic durable draft + queued outbox operation
manual sync -> Rust reads canonical SQLite operations -> authenticated HTTPS request
server response -> accepted | duplicate | conflict | permission blocked | rejected
accepted/duplicate -> durable local receipt + synced state
```

Drafts, outbox operations, and form autosaves are committed to SQLite in the native client. The renderer submits no sync payload: Rust selects canonical eligible operations directly from SQLite, enforces protocol and batch limits, unlocks the credential, sends the HTTPS request with redirects disabled, validates one correlated result per operation, and atomically persists receipts. Durable idempotency keys let the server identify an exact replay without creating a second draft. Connectivity is advisory; only a validated server acknowledgement may move an operation to `synced`.

The server stores a SHA-256 digest of the 256-bit random device credential, ties it to an active member and role, enforces expiry/revocation and per-device rate limiting, revalidates every payload, checks aggregate permissions, and persists a canonical operation hash. Desktop protocol v1 accepts creates only. Payment acknowledgements remain local until `payments.post`, allocation, balance, and finance reconciliation contracts are implemented.

Email and SMS credentials must never be shipped in the desktop bundle. Successful server posting should create server-owned notification outbox records.

## Runtime architecture

```text
React UI
  -> validated offline domain model
  -> OfflineOfficeRepository
      -> SQLite adapter in Tauri
      -> localStorage adapter in browser preview only
  -> durable draft + sync operation
  -> Rust-native sync transport
      -> DPAPI-protected device credential
      -> versioned Abdullah Properties server API
      -> D1 idempotency record + visible desktop review inbox + audit event
      -> local sync receipt
```

The Tauri main window alone receives the configured SQL capability. Remote application content is not loaded, the CSP denies remote scripts, frames, objects, and form submission, and SQL statements use bound parameters. Device tokens are never stored in browser storage or SQLite and status APIs never return them. DPAPI protects the token for the current Windows user, while the website stores only its digest. SQLite is not automatically encrypted; production handling of sensitive customer or title-document data still requires an approved at-rest encryption, Windows account, backup, and retention design.

## Frontend development

Use the Node.js version recorded at the repository root, then run from this directory:

```powershell
npm ci
npm run check
npm audit --omit=dev --audit-level=high
npm run dev
```

`npm run check` performs TypeScript validation, offline-domain tests, and an optimized Vite build. Browser preview is for UI development and does not represent native security, persistence, printing, or installer behavior.

## Native Windows prerequisites

A native build requires:

- Rust stable with the `x86_64-pc-windows-msvc` target;
- the `rustfmt` and `clippy` components;
- Visual Studio 2022 Build Tools with Desktop development with C++ and a supported Windows SDK;
- the Microsoft Edge WebView2 runtime;
- Node.js and npm versions compatible with the repository lockfiles.

After installing and reviewing those prerequisites:

```powershell
rustup toolchain install stable-x86_64-pc-windows-msvc --profile minimal --component rustfmt --component clippy
rustup default stable-x86_64-pc-windows-msvc

npm ci
npm run check
npm audit --omit=dev --audit-level=high
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features --locked -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features --locked
cargo check --manifest-path src-tauri/Cargo.toml --all-targets --all-features --locked
npm run bundle
```

The Tauri build runs the configured frontend build again before compiling and bundling the Windows application.

## Branded Windows installer architecture

The desktop release uses Tauri's maintained Windows bundling pipeline rather than an unrelated installer wrapper:

- **NSIS setup executable** — the primary staff-facing, per-machine installer. It requests administrator approval, defaults to `Program Files`, writes machine-level installer metadata, and still presents an editable destination page. Application data and DPAPI credentials remain isolated per Windows user in that user's AppData regardless of where application files are installed.
- **WiX MSI** — the standard per-machine package for managed deployment through an approved enterprise software channel.
- **Explicit per-user fallback** — `npm run bundle:user` produces an NSIS-only profile-scoped engineering package that defaults to `LocalAppData`. It is a separately labelled exception for a machine where managed installation is not possible; it is not the primary office release.

Both packages use the same product identity, icon, publisher, configured EULA artifact, downgrade policy, and application binary. The MSI upgrade code is pinned and must never be regenerated. The NSIS product name, publisher, identifier, and registry identity are also release invariants.

The NSIS experience is a repository-owned customization of the exact `tauri-bundler 2.9.4` template shipped by the pinned Tauri CLI. It preserves Tauri's WebView2, install, update, registry, shortcut, signing, app-data, and uninstall logic while adding:

1. branded welcome and authorised-staff positioning;
2. explicit end-user-terms acceptance;
3. an offline-readiness and authorised-device confirmation;
4. a clear all-users/administrator boundary, followed by branded destination and Start menu choices;
5. a ready-to-install summary with the local-data policy;
6. accurate progress and pairing/synchronization boundaries on completion; and
7. a branded managed uninstall that always preserves every user's AppData; the separately built per-user fallback alone offers an explicit, irreversible deletion option for that current user's data.

Installer artwork is generated deterministically from the approved application logo sources. `npm run installer:verify` validates source and output checksums, required BMP dimensions and encoding, the EULA format and operational markers, release identity, downgrade protection, primary per-machine mode, the explicit per-user fallback, custom workflow markers, stable MSI upgrade code, and the machine-readable release block. Every bundle command first runs `bundle:prepare`, which removes only the generated bundle directory and top-level Tauri release executable after verifying both paths remain inside `src-tauri/target/release`. This prevents an interrupted NSIS/MSI package marker from contaminating the next build.

Use the following release commands from this directory:

```powershell
npm run installer:assets
npm run check
npm run bundle
```

`npm run bundle` produces the compact primary per-machine NSIS and MSI packages. It downloads the Microsoft WebView2 bootstrapper only when the target machine lacks the managed runtime. For an approved office deployment that must install without internet access, `npm run bundle:offline` uses `src-tauri/tauri.offline.conf.json` to embed Microsoft's offline WebView2 installer; this adds roughly 127 MB and overwrites the same local bundle output names, so archive and label channels separately. `npm run bundle:user` builds the separate per-user fallback and also overwrites the local NSIS output name, so it must never share the primary artifact channel or file label.

There is intentionally no loose portable ZIP release. This application owns durable SQLite migrations, per-user DPAPI credentials, update/rollback identity, shortcuts, and an auditable uninstall boundary; an unmanaged copied executable would weaken those guarantees.

### Install-location verification

The earlier `OpenAI.Codex_...\LocalCache\Local\Abdullah Properties Office` test path came from launching a current-user engineering setup inside the packaged Codex/MSIX execution context, where Windows mapped that process's local application data into the package-private `LocalCache`. It was not evidence of the final per-machine release location.

Validate the release installer by launching it directly from Windows Explorer or an ordinary PowerShell session, accepting UAC, and checking both the selected destination and the machine-level uninstall record. The primary default must resolve to `%ProgramFiles%\Abdullah Properties Office` (or `%ProgramW6432%` for the native 64-bit path). The runtime database remains per user at `%APPDATA%\com.abdullahproperties.office\abdullah-office.db`; it must never move into `Program Files`.

The current `windows/EULA.txt` and `windows/EULA.rtf` are engineering-review drafts with an unresolved governing-law/forum approval gate. `windows/release-policy.json` therefore blocks production publishing, and `npm run release:verify` intentionally fails. Generated installers are unsigned engineering artifacts until Abdullah Properties supplies an approved Authenticode code-signing identity, trusted timestamp configuration, legal approval record, exact approved EULA checksums, and protected signing workflow. A logo, checksum, successful build, or antivirus result does not replace a valid publisher signature.

## Windows CI artifacts

`.github/workflows/desktop-windows.yml` runs on relevant pull requests, pushes to `main`, and manual dispatches. It performs:

1. locked frontend installation, `npm run check`, and a high-severity production dependency audit;
2. Rust stable-MSVC setup;
3. `cargo fmt`, Clippy with warnings denied, Rust tests, and `cargo check`;
4. a Tauri release build;
5. stamping and upload of generated MSI and NSIS files as a short-lived, explicitly unsigned engineering artifact.

The build workflow intentionally has read-only repository permissions, does not receive signing secrets, does not create a GitHub Release, and produces **unsigned engineering artifacts**. A separate `workflow_run` reporter can write only Issues on failed/timed-out `main` builds; it never checks out or executes failed-run code, and it updates one deduplicated issue rather than creating noise. Downloading a successful artifact does not make it an approved production installer and does not enable synchronization.

The workflow requires the committed `src-tauri/Cargo.lock`, verifies it with `cargo metadata --locked`, and uses that exact dependency graph for Rust checks, tests, and installer builds. A missing or stale lockfile fails the release gate rather than resolving new dependencies on the runner.

## Production release gates

Do not distribute the desktop installer outside controlled engineering review until all applicable gates are complete:

- device authentication, revocation, secure credential storage, and server sync receive an independent penetration review;
- local data classification, retention, backup, recovery, and encryption controls are approved;
- crash/reopen, migration, duplicate replay, lease expiry, retry, conflict, revoked-device, and offline-print tests pass on Windows;
- `src-tauri/Cargo.lock` is committed and dependency audits are reviewed;
- installer and updater signing keys are held outside source control with documented custody and rotation;
- the signed installer is tested for clean install, upgrade, rollback, uninstall, and database preservation;
- support, incident response, telemetry consent, and recovery procedures are documented.

A website deployment does not install, update, authorize, or distribute the Windows application.
