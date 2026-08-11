// ── Admin Seed — Idempotent, Mongoose-based ──
// SECURITY RULES:
//   - Credentials come ONLY from environment variables
//   - Real password NEVER logged, committed, or hardcoded
//   - Safe to run on every server startup (idempotent)
//   - Uses bcrypt (12 rounds in production, 10 in dev)
//   - Compatible with existing User model and AuthService
//
// Usage: automatically called from app.ts on startup when
//        ADMIN_EMAIL and ADMIN_PASSWORD env vars are set.

import bcrypt from 'bcrypt';
import { UserModel } from '../models/mongoose/User';
import { env } from './env';
import { logger } from '../utils/logger';

const BCRYPT_ROUNDS = env.NODE_ENV === 'production' ? 12 : 10;

export async function seedAdmin(): Promise<void> {
    const adminEmail = env.ADMIN_EMAIL;
    const adminPassword = env.ADMIN_PASSWORD;

    // Skip silently if not configured — admin seeding is optional
    if (!adminEmail || !adminPassword) {
        logger.info('Admin seed skipped — ADMIN_EMAIL or ADMIN_PASSWORD not set in environment');
        return;
    }

    try {
        // Check if admin already exists
        const existing = await UserModel.findOne({ email: adminEmail.toLowerCase() });

        if (existing) {
            // Update role to ADMIN if somehow demoted (safety net)
            if (existing.role !== 'ADMIN') {
                await UserModel.findByIdAndUpdate(existing._id, {
                    role: 'ADMIN',
                    isVerified: true,
                    isActive: true,
                });
                logger.warn('Admin seed: existing user upgraded to ADMIN role', {
                    userId: existing._id.toString(),
                });
            } else {
                logger.info('Admin seed: admin user already exists, skipping creation');
            }
            return;
        }

        // Create admin user — NEVER log the password itself
        const hashedPassword = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

        await UserModel.create({
            email: adminEmail.toLowerCase().trim(),
            phone: '0000000000', // Required field — placeholder for admin account
            name: 'Platform Administrator',
            password: hashedPassword,
            role: 'ADMIN',
            isVerified: true,
            isActive: true,
        });

        // SECURITY: Only log that seeding happened, not the password or hash
        logger.info('Admin seed: Admin user created successfully', {
            email: adminEmail.toLowerCase(),
        });
    } catch (err: any) {
        // Admin seeding failure is critical — log and surface it
        logger.error('Admin seed failed', { error: err.message });
        // Don't crash the server — admin can be created manually if seed fails
    }
}
