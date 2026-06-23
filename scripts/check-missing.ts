import fs from 'fs';
import path from 'path';

function walk(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = walk('src');
const keys = new Set<string>();

const regex1 = /t\(['"]([a-z][a-zA-Z0-9_\.]+)['"]/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = regex1.exec(content)) !== null) {
      keys.add(match[1]);
  }
}

import { translations } from '../src/i18n/translations';
const en = translations['en'];

const missing = [];
for (const key of keys) {
  if (!en[key]) {
      missing.push(key);
  }
}

console.log('Missing keys:', missing);
