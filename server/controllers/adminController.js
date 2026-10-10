import Report, { STATUSES } from '../models/Report.js';
import User from '../models/User.js';
import { HttpError } from '../middleware/error.js';
import { checkId, listReports } from './reportController.js';

export async function statusCounts() {
  const rows = await Report.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  rows.forEach((r) => { byStatus[r._id] = r.n; });
  return { total: Object.values(byStatus).reduce((a, b) => a + b, 0), byStatus };
}
export const adminStats = async (_req, res) => {
  const [counts, users, byCategory] = await Promise.all([
    statusCounts(), User.countDocuments(),
    Report.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }, { $sort: { n: -1 } }])
  ]);
  res.json({ success: true, data: { ...counts, users, byCategory: byCategory.map((c) => ({ category: c._id, count: c.n })) } });
};
export const adminReports = async (req, res) => res.json({ success: true, data: await listReports(req.query) });
export const updateStatus = async (req, res) => {
  checkId(req.params.id);
  const { status, note = '' } = req.body || {};
  if (!STATUSES.includes(status)) throw new HttpError(400, 'Invalid status.');
  if (typeof note !== 'string' || note.length > 500) throw new HttpError(400, 'Note must be 500 characters or fewer.');
  const report = await Report.findById(req.params.id);
  if (!report) throw new HttpError(404, 'Report not found.');
  if (report.status === status) throw new HttpError(400, 'Report already has that status.');
  report.statusHistory.push({ previousStatus: report.status, newStatus: status, note: note.trim(), changedBy: req.user._id });
  report.status = status;
  await report.save();
  res.json({ success: true, data: { report } });
};
export const adminUsers = async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(200); // passwordHash is select:false
  res.json({ success: true, data: { users } });
};
