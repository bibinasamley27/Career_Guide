import { Router } from 'express';
import multer from 'multer';
import { del, getById, getLatest, getRoadmap, update, upload } from '../controllers/resumeController';
import { requireAuth } from '../middleware/auth';
import { AppError, ValidationError } from '../middleware/errorHandler';

const storage = multer.memoryStorage();
const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 - 1 },
  fileFilter: (_req, file, callback) => {
    const name = file.originalname.toLowerCase();
    const allowed = name.endsWith('.pdf') || name.endsWith('.docx');
    if (!allowed) {
      callback(new Error('Unsupported file type. Please upload a PDF or DOCX resume.'));
      return;
    }
    callback(null, true);
  },
});

const router = Router();
router.use(requireAuth);
router.post('/upload', (req, res, next) => {
  uploadMiddleware.single('file')(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        next(new AppError('Resume file is too large. Maximum size is 5MB.', 413));
        return;
      }
      next(new ValidationError(error.message || 'Unsupported file type. Please upload a PDF or DOCX resume.'));
      return;
    }
    upload(req, res, next);
  });
});
router.get('/roadmap', getRoadmap);
router.get('/', getLatest);
router.get('/:resumeId', getById);
router.put('/:resumeId', update);
router.delete('/:resumeId', del);

export default router;
