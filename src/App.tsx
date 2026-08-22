import React, { useState, useEffect } from 'react';
import { ActiveTab, UserProgress } from './types';
import {
  initializeProgress,
  saveProgress,
  getSelectedSymbolIds,
  saveSelectedSymbolIds,
} from './utils/storage';
import { Header } from './components/Header';
import { FlashcardView } from './components/FlashcardView';
import { SymbolSelector } from './components/SymbolSelector';
import { QuizView } from './components/QuizView';
import { AlphabetTableView } from './components/AlphabetTableView';
import { SyllableBuilder } from './components/SyllableBuilder';
import { ProgressDashboard } from './components/ProgressDashboard';
import { InstallAppModal } from './components/InstallAppModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('cards');
  const [progress, setProgress] = useState<UserProgress>(() => initializeProgress());
  const [selectedIds, setSelectedIds] = useState<string[]>(() => getSelectedSymbolIds());
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Save progress changes to LocalStorage
  const handleUpdateProgress = (updater: (prev: UserProgress) => UserProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveProgress(next);
      return next;
    });
  };

  const handleUpdateSettings = (newSettings: Partial<UserProgress['settings']>) => {
    handleUpdateProgress((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }));
  };

  const handleChangeSelectedIds = (ids: string[]) => {
    setSelectedIds(ids);
    saveSelectedSymbolIds(ids);
  };

  const handleStartLearning = () => {
    setActiveTab('cards');
  };

  const handleStudyWeakSymbols = (weakIds: string[]) => {
    setSelectedIds(weakIds);
    saveSelectedSymbolIds(weakIds);
    setActiveTab('cards');
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-rose-200 selection:text-rose-900">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCount={selectedIds.length}
        progress={progress}
        onUpdateSettings={handleUpdateSettings}
        onOpenInstallModal={() => setShowInstallModal(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full pb-12">
        {activeTab === 'cards' && (
          <FlashcardView
            selectedIds={selectedIds}
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            onGoToSelector={() => setActiveTab('selector')}
          />
        )}

        {activeTab === 'selector' && (
          <SymbolSelector
            selectedIds={selectedIds}
            onChangeSelectedIds={handleChangeSelectedIds}
            onStartLearning={handleStartLearning}
            progress={progress}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
          />
        )}

        {activeTab === 'chart' && (
          <AlphabetTableView
            progress={progress}
          />
        )}

        {activeTab === 'builder' && (
          <SyllableBuilder />
        )}

        {activeTab === 'stats' && (
          <ProgressDashboard
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            onStudyWeakSymbols={handleStudyWeakSymbols}
          />
        )}
      </main>

      {/* Install App Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/70 py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>韓文字母與單字互動學習卡 (Hangul Flashcards) ・ 免費離線互動學習</span>
          <span className="text-stone-400">
            支援注音標音、英文羅馬拼音、台語中文字義推敲法與 Web Speech 真人發音
          </span>
        </div>
      </footer>
    </div>
  );
}
