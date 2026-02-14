import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export class MailService {
  static async sendMail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }) {
    await transporter.sendMail({
      from: `"JobMitra" <${process.env.MAIL_FROM}>`,
      to,
      subject,
      html,
    });
  }
}
