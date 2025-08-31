import nodemailer,  { createTransport, Transporter } from 'nodemailer';
export class EmailService {
    private transporter: Transporter;
    private isConfigured: boolean = false;

    constructor() {
        this.setupTransporter();
    }

    private setupTransporter(): void {
        const emailConfig = {
            host: process.env['SMTP_HOST'],
            port: parseInt(process.env['SMTP_PORT'] || '587'),
            secure: process.env['SMTP_SECURE'] === 'true', // true for 465, false for other ports
            auth: {
                user: process.env['SMTP_USER'],
                pass: process.env['SMTP_PASS'],
            },
        };

        // Check if email configuration is provided
        if (emailConfig.host && emailConfig.auth.user && emailConfig.auth.pass) {
            this.transporter = createTransport(emailConfig);
            this.isConfigured = true;
            console.log('Email service configured successfully');
        } else {
            console.warn('Email service not configured - missing environment variables');
            // Create a test transporter for development
            this.createTestTransporter();
        }
    }

    private async createTestTransporter(): Promise<void> {
        try {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            this.isConfigured = true;
            console.log('Test email account created:', testAccount.user);
        } catch (error) {
            console.error('Failed to create test email account:', error);
        }
    }

    public isReady(): boolean {
        return this.isConfigured;
        // return false; // Always return true for testing purposes
    }

    private generateEmailTemplate(type: string, data: any): EmailTemplate {
        const templates = {
            welcome: {
                subject: `Welcome ${data.name}!`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Our Service!</h2>
            <p>Hi <strong>${data.name}</strong>,</p>
            <p>Thank you for joining our service. We're excited to have you on board!</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p><strong>Your Details:</strong></p>
              <ul>
                <li>Name: ${data.name}</li>
                <li>Email: ${data.email}</li>
                <li>Age: ${data.age}</li>
                <li>Joined: ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Best regards,<br>The Team</p>
          </div>
        `,
                text: `Welcome ${data.name}!\n\nThank you for joining our service. We're excited to have you on board!\n\nYour Details:\n- Name: ${data.name}\n- Email: ${data.email}\n- Age: ${data.age}\n- Joined: ${new Date().toLocaleDateString()}\n\nIf you have any questions, feel free to contact our support team.\n\nBest regards,\nThe Team`
            },
            notification: {
                subject: `Notification: ${data.subject || 'Update'}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Notification</h2>
            <p>Hi there,</p>
            <p>${data.message}</p>
            <p>This notification was sent on ${new Date().toLocaleString()}</p>
            <p>Best regards,<br>The Team</p>
          </div>
        `,
                text: `Notification\n\nHi there,\n\n${data.message}\n\nThis notification was sent on ${new Date().toLocaleString()}\n\nBest regards,\nThe Team`
            },
            custom: {
                subject: data.subject || 'Message from Our Service',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Message</h2>
            <p>${data.message.replace(/\n/g, '<br>')}</p>
            <p>Sent on ${new Date().toLocaleString()}</p>
          </div>
        `,
                text: `${data.message}\n\nSent on ${new Date().toLocaleString()}`
            }
        };

        return templates[type as keyof typeof templates] || templates.custom;
    }

    public async sendEmail(to: string, type: string, data: any): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
        if (!this.isConfigured) {
            return { success: false, error: 'Email service not configured' };
        }

        try {
            const template = this.generateEmailTemplate(type, data);

            const mailOptions = {
                from: `"${process.env['SMTP_FROM_NAME'] || 'Your Service'}" <${process.env['SMTP_FROM_EMAIL'] || process.env['SMTP_USER']}>`,
                to: to,
                subject: template.subject,
                text: template.text,
                html: template.html,
            };

            const info = await this.transporter.sendMail(mailOptions);

            // Generate preview URL for test emails
            const previewUrl = process.env['NODE_ENV'] !== 'production'
                ? nodemailer.getTestMessageUrl(info)
                : undefined;

            console.log(`Email sent to ${to}: ${info.messageId}`);
            

            return {
                success: true,
                messageId: info.messageId,
                previewUrl: previewUrl || undefined
            };
        } catch (error) {
            console.error('Email sending failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    public async verifyConnection(): Promise<boolean> {
        if (!this.isConfigured) return false;

        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('Email connection verification failed:', error);
            return false;
        }
    }
}