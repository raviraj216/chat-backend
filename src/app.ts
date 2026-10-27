import express, { type Express } from 'express';
import { AppError } from './errors/app-error';
import { errorHandler } from './middleware/error-handler';
import { chatRoutes } from './routes/chat-routes';
import type { ChatService } from './services/chat-service';

export function createApp(service: ChatService): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(chatRoutes(service));
  app.use((_req, _res, next) => next(new AppError(404, 'ROUTE_NOT_FOUND', 'Route does not exist.')));
  // Express 5 forwards rejected async route promises here automatically.
  app.use(errorHandler);
  return app;
}
