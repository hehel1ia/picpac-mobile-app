import { Router } from 'express';
import { authed } from '../middleware/auth.js';

export const adminRouter = Router();

/** Проверочный маршрут для роли staff. Заменится настоящими в шаге 5. */
adminRouter.get('/ping', (req, res) => {
  const { user } = authed(req);
  res.json({ ok: true, role: user.role });
});
