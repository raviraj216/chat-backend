import { createHash } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { dependencyOperation } from '../errors/dependency-operation';
import type { ChatRepository, ChatSummary } from '../types';

// Sort and encode the pair, then hash it into a fixed-size MySQL unique key.
export function chatPairKey(userAId: string, userBId: string): string {
  return createHash('sha256').update(JSON.stringify([userAId, userBId].sort())).digest('hex');
}

const chatSelection = {
  id: true,
  members: { select: { userId: true }, orderBy: { userId: 'asc' as const } },
} satisfies Prisma.ChatSelect;

function toSummary(chat: Prisma.ChatGetPayload<{ select: typeof chatSelection }>): ChatSummary {
  return { chatId: chat.id, memberIds: chat.members.map((member) => member.userId) };
}

export class PrismaChatRepository implements ChatRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findUserIds(ids: string[]): Promise<string[]> {
    return dependencyOperation('DATABASE', async () => {
      const users = await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true } });
      return users.map((user) => user.id);
    });
  }

  createOrGet(userAId: string, userBId: string): Promise<string> {
    return dependencyOperation('DATABASE', async () => {
      const pairKey = chatPairKey(userAId, userBId);
      const existing = await this.prisma.chat.findUnique({ where: { pairKey }, select: { id: true } });
      if (existing) return existing.id;
      try {
        // A Prisma nested write is a transaction: the chat and both memberships
        // either all commit or all roll back. pairKey is unique in MySQL.
        const chat = await this.prisma.chat.create({
          data: { pairKey, members: { create: [{ userId: userAId }, { userId: userBId }] } },
          select: { id: true },
        });
        return chat.id;
      } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          // The competing transaction has committed; read outside the failed
          // nested-write transaction, after its rollback has completed.
          const winner = await this.prisma.chat.findUnique({ where: { pairKey }, select: { id: true } });
          if (winner) return winner.id;
        }
        throw error;
      }
    });
  }

  findChat(chatId: string): Promise<ChatSummary | null> {
    return dependencyOperation('DATABASE', async () => {
      const chat = await this.prisma.chat.findUnique({ where: { id: chatId }, select: chatSelection });
      return chat ? toSummary(chat) : null;
    });
  }

  listUserChats(userId: string): Promise<ChatSummary[]> {
    return dependencyOperation('DATABASE', async () => {
      const chats = await this.prisma.chat.findMany({
        where: { members: { some: { userId } } },
        select: chatSelection,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });
      return chats.map(toSummary);
    });
  }
}
