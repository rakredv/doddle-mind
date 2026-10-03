// One-off check of what Gemma 4 supports on the Gemini API.
// Usage: node scripts/probe.js [path/to/diagram.jpg]
// Never prints the API key.
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { GoogleGenAI } from '@google/genai';

try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {
  console.error('Could not read server/.env');
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('<')) {
  console.error('GEMINI_API_KEY is missing in server/.env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = process.env.GEMMA_MODEL || 'gemma-4-31b-it';
const imagePath = process.argv[2];

async function step(name, fn) {
  const t = Date.now();
  try {
    const out = await fn();
    console.log(`PASS  ${name} (${Date.now() - t}ms)\n      ${String(out).slice(0, 300).replace(/\n/g, '\n      ')}`);
  } catch (e) {
    console.log(`FAIL  ${name} (${Date.now() - t}ms)\n      ${e.status ?? ''} ${String(e.message).slice(0, 300)}`);
  }
}

await step('1. list models containing "gemma"', async () => {
  const names = [];
  for await (const m of await ai.models.list({ config: { pageSize: 100 } })) {
    if (/gemma/i.test(m.name)) names.push(m.name.replace('models/', ''));
  }
  return names.join(', ') || '(none found)';
});

await step(`2. plain text with ${model}`, async () =>
  (await ai.models.generateContent({ model, contents: 'Say "ok" in Telugu.' })).text);

await step('3. systemInstruction', async () =>
  (await ai.models.generateContent({
    model,
    contents: 'Hello',
    config: { systemInstruction: 'Reply with exactly the single word PINEAPPLE.' },
  })).text);

await step('4. native JSON mode (responseMimeType)', async () =>
  (await ai.models.generateContent({
    model,
    contents: 'Return {"a":1} as JSON.',
    config: { responseMimeType: 'application/json' },
  })).text);

await step('5. thinkingConfig minimal (does thinking leak into text?)', async () =>
  (await ai.models.generateContent({
    model,
    contents: 'What is 17*3? Answer with just the number.',
    config: { thinkingConfig: { thinkingLevel: 'MINIMAL' } },
  })).text);

if (imagePath) {
  const mime = { '.png': 'image/png', '.webp': 'image/webp' }[extname(imagePath).toLowerCase()] ?? 'image/jpeg';
  const data = readFileSync(imagePath).toString('base64');
  await step(`6. image input (${(data.length / 1024).toFixed(0)} KB base64)`, async () =>
    (await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType: mime, data } }, { text: 'List the labels you can read in this diagram.' }] }],
    })).text);
} else {
  console.log('SKIP  6. image input (pass an image path as the first argument)');
}
