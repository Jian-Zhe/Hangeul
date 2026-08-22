import React, { useState } from 'react';
import { HANGUL_SYMBOLS, SYMBOL_CATEGORY_LABELS } from '../data/hangulData';
import { HangulSymbol, SymbolCategory, UserProgress } from '../types';
import { Volume2, Search, Sparkles, BookOpen, Star, Info, CheckCircle2, HelpCircle } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface AlphabetTableViewProps {
  progress: UserProgress;
  onSelectSymbolForLearning?: (symbolId: string) => void;
}

export const AlphabetTableView: React.FC<AlphabetTableViewProps> = ({
  progress,
  onSelectSymbolForLearning,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SymbolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalSymbol, setActiveModalSymbol] = useState<HangulSymbol | null>(null);

  const filteredSymbols = HANGUL_SYMBOLS.filter((sym) => {
    const matchesCategory = selectedCategory === 'all' || sym.category === selectedCategory;
    const matchesSearch =
      sym.char.includes(searchQuery) ||
      sym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sym.zhuyin.includes(searchQuery) ||
      sym.romaja.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sym.mnemonic.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900">韓文 40 音發音總表 (全覽圖)</h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              點擊任一字母即可即時聆聽標準發音、查看注音符號標音與台語/中文諧音記憶秘訣。
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋字母、注音、羅馬拼音..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-stone-50"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            全部 40 音 ({HANGUL_SYMBOLS.length})
          </button>
          <button
            onClick={() => setSelectedCategory('basic_consonant')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'basic_consonant'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            14 基本子音
          </button>
          <button
            onClick={() => setSelectedCategory('double_consonant')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'double_consonant'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            5 濃音/雙子音
          </button>
          <button
            onClick={() => setSelectedCategory('basic_vowel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'basic_vowel'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            10 基本母音
          </button>
          <button
            onClick={() => setSelectedCategory('compound_vowel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'compound_vowel'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            11 複合母音
          </button>
        </div>
      </div>

      {/* Grid of Symbol Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {filteredSymbols.map((sym) => {
          const mastery = progress.symbolMastery[sym.id]?.status || 'unlearned';
          const meta = SYMBOL_CATEGORY_LABELS[sym.category];

          return (
            <div
              key={sym.id}
              onClick={() => setActiveModalSymbol(sym)}
              className="bg-white rounded-2xl p-4 border border-stone-200 hover:border-indigo-400 hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between group relative"
            >
              {/* Header: Name & Sound Button */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-500 truncate max-w-[90px]">
                  {sym.name.split(' ')[0]}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.speakKorean(sym.char, progress.settings.audioSpeed);
                  }}
                  title="聆聽發音"
                  className="p-1.5 rounded-lg bg-stone-50 group-hover:bg-rose-500 text-stone-400 group-hover:text-white transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Main Hangul Character */}
              <div className="text-center my-3">
                <div className="text-4xl font-black text-stone-900 group-hover:text-indigo-600 transition-colors tracking-tight font-sans">
                  {sym.char}
                </div>
                <div className="text-xs font-bold text-indigo-700 mt-1">
                  {sym.zhuyin}
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  {sym.romaja}
                </div>
              </div>

              {/* Footer: Mnemonic snippet & Mastery */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                <span
                  className={`px-2 py-0.5 rounded-full font-bold ${
                    mastery === 'mastered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : mastery === 'learning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {mastery === 'mastered' ? '已掌握' : mastery === 'learning' ? '學習中' : '未學習'}
                </span>

                <span className="text-stone-400 group-hover:text-indigo-600 font-medium">
                  詳情 ➔
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Detail for Active Symbol */}
      {activeModalSymbol && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModalSymbol(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 animate-scaleUp"
          >
            {/* Modal Top */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {SYMBOL_CATEGORY_LABELS[activeModalSymbol.category]?.label}
                </span>
                <span className="text-xs text-stone-500">{activeModalSymbol.name}</span>
              </div>

              <button
                onClick={() => setActiveModalSymbol(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Character Hero */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <span className="text-6xl sm:text-7xl font-black text-stone-900 font-sans">
                  {activeModalSymbol.char}
                </span>
                <button
                  onClick={() => soundFx.speakKorean(activeModalSymbol.char, progress.settings.audioSpeed)}
                  className="p-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-stone-50 rounded-xl p-2 border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-bold">注音符號</div>
                  <div className="text-base font-extrabold text-amber-700">{activeModalSymbol.zhuyin}</div>
                </div>
                <div className="bg-stone-50 rounded-xl p-2 border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-bold">羅馬拼音</div>
                  <div className="text-base font-extrabold text-indigo-700 font-mono">{activeModalSymbol.romaja}</div>
                </div>
                <div className="bg-stone-50 rounded-xl p-2 border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-bold">國際音標 IPA</div>
                  <div className="text-base font-bold text-emerald-700 font-mono">{activeModalSymbol.ipa}</div>
                </div>
              </div>
            </div>

            {/* Mnemonic & Tips */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-amber-950">
                <span className="font-bold flex items-center gap-1 text-amber-800 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>台語 / 中文諧音記憶法：</span>
                </span>
                {activeModalSymbol.mnemonic}
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-stone-700">
                <span className="font-bold text-stone-900">發音技巧：</span> {activeModalSymbol.soundTip}
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-stone-700">
                <span className="font-bold text-stone-900">筆順指導：</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-stone-600">
                  {activeModalSymbol.strokeOrder.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Example Words */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-700">生活範例單字（點擊試聽）：</div>
              <div className="grid grid-cols-2 gap-2">
                {activeModalSymbol.exampleWords.map((ex, idx) => (
                  <div
                    key={idx}
                    onClick={() => soundFx.speakKorean(ex.hangul, progress.settings.audioSpeed)}
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-bold">{ex.hangul} ({ex.zhuyin})</div>
                      <div className="text-[10px] text-stone-500">{ex.meaning}</div>
                    </div>
                    <Volume2 className="w-3.5 h-3.5 text-stone-400" />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveModalSymbol(null)}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
