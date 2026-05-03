import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const XCODE_APP_DEVELOPER_DIR = "/Applications/Xcode.app/Contents/Developer";

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

export async function resolveDeveloperDir() {
  if (process.env.DEVELOPER_DIR) return process.env.DEVELOPER_DIR;

  try {
    const { stdout } = await execAsync("xcode-select -p", { timeout: 10000 });
    const selected = stdout.trim();
    if (selected.includes("/Applications/Xcode.app/Contents/Developer")) return selected;
  } catch {}

  try {
    await execAsync(`test -d ${shellQuote(XCODE_APP_DEVELOPER_DIR)}`, { timeout: 10000 });
    return XCODE_APP_DEVELOPER_DIR;
  } catch {}

  return null;
}

export async function execWithXcode(command, { timeout = 60000, cwd } = {}) {
  const developerDir = await resolveDeveloperDir();
  if (!developerDir) {
    throw new Error("Full Xcode is not available. Install Xcode.app or set DEVELOPER_DIR.");
  }

  const env = { ...process.env, DEVELOPER_DIR: developerDir };
  return execAsync(command, { timeout, cwd, env, maxBuffer: 1024 * 1024 * 20 });
}

export async function listAvailableIOSDevices() {
  const { stdout } = await execWithXcode("xcrun simctl list devices available -j", { timeout: 15000 });
  const all = JSON.parse(stdout);
  const matches = [];

  for (const [runtime, devices] of Object.entries(all.devices)) {
    if (!runtime.includes("iOS")) continue;
    for (const device of devices) {
      if (!device.isAvailable) continue;
      matches.push(device);
    }
  }

  return matches;
}
