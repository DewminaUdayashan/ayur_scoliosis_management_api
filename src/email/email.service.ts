/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

  constructor(private readonly configService: ConfigService) {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const gmailAppPassword =
      this.configService.get<string>('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailAppPassword) {
      this.logger.error(
        'GMAIL_USER or GMAIL_APP_PASSWORD not set in environment variables.',
      );
      throw new InternalServerErrorException(
        'Email service is not configured correctly.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for 587
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('Error connecting to Gmail SMTP:', error);
      } else {
        this.logger.log('Connected to Gmail SMTP successfully');
      }
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
  ): Promise<void> {
    const fromAddress = this.configService.get<string>('GMAIL_USER');

    try {
      const info = await this.transporter.sendMail({
        from: `"Ayurveda Clinic" <${fromAddress}>`,
        to,
        subject,
        html: htmlContent,
      });

      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }

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
}
