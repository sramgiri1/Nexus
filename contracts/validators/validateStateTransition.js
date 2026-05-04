import { validateSchema } from './validateSchema.js';

const schema = {
  type: 'object',
  required: [
    'entityType',
    'entityId',
    'from',
    'to',
    'requestedBy',
    'evidence',
    'reason',
    'createdAt',
  ],
  additionalProperties: false,
  properties: {
    entityType:  { type: 'string', enum: ['task', 'gate', 'release'] },
    entityId:    { type: 'string', minLength: 1 },
    from:        { type: 'string', minLength: 1 },
    to:          { type: 'string', minLength: 1 },
    requestedBy: { type: 'string', minLength: 1 },
    evidence:    { type: 'array', minItems: 0, items: { type: 'string' } },
    reason:      { type: 'string', minLength: 1 },
    createdAt:   { type: 'string', minLength: 1 },
  },
};

export function validateStateTransition(data) {
  return validateSchema(data, schema);
}
