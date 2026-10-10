// Usage: npm run seed            -> creates admin (+ demo user) from env vars
//        npm run seed -- --sample -> also inserts FICTIONAL demo reports
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Report from '../models/Report.js';
import { connectDB } from '../config/db.js';


async function upsert(name, email, password, role) {
  if (!email || !password) return null;

  let u = await User.findOne({ email: email.toLowerCase() });

  if (!u) {
    u = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role
    });
  } else {
  if (role === 'admin') {
    u.role = 'admin';
  }

  u.passwordHash = await bcrypt.hash(password, 12);
  await u.save();
}

  return u;
}

const SAMPLES = [
  ['Deep pothole near Example Market junction', 'Roads and potholes', 'Large pothole in the left lane causing vehicles to swerve. (Fictional demo data)', 'Example Market Junction, Demo City', 13.0827, 80.2707],
  ['Overflowing bin behind Sample Community Hall', 'Garbage and sanitation', 'Bin has not been emptied for a week and waste is spilling onto the road. (Fictional demo data)', 'Sample Community Hall, Demo City', 13.0878, 80.2785],
  ['Streetlight out on Demo Lane', 'Streetlights and electricity', 'Three consecutive streetlights are not working after dark. (Fictional demo data)', 'Demo Lane, Demo City', 13.0674, 80.2376],
  ['Water leaking from main pipe on Test Road', 'Water leakage', 'Continuous leak forming a puddle across the footpath. (Fictional demo data)', 'Test Road, Demo City', 13.0569, 80.2425]
];
await connectDB(process.env.MONGODB_URI);
const admin = await upsert(process.env.ADMIN_NAME || 'Admin', process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD, 'admin');
const demo = await upsert('Demo User', process.env.DEMO_USER_EMAIL, process.env.DEMO_USER_PASSWORD, 'user');
console.log(admin ? `Admin ready: ${admin.email}` : 'ADMIN_EMAIL/ADMIN_PASSWORD not set; no admin created.');
if (process.argv.includes('--sample')) {
  const owner = demo || admin;
  if (!owner) console.log('No user available to own sample reports.');
  else {
    await Report.deleteMany({ description: /\(Fictional demo data\)/ });
    await Report.insertMany(SAMPLES.map(([title, category, description, locationName, lat, lng]) => ({ title, category, description, locationName, location: { type: 'Point', coordinates: [lng, lat] }, createdBy: owner._id, statusHistory: [{ previousStatus: null, newStatus: 'Reported', note: 'Demo report', changedBy: owner._id }] })));
    console.log(`Inserted ${SAMPLES.length} fictional sample reports.`);
  }
}
await mongoose.disconnect();
