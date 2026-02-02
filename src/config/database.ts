import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/carpooling';
    await mongoose.connect(mongoURI);
    console.log(`Connecting to MongoDB at ${mongoURI}`);

    logger.info('MongoDB Connected...');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export default connectDB;
