import dotenv from 'dotenv';
dotenv.config();
import { verifyMailer } from './config/index.js';
import http from 'http';
import app from './app.js';
import logger from './utils/logger.js';
import { initSocket } from './socket/index.js';

const PORT = process.env.PORT || 3000;
(async () => {
  await verifyMailer();
})();

const startServer = async () => {
  try {
    const server = http.createServer(app);
    await initSocket(server);

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
