import { Router } from 'express';
import { authed } from '../middleware/auth.js';
import { unwrap } from '../lib/errors.js';

export const meRouter = Router();

meRouter.get('/', async (req, res) => {
  const { user, db } = authed(req);
  const profile = unwrap(
    await db.from('profiles').select('id, full_name, phone, role, created_at').eq('id', user.id).single(),
  );
  res.json({ user: { id: user.id, email: user.email, isAnonymous: user.isAnonymous }, profile });
});
