import mongoose from 'mongoose';
import Report, { CATEGORIES, STATUSES } from '../models/Report.js';
import { HttpError } from '../middleware/error.js';
import { saveImage } from '../middleware/upload.js';
import { findDuplicates } from '../services/duplicates.js';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const num = (v) => (v === '' || v == null ? null : Number(v));
export function checkId(id) { if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Invalid report id.'); }

// Validates fields shared by create/update. Returns cleaned values or throws 400 with field errors.
export function cleanReport(body, partial = false) {
  const e = {}, out = {};
  const str = (k, min, max, label) => {
    if (body[k] === undefined && partial) return;
    const v = typeof body[k] === 'string' ? body[k].trim() : '';
    if (v.length < min || v.length > max) e[k] = `${label} must be ${min}-${max} characters.`; else out[k] = v;
  };
  str('title', 5, 120, 'Title'); str('description', 10, 2000, 'Description'); str('locationName', 2, 200, 'Location');
  if (body.category !== undefined || !partial) { if (!CATEGORIES.includes(body.category)) e.category = 'Choose a valid category.'; else out.category = body.category; }
  const lat = num(body.latitude), lng = num(body.longitude);
  if ((lat == null) !== (lng == null)) e.latitude = 'Provide both latitude and longitude, or neither.';
  else if (lat != null) {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) e.latitude = 'Latitude must be between -90 and 90.';
    else if (!Number.isFinite(lng) || lng < -180 || lng > 180) e.longitude = 'Longitude must be between -180 and 180.';
    else out.coords = { latitude: lat, longitude: lng };
  }
  if (Object.keys(e).length) throw new HttpError(400, 'Validation failed.', e);
  return out;
}
const toLocation = (c) => ({ type: 'Point', coordinates: [c.longitude, c.latitude] });
const POP = [{ path: 'createdBy', select: 'name' }, { path: 'statusHistory.changedBy', select: 'name' }];

export const checkDuplicates = async (req, res) => {
  const { title = '', description = '', category } = req.body || {};
  if (!CATEGORIES.includes(category)) throw new HttpError(400, 'Choose a valid category.');
  const lat = num(req.body.latitude), lng = num(req.body.longitude);
  const matches = await findDuplicates({ title, description, category, latitude: lat, longitude: lng });
  res.json({ success: true, data: { matches } });
};

export const createReport = async (req, res) => {
  const v = cleanReport(req.body);
  const imageUrl = saveImage(req.file); // throws a clear error if storage is unavailable
  const report = await Report.create({
    title: v.title, description: v.description, category: v.category, locationName: v.locationName,
    ...(v.coords && { location: toLocation(v.coords) }), imageUrl, createdBy: req.user._id,
    statusHistory: [{ previousStatus: null, newStatus: 'Reported', note: 'Report submitted', changedBy: req.user._id }]
  });
  res.status(201).json({ success: true, data: { report } });
};

// Shared by public list and admin list. `extra` adds fixed constraints.
export async function listReports(query, extra = {}) {
  const page = Math.max(1, parseInt(query.page) || 1), limit = Math.min(50, Math.max(1, parseInt(query.limit) || 12));
  const f = { ...extra };
  const q = String(query.q ?? '').trim().slice(0, 100);
  if (q) { const r = new RegExp(esc(q), 'i'); f.$or = [{ title: r }, { description: r }, { locationName: r }]; }
  if (query.category) { if (!CATEGORIES.includes(query.category)) throw new HttpError(400, 'Unknown category.'); f.category = query.category; }
  if (query.status) { if (!STATUSES.includes(query.status)) throw new HttpError(400, 'Unknown status.'); f.status = query.status; }
  if (query.from || query.to) {
    f.createdAt = {};
    if (query.from) { const d = new Date(query.from); if (isNaN(d)) throw new HttpError(400, 'Invalid from date.'); f.createdAt.$gte = d; }
    if (query.to) { const d = new Date(query.to); if (isNaN(d)) throw new HttpError(400, 'Invalid to date.'); d.setHours(23, 59, 59, 999); f.createdAt.$lte = d; }
  }
  const sort = { oldest: { createdAt: 1 }, updated: { updatedAt: -1 } }[query.sort] || { createdAt: -1 };
  const [reports, total] = await Promise.all([
    Report.find(f).sort(sort).skip((page - 1) * limit).limit(limit).populate('createdBy', 'name').lean(),
    Report.countDocuments(f)
  ]);
  return { reports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
export const getReports = async (req, res) => res.json({ success: true, data: await listReports(req.query) });
export const getMyReports = async (req, res) => res.json({ success: true, data: await listReports(req.query, { createdBy: req.user._id }) });

export const getReport = async (req, res) => {
  checkId(req.params.id);
  const report = await Report.findById(req.params.id).populate(POP).lean();
  if (!report) throw new HttpError(404, 'Report not found.');
  res.json({ success: true, data: { report } });
};

// Owners may edit/delete only while the report is still "Reported" (not yet reviewed).
async function ownedEditable(req) {
  checkId(req.params.id);
  const report = await Report.findById(req.params.id);
  if (!report) throw new HttpError(404, 'Report not found.');
  if (String(report.createdBy) !== String(req.user._id)) throw new HttpError(403, 'You can only modify your own reports.');
  if (report.status !== 'Reported') throw new HttpError(409, 'This report is already under review and can no longer be changed.');
  return report;
}
export const updateReport = async (req, res) => {
  const report = await ownedEditable(req);
  const v = cleanReport({ ...req.body }, true);
  for (const k of ['title', 'description', 'category', 'locationName']) if (v[k] !== undefined) report[k] = v[k];
  if (v.coords) report.location = toLocation(v.coords);
  await report.save();
  res.json({ success: true, data: { report } });
};
export const deleteReport = async (req, res) => {
  const report = await ownedEditable(req);
  await report.deleteOne();
  res.json({ success: true });
};
