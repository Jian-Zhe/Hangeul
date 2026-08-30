import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VocabWord, UserProgress } from '../types';
import { VOCAB_DATABASE, VOCAB_CATEGORY_META } from '../data/vocabData';
import {
  Volume2,
  RotateCw,
  Shuffle,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  RefreshCw,
  Trophy,
  X,
  Undo2,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface VocabFlashcardViewProps {
  selectedVocabIds: string[];
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onGoToSelector: () => void;
}

interface ActionHistoryEntry {
  card: VocabWord;
  action: 'mastered' | 'practice';
  prevActive: VocabWord[];
  prevDiscarded: VocabWord[];
  prevIndex: number;
}

export const VocabFlashcardView: React.FC<VocabFlashcardViewProps> = ({
  selectedVocabIds,
  progress,
  onUpdateProgress,
  onGoToSelector,
}) => {
  // Filter selected vocabulary items
  const activeList = VOCAB_DATABASE.filter((w) => selectedVocabIds.includes(w.id));
  const initialPool = activeList.length > 0 ? activeList : VOCAB_DATABASE;

  // Deck state
  const [activeCards, setActiveCards] = useState<VocabWord[]>(initialPool);
  const [discardedCards, setDiscardedCards] = useState<VocabWord[]>([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [roundCompletedModal, setRoundCompletedModal] = useState(false);
  const [flyOutDirection, setFlyOutDirection] = useState<'left' | 'right' | null>(null);
  const [isInstantReset, setIsInstantReset] = useState(false);

  // Undo History Stack
  const [historyStack, setHistoryStack] = useState<ActionHistoryEntry[]>([]);

  // One-time dismissible gesture tip banner
  const [showSwipeTip, setShowSwipeTip] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hangul_vocab_swipe_hint_dismissed_v1') !== 'true';
    } catch {
      return true;
    }
  });

  const handleDismissTip = () => {
    setShowSwipeTip(false);
    try {
      localStorage.setItem('hangul_vocab_swipe_hint_dismissed_v1', 'true');
    } catch {}
  };

  // Touch Swipe Gesture State
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isAnimatingRef = useRef(false);

  // Sync cards when selectedVocabIds change
  useEffect(() => {
    setActiveCards(initialPool);
    setDiscardedCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRoundNumber(1);
    setRoundCompletedModal(false);
    setHistoryStack([]);
    setFlyOutDirection(null);
    isAnimatingRef.current = false;
  }, [selectedVocabIds]);

  const currentCard: VocabWord | undefined = activeCards[currentIndex];
  const nextCard: VocabWord | undefined =
    activeCards.length > 1
      ? activeCards[(currentIndex + 1) % activeCards.length]
      : undefined;
  const thirdCard: VocabWord | undefined =
    activeCards.length > 2
      ? activeCards[(currentIndex + 2) % activeCards.length]
      : undefined;

  // Speak current card
  const handleSpeak = useCallback((text?: string, rate?: number) => {
    if (!currentCard) return;
    const textToSpeak = text || currentCard.hangul;
    const speed = rate || progress.settings.audioSpeed;
    soundFx.speakKorean(textToSpeak, speed);
  }, [currentCard, progress.settings.audioSpeed]);

  // Flip card
  const handleFlip = useCallback(() => {
    if (isAnimatingRef.current || flyOutDirection) return;
    soundFx.playFlip();
    setIsFlipped((prev) => !prev);
  }, [flyOutDirection]);

  // Discard card action (Left swipe / "記住了" button)
  const handleDiscardCurrent = useCallback((targetCard?: VocabWord) => {
    const cardToDiscard = targetCard || currentCard;
    if (!cardToDiscard || isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    soundFx.playShortMastered();
    setFlyOutDirection('left');

    // Record undo state
    setHistoryStack((prev) => [
      ...prev.slice(-9),
      {
        card: cardToDiscard,
        action: 'mastered',
        prevActive: [...activeCards],
        prevDiscarded: [...discardedCards],
        prevIndex: currentIndex,
      },
    ]);

    // Update mastery status in progress
    onUpdateProgress((prev) => ({
      ...prev,
      vocabMastery: {
        ...prev.vocabMastery,
        [cardToDiscard.id]: {
          status: 'mastered',
          correctCount: (prev.vocabMastery?.[cardToDiscard.id]?.correctCount || 0) + 1,
          wrongCount: prev.vocabMastery?.[cardToDiscard.id]?.wrongCount || 0,
          lastReviewed: Date.now(),
        },
      },
    }));

    setTimeout(() => {
      setDiscardedCards((prev) => [...prev, cardToDiscard]);
      const newActive = activeCards.filter((c) => c.id !== cardToDiscard.id);
      setActiveCards(newActive);

      setIsInstantReset(true);
      setFlyOutDirection(null);
      setDragOffset({ x: 0, y: 0 });
      setIsFlipped(false);

      if (newActive.length === 0) {
        setRoundCompletedModal(true);
        soundFx.playChime();
      } else {
        setCurrentIndex((prev) => (prev >= newActive.length ? 0 : prev));
      }

      requestAnimationFrame(() => {
        setIsInstantReset(false);
        isAnimatingRef.current = false;
      });
    }, 240);
  }, [currentCard, activeCards, discardedCards, currentIndex, onUpdateProgress]);

  // Practice again action (Right swipe / "再練習" button)
  const handleKeepForPractice = useCallback((targetCard?: VocabWord) => {
    const cardToKeep = targetCard || currentCard;
    if (!cardToKeep || isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    soundFx.playShortPractice();
    setFlyOutDirection('right');

    setHistoryStack((prev) => [
      ...prev.slice(-9),
      {
        card: cardToKeep,
        action: 'practice',
        prevActive: [...activeCards],
        prevDiscarded: [...discardedCards],
        prevIndex: currentIndex,
      },
    ]);

    onUpdateProgress((prev) => ({
      ...prev,
      vocabMastery: {
        ...prev.vocabMastery,
        [cardToKeep.id]: {
          status: 'learning',
          correctCount: prev.vocabMastery?.[cardToKeep.id]?.correctCount || 0,
          wrongCount: (prev.vocabMastery?.[cardToKeep.id]?.wrongCount || 0) + 1,
          lastReviewed: Date.now(),
        },
      },
    }));

    setTimeout(() => {
      let nextIdx = currentIndex;
      if (activeCards.length > 1) {
        const withoutCurrent = activeCards.filter((c) => c.id !== cardToKeep.id);
        const insertPosition = Math.min(3, withoutCurrent.length);
        withoutCurrent.splice(insertPosition, 0, cardToKeep);
        setActiveCards(withoutCurrent);
        nextIdx = currentIndex % withoutCurrent.length;
      }

      setIsInstantReset(true);
      setFlyOutDirection(null);
      setDragOffset({ x: 0, y: 0 });
      setIsFlipped(false);
      setCurrentIndex(nextIdx);

      requestAnimationFrame(() => {
        setIsInstantReset(false);
        isAnimatingRef.current = false;
      });
    }, 240);
  }, [currentCard, activeCards, discardedCards, currentIndex, onUpdateProgress]);

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (historyStack.length === 0 || isAnimatingRef.current) return;

    const lastAction = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));

    setActiveCards(lastAction.prevActive);
    setDiscardedCards(lastAction.prevDiscarded);
    setCurrentIndex(lastAction.prevIndex);
    setIsFlipped(false);
    setRoundCompletedModal(false);
    setFlyOutDirection(null);
    setDragOffset({ x: 0, y: 0 });
    soundFx.playFlip();
  }, [historyStack]);

  const handleShuffle = () => {
    if (isAnimatingRef.current) return;
    const shuffled = [...activeCards].sort(() => Math.random() - 0.5);
    setActiveCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    soundFx.playFlip();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleDiscardCurrent();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleKeepForPractice();
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleDiscardCurrent, handleKeepForPractice, handleUndo]);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlaying || activeCards.length === 0) return;

    const intervalSeconds = progress.settings.autoPlayInterval || 4;
    const halfInterval = Math.max(1200, (intervalSeconds * 1000) / 2);

    handleSpeak();

    const flipTimer = setTimeout(() => {
      setIsFlipped(true);
    }, halfInterval);

    const advanceTimer = setTimeout(() => {
      setIsFlipped(false);
      setCurrentIndex((prev) => (prev + 1) % activeCards.length);
    }, intervalSeconds * 1000);

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(advanceTimer);
    };
  }, [isAutoPlaying, currentIndex, activeCards.length, progress.settings.autoPlayInterval, handleSpeak]);

  // Touch Gesture Listeners
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isAnimatingRef.current || flyOutDirection) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    touchStartRef.current = { x: clientX, y: clientY, time: Date.now() };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartRef.current || !isDragging || isAnimatingRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const dx = clientX - touchStartRef.current.x;
    const dy = clientY - touchStartRef.current.y;

    if (Math.abs(dx) > 10) {
      if ('touches' in e && Math.abs(dx) > Math.abs(dy) * 1.2 && e.cancelable) {
        e.preventDefault();
      }
      setDragOffset({ x: dx, y: dy * 0.2 });
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !isDragging || isAnimatingRef.current) {
      setIsDragging(false);
      return;
    }

    const { x: dx } = dragOffset;
    const dt = Date.now() - touchStartRef.current.time;
    const velocityX = Math.abs(dx) / (dt || 1);

    const threshold = window.innerWidth < 640 ? 60 : 90;
    const isQuickFlick = velocityX > 0.45 && Math.abs(dx) > 35;

    if (dx < -threshold || (isQuickFlick && dx < 0)) {
      handleDiscardCurrent();
    } else if (dx > threshold || (isQuickFlick && dx > 0)) {
      handleKeepForPractice();
    } else {
      if (Math.abs(dx) < 6 && dt < 250) {
        handleFlip();
      }
      setDragOffset({ x: 0, y: 0 });
    }

    setIsDragging(false);
    touchStartRef.current = null;
  };

  // Restart next round
  const handleStartNextRound = () => {
    setActiveCards(initialPool);
    setDiscardedCards([]);
    setRoundNumber((prev) => prev + 1);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRoundCompletedModal(false);
    setHistoryStack([]);
    soundFx.playChime();
  };

  if (!currentCard || activeCards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-md">
          <Trophy className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-stone-900">恭喜！本輪所有單字皆已掌握！</h2>
          <p className="text-sm text-stone-600">
            你已經將本組 {initialPool.length} 個韓語日常用語全數記住了。
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={handleStartNextRound}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            再次複習此清單 (第 {roundNumber + 1} 輪)
          </button>
          <button
            onClick={onGoToSelector}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-stone-100 text-stone-800 font-bold hover:bg-stone-200 transition-all active:scale-95 cursor-pointer"
          >
            前往挑選其他單字
          </button>
        </div>
      </div>
    );
  }

  const categoryMeta = VOCAB_CATEGORY_META[currentCard.category];

  // Calculate swipe indicator opacity
  const isSwipingLeft = dragOffset.x < -20;
  const isSwipingRight = dragOffset.x > 20;
  const leftOpacity = Math.min(Math.abs(dragOffset.x) / 90, 1);
  const rightOpacity = Math.min(Math.abs(dragOffset.x) / 90, 1);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-6 space-y-3 sm:space-y-6 select-none">
      {/* Top Bar: Round Status & Action Toolbar */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Deck Status */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="text-xs sm:text-sm font-black text-rose-900 bg-rose-50 px-2 sm:px-3 py-1 rounded-xl border border-rose-200 whitespace-nowrap shrink-0">
            第 {roundNumber} 輪
          </span>

          <span className="text-xs sm:text-sm font-semibold text-stone-600 bg-stone-100 px-2 sm:px-3 py-1 rounded-xl border border-stone-200 whitespace-nowrap shrink-0">
            剩餘 {activeCards.length} 詞
          </span>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Gesture Help / Tip Toggle Button */}
          <button
            id="vocab-swipe-help-tip-btn"
            onClick={() => setShowSwipeTip(!showSwipeTip)}
            title={showSwipeTip ? '隱藏操作提示' : '查看手勢與操作提示'}
            className={`p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
              showSwipeTip
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-stone-50 border-stone-200 text-stone-400 hover:text-stone-700'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Undo Button */}
          <button
            id="vocab-undo-action-btn"
            disabled={historyStack.length === 0}
            onClick={handleUndo}
            title={historyStack.length > 0 ? '還原上一張單字卡決定 (避免滑錯)' : '目前無可還原的操作'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              historyStack.length > 0
                ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 shadow-2xs active:scale-95'
                : 'bg-stone-50 border border-stone-200 text-stone-300 cursor-not-allowed opacity-50'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs whitespace-nowrap">還原</span>
          </button>

          {/* Auto Play */}
          <button
            id="vocab-flashcard-autoplay-btn"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            title={isAutoPlaying ? '暫停自動輪播' : '自動循環輪播字卡'}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              isAutoPlaying
                ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 fill-current shrink-0" />}
            <span className="hidden sm:inline whitespace-nowrap">{isAutoPlaying ? '自動播放中' : '自動'}</span>
          </button>

          {/* Shuffle */}
          <button
            id="vocab-flashcard-shuffle-btn"
            onClick={handleShuffle}
            title="隨機打亂順序"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Shuffle className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">洗牌</span>
          </button>
        </div>
      </div>

      {/* One-time dismissible gesture tip banner */}
      {showSwipeTip && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-rose-50/90 border border-rose-200/80 text-xs text-rose-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-[11px] sm:text-xs">
              <strong>手勢操作提示：</strong>左右滑動卡片（👈 左滑「記住了」・👉 右滑「再練習」），點擊卡片即可翻面查看意思與諧音助記。
            </span>
          </div>
          <button
            onClick={handleDismissTip}
            className="p-1 rounded-lg text-rose-500 hover:text-rose-800 hover:bg-rose-100/80 transition-colors cursor-pointer shrink-0"
            title="關閉提示 (不再主動顯示)"
            aria-label="關閉提示"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Flashcard Container with Swipe Support */}
      <div className="perspective-1000 min-h-[460px] sm:min-h-[480px] w-full flex justify-center relative touch-pan-y">
        {/* Swipe Feedback Overlay Badge - LEFT: 記住了 */}
        {(isSwipingLeft || flyOutDirection === 'left') && (
          <div
            className="absolute left-4 sm:left-6 top-6 sm:top-8 z-30 pointer-events-none px-4 py-2 rounded-2xl bg-emerald-600 text-white font-black text-sm sm:text-base shadow-xl flex items-center gap-2 border-2 border-white transition-opacity duration-200"
            style={{ opacity: flyOutDirection === 'left' ? 1 : leftOpacity }}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>記住了</span>
          </div>
        )}

        {/* Swipe Feedback Overlay Badge - RIGHT: 再練習 */}
        {(isSwipingRight || flyOutDirection === 'right') && (
          <div
            className="absolute right-4 sm:right-6 top-6 sm:top-8 z-30 pointer-events-none px-4 py-2 rounded-2xl bg-amber-500 text-white font-black text-sm sm:text-base shadow-xl flex items-center gap-2 border-2 border-white transition-opacity duration-200"
            style={{ opacity: flyOutDirection === 'right' ? 1 : rightOpacity }}
          >
            <RefreshCw className="w-5 h-5" />
            <span>再練習</span>
          </div>
        )}

        {/* 3rd Deck Card in background */}
        {thirdCard && (
          <div
            className="absolute w-full max-w-2xl min-h-[460px] sm:min-h-[480px] rounded-3xl border border-stone-200 bg-stone-50 shadow-2xs pointer-events-none"
            style={{
              transform: `scale(${0.88 + 0.06 * (flyOutDirection ? 1 : Math.min(Math.abs(dragOffset.x) / 120, 1))}) translateY(${
                24 - 12 * (flyOutDirection ? 1 : Math.min(Math.abs(dragOffset.x) / 120, 1))
              }px)`,
              zIndex: 1,
              transition: isInstantReset ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        )}

        {/* 2nd Deck Card in background (Visual preview matching top card format) */}
        {nextCard && (
          <div
            className="absolute w-full max-w-2xl min-h-[460px] sm:min-h-[480px] rounded-3xl border border-stone-200/90 bg-white/95 shadow-md pointer-events-none p-5 sm:p-7 flex flex-col justify-between"
            style={{
              transform: `scale(${0.94 + 0.06 * (flyOutDirection ? 1 : Math.min(Math.abs(dragOffset.x) / 120, 1))}) translateY(${
                12 - 12 * (flyOutDirection ? 1 : Math.min(Math.abs(dragOffset.x) / 120, 1))
              }px)`,
              zIndex: 2,
              transition: isInstantReset ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header: Category Badge & Voice */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-stone-100 text-stone-700">
                {VOCAB_CATEGORY_META[nextCard.category]?.label || '日常用語'}
              </span>
              <div className="p-2 rounded-xl text-stone-400 bg-stone-100">
                <Volume2 className="w-4 h-4" />
              </div>
            </div>

            {/* Middle: Clean Korean Word Display */}
            <div className="my-auto text-center space-y-3 py-6">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 font-sans tracking-tight">
                {nextCard.hangul}
              </div>
              <div className="text-xs sm:text-sm text-stone-500 font-mono">
                {nextCard.romaja}・{nextCard.zhuyin}
              </div>
            </div>

            {/* Bottom Actions Skeleton */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-100/80">
              <div className="flex-1 py-2 rounded-xl bg-stone-100 text-center text-xs font-bold text-stone-400">
                記住了
              </div>
              <div className="mx-2 w-8" />
              <div className="flex-1 py-2 rounded-xl bg-stone-100 text-center text-xs font-bold text-stone-400">
                再練習
              </div>
            </div>
          </div>
        )}

        {/* Active Top Flashcard */}
        <div
          id="active-vocab-flashcard"
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative z-10 w-full max-w-2xl min-h-[460px] sm:min-h-[480px] rounded-3xl bg-white border border-stone-200/90 shadow-xl p-5 sm:p-7 flex flex-col justify-between select-none cursor-grab active:cursor-grabbing ${
            isDragging ? 'transition-none' : isInstantReset ? 'transition-none' : 'transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1)'
          }`}
          style={{
            transform: flyOutDirection
              ? `translateX(${flyOutDirection === 'left' ? '-120%' : '120%'}) rotate(${
                  flyOutDirection === 'left' ? -18 : 18
                }deg)`
              : `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${dragOffset.x * 0.06}deg)`,
            opacity: flyOutDirection ? 0 : 1,
          }}
        >
          {/* Card Top Row: Category Tag & Sound */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {categoryMeta?.label || '日常用語'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak();
                }}
                className="p-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors shadow-2xs cursor-pointer"
                title="朗讀發音"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Card Middle: Korean Word, Romaja, and Flip Info */}
          <div className="my-auto py-4 text-center space-y-3">
            {!isFlipped ? (
              /* Front Side: Korean Display */
              <div className="space-y-3">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-normal font-sans leading-tight">
                  {currentCard.hangul}
                </div>
                <div className="text-stone-500 font-mono text-sm sm:text-base">
                  [{currentCard.romaja}]・{currentCard.zhuyin}
                </div>
                <div className="text-xs text-stone-400 pt-2 flex items-center justify-center gap-1">
                  <RotateCw className="w-3 h-3" />
                  <span>點擊卡片翻面看中文諧音與拆解</span>
                </div>
              </div>
            ) : (
              /* Back Side: Meaning, Taiwanese Mnemonic, and Syllable Breakdown */
              <div className="space-y-3 animate-fadeIn">
                <div className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                  {currentCard.meaning}
                </div>

                {/* Taiwanese Mnemonic Box */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-left space-y-1">
                  <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>速記與情境線索</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-amber-950">
                    💡 {currentCard.cognateClue}
                  </div>
                </div>

                {/* Syllables breakdown if present */}
                {currentCard.syllablesBreakdown && currentCard.syllablesBreakdown.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    {currentCard.syllablesBreakdown.map((syl, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 font-mono text-xs border border-stone-200"
                      >
                        {syl.syllable} ({syl.consonant}+{syl.vowel}{syl.batchim ? `+${syl.batchim}` : ''})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Bottom Row: Swipe Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-stone-100">
            <button
              id="btn-vocab-discard"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDiscardCurrent();
              }}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs sm:text-sm border border-emerald-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>記住了 (👈 左滑)</span>
            </button>

            <button
              id="btn-vocab-flip"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFlip();
              }}
              className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all active:scale-95 cursor-pointer"
              title="翻轉卡片"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              id="btn-vocab-practice"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleKeepForPractice();
              }}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs sm:text-sm border border-amber-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <span>再練習 (👉 右滑)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
