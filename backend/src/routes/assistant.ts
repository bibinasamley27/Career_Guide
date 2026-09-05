import { Router } from 'express';
import { assistantRateLimit, requireAuth } from '../middleware/auth';
import { chat } from '../controllers/assistantController';

const router = Router();
router.post('/chat', requireAuth, assistantRateLimit, chat);

export default router;