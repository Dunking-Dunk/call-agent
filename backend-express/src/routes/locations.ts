import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getAllLocations,
  getLocationById,
  getLocationsByCity,
  getLocationsByDistrict,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/locationController';

const router = Router();

router.use(protect);

// Location routes
router.get('/', getAllLocations);
router.get('/city/:city', getLocationsByCity);
router.get('/district/:district', getLocationsByDistrict);
router.get('/:id', getLocationById);
router.post('/', createLocation);
router.patch('/:id', updateLocation);
router.delete('/:id', deleteLocation);

export default router; 