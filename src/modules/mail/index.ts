import { sendMail } from './mail.service.js';
import { SendMailPayload } from './mail.types.js';
import {
  signupOtpTemplate,
  loginOtpTemplate,
  resetOtpTemplate,
  signupWelcomeTemplate,
} from './mail.templates.js';

export default {
  sendMail,
  signupOtpTemplate,
  loginOtpTemplate,
  resetOtpTemplate,
  signupWelcomeTemplate,
};
