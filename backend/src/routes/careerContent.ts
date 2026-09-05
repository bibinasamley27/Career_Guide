import { Router } from 'express';
import { getProjects, getResources } from '../controllers/careerContentController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);
router.get('/:careerId/resources', getResources);
router.get('/:careerId/projects', getProjects);

export default router;
