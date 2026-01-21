import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import rideRoutes from './routes/rideRoutes';
import vehiclesRouter from './modules/vehicles/vehicle.routes';
import travelPreferenceRoutes from './modules/travel-preferences/travelPreference.routes';
import connectDB from './config/database';
import * as middleware from './middleware';

const app = express();
connectDB();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', middleware.protect as express.RequestHandler, userRoutes);
app.use('/api/v1/rides', rideRoutes);
app.use('/api/v1/vehicles', middleware.protect as express.RequestHandler, vehiclesRouter);
app.use(
  '/api/v1/travel-preferences',
  middleware.protect as express.RequestHandler,
  travelPreferenceRoutes,
);

export default app;
