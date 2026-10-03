import { z } from 'zod';

const language = z.enum(['en', 'te', 'hi']);
const text = z.string().trim().min(1);
const part = z.object({ label: text, meaning: text });

// ~8 MB of base64 text; the client already shrinks images to about 1600px.
export const explainRequest = z.object({
  image: z.string().min(100).max(8 * 1024 * 1024),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  language,
  level: z.enum(['kid', 'exam']),
});

export const explainResponse = z.object({
  title: text,
  diagramType: text,
  parts: z.array(part).min(1),
  explanation: text,
  questions: z
    .array(z.object({ id: text, text, targetPart: text }))
    .length(3),
});

export const checkRequest = z.object({
  context: z.object({ title: text, parts: z.array(part), explanation: text }),
  questions: z.array(z.object({ id: text, text })).min(1).max(10),
  answers: z.array(z.object({ id: text, text: z.string().max(4000) })),
  language,
});

export const checkModelResponse = z.object({
  results: z.array(
    z.object({ id: text, verdict: z.enum(['correct', 'partial', 'incorrect']), feedback: text }),
  ),
  challenge: text,
  revisionCard: z.array(z.object({ term: text, meaning: text })).min(1),
});

export const NOT_DIAGRAM = z.object({ notDiagram: z.literal(true) });
