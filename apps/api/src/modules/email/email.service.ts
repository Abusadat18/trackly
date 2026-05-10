import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('resend.apiKey');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails will be logged instead of sent');
    }
  }

  async sendInvitation(params: {
    to: string;
    orgName: string;
    inviterName: string;
    acceptUrl: string;
  }): Promise<void> {
    const subject = `You've been invited to join ${params.orgName} on Trackly`;
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <h2 style="color: #0f172a;">You're invited!</h2>
        <p style="color: #475569; line-height: 1.6;">
          <strong>${params.inviterName}</strong> has invited you to join
          <strong>${params.orgName}</strong> on Trackly.
        </p>
        <div style="margin: 24px 0;">
          <a href="${params.acceptUrl}"
             style="display: inline-block; padding: 12px 24px; background: #6366f1;
                    color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">
          This invitation expires in 7 days. If you didn't expect this email, you can ignore it.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">Trackly — Employee Time Tracking</p>
      </div>
    `;

    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: 'Trackly <no-reply@mail.abusadat.dev>',
          to: params.to,
          subject,
          html,
        });
        this.logger.log(`Invitation email sent to ${params.to}`);
      } catch (err: any) {
        this.logger.error(`Failed to send email to ${params.to}: ${err?.message}`);
        throw err;
      }
    } else {
      this.logger.log(`[DEV] Email to ${params.to}:`);
      this.logger.log(`  Subject: ${subject}`);
      this.logger.log(`  Accept URL: ${params.acceptUrl}`);
    }
  }
}
