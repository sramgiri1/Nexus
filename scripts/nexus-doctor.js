import { existsSync, readFileSync } from "node:fs";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import {
  loadServiceManifest,
  validateServiceManifest,
  listServices,
  checkPortAvailable,
  checkServiceHealth,
  getServiceStatePaths,
} from "../service-runtime/index.js";

const ROOT = process.cwd();

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

async function stateStoreWritable() {
  const { servicesDir, statePath } = getServiceStatePaths();
  try {
    await access(servicesDir, constants.R_OK | constants.W_OK);
    if (existsSync(statePath)) {
      await access(statePath, constants.R_OK | constants.W_OK);
    }
    return { ok: true, message: "Service state path readable and writable" };
  } catch (error) {
    return { ok: false, message: `Service state path not writable: ${error.message}` };
  }
}

const checks = [];
const pkg = readJson("package.json");
const manifestResult = loadServiceManifest();
const manifest = manifestResult.manifest;
const manifestValidation = manifest ? validateServiceManifest(manifest) : { ok: false, errors: manifestResult.errors || ["Manifest unavailable"] };
const services = manifest ? listServices(manifest) : [];
const manifestText = existsSync(join(ROOT, "nexus.services.json")) ? readFileSync(join(ROOT, "nexus.services.json"), "utf8") : "";

checks.push({ label: "Node runtime", ok: typeof process.versions.node === "string" });
checks.push({ label: "Package scripts", ok: ["nexus:up", "nexus:down", "nexus:status", "nexus:doctor", "check:nexus-local-boot"].every((name) => pkg.scripts?.[name]) });
checks.push({ label: "Dashboard package exists", ok: existsSync(join(ROOT, "dashboard", "package.json")) });
checks.push({ label: "Service manifest", ok: manifestResult.ok && manifestValidation.ok });
checks.push({ label: "Local-only host validation", ok: services.every((service) => !service.host || service.host === "127.0.0.1" || service.host === "localhost") });
checks.push({ label: "No production DB enabled", ok: !manifestText.includes("DATABASE_URL") && !manifestText.includes("production") });
checks.push({ label: "No provider calls enabled", ok: services.every((service) => service.externalNetworkAllowed === false) });

const stateAccess = await stateStoreWritable();
checks.push({ label: "Service state path", ok: stateAccess.ok });

let portsOk = true;
for (const service of services.filter((entry) => entry.enabled === true && entry.port)) {
  const port = await checkPortAvailable(service.port, service.host);
  if (port.state === "in_use") {
    const health = await checkServiceHealth(service, { timeoutMs: 1200 });
    if (!health.ok) portsOk = false;
  } else if (!port.ok) {
    portsOk = false;
  }
}
checks.push({ label: "Known ports", ok: portsOk });
checks.push({ label: "No service start attempted", ok: true });

const failed = checks.some((check) => !check.ok);

console.log("NEXUS Local Doctor");
for (const check of checks) {
  console.log(`${check.label}: ${check.ok ? "PASS" : "FAIL"}`);
}
console.log(`Result: ${failed ? "FAIL" : "PASS"}`);

if (failed) {
  process.exitCode = 1;
}
