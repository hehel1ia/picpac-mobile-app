import { Router } from 'express';
import { authed } from '../middleware/auth.js';

export const adminRouter = Router();


adminRouter.get('/ping', (req, res) => {
  const { user } = authed(req);
  res.json({ ok: true, role: user.role });
});
