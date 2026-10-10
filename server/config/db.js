import mongoose from 'mongoose';
export async function connectDB(uri) {
  if (!uri) throw new Error('MONGODB_URI is not set. Copy .env.example to .env and configure it.');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  } catch (e) {
    throw new Error(`Could not connect to MongoDB (${e.message}). Is it running and is MONGODB_URI correct?`);
  }
}
