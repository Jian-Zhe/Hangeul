import React, { useState, useMemo } from 'react';
import { Volume2, Sparkles, RotateCcw, BookOpen, Layers } from 'lucide-react';
import { soundFx } from '../utils/audio';

const INITIAL_CONSONANTS = [
  { char: 'ㄱ', zhuyin: 'ㄍ', romaja: 'g' },
  { char: 'ㄲ', zhuyin: 'ㄍ˙', romaja: 'kk' },
  { char: 'ㄴ', zhuyin: 'ㄋ', romaja: 'n' },
  { char: 'ㄷ', zhuyin: 'ㄉ', romaja: 'd' },
  { char: 'ㄸ', zhuyin: 'ㄉ˙', romaja: 'tt' },
  { char: 'ㄹ', zhuyin: 'ㄌ', romaja: 'r' },
  { char: 'ㅁ', zhuyin: 'ㄇ', romaja: 'm' },
  { char: 'ㅂ', zhuyin: 'ㄅ', romaja: 'b' },
  { char: 'ㅃ', zhuyin: 'ㄅ˙', romaja: 'pp' },
  { char: 'ㅅ', zhuyin: 'ㄙ', romaja: 's' },
  { char: 'ㅆ', zhuyin: 'ㄙ˙', romaja: 'ss' },
  { char: 'ㅇ', zhuyin: '(無)', romaja: '-' },
  { char: 'ㅈ', zhuyin: 'ㄗ', romaja: 'j' },
  { char: 'ㅉ', zhuyin: 'ㄗ˙', romaja: 'jj' },
  { char: 'ㅊ', zhuyin: 'ㄘ', romaja: 'ch' },
  { char: 'ㅋ', zhuyin: 'ㄎ', romaja: 'k' },
  { char: 'ㅌ', zhuyin: 'ㄊ', romaja: 't' },
  { char: 'ㅍ', zhuyin: 'ㄆ', romaja: 'p' },
  { char: 'ㅎ', zhuyin: 'ㄏ', romaja: 'h' },
];

const MEDIAL_VOWELS = [
  { char: 'ㅏ', zhuyin: 'ㄚ', romaja: 'a' },
  { char: 'ㅐ', zhuyin: 'ㄝ', romaja: 'ae' },
  { char: 'ㅑ', zhuyin: 'ㄧㄚ', romaja: 'ya' },
  { char: 'ㅒ', zhuyin: 'ㄧㄝ', romaja: 'yae' },
  { char: 'ㅓ', zhuyin: 'ㄛ/ㄜ', romaja: 'eo' },
  { char: 'ㅔ', zhuyin: 'ㄟ/ㄝ', romaja: 'e' },
  { char: 'ㅕ', zhuyin: 'ㄧㄛ', romaja: 'yeo' },
  { char: 'ㅖ', zhuyin: 'ㄧㄝ', romaja: 'ye' },
  { char: 'ㅗ', zhuyin: 'ㄛ(圓)', romaja: 'o' },
  { char: 'ㅘ', zhuyin: 'ㄨㄚ', romaja: 'wa' },
  { char: 'ㅙ', zhuyin: 'ㄨㄝ', romaja: 'wae' },
  { char: 'ㅚ', zhuyin: 'ㄨㄟ', romaja: 'oe' },
  { char: 'ㅛ', zhuyin: 'ㄧㄡ', romaja: 'yo' },
  { char: 'ㅜ', zhuyin: 'ㄨ', romaja: 'u' },
  { char: 'ㅝ', zhuyin: 'ㄨㄛ', romaja: 'wo' },
  { char: 'ㅞ', zhuyin: 'ㄨㄟ', romaja: 'we' },
  { char: 'ㅟ', zhuyin: 'ㄨㄧ', romaja: 'wi' },
  { char: 'ㅠ', zhuyin: 'ㄧㄨ', romaja: 'yu' },
  { char: 'ㅡ', zhuyin: 'ㄜ(扁)', romaja: 'eu' },
  { char: 'ㅢ', zhuyin: 'ㄜㄧ', romaja: 'ui' },
  { char: 'ㅣ', zhuyin: 'ㄧ', romaja: 'i' },
];

const FINAL_BATCHIM = [
  { char: '', label: '無收音', zhuyin: '', romaja: '' },
  { char: 'ㄱ', label: 'ㄱ [k̚]', zhuyin: 'ᆨ', romaja: 'k' },
  { char: 'ㄴ', label: 'ㄴ [n]', zhuyin: 'ㄣ', romaja: 'n' },
  { char: 'ㄷ', label: 'ㄷ [t̚]', zhuyin: 'ㄉ', romaja: 't' },
  { char: 'ㄹ', label: 'ㄹ [l]', zhuyin: 'ㄌ', romaja: 'l' },
  { char: 'ㅁ', label: 'ㅁ [m]', zhuyin: 'ㄇ', romaja: 'm' },
  { char: 'ㅂ', label: 'ㅂ [p̚]', zhuyin: 'ㄅ', romaja: 'p' },
  { char: 'ㅇ', label: 'ㅇ [ŋ]', zhuyin: 'ㄥ', romaja: 'ng' },
];

