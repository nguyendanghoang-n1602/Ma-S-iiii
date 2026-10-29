// Web Audio API procedural sound engine for Werewolf: Làng Sói
// 100% self-contained, no external mp3 assets required, ultra-low latency

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;

  constructor() {
    const savedMute = localStorage.getItem('langsoi_sound_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
    const savedVol = localStorage.getItem('langsoi_sound_volume');
    if (savedVol !== null) {
      this.volume = parseFloat(savedVol);
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('langsoi_sound_muted', String(this.isMuted));
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    localStorage.setItem('langsoi_sound_volume', String(this.volume));
  }

  public getVolume(): number {
    return this.volume;
  }

  // Tiếng Sói hú ban đêm
  public playWolfHowl() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      filter.type = 'bandpass';
      filter.Q.value = 4;

      const now = ctx.currentTime;

      // Howl pitch contour: starts at 220Hz, rises to 520Hz, then drops slowly to 180Hz
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.6);
      osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);
      osc.frequency.exponentialRampToValueAtTime(180, now + 2.5);

      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(1100, now + 0.6);
      filter.frequency.exponentialRampToValueAtTime(300, now + 2.5);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.4);
      gain.gain.linearRampToValueAtTime(0.3 * this.volume, now + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.7);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Tiếng Tiên tri soi bài (huyền bí, ngân vang)
  public playSeerChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.0);
      });
    } catch {}
  }

  // Tiếng Phù thủy dùng thuốc
  public playPotionSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.6);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28 * this.volume, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
    } catch {}
  }

  // Tiếng Bảo vệ giáp khiên
  public playShieldClang() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc2.type = 'square';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.4);
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(200, now + 0.3);

      gain.gain.setValueAtTime(0.4 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch {}
  }

  // Tiếng Chuông làng buổi sáng (Bình minh)
  public playMorningBell() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.15;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.3 * this.volume, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 1.7);
      });
    } catch {}
  }

  // Tiếng Cồng hành quyết / Người bị loại
  public playDeathGong() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 1.2);

      gain.gain.setValueAtTime(0.45 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.8);
    } catch {}
  }

  // Tiếng Tick đồng hồ đếm ngược
  public playTick() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);

      gain.gain.setValueAtTime(0.12 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  // Tiếng Bấm nút / chọn mục tiêu
  public playClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.15 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  // Tiếng Chiến thắng
  public playVictory() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      chords.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.3 * this.volume, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.3);
      });
    } catch {}
  }
}

export const sounds = new SoundEngine();
