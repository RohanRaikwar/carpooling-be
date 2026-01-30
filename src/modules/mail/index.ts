import { sendMail } from './mail.service';
import { SendMailPayload } from './mail.types';
import {
  signupOtpTemplate,
  loginOtpTemplate,
  resetOtpTemplate,
  signupWelcomeTemplate,
} from './mail.templates';

export default {
  sendMail,
  signupOtpTemplate,
  loginOtpTemplate,
  resetOtpTemplate,
  signupWelcomeTemplate,
};
