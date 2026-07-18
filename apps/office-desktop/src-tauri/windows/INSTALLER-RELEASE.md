# Abdullah Properties Office installer release

This is the release-control checklist for the branded Windows installer. It supplements the desktop [README](../../README.md); it does not by itself approve distribution.

## Implemented installer system

The repository now owns two primary Tauri-produced Windows delivery formats and one explicit fallback:

- a fully branded NSIS setup executable for administrator-approved, per-machine installation that defaults to `Program Files` while retaining an editable destination page;
- a branded WiX MSI for managed per-machine deployment.
- a separately built NSIS-only per-user fallback (`npm run bundle:user`) that defaults to `LocalAppData` when managed installation is not possible.

The primary NSIS and MSI install application files for all users. Runtime data is still created independently for each signed-in Windows user under AppData, never under `Program Files`. The managed NSIS uninstaller always preserves all users' local data because an elevated uninstaller cannot safely infer which profile owns retained business records. Only the explicit per-user fallback may offer deletion of that current user's AppData after an irreversible-action warning.

Do not distribute an unmanaged portable ZIP. Durable SQLite migrations, DPAPI credential scope, update identity, rollback behavior, shortcuts, and uninstall policy all depend on an installed application boundary.

The NSIS template is pinned to the upstream `tauri-bundler 2.9.4` source with upstream SHA-256 `20F4ECC730DEFB71F1342EAEAEC4021DF13BE3D843ABBA0EFFE88EA5835FA079`. The repository customization adds product-specific page structure, copy, colors, Segoe UI typography, explicit consent, authorised-use readiness, install summary, completion boundaries, and a data-preserving uninstall workflow. Tauri's original install/update/WebView2/registry/signing/uninstall sections remain in place. Rebase and re-audit the template whenever `@tauri-apps/cli` changes.

The WiX package intentionally keeps the standard Windows Installer workflow for enterprise automation, with Abdullah Properties dialog/banner artwork, product copy, EULA, publisher, icon, and pinned UpgradeCode `b5730b85-512f-5749-a1e3-9e20f93b259b`.

Run `npm run installer:verify` before every bundle. It fails when brand source hashes, generated asset hashes/dimensions, EULA format, installer identity, downgrade protection, primary per-machine mode, explicit per-user fallback, custom workflow markers, release-policy block, MSI UpgradeCode drift, or an existing release executable still contains a target-specific Tauri bundle marker from an interrupted package.

The previously observed `OpenAI.Codex_...\LocalCache\Local\Abdullah Properties Office` path came from a current-user engineering installer launched inside the packaged Codex/MSIX execution context. Release validation must launch the primary installer directly from Explorer or an ordinary PowerShell session, accept UAC, confirm the selected destination and verify the HKLM uninstall record. The default must resolve to `%ProgramFiles%\Abdullah Properties Office`; each runtime user's database remains under `%APPDATA%\com.abdullahproperties.office`.

Tauri temporarily patches the release executable with a target-specific bundle marker and normally restores the original after each successful package. If a bundler fails after the `Patching ... with bundle type information` step, do not reuse that executable for another installer format. Rebuild the application binary first (for example, clean only the `abdullah-properties-office` Cargo package and rerun `npm run bundle`) so NSIS and MSI each receive the correct marker.

## Distribution states

### Unsigned engineering installer

An unsigned MSI or setup executable is an **internal engineering artifact only**. Windows may show an unknown-publisher or reputation warning. A familiar logo, file name, checksum, successful build, or antivirus scan does not establish publisher identity. Do not publish an unsigned artifact as a production release, suppress the warning, or tell a user that it is trusted.

Use unsigned output only for controlled QA on test devices after its source commit and checksum have been recorded. It may be used to test installation behavior, but it is not an approved customer or staff rollout.

### Signed production installer

A production installer must be Authenticode-signed with an approved Abdullah Properties code-signing identity, timestamped through the approved release process, and verified after signing. Signing keys and certificate passwords must remain outside the repository and ordinary build logs. Prefer protected CI signing, an HSM, or another approved non-exportable custody model; document access, rotation, revocation, and incident response.

A valid signature proves which certificate signed an unchanged artifact. It does not prove that the software is defect-free, that Microsoft SmartScreen will show no reputation warning, or that the release has passed business, security, privacy, and legal approval.

## Intended branded installer flow

The production installer should present a coherent Abdullah Properties workflow:

1. **Welcome** — Abdullah Properties Office name, approved transparent brand mark, version, and a clear statement that the application is for authorised staff.
2. **System readiness** — supported Windows version and WebView2/runtime requirements, without implying that an online state means synchronization is complete.
3. **End-user terms** — display `EULA.rtf` or the equivalent approved version; installation may continue only after explicit acceptance.
4. **Install scope and destination** — identify the primary all-users/admin scope and selected destination. The fallback build must clearly identify its current-user-only scope. Do not silently change scope.
5. **Ready to install** — summarize version, publisher/signature state, destination, and shortcuts before the system is changed.
6. **Progress** — show accurate installation status and recover cleanly from cancellation or failure.
7. **Completion** — state whether installation succeeded and optionally launch the application. Do not claim that a device is paired, data is synchronized, or access is authorised until the application verifies those states.
8. **Maintenance** — provide predictable repair, upgrade, and uninstall behavior. Primary managed uninstall preserves every user's AppData; the per-user fallback requires a separate explicit choice before removing that user's local data.

