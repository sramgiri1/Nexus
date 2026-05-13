import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import {
  loadServiceManifest,
  validateServiceManifest,
  listServices,
  readServiceState,
  getServiceStateEntry,
  checkPortAvailable,
  checkServiceHealth,
} from "../service-runtime/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "nexus-service-status-report.md");

function describeService(service, stateEntry, portResult, healthResult) {
  if (service.enabled !== true) {
    if (service.id === "db") return "disabled, file-backed fallback active";
    return `disabled, ${service.currentPhaseBehavior === "not_enabled" ? "planned" : service.currentPhaseBehavior}`;
  }

  if (stateEntry?.managedByNexus === true && stateEntry?.status === "running") {
    return `running, managed PID ${stateEntry.pid}, health ${healthResult.state}`;
  }

  if (healthResult.ok) {
    return `running, external/unmanaged, health ${healthResult.state}`;
  }

  if (portResult.state === "in_use") {
    return "port in use, service health unreachable";
  }

  return "stopped";
}

const manifestResult = loadServiceManifest();
if (!manifestResult.ok) {
  console.error("NEXUS Local Service Status\n==========================");
  for (const error of manifestResult.errors) console.error(`- ${error}`);
  process.exit(1);
}

const validation = validateServiceManifest(manifestResult.manifest);
if (!validation.ok) {
  console.error("NEXUS Local Service Status\n==========================");
  for (const error of validation.errors) console.error(`- ${error}`);
  process.exit(1);
}

const state = readServiceState();
const services = [];
for (const service of listServices(manifestResult.manifest)) {
  const stateEntry = getServiceStateEntry(state, service.id);
  const portResult = await checkPortAvailable(service.port, service.host || "127.0.0.1");
  const healthResult = await checkServiceHealth(service, { timeoutMs: 1500 });
  services.push({
    service,
    stateEntry,
    portResult,
    healthResult,
    description: describeService(service, stateEntry, portResult, healthResult),
  });
}

const lines = [
  "# NEXUS Local Service Status Report",
  "",
  `- Generated at: ${new Date().toISOString()}`,
  `- Mode: local-private`,
  `- Phase: P41.6.2`,
  "",
  "## URLs",
  "",
  "- Command Center: http://127.0.0.1:5173",
  "- Live Local API: http://127.0.0.1:4321",
  "- Governed Action Bridge: http://127.0.0.1:3748",
  "",
  "## Services",
  "",
];

console.log("NEXUS Local Service Status\n==========================");
console.log("Mode: local-private");
console.log("Phase: P41.6.2");
console.log("Services:");

for (const entry of services) {
  lines.push(`- ${entry.service.label}: ${entry.description}`);
  console.log(`- ${entry.service.label}: ${entry.description}`);
}

lines.push("", "## Notes", "", "- Disabled placeholders remain disabled by design.", "- DB fallback remains file-backed and DB writes stay disabled.");
mkdirSync(join(ROOT, "reports"), { recursive: true });
writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`, "utf8");
