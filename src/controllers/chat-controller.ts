import type { RequestHandler } from 'express';
import type { ChatService } from '../services/chat-service';
import * as validation from '../validation/chat-validation';

export class ChatController {
  constructor(private readonly service: ChatService) {}

  createOrGet: RequestHandler = async (req, res) => {
    const { userAId, userBId } = validation.createChatBody.parse(req.body);
    res.status(200).json(await this.service.createOrGet(userAId, userBId));
  };

  send: RequestHandler = async (req, res) => {
    const { chatId } = validation.chatParams.parse(req.params);
    const { senderId, text } = validation.sendMessageBody.parse(req.body);
    res.status(201).json(await this.service.send(chatId, senderId, text));
  };

  listMessages: RequestHandler = async (req, res) => {
    const { chatId } = validation.chatParams.parse(req.params);
    const { limit } = validation.messagesQuery.parse(req.query);
    res.json({ messages: await this.service.listMessages(chatId, limit) });
  };

  markRead: RequestHandler = async (req, res) => {
    const { chatId, messageId } = validation.messageParams.parse(req.params);
    const { userId } = validation.readMessageBody.parse(req.body);
    res.json({ messageId, ...await this.service.markRead(chatId, messageId, userId) });
  };

  updateLastSeen: RequestHandler = async (req, res) => {
    const { chatId } = validation.chatParams.parse(req.params);
    const { userId, messageId } = validation.lastSeenBody.parse(req.body);
    res.json(await this.service.updateLastSeen(chatId, messageId, userId));
  };

  listUserChats: RequestHandler = async (req, res) => {
    const { userId } = validation.userParams.parse(req.params);
    res.json({ chats: await this.service.listUserChats(userId) });
  };
}
