import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptDirectory, "..");
const repositoryRoot = resolve(desktopRoot, "..", "..");
const tauriRoot = join(desktopRoot, "src-tauri");
const windowsRoot = join(tauriRoot, "windows");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function bmpMetadata(buffer) {
  assert(buffer.toString("ascii", 0, 2) === "BM", "Installer BMP has an invalid signature.");
  return {
    width: buffer.readInt32LE(18),
    height: Math.abs(buffer.readInt32LE(22)),
    bitsPerPixel: buffer.readUInt16LE(28),
    compression: buffer.readUInt32LE(30),
  };
}

function balancedRtfGroups(value) {
  let depth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character !== "{" && character !== "}") continue;
    let slashCount = 0;
    for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) {
      slashCount += 1;
    }
    if (slashCount % 2 === 1) continue;
    depth += character === "{" ? 1 : -1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

async function verifyBrandingAssets() {
  const brandingRoot = join(windowsRoot, "branding");
  const manifest = JSON.parse(await readFile(join(brandingRoot, "asset-manifest.json"), "utf8"));
  const sourcePaths = {
    "logo-primary.png": join(desktopRoot, "public", "brand", "logo-primary.png"),
    "logo-inverse.png": join(desktopRoot, "public", "brand", "logo-inverse.png"),
    "logo-mark.png": join(desktopRoot, "public", "brand", "logo-mark.png"),
    "icon.ico": join(tauriRoot, "icons", "icon.ico"),
  };

  for (const [name, expectedHash] of Object.entries(manifest.sourceAssets)) {
    const buffer = await readFile(sourcePaths[name]);
    assert(sha256(buffer) === expectedHash, `Installer source asset changed without regeneration: ${name}`);
  }

  for (const [name, expected] of Object.entries(manifest.files)) {
    const buffer = await readFile(join(brandingRoot, name));
    assert(sha256(buffer) === expected.sha256, `Installer asset checksum mismatch: ${name}`);
    if (name.endsWith(".bmp")) {
      const actual = bmpMetadata(buffer);
      assert(actual.width === expected.width, `${name} width is invalid.`);
      assert(actual.height === expected.height, `${name} height is invalid.`);
      assert(actual.bitsPerPixel === 24, `${name} must be a 24-bit BMP.`);
      assert(actual.compression === 0, `${name} must be uncompressed.`);
    }
  }
}

async function verifyInstallerConfiguration() {
  const [configSource, userConfigSource, releasePolicySource] = await Promise.all([
    readFile(join(tauriRoot, "tauri.conf.json"), "utf8"),
    readFile(join(tauriRoot, "tauri.user.conf.json"), "utf8"),
    readFile(join(windowsRoot, "release-policy.json"), "utf8"),
  ]);
  const config = JSON.parse(configSource);
  const userConfig = JSON.parse(userConfigSource);
  const releasePolicy = JSON.parse(releasePolicySource);
  const windows = config.bundle.windows;
  const nsis = windows.nsis;
  const wix = windows.wix;

  assert(config.productName === "Abdullah Properties Office", "Installer product identity changed.");
  assert(config.identifier === "com.abdullahproperties.office", "Installer bundle identifier changed.");
  assert(config.bundle.publisher === "Abdullah Properties", "Installer publisher changed.");
  assert(config.bundle.licenseFile === "windows/EULA.rtf", "Installer EULA is not wired.");
  assert(windows.allowDowngrades === false, "Windows installer must block downgrades.");
  assert(nsis.installMode === "perMachine", "Primary NSIS must require admin and default to Program Files.");
  assert(
    userConfig.bundle?.windows?.nsis?.installMode === "currentUser",
    "The explicit per-user fallback configuration is missing.",
  );
  assert(
    JSON.stringify(userConfig.bundle?.targets) === JSON.stringify(["nsis"]),
    "The per-user fallback must produce NSIS only.",
  );
  assert(nsis.template === "windows/nsis/installer.nsi", "Branded NSIS template is not wired.");
  assert(wix.upgradeCode === "b5730b85-512f-5749-a1e3-9e20f93b259b", "MSI UpgradeCode must remain stable.");
  assert(releasePolicy.releaseChannel === "engineering-unsigned", "Engineering release channel changed unexpectedly.");
  assert(releasePolicy.productionPublishAllowed === false, "Draft installer must remain blocked from production.");
  assert(releasePolicy.eula?.status === "draft-legal-review-required", "EULA draft gate is missing.");
  assert(releasePolicy.authenticode?.required === true, "Authenticode production gate must remain required.");

  const template = await readFile(join(windowsRoot, "nsis", "installer.nsi"), "utf8");
  for (const marker of [
    "Upstream SHA-256: 20F4ECC730DEFB71F1342EAEAEC4021DF13BE3D843ABBA0EFFE88EA5835FA079",
    "Page custom BrandReadinessPage BrandReadinessLeave",
    "Page custom BrandReadyPage",
    "MUI_PAGE_LICENSE",
    "MUI_UNPAGE_FINISH",
    "UNINSTALLERSIDEBARIMAGE",
    "Primary managed setup installs application files for all users",
    "Per-machine uninstall always preserves every user's local office data",
  ]) {
    assert(template.includes(marker), `Branded NSIS workflow marker missing: ${marker}`);
  }

  const language = await readFile(join(windowsRoot, "nsis", "English.nsh"), "utf8");
  assert(language.includes("Also permanently delete local drafts"), "Uninstall data-loss warning is missing.");
}

