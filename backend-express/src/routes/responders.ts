import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getAllResponders,
  getAvailableResponders,
  getRespondersByType,
  getResponderById,
  createResponder,
  updateResponder,
  updateResponderStatus,
  deleteResponder,
} from '../controllers/responderController';

const router = express.Router();

router.use(protect);

router.get('/', getAllResponders);

router.get('/available', getAvailableResponders);

router.get('/type/:type', getRespondersByType);

router.get('/:id', getResponderById);

router.post('/', createResponder);

router.patch('/:id', updateResponder);

router.patch('/:id/status', updateResponderStatus);

router.delete('/:id', deleteResponder);

export default router; 