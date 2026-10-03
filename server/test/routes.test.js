import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/index.js';

async function withServer(fake, fn) {
  const server = createApp(() => fake).listen(0);
  const base = `http://localhost:${server.address().port}`;
  try {
    await fn((path, body) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  } finally {
    server.close();
  }
}

const good = { image: 'A'.repeat(200), mimeType: 'image/png', language: 'te', level: 'exam' };

test('explain rejects bad input with the error contract', async () => {
  await withServer({}, async (post) => {
    const res = await post('/api/explain', { ...good, language: 'fr' });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'bad_image');
    assert.ok(body.error.message);
  });
});

test('explain passes validated input through to Gemma', async () => {
  const seen = [];
  const fake = { explainDiagram: async (i) => (seen.push(i), { title: 'ok' }) };
  await withServer(fake, async (post) => {
    const res = await post('/api/explain', good);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).title, 'ok');
    assert.equal(seen[0].language, 'te');
  });
});

test('check validates body and maps AppError status', async () => {
  const { AppError } = await import('../src/errors.js');
  const fake = { checkAnswers: async () => { throw new AppError('rate_limited', 429, 'slow down'); } };
  await withServer(fake, async (post) => {
    assert.equal((await post('/api/check', { nope: 1 })).status, 400);
    const res = await post('/api/check', {
      context: { title: 'T', parts: [], explanation: 'E' },
      questions: [{ id: 'q1', text: 'a' }],
      answers: [{ id: 'q1', text: 'b' }],
      language: 'en',
    });
    assert.equal(res.status, 429);
    assert.equal((await res.json()).error.code, 'rate_limited');
  });
});
