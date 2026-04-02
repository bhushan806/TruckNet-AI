// ── Environment Variable Configuration ──
// SECURITY: All secrets must come from environment variables, never hardcoded.
// Validated on startup — server refuses to start with missing/invalid config.

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

const envSchema = z.object({
    PORT: z.string().default('10000'),
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // AI provider keys (all optional — app falls back gracefully)
    GROQ_API_KEY: z.string().optional(),
    OLLAMA_HOST: z.string().optional(),
    HF_API_TOKEN: z.string().optional(),
    AI_ENGINE_URL: z.string().default('http://localhost:8000'),

    // SMS Service (FIX 7: Phone OTP authentication)
    // Register at https://www.fast2sms.com — free tier available for India
    FAST2SMS_API_KEY: z.string().optional(),

    // SECURITY: Restrict CORS to your frontend origin — required in production
    CORS_ORIGIN: isProd ? z.string() : z.string().default('*'),
});

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
    process.stderr.write(`❌ Invalid environment variables: ${JSON.stringify(envVars.error.format())}\n`);
    process.exit(1);
}

export const env = envVars.data;
