import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import { loadServiceManifest, summarizeServiceManifest, validateServiceManifest } from "./serviceManifest.js";
import { checkPortAvailable } from "./servicePorts.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "nexus-service-status.json");

function statusFromBehavior(service) {
  if (service.enabled === false && service.currentPhaseBehavior === "not_enabled") return "not_enabled";
  if (service.enabled === false && service.currentPhaseBehavior === "file_backed_read_only") return "described";
  if (typeof service.plannedPhase === "string" && service.enabled === false) return "planned";
  if (service.currentPhaseBehavior === "described_only") return "described";
  return "unknown";
}

export async function buildServiceStatus(options = {}) {
  const warnings = [];
  const errors = [];

  const manifestResult = loadServiceManifest(options);
  if (!manifestResult.ok) {
    return {
      statusVersion: "1.0",
      phase: "P41.6.1",
      generatedAt: new Date().toISOString(),
      mode: "local-private",
      services: [],
      summary: {
        servicesTotal: 0,
        enabledServices: 0,
        requiredServices: 0,
        managedNow: 0,
        managedLater: 0,
        disabledFutureServices: 0,
      },
      warnings,
      errors: [...errors, ...manifestResult.errors],
    };
  }

  const validation = validateServiceManifest(manifestResult.manifest);
  warnings.push(...validation.warnings);
  errors.push(...validation.errors);

  const services = await Promise.all(
    manifestResult.manifest.services.map(async (service) => {
      const portResult = await checkPortAvailable(service.port, service.host || "127.0.0.1");
      const entryWarnings = [];
      const entryErrors = [];
      if (!portResult.ok) {
        entryErrors.push(portResult.error || "port check failed");
      } else if (portResult.state === "in_use") {
        entryWarnings.push("Port currently in use.");
      }

      return {
        id: service.id,
        label: service.label,
        enabled: service.enabled === true,
        required: service.required === true,
        host: service.host || "127.0.0.1",
        port: service.port ?? null,
        currentPhaseBehavior: service.currentPhaseBehavior,
        managedByNexusUp: false,
        healthCheckAttempted: false,
        status: statusFromBehavior(service),
        warnings: entryWarnings,
        errors: entryErrors,
      };
    }),
  );

  return {
    statusVersion: "1.0",
    phase: "P41.6.1",
    generatedAt: new Date().toISOString(),
    mode: manifestResult.manifest.mode || "local-private",
    services,
    summary: summarizeServiceManifest(manifestResult.manifest),
    warnings,
    errors,
  };
}

export function summarizeServiceStatus(status) {
  const lines = [
    "NEXUS Local Service Status",
    `Mode: ${status.mode}`,
    `Phase: ${status.phase}`,
    "Services:",
  ];

  for (const service of status.services) {
    let description = service.status;
    if (service.id === "dashboard" || service.id === "local-api" || service.id === "action-bridge") {
      description = "described, managed by nexus:up in P41.6.2";
    } else if (service.id === "db-foundation") {
      description = "file-backed/read-only";
    } else if (service.status === "not_enabled") {
      description = "not enabled";
    } else if (service.status === "planned") {
      description = "planned";
    }
    lines.push(`- ${service.label}: ${description}`);
  }

  lines.push("Current behavior:");
  lines.push("- This phase does not start or stop services.");
  lines.push("- Use existing service commands manually until P41.6.2.");
  lines.push(`Result: ${status.errors.length === 0 ? "PASS" : "FAIL"}`);

  return lines.join("\n");
}

export function writeServiceStatusReport(status, options = {}) {
  const reportPath = options.reportPath || REPORT_PATH;
  mkdirSync(join(ROOT, "reports"), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(status, null, 2)}\n`, "utf8");
  return reportPath;
}
