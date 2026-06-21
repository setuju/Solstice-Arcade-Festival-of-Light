import fs from 'fs';
import path from 'path';
import { translate } from '@vitalets/google-translate-api';
import { translations } from '../src/i18n/translations';

let targetLangs = process.argv.slice(2);
if (targetLangs.length === 0) {
  targetLangs = ['es', 'fr', 'de', 'zh-CN', 'ja', 'hi', 'pt-BR', 'ru'];
}

const englishDict = translations['en'];

async function main() {
  console.log('Starting batch auto-translation process...');
  
  const result: Record<string, Record<string, string>> = {
    en: englishDict,
    id: translations['id'] || {},
  };

  const keysToTranslate = Object.keys(englishDict);
  const delimiter = ' ||| ';

  for (const lang of targetLangs) {
    console.log(`\nTranslating to ${lang}...`);
    result[lang] = translations[lang] || {};
    
    // Which keys do we need?
    const pendingKeys = keysToTranslate.filter(k => !result[lang][k] || result[lang][k].trim() === '' || result[lang][k].startsWith(`[${lang}]`));
    
    if (pendingKeys.length === 0) {
      console.log(`  [SKIP] All keys translated for ${lang}.`);
      continue;
    }

    const chunkSize = 20;
    for (let i = 0; i < pendingKeys.length; i += chunkSize) {
      const chunkKeys = pendingKeys.slice(i, i + chunkSize);
      const batchValues = chunkKeys.map(k => englishDict[k]);
      const giantString = batchValues.join(delimiter);

      try {
        console.log(`  [TRANSLATE CHUNK] ${chunkKeys.length} items (${i} / ${pendingKeys.length})`);
        const res = await translate(giantString, { to: lang });
        const translatedParts = res.text.split(delimiter);

        if (translatedParts.length === chunkKeys.length) {
            chunkKeys.forEach((k, idx) => {
                result[lang][k] = translatedParts[idx].trim();
            });
        } else {
          console.warn(`  [WARN] Splitting failed for ${lang}. Parts: ${translatedParts.length}, Expected: ${chunkKeys.length}`);
          for (const k of chunkKeys) {
             result[lang][k] = `[${lang}] ${englishDict[k]}`;
          }
        }
      } catch (err: any) {
        console.error(`  [ERROR] Failed to translate chunk for ${lang}:`, err.message);
        for (const k of chunkKeys) {
           result[lang][k] = `[${lang}] ${englishDict[k]}`;
        }
      }

      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const output = `export const translations: Record<string, Record<string, string>> = ${JSON.stringify(result, null, 2)};\n`;
  const outputPath = path.resolve(process.cwd(), 'src/i18n/translations.ts');
  fs.writeFileSync(outputPath, output, 'utf-8');
  console.log(`\nTranslations updated successfully at ${outputPath}!`);
}

main().catch(console.error);
