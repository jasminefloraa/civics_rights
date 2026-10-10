import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { HttpError } from '../middleware/error.js';
import { COOKIE, cookieOptions, signToken } from '../middleware/auth.js';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validatePassword(p) {
  if (typeof p !== 'string' || p.length < 8 || p.length > 72 || !/[A-Za-z]/.test(p) || !/\d/.test(p))
    return 'Password must be 8-72 characters and include a letter and a number.';
}
export async function register(req, res) {
  const { name, email, password } = req.body || {};
  const errors = {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) errors.name = 'Name must be 2-80 characters.';
  if (typeof email !== 'string' || !EMAIL.test(email.trim())) errors.email = 'Enter a valid email address.';
  const pe = validatePassword(password); if (pe) errors.password = pe;
  if (Object.keys(errors).length) throw new HttpError(400, 'Validation failed.', errors);
  const normalized = email.trim().toLowerCase();
  if (await User.findOne({ email: normalized })) throw new HttpError(409, 'An account with this email already exists.', { email: 'Email already registered.' });
  // role is never read from the request body: registration always creates a normal user.
  const user = await User.create({ name: name.trim(), email: normalized, passwordHash: await bcrypt.hash(password, 12) });
  res.cookie(COOKIE, signToken(user.id), cookieOptions());
  res.status(201).json({ success: true, data: { user } });
}
export async function login(req, res) {
  const { email, password } = req.body || {};
  const user = typeof email === 'string' && typeof password === 'string'
    ? await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash') : null;
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new HttpError(401, 'Invalid email or password.');
  res.cookie(COOKIE, signToken(user.id), cookieOptions());
  res.json({ success: true, data: { user } });
}
export const logout = (_req, res) => { res.clearCookie(COOKIE, { ...cookieOptions(), maxAge: undefined }); res.json({ success: true }); };
export const me = (req, res) => res.json({ success: true, data: { user: req.user } });
