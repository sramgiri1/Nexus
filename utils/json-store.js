import fs from "fs/promises";

const writeLocks = new Map();

function waitFor(turn) {
  return turn.catch(() => {});
}

export async function readJsonFile(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (fallback !== null) return fallback;
    throw error;
  }
}

export async function readJsonFileWithRetry(filePath, attempts = 3, delayMs = 50) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return JSON.parse(raw);
    } catch (error) {
      lastError = error;
      if (!(error instanceof SyntaxError) || i === attempts - 1) break;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

export async function writeJsonFileAtomic(filePath, data) {
  const dirSafeTemp = `${filePath}.${process.pid}.tmp`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(dirSafeTemp, payload, "utf8");
  await fs.rename(dirSafeTemp, filePath);
}

export function updateJsonFile(filePath, updater) {
  const prev = writeLocks.get(filePath) || Promise.resolve();
  const next = prev.then(async () => {
    const current = await readJsonFileWithRetry(filePath);
    const updated = await updater(current);
    await writeJsonFileAtomic(filePath, updated);
    return updated;
  });
  writeLocks.set(filePath, next);
  return next.finally(() => {
    if (writeLocks.get(filePath) === next) writeLocks.delete(filePath);
  });
}

export async function waitForPendingWrite(filePath) {
  const pending = writeLocks.get(filePath);
  if (pending) await waitFor(pending);
}
