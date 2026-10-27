import { AppError } from './app-error';

export async function dependencyOperation<T>(
  dependency: 'DATABASE' | 'FIRESTORE',
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    throw new AppError(503, `${dependency}_ERROR`, `${dependency === 'DATABASE' ? 'MySQL' : 'Firestore'} operation failed. Try again later.`, { cause: error });
  }
}
