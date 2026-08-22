import React, { useState, useEffect } from 'react';
import { Download, Share2, Smartphone, Monitor, Check } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('android');

  useEffect(() => {
    // Detect device platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-md ring-2 ring-rose-100">
              한
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-lg">下載安裝為 App</h3>
              <p className="text-xs text-stone-500">免去應用商店・離線可用・極速啟動</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Platform Specific Instructions */}
        {isInstalled ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Check className="w-5 h-5" />
            </div>
            <div className="font-bold text-emerald-900 text-sm">此應用已安裝在您的裝置上！</div>
            <p className="text-xs text-emerald-700">您可以直接從手機主畫面或電腦桌面點擊開啟。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* One-click PWA Prompt for Android/Chrome/Edge if available */}
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-2xl bg-linear-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 active:scale-98 transition-all cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>一鍵安裝到桌面 / 手機</span>
              </button>
            )}

            {/* Platform Manual Guides */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/90 space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-stone-800 uppercase tracking-wide">
                {platform === 'ios' && <Smartphone className="w-4 h-4 text-rose-500" />}
                {platform === 'android' && <Smartphone className="w-4 h-4 text-emerald-500" />}
                {platform === 'desktop' && <Monitor className="w-4 h-4 text-indigo-500" />}
                <span>
                  {platform === 'ios'
                    ? 'iPhone / iPad (Safari) 安裝步驟'
                    : platform === 'android'
                    ? 'Android (Chrome / 三星瀏覽器) 安裝步驟'
                    : '電腦版 (Chrome / Edge / Linux) 安裝步驟'}
                </span>
              </div>

              {platform === 'ios' && (
                <ol className="text-xs text-stone-700 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    點擊 Safari 瀏覽器底部的 <strong className="text-indigo-600">「分享按鈕」</strong> (
                    <Share2 className="w-3.5 h-3.5 inline text-indigo-600 mb-0.5" />)。
                  </li>
                  <li>
                    在選單中向下滑動，點選 <strong className="text-stone-900">「加入主畫面 (Add to Home Screen)」</strong>。
                  </li>
                  <li>點選右上角的「新增」，即可像一般 App 一樣在桌面開啟！</li>
                </ol>
              )}

              {platform === 'android' && (
                <ol className="text-xs text-stone-700 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    點擊瀏覽器右上角的 <strong className="text-stone-900">「選單圖示 (⋮)」</strong>。
                  </li>
                  <li>
                    點選 <strong className="text-indigo-600">「安裝應用程式」</strong> 或 <strong className="text-stone-900">「加到主畫面」</strong>。
                  </li>
                  <li>確認安裝後，App 圖示就會直接常駐在手機桌面！</li>
                </ol>
              )}

              {platform === 'desktop' && (
                <ol className="text-xs text-stone-700 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>點擊瀏覽器網址列右側的 <strong className="text-indigo-600">「安裝圖示 (⬇️ 或 ⊕)」</strong>。</li>
                  <li>或點選瀏覽器右上角選單 (⋮) ➔ <strong className="text-stone-900">「安裝 韓文40音」</strong>。</li>
                  <li>安裝後即可作為獨立桌面軟體使用，無網址列干擾！</li>
                </ol>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="text-center pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            我知道了，關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
