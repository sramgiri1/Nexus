import { validateSchema } from './validateSchema.js';

const schema = {
  type: 'object',
  required: [
    'gate',
    'projectId',
    'skillsRequired',
    'evidenceRequired',
    'passCriteria',
    'failCriteria',
    'blocking',
  ],
  additionalProperties: false,
  properties: {
    gate:             { type: 'string', enum: ['AUDITOR', 'SENTINEL', 'WARDEN'] },
    projectId:        { type: 'string', minLength: 1 },
    skillsRequired:   { type: 'array', minItems: 1, items: { type: 'string' } },
    evidenceRequired: { type: 'array', minItems: 1, items: { type: 'string' } },
    passCriteria:     { type: 'array', minItems: 1, items: { type: 'string' } },
    failCriteria:     { type: 'array', minItems: 1, items: { type: 'string' } },
    blocking:         { type: 'boolean' },
  },
};

export function validateVerificationContract(data) {
  return validateSchema(data, schema);
}
