import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  authRouter,
  travelPreferenceRouter,
  vehiclesRouter,
  mapRouter,
  userRouter,
} from '@modules';
import rideRoutes from './routes/rideRoutes';
import connectDB from '@config/database';
import { protect, errorHandler } from '@middlewares';

const app = express();
connectDB();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', protect, userRouter);
app.use('/api/v1/rides', rideRoutes);
app.use('/api/v1/vehicles', protect, vehiclesRouter);
app.use('/api/v1/travel-preferences', protect, travelPreferenceRouter);
app.use('/api/v1/maps', protect, mapRouter);

app.use(errorHandler);

export default app;
