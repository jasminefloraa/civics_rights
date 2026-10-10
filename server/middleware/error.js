export class HttpError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}
export const notFound = (_req, _res, next) => next(new HttpError(404, 'Route not found.'));
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500, message = err.message, details = err.details;
  if (err.name === 'ValidationError') { status = 400; details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message])); message = 'Validation failed.'; }
  else if (err.name === 'CastError') { status = 400; message = 'Invalid identifier.'; }
  else if (err.code === 11000) { status = 409; message = 'That value is already in use.'; }
  else if (err.name === 'MulterError') { status = 400; message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller.' : err.message; }
  if (status >= 500) { console.error(err); if (process.env.NODE_ENV === 'production') message = 'Something went wrong on our side.'; }
  res.status(status).json({ success: false, message, ...(details && { errors: details }) });
}
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
