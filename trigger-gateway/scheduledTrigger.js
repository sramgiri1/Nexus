const SUPPORTED_SCHEDULE_FORMS = ["disabled", "manual-only", "daily-preview", "weekly-preview", "cron-preview"];

export function validateScheduleExpression(input = {}) {
  const errors = [];
  const scheduleForm = input.scheduleForm || "disabled";
  const expression = input.expression || "";

  if (!SUPPORTED_SCHEDULE_FORMS.includes(scheduleForm)) {
    errors.push(`Unsupported schedule form: ${scheduleForm}`);
  }
  if (scheduleForm === "cron-preview") {
    if (typeof expression !== "string" || expression.trim().length === 0) {
      errors.push("cron-preview requires a non-empty string expression");
    }
    if (expression.includes("\n") || expression.length > 120) {
      errors.push("cron-preview expression must be a single short string");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function createScheduledTriggerPreview(input = {}) {
  const scheduleForm = input.scheduleForm || "disabled";
  const expression = input.expression || "";
  const validation = validateScheduleExpression({ scheduleForm, expression });

  return {
    previewVersion: "1.0",
    phase: "P53.3",
    triggerType: "schedule.cron_preview",
    scheduleForm,
    expression,
    valid: validation.valid,
    errors: validation.errors,
    disabledByDefault: true,
    dryRunOnly: true,
    executionAllowed: false,
    schedulerRuntimeEnabled: false,
    timerRegistrationAllowed: false,
    backgroundJobsAllowed: false,
    workerRuntimeAllowed: false,
    rateLimitRequired: true,
    costPolicyRequired: true,
    killSwitchRequired: true,
    dedupeRequired: true,
    status: "preview_only",
    operatorMessage: "Scheduled triggers are preview only. Runtime scheduler and worker runtime are not enabled.",
  };
}

export function validateScheduledTriggerPreview(preview = {}) {
  const errors = [];
  if (!SUPPORTED_SCHEDULE_FORMS.includes(preview.scheduleForm)) errors.push("Unsupported schedule form");
  if (preview.disabledByDefault !== true) errors.push("Scheduled trigger must be disabled by default");
  if (preview.dryRunOnly !== true) errors.push("Scheduled trigger must be dry-run only");
  if (preview.executionAllowed !== false) errors.push("Scheduled trigger execution must be disabled");
  if (preview.schedulerRuntimeEnabled !== false) errors.push("Scheduler runtime must be disabled");
  if (preview.timerRegistrationAllowed !== false) errors.push("Timer registration must be disabled");
  if (preview.backgroundJobsAllowed !== false) errors.push("Background jobs must be disabled");
  if (preview.workerRuntimeAllowed !== false) errors.push("Worker runtime must be disabled");
  if (preview.rateLimitRequired !== true) errors.push("Rate limit must be required");
  if (preview.costPolicyRequired !== true) errors.push("Cost policy must be required");
  if (preview.killSwitchRequired !== true) errors.push("Kill switch must be required");
  return { valid: errors.length === 0, errors };
}

export function summarizeScheduledTriggers() {
  const previews = SUPPORTED_SCHEDULE_FORMS.map((scheduleForm) => (
    createScheduledTriggerPreview({
      scheduleForm,
      expression: scheduleForm === "cron-preview" ? "0 9 * * 1" : "",
    })
  ));

  return {
    phase: "P53.3",
    supportedScheduleForms: SUPPORTED_SCHEDULE_FORMS,
    previewCount: previews.length,
    disabledByDefaultCount: previews.filter((preview) => preview.disabledByDefault).length,
    executionAllowedCount: previews.filter((preview) => preview.executionAllowed).length,
    workerRuntimeEnabledCount: previews.filter((preview) => preview.workerRuntimeAllowed).length,
    previews,
  };
}
