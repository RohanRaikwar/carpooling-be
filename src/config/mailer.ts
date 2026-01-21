import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const verifyMailer = async (): Promise<void> => {
  try {
    console.log('MAIL CONFIG:', {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    });
    await transporter.verify();
    logger.info('Mailer connected successfully');
  } catch (error) {
    logger.error('Mailer connection failed', error);
  }
};

export default transporter;
