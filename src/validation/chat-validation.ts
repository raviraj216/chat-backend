import { z } from 'zod';

// IDs are used as Firestore document path segments. Accept valid document IDs,
// including UUIDs and the readable IDs used by the seed script.
const id = z.string().min(1).refine(
  (value) => value.trim().length > 0 && !value.includes('/') && value !== '.' && value !== '..'
    && !/^__.*__$/.test(value) && Buffer.byteLength(value, 'utf8') <= 1500,
  'Must be a valid Firestore document ID (no slash, dot-only or reserved IDs; at most 1500 UTF-8 bytes).',
);
// MySQL user IDs are VARCHAR(191). Message IDs retain Firestore's limits.
const userId = z.string().max(191, 'User ID must be at most 191 characters.').pipe(id);

export const createChatBody = z.object({ userAId: userId, userBId: userId }).strict().refine(
  ({ userAId, userBId }) => userAId !== userBId,
  { message: 'A one-to-one chat requires two different users.', path: ['userBId'] },
);
export const chatParams = z.object({ chatId: id });
export const messageParams = z.object({ chatId: id, messageId: id });
export const userParams = z.object({ userId });
export const sendMessageBody = z.object({
  senderId: userId,
  text: z.string().refine((value) => value.trim().length > 0, 'Message text cannot be empty or whitespace-only.'),
}).strict();
export const readMessageBody = z.object({ userId }).strict();
export const lastSeenBody = z.object({ userId, messageId: id }).strict();
export const messagesQuery = z.object({
  limit: z.string().regex(/^\d+$/, 'Limit must be a positive integer.')
    .transform(Number).pipe(z.number().int().positive().max(2_147_483_647)).default('50'),
}).strict();
