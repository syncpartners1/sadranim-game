import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'sadranim-game',
  authDomain: 'sadranim-game.firebaseapp.com',
  storageBucket: 'sadranim-game.appspot.com',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
