/**
 * Minimal JSON Schema validator (subset of draft-07).
 * No external dependencies. Never throws. Never mutates input.
 *
 * Supported keywords: type, required, properties, additionalProperties,
 * enum, minLength, minItems, items, minimum, maximum.
 */

function jsonType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function validateSchema(data, schema, path = '') {
  if (!schema || typeof schema !== 'object') return { valid: true, issues: [] };

  const issues = [];
  const label = path || '(root)';

  if (data === undefined) {
    issues.push({
      path: label,
      message: 'value is undefined',
      expected: schema.type ?? 'any',
      actual: 'undefined',
    });
    return { valid: false, issues };
  }

  // type
  if (schema.type !== undefined) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = jsonType(data);
    if (!allowed.includes(actual)) {
      issues.push({
        path: label,
        message: `wrong type`,
        expected: allowed.join(' | '),
        actual,
      });
      return { valid: false, issues };
    }
  }

  const actual = jsonType(data);

  // enum
  if (schema.enum !== undefined) {
    if (!schema.enum.includes(data)) {
      issues.push({
        path: label,
        message: 'value not in enum',
        expected: schema.enum.join(' | '),
        actual: String(data),
      });
    }
  }

  // string
  if (actual === 'string') {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      issues.push({
        path: label,
        message: `string too short (minLength ${schema.minLength})`,
        expected: `length >= ${schema.minLength}`,
        actual: String(data.length),
      });
    }
  }

  // number
  if (actual === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      issues.push({
        path: label,
        message: `value below minimum`,
        expected: `>= ${schema.minimum}`,
        actual: String(data),
      });
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      issues.push({
        path: label,
        message: `value above maximum`,
        expected: `<= ${schema.maximum}`,
        actual: String(data),
      });
    }
  }

  // array
  if (actual === 'array') {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      issues.push({
        path: label,
        message: `array too short (minItems ${schema.minItems})`,
        expected: `length >= ${schema.minItems}`,
        actual: String(data.length),
      });
    }
    if (schema.items !== undefined) {
      data.forEach((item, i) => {
        const sub = validateSchema(item, schema.items, `${label}[${i}]`);
        if (!sub.valid) issues.push(...sub.issues);
      });
    }
  }

  // object
  if (actual === 'object') {
    if (schema.required !== undefined) {
      schema.required.forEach(field => {
        if (!(field in data) || data[field] === undefined) {
          issues.push({
            path: `${label}.${field}`,
            message: 'required field missing',
            expected: 'present',
            actual: 'missing',
          });
        }
      });
    }

    if (schema.properties !== undefined) {
      Object.entries(schema.properties).forEach(([key, propSchema]) => {
        if (key in data && data[key] !== undefined) {
          const sub = validateSchema(data[key], propSchema, `${label}.${key}`);
          if (!sub.valid) issues.push(...sub.issues);
        }
      });
    }

    if (schema.additionalProperties === false && schema.properties !== undefined) {
      const knownKeys = new Set(Object.keys(schema.properties));
      Object.keys(data).forEach(key => {
        if (!knownKeys.has(key)) {
          issues.push({
            path: `${label}.${key}`,
            message: 'additional property not allowed',
            expected: 'none',
            actual: key,
          });
        }
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
