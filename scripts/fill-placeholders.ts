import fs from 'fs';
import path from 'path';

import { translations } from '../src/i18n/translations';

const targetLangs = ['es', 'fr', 'de', 'zh-CN', 'ja', 'hi', 'pt-BR', 'ru'];
const englishDict = translations['en'];

// Check sumo.roundComplete
if (!englishDict['sumo.roundComplete']) {
  englishDict['sumo.roundComplete'] = 'ROUND COMPLETE';
}
if (!translations['id']['sumo.roundComplete']) {
  translations['id']['sumo.roundComplete'] = 'RONDE SELESAI';
}


const allKeys = Object.keys(englishDict);

for (const lang of targetLangs) {
  if (!translations[lang]) translations[lang] = {};
  for (const key of allKeys) {
    if (!translations[lang][key]) {
      // Add a placeholder
      translations[lang][key] = `[${lang}] ${englishDict[key]}`;
    }
  }
}

const output = `export const translations: Record<string, Record<string, string>> = ${JSON.stringify(translations, null, 2)};\n`;
const outputPath = path.resolve(process.cwd(), 'src/i18n/translations.ts');
fs.writeFileSync(outputPath, output, 'utf-8');
console.log('Translations updated successfully with placeholders.');
