import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const MANIFEST_PATH = join(ROOT, "nexus.services.json");

const REQUIRED_SERVICE_IDS = [
  "dashboard",
  "local-api",
  "action-bridge",
  "db-foundation",
  "worker-runtime",
  "tool-gateway",
  "mcp-gateway",
];

function detectManifestSecrets(serialized) {
  const forbiddenMarkers = [
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "sk-",
    "apiKey",
    "secret",
    "token",
  ];
  return forbiddenMarkers.filter((marker) => serialized.includes(marker));
}

export function loadServiceManifest(options = {}) {
  const manifestPath = options.manifestPath || MANIFEST_PATH;
  if (!existsSync(manifestPath)) {
    return {
      ok: false,
      errors: [`Service manifest not found: ${manifestPath}`],
      warnings: [],
      manifest: null,
      manifestPath,
    };
  }

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    return {
      ok: true,
      errors: [],
      warnings: [],
      manifest,
      manifestPath,
    };
  } catch (error) {
    return {
      ok: false,
      errors: [`Could not parse service manifest: ${error.message}`],
      warnings: [],
      manifest: null,
      manifestPath,
    };
  }
}

export function validateServiceManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== "object") {
    errors.push("Manifest must be an object.");
    return { ok: false, errors, warnings };
  }

  if (manifest.version !== "1.0") errors.push("Manifest version must be 1.0.");
  if (manifest.phase !== "P41.6.1") errors.push("Manifest phase must be P41.6.1.");
  if (manifest.mode !== "local-private") warnings.push("Manifest mode should default to local-private.");
  if (manifest.hostDefault !== "127.0.0.1") errors.push("hostDefault must be 127.0.0.1.");
  if (!Array.isArray(manifest.services)) errors.push("Manifest services must be an array.");

  const services = Array.isArray(manifest.services) ? manifest.services : [];
  for (const id of REQUIRED_SERVICE_IDS) {
    if (!services.some((service) => service.id === id)) {
      errors.push(`Missing required service: ${id}`);
    }
  }

  for (const service of services) {
    if (!service.id) errors.push("Every service requires an id.");
    if (!service.label) errors.push(`Service ${service.id || "<unknown>"} requires a label.`);
    if (service.host === "0.0.0.0") errors.push(`Service ${service.id} must not bind to 0.0.0.0.`);
    if ((service.enabled === true || service.port !== null) && !service.host) {
      errors.push(`Service ${service.id} requires a host when enabled or ported.`);
    }
    if (service.enabled === true && !service.command && service.type !== "persistence") {
      errors.push(`Enabled service ${service.id} requires a command.`);
    }
    if (service.id === "db-foundation" && service.dbWritesEnabled !== false) {
      errors.push("db-foundation must keep dbWritesEnabled false in P41.6.1.");
    }
    if (service.enabled === false && service.currentPhaseBehavior === "not_enabled" && service.command !== null) {
      warnings.push(`Disabled future service ${service.id} should usually leave command null.`);
    }
  }

  const secretHits = detectManifestSecrets(JSON.stringify(manifest));
  if (secretHits.length > 0) {
    errors.push(`Manifest contains forbidden secret markers: ${secretHits.join(", ")}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export function listServices(manifest, options = {}) {
  const services = Array.isArray(manifest?.services) ? [...manifest.services] : [];
  if (options.enabledOnly) {
    return services.filter((service) => service.enabled === true);
  }
  if (options.requiredOnly) {
    return services.filter((service) => service.required === true);
  }
  return services;
}

export function getServiceById(manifest, serviceId) {
  return listServices(manifest).find((service) => service.id === serviceId) || null;
}

export function summarizeServiceManifest(manifest) {
  const services = listServices(manifest);
  return {
    servicesTotal: services.length,
    enabledServices: services.filter((service) => service.enabled === true).length,
    requiredServices: services.filter((service) => service.required === true).length,
    managedNow: 0,
    managedLater: services.filter((service) => typeof service.startManagedInPhase === "string").length,
    disabledFutureServices: services.filter((service) => service.enabled === false).length,
  };
}
