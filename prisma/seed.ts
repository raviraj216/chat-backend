import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const users = [
    { id: 'user-a', name: 'Alice' },
    { id: 'user-b', name: 'Bob' },
    { id: 'user-c', name: 'Charlie' },
  ];
  for (const user of users) {
    await prisma.user.upsert({ where: { id: user.id }, create: user, update: { name: user.name } });
  }
  console.log('Seeded users:', users);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
