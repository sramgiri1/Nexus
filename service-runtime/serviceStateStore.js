import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const SERVICES_DIR = join(ROOT, "local-state", "runtime", "services");
const LOGS_DIR = join(SERVICES_DIR, "logs");
const STATE_PATH = join(SERVICES_DIR, "service-state.json");

export function getServiceStatePaths() {
  return {
    servicesDir: SERVICES_DIR,
    logsDir: LOGS_DIR,
    statePath: STATE_PATH,
  };
}

export function createEmptyServiceState() {
  return {
    stateVersion: "1.0",
    updatedAt: new Date().toISOString(),
    mode: "local-private",
    services: [],
  };
}

export function ensureServiceRuntimePaths() {
  mkdirSync(SERVICES_DIR, { recursive: true });
  mkdirSync(LOGS_DIR, { recursive: true });
}

export function loadServiceState() {
  ensureServiceRuntimePaths();
  if (!existsSync(STATE_PATH)) {
    const initialState = createEmptyServiceState();
    writeFileSync(STATE_PATH, `${JSON.stringify(initialState, null, 2)}\n`, "utf8");
    return initialState;
  }

  try {
    const parsed = JSON.parse(readFileSync(STATE_PATH, "utf8"));
    if (!Array.isArray(parsed.services)) parsed.services = [];
    return parsed;
  } catch {
    return createEmptyServiceState();
  }
}

export function saveServiceState(state) {
  ensureServiceRuntimePaths();
  const nextState = {
    stateVersion: "1.0",
    updatedAt: new Date().toISOString(),
    mode: state?.mode || "local-private",
    services: Array.isArray(state?.services) ? state.services : [],
  };
  writeFileSync(STATE_PATH, `${JSON.stringify(nextState, null, 2)}\n`, "utf8");
  return nextState;
}

export function getServiceStateEntry(state, serviceId) {
  return Array.isArray(state?.services) ? state.services.find((service) => service.id === serviceId) || null : null;
}

export function upsertServiceStateEntry(state, entry) {
  const nextState = {
    ...(state || createEmptyServiceState()),
    services: Array.isArray(state?.services) ? [...state.services] : [],
  };
  const index = nextState.services.findIndex((service) => service.id === entry.id);
  if (index === -1) {
    nextState.services.push(entry);
  } else {
    nextState.services[index] = { ...nextState.services[index], ...entry };
  }
  return nextState;
}
