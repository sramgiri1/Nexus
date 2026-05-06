import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  buildAgentContext,
  validateAgentContext,
} from '../orchestrator/agentContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const reportPath = path.join(repoRoot, 'reports', 'agent-context-report.md');

function safeGit(cmd) {
  try {
    return execSync(cmd, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

const sampleCases = [
  {
    name: 'NEXUS release decision task',
    input: {
      agentId: 'nexus',
      task: {
        projectId: 'careloop',
        sourceAgent: 'shepherd',
        targetAgent: 'nexus',
        taskType: 'release_decision',
        objective: 'Decide release GO based on release contract evidence.',
        allowedFiles: [],
        forbiddenFiles: [],
        acceptanceCriteria: ['Validate release evidence bundle'],
        requiredSkills: [],
        riskLevel: 'high',
        blocking: true,
        dependsOn: ['release-gates'],
        state: 'ready_for_review',
      },
    },
    expect: {
      group: 'control',
      plane: 'control',
      batchEligible: false,
      evidence: ['release_contract', 'auditor_evidence', 'sentinel_evidence', 'warden_evidence'],
      skills: ['nexus.read.system_state', 'nexus.decide.release'],
    },
  },
  {
    name: 'SHEPHERD planning task',
    input: {
      agentId: 'shepherd',
      task: {
        projectId: 'nexus',
        sourceAgent: 'nexus',
        targetAgent: 'shepherd',
        taskType: 'orchestration_plan',
        objective: 'Create a task breakdown and handoff plan for dashboard hardening.',
        allowedFiles: [],
        forbiddenFiles: [],
        acceptanceCriteria: ['Task graph is complete'],
        requiredSkills: [],
        riskLevel: 'medium',
        blocking: true,
        dependsOn: [],
        state: 'running',
      },
    },
    expect: {
      group: 'control',
      plane: 'control',
      batchEligible: false,
      evidence: ['task_contracts', 'handoff_contracts', 'dependsOn_graph'],
      skills: ['orchestrator.flow.plan', 'orchestrator.flow.dispatch'],
    },
  },
  {
    name: 'CORE backend code task with allowedFiles',
    input: {
      agentId: 'core',
      task: {
        projectId: 'careloop',
        sourceAgent: 'shepherd',
        targetAgent: 'core',
        taskType: 'backend.code_edit',
        objective: 'Implement task API route.',
        allowedFiles: ['projects/careloop/src/routes/tasks.js'],
        forbiddenFiles: ['projects/careloop-ios'],
        acceptanceCriteria: ['POST /tasks persists and returns payload'],
        requiredSkills: [],
        riskLevel: 'medium',
        blocking: true,
        dependsOn: ['prd-task-api'],
        state: 'running',
      },
    },
    expect: {
      group: 'product',
      plane: 'execution',
      batchEligible: false,
      evidence: ['changed_files_summary', 'verification_requests'],
      skills: ['auditor.code.diff_review'],
    },
  },
  {
    name: 'SWIFT iOS task requiring macOS/Xcode',
    input: {
      agentId: 'swift',
      task: {
        projectId: 'careloop-ios',
        sourceAgent: 'shepherd',
        targetAgent: 'swift',
        taskType: 'ios.code_edit',
        objective: 'Implement the add-task screen and request simulator validation.',
        allowedFiles: ['projects/careloop-ios/CareLoop/Views/AddTaskView.swift'],
        forbiddenFiles: [],
        acceptanceCriteria: ['The screen renders and submits task payload'],
        requiredSkills: [],
        riskLevel: 'medium',
        blocking: true,
        dependsOn: ['design-add-task'],
        runtimeExpectation: 'macos-xcode',
        state: 'running',
      },
    },
    expect: {
      group: 'product',
      plane: 'execution',
      batchEligible: false,
      evidence: ['runtime_needs', 'verification_requests'],
      skills: ['sentinel.qa.simulator.run'],
    },
  },
  {
    name: 'SENTINEL verification gate task',
    input: {
      agentId: 'sentinel',
      task: {
        projectId: 'careloop-ios',
        sourceAgent: 'shepherd',
        targetAgent: 'sentinel',
        taskType: 'verification_gate',
        objective: 'Run simulator and test execution for the add-task flow.',
        allowedFiles: [],
        forbiddenFiles: [],
        acceptanceCriteria: ['Simulator evidence captured'],
        requiredSkills: [],
        riskLevel: 'high',
        blocking: true,
        dependsOn: ['swift-add-task'],
        state: 'awaiting_verification',
      },
    },
    expect: {
      group: 'verification',
      plane: 'verification',
      batchEligible: false,
      evidence: ['test_result', 'simulator_result', 'log_artifact'],
      skills: ['sentinel.qa.simulator.run', 'sentinel.qa.tests.execute'],
    },
  },
  {
    name: 'WARDEN privacy task',
    input: {
      agentId: 'warden',
      task: {
        projectId: 'careloop',
        sourceAgent: 'shepherd',
        targetAgent: 'warden',
        taskType: 'privacy_review',
        objective: 'Review personal data handling for recipient invite flow permissions.',
        allowedFiles: [],
        forbiddenFiles: [],
        acceptanceCriteria: ['Privacy review produced'],
        requiredSkills: [],
        riskLevel: 'high',
        blocking: true,
        dependsOn: ['core-invite-flow'],
        state: 'awaiting_verification',
      },
    },
    expect: {
      group: 'verification',
      plane: 'verification',
      batchEligible: false,
      evidence: ['privacy_check_result', 'permissions_validation_result'],
      skills: ['warden.compliance.privacy.check', 'warden.compliance.permissions.validate'],
    },
  },
  {
    name: 'FORGE deploy task requiring approval',
    input: {
      agentId: 'forge',
      task: {
        projectId: 'nexus',
        sourceAgent: 'shepherd',
        targetAgent: 'forge',
        taskType: 'deploy',
        objective: 'Prepare production deploy and CI/CD rollout.',
        allowedFiles: ['.github/workflows/deploy.yml'],
        forbiddenFiles: [],
        acceptanceCriteria: ['Deploy plan and rollback are documented'],
        requiredSkills: [],
        riskLevel: 'critical',
        blocking: true,
        dependsOn: ['release-gates'],
        approvalRequired: true,
        environment: 'production',
        state: 'running',
      },
    },
    expect: {
      group: 'platform',
      plane: 'execution',
      batchEligible: false,
      evidence: ['approval_result', 'rollback_plan', 'verification_requests'],
      skills: ['auditor.code.diff_review', 'sentinel.qa.security.scan'],
    },
  },
  {
    name: 'STREAM data pipeline with confidential data',
    input: {
      agentId: 'stream',
      task: {
        projectId: 'careloop',
        sourceAgent: 'shepherd',
        targetAgent: 'stream',
        taskType: 'data_pipeline',
        objective: 'Define ingestion and transformation for confidential operations data.',
        allowedFiles: ['reports/stream/careloop-data-flow.md'],
        forbiddenFiles: [],
        acceptanceCriteria: ['Pipeline design notes created'],
        requiredSkills: [],
        riskLevel: 'high',
        blocking: true,
        dependsOn: ['oracle-metrics'],
        dataClassification: 'confidential',
        approvalRequired: true,
        state: 'running',
      },
    },
    expect: {
      group: 'platform',
      plane: 'execution',
      batchEligible: false,
      evidence: ['data_classification_note', 'verification_requests'],
      skills: ['warden.compliance.privacy.check', 'auditor.code.diff_review'],
    },
  },
  {
    name: 'SYNAPSE AI integration with provider policy',
    input: {
      agentId: 'synapse',
      task: {
        projectId: 'nexus',
        sourceAgent: 'shepherd',
        targetAgent: 'synapse',
        taskType: 'ai_integration',
        objective: 'Wire provider integration while respecting provider policy boundaries.',
        allowedFiles: ['orchestrator/agentContext.js'],
        forbiddenFiles: ['config/model-map.json'],
        acceptanceCriteria: ['Integration notes completed'],
        requiredSkills: [],
        riskLevel: 'high',
        blocking: true,
        dependsOn: [],
        dataClassification: 'internal',
        providerPolicy: 'config/model-map only',
        approvalRequired: true,
        state: 'running',
      },
    },
    expect: {
      group: 'platform',
      plane: 'execution',
      batchEligible: false,
      evidence: ['provider_policy_note', 'data_classification_note', 'verification_requests'],
      skills: ['sentinel.qa.security.scan', 'auditor.code.diff_review'],
    },
  },
  {
    name: 'RELAY feedback clustering non-blocking and redacted',
    input: {
      agentId: 'relay',
      task: {
        projectId: 'careloop',
        sourceAgent: 'shepherd',
        targetAgent: 'relay',
        taskType: 'bug_clustering',
        objective: 'Cluster redacted feedback from testers for triage.',
        allowedFiles: ['reports/relay/feedback-clusters.md'],
        forbiddenFiles: [],
        acceptanceCriteria: ['Clusters summarized'],
        requiredSkills: [],
        riskLevel: 'low',
        blocking: false,
        dependsOn: [],
        dataClassification: 'internal',
        redacted: true,
        state: 'running',
      },
    },
    expect: {
      group: 'observability',
      plane: 'observability',
      batchEligible: true,
      evidence: ['redaction_note', 'feedback_summary'],
      skills: ['sentinel.qa.tests.execute'],
    },
  },
  {
    name: 'BEACON marketing copy variant, non-blocking batch eligible',
    input: {
      agentId: 'beacon',
      task: {
        projectId: 'careloop',
        sourceAgent: 'shepherd',
        targetAgent: 'beacon',
        taskType: 'marketing_copy',
        objective: 'Draft non-blocking marketing copy variants for an investor demo page.',
        allowedFiles: ['reports/beacon/demo-copy.md'],
        forbiddenFiles: [],
        acceptanceCriteria: ['Three variants drafted'],
        requiredSkills: [],
        riskLevel: 'low',
        blocking: false,
        dependsOn: [],
        dataClassification: 'public',
        state: 'running',
      },
    },
    expect: {
      group: 'growth',
      plane: 'execution',
      batchEligible: true,
      evidence: ['claim_checklist', 'required_review'],
      skills: [],
    },
  },
  {
    name: 'ORACLE analytics schema with privacy review',
    input: {
      agentId: 'oracle',
      task: {
        projectId: 'careloop',
        sourceAgent: 'shepherd',
        targetAgent: 'oracle',
        taskType: 'analytics_spec',
        objective: 'Define an analytics schema for user onboarding with privacy review.',
        allowedFiles: ['reports/oracle/onboarding-analytics.md'],
        forbiddenFiles: [],
        acceptanceCriteria: ['Event schema documented'],
        requiredSkills: [],
        riskLevel: 'medium',
        blocking: false,
        dependsOn: [],
        dataClassification: 'internal',
        state: 'running',
      },
    },
    expect: {
      group: 'growth',
      plane: 'execution',
      batchEligible: true,
      evidence: ['data_classification_note', 'privacy_review_request'],
      skills: ['warden.compliance.privacy.check'],
    },
  },
  {
    name: 'Legacy CORE task',
    input: {
      agentId: 'core',
      task: {
        id: 'task-123',
        agent: 'core',
        description: 'Implement task API',
        project: 'careloop',
        priority: 'high',
      },
    },
    expect: {
      group: 'product',
      plane: 'execution',
      batchEligible: false,
      evidence: ['changed_files_summary', 'verification_requests'],
      skills: ['auditor.code.diff_review'],
      warnings: ['legacy_task_format', 'missing_allowed_files', 'missing_acceptance_criteria', 'missing_required_skills'],
    },
  },
];

const failures = [];
const warningSummary = [];

function assertCondition(caseName, condition, message) {
  if (!condition) failures.push(`${caseName}: ${message}`);
}

function arrayContainsAll(values, expected) {
  return expected.every((value) => values.includes(value));
}

const results = sampleCases.map((testCase) => {
  const context = buildAgentContext(testCase.input);
  const validation = validateAgentContext(context);
  warningSummary.push(...validation.warnings.map((warning) => `${testCase.name}: ${warning}`));

  assertCondition(testCase.name, validation.valid, `validation failed (${validation.errors.join(', ')})`);
  assertCondition(testCase.name, context.agentGroup === testCase.expect.group, `expected group ${testCase.expect.group}, got ${context.agentGroup}`);
  assertCondition(testCase.name, context.agentPlane === testCase.expect.plane, `expected plane ${testCase.expect.plane}, got ${context.agentPlane}`);
  assertCondition(
    testCase.name,
    context.batchPolicy.eligible === testCase.expect.batchEligible,
    `expected batch eligibility ${testCase.expect.batchEligible}, got ${context.batchPolicy.eligible}`,
  );
  assertCondition(
    testCase.name,
    arrayContainsAll(context.evidenceRequired, testCase.expect.evidence),
    `missing expected evidence (${testCase.expect.evidence.filter((item) => !context.evidenceRequired.includes(item)).join(', ')})`,
  );
  if (testCase.expect.skills.length > 0) {
    assertCondition(
      testCase.name,
      arrayContainsAll(context.requiredSkills, testCase.expect.skills),
      `missing expected skills (${testCase.expect.skills.filter((item) => !context.requiredSkills.includes(item)).join(', ')})`,
    );
  }
  if (testCase.expect.warnings) {
    assertCondition(
      testCase.name,
      arrayContainsAll(validation.warnings, testCase.expect.warnings),
      `missing expected warnings (${testCase.expect.warnings.filter((item) => !validation.warnings.includes(item)).join(', ')})`,
    );
  }

  return {
    name: testCase.name,
    valid: validation.valid,
    warnings: validation.warnings,
    agentGroup: context.agentGroup,
    agentPlane: context.agentPlane,
    batchEligible: context.batchPolicy.eligible,
  };
});

const sharedPass = failures.every((entry) => !entry.includes('group') && !entry.includes('plane'));
const overallPass = failures.length === 0;
const branch = safeGit('git branch --show-current');
const commit = safeGit('git rev-parse --short HEAD');
const timestamp = new Date().toISOString();

const report = [
  '# Agent Task Context Report',
  '',
  '## Metadata',
  '',
  `- Generated at: ${timestamp}`,
  `- Validation branch: ${branch}`,
  `- Validation HEAD: ${commit}`,
  '- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.',
  '',
  '## Sample Cases Run',
  '',
  ...results.map((result) => `- ${result.name}: ${result.valid ? 'PASS' : 'FAIL'} | ${result.agentGroup}/${result.agentPlane} | batchEligible=${result.batchEligible}`),
  '',
  '## Pass/Fail Summary',
  '',
  `- Result: ${overallPass ? 'PASS' : 'FAIL'}`,
  `- Cases run: ${results.length}`,
  `- Cases passed: ${results.filter((result) => result.valid).length}`,
  `- Cases failed: ${results.filter((result) => !result.valid).length}`,
  '',
  '## Warnings Summary',
  '',
  ...(warningSummary.length > 0 ? warningSummary.map((warning) => `- ${warning}`) : ['- None']),
  '',
  '## Failures',
  '',
  ...(failures.length > 0 ? failures.map((failure) => `- ${failure}`) : ['- None']),
  '',
  '## Next Recommended Phase',
  '',
  '- Phase 4E: integrate the adapter into runtime dispatch and add contract/state-machine enforcement on top of the normalized context object.',
  '',
].join('\n');

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report);

console.log('NEXUS Agent Task Context Check');
console.log('================================');
console.log('');
console.log(`Sample cases: ${results.length}`);
console.log(`Validation: ${overallPass ? 'PASS' : 'FAIL'}`);
console.log(`Warnings: ${warningSummary.length}`);
console.log('');
console.log('Failures:');
if (failures.length === 0) {
  console.log('- None');
} else {
  for (const failure of failures) console.log(`- ${failure}`);
}
console.log('');
console.log(`Result: ${overallPass ? 'PASS' : 'FAIL'}`);

process.exit(overallPass ? 0 : 1);
