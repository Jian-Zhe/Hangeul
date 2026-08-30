import React from 'react';
import { UserProgress, SymbolCategory, MasteryStatus } from '../types';
import { HANGUL_SYMBOLS, SYMBOL_CATEGORY_LABELS } from '../data/hangulData';
import { VOCAB_DATABASE, VOCAB_CATEGORY_META } from '../data/vocabData';
import {
  Trophy,
  CheckCircle2,
  HelpCircle,
  BarChart2,
  RotateCcw,
  Flame,
  Award,
  BookOpen,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface ProgressDashboardProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onStudyWeakSymbols: (weakIds: string[]) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  progress,
  onUpdateProgress,
  onStudyWeakSymbols,
}) => {
  const allSymbols = HANGUL_SYMBOLS;

  const masteredSymbols = allSymbols.filter(
    (s) => progress.symbolMastery[s.id]?.status === 'mastered'
  );
  const learningSymbols = allSymbols.filter(
    (s) => progress.symbolMastery[s.id]?.status === 'learning'
  );
  const unlearnedSymbols = allSymbols.filter(
    (s) => !progress.symbolMastery[s.id] || progress.symbolMastery[s.id]?.status === 'unlearned'
  );

  const masteryPercent = Math.round((masteredSymbols.length / allSymbols.length) * 100);

  // Vocabulary stats
  const totalVocab = VOCAB_DATABASE.length;
  const masteredVocab = VOCAB_DATABASE.filter(
    (w) => progress.vocabMastery?.[w.id]?.status === 'mastered'
  );
  const vocabMasteryPercent = totalVocab > 0 ? Math.round((masteredVocab.length / totalVocab) * 100) : 0;

  // Category statistics
  const getCategoryStats = (category: SymbolCategory) => {
    const list = allSymbols.filter((s) => s.category === category);
    const mastered = list.filter(
      (s) => progress.symbolMastery[s.id]?.status === 'mastered'
    ).length;
    return {
      total: list.length,
      mastered,
      percent: list.length > 0 ? Math.round((mastered / list.length) * 100) : 0,
    };
  };

  const basicConsonants = getCategoryStats('basic_consonant');
  const doubleConsonants = getCategoryStats('double_consonant');
  const basicVowels = getCategoryStats('basic_vowel');
  const compoundVowels = getCategoryStats('compound_vowel');
  const batchimBasic = getCategoryStats('batchim_basic');
  const batchimDouble = getCategoryStats('batchim_double');

  const accuracyPercent =
    progress.quizStats.totalAnswered > 0
      ? Math.round((progress.quizStats.totalCorrect / progress.quizStats.totalAnswered) * 100)
      : 0;

  const handleResetProgress = () => {
    if (window.confirm('確定要重置所有學習進度與測驗紀錄嗎？')) {
      onUpdateProgress((prev) => ({
        ...prev,
        symbolMastery: {},
        vocabMastery: {},
        quizStats: {
          totalAnswered: 0,
          totalCorrect: 0,
          streak: 0,
          bestStreak: 0,
          history: [],
        },
      }));
    }
  };

  const handleStudyNeedsReview = () => {
    const weakList = [...learningSymbols, ...unlearnedSymbols].map((s) => s.id);
    if (weakList.length > 0) {
      onStudyWeakSymbols(weakList);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Mastery Rate */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">符號掌握度</span>
            <Trophy className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">{masteryPercent}%</span>
            <span className="text-xs text-stone-500 font-semibold">
              ({masteredSymbols.length}/{allSymbols.length} 個)
            </span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
        </div>

        {/* Vocab Mastery Rate */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">日常單字掌握度</span>
            <BookOpen className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{vocabMasteryPercent}%</span>
            <span className="text-xs text-stone-500 font-semibold">
              ({masteredVocab.length}/{totalVocab} 詞)
            </span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${vocabMasteryPercent}%` }}
            />
          </div>
        </div>

        {/* Quiz Accuracy */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">測驗正確率</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600">{accuracyPercent}%</span>
            <span className="text-xs text-stone-500 font-semibold">
              ({progress.quizStats.totalCorrect}/{progress.quizStats.totalAnswered} 題)
            </span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-500"
              style={{ width: `${accuracyPercent}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">連勝紀錄</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-500">
              {progress.quizStats.streak} 回
            </span>
            <span className="text-xs text-stone-500 font-semibold">
              (最佳 {progress.quizStats.bestStreak} 回)
            </span>
          </div>
          <div className="text-xs text-stone-400">保持連續答對獲取高分</div>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-600" />
          <span>字母與終聲分組掌握進度</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Basic Consonants */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-800">14 基本子音</span>
              <span>
                {basicConsonants.mastered} / {basicConsonants.total} ({basicConsonants.percent}%)
              </span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${basicConsonants.percent}%` }}
              />
            </div>
          </div>

          {/* Double Consonants */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-amber-800">5 濃音/雙子音</span>
              <span>
                {doubleConsonants.mastered} / {doubleConsonants.total} ({doubleConsonants.percent}%)
              </span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${doubleConsonants.percent}%` }}
              />
            </div>
          </div>

          {/* Basic Vowels */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-blue-800">10 基本母音</span>
              <span>
                {basicVowels.mastered} / {basicVowels.total} ({basicVowels.percent}%)
              </span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${basicVowels.percent}%` }}
              />
            </div>
          </div>

          {/* Compound Vowels */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-purple-800">11 複合母音</span>
              <span>
                {compoundVowels.mastered} / {compoundVowels.total} ({compoundVowels.percent}%)
              </span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-500"
                style={{ width: `${compoundVowels.percent}%` }}
              />
            </div>
          </div>

          {/* Basic Batchim */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-rose-800">7 大代表收音</span>
              <span>
                {batchimBasic.mastered} / {batchimBasic.total} ({batchimBasic.percent}%)
              </span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${batchimBasic.percent}%` }}
              />
            </div>
          </div>

          {/* Double Batchim */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-indigo-800">11 個雙收音口訣</span>
              <span>
                {batchimDouble.mastered} / {batchimDouble.total} ({batchimDouble.percent}%)
              </span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-500"
                style={{ width: `${batchimDouble.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 58-Symbol Visual Mastery Matrix */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-stone-900">韓文字母與終聲掌握矩陣 ({allSymbols.length} 個)</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              點擊任一字母可直接聽音，點擊右側狀態標籤可快速切換掌握程度。
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-md bg-emerald-500" />
              <span className="text-stone-600">已掌握 ({masteredSymbols.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-md bg-amber-400" />
              <span className="text-stone-600">學習中 ({learningSymbols.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-md bg-stone-300" />
              <span className="text-stone-600">未學習 ({unlearnedSymbols.length})</span>
            </div>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2.5">
          {allSymbols.map((sym) => {
            const status: MasteryStatus = progress.symbolMastery[sym.id]?.status || 'unlearned';

            return (
              <div
                key={sym.id}
                onClick={() => soundFx.speakKorean(sym.char, progress.settings.audioSpeed)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between ${
                  status === 'mastered'
                    ? 'border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950'
                    : status === 'learning'
                    ? 'border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 text-amber-950'
                    : 'border-stone-200 bg-stone-50/70 hover:bg-stone-100 text-stone-600'
                }`}
              >
                <div className="text-2xl font-black tracking-tight font-sans">
                  {sym.char}
                </div>
                <div className="text-[11px] font-bold mt-0.5">
                  {sym.zhuyin}
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  {sym.romaja}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextStatus: MasteryStatus =
                      status === 'unlearned' ? 'learning' : status === 'learning' ? 'mastered' : 'unlearned';
                    onUpdateProgress((prev) => ({
                      ...prev,
                      symbolMastery: {
                        ...prev.symbolMastery,
                        [sym.id]: {
                          status: nextStatus,
                          correctCount: prev.symbolMastery[sym.id]?.correctCount || 0,
                          wrongCount: prev.symbolMastery[sym.id]?.wrongCount || 0,
                        },
                      },
                    }));
                  }}
                  className="mt-1.5 text-[10px] py-0.5 px-1.5 rounded-md font-semibold bg-white/80 border border-stone-200/80 hover:bg-white transition-colors"
                >
                  {status === 'mastered' ? '✅ 已掌握' : status === 'learning' ? '⏳ 學習中' : '⚪ 未學'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Progress Section */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleResetProgress}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-rose-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重置所有紀錄資料</span>
        </button>
      </div>
    </div>
  );
};
