import express from 'express';
import cors from 'cors';
import { loadEnv } from './config/env';
import { router as authRouter } from './routes/auth.routes';
import { router as adminRouter } from './routes/admin.routes';

const env = loadEnv();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/auth', authRouter);
app.use('/admin', adminRouter);

export default app;

