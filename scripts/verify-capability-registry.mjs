#!/usr/bin/env node
import fs from 'fs';

const schema = JSON.parse(fs.readFileSync('docs/reference/capability-surface.registry.schema.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('docs/reference/capability-surface.registry.json', 'utf8'));

function fail(message) {
  console.error(`Capability registry schema validation failed: ${message}`);
  process.exit(1);
}

function validate(value, rule, path = '$') {
  if (rule.type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(`${path} must be an object`);
    for (const req of rule.required || []) {
      if (!(req in value)) fail(`${path}.${req} is required`);
    }
    if (rule.additionalProperties === false && rule.properties) {
      for (const key of Object.keys(value)) {
        if (!(key in rule.properties)) fail(`${path}.${key} is not allowed`);
      }
    }
    for (const [key, childRule] of Object.entries(rule.properties || {})) {
      if (key in value) validate(value[key], childRule, `${path}.${key}`);
    }
    return;
  }

  if (rule.type === 'array') {
    if (!Array.isArray(value)) fail(`${path} must be an array`);
    if (typeof rule.minItems === 'number' && value.length < rule.minItems) {
      fail(`${path} must have at least ${rule.minItems} items`);
    }
    if (rule.items) value.forEach((item, idx) => validate(item, rule.items, `${path}[${idx}]`));
    return;
  }

  if (rule.type === 'string') {
    if (typeof value !== 'string') fail(`${path} must be a string`);
    if (typeof rule.minLength === 'number' && value.length < rule.minLength) {
      fail(`${path} must have minLength ${rule.minLength}`);
    }
    if (rule.enum && !rule.enum.includes(value)) fail(`${path} must be one of ${rule.enum.join(', ')}`);
    return;
  }

  if (rule.type === 'integer') {
    if (!Number.isInteger(value)) fail(`${path} must be an integer`);
    if (typeof rule.minimum === 'number' && value < rule.minimum) fail(`${path} must be >= ${rule.minimum}`);
  }
}

validate(data, schema);
console.log('capability registry schema valid');