The installer artwork, icon, typography, button labels, accessibility names, keyboard path, focus states, contrast, and high-DPI layout must be reviewed on representative Windows scaling settings. Installer motion should remain minimal and never delay consent or obscure a failure.

## Release workflow

1. Freeze the release commit, application version, migration set, dependency locks, end-user terms, privacy/security notices, support contact, and release notes.
2. Obtain business, security, privacy, and legal approval. The governing-law/forum clause in `EULA.txt` and `EULA.rtf` is deliberately unresolved and blocks production approval until confirmed.
3. From a clean checkout, run the frontend checks, dependency audit, Rust formatting, Clippy with warnings denied, Rust tests, `cargo check`, and the Tauri release build documented in the desktop README.
4. Generate installers without embedding credentials, signing secrets, private customer data, development endpoints, or personal file paths.
5. Record the source commit, exact version, build environment, dependency lock hashes, artifact names, byte sizes, and SHA-256 checksums.
6. Test the **unsigned** engineering artifacts on controlled clean Windows virtual machines before signing. Test clean install, cancellation, insufficient permissions, low disk space, offline launch, pairing failure, repair, same-version reinstall, upgrade from the supported previous version, rollback plan, uninstall, reboot, high-DPI rendering, keyboard access, and application launch.
7. Verify database migrations and the approved local-data policy across upgrade and uninstall. Synchronization is not a backup; prove recovery from the approved backup procedure.
8. Sign the approved application binaries and installer artifacts through the protected signing process. Timestamp them if the approved certificate workflow supports it.
9. Recompute checksums and verify the final signatures on a clean machine. Confirm the displayed publisher, subject, chain, timestamp, file version, product name, and that post-signing bytes have not changed.
10. Repeat smoke installation, upgrade, launch, offline record, provisional print/PDF, credential pairing, revocation, retry, conflict, and uninstall tests against the **signed** artifacts.
11. Publish only through an approved Abdullah Properties channel with release notes, prerequisites, signed artifact, checksum, support contact, known limitations, and rollback instructions. Retain the build evidence and approval record.

## Required installer acceptance checks

- The product is consistently named **Abdullah Properties Office** and the version matches the application binary.
- The icon and artwork use approved transparent brand assets and remain legible in light, dark, and high-contrast Windows contexts.
- The terms shown in the installer exactly match the approved EULA artifact and are readable before acceptance.
- No screen says that local or queued data is official, delivered, posted, paid, or synchronized.
- No screen exposes a device token, signing material, customer record, private path, or development diagnostic.
- Failure and cancellation leave no misleading success state and no half-installed launch shortcut.
- Upgrade and uninstall behavior for the app-local SQLite database is explicit, tested, and consistent with approved retention and recovery policy.
- Screen-reader names, tab order, focus visibility, keyboard activation, contrast, text scaling, and 100%, 125%, 150%, and 200% display scaling are checked.
- The final signed artifact is installed from a clean download and its signature and SHA-256 checksum are independently verified.

## Build and artifact handling

Use the locked, reviewed commands in the desktop README. Current CI output is intentionally unsigned and has read-only repository permissions; it is evidence for engineering review, not a production release.

`windows/release-policy.json` is a machine-readable fail-closed gate. While `productionPublishAllowed` is `false`, the release channel is `engineering-unsigned`, the EULA status is draft, or the approved EULA hashes/certificate thumbprint/approval ID are absent, `npm run release:verify` must fail. A production process must also verify Authenticode status, approved publisher certificate, trusted timestamp, and SHA-256 after signing on a clean Windows machine. The current repository has no production-publish workflow.

Keep generated installers out of Git. Store release artifacts in the approved release system with least-privilege access and retention controls. Never commit a `.pfx`, certificate password, private key, device credential, environment secret, or customer database.

## Legal and operational review gate

`EULA.txt` is the plain-text source for review. `EULA.rtf` is the installer-display copy and must remain substantively identical. Both are operational drafts based on the repository's current website terms, privacy policy, contact data, and documented desktop boundaries. They do not invent a registered legal entity, licence number, transaction authority, or governing forum, and they are not legal advice.

Before a production release, an appropriately qualified reviewer must confirm the company identity used by the certificate and installer, the application licence, governing law and dispute forum, employee/contractor obligations, privacy and retention controls, warranty/liability language, support and incident routes, and any Bangladesh-specific mandatory terms. Record the approved document version and effective date with the release evidence.
