const AGENT_PROFILES = {
  nexus: { agentGroup: 'control', agentPlane: 'control', agentClass: 'decision' },
  shepherd: { agentGroup: 'control', agentPlane: 'control', agentClass: 'orchestration' },
  auditor: { agentGroup: 'verification', agentPlane: 'verification', agentClass: 'code_quality_gate' },
  sentinel: { agentGroup: 'verification', agentPlane: 'verification', agentClass: 'qa_gate' },
  warden: { agentGroup: 'verification', agentPlane: 'verification', agentClass: 'compliance_gate' },
  atlas: { agentGroup: 'product', agentPlane: 'execution', agentClass: 'product_definition' },
  prism: { agentGroup: 'product', agentPlane: 'execution', agentClass: 'design' },
  core: { agentGroup: 'product', agentPlane: 'execution', agentClass: 'backend_implementation' },
  swift: { agentGroup: 'product', agentPlane: 'execution', agentClass: 'ios_implementation' },
  pixel: { agentGroup: 'product', agentPlane: 'execution', agentClass: 'web_implementation' },
  canvas: { agentGroup: 'product', agentPlane: 'execution', agentClass: 'content_static_assets' },
  forge: { agentGroup: 'platform', agentPlane: 'execution', agentClass: 'deployment_operations' },
  stream: { agentGroup: 'platform', agentPlane: 'execution', agentClass: 'data_pipeline' },
  synapse: { agentGroup: 'platform', agentPlane: 'execution', agentClass: 'ai_integration' },
  radar: { agentGroup: 'strategy', agentPlane: 'execution', agentClass: 'market_research' },
  meridian: { agentGroup: 'strategy', agentPlane: 'execution', agentClass: 'business_strategy' },
  relay: { agentGroup: 'observability', agentPlane: 'observability', agentClass: 'feedback_triage' },
  beacon: { agentGroup: 'growth', agentPlane: 'execution', agentClass: 'marketing' },
  compass: { agentGroup: 'growth', agentPlane: 'execution', agentClass: 'aso_seo' },
  oracle: { agentGroup: 'growth', agentPlane: 'execution', agentClass: 'analytics_strategy' },
};

const NEVER_BATCH_TYPES = [
  'code_edit',
  'tool_loop',
  'verification_gate',
  'release_decision',
  'deploy',
  'secrets_change',
  'ci_cd_change',
  'migration',
  'auto_heal',
  'security_blocker',
  'xcode_simulator',
  'xcodebuild',
  'simulator_run',
  'xcode_build',
];

const WARDEN_SKILLS = [
  'warden.compliance.privacy.check',
  'warden.compliance.permissions.validate',
  'warden.compliance.appstore.check',
];

const STATIC_SKILLS = {
  nexus: [
    'nexus.read.system_state',
    'nexus.decide.priority',
    'nexus.decide.release',
  ],
  shepherd: [
    'orchestrator.flow.plan',
    'orchestrator.flow.dispatch',
    'orchestrator.flow.monitor',
    'orchestrator.flow.aggregate',
  ],
  auditor: [
    'auditor.code.lint',
    'auditor.code.static_analysis',
    'auditor.code.test_coverage',
    'auditor.code.diff_review',
  ],
  sentinel: [
    'sentinel.qa.simulator.run',
    'sentinel.qa.tests.execute',
    'sentinel.qa.logs.analyze',
    'sentinel.qa.security.scan',
  ],
  warden: WARDEN_SKILLS,
};

