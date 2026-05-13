import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const MANIFEST_PATH = join(ROOT, "nexus.services.json");
const REQUIRED_SERVICE_IDS = ["command-center", "local-api", "action-bridge", "db", "workers", "mcp-gateway", "provider-gateway"];
const ALLOWED_HOSTS = new Set(["127.0.0.1", "localhost"]);
const FORBIDDEN_MARKERS = ["DATABASE_URL", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "sk-", "Bearer ", "postgres://", "mysql://"];

export function loadServiceManifest(options = {}) {
  const manifestPath = options.manifestPath || MANIFEST_PATH;
  if (!existsSync(manifestPath)) {
    return { ok: false, manifest: null, manifestPath, errors: [`Service manifest not found: ${manifestPath}`], warnings: [] };
  }

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    return { ok: true, manifest, manifestPath, errors: [], warnings: [] };
  } catch (error) {
    return { ok: false, manifest: null, manifestPath, errors: [`Could not parse service manifest: ${error.message}`], warnings: [] };
  }
}

function hasForbiddenSecrets(serialized) {
  return FORBIDDEN_MARKERS.filter((marker) => serialized.includes(marker));
}

export function validateServiceManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== "object") {
    return { ok: false, errors: ["Manifest must be an object."], warnings };
  }

  if (manifest.version !== "1.0") errors.push("Manifest version must be 1.0.");
  if (manifest.phase !== "P41.6.2") errors.push("Manifest phase must be P41.6.2.");
  if (manifest.mode !== "local-private") errors.push("Manifest mode must be local-private.");
  if (manifest.hostDefault !== "127.0.0.1") errors.push("Manifest hostDefault must be 127.0.0.1.");
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
    if (!service.category) errors.push(`Service ${service.id || "<unknown>"} requires a category.`);
    if (service.host && !ALLOWED_HOSTS.has(service.host)) {
      errors.push(`Service ${service.id} must use localhost-only host.`);
    }
    if (service.modeRequired !== "local-private") {
      errors.push(`Service ${service.id} must require local-private mode.`);
    }
    if (service.externalNetworkAllowed !== false) {
      errors.push(`Service ${service.id} must keep externalNetworkAllowed false.`);
    }
    if (service.id === "db" && service.dbWritesEnabled !== false) {
      errors.push("DB service must keep dbWritesEnabled false.");
    }
    if (service.enabled === true) {
      if (!service.command) errors.push(`Enabled service ${service.id} requires a command.`);
      if (!Array.isArray(service.args)) errors.push(`Enabled service ${service.id} requires args array.`);
      if (!service.cwd) errors.push(`Enabled service ${service.id} requires cwd.`);
      if (!Number.isInteger(service.startOrder)) errors.push(`Enabled service ${service.id} requires numeric startOrder.`);
      if (!Number.isInteger(service.stopOrder)) errors.push(`Enabled service ${service.id} requires numeric stopOrder.`);
    } else if (service.command !== null) {
      warnings.push(`Disabled service ${service.id} keeps command metadata but will not be started.`);
    }
  }

  const hits = hasForbiddenSecrets(JSON.stringify(manifest));
  if (hits.length > 0) {
    errors.push(`Manifest contains forbidden markers: ${hits.join(", ")}`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function listServices(manifest, options = {}) {
  const services = Array.isArray(manifest?.services) ? [...manifest.services] : [];
  if (options.enabledOnly) return services.filter((service) => service.enabled === true);
  if (options.requiredOnly) return services.filter((service) => service.required === true);
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
    disabledByDefault: services.filter((service) => service.enabled === false).length,
  };
}
