// Every Gemma 4 call (via the Gemini API) goes through this file.
import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';
import { AppError } from './errors.js';
import { explainSystem, EXPLAIN_USER, checkSystem, checkUser } from './prompts.js';
import { explainResponse, checkModelResponse, NOT_DIAGRAM } from './schemas.js';

const TRANSIENT_RETRIES = 2; // for 429/5xx from the API
const REQUEST_TIMEOUT_MS = 90_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

    explainDiagram({ image, mimeType, language, level }) {
      return structured({
        system: explainSystem(language, level),
        parts: [{ inlineData: { mimeType, data: image } }, { text: EXPLAIN_USER }],
        schema: explainResponse,
      });
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
