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
const ALLOW = JSON.stringify({ allowed: true, category: 'none', reason: '' });
const img = { image: 'A'.repeat(200), mimeType: 'image/png', language: 'en', level: 'kid' };

test('extractJson handles fences and surrounding prose', () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('Sure! {"a":{"b":2}} hope that helps'), { a: { b: 2 } });
  assert.throws(() => extractJson('no json here'));
});

test('explainDiagram returns validated lesson and sends image + system prompt', async () => {
  const ai = fakeAi([ALLOW, JSON.stringify(lesson)]);
  const out = await createGemma({ ai, model: 'm', backoffMs: 0 }).explainDiagram(img);
  assert.equal(out.title, 'Mitochondria');
  const req = ai.calls[1];
  assert.equal(req.model, 'm');
  assert.ok(req.contents[0].parts[0].inlineData.data);
  assert.match(req.config.systemInstruction, /English/);
});

test('invalid JSON is retried once with a correction hint, then succeeds', async () => {
  const ai = fakeAi([ALLOW, '{"title":"x"}', JSON.stringify(lesson)]);
  const out = await createGemma({ ai, backoffMs: 0 }).explainDiagram(img);
  assert.equal(out.questions.length, 3);
  assert.equal(ai.calls.length, 3);
  assert.match(ai.calls[2].contents[0].parts.at(-1).text, /previous reply was invalid/);
});

test('two invalid replies give bad_json', async () => {
  const ai = fakeAi([ALLOW, 'nope', '{"title":"x"}']);
  await assert.rejects(createGemma({ ai, backoffMs: 0 }).explainDiagram(img), { code: 'bad_json', status: 502 });
});

test('notDiagram maps to bad_image', async () => {
  const ai = fakeAi([ALLOW, '{"notDiagram":true}']);
  await assert.rejects(createGemma({ ai, backoffMs: 0 }).explainDiagram(img), { code: 'bad_image' });
});

test('transient 503 is retried; 429 surfaces as rate_limited after retries', async () => {
  const ok = fakeAi([apiError(503), ALLOW, JSON.stringify(lesson)]);
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

test('blocked image gives 422 unsafe_image with category and never reaches explain', async () => {
  const ai = fakeAi([JSON.stringify({ allowed: false, category: 'personal', reason: 'ID card' })]);
  await assert.rejects(createGemma({ ai, backoffMs: 0 }).explainDiagram(img), { code: 'unsafe_image', status: 422, category: 'personal' });
  assert.equal(ai.calls.length, 1);
});

test('moderation verdict is cached per image', async () => {
  const ai = fakeAi([ALLOW, JSON.stringify(lesson), JSON.stringify(lesson)]);
  const g = createGemma({ ai, backoffMs: 0 });
  await g.explainDiagram(img);
  await g.explainDiagram({ ...img, language: 'te' });
  assert.equal(ai.calls.length, 3);
});

test('flash cards: ids added, more than 5 cards rejected', async () => {
  const card = (n) => ({ front: `f${n}`, back: `b${n}` });
  const ctx = { context: { title: 'T', parts: [], explanation: 'E' }, language: 'en', level: 'kid' };
  const ok = fakeAi([JSON.stringify({ cards: [1, 2, 3].map(card) })]);
  const out = await createGemma({ ai: ok, backoffMs: 0 }).generateFlashcards(ctx);
  assert.deepEqual(out.cards.map((c) => c.id), ['c1', 'c2', 'c3']);

  const six = JSON.stringify({ cards: [1, 2, 3, 4, 5, 6].map(card) });
  await assert.rejects(createGemma({ ai: fakeAi([six, six]), backoffMs: 0 }).generateFlashcards(ctx), { code: 'bad_json' });
});

test('quiz: shuffle keeps answerIndex on the same option', async () => {
  const q = (n) => ({ text: `Q${n}`, options: ['a', 'b', 'c', 'd'], answerIndex: 2, explanation: 'because' });
  const ctx = { context: { title: 'T', parts: [], explanation: 'E' }, language: 'en', level: 'exam' };
  const ai = fakeAi([JSON.stringify({ questions: [1, 2, 3, 4, 5].map(q) })]);
  const out = await createGemma({ ai, backoffMs: 0 }).generateQuiz(ctx);
  assert.equal(out.questions.length, 5);
  for (const m of out.questions) assert.equal(m.options[m.answerIndex], 'c');

  const dup = JSON.stringify({ questions: [1, 2, 3].map((n) => ({ ...q(n), options: ['a', 'a', 'c', 'd'] })) });
  await assert.rejects(createGemma({ ai: fakeAi([dup, dup]), backoffMs: 0 }).generateQuiz(ctx), { code: 'bad_json' });
});
