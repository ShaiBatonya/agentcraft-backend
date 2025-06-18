// db.ts
// Connects to MongoDB using Mongoose. Exits the process if connection fails.

import mongoose from 'mongoose';
import { env } from './validateEnv.js';

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}; 