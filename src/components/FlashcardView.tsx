import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HangulSymbol, UserProgress } from '../types';
import { HANGUL_SYMBOLS, SYMBOL_CATEGORY_LABELS } from '../data/hangulData';
import {
  Volume2,
  RotateCw,
  Shuffle,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Star,
  Sparkles,
  PenTool,
  BookOpen,
  RefreshCw,
  Trophy,
  X,
  Undo2,
  CheckCircle2,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface FlashcardViewProps {
  selectedIds: string[];
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onGoToSelector: () => void;
}

interface ActionHistoryEntry {
  card: HangulSymbol;
  action: 'mastered' | 'practice';
  prevActive: HangulSymbol[];
  prevDiscarded: HangulSymbol[];
  prevIndex: number;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  selectedIds,
  progress,
  onUpdateProgress,
  onGoToSelector,
}) => {
  // Filter selected symbols, fallback to all if empty
  const activeSymbols = HANGUL_SYMBOLS.filter((s) => selectedIds.includes(s.id));
  const initialPool = activeSymbols.length > 0 ? activeSymbols : HANGUL_SYMBOLS;

  // Deck state for discard / round management
  const [activeCards, setActiveCards] = useState<HangulSymbol[]>(initialPool);
  const [discardedCards, setDiscardedCards] = useState<HangulSymbol[]>([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showStrokeHint, setShowStrokeHint] = useState(false);
  const [roundCompletedModal, setRoundCompletedModal] = useState(false);

  // Undo History Stack
  const [historyStack, setHistoryStack] = useState<ActionHistoryEntry[]>([]);

  // Touch Swipe Gesture State
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Sync cards when selectedIds change
  useEffect(() => {
    setActiveCards(initialPool);
    setDiscardedCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowStrokeHint(false);
    setRoundNumber(1);
    setRoundCompletedModal(false);
    setHistoryStack([]);
  }, [selectedIds]);

  const currentCard: HangulSymbol | undefined = activeCards[currentIndex];
  const isFavorite = currentCard ? !!progress.symbolMastery[currentCard.id]?.isFavorite : false;

  // Speak current card
  const handleSpeak = useCallback((text?: string, rate?: number) => {
    if (!currentCard) return;
    const textToSpeak = text || currentCard.char;
    const speed = rate || progress.settings.audioSpeed;
    soundFx.speakKorean(textToSpeak, speed);
  }, [currentCard, progress.settings.audioSpeed]);

  const handleFlip = useCallback(() => {
    soundFx.playFlip();
    setIsFlipped((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (activeCards.length === 0) return;
    setIsFlipped(false);
    setShowStrokeHint(false);
    setCurrentIndex((prev) => (prev + 1) % activeCards.length);
  }, [activeCards.length]);

  const handlePrev = useCallback(() => {
    if (activeCards.length === 0) return;
    setIsFlipped(false);
    setShowStrokeHint(false);
    setCurrentIndex((prev) => (prev - 1 + activeCards.length) % activeCards.length);
  }, [activeCards.length]);

  const handleShuffle = () => {
    const shuffled = [...activeCards].sort(() => Math.random() - 0.5);
    setActiveCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    soundFx.playFlip();
  };

  // Discard card action (Left swipe / "記住了" button) - marked mastered & removed from current pool
  const handleDiscardCurrent = useCallback((targetCard?: HangulSymbol) => {
    const cardToDiscard = targetCard || currentCard;
    if (!cardToDiscard) return;

    soundFx.playChime();

    // Record undo state
    setHistoryStack((prev) => [
      ...prev,
      {
        card: cardToDiscard,
        action: 'mastered',
        prevActive: activeCards,
        prevDiscarded: discardedCards,
        prevIndex: currentIndex,
      },
    ]);

    // Update mastery status to mastered
    onUpdateProgress((prev) => {
      const currentSym = prev.symbolMastery[cardToDiscard.id] || {
        status: 'unlearned',
        correctCount: 0,
        wrongCount: 0,
      };
      return {
        ...prev,
        symbolMastery: {
          ...prev.symbolMastery,
          [cardToDiscard.id]: {
            ...currentSym,
            status: 'mastered',
            correctCount: currentSym.correctCount + 1,
            lastReviewed: Date.now(),
          },
        },
      };
    });

    const nextDiscarded = [...discardedCards, cardToDiscard];
    const nextActive = activeCards.filter((c) => c.id !== cardToDiscard.id);

    setDiscardedCards(nextDiscarded);
    setIsFlipped(false);
    setShowStrokeHint(false);
    setDragOffset({ x: 0, y: 0 });

    if (nextActive.length === 0) {
      // All cards in this round discarded -> trigger new round!
      setActiveCards([]);
      setRoundCompletedModal(true);
    } else {
      setActiveCards(nextActive);
      setCurrentIndex((prev) => (prev >= nextActive.length ? 0 : prev));
    }
  }, [activeCards, currentCard, currentIndex, discardedCards, onUpdateProgress]);

  // Keep & Practice Again action (Right swipe / "再練習" button)
  const handlePracticeAgain = useCallback((targetCard?: HangulSymbol) => {
    const cardToPractice = targetCard || currentCard;
    if (!cardToPractice) return;

    soundFx.playFlip();

    // Record undo state
    setHistoryStack((prev) => [
      ...prev,
      {
        card: cardToPractice,
        action: 'practice',
        prevActive: activeCards,
        prevDiscarded: discardedCards,
        prevIndex: currentIndex,
      },
    ]);

    // Update mastery status to learning
    onUpdateProgress((prev) => {
      const currentSym = prev.symbolMastery[cardToPractice.id] || {
        status: 'unlearned',
        correctCount: 0,
        wrongCount: 0,
      };
      return {
        ...prev,
        symbolMastery: {
          ...prev.symbolMastery,
          [cardToPractice.id]: {
            ...currentSym,
            status: 'learning',
            wrongCount: currentSym.wrongCount + 1,
            lastReviewed: Date.now(),
          },
        },
      };
    });

    setIsFlipped(false);
    setShowStrokeHint(false);
    setDragOffset({ x: 0, y: 0 });

    // Move to next card in active set
    if (activeCards.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % activeCards.length);
    }
  }, [activeCards, currentCard, currentIndex, discardedCards, onUpdateProgress]);

  // Undo Last Action (還原上一張卡片決定，避免滑錯)
  const handleUndo = useCallback(() => {
    if (historyStack.length === 0) return;

    const lastEntry = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));

    setActiveCards(lastEntry.prevActive);
    setDiscardedCards(lastEntry.prevDiscarded);
    setCurrentIndex(lastEntry.prevIndex);
    setIsFlipped(false);
    setShowStrokeHint(false);
    setRoundCompletedModal(false);

    // Rollback mastery score slightly if it was marked mastered
    if (lastEntry.action === 'mastered') {
      onUpdateProgress((prev) => {
        const sym = prev.symbolMastery[lastEntry.card.id];
        if (!sym) return prev;
        return {
          ...prev,
          symbolMastery: {
            ...prev.symbolMastery,
            [lastEntry.card.id]: {
              ...sym,
              correctCount: Math.max(0, sym.correctCount - 1),
            },
          },
        };
      });
    }

    soundFx.playFlip();
  }, [historyStack, onUpdateProgress]);

  // Start fresh new round
  const handleRestartNewRound = () => {
    setActiveCards(initialPool);
    setDiscardedCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowStrokeHint(false);
    setRoundCompletedModal(false);
    setRoundNumber((r) => r + 1);
    setHistoryStack([]);
    soundFx.playChime();
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
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
      } else if (e.code === 'Digit1' || e.code === 'KeyR') {
        e.preventDefault();
        handlePracticeAgain();
      } else if (e.code === 'Digit2' || e.code === 'KeyD') {
        e.preventDefault();
        handleDiscardCurrent();
      } else if (e.code === 'KeyZ' || e.code === 'KeyU') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleSpeak, handlePracticeAgain, handleDiscardCurrent, handleUndo]);

  // Auto-play interval
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAutoPlaying && currentCard) {
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
  }, [isAutoPlaying, currentIndex, currentCard, handleNext, handleSpeak]);

  // Touch Swipe Handlers (Mobile touch + pointer drag)
  const handleTouchStart = (clientX: number, clientY: number) => {
    touchStartRef.current = { x: clientX, y: clientY, time: Date.now() };
    setIsDragging(true);
  };

  const handleTouchMove = (clientX: number, clientY: number) => {
    if (!touchStartRef.current || !isDragging) return;
    const deltaX = clientX - touchStartRef.current.x;
    const deltaY = clientY - touchStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY * 0.4 });
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current) return;
    const distanceX = dragOffset.x;
    const elapsed = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(distanceX) / elapsed;

    const swipeThreshold = 80;
    const fastSwipe = velocity > 0.35 && Math.abs(distanceX) > 35;

    if (distanceX < -swipeThreshold || (distanceX < -35 && fastSwipe)) {
      // Swiped LEFT -> 記住了 (Mastered / Discard)
      handleDiscardCurrent();
    } else if (distanceX > swipeThreshold || (distanceX > 35 && fastSwipe)) {
      // Swiped RIGHT -> 再練習 (Practice again)
      handlePracticeAgain();
    } else {
      setDragOffset({ x: 0, y: 0 });
    }

    touchStartRef.current = null;
    setIsDragging(false);
  };

  if (activeCards.length === 0 || roundCompletedModal || !currentCard) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 text-center space-y-6 animate-fadeIn">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-xl space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-3xl font-black text-stone-900">
              🎉 太棒了！第 {roundNumber} 輪全部完成！
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              您已將本輪的所有 {initialPool.length} 個韓文字卡全部熟練並完成背誦。
            </p>
          </div>

          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex justify-around">
            <div>
              <div className="text-[11px] sm:text-xs text-stone-500 font-semibold">本輪完成字數</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600">{discardedCards.length} 個</div>
            </div>
            <div className="border-r border-stone-200" />
            <div>
              <div className="text-[11px] sm:text-xs text-stone-500 font-semibold">已完成輪次</div>
              <div className="text-xl sm:text-2xl font-black text-indigo-600">{roundNumber} 輪</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {historyStack.length > 0 && (
              <button
                onClick={handleUndo}
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-all cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
                <span>還原上一步</span>
              </button>
            )}

            <button
              onClick={handleRestartNewRound}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" />
              <span>重新開始新一輪</span>
            </button>

            <button
              onClick={onGoToSelector}
              className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-all cursor-pointer"
            >
              <span>自訂選擇字母</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categoryMeta = SYMBOL_CATEGORY_LABELS[currentCard.category];

  // Calculate swipe indicator opacity & rotation
  const swipeRotation = dragOffset.x * 0.08;
  const isSwipingLeft = dragOffset.x < -20;
  const isSwipingRight = dragOffset.x > 20;
  const leftOpacity = Math.min(Math.abs(dragOffset.x) / 90, 1);
  const rightOpacity = Math.min(Math.abs(dragOffset.x) / 90, 1);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-6 space-y-3 sm:space-y-6 select-none">
      {/* Top Bar: Round Status & Action Toolbar */}
      <div className="flex items-center justify-between gap-2">
        {/* Deck Status */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-xs sm:text-sm font-black text-indigo-900 bg-indigo-50 px-2.5 sm:px-3 py-1 rounded-xl border border-indigo-200">
            第 {roundNumber} 輪
          </span>

          <span className="text-xs sm:text-sm font-semibold text-stone-600 bg-stone-100 px-2.5 sm:px-3 py-1 rounded-xl border border-stone-200">
            剩餘 {activeCards.length} 張
          </span>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Undo Button (還原上一張卡片決定，避免滑錯) */}
          <button
            id="undo-action-btn"
            disabled={historyStack.length === 0}
            onClick={handleUndo}
            title={historyStack.length > 0 ? '還原上一張卡片決定 (避免滑錯)' : '目前無可還原的操作'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              historyStack.length > 0
                ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 shadow-2xs active:scale-95'
                : 'bg-stone-50 border border-stone-200 text-stone-300 cursor-not-allowed opacity-50'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs">還原</span>
          </button>

          {/* Auto Play */}
          <button
            id="flashcard-autoplay-btn"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            title={isAutoPlaying ? '暫停自動輪播' : '自動循環輪播字卡'}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isAutoPlaying
                ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span className="hidden sm:inline">{isAutoPlaying ? '自動播放中' : '自動'}</span>
          </button>

          {/* Shuffle */}
          <button
            id="flashcard-shuffle-btn"
            onClick={handleShuffle}
            title="隨機打亂順序"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">洗牌</span>
          </button>

          {/* Star Favorite */}
          <button
            onClick={handleToggleFavorite}
            title={isFavorite ? '取消收藏' : '收藏此符號'}
            className={`p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer ${
              isFavorite
                ? 'bg-amber-50 border-amber-300 text-amber-500 shadow-2xs'
                : 'bg-stone-50 border-stone-200 text-stone-400 hover:text-amber-500'
            }`}
          >
            <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Flashcard Container with Swipe Support */}
      <div className="perspective-1000 min-h-[460px] sm:min-h-[480px] w-full flex justify-center relative touch-pan-y">
        {/* Swipe Feedback Overlay Badge - LEFT: 記住了 (Mastered / Discard) */}
        {isSwipingLeft && (
          <div
            className="absolute left-4 sm:left-6 top-6 sm:top-8 z-30 pointer-events-none px-4 py-2 rounded-2xl bg-emerald-600 text-white font-black text-sm sm:text-base shadow-xl flex items-center gap-2 border-2 border-white transition-opacity"
            style={{ opacity: leftOpacity }}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>記住了</span>
          </div>
        )}

        {/* Swipe Feedback Overlay Badge - RIGHT: 再練習 (Practice Again) */}
        {isSwipingRight && (
          <div
            className="absolute right-4 sm:right-6 top-6 sm:top-8 z-30 pointer-events-none px-4 py-2 rounded-2xl bg-amber-500 text-white font-black text-sm sm:text-base shadow-xl flex items-center gap-2 border-2 border-white transition-opacity"
            style={{ opacity: rightOpacity }}
          >
            <RefreshCw className="w-5 h-5" />
            <span>再練習</span>
          </div>
        )}

        {/* The Card */}
        <div
          id="active-hangul-flashcard"
          onClick={() => {
            if (Math.abs(dragOffset.x) < 10) {
              handleFlip();
            }
          }}
          onTouchStart={(e) => handleTouchStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleTouchMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => handleTouchStart(e.clientX, e.clientY)}
          onMouseMove={(e) => {
            if (isDragging) handleTouchMove(e.clientX, e.clientY);
          }}
          onMouseUp={handleTouchEnd}
          onMouseLeave={() => {
            if (isDragging) handleTouchEnd();
          }}
          className={`w-full max-w-2xl min-h-[460px] sm:min-h-[480px] rounded-3xl cursor-grab active:cursor-grabbing transition-all duration-300 transform-style-3d relative shadow-xl hover:shadow-2xl border ${
            isFlipped
              ? 'border-indigo-200/90 rotate-y-180 bg-linear-to-b from-stone-900 via-stone-900 to-indigo-950 text-white'
              : 'border-stone-200/90 bg-linear-to-b from-white via-stone-50/50 to-stone-100/60 text-stone-900'
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped
              ? `rotateY(180deg) translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${swipeRotation}deg)`
              : `rotateY(0deg) translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${swipeRotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.35s ease, box-shadow 0.3s ease',
          }}
        >
          {/* ===================== FRONT SIDE (正面: 純諺文大字 + 筆順Icon + 右下角發音) ===================== */}
          <div
            className={`w-full h-full p-5 sm:p-8 flex flex-col justify-between absolute inset-0 backface-hidden ${
              isFlipped ? 'pointer-events-none' : ''
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Front Header */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-stone-100 text-stone-800 border border-stone-200/80">
                {categoryMeta.label}
              </span>

              {/* Top Right: Stroke Order Icon Hint */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStrokeHint(!showStrokeHint);
                }}
                title={showStrokeHint ? '隱藏筆順' : '查看筆順'}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  showStrokeHint
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200/80'
                }`}
              >
                <PenTool className="w-4 h-4" />
              </button>
            </div>

            {/* Front Center: Big Hangul Character & optional stroke hint popup */}
            <div className="text-center my-auto py-4 relative flex flex-col items-center justify-center">
              <div className="text-8xl sm:text-9xl font-black text-stone-900 tracking-tight font-sans select-none drop-shadow-xs">
                {currentCard.char}
              </div>

              {/* Mobile clean swipe hint banner on card */}
              <div className="mt-2 text-[11px] text-stone-400 font-medium sm:hidden">
                👈 左滑「記住了」・👉 右滑「再練習」・點擊翻面
              </div>

              {/* Stroke Order Overlay Bubble */}
              {showStrokeHint && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 p-3.5 rounded-2xl bg-white/95 backdrop-blur-xs border border-indigo-200 text-xs text-stone-700 text-left space-y-1.5 shadow-lg max-w-sm w-full animate-fadeIn z-20"
                >
                  <div className="font-bold text-indigo-900 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>筆順指導</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStrokeHint(false);
                      }}
                      className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1 pt-1">
                    {currentCard.strokeOrder.map((step, idx) => (
                      <div key={idx} className="text-stone-600 flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Front Footer: Audio Play Button */}
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-stone-400 hidden sm:block">
                點擊卡片翻面看發音與口訣
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.speakKorean(currentCard.char, 0.7);
                  }}
                  title="慢速朗讀"
                  className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-stone-200/60"
                >
                  <span>🐢 慢音</span>
                </button>

                <button
                  id="front-audio-speak-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak();
                  }}
                  title="播放發音 (快捷鍵 V)"
                  className="p-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/25 active:scale-90 transition-transform cursor-pointer flex items-center gap-1.5"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* ===================== BACK SIDE (背面: 發音、注音、台語諧音) ===================== */}
          <div
            className={`w-full h-full p-4 sm:p-6 flex flex-col justify-between absolute inset-0 backface-hidden overflow-y-auto overscroll-contain rounded-3xl ${
              !isFlipped ? 'pointer-events-none' : ''
            }`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Back Header */}
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-rose-400">{currentCard.char}</span>
                <span className="text-xs text-stone-400">發音解析與記憶法</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.speakKorean(currentCard.char, 0.7);
                  }}
                  title="慢速朗讀"
                  className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors cursor-pointer border border-stone-700/60"
                >
                  🐢 慢速
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak();
                  }}
                  title="播放發音"
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Back Content */}
            <div className="space-y-2.5 my-auto py-2">
              {/* Pronunciation Badges (Zhuyin + Romaja + IPA) */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-stone-800/80 rounded-xl p-1.5 sm:p-2 border border-stone-700">
                  <div className="text-[10px] text-stone-400 font-semibold uppercase">注音符號</div>
                  <div className="text-base sm:text-lg font-black text-amber-300 mt-0.5">
                    {currentCard.zhuyin}
                  </div>
                </div>

                <div className="bg-stone-800/80 rounded-xl p-1.5 sm:p-2 border border-stone-700">
                  <div className="text-[10px] text-stone-400 font-semibold uppercase">羅馬拼音</div>
                  <div className="text-base sm:text-lg font-black text-sky-300 mt-0.5 font-mono">
                    {currentCard.romaja}
                  </div>
                </div>

                <div className="bg-stone-800/80 rounded-xl p-1.5 sm:p-2 border border-stone-700">
                  <div className="text-[10px] text-stone-400 font-semibold uppercase">音標 IPA</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-300 mt-0.5 font-mono">
                    {currentCard.ipa}
                  </div>
                </div>
              </div>

              {/* Mnemonic / Taiwanese-Chinese Sound Trick */}
              <div className="bg-indigo-950/60 rounded-xl p-2.5 sm:p-3 border border-indigo-800/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>台語 / 中文諧音助記：</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-200 leading-snug">
                  {currentCard.mnemonic}
                </p>
              </div>

              {/* Sound Tips */}
              <div className="text-xs text-stone-300 bg-stone-800/60 rounded-xl p-2 sm:p-2.5 border border-stone-700/60 leading-snug">
                <span className="font-semibold text-rose-300">👄 嘴型秘訣：</span> {currentCard.soundTip}
              </div>

              {/* Example Words with Sound */}
              <div className="space-y-1.5">
                <div className="text-[10px] sm:text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
                  範例單字（點擊試聽）：
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {currentCard.exampleWords.map((ex, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFx.speakKorean(ex.hangul, progress.settings.audioSpeed);
                      }}
                      className="bg-stone-800/90 hover:bg-stone-700/90 p-2 rounded-xl border border-stone-700 flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs sm:text-sm font-black text-white group-hover:text-rose-300">
                            {ex.hangul}
                          </span>
                          <span className="text-[10px] text-amber-300">({ex.zhuyin})</span>
                        </div>
                        <div className="text-[10px] text-stone-400 truncate">{ex.meaning}</div>
                      </div>
                      <Volume2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-white shrink-0 ml-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Back Footer */}
            <div className="border-t border-stone-800/80 pt-2 text-center text-[11px] text-stone-400 shrink-0">
              再次點擊翻回正面
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Bottom Controls (Hidden on mobile to keep mobile interface completely clean!) */}
      <div className="hidden sm:block bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Discard / Mastered Button (Left Swipe equivalent: 記住了) */}
          <button
            id="discard-card-btn"
            onClick={() => handleDiscardCurrent()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-sm sm:text-base transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div className="text-left">
              <div>👈 記住了</div>
              <div className="text-[10px] text-emerald-600 font-normal">已熟記・從本輪移除</div>
            </div>
          </button>

          {/* Practice Again Button (Right Swipe equivalent: 再練習) */}
          <button
            id="practice-again-btn"
            onClick={() => handlePracticeAgain()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-sm sm:text-base transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-4 h-4 text-amber-600" />
            <div className="text-left">
              <div>👉 再練習</div>
              <div className="text-[10px] text-amber-600 font-normal">留在牌堆繼續練</div>
            </div>
          </button>
        </div>

        {/* Nav Helpers on Desktop */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
          <button
            onClick={handlePrev}
            className="flex items-center gap-1 hover:text-stone-900 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>前一張</span>
          </button>

          <button
            onClick={handleFlip}
            className="flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>翻面 (Space)</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 hover:text-stone-900 cursor-pointer"
          >
            <span>下一張</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
