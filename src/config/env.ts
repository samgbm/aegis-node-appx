import { config } from 'dotenv';
import { z } from 'zod';

config({ quiet: true });

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
