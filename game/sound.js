// A swung two-step for pizzicato bass, tack piano and a little theatre reed.
const CHANGES = [
  [43, 59, 62, 67], [47, 57, 62, 66], [48, 60, 64, 67], [49, 58, 64, 67],
  [50, 59, 62, 67], [52, 58, 61, 67], [50, 57, 60, 66], [43, 59, 62, 67]
];
const VERSE = [
  [0, 0, 71, 74, 0, 76, 74, 0], [71, 0, 0, 69, 66, 0, 69, 0],
  [0, 67, 72, 0, 76, 0, 74, 72], [70, 0, 0, 67, 64, 0, 67, 0],
  [71, 0, 74, 0, 79, 78, 76, 0], [73, 0, 70, 0, 67, 0, 0, 0],
  [69, 72, 0, 74, 78, 0, 72, 69], [67, 0, 0, 0, 0, 0, 0, 0]
];

const frequency = note => 440 * 2 ** ((note - 69) / 12);

export class Band {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.paused = false;
    this.voices = new Set();
    this.step = 0;
    this.nextBeat = 0;
  }

  unlock() {
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Context) return;
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new Context();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted || this.paused ? 0 : 0.72;
        this.master.connect(this.ctx.destination);
        const reed = [0, 1, 0.32, 0.46, 0.09, 0.15, 0.04, 0.07];
        this.reed = this.ctx.createPeriodicWave(new Float32Array(reed.length), new Float32Array(reed));
      }
      if (this.ctx.state !== 'running' && !this.resuming) {
        this.resuming = this.ctx.resume().then(() => {
          const cue = this.pending;
          this.pending = null;
          if (cue && performance.now() - cue.stamp < 250) this.play(cue.name, cue.pitch);
        }).catch(() => { this.pending = null; }).finally(() => { this.resuming = null; });
      }
      return this.resuming;
    } catch {
      // Audio devices can be unavailable while the rest of the game is playable.
      return;
    }
  }

  mute(value) {
    this.muted = Boolean(value);
    this.syncOutput();
  }

  pause(value) {
    this.paused = Boolean(value);
    this.syncOutput();
  }

  syncOutput() {
    if (!this.ctx) return;
    const silent = this.muted || this.paused;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(silent ? 0 : 0.72, now, 0.007);
    if (silent) {
      this.pending = null;
      for (const voice of this.voices) voice.stop(now + 0.022);
    }
    this.nextBeat = 0;
  }

  note(tone, midi, when, duration, amplitude, endMidi = midi) {
    if (this.voices.size >= 32) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    if (tone === 'reed') osc.setPeriodicWave(this.reed);
    else osc.type = tone;
    osc.frequency.setValueAtTime(frequency(midi), when);
    if (midi !== endMidi) osc.frequency.exponentialRampToValueAtTime(frequency(endMidi), when + duration);
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(amplitude, when + 0.007);
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(env);
    env.connect(this.master);
    this.voices.add(osc);
    osc.onended = () => {
      this.voices.delete(osc);
      osc.disconnect();
      env.disconnect();
    };
    osc.start(when);
    osc.stop(when + duration + 0.003);
  }

  tick(_time, act = 1) {
    if (!this.ctx || this.ctx.state !== 'running' || this.muted || this.paused) return;
    const now = this.ctx.currentTime;
    const level = Math.max(1, Math.min(3, Number(act) || 1));
    const beat = 60 / (104 + (level - 1) * 7);
    if (this.nextBeat < now) this.nextBeat = now + 0.012;
    while (this.nextBeat <= now + 0.075) {
      const slot = this.step % 8;
      const bar = Math.floor(this.step / 8) % CHANGES.length;
      const chord = CHANGES[bar];
      const t = this.nextBeat;
      if (slot === 0 || slot === 4) {
        const bass = chord[0] + (slot === 4 ? 7 : 0);
        this.note('triangle', bass, t, beat * 0.76, 0.13);
      }
      if (slot === 2 || slot === 6) {
        chord.slice(1).forEach((key, i) => this.note('triangle', key, t + i * 0.009, beat * 0.44, 0.041));
      }
      let melody = VERSE[bar][slot];
      if (level >= 2 && (bar === 1 || bar === 7) && slot === 7) melody = chord[2] + 12;
      if (melody) this.note('reed', melody, t, beat * (VERSE[bar][slot + 1] ? 0.5 : 0.86), 0.048);
      if (level >= 3 && slot === 3 && bar % 2 === 0) this.note('sine', chord[3] + 12, t, 0.13, 0.042);
      this.nextBeat += beat * (slot % 2 === 0 ? 0.57 : 0.43);
      this.step = (this.step + 1) % 64;
    }
  }

  play(name, pitch = 0) {
    if (!this.ctx || this.muted || this.paused) return;
    if (this.ctx.state !== 'running') {
      if (this.resuming) this.pending = { name, pitch, stamp: performance.now() };
      return;
    }
    const t = this.ctx.currentTime + 0.004;
    const offset = Math.max(-12, Math.min(12, Number(pitch) || 0));
    const strike = (key, delay = 0, length = 0.2, level = 0.14) =>
      this.note('triangle', key + offset, t + delay, length, level);
    switch (name) {
      case 'land':
        this.note('sine', 51, t, 0.105, 0.23, 32);
        break;
      case 'rim':
        this.note('triangle', 62, t, 0.065, 0.12);
        this.note('triangle', 74, t + 0.046, 0.16, 0.14);
        break;
      case 'catch':
      case 'highCatch':
        strike(74);
        strike(81, 0.055, 0.19, 0.12);
        if (name === 'highCatch') strike(86, 0.105, 0.3, 0.12);
        break;
      case 'bell':
        this.note('sine', 86 + offset, t, 0.63, 0.16);
        this.note('sine', 104 + offset, t, 0.17, 0.045);
        break;
      case 'miss':
        this.note('reed', 66, t, 0.29, 0.13, 52);
        break;
      case 'next':
      case 'start':
      case 'bow': {
        if (name === 'start') {
          this.step = 0;
          this.nextBeat = t + 0.42;
        }
        const tune = name === 'bow' ? [79, 74, 71, 67] : name === 'next' ? [71, 74, 78, 79] : [62, 67, 71];
        tune.forEach((key, i) => strike(key, i * 0.085, i === tune.length - 1 ? 0.45 : 0.16));
        break;
      }
    }
  }
}
