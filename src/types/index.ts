export type SymbolCategory =
  | 'basic_consonant'    // 基本子音 (14)
  | 'double_consonant'   // 濃音/雙子音 (5)
  | 'basic_vowel'       // 基本母音 (10)
  | 'compound_vowel';   // 複合母音 (11)

export interface HangulSymbol {
  id: string;
  char: string;
  name: string;           // e.g. 기역 (Giyeok)
  nameMeaning?: string;   // 韓文名稱中文意思
  category: SymbolCategory;
  romaja: string;         // e.g. g / k
  zhuyin: string;         // e.g. ㄍ / ㄎ
  ipa: string;            // e.g. [k], [g]
  soundTip: string;       // 發音嘴型與口訣
  mnemonic: string;       // 台語/中文/視覺諧音助記
  strokeOrder: string[];  // 筆順描述或步驟
  exampleWords: {
    hangul: string;
    romaja: string;
    zhuyin: string;
    meaning: string;
    audioHint?: string;
  }[];
}

export type VocabCategory =
  | 'taiwanese_cognate'   // 台語/閩南語超像詞 (漢語音)
  | 'mandarin_cognate'    // 中文/華語超像詞
  | 'loanword'            // 外來語 (英文/葡日語借詞)
  | 'daily_basic';        // 常用基礎生活固有詞

export interface VocabWord {
  id: string;
  hangul: string;
  hanja?: string;         // 漢字 (如果有)
  meaning: string;        // 中文意義
  romaja: string;         // 羅馬拼音
  zhuyin: string;         // 注音符號標音
  category: VocabCategory;
  cognateClue: string;    // 台語/中文/英文推敲線索
  syllablesBreakdown: {
    syllable: string;
    consonant: string;
    vowel: string;
    batchim?: string;
    consonantZhuyin: string;
    vowelZhuyin: string;
    batchimZhuyin?: string;
  }[];
  exampleSentence?: {
    hangul: string;
    translation: string;
  };
  difficulty: 1 | 2 | 3;
}

export type MasteryStatus = 'unlearned' | 'learning' | 'mastered';

export interface UserProgress {
  symbolMastery: Record<string, {
    status: MasteryStatus;
    correctCount: number;
    wrongCount: number;
    lastReviewed?: number;
    isFavorite?: boolean;
  }>;
  quizStats: {
    totalAnswered: number;
    totalCorrect: number;
    streak: number;
    bestStreak: number;
    history: {
      date: string;
      mode: string;
      score: number;
      total: number;
    }[];
  };
  settings: {
    audioSpeed: number; // 0.8 or 1.0
    autoPlayInterval: number; // seconds
    showZhuyin: boolean;
    showRomaja: boolean;
    showMnemonicFirst: boolean;
  };
}

export type ActiveTab = 'cards' | 'selector' | 'quiz' | 'chart' | 'builder' | 'stats';

export type QuizMode = 'meaning' | 'listening' | 'syllable_match';
