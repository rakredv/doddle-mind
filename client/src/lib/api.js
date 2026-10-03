import { SAMPLES } from '../samples/index.js';

async function post(path, body) {
  let res;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw Object.assign(new Error('network'), { code: 'network' });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error ?? { code: 'model_error', message: 'Request failed' };
    throw Object.assign(new Error(err.message), { code: err.code, category: err.category });
  }
  return data;
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const sampleFor = (image) => SAMPLES.find((s) => s.id === image.sampleId);

// Samples carry cached responses so the demo works without the API.
async function fromSample(image, pick) {
  await pause(900);
  return pick(sampleFor(image));
}

export function explain({ image, language, level }) {
  if (image.sampleId) return fromSample(image, (s) => s.explain);
  return post('/api/explain', { image: image.base64, mimeType: image.mimeType, language, level });
}

export function check({ image, context, questions, answers, language }) {
  if (image.sampleId) return fromSample(image, (s) => s.check(answers));
  return post('/api/check', { context, questions, answers, language });
}

export function flashcards({ image, context, language, level }) {
  if (image.sampleId) return fromSample(image, (s) => s.cards);
  return post('/api/flashcards', { context, language, level });
}

export function quiz({ image, context, language, level }) {
  if (image.sampleId) return fromSample(image, (s) => s.mcq);
  return post('/api/quiz', { context, language, level });
}