// Hangul Unicode synthesis formula
function assembleHangul(initialIdx: number, medialIdx: number, finalIdx: number): string {
  const code = 0xac00 + (initialIdx * 21 + medialIdx) * 28 + finalIdx;
  return String.fromCharCode(code);
}

export const SyllableBuilder: React.FC = () => {
  const [selectedInitial, setSelectedInitial] = useState(0); // 'ㄱ'
  const [selectedMedial, setSelectedMedial] = useState(0);   // 'ㅏ'
  const [selectedFinal, setSelectedFinal] = useState(0);    // None

  const assembledChar = useMemo(() => {
    return assembleHangul(selectedInitial, selectedMedial, selectedFinal);
  }, [selectedInitial, selectedMedial, selectedFinal]);

  const initObj = INITIAL_CONSONANTS[selectedInitial];
  const medObj = MEDIAL_VOWELS[selectedMedial];
  const finObj = FINAL_BATCHIM[selectedFinal];

  const compositeZhuyin = `${initObj.zhuyin === '(無)' ? '' : initObj.zhuyin}${medObj.zhuyin}${finObj.zhuyin}`;
  const compositeRomaja = `${initObj.romaja === '-' ? '' : initObj.romaja}${medObj.romaja}${finObj.romaja}`;

  const handleSpeakAssembled = () => {
    soundFx.speakKorean(assembledChar, 0.9);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Title & Introduction */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-stone-900">韓文拼字實驗室 (初聲 + 中聲 + 終聲)</h2>
        </div>
        <p className="text-xs sm:text-sm text-stone-600">
          韓語字是由「子音 + 母音 (+ 收音)」組成的方塊字。自由點擊下方不同子音與母音，即時合成發音與注音！
        </p>
      </div>

      {/* Assembly Result Display Card */}
      <div className="bg-linear-to-b from-stone-900 via-stone-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800 text-center space-y-6">
        {/* Syllable Math Formula */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-sm sm:text-base font-bold">
          <div className="bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-700 text-emerald-400">
            初聲子音：{initObj.char} ({initObj.zhuyin})
          </div>
          <span className="text-stone-500">+</span>
          <div className="bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-700 text-sky-400">
            中聲母音：{medObj.char} ({medObj.zhuyin})
          </div>
          {finObj.char && (
            <>
              <span className="text-stone-500">+</span>
              <div className="bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-700 text-amber-400">
                終聲收音：{finObj.char} ({finObj.zhuyin})
              </div>
            </>
          )}
        </div>

        {/* Big Hangul Syllable */}
        <div className="py-2">
          <div className="text-8xl sm:text-9xl font-black tracking-tight text-white font-sans drop-shadow-md select-none">
            {assembledChar}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="text-xl font-extrabold text-amber-300">
              注音：{compositeZhuyin}
            </span>
            <span className="text-stone-400">/</span>
            <span className="text-xl font-mono text-sky-300">
              {compositeRomaja}
            </span>
          </div>
        </div>

        {/* Speak button */}
        <div>
          <button
            onClick={handleSpeakAssembled}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-linear-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Volume2 className="w-5 h-5" />
            <span>點擊播放「{assembledChar}」發音</span>
          </button>
        </div>
      </div>

      {/* Selector Panels (Consonants, Vowels, Batchim) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Initial Consonants */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center justify-between border-b border-stone-100 pb-2">
            <span>1. 挑選初聲子音 (19)</span>
            <span className="text-stone-400 text-[11px]">{initObj.char}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 max-h-64 overflow-y-auto pr-1">
            {INITIAL_CONSONANTS.map((c, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedInitial(idx);
                  soundFx.playFlip();
                }}
                className={`p-2 rounded-xl text-center border text-xs font-bold transition-all ${
                  selectedInitial === idx
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-emerald-50'
                }`}
              >
                <div className="text-base">{c.char}</div>
                <div className="text-[10px] opacity-80">{c.zhuyin}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Medial Vowels */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-sky-800 uppercase tracking-wide flex items-center justify-between border-b border-stone-100 pb-2">
            <span>2. 挑選中聲母音 (21)</span>
            <span className="text-stone-400 text-[11px]">{medObj.char}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 max-h-64 overflow-y-auto pr-1">
            {MEDIAL_VOWELS.map((v, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedMedial(idx);
                  soundFx.playFlip();
                }}
                className={`p-2 rounded-xl text-center border text-xs font-bold transition-all ${
                  selectedMedial === idx
                    ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-sky-50'
                }`}
              >
                <div className="text-base">{v.char}</div>
                <div className="text-[10px] opacity-80">{v.zhuyin.split('(')[0]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Final Batchim */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center justify-between border-b border-stone-100 pb-2">
            <span>3. 挑選終聲收音 (可選)</span>
            <span className="text-stone-400 text-[11px]">{finObj.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
            {FINAL_BATCHIM.map((b, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedFinal(idx);
                  soundFx.playFlip();
                }}
                className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                  selectedFinal === idx
                    ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-amber-50'
                }`}
              >
                <div>{b.label}</div>
                {b.zhuyin && <div className="text-[10px] opacity-80">注音：{b.zhuyin}</div>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