const HANDOFF_RULES = {
  nexus: [
    { targetAgent: 'shepherd', reason: 'Execution planning and routing' },
    { targetAgent: 'relay', reason: 'Operational summaries and signal synthesis' },
    { targetAgent: 'forge', reason: 'Deployment readiness review' },
    { targetAgent: 'warden', reason: 'Compliance escalation' },
    { targetAgent: 'sentinel', reason: 'QA gate summary' },
    { targetAgent: 'auditor', reason: 'Code quality gate summary' },
  ],
  shepherd: [
    { targetAgent: 'atlas', reason: 'Product definition and scope' },
    { targetAgent: 'prism', reason: 'Design and UX handoff' },
    { targetAgent: 'core', reason: 'Backend implementation routing' },
    { targetAgent: 'swift', reason: 'iOS implementation routing' },
    { targetAgent: 'pixel', reason: 'Web implementation routing' },
    { targetAgent: 'canvas', reason: 'Content and static asset routing' },
    { targetAgent: 'forge', reason: 'Platform execution routing' },
    { targetAgent: 'stream', reason: 'Data pipeline routing' },
    { targetAgent: 'synapse', reason: 'AI integration routing' },
    { targetAgent: 'auditor', reason: 'Code verification routing' },
    { targetAgent: 'sentinel', reason: 'QA verification routing' },
    { targetAgent: 'warden', reason: 'Compliance verification routing' },
    { targetAgent: 'radar', reason: 'Market research routing' },
    { targetAgent: 'meridian', reason: 'Business strategy routing' },
    { targetAgent: 'relay', reason: 'Feedback triage routing' },
    { targetAgent: 'beacon', reason: 'Marketing execution routing' },
    { targetAgent: 'compass', reason: 'Discoverability routing' },
    { targetAgent: 'oracle', reason: 'Analytics strategy routing' },
  ],
  core: [
    { targetAgent: 'auditor', reason: 'Backend diff verification' },
    { targetAgent: 'sentinel', reason: 'Backend QA validation' },
    { targetAgent: 'warden', reason: 'Privacy and data handling review' },
    { targetAgent: 'swift', reason: 'Client integration dependency' },
    { targetAgent: 'forge', reason: 'Runtime and deploy dependency' },
  ],
  swift: [
    { targetAgent: 'auditor', reason: 'iOS diff verification' },
    { targetAgent: 'sentinel', reason: 'Simulator and QA validation' },
    { targetAgent: 'warden', reason: 'Privacy and permission review' },
    { targetAgent: 'core', reason: 'API or backend dependency' },
    { targetAgent: 'prism', reason: 'Design clarification' },
  ],
  pixel: [
    { targetAgent: 'auditor', reason: 'Frontend diff verification' },
    { targetAgent: 'sentinel', reason: 'Frontend QA validation' },
    { targetAgent: 'warden', reason: 'Privacy review for user-facing data' },
    { targetAgent: 'core', reason: 'Backend dependency' },
    { targetAgent: 'prism', reason: 'UI and UX clarification' },
  ],
  canvas: [
    { targetAgent: 'warden', reason: 'Privacy and compliance content review' },
    { targetAgent: 'sentinel', reason: 'Static page validation' },
    { targetAgent: 'pixel', reason: 'Web integration support' },
    { targetAgent: 'prism', reason: 'Design clarification' },
    { targetAgent: 'beacon', reason: 'Messaging alignment' },
  ],
  forge: [
    { targetAgent: 'auditor', reason: 'Config diff verification' },
    { targetAgent: 'sentinel', reason: 'Runtime and deployment QA' },
    { targetAgent: 'warden', reason: 'Secrets, permissions, and privacy review' },
    { targetAgent: 'core', reason: 'Backend runtime issue remediation' },
    { targetAgent: 'nexus', reason: 'Release-readiness escalation' },
    { targetAgent: 'shepherd', reason: 'Approval and planning escalation' },
  ],
  stream: [
    { targetAgent: 'core', reason: 'Backend data integration dependency' },
    { targetAgent: 'oracle', reason: 'Analytics schema dependency' },
    { targetAgent: 'warden', reason: 'Data classification and privacy review' },
    { targetAgent: 'sentinel', reason: 'Pipeline QA validation' },
    { targetAgent: 'auditor', reason: 'Data code diff verification' },
    { targetAgent: 'forge', reason: 'Runtime or deploy dependency' },
  ],
  synapse: [
    { targetAgent: 'core', reason: 'Backend AI integration dependency' },
    { targetAgent: 'swift', reason: 'iOS AI integration dependency' },
    { targetAgent: 'pixel', reason: 'Web AI integration dependency' },
    { targetAgent: 'forge', reason: 'Provider or deployment configuration' },
    { targetAgent: 'warden', reason: 'Privacy or permissions review' },
    { targetAgent: 'sentinel', reason: 'AI feature QA validation' },
    { targetAgent: 'auditor', reason: 'Code diff verification' },
    { targetAgent: 'stream', reason: 'Data flow dependency' },
  ],
  radar: [
    { targetAgent: 'meridian', reason: 'Pricing and business model implications' },
    { targetAgent: 'atlas', reason: 'Product scope implications' },
    { targetAgent: 'beacon', reason: 'Marketing and launch implications' },
    { targetAgent: 'compass', reason: 'SEO and ASO implications' },
    { targetAgent: 'warden', reason: 'Privacy or source-boundary concerns' },
  ],
  meridian: [
    { targetAgent: 'atlas', reason: 'Product implications and scope updates' },
    { targetAgent: 'radar', reason: 'Research gaps and market validation' },
    { targetAgent: 'beacon', reason: 'Marketing execution and messaging' },
    { targetAgent: 'compass', reason: 'Discoverability execution' },
    { targetAgent: 'oracle', reason: 'Analytics validation of business assumptions' },
    { targetAgent: 'warden', reason: 'Compliance-sensitive claims review' },
  ],
  relay: [
    { targetAgent: 'core', reason: 'Backend issue routing' },
    { targetAgent: 'swift', reason: 'iOS issue routing' },
    { targetAgent: 'pixel', reason: 'Web issue routing' },
    { targetAgent: 'prism', reason: 'UX and design issue routing' },
    { targetAgent: 'sentinel', reason: 'QA reproduction support' },
    { targetAgent: 'warden', reason: 'Sensitive feedback review' },
  ],
  beacon: [
    { targetAgent: 'canvas', reason: 'Landing and static implementation' },
    { targetAgent: 'compass', reason: 'SEO and ASO coordination' },
    { targetAgent: 'atlas', reason: 'Product claim validation' },
    { targetAgent: 'meridian', reason: 'Business positioning validation' },
    { targetAgent: 'warden', reason: 'Privacy and App Store claim review' },
    { targetAgent: 'prism', reason: 'Design execution support' },
  ],
  compass: [
    { targetAgent: 'beacon', reason: 'Messaging and copy coordination' },
    { targetAgent: 'canvas', reason: 'Landing or metadata implementation' },
    { targetAgent: 'warden', reason: 'App Store or compliance review' },
    { targetAgent: 'meridian', reason: 'Positioning clarification' },
    { targetAgent: 'atlas', reason: 'Product positioning clarification' },
  ],
  oracle: [
    { targetAgent: 'core', reason: 'Backend instrumentation routing' },
    { targetAgent: 'swift', reason: 'iOS instrumentation routing' },
    { targetAgent: 'pixel', reason: 'Web instrumentation routing' },
    { targetAgent: 'stream', reason: 'Data pipeline dependency' },
    { targetAgent: 'warden', reason: 'Privacy review for analytics data' },
    { targetAgent: 'sentinel', reason: 'Instrumentation validation' },
  ],
};

