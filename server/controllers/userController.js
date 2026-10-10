import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Report from '../models/Report.js';
import { HttpError } from '../middleware/error.js';
import { validatePassword } from './authController.js';
import { statusCounts } from './adminController.js';

export const updateMe = async (req, res) => {
  const name = req.body?.name;
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) throw new HttpError(400, 'Validation failed.', { name: 'Name must be 2-80 characters.' });
  req.user.name = name.trim(); await req.user.save();
  res.json({ success: true, data: { user: req.user } });
};
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const pe = validatePassword(newPassword);
  if (pe) throw new HttpError(400, 'Validation failed.', { newPassword: pe });
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (typeof currentPassword !== 'string' || !(await bcrypt.compare(currentPassword, user.passwordHash)))
    throw new HttpError(400, 'Validation failed.', { currentPassword: 'Current password is incorrect.' });
  user.passwordHash = await bcrypt.hash(newPassword, 12); await user.save();
  res.json({ success: true });
};
export const profileSummary = async (req, res) => {
  const [count, recent] = await Promise.all([Report.countDocuments({ createdBy: req.user._id }), Report.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).limit(5).lean()]);
  res.json({ success: true, data: { reportCount: count, recent } });
};
// Public aggregate numbers for the landing page; "active" = anything not Resolved/Rejected.
export const publicStats = async (_req, res) => {
  const { total, byStatus } = await statusCounts();
  res.json({ success: true, data: { total, resolved: byStatus.Resolved, active: total - byStatus.Resolved - byStatus.Rejected, byStatus } });
};
export const recent = async (_req, res) => {
  const reports = await Report.find().sort({ createdAt: -1 }).limit(6).populate('createdBy', 'name').lean();
  res.json({ success: true, data: { reports } });
};
