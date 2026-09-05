import { Router } from 'express';
import { run } from '../controllers/careerGuideController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.post('/career-guide', requireAuth, run);

export default router;
