import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { env } from '../src/config/validateEnv.js';

// Setup test database connection
beforeAll(async () => {
  await mongoose.connect(env.MONGODB_URI);
});

// Clean up database after each test
afterEach(async () => {
  if (!mongoose.connection.db) {
    throw new Error('Database connection not established');
  }
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
}); 