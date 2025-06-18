import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV_VARS = ['MONGODB_URI', 'PORT'];

for (const varName of REQUIRED_ENV_VARS) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

export const env = {
  MONGODB_URI: process.env.MONGODB_URI as string,
  PORT: process.env.PORT as string,
}; 