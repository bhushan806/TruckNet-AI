// ── SMS Provider Abstraction ──
// Provider-agnostic interface for sending SMS messages.
// Used by OTP service for both auth and driver invites.
//
// In development: logs OTP to console (no real SMS sent)
// In production: plug in Twilio, MSG91, or any provider

import { env } from '../config/env';
import { logger } from '../utils/logger';

// ── Provider Interface ──
export interface SmsProvider {
    sendSms(phone: string, message: string): Promise<void>;
}

// ── Console Provider (Development) ──
// Logs the SMS to console instead of sending a real message.
class ConsoleSmsProvider implements SmsProvider {
    async sendSms(phone: string, message: string): Promise<void> {
        logger.info('═══════════════════════════════════════════');
        logger.info(`📱 SMS to ${phone}: ${message}`);
        logger.info('═══════════════════════════════════════════');
        // Also log to stdout for maximum visibility in dev
        console.log('\n══════════════════════════════════════════');
        console.log(`📱 DEV SMS to ${phone}`);
        console.log(`   Message: ${message}`);
        console.log('══════════════════════════════════════════\n');
    }
}

// ── Twilio Provider (Production) ──
// Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER env vars
class TwilioSmsProvider implements SmsProvider {
    async sendSms(phone: string, message: string): Promise<void> {
        const accountSid = env.TWILIO_ACCOUNT_SID;
        const authToken = env.TWILIO_AUTH_TOKEN;
        const fromNumber = env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
            throw new Error(
                'Twilio credentials missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.'
            );
        }

        // Dynamic import to avoid requiring twilio as a dependency unless used
        try {
            // @ts-ignore — twilio is an optional peer dependency, only needed if OTP_PROVIDER=twilio
            const twilio = require('twilio');
            const client = twilio(accountSid, authToken);
            await client.messages.create({
                body: message,
                from: fromNumber,
                to: `+91${phone}`, // Indian phone numbers
            });
            logger.info('SMS sent via Twilio', { phone });
        } catch (error: any) {
            logger.error('Twilio SMS failed', { phone, error: error.message });
            throw error;
        }
    }
}

// ── Factory — picks provider based on env var ──
let _provider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
    if (_provider) return _provider;

    const providerName = env.OTP_PROVIDER || 'console';

    switch (providerName) {
        case 'twilio':
            _provider = new TwilioSmsProvider();
            logger.info('SMS provider: Twilio');
            break;
        case 'msg91':
            // MSG91 can be added here when needed
            logger.warn('MSG91 provider not implemented yet, falling back to console');
            _provider = new ConsoleSmsProvider();
            break;
        case 'console':
        default:
            _provider = new ConsoleSmsProvider();
            logger.info('SMS provider: Console (development mode)');
            break;
    }

    return _provider;
}
