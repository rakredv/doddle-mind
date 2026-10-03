export class AppError extends Error {
  constructor(code, status, message, category) {
    super(message);
    this.code = code;
    this.status = status;
    this.category = category;
  }
}

// Express error middleware: always answers { error: { code, message } }.
export function errorHandler(err, _req, res, _next) {
  let e = err;
  if (!(e instanceof AppError)) {
    if (err?.type === 'entity.too.large') e = new AppError('bad_image', 413, 'Image is too large.');
    else if (err?.type === 'entity.parse.failed') e = new AppError('bad_request', 400, 'Request body is not valid JSON.');
    else {
      console.error('Unhandled error:', err?.message);
      e = new AppError('model_error', 500, 'Something went wrong on the server.');
    }
  }
  res.status(e.status).json({ error: { code: e.code, message: e.message, ...(e.category && { category: e.category }) } });
}
