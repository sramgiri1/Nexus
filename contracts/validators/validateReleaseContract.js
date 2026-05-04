import { validateSchema } from './validateSchema.js';

const schema = {
  type: 'object',
  required: [
    'projectId',
    'auditorResult',
    'sentinelResult',
    'wardenResult',
    'openCriticalSafetyEvents',
    'unreconciledBlockingBatchTasks',
    'failedBlockingGates',
    'releaseDecision',
    'evidence',
  ],
  additionalProperties: false,
  properties: {
    projectId:                      { type: 'string', minLength: 1 },
    auditorResult:                  { type: 'string', enum: ['PASS', 'FAIL', 'INFO', 'NOT_REQUIRED'] },
    sentinelResult:                 { type: 'string', enum: ['PASS', 'FAIL', 'INFO', 'NOT_REQUIRED'] },
    wardenResult:                   { type: 'string', enum: ['PASS', 'FAIL', 'INFO', 'NOT_REQUIRED'] },
    openCriticalSafetyEvents:       { type: 'number', minimum: 0 },
    unreconciledBlockingBatchTasks: { type: 'number', minimum: 0 },
    failedBlockingGates:            { type: 'number', minimum: 0 },
    releaseDecision:                { type: 'string', enum: ['GO', 'NO_GO', 'BLOCKED'] },
    evidence:                       { type: 'array', minItems: 0, items: { type: 'string' } },
    notes:                          { type: 'string' },
    decidedAt:                      { type: 'string' },
  },
};

const GO_SAFE_RESULTS = new Set(['PASS', 'NOT_REQUIRED']);

export function validateReleaseContract(data) {
  const result = validateSchema(data, schema);

  if (result.valid && data.releaseDecision === 'GO') {
    const semantic = [];

    if (data.auditorResult !== 'PASS') {
      semantic.push({
        path: '(root).auditorResult',
        message: 'GO decision requires auditorResult PASS',
        expected: 'PASS',
        actual: data.auditorResult,
      });
    }
    if (data.sentinelResult !== 'PASS') {
      semantic.push({
        path: '(root).sentinelResult',
        message: 'GO decision requires sentinelResult PASS',
        expected: 'PASS',
        actual: data.sentinelResult,
      });
    }
    if (!GO_SAFE_RESULTS.has(data.wardenResult)) {
      semantic.push({
        path: '(root).wardenResult',
        message: 'GO decision requires wardenResult PASS or NOT_REQUIRED',
        expected: 'PASS | NOT_REQUIRED',
        actual: data.wardenResult,
      });
    }
    if (data.openCriticalSafetyEvents !== 0) {
      semantic.push({
        path: '(root).openCriticalSafetyEvents',
        message: 'GO decision requires zero open critical safety events',
        expected: '0',
        actual: String(data.openCriticalSafetyEvents),
      });
    }
    if (data.unreconciledBlockingBatchTasks !== 0) {
      semantic.push({
        path: '(root).unreconciledBlockingBatchTasks',
        message: 'GO decision requires zero unreconciled blocking batch tasks',
        expected: '0',
        actual: String(data.unreconciledBlockingBatchTasks),
      });
    }
    if (data.failedBlockingGates !== 0) {
      semantic.push({
        path: '(root).failedBlockingGates',
        message: 'GO decision requires zero failed blocking gates',
        expected: '0',
        actual: String(data.failedBlockingGates),
      });
    }
    if (data.evidence.length === 0) {
      semantic.push({
        path: '(root).evidence',
        message: 'GO decision requires at least one evidence artifact',
        expected: 'length >= 1',
        actual: '0',
      });
    }

    if (semantic.length > 0) {
      return { valid: false, issues: semantic };
    }
  }

  return result;
}