async function verifyTerms() {
  const [plainText, rtf] = await Promise.all([
    readFile(join(windowsRoot, "EULA.txt"), "utf8"),
    readFile(join(windowsRoot, "EULA.rtf"), "utf8"),
  ]);
  assert(rtf.startsWith("{\\rtf1"), "Installer EULA must be a real RTF document.");
  assert(balancedRtfGroups(rtf), "Installer EULA has unbalanced RTF groups.");
  for (const marker of [
    "authorised Abdullah Properties staff member or contractor",
    "Offline or queued content is not an authoritative server record",
    "GOVERNING LAW AND FORUM - CONFIRMATION REQUIRED",
  ]) {
    assert(plainText.includes(marker), `Installer terms marker missing: ${marker}`);
  }
}

async function verifyReleaseAutomation() {
  const [buildWorkflowSource, issueWorkflowSource] = await Promise.all([
    readFile(join(repositoryRoot, ".github", "workflows", "desktop-windows.yml"), "utf8"),
    readFile(join(repositoryRoot, ".github", "workflows", "desktop-windows-failure-issue.yml"), "utf8"),
  ]);
  const buildWorkflow = buildWorkflowSource.replaceAll("\r\n", "\n");
  const issueWorkflow = issueWorkflowSource.replaceAll("\r\n", "\n");

  assert(buildWorkflow.includes("permissions:\n  contents: read"), "Desktop build workflow must remain read-only.");
  assert(
    buildWorkflow.includes("UNSIGNED-ENGINEERING-abdullah-properties-office-windows"),
    "Desktop CI artifact is not labelled as unsigned engineering output.",
  );
  assert(buildWorkflow.includes("ENGINEERING-ONLY.txt"), "Desktop CI artifact warning is missing.");
  assert(!/contents:\s*write/.test(buildWorkflow), "Desktop build workflow must not write repository contents.");
  assert(
    !/(?:gh\s+release|create-release|upload-release-asset)/i.test(buildWorkflow),
    "Draft or unsigned desktop output must not be published as a GitHub Release.",
  );

  assert(issueWorkflow.includes("workflow_run:"), "Failure reporting must use a protected workflow_run boundary.");
  assert(issueWorkflow.includes("permissions:\n  issues: write"), "Failure reporter must receive Issues-only permission.");
  assert(!issueWorkflow.includes("actions/checkout"), "Failure reporter must not execute triggering-run code.");
  assert(!issueWorkflow.includes("pull_request_target"), "Failure reporter must not use pull_request_target.");
  assert(
    issueWorkflow.includes("github.event.workflow_run.head_branch == 'main'"),
    "Failure reporter must be restricted to main push runs.",
  );
  assert(
    (issueWorkflow.match(/gh issue create/g) ?? []).length === 1,
    "Failure reporter must maintain one deduplicated issue creation path.",
  );
}

await verifyBrandingAssets();
await verifyInstallerConfiguration();
await verifyTerms();
await verifyReleaseAutomation();
console.log("Engineering installer branding, per-machine identity, terms and upgrade contract verified; production publishing remains blocked.");
