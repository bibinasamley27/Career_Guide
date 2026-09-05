import { Router } from 'express';
import { get } from '../controllers/skillGapController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);
router.get('/:careerId/skill-gap', get);

export default router;
