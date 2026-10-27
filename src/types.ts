export interface ChatSummary {
  chatId: string;
  memberIds: string[];
}

export interface ReadReceipt {
  userId: string;
  readAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  readReceipts: ReadReceipt[];
}

export interface LastSeen {
  userId: string;
  messageId: string;
  updatedAt: string;
}

// These small interfaces keep service logic independent of either SDK.
export interface ChatRepository {
  findUserIds(ids: string[]): Promise<string[]>;
  createOrGet(userAId: string, userBId: string): Promise<string>;
  findChat(chatId: string): Promise<ChatSummary | null>;
  listUserChats(userId: string): Promise<ChatSummary[]>;
}

export interface MessageRepository {
  send(chatId: string, senderId: string, text: string): Promise<Message>;
  list(chatId: string, limit: number): Promise<Message[]>;
  markRead(chatId: string, messageId: string, userId: string): Promise<ReadReceipt>;
  updateLastSeen(chatId: string, messageId: string, userId: string): Promise<LastSeen>;
}
