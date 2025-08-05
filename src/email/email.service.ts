import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const gmailAppPassword =
      this.configService.get<string>('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailAppPassword) {
      this.logger.error(
        'GMAIL_USER or GMAIL_APP_PASSWORD is not set in the environment variables.',
      );
      throw new InternalServerErrorException(
        'Email service is not configured correctly.',
      );
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });
  }

  /**
   * Sends an email using the configured transporter.
   * @param to The recipient's email address.
   * @param subject The subject of the email.
   * @param htmlContent The HTML content of the email.
   */
  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
  ): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Ayurveda Clinic" <${this.configService.get<string>('GMAIL_USER')}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to send email to ${to}`, err.stack);
    }
  }

  /**
   * Sends a welcome email to a new user.
   * @param email The recipient's email address.
   * @param name The recipient's name for personalization.
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Welcome to Ayurveda Clinic!';
    const htmlContent = `
      <h1>Welcome, ${name}!</h1>
      <p>Thank you for registering at Ayurveda Clinic. Your account has been created and is pending activation by an administrator.</p>
      <p>We will notify you once your account is active.</p>
      <br/>
      <p>Best regards,</p>
      <p>The Ayurveda Clinic Team</p>
    `;
    await this.sendEmail(email, subject, htmlContent);
  }

  /**
   * Sends a one-time password (OTP) to a user's email address.
   * @param email The recipient's email address.
   * @param name The recipient's name for personalization.
   * @param otp The 6-digit one-time password.
   */
  async sendOtpEmail(email: string, name: string, otp: string): Promise<void> {
    const subject = 'Your One-Time Password (OTP)';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Your One-Time Password</h2>
        <p>Hello ${name},</p>
        <p>Please use the following One-Time Password (OTP) to complete your action. This code is valid for 10 minutes.</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #fff; background-color: #007bff; padding: 10px 20px; border-radius: 5px; letter-spacing: 5px;">
            ${otp}
          </span>
        </div>
        <p style="color: #555;">If you did not request this code, please ignore this email or contact our support team immediately.</p>
        <p style="font-size: 0.9em; color: #888; text-align: center;">For your security, do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
        <p style="font-size: 0.8em; color: #aaa; text-align: center;">&copy; Ayurveda Clinic. All rights reserved.</p>
      </div>
    `;
    await this.sendEmail(email, subject, htmlContent);
  }

  /**
   * Sends a password reset OTP to a user's email address.
   * @param email The recipient's email address.
   * @param name The recipient's name for personalization.
   * @param otp The 6-digit one-time password for the reset.
   */
  async sendPasswordResetOtp(
    email: string,
    name: string,
    otp: string,
  ): Promise<void> {
    const subject = 'Your Password Reset Code';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Please use the code below to set up a new password. This code is valid for 10 minutes.</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #fff; background-color: #28a745; padding: 10px 20px; border-radius: 5px; letter-spacing: 5px;">
            ${otp}
          </span>
        </div>
        <p style="color: #555;">If you did not request a password reset, you can safely ignore this email. Only a person with access to your email can reset your account password.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
        <p style="font-size: 0.8em; color: #aaa; text-align: center;">&copy; Ayurveda Clinic. All rights reserved.</p>
      </div>
    `;
    await this.sendEmail(email, subject, htmlContent);
  }
}
