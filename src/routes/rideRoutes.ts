import express from 'express';
import { createRide, getRides, joinRide } from '../controllers/rideController';
import { protect, authorize } from '../middlewares/auth';

const router = express.Router();

// router.route('/').post(protect, authorize('driver', 'admin'), createRide).get(getRides);

// router.route('/:id/join').post(protect, joinRide);

export default router;
