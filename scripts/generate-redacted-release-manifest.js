import { execFileSync } from "node:child_process";
import {
  createRedactedReleaseManifest,
  summarizeReleaseManifest,
  validateRedactedReleaseManifest,
  writeRedactedReleaseManifest,
} from "../scope-boundary/index.js";

const ROOT = process.cwd();

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

const manifest = createRedactedReleaseManifest({
  mode: process.env.NEXUS_MODE || "local-private",
  projectId: "private-project",
  displayName: "Private Project",
});
const validation = validateRedactedReleaseManifest(manifest);

if (!validation.valid) {
  console.error("Redacted release manifest validation failed:");
  for (const error of validation.errors) console.error(`- ${error}`);
  process.exit(1);
}

const writeResult = writeRedactedReleaseManifest(manifest, { root: ROOT });
const summary = summarizeReleaseManifest(manifest);

console.log("NEXUS Redacted Release Manifest");
console.log("===============================");
console.log(`Branch: ${gitOutput(["branch", "--show-current"])}`);
console.log(`HEAD: ${gitOutput(["rev-parse", "--short", "HEAD"])}`);
console.log(`Manifest: ${writeResult.manifestPath}`);
console.log(`Project: ${summary.displayName}`);
console.log(`Package created: ${summary.packageCreated ? "yes" : "no"}`);
console.log(`Dry-run only: ${summary.exportDryRunOnly ? "yes" : "no"}`);
console.log(`Redacted: ${summary.redacted ? "yes" : "no"}`);
console.log("Result: PASS");
