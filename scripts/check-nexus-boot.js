import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

await import("./check-nexus-local-boot.js");

const ROOT = process.cwd();
const sourceReport = join(ROOT, "reports", "nexus-local-boot-report.md");
const targetReport = join(ROOT, "reports", "nexus-boot-report.md");

if (existsSync(sourceReport)) {
  copyFileSync(sourceReport, targetReport);
}
