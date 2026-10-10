# CivicSignal — Community Problem Reporting System
*Report local problems. Track real progress.*

CivicSignal is a MERN application where residents report local problems (potholes, garbage, streetlights, water leaks, drainage, damaged property, footpaths), see whether a problem is already reported, and follow each report's status history.

## Problem statement
Community issues are often reported through scattered channels with no visibility into duplicates or progress. CivicSignal gives residents a single place to report, search, map and track issues, and gives administrators a review workflow with an audit trail.

## Features
- Register / login / logout (bcrypt hashing, JWT in an HTTP-only cookie), profile update, password change
- Submit reports with category, description, location name, map-picked or geolocated coordinates and an optional photo (JPG/PNG/WebP, 5 MB)
- Duplicate detection before submission (see below); the user always decides
- Public Explore page: list + map views, text search, category/status/date filters, sorting, pagination (all server-side)
- Report details with map, photo, and status timeline
- Owners can edit/delete their report **only while its status is "Reported"**
- Admin area: stats, search/filter, status change with optional note, user list (no password data)
- Dashboard and landing statistics computed from the database

## Screenshots
No screenshots are committed. Run the app, capture real screenshots, save them in `docs/screenshots/` and reference them here.

## Tech stack
MongoDB + Mongoose, Express, React 18 + Vite, Node.js (ES modules), React Router, Leaflet + OpenStreetMap, Multer, bcryptjs, jsonwebtoken, Helmet, CORS, express-rate-limit, Jest + Supertest. Styling is plain CSS (Inter, black/white/grey); icons are Lucide.

## Structure
```
civicsignal/
  client/src/{components,pages,layouts,context,services,hooks}   React app
  server/{config,controllers,middleware,models,routes,services,scripts,tests,uploads}
```

## Prerequisites
Node.js 18+ and a MongoDB instance (local, or MongoDB Atlas).

## Setup
```bash
# Backend
cd server && cp .env.example .env     # edit MONGODB_URI, JWT_SECRET, admin/demo credentials
npm install
npm run seed                          # creates admin (+ demo user) from env vars
npm run seed -- --sample              # optional: adds 4 FICTIONAL demo reports
npm run dev                           # http://localhost:5000

# Frontend (second terminal)
cd client && cp .env.example .env && npm install
npm run dev                           # http://localhost:5173 (proxies /api and /uploads to :5000)
```
Admin and demo credentials come only from `server/.env`; there is no public way to become an admin. Treat demo credentials as development-only.

### MongoDB
Local: install MongoDB Community and use `mongodb://127.0.0.1:27017/civicsignal`. Atlas: create a free cluster, add a database user, allow your IP, and paste the connection string into `MONGODB_URI`.

## Environment variables
Server: `PORT, NODE_ENV, MONGODB_URI, JWT_SECRET, CLIENT_URL` (comma-separated allowed origins), `DUPLICATE_RADIUS_METERS`, `IMAGE_STORAGE` (`local` or empty), seed vars `ADMIN_NAME/EMAIL/PASSWORD`, `DEMO_USER_EMAIL/PASSWORD`, optional `COOKIE_SAMESITE`.
Client: `VITE_API_URL` (empty in dev; deployed API origin in production), `VITE_MAP_LAT`, `VITE_MAP_LNG`.

## Duplicate detection algorithm (no AI/ML)
For a new report, candidates are existing non-rejected reports with the **same category** (latest 300). Each gets `score = 0.5 × proximity + 0.5 × text`, where proximity = `1 − distance/radius` (Haversine, radius default 200 m, 0 if outside or no coordinates) and text = Jaccard similarity of word sets from title + description (stop-words removed). Scores ≥ 0.2 are returned (top 5). The UI shows them and lets the user open one or submit anyway.

## API (all JSON, prefix `/api`; state-changing requests need header `X-Requested-With: CivicSignal`)
| Method | Path | Access |
|---|---|---|
| POST | /auth/register, /auth/login, /auth/logout | public |
| GET | /auth/me | user |
| GET | /reports (q, category, status, from, to, sort=newest\|oldest\|updated, page, limit) | public |
| GET | /reports/my-reports | user |
| GET | /reports/:id | public |
| POST | /reports (multipart; optional `image`) | user |
| POST | /reports/check-duplicates | user |
| PATCH / DELETE | /reports/:id | owner, status "Reported" only |
| GET | /dashboard/stats, /dashboard/recent | public |
| GET | /admin/stats, /admin/reports, /admin/users | admin |
| PATCH | /admin/reports/:id/status `{status, note}` | admin |
| PATCH | /users/me, /users/me/password | user |
| GET | /users/me/summary | user (added for the profile page) |
| GET | /health | public |

## Testing
```bash
cd server && npm test
```
Uses `mongodb-memory-server` (downloads a MongoDB binary on first run). To use an existing MongoDB instead: `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/civic_test npm test`. 12 tests cover registration/duplicate email, admin self-assignment, login, CSRF header, report validation/creation, list/search/filter/pagination, duplicate matching, ownership checks, non-admin status changes, and admin status history.

## Security considerations
bcrypt (cost 12); HTTP-only, `Secure` (production), SameSite cookies; CSRF defence via SameSite + origin-locked CORS + required custom header; Helmet; 100 kb JSON limit; rate limits on auth, report creation and duplicate checks; regex input escaped in search; roles enforced server-side; uploads checked by MIME type, size, **and magic bytes**; stack traces hidden in production.

## Known limitations
- **Image storage is local-disk only** (`IMAGE_STORAGE=local`). Cloudinary is *not* implemented. Local files vanish on most hosts (ephemeral disks), so production needs a cloud storage adapter in `server/middleware/upload.js`. With storage unset, uploads are refused with a clear 503 message.
- Cross-site deployments (frontend and API on different registrable domains) need `COOKIE_SAMESITE=none` and HTTPS; same-site deployments are simpler.
- Duplicate detection scans the latest 300 same-category reports (fine for small deployments).
- Admin cannot assign roles through the UI (use the seed script).
- No email verification or password reset. No frontend automated tests. The UI has not been checked in a real browser in the build environment.

## Deployment (not yet deployed)
Create an Atlas cluster; deploy `server/` (e.g. Render/Railway) with the env vars above, `NODE_ENV=production`, `CLIENT_URL` = your frontend origin; deploy `client/` (e.g. Netlify/Vercel, build `npm run build`, output `dist`, SPA fallback to `index.html`) with `VITE_API_URL` = API origin. Use `/api/health` as the health check. Run `npm run seed` once against production with strong admin credentials.

## AI coding tool used
Claude (Anthropic), in a chat session with a sandboxed shell.

## How AI was used
Claude generated the project from the written specification. Specific tasks:
1. Wrote the Express API, Mongoose models and role/ownership middleware.
2. Designed and implemented the duplicate-detection scoring service.
3. Wrote the Jest/Supertest suite and diagnosed that MongoDB binaries could not be downloaded in the sandbox, switching tests to an alternative MongoDB-compatible server.
4. Built the React pages, Leaflet map component and monochrome CSS.
5. Wrote this README.

## Future improvements
Cloudinary adapter, admin role management, password reset, frontend tests, clustering for dense maps, notifications on status change.
