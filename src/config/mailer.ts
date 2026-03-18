import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
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

const getMailerLogMeta = () => ({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 587,
  hasUser: Boolean(process.env.MAIL_USER),
  hasPass: Boolean(process.env.MAIL_PASS),
  hasFrom: Boolean(process.env.MAIL_FROM),
});

console.log('[MAILER] Config loaded', getMailerLogMeta());

export const verifyMailer = async (): Promise<boolean> => {
  const mailerMeta = getMailerLogMeta();

  if (!mailerMeta.hasUser || !mailerMeta.hasPass || !mailerMeta.hasFrom) {
    console.warn('[MAILER] Variables are incomplete', mailerMeta);
  }

  try {
    await transporter.verify();
    console.log('[MAILER] Connection verified', mailerMeta);
    return true;
  } catch (error) {
    console.error('[MAILER] Verification failed', {
      ...mailerMeta,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

export default transporter;
