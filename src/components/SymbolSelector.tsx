import React from 'react';
import { HANGUL_SYMBOLS, SYMBOL_CATEGORY_LABELS } from '../data/hangulData';
import { SymbolCategory, UserProgress } from '../types';
import { Check, CheckCircle2, Play, Volume2, Sparkles, RotateCcw, Filter } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface SymbolSelectorProps {
  selectedIds: string[];
  onChangeSelectedIds: (ids: string[]) => void;
  onStartLearning: () => void;
  progress: UserProgress;
}

export const SymbolSelector: React.FC<SymbolSelectorProps> = ({
  selectedIds,
  onChangeSelectedIds,
  onStartLearning,
  progress,
}) => {
  const isAllSelected = selectedIds.length === HANGUL_SYMBOLS.length;

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) {
        // Keep at least one selected
        return;
      }
      onChangeSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      onChangeSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectCategory = (category: SymbolCategory, select: boolean) => {
    const catIds = HANGUL_SYMBOLS.filter((s) => s.category === category).map((s) => s.id);
    if (select) {
      const combined = Array.from(new Set([...selectedIds, ...catIds]));
      onChangeSelectedIds(combined);
    } else {
      const filtered = selectedIds.filter((id) => !catIds.includes(id));
      onChangeSelectedIds(filtered.length > 0 ? filtered : [HANGUL_SYMBOLS[0].id]);
    }
  };

  const handleSelectPreset = (preset: 'all' | 'basic24' | 'consonants' | 'vowels' | 'double' | 'compound' | 'weak') => {
    let ids: string[] = [];
    switch (preset) {
      case 'all':
        ids = HANGUL_SYMBOLS.map((s) => s.id);
        break;
      case 'basic24':
        ids = HANGUL_SYMBOLS.filter(
          (s) => s.category === 'basic_consonant' || s.category === 'basic_vowel'
        ).map((s) => s.id);
        break;
      case 'consonants':
        ids = HANGUL_SYMBOLS.filter(
          (s) => s.category === 'basic_consonant' || s.category === 'double_consonant'
        ).map((s) => s.id);
        break;
      case 'vowels':
        ids = HANGUL_SYMBOLS.filter(
          (s) => s.category === 'basic_vowel' || s.category === 'compound_vowel'
        ).map((s) => s.id);
        break;
      case 'double':
        ids = HANGUL_SYMBOLS.filter((s) => s.category === 'double_consonant').map((s) => s.id);
        break;
      case 'compound':
        ids = HANGUL_SYMBOLS.filter((s) => s.category === 'compound_vowel').map((s) => s.id);
        break;
      case 'weak':
        ids = HANGUL_SYMBOLS.filter((s) => {
          const status = progress.symbolMastery[s.id]?.status;
          return status === 'learning' || status === 'unlearned';
        }).map((s) => s.id);
        if (ids.length === 0) {
          ids = HANGUL_SYMBOLS.map((s) => s.id);
        }
        break;
    }
    onChangeSelectedIds(ids);
  };

  const categories: SymbolCategory[] = [
    'basic_consonant',
    'double_consonant',
    'basic_vowel',
    'compound_vowel',
  ];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-5 space-y-4">
      {/* Top Banner with Presets & Action */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">自訂學習符號清單</h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              自由勾選你想練習的韓文字母，系統會立即生成客製化字卡與隨堂測驗！
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2">
            <button
              id="start-learning-btn"
              onClick={onStartLearning}
              disabled={selectedIds.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-md shadow-rose-500/25 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>開始學習所選符號 ({selectedIds.length} 個)</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="border-t border-stone-100 pt-2.5">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
            常用快捷挑選組合：
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
              全部 40 音
            </button>
            <button
              onClick={() => handleSelectPreset('basic24')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              🌟 初學 24 音
            </button>
            <button
              onClick={() => handleSelectPreset('consonants')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              19 個子音
            </button>
            <button
              onClick={() => handleSelectPreset('vowels')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              21 個母音
            </button>
            <button
              onClick={() => handleSelectPreset('double')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              5 個濃音
            </button>
            <button
              onClick={() => handleSelectPreset('compound')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
            >
              11 個複合母音
            </button>
            <button
              onClick={() => handleSelectPreset('weak')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>待複習弱點</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-4">
        {categories.map((categoryKey) => {
          const meta = SYMBOL_CATEGORY_LABELS[categoryKey];
          const symbols = HANGUL_SYMBOLS.filter((s) => s.category === categoryKey);
          const categorySelectedCount = symbols.filter((s) => selectedIds.includes(s.id)).length;
          const isCategoryAllSelected = categorySelectedCount === symbols.length;

          return (
            <div
              key={categoryKey}
              className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200/90 shadow-2xs space-y-3"
            >
              {/* Category Header */}
              <div className="flex flex-row items-center justify-between gap-2 border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold text-stone-900">{meta.label}</span>
                  <span className="text-[11px] px-2 py-0.2 rounded-full bg-stone-100 text-stone-600 font-medium">
                    已選 {categorySelectedCount}/{symbols.length}
                  </span>
                </div>

                {/* Select / Deselect All for this category */}
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => handleSelectCategory(categoryKey, true)}
                    className="font-medium text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    全選
                  </button>
                  <span className="text-stone-300">|</span>
                  <button
                    onClick={() => handleSelectCategory(categoryKey, false)}
                    className="font-medium text-stone-500 hover:text-stone-700 px-2 py-0.5 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              </div>

              {/* Symbols Card Grid (Compact: 3 cols on mobile, 4 on sm, 6 on md, 8 on lg) */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {symbols.map((sym) => {
                  const isSelected = selectedIds.includes(sym.id);
                  const mastery = progress.symbolMastery[sym.id]?.status || 'unlearned';

                  return (
                    <div
                      key={sym.id}
                      onClick={() => handleToggle(sym.id)}
                      className={`relative group rounded-xl p-2 border transition-all duration-150 cursor-pointer flex flex-col justify-between select-none ${
                        isSelected
                          ? 'border-indigo-500/90 bg-indigo-50/50 shadow-2xs ring-1.5 ring-indigo-500/30'
                          : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/60 opacity-55 hover:opacity-85'
                      }`}
                    >
                      {/* Checkbox badge & Audio preview */}
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[9px] ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'border border-stone-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>

                        {/* Pronunciation preview button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFx.speakKorean(sym.char, progress.settings.audioSpeed);
                          }}
                          title="點擊試聽發音"
                          className="p-1 -mr-1 -mt-1 rounded-md text-stone-400 hover:text-indigo-600 hover:bg-white/80 transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Hangul Char & Zhuyin in compact format */}
                      <div className="text-center my-0.5">
                        <div className="text-2xl sm:text-3xl font-black text-stone-900 font-sans tracking-tight leading-tight">
                          {sym.char}
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-[11px] font-bold text-indigo-700">
                            {sym.zhuyin}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {sym.romaja}
                          </span>
                        </div>
                      </div>

                      {/* Mastery badge pill */}
                      <div className="mt-1 pt-1 border-t border-stone-200/60 flex items-center justify-center text-[9px]">
                        <span
                          className={`px-1.5 py-0.2 rounded-full font-medium scale-95 ${
                            mastery === 'mastered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mastery === 'learning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {mastery === 'mastered' ? '已熟記' : mastery === 'learning' ? '學習中' : '未學習'}
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

      {/* Floating Bottom Bar for Quick Start */}
      <div className="sticky bottom-3 z-30 bg-stone-900/95 backdrop-blur-md text-white rounded-2xl px-4 py-3 shadow-xl border border-stone-700 flex items-center justify-between gap-3">
        <div>
          <div className="font-bold text-xs sm:text-sm">
            已挑選 <span className="text-rose-400 font-black">{selectedIds.length}</span> 個字母
          </div>
          <div className="text-[11px] text-stone-400 hidden sm:block">
            即將在字卡模式中複習發音、注音對照與台語諧音口訣
          </div>
        </div>

        <button
          onClick={onStartLearning}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-rose-500 to-indigo-500 hover:from-rose-400 hover:to-indigo-400 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>進入字卡學習</span>
        </button>
      </div>
    </div>
  );
};
