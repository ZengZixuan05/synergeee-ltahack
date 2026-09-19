import { ErrorRequestHandler } from 'express';
import { logError } from '../utils/logger';

// Catch-all for anything a route handler throws/rejects that it didn't
// already convert into a typed response (the facilities/lta routes convert
// LTA failures into 200-with-status responses themselves, so this should
// rarely fire for them). Always returns a generic message — never
// `err.message` verbatim — since we can't guarantee an unexpected error
// doesn't carry something sensitive.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logError('unhandled.request.error', err);
  res.status(500).json({ error: 'Internal server error' });
};
