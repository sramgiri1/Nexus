import { buildCheckTable, writeMarkdownReport } from "../shared/index.js";
import { buildDuplicateSignals, listMatchingSignalNames } from "./duplicateSignals.js";
import { stablePreviewId } from "./concurrencySchema.js";

export function scoreDuplicateCandidate(task = {}, candidate = {}) {
  const taskSignals = buildDuplicateSignals(task);
  const candidateSignals = buildDuplicateSignals(candidate);
  const matches = listMatchingSignalNames(taskSignals, candidateSignals);
  const weights = { title: 0.3, capability: 0.2, project: 0.15, repo: 0.1, mission: 0.15, path: 0.1 };
  const score = Math.min(1, matches.reduce((total, signal) => total + weights[signal], 0));
  return {
    candidateId: stablePreviewId("dup_preview", [task.taskId, candidate.taskId, matches.join(",")]),
    taskId: task.taskId || task.id || "",
    similarTaskId: candidate.taskId || candidate.id || "",
    projectId: task.projectId || candidate.projectId || "",
    similaritySignals: matches,
    score: Number(score.toFixed(2)),
    ...classifyDuplicateDecision(score, matches),
    previewOnly: true,
  };
}

export function classifyDuplicateDecision(score, signals = []) {
  if (!signals.length) {
    return { decision: "insufficient_data", recommendedAction: "inspect" };
  }
  if (score >= 0.75) {
    return { decision: "duplicate_preview", recommendedAction: "block_preview" };
  }
  if (score >= 0.45) {
    return { decision: "possible_duplicate", recommendedAction: "warn" };
  }
  return { decision: "unique", recommendedAction: "allow" };
}

export function findDuplicateWork(task = {}, candidateTasks = []) {
  const candidates = candidateTasks
    .filter((candidate) => (candidate.taskId || candidate.id) !== (task.taskId || task.id))
    .map((candidate) => scoreDuplicateCandidate(task, candidate))
    .sort((left, right) => right.score - left.score);
  const warnings = [];
  if (!buildDuplicateSignals(task).availableSignals.length) {
    warnings.push("Task has insufficient deterministic signals for duplicate detection.");
  }
  return {
    previewOnly: true,
    taskId: task.taskId || task.id || "",
    candidates,
    warnings,
    summary: buildDeduplicationSummary({ candidates, warnings }),
  };
}

export function buildDeduplicationSummary(result = {}) {
  const candidates = result.candidates || [];
  return {
    totalCandidates: candidates.length,
    duplicates: candidates.filter((candidate) => candidate.decision === "duplicate_preview").length,
    possibleDuplicates: candidates.filter((candidate) => candidate.decision === "possible_duplicate").length,
    unique: candidates.filter((candidate) => candidate.decision === "unique").length,
    insufficientData: candidates.filter((candidate) => candidate.decision === "insufficient_data").length,
    previewOnly: true,
    mergeEnabled: false,
  };
}

export function writeDeduplicationReport(result, filePath = "reports/work-deduplication-report.md", metadata = {}) {
  const checks = [
    { name: "Deterministic signals", status: "PASS", details: "No embeddings or provider calls" },
    { name: "Duplicate candidates", status: "PASS", details: `${result.summary.totalCandidates} candidate(s)` },
    { name: "Task merging", status: "PASS", details: "Disabled; preview recommendations only" },
  ];
  writeMarkdownReport(filePath, [
    { title: "Scope", body: "P61.3 detects possible duplicate work using deterministic signals only." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Summary", body: `- Duplicate previews: ${result.summary.duplicates}\n- Possible duplicates: ${result.summary.possibleDuplicates}\n- Merge enabled: no` },
  ], {
    title: "NEXUS Work Deduplication Report",
    metadata,
  });
  return filePath;
}
