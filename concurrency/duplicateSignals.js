export function normalizeSignal(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildDuplicateSignals(task = {}) {
  const pathScope = Array.isArray(task.paths) ? task.paths : task.path ? [task.path] : [];
  const signals = {
    title: normalizeSignal(task.title || task.name),
    capability: normalizeSignal(task.capabilityId || task.capability),
    project: normalizeSignal(task.projectId),
    repo: normalizeSignal(task.repoId),
    mission: normalizeSignal(task.missionId),
    status: normalizeSignal(task.status || task.state),
    paths: pathScope.map(normalizeSignal).filter(Boolean),
  };
  const availableSignals = Object.entries(signals)
    .filter(([, value]) => Array.isArray(value) ? value.length > 0 : Boolean(value))
    .map(([key]) => key);
  return { ...signals, availableSignals };
}

export function listMatchingSignalNames(left = {}, right = {}) {
  const matches = [];
  for (const key of ["title", "capability", "project", "repo", "mission"]) {
    if (left[key] && right[key] && left[key] === right[key]) matches.push(key);
  }
  if (left.paths?.length && right.paths?.length && left.paths.some((path) => right.paths.includes(path))) {
    matches.push("path");
  }
  return matches;
}
