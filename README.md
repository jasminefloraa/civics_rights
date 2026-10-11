 <div align="center">

  <img src="docs/civicsignal-logo.svg" alt="CivicSignal Logo" width="420" />

  ### A smarter way to report, discover, and track community issues.

  A full-stack civic issue reporting platform that connects residents with a transparent, trackable issue management workflow.

  <p>
    <a href="https://civics-rights.vercel.app/"><strong>Live Demo</strong></a> ·
    <a href="https://github.com/jasminefloraa/civics_rights"><strong>Source Code</strong></a>
  </p>

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

</div>

---

## Overview

**CivicSignal** is a full-stack community problem reporting application built with the MERN stack. It provides residents with a centralized way to report local issues, explore existing reports, identify potentially duplicate complaints, and follow progress as issues move through different stages.

Administrators can review reports, monitor community activity, and update report statuses with optional notes, helping make issue management more organized and transparent.

### The problem

Community problems such as potholes, overflowing garbage bins, damaged footpaths, drainage issues, and broken streetlights are often reported through disconnected channels. Residents may struggle to find existing complaints or understand whether an issue is being addressed.

### The solution

CivicSignal brings reporting, discovery, location-based visualization, and status tracking into one application.

## Live application

| Component | Link |
|---|---|
| Frontend | [civics-rights.vercel.app](https://civics-rights.vercel.app/) |
| Backend API | [civics-rights.onrender.com](https://civics-rights.onrender.com/) |
| API health check | [Check API status](https://civics-rights.onrender.com/api/health) |
| GitHub repository | [jasminefloraa/civics_rights](https://github.com/jasminefloraa/civics_rights) |

*Note: The backend may take longer to respond after a period of inactivity on a free hosting instance.*

## Key features

### Resident experience

- **Secure authentication** — registration, login, logout, profile updates, and password changes.
- **Issue reporting** — submit a title, description, category, and location, with an optional photo.
- **Location-based reporting** — choose a location on a map or use available geolocation support.
- **Explore reports** — browse community reports using list and map views.
- **Search and filtering** — narrow reports by keyword, category, status, and date.
- **Report details** — review issue information, location, photos, and status history.
- **My Reports** — manage your own reports, with editing and deletion restricted by report status.
- **Duplicate detection** — discover potentially similar reports before submitting a new issue.

### Administration

- **Admin dashboard** — review community activity and reporting statistics.
- **Report management** — search, filter, and inspect submitted reports.
- **Status updates** — move reports through the available workflow: Reported, Under Review, In Progress, Resolved, or Rejected.
- **Status notes** — attach an optional note when changing a report's status.
- **User overview** — view user information without exposing password data.
- **Role-based authorization** — restrict administrative actions to authorized users.

## How it works

1. A resident creates an account and submits a community issue.
2. CivicSignal checks for potentially similar reports based on category, location, and text similarity.
3. The resident can review suggested duplicates before deciding whether to continue.
4. The report becomes available in the reporting system.
5. An administrator reviews the report and updates its status as work progresses.
6. Residents can revisit the report to check its details and status history.

## Screenshots

Screenshots of the actual deployed application can be added here.

Create a `docs/screenshots/` directory and save your own screenshots in it. For example:

| Page | Suggested filename |
|---|---|
| Landing page | `docs/screenshots/home.png` |
| Explore reports | `docs/screenshots/explore.png` |
| Report details | `docs/screenshots/report-details.png` |
| Admin dashboard | `docs/screenshots/admin-dashboard.png` |

After adding the images, display them in this section using Markdown:

```md
![CivicSignal landing page](docs/screenshots/home.png)
![Explore community reports](docs/screenshots/explore.png)
![Admin dashboard](docs/screenshots/admin-dashboard.png)
```

Only include screenshots that you have actually captured from your application.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens, HTTP-only cookies, bcryptjs |
| Maps | Leaflet, OpenStreetMap |
| File uploads | Multer |
| Security | Helmet, CORS, express-rate-limit, server-side authorization |
| Testing | Jest, Supertest |
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Version control | Git, GitHub |

## Architecture

```text
                 RESIDENT / ADMIN
                         |
                         v
               React + Vite Frontend
                    (Vercel)
                         |
                   HTTPS / API
                         |
                         v
                  Express Backend
                     (Render)
                         |
             +-----------+-----------+
             |           |           |
             v           v           v
         MongoDB     Auth & Role   Report and
          Atlas      Middleware    Admin APIs
```

The frontend communicates with the backend through API routes. MongoDB stores application data, while server-side authorization protects administrative and report-management operations.

## Duplicate detection

CivicSignal includes a lightweight, rule-based duplicate detection mechanism. It does **not** use an AI or machine-learning model.

The system evaluates recent reports in the same category using two signals:

- **Geographical proximity:** distance calculated using the Haversine formula.
- **Text similarity:** Jaccard similarity between word sets extracted from the report title and description, after stop-word removal.

The two scores are combined with equal weighting. Candidates meeting the configured similarity threshold are presented to the resident for review.

This approach helps surface potentially related reports while leaving the final submission decision to the user.

## Project structure

```text
civics_rights/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── context/
│   │   ├── services/
│   │   └── hooks/
│   ├── vercel.json
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── scripts/
│   ├── tests/
│   ├── uploads/
│   └── package.json
│
├── docs/
│   ├── civicsignal-logo.svg
│   └── screenshots/
│
├── .gitignore
└── README.md
```

## Getting started
## AI-assisted development

**AI development tool:** Kiro

Kiro was used as a development assistant to review the CivicSignal codebase, understand its architecture, and identify an edge case in report search handling.

Tasks completed with Kiro assistance:

1. Reviewed the frontend and backend structure, including Express routes, controllers, models, middleware, and React components.
2. Identified an issue where whitespace-only search queries were not normalized before filtering reports.
3. Updated the report-search controller to trim query whitespace and limit the query length.
4. Added API test assertions for empty and whitespace-only search queries.
5. Ran the backend Jest and Supertest test suite to validate the changes.

The suggested changes were reviewed and tested in the local project. AI assistance was used to support development and testing, not as a replacement for understanding or validating the code.

Follow these steps to run CivicSignal locally.

### Prerequisites

- Node.js 18 or later
- npm
- A MongoDB instance, either local MongoDB or MongoDB Atlas
- Git

### 1. Clone the repository

```bash
git clone https://github.com/jasminefloraa/civics_rights.git
cd civics_rights
```

### 2. Configure the backend

```bash
cd server
npm install
```

Copy the example environment file:

```bash
cp .env.example .env
```

On Windows Command Prompt, use:

```bat
copy .env.example .env
```

Open `server/.env` and configure the required values:

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
DUPLICATE_RADIUS_METERS=200

ADMIN_NAME=Your Admin Name
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_strong_password

DEMO_USER_EMAIL=demo@example.com
DEMO_USER_PASSWORD=replace_with_a_strong_password
```

Use the actual variable names and defaults in `server/.env.example` as the source of truth if your local version contains additional settings.

**Security:** Replace example passwords and the JWT secret with your own values. Never commit `.env` files or publish credentials.

### 3. Initialize the database

From the `server` directory, run:

```bash
npm run seed
```

This initializes the administrator and demo account using the configured environment variables.

Optionally, create fictional sample reports if you want to explore the application with sample data:

```bash
npm run seed -- --sample
```

Run the seed script against your local database while developing. Do not use demo credentials for a production administrator account.

### 4. Start the backend

From the `server` directory:

```bash
npm run dev
```

The API should be available at:

`http://localhost:5000`

### 5. Configure and start the frontend

Open a second terminal:

```bash
cd client
npm install
```

Copy the frontend example environment file:

```bash
cp .env.example .env
```

The frontend example may include `VITE_API_URL`, `VITE_MAP_LAT`, and `VITE_MAP_LNG`. Follow the values and comments in your local `client/.env.example`. For local development, the Vite configuration proxies `/api` and `/uploads` requests to the backend.

Start the development server:

```bash
npm run dev
```

Open:

`http://localhost:5173`

## API overview

The backend exposes JSON API endpoints under the `/api` prefix.

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Public |
| GET | `/api/auth/me` | Authenticated user |
| GET | `/api/reports` | Public |
| POST | `/api/reports` | Authenticated user |
| GET | `/api/reports/my-reports` | Authenticated user |
| GET | `/api/reports/:id` | Public |
| POST | `/api/reports/check-duplicates` | Authenticated user |
| PATCH / DELETE | `/api/reports/:id` | Owner, while status is Reported |
| GET | `/api/dashboard/stats` | Public |
| GET | `/api/dashboard/recent` | Public |
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/reports` | Admin |
| GET | `/api/admin/users` | Admin |
| PATCH | `/api/admin/reports/:id/status` | Admin |
| PATCH | `/api/users/me` | Authenticated user |
| PATCH | `/api/users/me/password` | Authenticated user |
| GET | `/api/users/me/summary` | Authenticated user |
| GET | `/api/health` | Public |

State-changing requests require the custom `X-Requested-With: CivicSignal` header. Authenticated endpoints also require the expected authentication credentials.

See the backend routes for request bodies, query parameters, validation rules, and response formats.

## Testing

Run the backend test suite:

```bash
cd server
npm test
```

The project includes Jest and Supertest tests covering authentication, report validation, duplicate matching, access control, and administrative status updates.

## Deployment

CivicSignal is deployed using the following services:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

### Frontend deployment

The frontend is hosted at [civics-rights.vercel.app](https://civics-rights.vercel.app/).

The Vercel project uses the `client` directory as its root, with Vite as the framework and `dist` as the build output. The `client/vercel.json` configuration forwards API and upload requests to the Render backend.

### Backend deployment

The backend runs on Render. Its environment variables must be configured in the Render dashboard rather than committed to GitHub.

### Database deployment

MongoDB Atlas hosts the database. Network access rules should be configured carefully, and production credentials must be strong and private.

### Production considerations

- Use unique production secrets and administrator credentials.
- Configure the frontend origin and cookie settings correctly for cross-origin authentication.
- Do not rely on a temporary local filesystem for persistent user uploads. Render's ephemeral filesystem can lose uploaded files when an instance restarts or is redeployed; use durable storage for production image hosting.
- Review logs and error handling before exposing the application to a wider audience.
- Keep dependencies updated and review security advisories.

## Security

Security-related protections implemented in the backend include:

- Password hashing using bcrypt.
- HTTP-only authentication cookies.
- Server-side role and ownership checks.
- Origin-aware CORS configuration and a custom request-header check.
- Helmet security headers.
- Rate limiting on selected endpoints.
- Input validation and upload restrictions.
- Production error responses that avoid exposing stack traces.

These controls should be reviewed and tested as the application evolves.

## Current limitations

- Duplicate detection evaluates a bounded set of recent reports rather than the entire database.
- Persistent cloud image storage requires a suitable storage adapter; local disk storage is not durable on ephemeral hosting.
- Email verification and password-reset flows are not implemented.
- Administrative role assignment is handled outside the regular user interface.
- Frontend automated test coverage can be expanded.

## Roadmap

Potential future improvements include:

- Persistent cloud image storage.
- Email notifications when a report's status changes.
- Password reset and email verification.
- Automated frontend tests.
- Better map clustering for areas with many reports.
- Additional accessibility and mobile usability improvements.

## Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes and test them locally.
4. Commit your changes with a clear message.
5. Open a pull request describing the improvement.

For significant changes, open an issue first to discuss the proposed implementation.

## Author

**Jasmine Flora J**

B.Tech Computer Science and Engineering student | Aspiring Software Developer

- GitHub: [@jasminefloraa](https://github.com/jasminefloraa)
- LinkedIn: [Jasmine Flora](https://www.linkedin.com/in/jasmine-flora/)

---

<div align="center">

  **CivicSignal — Report local problems. Track real progress.**

  <sub>Built to make community issue reporting more organized, accessible, and transparent.</sub>

</div>
