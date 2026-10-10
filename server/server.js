import 'dotenv/config';
import createApp from './app.js';
import { connectDB } from './config/db.js';
for (const k of ['MONGODB_URI', 'JWT_SECRET']) if (!process.env[k]) { console.error(`Missing env var ${k}. Copy .env.example to .env.`); process.exit(1); }
try {
  await connectDB(process.env.MONGODB_URI);
  const port = process.env.PORT || 5000;
  createApp().listen(port, () => console.log(`CivicSignal API listening on :${port}`));
} catch (e) { console.error(e.message); process.exit(1); }
