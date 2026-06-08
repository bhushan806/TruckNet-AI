// ── Environment Variable Configuration ──
// SECURITY: All secrets loaded from environment variables.
// SECURITY: Validated on startup — server refuses to start with missing/invalid config.
// SECURITY: JWT_SECRET and JWT_REFRESH_SECRET minimum length enforced (prevents weak secrets).

// SECURITY: CORS_ORIGIN required in production (no wildcard fallback).

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

// ── Minimum secret lengths for security compliance ──
const MIN_JWT_SECRET_LENGTH = 32; // 32 bytes minimum; 64 recommended

const envSchema = z.object({
    // ── Server ──
    PORT: z.string().default('10000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // ── Database (required always) ──
    DATABASE_URL: z.string().min(10, 'DATABASE_URL is required'),

    // ── JWT Secrets (required, minimum length enforced) ──
    JWT_SECRET: z
        .string()
        .min(MIN_JWT_SECRET_LENGTH, `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`),
    JWT_REFRESH_SECRET: z
        .string()
        .min(MIN_JWT_SECRET_LENGTH, `JWT_REFRESH_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`),

    // ── CORS (required in production) ──
    CORS_ORIGIN: isProd
        ? z.string().min(1, 'CORS_ORIGIN is required in production')
        : z.string().default('http://localhost:3000'),

    // ── AI Providers (optional — app falls back gracefully) ──
    GROQ_API_KEY: z.string().optional(),
    OLLAMA_HOST: z.string().optional(),
    HF_API_TOKEN: z.string().optional(),
    AI_ENGINE_URL: z.string().default('http://localhost:8000'),

    // ── Redis (optional — rate limiting degrades gracefully to in-memory) ──
    REDIS_URL: z.string().optional(),

    // ── Load Expiry Configuration ──
    LOAD_EXPIRY_MS: z.string().optional(),
});

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
    const formatted = envVars.error.errors
        .map(e => `  • ${e.path.join('.')}: ${e.message}`)
        .join('\n');
    process.stderr.write(
        `\n❌ TruckNet: Invalid environment variables:\n${formatted}\n\n` +
        `Copy .env.example to .env and fill in all required values.\n\n`
    );
    process.exit(1);
}

// ── Additional cross-field validation ──
if (envVars.data.JWT_SECRET === envVars.data.JWT_REFRESH_SECRET) {
    process.stderr.write(
        '\n❌ TruckNet: JWT_SECRET and JWT_REFRESH_SECRET must be DIFFERENT values.\n\n'
    );
    process.exit(1);
}

export const env = envVars.data;
