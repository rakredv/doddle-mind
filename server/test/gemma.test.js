import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGemma, extractJson } from '../src/gemma.js';

const lesson = {
  title: 'Mitochondria',
  diagramType: 'labelled-diagram',
  parts: [{ label: 'Matrix', meaning: 'Inner fluid' }],
  explanation: 'Powerhouse of the cell.',
  questions: [1, 2, 3].map((n) => ({ id: `q${n}`, text: `Question ${n}?`, targetPart: 'Matrix' })),
};

// Fake Gemini client: each call returns/throws the next scripted item.
function fakeAi(script) {
  const calls = [];
  return {
    calls,
    models: {
      async generateContent(req) {
        calls.push(req);
        const next = script.shift();
        if (next instanceof Error) throw next;
        return { text: next };
      },
    },
  };
}
const apiError = (status) => Object.assign(new Error(`api ${status}`), { status });
const img = { image: 'A'.repeat(200), mimeType: 'image/png', language: 'en', level: 'kid' };

test('extractJson handles fences and surrounding prose', () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('Sure! {"a":{"b":2}} hope that helps'), { a: { b: 2 } });
  assert.throws(() => extractJson('no json here'));
});

test('explainDiagram returns validated lesson and sends image + system prompt', async () => {
  const ai = fakeAi([JSON.stringify(lesson)]);
  const out = await createGemma({ ai, model: 'm', backoffMs: 0 }).explainDiagram(img);
  assert.equal(out.title, 'Mitochondria');
  const req = ai.calls[0];
  assert.equal(req.model, 'm');
  assert.ok(req.contents[0].parts[0].inlineData.data);
  assert.match(req.config.systemInstruction, /English/);
});

test('invalid JSON is retried once with a correction hint, then succeeds', async () => {
  const ai = fakeAi(['{"title":"x"}', JSON.stringify(lesson)]);
  const out = await createGemma({ ai, backoffMs: 0 }).explainDiagram(img);
  assert.equal(out.questions.length, 3);
  assert.equal(ai.calls.length, 2);
  assert.match(ai.calls[1].contents[0].parts.at(-1).text, /previous reply was invalid/);
});

test('two invalid replies give bad_json', async () => {
  const ai = fakeAi(['nope', '{"title":"x"}']);
  await assert.rejects(createGemma({ ai, backoffMs: 0 }).explainDiagram(img), { code: 'bad_json', status: 502 });
});

test('notDiagram maps to bad_image', async () => {
  const ai = fakeAi(['{"notDiagram":true}']);
  await assert.rejects(createGemma({ ai, backoffMs: 0 }).explainDiagram(img), { code: 'bad_image' });
});

test('transient 503 is retried; 429 surfaces as rate_limited after retries', async () => {
  const ok = fakeAi([apiError(503), JSON.stringify(lesson)]);
  assert.equal((await createGemma({ ai: ok, backoffMs: 0 }).explainDiagram(img)).title, 'Mitochondria');

  const limited = fakeAi([apiError(429), apiError(429), apiError(429)]);
  await assert.rejects(createGemma({ ai: limited, backoffMs: 0 }).explainDiagram(img), { code: 'rate_limited', status: 429 });
});

test('checkAnswers recomputes score and requires a result per question', async () => {
  const input = {
    context: { title: 'T', parts: [], explanation: 'E' },
    questions: [{ id: 'q1', text: 'a' }, { id: 'q2', text: 'b' }],
    answers: [{ id: 'q1', text: 'right' }, { id: 'q2', text: 'wrong' }],
    language: 'en',
  };
  const full = {
    results: [
      { id: 'q1', verdict: 'correct', feedback: 'Good' },
      { id: 'q2', verdict: 'partial', feedback: 'Close' },
    ],
    score: 99, // model-supplied score must be ignored
    challenge: 'What if?',
    revisionCard: [{ term: 'A', meaning: 'B' }],
  };
  const missing = { ...full, results: [full.results[0]] };
  const ai = fakeAi([JSON.stringify(missing), JSON.stringify(full)]);
  const out = await createGemma({ ai, backoffMs: 0 }).checkAnswers(input);
  assert.equal(out.score, 1);
  assert.equal(ai.calls.length, 2);
});
