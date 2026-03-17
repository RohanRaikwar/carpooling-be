import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import logger from '../utils/logger.js';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });

const getDatabaseLogDetails = () => {
  if (!process.env.DATABASE_URL) {
    return { host: 'unknown', database: 'unknown' };
  }

  try {
    const databaseUrl = new URL(process.env.DATABASE_URL);
    return {
      host: databaseUrl.hostname || 'unknown',
      database: databaseUrl.pathname.replace(/^\//, '') || 'unknown',
    };
  } catch {
    return { host: 'unknown', database: 'unknown' };
  }
};

export const verifyDatabaseConnection = async () => {
  const details = getDatabaseLogDetails();

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.info(`PostgreSQL connected successfully (${details.host}/${details.database})`);
  } catch (error) {
    logger.error(`PostgreSQL connection failed (${details.host}/${details.database})`, error);
    throw error;
  }
};
