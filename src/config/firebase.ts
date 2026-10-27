import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { Environment } from './env';

export function createFirestore(env: Environment): Firestore {
  const app = initializeApp({
    projectId: env.FIREBASE_PROJECT_ID,
    // The emulator needs no credentials. Real deployments use ADC: a managed
    // workload identity, or GOOGLE_APPLICATION_CREDENTIALS pointing to a file.
    ...(env.FIRESTORE_EMULATOR_HOST ? {} : { credential: applicationDefault() }),
  });
  return getFirestore(app);
}
