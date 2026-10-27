import { Router } from 'express';
import { ChatController } from '../controllers/chat-controller';
import type { ChatService } from '../services/chat-service';

export function chatRoutes(service: ChatService): Router {
  const router = Router();
  const controller = new ChatController(service);
  router.post('/chat/create', controller.createOrGet);
  router.post('/chat/:chatId/message/send', controller.send);
  router.get('/chat/:chatId/messages', controller.listMessages);
  router.post('/chat/:chatId/message/:messageId/read', controller.markRead);
  router.post('/chat/:chatId/lastseen', controller.updateLastSeen);
  router.get('/user/:userId/chats', controller.listUserChats);
  return router;
}
