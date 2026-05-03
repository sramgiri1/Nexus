// safety/safeQueue.js
// Governor-authorized queue write for internal loop operations (auto-heal).
// All direct writes to task-queue.json from outside the enqueue_task tool must go through here.

import path from "path";
import { updateJsonFile } from "../utils/json-store.js";
import { authorizeAction } from "./governor.js";
import { logSafetyEvent }  from "./safetyLogger.js";

const ROOT       = process.cwd();
const QUEUE_FILE = path.join(ROOT, "memory", "task-queue.json");
const PRIO_ORDER = { critical: 0, high: 1, normal: 2, low: 3 };

/**
 * Push a task to the queue after passing it through the governor.
 * The caller ("loop") must be in the ORCHESTRATOR tier of agent-permissions.json.
 *
 * @param {{ agentId: string, task: object, parentTaskId?: string, reason?: string }} opts
 * @returns {Promise<{ success: boolean, taskId?: string, reason?: string }>}
 */
export async function safeEnqueueTask({ agentId, task, parentTaskId, reason = "" }) {
  const check = await authorizeAction({
    agentId:       "loop",
    actionType:    "tool_call",
    toolName:      "enqueue_task",
    targetAgentId: agentId,
    taskId:        parentTaskId,
  });

  if (!check.allowed) {
    await logSafetyEvent({
      type:         "safe_enqueue_blocked",
      agentId:      "loop",
      targetAgent:  agentId,
      reason:       check.reason,
      parentTaskId,
      taskReason:   reason,
    });
    return { success: false, reason: check.reason };
  }

  await updateJsonFile(QUEUE_FILE, async (data) => {
    data.queue.push(task);
    data.queue.sort((a, b) => (PRIO_ORDER[a.priority] ?? 2) - (PRIO_ORDER[b.priority] ?? 2));
    data.lastUpdated = new Date().toISOString();
    return data;
  });

  return { success: true, taskId: task.id };
}
