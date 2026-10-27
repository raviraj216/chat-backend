import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url().refine((url) => url.startsWith('mysql://'), 'Must be a MySQL URL.'),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIRESTORE_EMULATOR_HOST: z.string().regex(/^[^/:\s]+:\d+$/, 'Use host:port without http://.').optional(),
}).superRefine((env, ctx) => {
  if (env.NODE_ENV === 'production' && env.FIRESTORE_EMULATOR_HOST) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['FIRESTORE_EMULATOR_HOST'], message: 'Emulator configuration is not allowed in production.' });
  }
});

export type Environment = z.infer<typeof schema>;

export function loadEnvironment(): Environment {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    // Do not include configuration values or credentials in startup errors.
    throw new Error(`Invalid environment: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
  }
  return result.data;
}