function normalizeAgentId(agentId) {
  return typeof agentId === 'string' ? agentId.trim().toLowerCase() : '';
}

function ensureArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function taskText(task = {}) {
  return [
    task.taskType,
    task.type,
    task.objective,
    task.description,
    task.reason,
    task.failureType,
    task.failureReason,
    task.blockReason,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function isLegacyTask(task = {}) {
  return !('projectId' in task)
    && !('sourceAgent' in task)
    && !('targetAgent' in task)
    && !('taskType' in task)
    && !('allowedFiles' in task)
    && (('description' in task) || ('project' in task) || ('agent' in task));
}

function inferTaskType(task = {}, agentId = '') {
  const explicit = typeof task.taskType === 'string' && task.taskType.trim()
    ? task.taskType.trim()
    : typeof task.type === 'string' && task.type.trim()
      ? task.type.trim()
      : '';
  if (explicit) return explicit;

  const text = taskText(task);
  if (/release|go\/no-go|go-no-go/.test(text)) return 'release_decision';
  if (/deploy|rollout|release ops/.test(text)) return 'deploy';
  if (/privacy|permission|app store|compliance/.test(text)) return 'privacy_review';
  if (/simulator|xcodebuild|xcode/.test(text)) return 'xcode_simulator';
  if (/feedback|cluster|triage|bug/.test(text)) return 'bug_clustering';
  if (/analytics|metric|instrumentation|funnel|event schema/.test(text)) return 'analytics_spec';
  if (/market|competitor|tam|threat/.test(text)) return 'market_analysis';
  if (/pricing|revenue|gtm|investor/.test(text)) return 'revenue_model';
  if (/marketing|launch copy|campaign|app store copy|landing copy/.test(text)) return 'marketing_copy';
  if (/keyword|seo|aso|metadata/.test(text)) return 'seo_meta';
  if (/design|ux|screen|component/.test(text)) return 'design_artifact';
  if (/plan|dispatch|route|handoff/.test(text) && agentId === 'shepherd') return 'orchestration_plan';
  if (/ai|provider|prompt|tool workflow|agentic/.test(text)) return 'ai_integration';
  if (/data pipeline|ingestion|transformation/.test(text)) return 'data_pipeline';
  if (/static|landing|content|privacy page|demo page/.test(text)) return 'content_artifact';
  if (/swift|ios/.test(text)) return 'ios.code_edit';
  if (/web|frontend|dashboard|ui/.test(text)) return 'web.code_edit';
  if (/backend|api|route|prisma|auth/.test(text)) return 'backend.code_edit';
  if (/code|implement|build|edit/.test(text)) return 'code_edit';
  return 'implementation';
}

function normalizeState(task = {}) {
  return task.state || task.currentState || task.status || '';
}

function normalizeRiskLevel(task = {}) {
  const value = typeof task.riskLevel === 'string' ? task.riskLevel.trim().toLowerCase() : '';
  return value || '';
}

function normalizeDataClassification(task = {}) {
  const value = typeof task.dataClassification === 'string'
    ? task.dataClassification.trim().toLowerCase()
    : typeof task.dataClass === 'string'
      ? task.dataClass.trim().toLowerCase()
      : '';
  return value || 'unknown';
}

function hasTerm(task = {}, pattern) {
  return pattern.test(taskText(task));
}

function hasFailureBlock(task = {}, name) {
  const failureFields = [
    task.failureType,
    task.failureReason,
    task.blockReason,
    task.reason,
    task.statusReason,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return failureFields.includes(name);
}

function isNeverBatchTask(task = {}) {
  const type = inferTaskType(task).toLowerCase();
  return NEVER_BATCH_TYPES.some((entry) => type.includes(entry));
}

function isCodeImplementationTask(agentId, task = {}) {
  const type = inferTaskType(task, agentId).toLowerCase();
  if (['core', 'swift', 'pixel', 'forge', 'stream', 'synapse'].includes(agentId)) {
    return !type.includes('report') && !type.includes('summary');
  }
  return /code_edit|backend|ios|web|deploy|data_pipeline|ai_integration|content_artifact/.test(type);
}

function needsPrivacyReview(task = {}) {
  return hasTerm(task, /privacy|permission|personal data|user data|sensitive|app store|health/i);
}

function isSensitiveClassification(task = {}) {
  return ['confidential', 'restricted', 'secret'].includes(normalizeDataClassification(task));
}

function needsAppStoreReview(task = {}) {
  return hasTerm(task, /app store|appstore|metadata/i);
}

function needsQA(task = {}) {
  return hasTerm(task, /test|qa|validate|verification|simulator|xcode|bug|feedback|instrumentation/i);
}

function needsSecurityReview(task = {}) {
  return hasTerm(task, /security|vulnerability|scan|provider|secret|permission|deploy/i);
}

function isRiskyPlatformAction(task = {}) {
  return hasTerm(task, /deploy|production|secret|env|ci\/cd|cicd|infra|migration|provider|mcp/i)
    || Boolean(task.approvalRequired);
}

function isNonBlocking(task = {}) {
  return task.blocking === false;
}

export function deriveAgentProfile(agentId) {
  const id = normalizeAgentId(agentId);
  const profile = AGENT_PROFILES[id];
  if (!profile) {
    return {
      agentId: id,
      agentGroup: 'unknown',
      agentPlane: 'unknown',
      agentClass: 'unknown',
      warnings: [],
      errors: ['unknown_agent'],
    };
  }
  return {
    agentId: id,
    ...profile,
    warnings: [],
    errors: [],
  };
}

export function normalizeTaskContract(task) {
  const warnings = [];
  const errors = [];

  if (!task || typeof task !== 'object' || Array.isArray(task)) {
    errors.push('missing_task');
    return {
      taskContract: {},
      normalizedTask: {},
      warnings,
      errors,
    };
  }

  const legacy = isLegacyTask(task);
  const taskType = inferTaskType(task, normalizeAgentId(task.targetAgent || task.agent));
  const normalized = {
    id: task.id || '',
    projectId: task.projectId || task.project || '',
    sourceAgent: task.sourceAgent || (legacy ? 'legacy' : ''),
    targetAgent: task.targetAgent || task.agent || '',
    taskType,
    objective: task.objective || task.description || '',
    description: task.description || task.objective || '',
    allowedFiles: ensureArray(task.allowedFiles),
    forbiddenFiles: ensureArray(task.forbiddenFiles),
    acceptanceCriteria: ensureArray(task.acceptanceCriteria),
    requiredSkills: ensureArray(task.requiredSkills),
    riskLevel: normalizeRiskLevel(task),
    blocking: typeof task.blocking === 'boolean' ? task.blocking : true,
    dependsOn: ensureArray(task.dependsOn),
    state: normalizeState(task),
    priority: task.priority || '',
    dataClassification: normalizeDataClassification(task),
    approvalRequired: Boolean(task.approvalRequired),
    providerPolicy: task.providerPolicy || task.providerModelPolicy || '',
    environment: task.environment || task.environmentTarget || '',
    runtimeExpectation: task.runtimeExpectation || task.runtime || '',
    redacted: task.redacted === true,
    legacy,
  };

  if (legacy) warnings.push('legacy_task_format');
  if (!('allowedFiles' in task)) warnings.push('missing_allowed_files');
  if (!('acceptanceCriteria' in task)) warnings.push('missing_acceptance_criteria');
  if (!('requiredSkills' in task)) warnings.push('missing_required_skills');
  if (!normalized.projectId) warnings.push('missing_project_id');

  return {
    taskContract: { ...normalized },
    normalizedTask: { ...normalized },
    warnings: unique(warnings),
    errors: unique(errors),
  };
}

function deriveBatchAssessment(agentId, task = {}) {
  const type = inferTaskType(task, agentId).toLowerCase();
  const classification = normalizeDataClassification(task);
  const blocking = !isNonBlocking(task);
  const riskyPlatform = isRiskyPlatformAction(task);
  const neverBatch = isNeverBatchTask(task);

  if (neverBatch) {
    return {
      eligible: false,
      neverBatch: true,
      requiresReconcile: false,
      allowedUse: [],
      reason: `Task type ${type} is never batch-eligible.`,
    };
  }

  if (blocking) {
    return {
      eligible: false,
      neverBatch: false,
      requiresReconcile: false,
      allowedUse: [],
      reason: 'Blocking tasks stay realtime until runtime integration explicitly opts in.',
    };
  }

  if (agentId === 'stream' && !['public', 'internal'].includes(classification)) {
    return {
      eligible: false,
      neverBatch: false,
      requiresReconcile: false,
      allowedUse: [],
      reason: 'STREAM batch summaries are limited to public or internal data.',
    };
  }

  if (agentId === 'canvas' && hasTerm(task, /privacy|compliance|policy|app store/i)) {
    return {
      eligible: false,
      neverBatch: false,
      requiresReconcile: false,
      allowedUse: [],
      reason: 'CANVAS cannot batch privacy or compliance final-approval work.',
    };
  }

  if (agentId === 'forge' || riskyPlatform) {
    return {
      eligible: false,
      neverBatch: false,
      requiresReconcile: false,
      allowedUse: [],
      reason: 'Risky platform operations remain realtime and approval-gated.',
    };
  }

  const allowedUseMap = {
    atlas: ['non_blocking_prd_draft'],
    prism: ['non_blocking_design_variants'],
    radar: ['market_summary'],
    meridian: ['pricing_variants'],
    relay: ['feedback_clustering'],
    beacon: ['marketing_copy_variants'],
    compass: ['aso_keywords'],
    oracle: ['analytics_summary'],
    canvas: ['marketing_copy_variants'],
    sentinel: ['analytics_summary'],
  };

  const allowedUse = allowedUseMap[agentId] || [];
  if (allowedUse.length === 0) {
    return {
      eligible: false,
      neverBatch: false,
      requiresReconcile: false,
      allowedUse: [],
      reason: `${agentId} has no non-blocking batch use configured in the adapter.`,
    };
  }

  return {
    eligible: true,
    neverBatch: false,
    requiresReconcile: true,
    allowedUse,
    reason: `Non-blocking ${agentId} artifact can be deferred for batch-style reconciliation later.`,
  };
}

export function deriveBatchPolicy(agentId, task = {}) {
  const assessment = deriveBatchAssessment(normalizeAgentId(agentId), task);
  return {
    eligible: assessment.eligible,
    reason: assessment.reason,
    neverBatch: assessment.neverBatch,
    requiresReconcile: assessment.requiresReconcile,
    allowedUse: assessment.allowedUse,
  };
}

export function deriveModelPolicy(agentId, task = {}) {
  const id = normalizeAgentId(agentId);
  const type = inferTaskType(task, id).toLowerCase();
  const batchPolicy = deriveBatchAssessment(id, task);
  const failureBlocked = ['safety', 'budget', 'permission', 'secret', 'verification'].some((name) => hasFailureBlock(task, name));

  let policy = {
    mode: 'realtime',
    batchEligible: false,
    openRouterAllowed: false,
    fallbackAllowed: !failureBlocked,
    reason: 'Default conservative realtime policy.',
    requiresDirectProvider: false,
  };

  if (id === 'nexus' && /release|security|deploy/.test(type)) {
    policy = {
      mode: 'realtime',
      batchEligible: false,
      openRouterAllowed: false,
      fallbackAllowed: !failureBlocked,
      reason: 'NEXUS release, security, and deploy decisions stay realtime and direct-provider only.',
      requiresDirectProvider: true,
    };
  } else if (id === 'shepherd') {
    policy = {
      mode: 'realtime',
      batchEligible: false,
      openRouterAllowed: false,
      fallbackAllowed: !failureBlocked,
      reason: 'SHEPHERD orchestration remains realtime.',
      requiresDirectProvider: false,
    };
  } else if (['auditor', 'sentinel', 'warden'].includes(id)) {
    policy = {
      mode: task.blocking === false ? 'realtime' : 'deterministic',
      batchEligible: false,
      openRouterAllowed: false,
      fallbackAllowed: !failureBlocked,
      reason: 'Verification gates prefer deterministic skill execution and stay synchronous when blocking.',
      requiresDirectProvider: false,
    };
  } else if (['core', 'swift', 'pixel', 'forge', 'synapse'].includes(id) && isCodeImplementationTask(id, task)) {
    policy = {
      mode: 'realtime',
      batchEligible: false,
      openRouterAllowed: false,
      fallbackAllowed: !failureBlocked,
      reason: 'Implementation and platform edits remain realtime.',
      requiresDirectProvider: false,
    };
  } else if (batchPolicy.eligible) {
    const openRouterAllowed = ['radar', 'meridian', 'relay', 'beacon', 'compass', 'oracle', 'canvas'].includes(id)
      && ['public', 'internal', 'unknown'].includes(normalizeDataClassification(task));
    policy = {
      mode: 'hybrid',
      batchEligible: true,
      openRouterAllowed,
      fallbackAllowed: !failureBlocked,
      reason: 'This task is advisory and non-blocking, so batch or low-cost routing is allowed later.',
      requiresDirectProvider: false,
    };
  } else if (id === 'stream') {
    policy = {
      mode: 'realtime',
      batchEligible: false,
      openRouterAllowed: false,
      fallbackAllowed: !failureBlocked,
      reason: 'STREAM data work stays realtime unless a public or internal summary is explicitly non-blocking.',
      requiresDirectProvider: false,
    };
  } else if (id === 'canvas') {
    policy = {
      mode: 'realtime',
      batchEligible: false,
      openRouterAllowed: false,
      fallbackAllowed: !failureBlocked,
      reason: 'CANVAS content stays realtime unless only non-blocking variants are requested.',
      requiresDirectProvider: false,
    };
  }

  if (failureBlocked) {
    policy.fallbackAllowed = false;
    policy.reason = `${policy.reason} Fallback disabled because the task indicates a guarded failure condition.`;
  }

  return policy;
}

export function deriveEvidenceRequirements(agentId, task = {}) {
  const id = normalizeAgentId(agentId);
  const evidence = [];
  const push = (...items) => evidence.push(...items.filter(Boolean));

  if (id === 'nexus') {
    push('release_contract');
    if (hasTerm(task, /release|deploy|security/i)) {
      push('auditor_evidence', 'sentinel_evidence', 'warden_evidence');
    }
  }

  if (id === 'shepherd') push('task_contracts', 'handoff_contracts', 'dependsOn_graph');
  if (id === 'auditor') push('lint_result', 'static_analysis_result', 'diff_review_result');
  if (id === 'auditor' && isCodeImplementationTask(id, task)) push('test_coverage_result');
  if (id === 'sentinel') push('test_result', 'log_artifact');
  if (id === 'sentinel' && hasTerm(task, /simulator|xcode|ios/i)) push('simulator_result');
  if (id === 'sentinel' && needsSecurityReview(task)) push('security_scan_result');
  if (id === 'warden') push('privacy_check_result');
  if (id === 'warden' && hasTerm(task, /permission|secret|auth/i)) push('permissions_validation_result');
  if (id === 'warden' && needsAppStoreReview(task)) push('appstore_policy_result');

  if (id === 'core') push('changed_files_summary', 'verification_requests');
  if (id === 'swift') push('changed_files_summary', 'runtime_needs', 'verification_requests');
  if (id === 'pixel') push('changed_files_summary', 'ui_state_notes', 'verification_requests');
  if (id === 'canvas') {
    push('content_artifact_summary');
    if (needsPrivacyReview(task)) push('warden_review_request');
  }

  if (id === 'forge') {
    push('verification_requests');
    if (isRiskyPlatformAction(task)) push('approval_result', 'rollback_plan');
  }
  if (id === 'stream') push('data_classification_note', 'verification_requests');
  if (id === 'synapse') push('provider_policy_note', 'data_classification_note', 'verification_requests');

  if (id === 'radar') push('source_summary', 'data_classification_note');
  if (id === 'meridian') push('assumptions', 'source_summary');
  if (id === 'relay') push('redaction_note', 'feedback_summary');
  if (id === 'beacon') push('claim_checklist', 'required_review');
  if (id === 'compass') push('source_notes', 'required_review');
  if (id === 'oracle') push('data_classification_note', 'privacy_review_request');

  return unique(evidence);
}

export function deriveAllowedTools(agentId, task = {}) {
  const id = normalizeAgentId(agentId);
  const profile = deriveAgentProfile(id);
  const tools = ['contract.validate', 'state.request_transition', 'evidence.write'];

  if (profile.agentGroup !== 'unknown') tools.push('repo.read');
  if (['control', 'strategy', 'growth', 'observability'].includes(profile.agentGroup)) tools.push('memory.read');
  if (['control', 'observability'].includes(profile.agentGroup)) tools.push('memory.write');
  if (!['verification', 'unknown'].includes(profile.agentGroup)) tools.push('skill.run');
  if (['product', 'platform'].includes(profile.agentGroup)) tools.push('repo.write');
  if (id === 'shepherd') tools.push('queue.enqueue');
  if (isRiskyPlatformAction(task) || task.approvalRequired) tools.push('approval.request');

  return unique(tools);
}

export function deriveRequiredSkills(agentId, task = {}) {
  const id = normalizeAgentId(agentId);
  const taskType = inferTaskType(task, id).toLowerCase();
  const required = [...ensureArray(task.requiredSkills), ...(STATIC_SKILLS[id] || [])];

  if (/(backend|code_edit|web|ios|data_pipeline|ai_integration|content_artifact|deploy)/.test(taskType) || ensureArray(task.allowedFiles).length > 0) {
    required.push('auditor.code.diff_review');
  }
  if (needsQA(task)) {
    required.push('sentinel.qa.tests.execute');
  }
  if (taskType.includes('ios') || hasTerm(task, /simulator|xcode/i)) {
    required.push('sentinel.qa.simulator.run');
  }
  if (needsSecurityReview(task)) {
    required.push('sentinel.qa.security.scan');
  }
  if (needsPrivacyReview(task) || isSensitiveClassification(task)) {
    required.push('warden.compliance.privacy.check');
  }
  if (hasTerm(task, /permission|secret|auth/i)) {
    required.push('warden.compliance.permissions.validate');
  }
  if (needsAppStoreReview(task)) {
    required.push('warden.compliance.appstore.check');
  }

  return unique(required);
}

export function deriveHandoffRules(agentId, task = {}) {
  const id = normalizeAgentId(agentId);
  const rules = [...(HANDOFF_RULES[id] || [])];

  if (needsPrivacyReview(task) && !rules.some((rule) => rule.targetAgent === 'warden')) {
    rules.push({ targetAgent: 'warden', reason: 'Privacy or permissions review required' });
  }
  if (needsQA(task) && !rules.some((rule) => rule.targetAgent === 'sentinel')) {
    rules.push({ targetAgent: 'sentinel', reason: 'QA or validation support required' });
  }
  if (isCodeImplementationTask(id, task) && !rules.some((rule) => rule.targetAgent === 'auditor')) {
    rules.push({ targetAgent: 'auditor', reason: 'Diff verification support required' });
  }

  return rules;
}

export function buildAgentContext(input = {}) {
  const rawAgentId = input.agentId || input?.task?.targetAgent || input?.task?.agent || '';
  const agentId = normalizeAgentId(rawAgentId);
  const profile = deriveAgentProfile(agentId);
  const normalized = normalizeTaskContract(input.task);
  const taskContract = { ...normalized.taskContract, targetAgent: normalized.taskContract.targetAgent || agentId };
  const normalizedTask = { ...normalized.normalizedTask, targetAgent: normalized.normalizedTask.targetAgent || agentId };
  const modelPolicy = deriveModelPolicy(agentId, normalizedTask);
  const batchPolicy = deriveBatchPolicy(agentId, normalizedTask);
  const context = {
    agentId,
    agentGroup: profile.agentGroup,
    agentPlane: profile.agentPlane,
    agentClass: profile.agentClass,
    taskContract,
    normalizedTask,
    modelPolicy,
    batchPolicy,
    allowedTools: deriveAllowedTools(agentId, normalizedTask),
    requiredSkills: deriveRequiredSkills(agentId, normalizedTask),
    currentState: normalizedTask.state || '',
    evidenceRequired: deriveEvidenceRequirements(agentId, normalizedTask),
    handoffRules: deriveHandoffRules(agentId, normalizedTask),
    riskLevel: normalizedTask.riskLevel || '',
    blocking: Boolean(normalizedTask.blocking),
    dependsOn: ensureArray(normalizedTask.dependsOn),
    warnings: unique([...profile.warnings, ...normalized.warnings]),
    errors: unique([...profile.errors, ...normalized.errors]),
    contextVersion: '1.0',
  };

  const validation = validateAgentContext(context);
  context.warnings = unique([...context.warnings, ...validation.warnings]);
  context.errors = unique([...context.errors, ...validation.errors]);
  return context;
}

export function validateAgentContext(context = {}) {
  const errors = [];
  const warnings = [];
  const pushWarning = (value) => {
    if (value && !warnings.includes(value)) warnings.push(value);
  };
  const pushError = (value) => {
    if (value && !errors.includes(value)) errors.push(value);
  };

  if (!context || typeof context !== 'object') {
    return { valid: false, errors: ['missing_context'], warnings: [] };
  }

  if (!context.agentId) pushError('missing_agent_id');
  if (context.agentGroup === 'unknown' || context.agentPlane === 'unknown' || context.agentClass === 'unknown') {
    pushError('unknown_agent');
  }
  if (!context.normalizedTask || typeof context.normalizedTask !== 'object' || Array.isArray(context.normalizedTask)) {
    pushError('missing_normalized_task');
  }
  if (!context.taskContract || typeof context.taskContract !== 'object' || Array.isArray(context.taskContract)) {
    pushError('missing_task_contract');
  }
  if (!context.modelPolicy || typeof context.modelPolicy !== 'object') pushError('missing_model_policy');
  if (!context.batchPolicy || typeof context.batchPolicy !== 'object') pushError('missing_batch_policy');
  if (!Array.isArray(context.evidenceRequired)) pushError('invalid_evidence_required');
  if (!Array.isArray(context.requiredSkills)) pushError('invalid_required_skills');
  if (!Array.isArray(context.allowedTools)) pushError('invalid_allowed_tools');

  if (!context.currentState) pushWarning('missing_current_state');
  if (!context.riskLevel) pushWarning('missing_risk_level');

  const task = context.normalizedTask || {};
  if (isCodeImplementationTask(context.agentId, task) && !Array.isArray(task.allowedFiles)) {
    pushWarning('missing_allowed_files');
  }
  if (isCodeImplementationTask(context.agentId, task) && Array.isArray(task.allowedFiles) && task.allowedFiles.length === 0) {
    pushWarning('missing_allowed_files');
  }
  if (!Array.isArray(task.acceptanceCriteria)) {
    pushWarning('missing_acceptance_criteria');
  }
  if (!Array.isArray(task.requiredSkills)) {
    pushWarning('missing_required_skills');
  }

  if (context.errors) {
    for (const error of context.errors) pushError(error);
  }
  if (context.warnings) {
    for (const warning of context.warnings) pushWarning(warning);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
