import { rm } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptDirectory, "..");
const releaseRoot = resolve(desktopRoot, "src-tauri", "target", "release");

function assertGeneratedReleasePath(target) {
  const relativePath = relative(releaseRoot, target);
  if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(`Refusing to clean an unexpected release path: ${target}`);
  }
}

const generatedPaths = [
  resolve(releaseRoot, "bundle"),
  resolve(releaseRoot, "abdullah-properties-office.exe"),
];

for (const generatedPath of generatedPaths) {
  assertGeneratedReleasePath(generatedPath);
  await rm(generatedPath, { force: true, recursive: true });
}

console.log("Prepared a clean Tauri release boundary for fresh NSIS/MSI bundling.");
