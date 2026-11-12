import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { adminRouter } from './admin.js';
import { healthRouter } from './health.js';
import { meRouter } from './me.js';

export const api = Router();

api.use('/health', healthRouter);

api.use('/me', requireAuth, meRouter);

api.use('/admin', requireAuth, requireRole('support', 'admin'), adminRouter);
