import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import rideRoutes from './routes/rideRoutes';
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

export default app;
