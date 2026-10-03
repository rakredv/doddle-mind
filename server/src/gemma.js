// Every Gemma 4 call (via the Gemini API) goes through this file.
import { createHash } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';
import { AppError } from './errors.js';
import {
  explainSystem, EXPLAIN_USER, checkSystem, checkUser, MODERATION_SYSTEM, MODERATION_USER,
  flashcardsSystem, flashcardsUser, quizSystem, quizUser,
} from './prompts.js';
import {
  explainResponse, checkModelResponse, flashcardsModelResponse, quizModelResponse, moderationResponse, NOT_DIAGRAM,
} from './schemas.js';

const TRANSIENT_RETRIES = 2; // for 429/5xx from the API
const REQUEST_TIMEOUT_MS = 90_000;
const VERDICT_CACHE_SIZE = 100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MODERATION_MESSAGES = {
  personal: 'This image seems to contain personal information or a photo of a person, so it can not be used. Please upload a diagram only.',
  confidential: 'This image seems to contain confidential or private documents, so it can not be used. Please upload a diagram only.',
  sexual: 'This image contains content that is not suitable for a study app. Please upload a diagram only.',
  offensive: 'This image contains offensive or abusive content, so it can not be used. Please upload a diagram only.',
  violent: 'This image contains graphic or violent content, so it can not be used. Please upload a diagram only.',
};

function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Models sometimes wrap JSON in code fences or prose; take the outermost object.
export function extractJson(text) {
  const cleaned = String(text ?? '').replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('No JSON object found in the reply');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function toAppError(e) {
  if (e instanceof AppError) return e;
  const status = e?.status ?? e?.code;
  if (status === 429) return new AppError('rate_limited', 429, 'Too many requests. Please wait a moment.');
  if (status === 400) return new AppError('bad_image', 400, 'The model could not process that input.');
  return new AppError('model_error', 502, 'The AI model is unavailable right now. Please try again.');
}

export function createGemma({ ai, model = config.model, backoffMs = 1500 } = {}) {
  const client = ai ?? new GoogleGenAI({ apiKey: config.apiKey, httpOptions: { timeout: REQUEST_TIMEOUT_MS } });
  const verdicts = new Map(); // image hash -> moderation verdict

  async function call({ system, parts }) {
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await client.models.generateContent({
          model,
          contents: [{ role: 'user', parts }],
          config: {
            systemInstruction: system,
            responseMimeType: 'application/json',
            temperature: 0.4,
            // Minimal thinking cuts latency ~3x; the last retry drops it in case it caused a 500.
            ...(attempt < TRANSIENT_RETRIES && { thinkingConfig: { thinkingLevel: 'MINIMAL' } }),
          },
        });
        return res.text;
      } catch (e) {
        const status = e?.status ?? e?.code;
        const transient = status === 429 || status >= 500;
        if (!transient || attempt >= TRANSIENT_RETRIES) throw toAppError(e);
        await sleep(backoffMs * (attempt + 1));
      }
    }
  }

  // Ask for JSON, validate with zod, and retry once telling the model what was wrong.
  async function structured({ system, parts, schema, extraCheck }) {
    let hint = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      const reply = await call({ system, parts: hint ? [...parts, { text: hint }] : parts });
      let problem;
      try {
        const data = extractJson(reply);
        if (NOT_DIAGRAM.safeParse(data).success && schema === explainResponse) {
          throw new AppError('bad_image', 422, 'That does not look like a readable diagram. Try a clearer photo.');
        }
        const parsed = schema.safeParse(data);
        if (parsed.success) {
          problem = extraCheck?.(parsed.data);
          if (!problem) return parsed.data;
        } else {
          problem = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        }
      } catch (e) {
        if (e instanceof AppError) throw e;
        problem = e.message;
      }
      hint = `Your previous reply was invalid (${problem}). Reply again with only the corrected JSON object.`;
    }
    throw new AppError('bad_json', 502, 'The AI replied in an unexpected format. Please try again.');
  }

  return {
    model,

    // Blocks the image (422 unsafe_image) before it reaches the explain call.
    async moderateImage({ image, mimeType }) {
      const key = createHash('sha256').update(image).digest('hex');
      let verdict = verdicts.get(key);
      if (!verdict) {
        verdict = await structured({
          system: MODERATION_SYSTEM,
          parts: [{ inlineData: { mimeType, data: image } }, { text: MODERATION_USER }],
          schema: moderationResponse,
        });
        verdicts.set(key, verdict);
        if (verdicts.size > VERDICT_CACHE_SIZE) verdicts.delete(verdicts.keys().next().value);
      }
      if (!verdict.allowed) {
        const category = verdict.category === 'none' ? 'personal' : verdict.category;
        throw new AppError('unsafe_image', 422, MODERATION_MESSAGES[category], category);
      }
    },

    async explainDiagram({ image, mimeType, language, level }) {
      await this.moderateImage({ image, mimeType });
      return structured({
        system: explainSystem(language, level),
        parts: [{ inlineData: { mimeType, data: image } }, { text: EXPLAIN_USER }],
        schema: explainResponse,
      });
    },

    async generateFlashcards({ context, language, level }) {
      const { cards } = await structured({
        system: flashcardsSystem(language, level),
        parts: [{ text: flashcardsUser(context) }],
        schema: flashcardsModelResponse,
      });
      return { cards: cards.map((c, i) => ({ id: `c${i + 1}`, ...c })) };
    },

    async generateQuiz({ context, language, level }) {
      const { questions } = await structured({
        system: quizSystem(language, level),
        parts: [{ text: quizUser(context) }],
        schema: quizModelResponse,
        extraCheck: (d) =>
          d.questions.some((q) => new Set(q.options.map((o) => o.toLowerCase())).size < 4) ? 'options must be distinct' : null,
      });
      // Shuffle here so the correct option is not always in the same slot.
      return {
        questions: questions.map((q, i) => {
          const correct = q.options[q.answerIndex];
          const options = shuffle(q.options);
          return { id: `m${i + 1}`, text: q.text, options, answerIndex: options.indexOf(correct), explanation: q.explanation };
        }),
      };
    },

    async checkAnswers({ context, questions, answers, language }) {
      const ids = questions.map((q) => q.id);
      const data = await structured({
        system: checkSystem(language),
        parts: [{ text: checkUser({ context, questions, answers }) }],
        schema: checkModelResponse,
        extraCheck: (d) => {
          const got = new Set(d.results.map((r) => r.id));
          const missing = ids.filter((id) => !got.has(id));
          return missing.length ? `missing results for ${missing.join(', ')}` : null;
        },
      });
      // Score is computed here, not trusted from the model.
      const results = ids.map((id) => data.results.find((r) => r.id === id));
      return { ...data, results, score: results.filter((r) => r.verdict === 'correct').length };
    },
  };
}

let shared;
export function gemma() {
  if (!config.apiKey) throw new AppError('model_error', 500, 'Server is missing GEMINI_API_KEY.');
  return (shared ??= createGemma());
}
