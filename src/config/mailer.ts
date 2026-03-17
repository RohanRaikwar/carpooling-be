import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  connectionTimeout: 5000, // 5s – fail fast if SMTP is unreachable
  greetingTimeout: 5000,
});

export const verifyMailer = async (): Promise<void> => {
  try {
    await transporter.verify();
    logger.info('Mailer connection verified');
  } catch (error) {
    logger.warn('Mailer verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export default transporter;
