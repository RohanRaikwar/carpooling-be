if (process.env.NODE_ENV === 'production') {
  require('module-alias/register');
}
import dotenv from 'dotenv';
dotenv.config();
import { verifyMailer } from './config/mailer';

import http from 'http'; // Added: Import http module
import app from './app';
// import connectDB from './config/database';
// import { connectRedis } from './config/redis';
import logger from './utils/logger';

// import { initSocket } from './socket';

const PORT = process.env.PORT || 3000;
(async () => {
  await verifyMailer();
})();

const startServer = async () => {
  try {
    // await connectDB();
    // await connectRedis();

    const server = http.createServer(app); // Changed: Create http server
    // await initSocket(server); // Added: Initialize Socket.IO

    server.listen(PORT, () => {
      // Changed: Listen on the http server
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
