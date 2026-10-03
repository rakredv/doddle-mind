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
    throw Object.assign(new Error(err.message), { code: err.code });
  }
  return data;
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const sampleFor = (image) => SAMPLES.find((s) => s.id === image.sampleId);

// Samples carry cached responses so the demo works without the API.
export async function explain({ image, language, level }) {
  if (image.sampleId) {
    await pause(900);
    return sampleFor(image).explain;
  }
  return post('/api/explain', { image: image.base64, mimeType: image.mimeType, language, level });
}

export async function check({ image, context, questions, answers, language }) {
  if (image.sampleId) {
    await pause(900);
    return sampleFor(image).check(answers);
  }
  return post('/api/check', { context, questions, answers, language });
}
