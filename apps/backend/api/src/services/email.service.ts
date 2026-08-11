import { logger } from '../utils/logger';

export class EmailService {
    /**
     * Sends a password reset email to the user.
     * In a real-world scenario, this would use SendGrid, AWS SES, or Nodemailer.
     */
    static async sendPasswordResetEmail(email: string, token: string) {
        // Mock email sending
        const resetUrl = `http://localhost:3000/auth/reset-password?token=${token}`;
        
        logger.info(`[EmailService] Sending password reset email to ${email}`);
        logger.info(`[EmailService] Reset URL: ${resetUrl}`);
        
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        logger.info(`[EmailService] Email sent successfully to ${email}`);
        return true;
    }
}
