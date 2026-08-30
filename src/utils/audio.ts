// Web Audio and Speech Synthesis for Korean Hangul

class AudioManager {
  private ctx: AudioContext | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        this.cachedVoices = window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play Sound Effects (Ultra-short, subtle, non-intrusive micro-sounds)
  playShortMastered() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  playShortPractice() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.035);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Ignore
    }
  }

  playChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Ignore audio error if blocked
    }
  }

  playError() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(160, now + 0.12);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Ignore
    }
  }

  playFlip() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.035);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Ignore
    }
  }

  playSwipe() {
    this.playShortMastered();
  }

  playTap() {
    this.playFlip();
  }

  playLevelUp() {
    this.playChime();
  }

  /**
   * Speak Korean Text using Web Speech API
   * Formats standalone consonants (like ㄱ -> "그" or "가" or "기역") and vowels (like ㅏ -> "아")
   * so that SpeechSynthesis speaks clearly.
   */
  speakKorean(text: string, rate: number = 0.9, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop prior speech

      // Normalize single letter consonants/vowels so TTS pronounces naturally
      let speechText = text;
      const singleLetterMap: Record<string, string> = {
        'ㄱ': '그',
        'ㄴ': '느',
        'ㄷ': '드',
        'ㄹ': '르',
        'ㅁ': '므',
        'ㅂ': '브',
        'ㅅ': '스',
        'ㅇ': '이응',
        'ㅈ': '즈',
        'ㅊ': '츠',
        'ㅋ': '크',
        'ㅌ': '트',
        'ㅍ': '프',
        'ㅎ': '흐',
        'ㄲ': '끄',
        'ㄸ': '뜨',
        'ㅃ': '쁘',
        'ㅆ': '쓰',
        'ㅉ': '쯔',
        'ㅏ': '아',
        'ㅑ': '야',
        'ㅓ': '어',
        'ㅕ': '여',
        'ㅗ': '오',
        'ㅛ': '요',
        'ㅜ': '우',
        'ㅠ': '유',
        'ㅡ': '으',
        'ㅣ': '이',
        'ㅐ': '애',
        'ㅒ': '얘',
        'ㅔ': '에',
        'ㅖ': '예',
        'ㅘ': '와',
        'ㅙ': '왜',
        'ㅚ': '외',
        'ㅝ': '워',
        'ㅞ': '웨',
        'ㅟ': '위',
        'ㅢ': '의',
      };

      if (singleLetterMap[text]) {
        speechText = singleLetterMap[text];
      }

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = 'ko-KR';
      utterance.rate = Math.max(0.6, Math.min(rate, 1.2));
      utterance.pitch = 1.0;

      // Check available voices for Korean (prefer high quality / native voices)
      const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
      const koVoices = voices.filter((v) => v.lang.startsWith('ko') || v.lang === 'ko-KR' || v.name.toLowerCase().includes('korean'));
      const naturalVoice = koVoices.find(
        (v) => v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Yuna') || v.name.includes('SunHi')
      );
      const koVoice = naturalVoice || koVoices[0];
      if (koVoice) {
        utterance.voice = koVoice;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      if (onEnd) onEnd();
    }
  }
}

export const soundFx = new AudioManager();
