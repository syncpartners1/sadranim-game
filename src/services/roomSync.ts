import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { GameState } from '../types/game';

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getShareableUrl(roomCode: string): string {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?room=${roomCode}`;
}

export function getWhatsAppShareUrl(roomCode: string): string {
  const gameUrl = getShareableUrl(roomCode);
  const text = encodeURIComponent(`🛒 בוא לשחק איתי ב"הסדרנים" (משחק סידור מדפים סופרמרקט)! לחץ על הקישור להצטרפות לחדר: ${gameUrl}`);
  return `https://wa.me/?text=${text}`;
}

export function getTelegramShareUrl(roomCode: string): string {
  const gameUrl = getShareableUrl(roomCode);
  const text = encodeURIComponent(`🛒 בוא לשחק איתי ב"הסדרנים"! קוד חדר: ${roomCode}`);
  return `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${text}`;
}

export async function saveRoomStateToFirestore(state: GameState): Promise<void> {
  if (!state.roomCode) return;
  try {
    const roomRef = doc(db, 'rooms', state.roomCode);
    await setDoc(roomRef, {
      ...state,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore room save warning:', err);
  }
}

export function subscribeToRoomFirestore(
  roomCode: string,
  onStateUpdate: (state: GameState) => void
): () => void {
  const roomRef = doc(db, 'rooms', roomCode);
  return onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as GameState;
      onStateUpdate(data);
    }
  }, (err) => {
    console.warn('Firestore snapshot listener warning:', err);
  });
}

export async function fetchRoomStateFromFirestore(roomCode: string): Promise<GameState | null> {
  try {
    const roomRef = doc(db, 'rooms', roomCode);
    const snapshot = await getDoc(roomRef);
    if (snapshot.exists()) {
      return snapshot.data() as GameState;
    }
  } catch (err) {
    console.warn('Fetch room error:', err);
  }
  return null;
}
