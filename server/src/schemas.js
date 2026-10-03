import { z } from 'zod';
import { sniffImageType } from './imageType.js';

const language = z.enum(['en', 'te', 'hi']);
const level = z.enum(['kid', 'exam']);
const text = z.string().trim().min(1);
const part = z.object({ label: text, meaning: text });
const context = z.object({ title: text, parts: z.array(part), explanation: text });

// ~8 MB of base64 text; the client already shrinks images to about 1600px.
export const explainRequest = z
  .object({
    image: z.string().min(100).max(8 * 1024 * 1024),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    language,
    level,
  })
  .superRefine((v, ctx) => {
    if (sniffImageType(v.image) !== v.mimeType) {
      ctx.addIssue({ code: 'custom', path: ['image'], message: 'Only JPEG, PNG or WebP images are supported' });
    }
  });

export const explainResponse = z.object({
  title: text,
  diagramType: text,
  parts: z.array(part).min(1),
  explanation: text,
  questions: z.array(z.object({ id: text, text, targetPart: text })).length(3),
});

export const checkRequest = z.object({
  context,
  questions: z.array(z.object({ id: text, text })).min(1).max(10),
  answers: z.array(z.object({ id: text, text: z.string().max(4000) })),
  language,
});

export const checkModelResponse = z.object({
  results: z.array(z.object({ id: text, verdict: z.enum(['correct', 'partial', 'incorrect']), feedback: text })),
  challenge: text,
  revisionCard: z.array(z.object({ term: text, meaning: text })).min(1),
});

export const studyRequest = z.object({ context, language, level });

export const flashcardsModelResponse = z.object({
  cards: z.array(z.object({ front: text, back: text })).min(3).max(5),
});

export const quizModelResponse = z.object({
  questions: z
    .array(
      z.object({
        text,
        options: z.array(text).length(4),
        answerIndex: z.number().int().min(0).max(3),
        explanation: text,
      }),
    )
    .min(3)
    .max(5),
});

export const MODERATION_CATEGORIES = ['none', 'personal', 'confidential', 'sexual', 'offensive', 'violent'];
export const moderationResponse = z.object({
  allowed: z.boolean(),
  category: z.enum(MODERATION_CATEGORIES),
  reason: z.string().default(''),
});

export const NOT_DIAGRAM = z.object({ notDiagram: z.literal(true) });
