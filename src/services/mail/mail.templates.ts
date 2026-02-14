import { MailType } from "./mail.types";

export const getMailTemplate = (
  type: MailType,
  payload: any,
) => {
  switch (type) {
    case MailType.VERIFY_EMAIL:
      return {
        subject: 'Verify your email',
        html: `
          <h2>Email Verification</h2>
          <p>Click below to verify your email:</p>
          <a href="${payload.link}">Verify Email</a>
        `,
      };

    case MailType.RESET_PASSWORD:
      return {
        subject: 'Reset your password',
        html: `
          <h2>Password Reset</h2>
          <p>Click below to reset your password:</p>
          <a href="${payload.link}">Reset Password</a>
        `,
      };

    case MailType.PASSWORD_RESET_OTP:
      return {
        subject: 'Your Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #666;">We received a request to reset your password. Use the OTP below to proceed:</p>
            
            <div style="background-color: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center;">
              <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #007bff;">
                ${payload.otp}
              </p>
            </div>
            
            <p style="color: #666;"><strong>This OTP will expire in 10 minutes.</strong></p>
            
            <p style="color: #666;">If you didn't request a password reset, please ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">JobMitra - Job Portal | © ${new Date().getFullYear()}</p>
          </div>
        `,
      };

    case MailType.NOTIFICATION:
      return {
        subject: payload.subject,
        html: `
          <p>${payload.message}</p>
        `,
      };

    default:
      throw new Error('Invalid mail type');
  }
};
