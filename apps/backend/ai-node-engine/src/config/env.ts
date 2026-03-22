// ── Environment Variable Configuration ──
// SECURITY: All secrets must come from environment variables, never hardcoded.
// Validated on startup — server refuses to start with missing/invalid config.

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

const envSchema = z.object({
    PORT: z.string().default('3001'),
    MONGODB_URI: z.string(),
    JWT_SECRET: z.string(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    GROQ_API_KEY: z.string().optional(),
    OLLAMA_HOST: z.string().optional(),
    CORS_ORIGIN: isProd ? z.string() : z.string().default('*'),
});

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
    process.stderr.write(`❌ Invalid environment variables: ${JSON.stringify(envVars.error.format())}\n`);
    process.exit(1);
}

export const env = envVars.data;
