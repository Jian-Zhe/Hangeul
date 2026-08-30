import React, { useState } from 'react';
import { ActiveTab, UserProgress } from '../types';
import {
  BookOpen,
  CheckSquare,
  Sparkles,
  BarChart2,
  Grid,
  Layers,
  Volume2,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { HANGUL_SYMBOLS } from '../data/hangulData';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedCount: number;
  selectedVocabCount: number;
  progress: UserProgress;
  onUpdateSettings: (newSettings: Partial<UserProgress['settings']>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedCount,
  selectedVocabCount,
  progress,
  onUpdateSettings,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Calculate total mastered symbols
  const masteredCount = HANGUL_SYMBOLS.filter(
    (sym) => progress.symbolMastery[sym.id]?.status === 'mastered'
  ).length;
  const masteryPercent = Math.round((masteredCount / HANGUL_SYMBOLS.length) * 100);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; desc: string; badge?: string }[] = [
    {
      id: 'cards',
      label: '符號背誦',
      desc: '滑動字卡・台語諧音速記',
      icon: <Layers className="w-5 h-5 sm:w-4 sm:h-4" />,
      badge: `${selectedCount} 個`,
    },
    {
      id: 'selector',
      label: '挑選符號',
      desc: '勾選要背誦的字母與收音',
      icon: <CheckSquare className="w-5 h-5 sm:w-4 sm:h-4" />,
    },
    {
      id: 'vocab_cards',
      label: '單字背誦',
      desc: '200句常用日常用語卡片',
      icon: <BookOpen className="w-5 h-5 sm:w-4 sm:h-4" />,
      badge: `${selectedVocabCount} 詞`,
    },
    {
      id: 'vocab_selector',
      label: '挑選單字',
      desc: '分類挑選 200 個常用日常句',
      icon: <CheckSquare className="w-5 h-5 sm:w-4 sm:h-4 text-rose-500" />,
    },
    {
      id: 'quiz',
      label: '認字測驗',
      desc: '100題不重複隨機測驗',
      icon: <Sparkles className="w-5 h-5 sm:w-4 sm:h-4" />,
    },
    {
      id: 'chart',
      label: '40音總表',
      desc: '完整母音子音終聲發音對照',
      icon: <Grid className="w-5 h-5 sm:w-4 sm:h-4" />,
    },
    {
      id: 'builder',
      label: '拼字實驗室',
      desc: '子音母音拼組與即時發音',
      icon: <BookOpen className="w-5 h-5 sm:w-4 sm:h-4" />,
    },
    {
      id: 'stats',
      label: '學習進度',
      desc: '熟練度與答題記錄',
      icon: <BarChart2 className="w-5 h-5 sm:w-4 sm:h-4" />,
      badge: `${masteryPercent}%`,
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* ===================== Top App Header ===================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Left: Mobile Menu Button & Brand Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Drawer Hamburger Trigger */}
              <button
                id="mobile-drawer-toggle"
                onClick={() => setIsDrawerOpen(true)}
                className="md:hidden p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer flex items-center justify-center"
                aria-label="開啟選單側欄"
              >
                <Menu className="w-5 h-5 text-stone-800" />
              </button>

              {/* Logo & Title */}
              <div
                className="flex items-center gap-2 cursor-pointer select-none shrink-0"
                onClick={() => handleSelectTab('cards')}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-base sm:text-xl shadow-md shadow-rose-500/20 ring-2 ring-white shrink-0">
                  한
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-base sm:text-xl text-stone-900 tracking-tight whitespace-nowrap">
                    Hangul
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap">
                    40音學習卡
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Controls & Status */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Audio Speed Toggle */}
              <button
                id="header-speed-toggle"
                onClick={() => {
                  const nextSpeed = progress.settings.audioSpeed === 0.9 ? 0.7 : 0.9;
                  onUpdateSettings({ audioSpeed: nextSpeed });
                }}
                title="切換朗讀語速"
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-stone-700 transition-colors cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="text-[11px] sm:text-xs">
                  {progress.settings.audioSpeed < 0.85 ? '🐢 0.7x' : '🔊 0.9x'}
                </span>
              </button>

              {/* Quick Mastery Pill */}
              <button
                id="header-mastery-pill"
                onClick={() => handleSelectTab('stats')}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{masteredCount}/40 ({masteryPercent}%)</span>
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Hidden on mobile to keep the screen ultra clean!) */}
          <nav className="hidden md:flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none border-t border-stone-100 pt-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 select-none cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-stone-700 text-stone-200'
                          : 'bg-stone-200/80 text-stone-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ===================== Mobile Left Slide-out Drawer ===================== */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Drawer Container */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[80vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-base shadow-md">
              한
            </div>
            <div>
              <div className="font-extrabold text-stone-900 text-base leading-tight">Hangul</div>
              <div className="text-[10px] text-stone-500 font-medium">40音字卡・認字測驗</div>
            </div>
          </div>

          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors cursor-pointer"
            aria-label="關閉側欄"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            功能導覽
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'text-stone-700 hover:bg-stone-100 active:bg-stone-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      isActive ? 'bg-stone-800 text-rose-400' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                            isActive
                              ? 'bg-stone-700 text-amber-300'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] mt-0.5 ${isActive ? 'text-stone-300' : 'text-stone-500'}`}>
                      {item.desc}
                    </div>
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
              </button>
            );
          })}
        </div>

        {/* Drawer Footer Status */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500">40音熟練度</span>
            <span className="font-bold text-emerald-700">{masteredCount} / 40 ({masteryPercent}%)</span>
          </div>
          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
