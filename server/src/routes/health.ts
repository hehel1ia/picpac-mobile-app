import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'PicPac backend is running!', time: new Date().toISOString() });
});
