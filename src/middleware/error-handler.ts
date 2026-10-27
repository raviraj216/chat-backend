import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request.',
      details: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    } });
    return;
  }
  if (error instanceof AppError) {
    if (error.status >= 500) console.error('Dependency operation failed:', error.code);
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  // Express JSON parsing and URL decoding failures must also use the error envelope.
  if (typeof error === 'object' && error !== null && 'type' in error) {
    if (error.type === 'entity.parse.failed') {
      res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } });
      return;
    }
    if (error.type === 'entity.too.large') {
      res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'JSON body exceeds 100 KB.' } });
      return;
    }
    if (error.type === 'encoding.unsupported' || error.type === 'charset.unsupported') {
      res.status(415).json({ error: { code: 'UNSUPPORTED_ENCODING', message: 'Unsupported request encoding.' } });
      return;
    }
  }
  if (error instanceof URIError) {
    res.status(400).json({ error: { code: 'INVALID_PATH', message: 'Invalid URL encoding.' } });
    return;
  }
  console.error('Unhandled error:', error instanceof Error ? error.name : 'Unknown error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
};
