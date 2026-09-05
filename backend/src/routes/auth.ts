import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController';
import { requireAuth, authRateLimit } from '../middleware/auth';

const router = Router();

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
