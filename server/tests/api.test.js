import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
process.env.JWT_SECRET = 'test-secret'; process.env.NODE_ENV = 'test'; process.env.CLIENT_URL = 'http://localhost:5173';
const { default: createApp } = await import('../app.js');
const { default: User } = await import('../models/User.js');
const { default: Report } = await import('../models/Report.js');
const { tokens, jaccard, haversine } = await import('../services/duplicates.js');

let mongod, app;
const H = { 'X-Requested-With': 'CivicSignal' };
const agent = () => request.agent(app);
const post = (a, url, body) => a.post(url).set(H).send(body);
const good = { title: 'Big pothole on Main Street', description: 'A deep pothole near the bakery damaging tyres.', category: 'Roads and potholes', locationName: 'Main Street', latitude: 13.08, longitude: 80.27 };
async function login(email = 'u@test.com', name = 'User') {
  const a = agent(); await post(a, '/api/auth/register', { name, email, password: 'password1' }); return a;
}
async function adminAgent() {
  await User.create({ name: 'Admin', email: 'admin@test.com', passwordHash: await bcrypt.hash('password1', 4), role: 'admin' });
  const a = agent(); await post(a, '/api/auth/login', { email: 'admin@test.com', password: 'password1' }); return a;
}
// Set TEST_MONGODB_URI to use an existing MongoDB; otherwise an in-memory server is downloaded.
beforeAll(async () => { const uri = process.env.TEST_MONGODB_URI || (mongod = await MongoMemoryServer.create()).getUri(); await mongoose.connect(uri); await User.init(); app = createApp(); });
afterAll(async () => { await mongoose.disconnect(); if (mongod) await mongod.stop(); });
afterEach(async () => { await Promise.all([User.deleteMany({}), Report.deleteMany({})]); });

describe('auth', () => {
  test('registers, hides hash, rejects duplicate email', async () => {
    const a = agent();
    const r = await post(a, '/api/auth/register', { name: 'Ann', email: 'Ann@Test.com', password: 'password1' });
    expect(r.status).toBe(201); expect(r.body.data.user.passwordHash).toBeUndefined(); expect(r.body.data.user.email).toBe('ann@test.com');
    expect((await post(agent(), '/api/auth/register', { name: 'Ann2', email: 'ann@test.com', password: 'password1' })).status).toBe(409);
  });
  test('cannot self-assign admin role', async () => {
    const r = await post(agent(), '/api/auth/register', { name: 'Eve', email: 'e@test.com', password: 'password1', role: 'admin' });
    expect(r.body.data.user.role).toBe('user');
  });
  test('validates input', async () => { expect((await post(agent(), '/api/auth/register', { name: 'A', email: 'bad', password: '123' })).status).toBe(400); });
  test('login success and failure', async () => {
    await login('l@test.com');
    expect((await post(agent(), '/api/auth/login', { email: 'l@test.com', password: 'wrong' })).status).toBe(401);
    expect((await post(agent(), '/api/auth/login', { email: 'l@test.com', password: 'password1' })).status).toBe(200);
  });
  test('rejects state-changing request without CSRF header', async () => {
    expect((await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'x' })).status).toBe(403);
  });
});

