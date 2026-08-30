import React, { useState, useMemo } from 'react';
import { VOCAB_DATABASE, VOCAB_CATEGORY_META } from '../data/vocabData';
import { VocabCategory, UserProgress } from '../types';
import {
  Filter,
  Play,
  Volume2,
  RotateCcw,
  Search,
  Check,
  Sparkles,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface VocabSelectorProps {
  selectedVocabIds: string[];
  onChangeSelectedVocabIds: (ids: string[]) => void;
  onStartLearning: () => void;
  progress: UserProgress;
}

export const VocabSelector: React.FC<VocabSelectorProps> = ({
  selectedVocabIds,
  onChangeSelectedVocabIds,
  onStartLearning,
  progress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<VocabCategory | 'all'>('all');

  const isAllSelected = selectedVocabIds.length === VOCAB_DATABASE.length;

  const handleToggle = (id: string) => {
    if (selectedVocabIds.includes(id)) {
      if (selectedVocabIds.length === 1) {
        return; // keep at least 1
      }
      onChangeSelectedVocabIds(selectedVocabIds.filter((item) => item !== id));
    } else {
      onChangeSelectedVocabIds([...selectedVocabIds, id]);
    }
  };

  const handleSelectCategory = (category: VocabCategory, select: boolean) => {
    const catIds = VOCAB_DATABASE.filter((w) => w.category === category).map((w) => w.id);
    if (select) {
      const combined = Array.from(new Set([...selectedVocabIds, ...catIds]));
      onChangeSelectedVocabIds(combined);
    } else {
      const filtered = selectedVocabIds.filter((id) => !catIds.includes(id));
      onChangeSelectedVocabIds(filtered.length > 0 ? filtered : [VOCAB_DATABASE[0].id]);
    }
  };

  const handleSelectPreset = (
    preset: 'all' | 'greetings' | 'daily' | 'food' | 'travel' | 'taiwanese' | 'verbs' | 'weak'
  ) => {
    let ids: string[] = [];
    switch (preset) {
      case 'all':
        ids = VOCAB_DATABASE.map((w) => w.id);
        break;
      case 'greetings':
        ids = VOCAB_DATABASE.filter((w) => w.category === 'daily_greeting').map((w) => w.id);
        break;
      case 'daily':
        ids = VOCAB_DATABASE.filter((w) => w.category === 'daily_phrase').map((w) => w.id);
        break;
      case 'food':
        ids = VOCAB_DATABASE.filter((w) => w.category === 'food_dining').map((w) => w.id);
        break;
      case 'travel':
        ids = VOCAB_DATABASE.filter((w) => w.category === 'travel_shopping').map((w) => w.id);
        break;
      case 'taiwanese':
        ids = VOCAB_DATABASE.filter((w) => w.category === 'taiwanese_cognate').map((w) => w.id);
        break;
      case 'verbs':
        ids = VOCAB_DATABASE.filter((w) => w.category === 'core_verb_adj').map((w) => w.id);
        break;
      case 'weak':
        ids = VOCAB_DATABASE.filter((w) => {
          const status = progress.vocabMastery?.[w.id]?.status;
          return status === 'learning' || status === 'unlearned';
        }).map((w) => w.id);
        if (ids.length === 0) {
          ids = VOCAB_DATABASE.map((w) => w.id);
        }
        break;
    }
    onChangeSelectedVocabIds(ids);
  };

  const categories: VocabCategory[] = [
    'daily_greeting',
    'daily_phrase',
    'travel_shopping',
    'food_dining',
    'taiwanese_cognate',
    'mandarin_cognate',
    'loanword',
    'core_verb_adj',
    'daily_basic',
  ];

  // Filtered list for display
  const displayedCategories = useMemo(() => {
    if (selectedCategoryTab === 'all') return categories;
    return [selectedCategoryTab];
  }, [selectedCategoryTab]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-5 space-y-4">
      {/* Top Banner with Presets & Action */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-rose-600" />
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">挑選日常用語背誦清單</h2>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                共 {VOCAB_DATABASE.length} 常用詞
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              依生活場景自由勾選想背誦的韓語短句或實用單字，立即開始客製化字卡背誦！
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2">
            <button
              id="start-vocab-learning-btn"
              onClick={onStartLearning}
              disabled={selectedVocabIds.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-md shadow-rose-500/25 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>開始背誦單字 ({selectedVocabIds.length} 詞)</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="border-t border-stone-100 pt-2.5">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
            常用主題快捷挑選：
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleSelectPreset('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isAllSelected
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              全部 {VOCAB_DATABASE.length} 詞
            </button>
            <button
              onClick={() => handleSelectPreset('greetings')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              👋 問候禮貌
            </button>
            <button
              onClick={() => handleSelectPreset('daily')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              ☕ 生活短句
            </button>
            <button
              onClick={() => handleSelectPreset('food')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              🍜 韓國美食
            </button>
            <button
              onClick={() => handleSelectPreset('travel')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
            >
              ✈️ 旅遊購物
            </button>
            <button
              onClick={() => handleSelectPreset('taiwanese')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
            >
              💡 台語超像詞
            </button>
            <button
              onClick={() => handleSelectPreset('verbs')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
            >
              ⚡ 核心動詞
            </button>
            <button
              onClick={() => handleSelectPreset('weak')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>待複習單字</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Category Filter Pills */}
        <div className="border-t border-stone-100 pt-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="搜尋韓文、中文、台語/漢語諧音..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategoryTab('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCategoryTab === 'all'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              全部類別
            </button>
            {categories.map((catKey) => {
              const meta = VOCAB_CATEGORY_META[catKey];
              if (!meta) return null;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategoryTab(catKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategoryTab === catKey
                      ? 'bg-rose-600 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {meta.label.split('・')[0].split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vocabulary Categories & Items */}
      <div className="space-y-4">
        {displayedCategories.map((categoryKey) => {
          const meta = VOCAB_CATEGORY_META[categoryKey];
          if (!meta) return null;

          let words = VOCAB_DATABASE.filter((w) => w.category === categoryKey);

          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            words = words.filter(
              (w) =>
                w.hangul.toLowerCase().includes(q) ||
                w.meaning.toLowerCase().includes(q) ||
                w.romaja.toLowerCase().includes(q) ||
                w.zhuyin.toLowerCase().includes(q) ||
                w.cognateClue.toLowerCase().includes(q)
            );
          }

          if (words.length === 0) return null;

          const categorySelectedCount = words.filter((w) => selectedVocabIds.includes(w.id)).length;

          return (
            <div
              key={categoryKey}
              className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-xs space-y-3"
            >
              {/* Category Header */}
              <div className="flex flex-row items-center justify-between gap-2 border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold text-stone-900">{meta.label}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                    已選 {categorySelectedCount}/{words.length}
                  </span>
                </div>

                {/* Select / Deselect All for this category */}
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => handleSelectCategory(categoryKey, true)}
                    className="font-medium text-rose-600 hover:text-rose-800 px-2 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    全選本類
                  </button>
                  <span className="text-stone-300">|</span>
                  <button
                    onClick={() => handleSelectCategory(categoryKey, false)}
                    className="font-medium text-stone-500 hover:text-stone-700 px-2 py-0.5 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    取消本類
                  </button>
                </div>
              </div>

              {/* Words Card Grid (1 col on mobile, 2 on md, 3 on lg) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {words.map((word) => {
                  const isSelected = selectedVocabIds.includes(word.id);
                  const mastery = progress.vocabMastery?.[word.id]?.status || 'unlearned';

                  return (
                    <div
                      key={word.id}
                      onClick={() => handleToggle(word.id)}
                      className={`relative rounded-xl p-3 border transition-all duration-150 cursor-pointer flex flex-col justify-between select-none ${
                        isSelected
                          ? 'border-rose-500/80 bg-rose-50/40 shadow-xs ring-1.5 ring-rose-500/20'
                          : 'border-stone-200 bg-stone-50/40 hover:bg-stone-100/60 opacity-60 hover:opacity-90'
                      }`}
                    >
                      {/* Top row: Checkbox, Mastered status, Sound */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                              isSelected
                                ? 'bg-rose-600 text-white font-bold'
                                : 'border border-stone-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          {mastery === 'mastered' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> 已熟記
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFx.playTap();
                            soundFx.speakKorean(word.hangul, progress.settings.audioSpeed);
                          }}
                          className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-100/50 transition-colors"
                          title="發音試聽"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Main text: Korean + Meaning */}
                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-base font-bold text-stone-900 tracking-tight font-sans">
                            {word.hangul}
                          </span>
                          <span className="text-xs font-semibold text-rose-600">
                            {word.meaning}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                          [{word.romaja}]・{word.zhuyin}
                        </div>
                      </div>

                      {/* Bottom Mnemonic / Clue */}
                      <div className="mt-2 pt-1.5 border-t border-stone-200/50 flex items-center justify-between text-[11px]">
                        <span className="text-amber-800 font-medium truncate">
                          💡 {word.cognateClue}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
