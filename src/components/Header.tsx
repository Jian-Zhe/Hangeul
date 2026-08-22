import React from 'react';
import { ActiveTab, UserProgress } from '../types';
import { BookOpen, CheckSquare, Sparkles, BarChart2, Grid, Layers, Volume2, Download } from 'lucide-react';
import { HANGUL_SYMBOLS } from '../data/hangulData';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedCount: number;
  progress: UserProgress;
  onUpdateSettings: (newSettings: Partial<UserProgress['settings']>) => void;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedCount,
  progress,
  onUpdateSettings,
  onOpenInstallModal,
}) => {
  // Calculate total mastered symbols
  const masteredCount = HANGUL_SYMBOLS.filter(
    (sym) => progress.symbolMastery[sym.id]?.status === 'mastered'
  ).length;
  const masteryPercent = Math.round((masteredCount / HANGUL_SYMBOLS.length) * 100);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'cards',
      label: '字卡背誦',
      icon: <Layers className="w-4 h-4" />,
      badge: `${selectedCount} 個`,
    },
    {
      id: 'selector',
      label: '自訂符號',
      icon: <CheckSquare className="w-4 h-4" />,
    },
    {
      id: 'quiz',
      label: '認字測驗',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'chart',
      label: '40音總表',
      icon: <Grid className="w-4 h-4" />,
    },
    {
      id: 'builder',
      label: '拼字實驗室',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'stats',
      label: '學習進度',
      icon: <BarChart2 className="w-4 h-4" />,
      badge: `${masteryPercent}%`,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab('cards')}>
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-rose-500/20 ring-2 ring-white">
              한
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl text-stone-900 tracking-tight">
                  韓文互動學習卡
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  Quizlet 模式
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden md:block">
                子音・母音・注音諧音對照・台語中文字義推敲
              </p>
            </div>
          </div>

          {/* Quick Settings & Stats Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Install App Button */}
            {onOpenInstallModal && (
              <button
                id="header-install-app-btn"
                onClick={onOpenInstallModal}
                title="下載並安裝成手機或電腦 App"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100/90 text-rose-700 border border-rose-200/90 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">下載 App</span>
                <span className="sm:hidden">App</span>
              </button>
            )}

            {/* Pronunciation Speed Toggle */}
            <button
              id="header-speed-toggle"
              onClick={() => {
                const nextSpeed = progress.settings.audioSpeed === 0.9 ? 0.7 : 0.9;
                onUpdateSettings({ audioSpeed: nextSpeed });
              }}
              title="點擊切換語音朗讀速度"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-stone-700 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-rose-500" />
              <span>{progress.settings.audioSpeed < 0.85 ? '🐢 0.7x' : '🔊 0.9x'}</span>
            </button>

            {/* Quick Mastery Pill */}
            <button
              id="header-mastery-pill"
              onClick={() => setActiveTab('stats')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-all shadow-2xs"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{masteredCount}/40 ({masteryPercent}%)</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Scrollable on small devices) */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none border-t border-stone-100 pt-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 select-none ${
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
  );
};
