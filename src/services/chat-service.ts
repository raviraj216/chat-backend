import { AppError } from '../errors/app-error';
import type { ChatRepository, ChatSummary, MessageRepository } from '../types';

export class ChatService {
  constructor(private readonly chats: ChatRepository, private readonly messages: MessageRepository) {}

  async createOrGet(userAId: string, userBId: string): Promise<{ chatId: string }> {
    if (userAId === userBId) throw new AppError(400, 'VALIDATION_ERROR', 'A one-to-one chat requires two different users.');
    const users = await this.chats.findUserIds([userAId, userBId]);
    if (users.length !== 2) throw new AppError(404, 'USER_NOT_FOUND', 'Both users must exist.');
    return { chatId: await this.chats.createOrGet(userAId, userBId) };
  }

  private async requireChat(chatId: string): Promise<ChatSummary> {
    const chat = await this.chats.findChat(chatId);
    if (!chat) throw new AppError(404, 'CHAT_NOT_FOUND', 'Chat does not exist.');
    return chat;
  }

  private async requireMember(chatId: string, userId: string): Promise<void> {
    const chat = await this.requireChat(chatId);
    if (!chat.memberIds.includes(userId)) throw new AppError(403, 'NOT_CHAT_MEMBER', 'User does not belong to this chat.');
  }

  async send(chatId: string, senderId: string, text: string) {
    await this.requireMember(chatId, senderId);
    
    return this.messages.send(chatId, senderId, text);
  }

  async listMessages(chatId: string, limit: number) {
    await this.requireChat(chatId);
    return this.messages.list(chatId, limit);
  }

  async markRead(chatId: string, messageId: string, userId: string) {
    await this.requireMember(chatId, userId);
    return this.messages.markRead(chatId, messageId, userId);
  }

  async updateLastSeen(chatId: string, messageId: string, userId: string) {
    await this.requireMember(chatId, userId);
    return this.messages.updateLastSeen(chatId, messageId, userId);
  }

  async listUserChats(userId: string): Promise<ChatSummary[]> {
    const users = await this.chats.findUserIds([userId]);
    if (users.length === 0) throw new AppError(404, 'USER_NOT_FOUND', 'User does not exist.');
    return this.chats.listUserChats(userId);
  }
}
