import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { VocabWord, UserProgress, QuizMode } from '../types';
import { VOCAB_DATABASE, VOCAB_CATEGORY_META } from '../data/vocabData';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Trophy,
  Brain,
  Lightbulb,
  Headphones,
  Award,
  Layers,
  Check,
  Flame,
} from 'lucide-react';

interface QuizViewProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
}

interface QuizQuestion {
  word: VocabWord;
  options: {
    text: string;
    pronunciation: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export const QuizView: React.FC<QuizViewProps> = ({ progress, onUpdateProgress }) => {
  const [quizMode, setQuizMode] = useState<QuizMode>('meaning');
  const [questionPoolSize, setQuestionPoolSize] = useState<number>(100); // 10, 25, 50, 100
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [sessionHistory, setSessionHistory] = useState<{ word: VocabWord; isCorrect: boolean }[]>([]);
  const [currentRound, setCurrentRound] = useState(1);

  // Generate randomized quiz questions from VOCAB_DATABASE without repeats in the round
  const generateQuestions = useCallback((mode: QuizMode, count: number = questionPoolSize) => {
    // Shuffle the full 100 vocab words
    const shuffledVocab = [...VOCAB_DATABASE].sort(() => Math.random() - 0.5);
    const targetSlice = shuffledVocab.slice(0, Math.min(count, VOCAB_DATABASE.length));

    const questions: QuizQuestion[] = targetSlice.map((targetWord) => {
      // Pick 3 distractors from the rest of the 100-word database
      const distractors = VOCAB_DATABASE.filter((w) => w.id !== targetWord.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const allOptions = [
        {
          text: `${targetWord.meaning} ${targetWord.hanja ? `(${targetWord.hanja})` : ''}`,
          pronunciation: `${targetWord.zhuyin} / ${targetWord.romaja}`,
          isCorrect: true,
          explanation: targetWord.cognateClue,
        },
        ...distractors.map((d) => ({
          text: `${d.meaning} ${d.hanja ? `(${d.hanja})` : ''}`,
          pronunciation: `${d.zhuyin} / ${d.romaja}`,
          isCorrect: false,
          explanation: d.cognateClue,
        })),
      ].sort(() => Math.random() - 0.5);

      return {
        word: targetWord,
        options: allOptions,
      };
    });

    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setHasAnswered(false);
    setScore(0);
    setQuizFinished(false);
    setShowHint(false);
    setSessionHistory([]);
  }, [questionPoolSize]);

  useEffect(() => {
    generateQuestions(quizMode, questionPoolSize);
  }, [quizMode, questionPoolSize, generateQuestions]);

  const currentQ = quizQuestions[currentQuestionIndex];

  // Auto-play sound when listening mode is active
  useEffect(() => {
    if (quizMode === 'listening' && currentQ && !hasAnswered && !quizFinished) {
      soundFx.speakKorean(currentQ.word.hangul, progress.settings.audioSpeed);
    }
  }, [currentQuestionIndex, quizMode, currentQ, hasAnswered, quizFinished, progress.settings.audioSpeed]);

  const handleSelectOption = (idx: number) => {
    if (hasAnswered || !currentQ) return;

    setSelectedOptionIndex(idx);
    setHasAnswered(true);

    const isCorrect = currentQ.options[idx].isCorrect;
    if (isCorrect) {
      soundFx.playChime();
      setScore((s) => s + 1);
    } else {
      soundFx.playError();
    }

    // Play word speech immediately
    soundFx.speakKorean(currentQ.word.hangul, progress.settings.audioSpeed);

    setSessionHistory((prev) => [...prev, { word: currentQ.word, isCorrect }]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setHasAnswered(false);
      setShowHint(false);
    } else {
      // Finish Quiz Round
      setQuizFinished(true);
      
      // Trigger Confetti
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore
      }

      // Update global progress stats
      onUpdateProgress((prev) => {
        const totalQ = quizQuestions.length;
        const newTotalAnswered = prev.quizStats.totalAnswered + totalQ;
        const newTotalCorrect = prev.quizStats.totalCorrect + score;
        const isGreat = score >= totalQ * 0.7;
        const newStreak = isGreat ? prev.quizStats.streak + 1 : 0;
        const bestStreak = Math.max(newStreak, prev.quizStats.bestStreak);

        return {
          ...prev,
          quizStats: {
            ...prev.quizStats,
            totalAnswered: newTotalAnswered,
            totalCorrect: newTotalCorrect,
            streak: newStreak,
            bestStreak,
            history: [
              {
                date: new Date().toLocaleDateString('zh-TW'),
                mode: quizMode,
                score,
                total: totalQ,
              },
              ...prev.quizStats.history.slice(0, 19),
            ],
          },
        };
      });
    }
  };

  const handleStartNextRound = () => {
    setCurrentRound((r) => r + 1);
    generateQuestions(quizMode, questionPoolSize);
  };

  if (!currentQ && !quizFinished) {
    return (
      <div className="text-center py-12 text-stone-500">
        正在載入 100 題隨機題庫...
      </div>
    );
  }

  const categoryMeta = currentQ ? VOCAB_CATEGORY_META[currentQ.word.category] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Quiz Mode & Question Count Selector Bar */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-rose-500 shrink-0" />
          <div className="text-left">
            <h2 className="font-bold text-stone-900 text-sm sm:text-base">
              認字測驗 (總共 100 題・隨機不重複)
            </h2>
            <div className="text-[11px] text-stone-500">
              第 {currentRound} 輪・共 {VOCAB_DATABASE.length} 個生活台華諧音高頻字
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
          {/* Question Count Pills */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            {[10, 25, 50, 100].map((count) => (
              <button
                key={count}
                onClick={() => {
                  setQuestionPoolSize(count);
                  generateQuestions(quizMode, count);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  questionPoolSize === count
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {count === 100 ? '100題全套' : `${count}題`}
              </button>
            ))}
          </div>

          {/* Mode Switch */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setQuizMode('meaning')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                quizMode === 'meaning'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🔤 認字
            </button>
            <button
              onClick={() => setQuizMode('listening')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                quizMode === 'listening'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>聽音</span>
            </button>
          </div>
        </div>
      </div>

      {!quizFinished ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Question Card Header & Progress */}
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200/90 shadow-md space-y-5 sm:space-y-6">
            {/* Top Info Bar */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  第 {currentQuestionIndex + 1} / {quizQuestions.length} 題
                </span>
                {categoryMeta && (
                  <span className={`text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-medium border ${categoryMeta.badgeColor}`}>
                    {categoryMeta.label}
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-stone-500">
                目前得分: <span className="text-rose-600 font-extrabold text-sm">{score}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-linear-to-r from-rose-500 to-indigo-600 h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`,
                }}
              />
            </div>

            {/* Target Hangul Prompt Area */}
            <div className="text-center py-2 sm:py-4 space-y-3 sm:space-y-4">
              {quizMode === 'listening' ? (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-stone-500">
                    🎧 請仔細聽韓語發音，選出正確的單字與字義：
                  </div>
                  <button
                    onClick={() => soundFx.speakKorean(currentQ.word.hangul, progress.settings.audioSpeed)}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-linear-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Volume2 className="w-6 h-6 animate-pulse" />
                    <span>點擊重新朗讀單字發音</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-stone-500">
                    請認讀下列韓文單字，利用台語或中文發音推敲其意：
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-5xl sm:text-6xl font-black text-stone-900 tracking-tight font-sans">
                      {currentQ.word.hangul}
                    </span>
                    <button
                      onClick={() => soundFx.speakKorean(currentQ.word.hangul, progress.settings.audioSpeed)}
                      title="點擊聽發音"
                      className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-5 h-5 text-rose-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* Cognate Clue Peek Button */}
              {!hasAnswered && (
                <div>
                  {showHint ? (
                    <div className="inline-flex items-center gap-1.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left max-w-md animate-fadeIn">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>💡 記憶提示：{currentQ.word.cognateClue}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowHint(true)}
                      className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-amber-600 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>需要一點台語/中文諧音線索提示？</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOptionIndex === idx;
                let btnStyle = 'border-stone-200 hover:border-indigo-400 bg-stone-50 hover:bg-indigo-50/40 text-stone-800';

                if (hasAnswered) {
                  if (opt.isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400 font-bold';
                  } else if (isSelected && !opt.isCorrect) {
                    btnStyle = 'border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-300 opacity-80';
                  } else {
                    btnStyle = 'border-stone-200 bg-stone-100/50 text-stone-400 opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={hasAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 flex items-start justify-between gap-3 ${btnStyle} cursor-pointer`}
                  >
                    <div className="space-y-1">
                      <div className="text-sm sm:text-base font-bold flex items-center gap-2">
                        <span>{opt.text}</span>
                      </div>
                      <div className="text-xs text-stone-500 font-medium">
                        讀音：<span className="text-indigo-700 font-semibold">{opt.pronunciation}</span>
                      </div>
                    </div>

                    {hasAnswered && opt.isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    {hasAnswered && isSelected && !opt.isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation & Syllable Breakdown Card */}
            {hasAnswered && (
              <div className="rounded-2xl p-4 sm:p-5 bg-stone-900 text-white space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl font-black text-rose-400">{currentQ.word.hangul}</span>
                    <span className="text-sm font-bold text-amber-300">
                      [{currentQ.word.zhuyin}] / {currentQ.word.romaja}
                    </span>
                  </div>

                  <button
                    onClick={() => soundFx.speakKorean(currentQ.word.hangul, progress.settings.audioSpeed)}
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Cognate Clue */}
                <div className="bg-stone-800/80 rounded-xl p-3 border border-stone-700 text-xs sm:text-sm text-stone-200 leading-relaxed">
                  <span className="font-bold text-amber-400">💡 推敲原理：</span> {currentQ.word.cognateClue}
                </div>

                {/* Syllable Component Breakdown */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
                    🧩 字母拆解拼讀：
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentQ.word.syllablesBreakdown.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-stone-800 px-3 py-2 rounded-xl border border-stone-700 flex items-center gap-1.5 sm:gap-2 text-xs"
                      >
                        <span className="text-base font-black text-white">{s.syllable}</span>
                        <span className="text-stone-400">=</span>
                        <span className="text-emerald-300 font-bold">{s.consonant} ({s.consonantZhuyin})</span>
                        <span className="text-stone-400">+</span>
                        <span className="text-sky-300 font-bold">{s.vowel} ({s.vowelZhuyin})</span>
                        {s.batchim && (
                          <>
                            <span className="text-stone-400">+</span>
                            <span className="text-amber-300 font-bold">尾音 {s.batchim} ({s.batchimZhuyin})</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Example sentence if available */}
                {currentQ.word.exampleSentence && (
                  <div className="text-xs text-stone-300 bg-stone-800/50 p-2.5 rounded-xl border border-stone-700/60 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-stone-200">
                        {currentQ.word.exampleSentence.hangul}
                      </div>
                      <div className="text-stone-400 text-[11px]">
                        {currentQ.word.exampleSentence.translation}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        soundFx.speakKorean(currentQ.word.exampleSentence!.hangul, progress.settings.audioSpeed)
                      }
                      className="p-1 rounded-md text-stone-400 hover:text-white cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Next Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-rose-500 to-indigo-500 hover:from-rose-400 hover:to-indigo-400 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <span>{currentQuestionIndex + 1 < quizQuestions.length ? '下一題' : '查看本輪測驗成績'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Quiz Finished Screen */
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black text-stone-900">
              🎉 恭喜完成第 {currentRound} 輪認字測驗！
            </h3>
            <p className="text-sm text-stone-600">
              您已依序挑戰了 {quizQuestions.length} 個精選韓語單字
            </p>
          </div>

          {/* Score Badge */}
          <div className="inline-flex items-center gap-4 bg-stone-50 border border-stone-200 px-6 py-4 rounded-2xl">
            <div>
              <div className="text-3xl font-black text-rose-600">
                {score} / {quizQuestions.length}
              </div>
              <div className="text-xs text-stone-500 font-medium">測驗得分</div>
            </div>
            <div className="h-8 w-px bg-stone-200" />
            <div>
              <div className="text-2xl font-bold text-indigo-600">
                {Math.round((score / quizQuestions.length) * 100)}%
              </div>
              <div className="text-xs text-stone-500 font-medium">正確率</div>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="text-left space-y-2 border-t border-stone-100 pt-5">
            <div className="text-xs font-bold text-stone-700 uppercase tracking-wide">
              本輪單字回顧清單：
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {sessionHistory.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => soundFx.speakKorean(item.word.hangul, progress.settings.audioSpeed)}
                  className="p-2.5 rounded-xl border border-stone-200 hover:border-indigo-300 bg-stone-50 hover:bg-indigo-50/30 flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <span className="font-black text-stone-900 text-sm">{item.word.hangul}</span>
                      <span className="text-stone-500 ml-1.5">({item.word.meaning})</span>
                    </div>
                  </div>
                  <Volume2 className="w-3.5 h-3.5 text-stone-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleStartNextRound}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>進入下一輪全新 100 題隨機測驗</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
