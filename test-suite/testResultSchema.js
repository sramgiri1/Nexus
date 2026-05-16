/**
 * test-suite/testResultSchema.js
 * Field definitions for test result records.
 * No test execution occurs from this module.
 */

import { RUN_MODES, RESULT_STATUSES } from "./testTypes.js";

export const TEST_RESULT_FIELDS = [
  { name: "resultId", type: "string", required: true, description: "Unique result record identifier." },
  { name: "suiteId", type: "string", required: true, description: "Suite that produced this result." },
  { name: "projectId", type: "string", required: false, description: "Project ID for project-scoped suites." },
  { name: "osScope", type: "string", required: false, description: "OS scope for OS-scoped suites." },
  { name: "runMode", type: "string", required: true, enum: RUN_MODES, description: "How this result was produced: preview, controlled, external, or imported." },
  { name: "status", type: "string", required: true, enum: RESULT_STATUSES, description: "Result status." },
  { name: "commandPreview", type: "string", required: true, description: "Display-only command preview. Never executed by this module." },
  { name: "startedAt", type: "string", required: false, description: "ISO timestamp when run started (if available)." },
  { name: "finishedAt", type: "string", required: false, description: "ISO timestamp when run finished (if available)." },
  { name: "durationMs", type: "number", required: false, description: "Duration in milliseconds (if available)." },
  { name: "evidenceType", type: "string", required: true, description: "Type of evidence this result represents." },
  { name: "redacted", type: "boolean", required: true, description: "Always true — raw output is never stored." },
  { name: "sourceReportPath", type: "string", required: false, description: "Path to the source report file if available." },
  { name: "linkedTaskId", type: "string", required: false, description: "Linked task ID if this result is tied to a task." },
  { name: "linkedAgentId", type: "string", required: false, description: "Linked agent ID that produced this result." },
  { name: "correlationId", type: "string", required: false, description: "Correlation ID for tracing across systems." },
];

/**
 * Create an empty/default test result record.
 */
export function createEmptyTestResult() {
  return {
    resultId: "",
    suiteId: "",
    projectId: undefined,
    osScope: undefined,
    runMode: "preview",
    status: "not_run",
    commandPreview: "",
    startedAt: undefined,
    finishedAt: undefined,
    durationMs: undefined,
    evidenceType: "test-result",
    redacted: true,
    sourceReportPath: undefined,
    linkedTaskId: undefined,
    linkedAgentId: undefined,
    correlationId: undefined,
  };
}
