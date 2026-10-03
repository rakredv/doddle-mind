import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { AppError, errorHandler } from './errors.js';
import { gemma } from './gemma.js';
import { explainRequest, checkRequest } from './schemas.js';

export function createApp(getGemma = gemma) {
  const app = express();
  app.use(cors({ origin: config.frontendUrl }));
  app.use(express.json({ limit: '12mb' }));

  const parse = (schema, body, code = 'bad_request') => {
    const r = schema.safeParse(body);
    if (!r.success) {
      const msg = r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new AppError(code, 400, `Invalid request: ${msg}`);
    }
    return r.data;
  };

  app.get('/api/health', (_req, res) => res.json({ ok: true, model: config.model, keyConfigured: Boolean(config.apiKey) }));

  app.post('/api/explain', async (req, res) => {
    const input = parse(explainRequest, req.body, 'bad_image');
    res.json(await getGemma().explainDiagram(input));
  });

  app.post('/api/check', async (req, res) => {
    const input = parse(checkRequest, req.body);
    res.json(await getGemma().checkAnswers(input));
  });

  app.use('/api', (_req, _res, next) => next(new AppError('not_found', 404, 'Unknown API route.')));
  app.use(errorHandler);
  return app;
}

// Start listening only when run directly (tests import createApp).
if (import.meta.main) {
  createApp().listen(config.port, () => {
    console.log(`Doodle Mind server on http://localhost:${config.port} (model ${config.model})`);
    if (!config.apiKey) console.warn('Warning: GEMINI_API_KEY is not set in server/.env');
  });
}
