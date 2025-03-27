import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getAllDispatches,
  getActiveDispatches,
  getDispatchById,
  createDispatch,
  updateDispatch,
  deleteDispatch,
} from '../controllers/dispatchController';

const router = Router();

router.use(protect);

// Dispatch routes
router.get('/', getAllDispatches);
router.get('/active', getActiveDispatches);
router.get('/:id', getDispatchById);
router.post('/', createDispatch);
router.patch('/:id', updateDispatch);
router.delete('/:id', deleteDispatch);

export default router; 