import { FieldPath, FieldValue, Timestamp, type Firestore, type DocumentSnapshot } from 'firebase-admin/firestore';
import { AppError } from '../errors/app-error';
import { dependencyOperation } from '../errors/dependency-operation';
import type { LastSeen, Message, MessageRepository, ReadReceipt } from '../types';

function timestampString(value: unknown): string {
  if (!(value instanceof Timestamp)) throw new Error('Expected a committed Firestore timestamp.');
  return value.toDate().toISOString();
}

function stringField(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid stored Firestore document.');
  return value;
}

function messageFromSnapshot(snapshot: DocumentSnapshot, readReceipts: ReadReceipt[]): Message {
  const data: Record<string, unknown> | undefined = snapshot.data();
  if (!data) throw new AppError(404, 'MESSAGE_NOT_FOUND', 'Message does not exist within this chat.');
  return {
    id: snapshot.id,
    senderId: stringField(data.senderId),
    text: stringField(data.text),
    timestamp: timestampString(data.timestamp),
    readReceipts,
  };
}

export class FirestoreMessageRepository implements MessageRepository {
  constructor(private readonly firestore: Firestore) {}

  private messages(chatId: string) {
    // The parent chat document may be absent: Firestore supports subcollections
    // without a parent document. Its path ID is always the MySQL chat ID.
    return this.firestore.collection('chats').doc(chatId).collection('messages');
  }

  send(chatId: string, senderId: string, text: string): Promise<Message> {
    //console.log('Sending message:', { chatId, senderId, text });
    return dependencyOperation('FIRESTORE', async () => {
      const reference = this.messages(chatId).doc();
      await reference.create({ senderId, text, timestamp: FieldValue.serverTimestamp() });
      return messageFromSnapshot(await reference.get(), []);
    });
  }

  list(chatId: string, limit: number): Promise<Message[]> {
    return dependencyOperation('FIRESTORE', async () => {
      const snapshot = await this.messages(chatId)
        .orderBy('timestamp', 'desc')
        .orderBy(FieldPath.documentId(), 'desc')
        .limit(limit)
        .get();
      // Limit BEFORE reversing, so this returns the latest N messages.
      return Promise.all([...snapshot.docs].reverse().map(async (document) => {
        const receipts = await document.ref.collection('readReceipts').orderBy(FieldPath.documentId()).get();
        return messageFromSnapshot(document, receipts.docs.map((receipt) => {
          const data: Record<string, unknown> = receipt.data();
          return { userId: receipt.id, readAt: timestampString(data.readAt) };
        }));
      }));
    });
  }

  markRead(chatId: string, messageId: string, userId: string): Promise<ReadReceipt> {
    return dependencyOperation('FIRESTORE', async () => {
      const message = this.messages(chatId).doc(messageId);
      const receipt = message.collection('readReceipts').doc(userId);
      // A transaction preserves the FIRST read timestamp, even for concurrent
      // repeats, and verifies the message in the same atomic operation.
      return this.firestore.runTransaction(async (transaction) => {
        const messageSnapshot = await transaction.get(message);
        if (!messageSnapshot.exists) throw new AppError(404, 'MESSAGE_NOT_FOUND', 'Message does not exist within this chat.');
        const existing = await transaction.get(receipt);
        if (existing.exists) {
          const data: Record<string, unknown> | undefined = existing.data();
          return { userId, readAt: timestampString(data?.readAt) };
        }
        transaction.create(receipt, { readAt: FieldValue.serverTimestamp() });
        // The server timestamp is resolved only after transaction commit.
        return null;
      }).then(async (existing) => {
        if (existing) return existing;
        const committed = await receipt.get();
        const data: Record<string, unknown> | undefined = committed.data();
        return { userId, readAt: timestampString(data?.readAt) };
      });
    });
  }

  updateLastSeen(chatId: string, messageId: string, userId: string): Promise<LastSeen> {
    return dependencyOperation('FIRESTORE', async () => {
      const message = this.messages(chatId).doc(messageId);
      const state = this.firestore.collection('chats').doc(chatId).collection('lastSeen').doc(userId);
      await this.firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(message);
        if (!snapshot.exists) throw new AppError(404, 'MESSAGE_NOT_FOUND', 'Message does not exist within this chat.');
        transaction.set(state, { messageId, updatedAt: FieldValue.serverTimestamp() });
      });
      const committed = await state.get();
      const data: Record<string, unknown> | undefined = committed.data();
      return { userId, messageId: stringField(data?.messageId), updatedAt: timestampString(data?.updatedAt) };
    });
  }
}
