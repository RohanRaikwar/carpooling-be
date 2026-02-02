import express from 'express';
import { createRide, getRides, joinRide } from '../controllers/rideController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// router.route('/').post(protect, authorize('driver', 'admin'), createRide).get(getRides);

// router.route('/:id/join').post(protect, joinRide);

export default router;
