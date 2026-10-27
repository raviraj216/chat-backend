import { PrismaClient } from '@prisma/client';
import type { Environment } from './env';

export function createDatabase(env: Environment): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
}
