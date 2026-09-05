import { Router } from 'express';
import { getRecommendations } from '../controllers/careerMatchingController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);
router.get('/recommendations', getRecommendations);

export default router;
