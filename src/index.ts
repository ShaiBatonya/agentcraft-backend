import 'express-async-errors';
import express from 'express';
import { connectDB } from './config/db';
import { env } from './config/validateEnv';
import healthRouter from './routes/health';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());
app.use(healthRouter);

app.use(errorHandler);

const start = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

start(); 