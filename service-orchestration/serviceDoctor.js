import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import { loadServiceManifest, validateServiceManifest } from "./serviceManifest.js";
import { checkPortAvailable, isLocalhostHost } from "./servicePorts.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "nexus-doctor-report.json");

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

export function checkNodeRuntime() {
  return {
    ok: typeof process?.versions?.node === "string",
    message: typeof process?.versions?.node === "string"
      ? `Node ${process.versions.node}`
      : "Node runtime unavailable",
  };
}

export function checkPackageScripts() {
  try {
    const pkg = readJson("package.json");
    const requiredScripts = [
      "nexus:status",
      "nexus:doctor",
      "check:nexus-service-orchestration",
    ];
    const missing = requiredScripts.filter((script) => !pkg.scripts?.[script]);
    return {
      ok: missing.length === 0,
      message: missing.length === 0 ? "Required scripts present" : `Missing scripts: ${missing.join(", ")}`,
      missing,
    };
  } catch (error) {
    return {
      ok: false,
      message: `Could not read package.json: ${error.message}`,
      missing: [],
    };
  }
}

export function checkServiceManifest() {
  const loaded = loadServiceManifest();
  if (!loaded.ok) {
    return {
      ok: false,
      message: loaded.errors.join("; "),
      warnings: loaded.warnings,
    };
  }
  const validation = validateServiceManifest(loaded.manifest);
  return {
    ok: validation.ok,
    message: validation.ok ? "Service manifest valid" : validation.errors.join("; "),
    warnings: validation.warnings,
    manifest: loaded.manifest,
  };
}

export function checkLocalhostBindingPolicy(options = {}) {
  const manifest = options.manifest;
  if (!manifest) {
    return { ok: false, message: "Manifest unavailable for binding check" };
  }

  const violations = manifest.services
    .filter((service) => service.host && !isLocalhostHost(service.host))
    .map((service) => `${service.id}:${service.host}`);

  return {
    ok: violations.length === 0,
    message: violations.length === 0 ? "Localhost-only binding policy satisfied" : `Non-localhost bindings: ${violations.join(", ")}`,
  };
}

export async function checkKnownPorts(options = {}) {
  const manifest = options.manifest;
  if (!manifest) {
    return { ok: false, message: "Manifest unavailable for port check", ports: [] };
  }

  const ports = await Promise.all(
    manifest.services.map(async (service) => ({
      id: service.id,
      host: service.host || "127.0.0.1",
      port: service.port ?? null,
      result: await checkPortAvailable(service.port, service.host || "127.0.0.1"),
    })),
  );

  return {
    ok: ports.every((entry) => entry.result.ok),
    message: "Known ports inspected locally",
    ports,
  };
}

export async function runNexusDoctor(options = {}) {
  const nodeRuntime = checkNodeRuntime(options);
  const packageScripts = checkPackageScripts(options);
  const manifestCheck = checkServiceManifest(options);
  const localhostPolicy = checkLocalhostBindingPolicy({ manifest: manifestCheck.manifest });
  const knownPorts = await checkKnownPorts({ manifest: manifestCheck.manifest });

  const manifestText = existsSync(join(ROOT, "nexus.services.json"))
    ? readFileSync(join(ROOT, "nexus.services.json"), "utf8")
    : "";

  const secretExposure = {
    ok: ![
      "DATABASE_URL",
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
      "sk-",
      "secret",
      "token",
    ].some((marker) => manifestText.includes(marker)),
    message: "Manifest contains no obvious secret markers",
  };
  if (!secretExposure.ok) {
    secretExposure.message = "Manifest contains forbidden secret markers";
  }

  const futureServicesDisabled = {
    ok: Array.isArray(manifestCheck.manifest?.services)
      ? manifestCheck.manifest.services
        .filter((service) => ["worker-runtime", "tool-gateway", "mcp-gateway"].includes(service.id))
        .every((service) => service.enabled === false && service.currentPhaseBehavior === "not_enabled")
      : false,
    message: "Future services remain disabled by design",
  };

  const noServiceStartAttempted = {
    ok: true,
    message: "No service start attempted",
  };

  const result = {
    doctorVersion: "1.0",
    phase: "P41.6.1",
    generatedAt: new Date().toISOString(),
    mode: "local-private",
    checks: {
      nodeRuntime,
      packageScripts,
      serviceManifest: manifestCheck,
      localhostBindingPolicy: localhostPolicy,
      knownPorts,
      secretExposure,
      futureServicesDisabled,
      noServiceStartAttempted,
    },
    warnings: [
      ...(manifestCheck.warnings || []),
      ...((knownPorts.ports || []).filter((entry) => entry.result.state === "in_use").map((entry) => `${entry.id} port ${entry.port} is currently in use.`)),
    ],
    errors: [
      ...(!nodeRuntime.ok ? [nodeRuntime.message] : []),
      ...(!packageScripts.ok ? [packageScripts.message] : []),
      ...(!manifestCheck.ok ? [manifestCheck.message] : []),
      ...(!localhostPolicy.ok ? [localhostPolicy.message] : []),
      ...(!knownPorts.ok ? [knownPorts.message] : []),
      ...(!secretExposure.ok ? [secretExposure.message] : []),
      ...(!futureServicesDisabled.ok ? [futureServicesDisabled.message] : []),
    ],
  };

  return result;
}

export function summarizeDoctorResult(result) {
  const rows = [
    "NEXUS Local Doctor",
    `Node runtime: ${result.checks.nodeRuntime.ok ? "PASS" : "FAIL"}`,
    `Package scripts: ${result.checks.packageScripts.ok ? "PASS" : "FAIL"}`,
    `Service manifest: ${result.checks.serviceManifest.ok ? "PASS" : "FAIL"}`,
    `Localhost binding policy: ${result.checks.localhostBindingPolicy.ok ? "PASS" : "FAIL"}`,
    `Secret exposure check: ${result.checks.secretExposure.ok ? "PASS" : "FAIL"}`,
    `Future services disabled: ${result.checks.futureServicesDisabled.ok ? "PASS" : "FAIL"}`,
    `No service start attempted: PASS`,
    `Result: ${result.errors.length === 0 ? "PASS" : "FAIL"}`,
  ];

  return rows.join("\n");
}

export function writeDoctorReport(result, options = {}) {
  const reportPath = options.reportPath || REPORT_PATH;
  mkdirSync(join(ROOT, "reports"), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return reportPath;
}
