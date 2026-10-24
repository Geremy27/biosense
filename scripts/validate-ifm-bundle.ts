import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ifmPlanKeyValues } from '../app/knowledge/ifm/types';

const bundlePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../app/knowledge/ifm/food-plans.bundle.json',
);

function fail(message: string): never {
  console.error(`IFM bundle validation failed: ${message}`);
  process.exit(1);
}

const raw = readFileSync(bundlePath, 'utf8');
let bundle: unknown;
try {
  bundle = JSON.parse(raw);
} catch {
  fail('invalid JSON');
}

if (!bundle || typeof bundle !== 'object') {
  fail('expected an object');
}

const record = bundle as Record<string, unknown>;
if (typeof record.sourceFingerprint !== 'string' || !record.sourceFingerprint) {
  fail('missing sourceFingerprint (run npm run ingest:ifm)');
}
if (typeof record.featuresText !== 'string' || !record.featuresText.trim()) {
  fail('missing featuresText');
}
if (typeof record.plans !== 'object' || !record.plans) {
  fail('missing plans');
}

const plans = record.plans as Record<string, unknown>;
for (const key of ifmPlanKeyValues) {
  const plan = plans[key];
  if (!plan || typeof plan !== 'object') {
    fail(`missing plan "${key}"`);
  }
  const documents = (plan as Record<string, unknown>).documents;
  if (!documents || typeof documents !== 'object') {
    fail(`plan "${key}" has no documents`);
  }
  const defaultDoc = (documents as Record<string, unknown>).default;
  if (typeof defaultDoc !== 'string' || !defaultDoc.trim()) {
    fail(`plan "${key}" has empty default document`);
  }
}

console.log('IFM bundle validation OK');
