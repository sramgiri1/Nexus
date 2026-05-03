// safety/safetyLogger.js
// Appends safety events to memory/safety-events.json.
// Must never throw — logging failures are swallowed so they never block the main flow.

import fs   from "fs/promises";
import path from "path";

const ROOT        = process.cwd();
const EVENTS_FILE = path.join(ROOT, "memory", "safety-events.json");

export async function logSafetyEvent(event) {
  try {
    let store = { events: [], lastUpdated: "" };
    try {
      const raw = await fs.readFile(EVENTS_FILE, "utf8");
      store = JSON.parse(raw);
    } catch { /* first write */ }

    store.events.push({
      id:        `se-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...event,
    });

    if (store.events.length > 1000) {
      store.events = store.events.slice(-1000);
    }

    store.lastUpdated = new Date().toISOString();
    await fs.writeFile(EVENTS_FILE, JSON.stringify(store, null, 2));
  } catch {
    // intentionally swallowed
  }
}
