import { validateSchema } from './validateSchema.js';

const schema = {
  type: 'object',
  required: [
    'contractType',
    'sourceAgent',
    'targetAgent',
    'projectId',
    'objective',
    'evidence',
    'allowedFiles',
    'forbiddenFiles',
    'requiredSkills',
    'doneCriteria',
    'riskLevel',
    'blocking',
    'parentTaskId',
  ],
  additionalProperties: false,
  properties: {
    contractType: {
      type: 'string',
      enum: ['implementation', 'verification', 'design', 'compliance', 'report', 'remediation', 'release'],
    },
    sourceAgent:    { type: 'string', minLength: 1 },
    targetAgent:    { type: 'string', minLength: 1 },
    projectId:      { type: 'string', minLength: 1 },
    objective:      { type: 'string', minLength: 1 },
    evidence:       { type: 'array', minItems: 0, items: { type: 'string' } },
    allowedFiles:   { type: 'array', minItems: 0, items: { type: 'string' } },
    forbiddenFiles: { type: 'array', minItems: 0, items: { type: 'string' } },
    requiredSkills: { type: 'array', minItems: 0, items: { type: 'string' } },
    doneCriteria:   { type: 'array', minItems: 1, items: { type: 'string' } },
    riskLevel:      { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    blocking:       { type: 'boolean' },
    parentTaskId:   { type: ['string', 'null'] },
  },
};

export function validateHandoffContract(data) {
  return validateSchema(data, schema);
}
