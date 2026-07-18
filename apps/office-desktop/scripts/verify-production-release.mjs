import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptDirectory, "..");
const tauriRoot = join(desktopRoot, "src-tauri");
const windowsRoot = join(tauriRoot, "windows");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

const [policySource, configSource, plainText, rtf] = await Promise.all([
  readFile(join(windowsRoot, "release-policy.json"), "utf8"),
  readFile(join(tauriRoot, "tauri.conf.json"), "utf8"),
  readFile(join(windowsRoot, "EULA.txt")),
  readFile(join(windowsRoot, "EULA.rtf")),
]);

const policy = JSON.parse(policySource);
const config = JSON.parse(configSource);
const windows = config.bundle.windows;

assert(policy.productionPublishAllowed === true, "Production publishing is blocked by windows/release-policy.json.");
assert(policy.releaseChannel === "production", "Release policy channel is not production.");
assert(policy.eula.status === "approved", "The installer EULA has not been marked legally approved.");
assert(
  typeof policy.eula.approvedPlainTextSha256 === "string" &&
    sha256(plainText) === policy.eula.approvedPlainTextSha256.toLowerCase(),
  "The approved EULA.txt checksum does not match the release candidate.",
);
assert(
  typeof policy.eula.approvedRtfSha256 === "string" &&
    sha256(rtf) === policy.eula.approvedRtfSha256.toLowerCase(),
  "The approved EULA.rtf checksum does not match the release candidate.",
);

const plainTerms = plainText.toString("utf8");
for (const blocker of [
  "engineering release",
  "operational draft",
  "GOVERNING LAW AND FORUM - CONFIRMATION REQUIRED",
]) {
  assert(!plainTerms.includes(blocker), `Production EULA still contains blocker: ${blocker}`);
}

const approvedThumbprint = policy.authenticode.approvedCertificateThumbprintSha1;
assert(policy.authenticode.required === true, "Authenticode must remain required.");
assert(policy.authenticode.timestampRequired === true, "A trusted timestamp must remain required.");
assert(
  typeof approvedThumbprint === "string" && /^[A-F0-9]{40}$/.test(approvedThumbprint),
  "An approved 40-character Authenticode certificate SHA-1 thumbprint is required.",
);
assert(
  windows.certificateThumbprint === approvedThumbprint,
  "Tauri certificateThumbprint does not match the approved release certificate.",
);
assert(windows.digestAlgorithm?.toLowerCase() === "sha256", "Windows signing digest must be SHA-256.");
assert(
  typeof windows.timestampUrl === "string" && windows.timestampUrl.startsWith("https://"),
  "An approved HTTPS Authenticode timestamp URL is required.",
);
assert(
  typeof policy.approval.releaseApprovalId === "string" && policy.approval.releaseApprovalId.trim().length >= 8,
  "A recorded production release approval ID is required.",
);

console.log("Production release policy, EULA checksums and Authenticode configuration verified.");
