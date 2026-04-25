// dashboard/src/utils/memory.js
// In dev: files are served from /memory/ via Vite's public dir proxy
// The dashboard reads the same JSON files the agents write to.
// This means the dashboard always reflects live agent state.

const BASE = "/memory";

export async function readMemory(file) {
  try {
    const res = await fetch(`${BASE}/${file}.json?t=${Date.now()}`);
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`Could not read memory/${file}.json:`, e.message);
    return null;
  }
}

// Poll memory files every N seconds
export function useMemoryPoll(file, intervalMs = 3000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      const d = await readMemory(file);
      if (active && d) { setData(d); setLoading(false); }
    };
    poll();
    const iv = setInterval(poll, intervalMs);
    return () => { active = false; clearInterval(iv); };
  }, [file, intervalMs]);

  return { data, loading };
}

// Re-export useState/useEffect for convenience (avoids import in each file)
import { useState, useEffect } from "react";
export { useState, useEffect };
