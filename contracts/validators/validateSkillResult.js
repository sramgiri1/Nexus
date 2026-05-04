import { validateSchema } from './validateSchema.js';

const issueSchema = {
  type: 'object',
  required: ['severity', 'message'],
  additionalProperties: false,
  properties: {
    severity: { type: 'string', enum: ['error', 'warning', 'info'] },
    file:     { type: 'string' },
    line:     { type: 'number' },
    message:  { type: 'string', minLength: 1 },
  },
};

const schema = {
  type: 'object',
  required: ['result', 'issues', 'summary'],
  additionalProperties: false,
  properties: {
    result:     { type: 'string', enum: ['PASS', 'FAIL', 'INFO'] },
    issues:     { type: 'array', minItems: 0, items: issueSchema },
    summary:    { type: 'string', minLength: 1 },
    evidence:   { type: 'array', minItems: 0, items: { type: 'string' } },
    reportPath: { type: 'string' },
    command:    { type: 'string' },
    startedAt:  { type: 'string' },
    finishedAt: { type: 'string' },
    durationMs: { type: 'number', minimum: 0 },
  },
};

export function validateSkillResult(data) {
  return validateSchema(data, schema);
}
