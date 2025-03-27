import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getAllCallers,
  getCallerById,
  getCallerByPhone,
  createCaller,
  updateCaller,
  deleteCaller,
} from '../controllers/callerController';

const router = Router();

// All caller routes require authentication
router.use(protect);

// Caller routes
router.get('/', getAllCallers);
router.get('/phone/:phoneNumber', getCallerByPhone);
router.get('/:id', getCallerById);
router.post('/', createCaller);
router.patch('/:id', updateCaller);
router.delete('/:id', deleteCaller);

export default router; 