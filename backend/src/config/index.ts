import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().positive().default(5000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  AI_MAX_AGENT_STEPS: z.coerce.number().int().positive().default(8),
  AI_MAX_MESSAGE_LENGTH: z.coerce.number().int().positive().default(2000),
  AI_MAX_HISTORY_MESSAGES: z.coerce.number().int().positive().default(20),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
});

const validateEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variable configuration:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
};

export const config = validateEnv();
export type Config = z.infer<typeof envSchema>;
