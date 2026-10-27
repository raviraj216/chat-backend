import { createApp } from './app';
import { createDatabase } from './config/database';
import { loadEnvironment } from './config/env';
import { createFirestore } from './config/firebase';
import { FirestoreMessageRepository } from './repositories/firestore-message-repository';
import { PrismaChatRepository } from './repositories/prisma-chat-repository';
import { ChatService } from './services/chat-service';

async function main(): Promise<void> {
  const env = loadEnvironment();
  const prisma = createDatabase(env);
  await prisma.$connect();
  try {
    const firestore = createFirestore(env);
    const service = new ChatService(new PrismaChatRepository(prisma), new FirestoreMessageRepository(firestore));
    const server = createApp(service).listen(env.PORT, () => console.log(`Chat backend listening on port ${env.PORT}`));
    server.on('error', () => {
      console.error('HTTP server could not start. Check PORT and process permissions.');
      void Promise.allSettled([prisma.$disconnect(), firestore.terminate()]).then(() => { process.exitCode = 1; });
    });
    let shuttingDown = false;
    const shutdown = (): void => {
      if (shuttingDown) return;
      shuttingDown = true;
      const timeout = setTimeout(() => process.exit(1), 10_000);
      timeout.unref();
      server.close(() => {
        void Promise.allSettled([prisma.$disconnect(), firestore.terminate()]).then(() => {
          clearTimeout(timeout);
          process.exitCode = 0;
        });
      });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error: unknown) {
    await prisma.$disconnect();
    throw error;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error && error.message.startsWith('Invalid environment:')
    ? error.message : 'Startup failed. Check MySQL connectivity and Firebase configuration.';
  console.error(message);
  process.exitCode = 1;
});
