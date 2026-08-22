import { UserProgress } from '../types';
import { HANGUL_SYMBOLS } from '../data/hangulData';

const STORAGE_KEY = 'hangul_learning_progress_v1';
const SELECTED_SYMBOLS_KEY = 'hangul_selected_symbol_ids_v1';

export const DEFAULT_PROGRESS: UserProgress = {
  symbolMastery: {},
  quizStats: {
    totalAnswered: 0,
    totalCorrect: 0,
    streak: 0,
    bestStreak: 0,
    history: [],
  },
  settings: {
    audioSpeed: 0.9,
    autoPlayInterval: 3.5,
    showZhuyin: true,
    showRomaja: true,
    showMnemonicFirst: true,
  },
};

// Initialize mastery for all 40 symbols if missing
export function initializeProgress(): UserProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let current: UserProgress = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_PROGRESS));

    if (!current.symbolMastery) current.symbolMastery = {};
    if (!current.quizStats) current.quizStats = DEFAULT_PROGRESS.quizStats;
    if (!current.settings) current.settings = DEFAULT_PROGRESS.settings;

    // Ensure all symbols have an entry
    HANGUL_SYMBOLS.forEach((sym) => {
      if (!current.symbolMastery[sym.id]) {
        current.symbolMastery[sym.id] = {
          status: 'unlearned',
          correctCount: 0,
          wrongCount: 0,
        };
      }
    });

    return current;
  } catch (e) {
    console.error('Error reading localStorage:', e);
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: UserProgress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Error saving progress to localStorage:', e);
  }
}

export function getSelectedSymbolIds(): string[] {
  if (typeof window === 'undefined') return HANGUL_SYMBOLS.map((s) => s.id);
  try {
    const raw = localStorage.getItem(SELECTED_SYMBOLS_KEY);
    if (raw) {
      const ids = JSON.parse(raw);
      if (Array.isArray(ids) && ids.length > 0) return ids;
    }
  } catch {
    // Ignore
  }
  // Default to 14 basic consonants + 10 basic vowels (first 24 letters) for smooth start
  return HANGUL_SYMBOLS.filter((s) => s.category === 'basic_consonant' || s.category === 'basic_vowel').map((s) => s.id);
}

export function saveSelectedSymbolIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SELECTED_SYMBOLS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Error saving selected symbols:', e);
  }
}
