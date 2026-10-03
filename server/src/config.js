try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {
  // No .env file: fall back to real environment variables.
}

const backendUrl = process.env.BACKEND_URL?.startsWith('http') ? process.env.BACKEND_URL : 'http://localhost:8787';

export const config = {
  apiKey: process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith('<') ? process.env.GEMINI_API_KEY : null,
  model: process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it',
  port: Number(new URL(backendUrl).port) || 8787,
  frontendUrl: process.env.FRONTEND_URL?.startsWith('http') ? process.env.FRONTEND_URL : 'http://localhost:5173',
};
