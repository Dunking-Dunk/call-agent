import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getAllSessions,
  getActiveSessions,
  getSessionById,
  createSession,
  updateSession,
  updateSessionStatus,
  addTranscriptEntry,
  deleteSession,
} from '../controllers/sessionController';

const router = Router();

router.post('/', createSession);
router.post('/:id/transcript', addTranscriptEntry);

router.get('/', protect, getAllSessions);
router.get('/active', protect, getActiveSessions);
router.get('/:id', protect, getSessionById);
router.patch('/:id', protect, updateSession);
router.patch('/:id/status', protect, updateSessionStatus);
router.delete('/:id', protect, deleteSession);

export default router; 