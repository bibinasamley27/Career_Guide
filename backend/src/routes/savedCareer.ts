import { Router } from 'express';
import { list, remove, save } from '../controllers/savedCareerController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);
router.get('/saved', list);
router.post('/:careerId/save', save);
router.delete('/:careerId/save', remove);

export default router;