describe('reports', () => {
  test('requires auth, validates, creates', async () => {
    expect((await post(request(app), '/api/reports', good)).status).toBe(401);
    const a = await login();
    const bad = await post(a, '/api/reports', { ...good, title: 'x', category: 'Nope' });
    expect(bad.status).toBe(400); expect(bad.body.errors.title).toBeDefined(); expect(bad.body.errors.category).toBeDefined();
    const ok = await post(a, '/api/reports', good);
    expect(ok.status).toBe(201); expect(ok.body.data.report.location.coordinates).toEqual([80.27, 13.08]);
    expect(ok.body.data.report.statusHistory).toHaveLength(1);
  });
  test('lists, searches, filters and paginates', async () => {
    const a = await login();
    await post(a, '/api/reports', good);
    await post(a, '/api/reports', { ...good, title: 'Garbage overflowing', category: 'Garbage and sanitation', description: 'Bins are overflowing for days now.' });
    expect((await request(app).get('/api/reports')).body.data.pagination.total).toBe(2);
    expect((await request(app).get('/api/reports?category=Garbage and sanitation')).body.data.reports).toHaveLength(1);
    expect((await request(app).get('/api/reports?q=pothole')).body.data.reports).toHaveLength(1);
    expect((await request(app).get('/api/reports?q=')).body.data.reports).toHaveLength(2);
expect((await request(app).get('/api/reports?q=%20%20')).body.data.reports).toHaveLength(2);
    expect((await request(app).get('/api/reports?status=Resolved')).body.data.reports).toHaveLength(0);
    expect((await request(app).get('/api/reports?limit=1&page=2')).body.data.reports).toHaveLength(1);
    expect((await request(app).get('/api/reports?category=Bad')).status).toBe(400);
    expect((await request(app).get('/api/reports/not-an-id')).status).toBe(400);
  });
  test('duplicate detection finds nearby similar reports and ignores far ones', async () => {
    const a = await login(); await post(a, '/api/reports', good);
    const near = await post(a, '/api/reports/check-duplicates', { ...good, title: 'Pothole on Main Street', latitude: 13.0805, longitude: 80.2703 });
    expect(near.body.data.matches).toHaveLength(1); expect(near.body.data.matches[0].title).toBe(good.title);
    const far = await post(a, '/api/reports/check-duplicates', { title: 'Tree fallen', description: 'Large branch blocking road', category: 'Roads and potholes', latitude: 12.0, longitude: 79.0 });
    expect(far.body.data.matches).toHaveLength(0);
    const other = await post(a, '/api/reports/check-duplicates', { ...good, category: 'Water leakage' });
    expect(other.body.data.matches).toHaveLength(0);
  });
  test('owner can edit; others cannot edit or delete', async () => {
    const owner = await login('o@test.com'), other = await login('x@test.com', 'Other');
    const id = (await post(owner, '/api/reports', good)).body.data.report._id;
    expect((await other.patch(`/api/reports/${id}`).set(H).send({ title: 'Hijacked title' })).status).toBe(403);
    expect((await other.delete(`/api/reports/${id}`).set(H)).status).toBe(403);
    const ok = await owner.patch(`/api/reports/${id}`).set(H).send({ title: 'Updated title here' });
    expect(ok.status).toBe(200); expect(ok.body.data.report.title).toBe('Updated title here');
    expect((await owner.delete(`/api/reports/${id}`).set(H)).status).toBe(200);
  });
});

describe('administration', () => {
  test('non-admin cannot change status or see admin data', async () => {
    const u = await login(); const id = (await post(u, '/api/reports', good)).body.data.report._id;
    expect((await u.patch(`/api/admin/reports/${id}/status`).set(H).send({ status: 'Resolved' })).status).toBe(403);
    expect((await u.get('/api/admin/users')).status).toBe(403);
    expect((await request(app).get('/api/admin/stats')).status).toBe(401);
  });
  test('admin updates status and history is recorded; owner then locked out of edits', async () => {
    const u = await login(); const id = (await post(u, '/api/reports', good)).body.data.report._id;
    const admin = await adminAgent();
    const r = await admin.patch(`/api/admin/reports/${id}/status`).set(H).send({ status: 'Under Review', note: 'Inspecting' });
    expect(r.status).toBe(200);
    const h = r.body.data.report.statusHistory; expect(h).toHaveLength(2);
    expect(h[1]).toMatchObject({ previousStatus: 'Reported', newStatus: 'Under Review', note: 'Inspecting' }); expect(h[1].changedBy).toBeDefined();
    expect((await admin.patch(`/api/admin/reports/${id}/status`).set(H).send({ status: 'Bogus' })).status).toBe(400);
    expect((await u.patch(`/api/reports/${id}`).set(H).send({ title: 'Too late edit' })).status).toBe(409);
    const users = await admin.get('/api/admin/users'); expect(JSON.stringify(users.body)).not.toMatch(/passwordHash/);
    const stats = await request(app).get('/api/dashboard/stats'); expect(stats.body.data).toMatchObject({ total: 1, active: 1, resolved: 0 });
  });
});

describe('duplicate helpers', () => {
  test('text and distance utilities', () => {
    expect(jaccard(tokens('big pothole main street'), tokens('pothole on main street'))).toBeGreaterThan(0.5);
    expect(Math.round(haversine(13.08, 80.27, 13.0818, 80.27))).toBeGreaterThan(190);
  });
});
