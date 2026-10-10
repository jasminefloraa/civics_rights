import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from './error.js';
export const COOKIE = 'cs_token';
export const cookieOptions = () => ({
  httpOnly: true, secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAMESITE || 'lax', maxAge: 7 * 24 * 3600 * 1000
});
export const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
async function loadUser(req) {
  const token = req.cookies?.[COOKIE];
  if (!token) return null;
  try { return await User.findById(jwt.verify(token, process.env.JWT_SECRET).id); } catch { return null; }
}
export const optionalAuth = async (req, _res, next) => { req.user = await loadUser(req); next(); };
export const requireAuth = async (req, _res, next) => {
  req.user = await loadUser(req);
  if (!req.user) return next(new HttpError(401, 'Please log in to continue.'));
  next();
};
export const requireAdmin = (req, _res, next) =>
  req.user?.role === 'admin' ? next() : next(new HttpError(403, 'Administrator access required.'));
// CSRF defence: cookies are SameSite and CORS is origin-locked; additionally every
// state-changing request must carry a custom header that cross-site forms cannot set.
export const csrfGuard = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'CivicSignal') return next(new HttpError(403, 'Missing CSRF header.'));
  next();
};
