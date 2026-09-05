import { Router } from 'express';
import { get, questions, save } from '../controllers/assessmentController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);
router.get('/questions', questions);
router.get('/', get);
router.post('/', save);
router.put('/', save);

export default router;
