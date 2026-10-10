import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { wrap, HttpError } from '../middleware/error.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { parseImage } from '../middleware/upload.js';
import * as A from '../controllers/authController.js';
import * as R from '../controllers/reportController.js';
import * as D from '../controllers/adminController.js';
import * as U from '../controllers/userController.js';

const r = Router();
const limiter = (max) => rateLimit({ windowMs: 15 * 60 * 1000, max: process.env.NODE_ENV === 'test' ? 10000 : max, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many attempts. Please try again later.' } });
const upload = (req, res, next) => parseImage(req, res, (e) => next(e));

r.post('/auth/register', limiter(20), wrap(A.register));
r.post('/auth/login', limiter(20), wrap(A.login));
r.post('/auth/logout', A.logout);
r.get('/auth/me', requireAuth, A.me);

r.get('/reports', wrap(R.getReports));
r.get('/reports/my-reports', requireAuth, wrap(R.getMyReports));
r.post('/reports/check-duplicates', requireAuth, limiter(200), wrap(R.checkDuplicates));
r.post('/reports', requireAuth, limiter(60), upload, wrap(R.createReport));
r.get('/reports/:id', wrap(R.getReport));
r.patch('/reports/:id', requireAuth, wrap(R.updateReport));
r.delete('/reports/:id', requireAuth, wrap(R.deleteReport));

r.get('/dashboard/stats', wrap(U.publicStats));
r.get('/dashboard/recent', wrap(U.recent));

r.get('/admin/stats', requireAuth, requireAdmin, wrap(D.adminStats));
r.get('/admin/reports', requireAuth, requireAdmin, wrap(D.adminReports));
r.patch('/admin/reports/:id/status', requireAuth, requireAdmin, wrap(D.updateStatus));
r.get('/admin/users', requireAuth, requireAdmin, wrap(D.adminUsers));

r.get('/users/me/summary', requireAuth, wrap(U.profileSummary));
r.patch('/users/me', requireAuth, wrap(U.updateMe));
r.patch('/users/me/password', requireAuth, limiter(20), wrap(U.changePassword));
export default r;
