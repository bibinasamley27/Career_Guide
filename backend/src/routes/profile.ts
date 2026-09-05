import { Router } from 'express';
import { get, options, update } from '../controllers/profileController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);
router.get('/', get);
router.get('/options', options);
router.put('/', update);

export default router;
