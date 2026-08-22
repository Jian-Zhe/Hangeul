import React, { useState, useEffect, useCallback } from 'react';
import { HangulSymbol, UserProgress, MasteryStatus } from '../types';
import { HANGUL_SYMBOLS, SYMBOL_CATEGORY_LABELS } from '../data/hangulData';
import {
  Volume2,
  RotateCw,
  Shuffle,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  HelpCircle,
  Star,
  Settings,
  Sparkles,
  Info,
  BookOpen,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface FlashcardViewProps {
  selectedIds: string[];
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onGoToSelector: () => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  selectedIds,
  progress,
  onUpdateProgress,
  onGoToSelector,
}) => {
  // Filter selected symbols, fallback to all if empty
  const activeSymbols = HANGUL_SYMBOLS.filter((s) => selectedIds.includes(s.id));
  const cardList = activeSymbols.length > 0 ? activeSymbols : HANGUL_SYMBOLS;

  const [cards, setCards] = useState<HangulSymbol[]>(cardList);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showStrokeHint, setShowStrokeHint] = useState(false);

  // Sync cards when selectedIds change
  useEffect(() => {
    setCards(cardList);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedIds]);

  const currentCard: HangulSymbol = cards[currentIndex] || cards[0];
  const currentMastery: MasteryStatus =
    progress.symbolMastery[currentCard?.id]?.status || 'unlearned';
  const isFavorite = !!progress.symbolMastery[currentCard?.id]?.isFavorite;

  // Speak current card
  const handleSpeak = useCallback((text?: string, rate?: number) => {
    const textToSpeak = text || currentCard.char;
    const speed = rate || progress.settings.audioSpeed;
    soundFx.speakKorean(textToSpeak, speed);
  }, [currentCard, progress.settings.audioSpeed]);

  const handleFlip = useCallback(() => {
    soundFx.playFlip();
    setIsFlipped((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setShowStrokeHint(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  }, [cards.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setShowStrokeHint(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  }, [cards.length]);

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    soundFx.playFlip();
  };

  const handleMarkMastery = (status: MasteryStatus) => {
    if (status === 'mastered') {
      soundFx.playChime();
    }
    onUpdateProgress((prev) => {
      const currentSym = prev.symbolMastery[currentCard.id] || {
        status: 'unlearned',
        correctCount: 0,
        wrongCount: 0,
      };
      return {
        ...prev,
        symbolMastery: {
          ...prev.symbolMastery,
          [currentCard.id]: {
            ...currentSym,
            status,
            correctCount: status === 'mastered' ? currentSym.correctCount + 1 : currentSym.correctCount,
            wrongCount: status === 'learning' ? currentSym.wrongCount + 1 : currentSym.wrongCount,
            lastReviewed: Date.now(),
          },
        },
      };
    });
    // Auto advance to next card after marking
    setTimeout(() => {
      handleNext();
    }, 250);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateProgress((prev) => {
      const currentSym = prev.symbolMastery[currentCard.id] || {
        status: 'unlearned',
        correctCount: 0,
        wrongCount: 0,
      };
      return {
        ...prev,
        symbolMastery: {
          ...prev.symbolMastery,
          [currentCard.id]: {
            ...currentSym,
            isFavorite: !currentSym.isFavorite,
          },
        },
      };
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'KeyV' || e.code === 'KeyS') {
        e.preventDefault();
        handleSpeak();
      } else if (e.code === 'Digit1' || e.code === 'KeyN') {
        // Need practice
        e.preventDefault();
        handleMarkMastery('learning');
      } else if (e.code === 'Digit2' || e.code === 'KeyM') {
        // Mastered
        e.preventDefault();
        handleMarkMastery('mastered');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleSpeak, currentCard]);

  // Auto-play interval
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAutoPlaying) {
      // Play front sound, then flip to back to see the details, and move to next
      handleSpeak();
      timer = setTimeout(() => {
        setIsFlipped(true);
        setTimeout(() => {
          handleNext();
        }, 2200);
      }, 1800);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAutoPlaying, currentIndex]);

  const categoryMeta = SYMBOL_CATEGORY_LABELS[currentCard.category];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar: Progress Count & Quick Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Progress Tracker */}
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-bold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
            卡片 {currentIndex + 1} / {cards.length}
          </span>

          <div className="hidden sm:flex items-center gap-1 text-xs text-stone-500">
            <span>（已選 {activeSymbols.length} 個符號）</span>
            <button
              onClick={onGoToSelector}
              className="text-indigo-600 hover:text-indigo-800 font-medium underline ml-1 cursor-pointer"
            >
              調整勾選
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Auto Play */}
          <button
            id="flashcard-autoplay-btn"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            title={isAutoPlaying ? '暫停自動輪播' : '自動循環輪播字卡'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isAutoPlaying
                ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span className="hidden sm:inline">{isAutoPlaying ? '自動播放中' : '自動播放'}</span>
          </button>

          {/* Shuffle */}
          <button
            id="flashcard-shuffle-btn"
            onClick={handleShuffle}
            title="隨機打亂卡片順序"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-medium transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">洗牌</span>
          </button>

          {/* Star Favorite */}
          <button
            onClick={handleToggleFavorite}
            title={isFavorite ? '取消收藏' : '收藏此符號'}
            className={`p-2 rounded-lg border transition-colors ${
              isFavorite
                ? 'bg-amber-50 border-amber-300 text-amber-500 shadow-2xs'
                : 'bg-stone-50 border-stone-200 text-stone-400 hover:text-amber-500'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Flashcard with 3D Flip */}
      <div className="perspective-1000 min-h-[380px] sm:min-h-[420px] w-full flex justify-center">
        <div
          id="active-hangul-flashcard"
          onClick={handleFlip}
          className={`w-full max-w-2xl rounded-3xl cursor-pointer transition-all duration-500 transform-style-3d relative shadow-xl hover:shadow-2xl border ${
            isFlipped
              ? 'border-indigo-200/90 rotate-y-180 bg-linear-to-b from-stone-900 via-stone-900 to-indigo-950 text-white'
              : 'border-stone-200/90 bg-linear-to-b from-white via-stone-50/50 to-stone-100/60 text-stone-900'
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ===================== FRONT SIDE (正面: 諺文) ===================== */}
          <div
            className={`w-full h-full p-6 sm:p-8 flex flex-col justify-between absolute inset-0 backface-hidden ${
              isFlipped ? 'pointer-events-none' : ''
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Front Header */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-stone-100 text-stone-800 border border-stone-200/80">
                {categoryMeta.label}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.speakKorean(currentCard.char, 0.7);
                  }}
                  title="點擊慢速朗讀"
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>🐢 慢音</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak();
                  }}
                  title="點擊播放韓語真人標準發音 (快捷鍵 V)"
                  className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 active:scale-90 transition-transform cursor-pointer"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Front Center: Big Hangul Character */}
            <div className="text-center my-auto py-6 space-y-4">
              <div className="text-7xl sm:text-9xl font-black text-stone-900 tracking-tight font-sans select-none drop-shadow-xs">
                {currentCard.char}
              </div>

              {/* Stroke Order Hint Toggle */}
              {showStrokeHint ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="inline-block max-w-md mx-auto p-3 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-700 text-left space-y-1"
                >
                  <div className="font-bold text-stone-900 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>筆順指導：</span>
                  </div>
                  {currentCard.strokeOrder.map((step, idx) => (
                    <div key={idx} className="text-stone-600">
                      {step}
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStrokeHint(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-indigo-600 font-medium transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>查看書寫筆順提示</span>
                </button>
              )}
            </div>

            {/* Front Footer: Tap to Flip Guide */}
            <div className="flex items-center justify-between border-t border-stone-200/70 pt-3 text-xs text-stone-600">
              <div className="flex items-center gap-1 font-medium">
                <RotateCw className="w-3.5 h-3.5 text-stone-600" />
                <span>點擊卡片或按「空白鍵」翻轉查看發音與注音</span>
              </div>
              <span className="hidden sm:inline-block text-stone-400 font-mono text-[11px]">
                快捷鍵：← / → 切換，空白鍵翻面，V 聽音
              </span>
            </div>
          </div>

          {/* ===================== BACK SIDE (背面: 發音、注音、台語諧音) ===================== */}
          <div
            className={`w-full h-full p-6 sm:p-8 flex flex-col justify-between absolute inset-0 backface-hidden ${
              !isFlipped ? 'pointer-events-none' : ''
            }`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Back Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-rose-400">{currentCard.char}</span>
                <span className="text-xs text-stone-400">發音解析與記憶法</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak();
                }}
                title="播放發音"
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Back Content */}
            <div className="space-y-4 my-auto py-2">
              {/* Pronunciation Badges (Zhuyin + Romaja + IPA) */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-stone-800/80 rounded-xl p-2.5 border border-stone-700">
                  <div className="text-[10px] text-stone-400 font-semibold uppercase">注音符號</div>
                  <div className="text-lg sm:text-xl font-black text-amber-300 mt-0.5">
                    {currentCard.zhuyin}
                  </div>
                </div>

                <div className="bg-stone-800/80 rounded-xl p-2.5 border border-stone-700">
                  <div className="text-[10px] text-stone-400 font-semibold uppercase">英文羅馬拼音</div>
                  <div className="text-lg sm:text-xl font-black text-sky-300 mt-0.5 font-mono">
                    {currentCard.romaja}
                  </div>
                </div>

                <div className="bg-stone-800/80 rounded-xl p-2.5 border border-stone-700">
                  <div className="text-[10px] text-stone-400 font-semibold uppercase">國際音標 IPA</div>
                  <div className="text-base sm:text-lg font-bold text-emerald-300 mt-0.5 font-mono">
                    {currentCard.ipa}
                  </div>
                </div>
              </div>

              {/* Mnemonic / Taiwanese-Chinese Sound Trick */}
              <div className="bg-indigo-950/60 rounded-xl p-3.5 border border-indigo-800/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>台語 / 中文諧音助記口訣：</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                  {currentCard.mnemonic}
                </p>
              </div>

              {/* Sound Tips */}
              <div className="text-xs text-stone-300 bg-stone-800/50 rounded-xl p-3 border border-stone-700/60">
                <span className="font-semibold text-rose-300">👄 發音嘴型秘訣：</span> {currentCard.soundTip}
              </div>

              {/* Example Words with Sound */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
                  生活範例單字（點擊試聽）：
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {currentCard.exampleWords.map((ex, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFx.speakKorean(ex.hangul, progress.settings.audioSpeed);
                      }}
                      className="bg-stone-800/90 hover:bg-stone-700/90 p-2.5 rounded-xl border border-stone-700 flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-white group-hover:text-rose-300">
                            {ex.hangul}
                          </span>
                          <span className="text-[11px] text-amber-300">({ex.zhuyin})</span>
                        </div>
                        <div className="text-[11px] text-stone-400">{ex.meaning}</div>
                      </div>
                      <Volume2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-white" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Back Footer */}
            <div className="border-t border-stone-800 pt-3 text-center text-xs text-stone-400">
              再次點擊翻回正面
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls: Navigation + Mastered / Needs Practice Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-4">
        {/* Previous / Next and Mastery Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Nav Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              id="flashcard-prev-btn"
              onClick={handlePrev}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>上一個</span>
            </button>

            <button
              id="flashcard-flip-btn"
              onClick={handleFlip}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-all"
            >
              <RotateCw className="w-4 h-4" />
              <span>翻轉 (Space)</span>
            </button>

            <button
              id="flashcard-next-btn"
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>下一個</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Mastery Evaluation Buttons (Quizlet style: Still Learning vs Mastered) */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="mark-learning-btn"
              onClick={() => handleMarkMastery('learning')}
              title="標記為需要複習 (快捷鍵 1)"
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all active:scale-95 cursor-pointer ${
                currentMastery === 'learning'
                  ? 'bg-amber-100 border-amber-400 text-amber-800 ring-2 ring-amber-300'
                  : 'bg-amber-50/70 hover:bg-amber-100 border-amber-200 text-amber-800'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>還不熟・加強 (1)</span>
            </button>

            <button
              id="mark-mastered-btn"
              onClick={() => handleMarkMastery('mastered')}
              title="標記為已掌握 (快捷鍵 2)"
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all active:scale-95 cursor-pointer ${
                currentMastery === 'mastered'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
              }`}
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>我記住了！(2)</span>
            </button>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-linear-to-r from-indigo-500 to-rose-500 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
