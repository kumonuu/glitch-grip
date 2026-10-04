/* ============================================
   GLITCH GRIP — Audio Engine
   Synthesized cyberpunk sound effects using
   the Web Audio API. No external files needed.
   Includes expanded multi-hand & expressive audio.
   ============================================ */

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let enabled = true;
  let initialized = false;

  function init() {
    if (initialized) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(ctx.destination);
      initialized = true;
    } catch (e) {
      console.warn('[AUDIO] Web Audio API not supported:', e);
    }
  }

  function ensureContext() {
    if (!initialized) init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function toggle() {
    enabled = !enabled;
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  /* --- Synthesized Effects --- */

  // Short sci-fi "blip" tone
  function playBlip(freq = 880, dur = 0.08) {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(masterGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  // Energy blast — rising sweep with distortion
  function playEnergyBlast() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 0.35;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(2000, t + dur * 0.4);
    osc.frequency.exponentialRampToValueAtTime(100, t + dur);

    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(150, t);
    osc2.frequency.exponentialRampToValueAtTime(1200, t + dur * 0.3);
    osc2.frequency.exponentialRampToValueAtTime(80, t + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.linearRampToValueAtTime(0.4, t + dur * 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    const dist = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 4) * x / (Math.PI + 4 * Math.abs(x));
    }
    dist.curve = curve;

    osc.connect(dist);
    osc2.connect(dist);
    dist.connect(g).connect(masterGain);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + dur);
    osc2.stop(t + dur);
  }

  // Gravity well — deep pulsing hum
  function playGravityWell() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 0.5;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.linearRampToValueAtTime(40, t + dur);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(110, t);
    osc2.frequency.linearRampToValueAtTime(80, t + dur);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(8, t);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(20, t);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.2, t);
    g.gain.linearRampToValueAtTime(0.3, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(g);
    osc2.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc2.start(t);
    lfo.start(t);
    osc.stop(t + dur);
    osc2.stop(t + dur);
    lfo.stop(t + dur);
  }

  // Shield hum — bright resonant tone
  function playShield() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 0.3;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(554, t); // major third

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(g);
    osc2.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + dur);
    osc2.stop(t + dur);
  }

  // Glitch distortion — noise burst
  function playGlitch() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 0.2;

    const bufferSize = ctx.sampleRate * dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const noise = Math.random() * 2 - 1;
      data[i] = Math.round(noise * 4) / 4;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, t);
    filter.Q.setValueAtTime(5, t);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(filter).connect(g).connect(masterGain);
    src.start(t);
    src.stop(t + dur);
  }

  // Shockwave — deep impact boom
  function playShockwave() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 0.4;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + dur);

    const bufferSize = ctx.sampleRate * 0.15;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    const noiseG = ctx.createGain();
    noiseG.gain.setValueAtTime(0.2, t);
    noiseG.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(g).connect(masterGain);
    noiseSrc.connect(noiseG).connect(masterGain);
    osc.start(t);
    noiseSrc.start(t);
    osc.stop(t + dur);
    noiseSrc.stop(t + 0.15);
  }

  // Portal rift — swirling ethereal tone
  function playPortal() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 0.5;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(600, t + dur * 0.5);
    osc.frequency.linearRampToValueAtTime(300, t + dur);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(305, t);
    osc2.frequency.linearRampToValueAtTime(605, t + dur * 0.5);
    osc2.frequency.linearRampToValueAtTime(305, t + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.2, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(g);
    osc2.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + dur);
    osc2.stop(t + dur);
  }

  /* --- NEW GESTURE SOUNDS --- */

  // Love Heart — sweet romantic cyber chime arpeggio
  function playHeartArpeggio() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;

    // Romantic sparkling major 9th chord arpeggio: Eb4, G4, Bb4, D5, F5
    const freqs = [311.13, 392.00, 466.16, 587.33, 698.46, 932.33];
    freqs.forEach((f, i) => {
      const noteTime = t + i * 0.055;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, noteTime);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(f * 2, noteTime); // bell sparkle

      g.gain.setValueAtTime(0.001, noteTime);
      g.gain.linearRampToValueAtTime(0.18, noteTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.45);

      osc.connect(g);
      osc2.connect(g);
      g.connect(masterGain);

      osc.start(noteTime);
      osc2.start(noteTime);
      osc.stop(noteTime + 0.45);
      osc2.stop(noteTime + 0.45);
    });

    // Warm sub bass pad
    const subOsc = ctx.createOscillator();
    const subG = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(155.56, t); // Eb3
    subG.gain.setValueAtTime(0.15, t);
    subG.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    subOsc.connect(subG).connect(masterGain);
    subOsc.start(t);
    subOsc.stop(t + 0.6);
  }

  // Hand Puppet — quirky robotic formant chatter
  function playPuppetChatter(openRatio = 0.5) {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 0.12;

    const baseFreq = 220 + openRatio * 320;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq * (0.8 + Math.random() * 0.4), t + dur);

    // Formant filter for vowel "wah/bip" character
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600 + openRatio * 1200, t);
    filter.Q.setValueAtTime(6.0, t);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter).connect(g).connect(masterGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  // Energy Clash — roaring binaural laser clash
  function playEnergyClash() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 0.4;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(320, t + dur * 0.5);
    osc.frequency.linearRampToValueAtTime(60, t + dur);

    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(180, t);
    osc2.frequency.linearRampToValueAtTime(450, t + dur * 0.4);
    osc2.frequency.linearRampToValueAtTime(90, t + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.linearRampToValueAtTime(0.45, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(g);
    osc2.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + dur);
    osc2.stop(t + dur);
  }

  // Fusion Shield — expansive harmonic gong
  function playFusionShield() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 0.6;

    const notes = [329.63, 440.0, 659.25, 880.0];
    notes.forEach((f) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g).connect(masterGain);
      osc.start(t);
      osc.stop(t + dur);
    });
  }

  // Dual Horns — heavy cyber rave power chord
  function playDualHorns() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 0.55;

    // Heavy root-fifth-octave power chord: E2 (82.4), B2 (123.5), E3 (164.8)
    const freqs = [82.41, 123.47, 164.81];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);

      const dist = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = Math.tanh(x * 3);
      }
      dist.curve = curve;

      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(dist).connect(g).connect(masterGain);
      osc.start(t);
      osc.stop(t + dur);
    });
  }

  // Thumbs Up — cheerful major triumph chime
  function playThumbsUp() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((f, i) => {
      const nt = t + i * 0.05;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, nt);
      g.gain.setValueAtTime(0.18, nt);
      g.gain.exponentialRampToValueAtTime(0.001, nt + 0.3);
      osc.connect(g).connect(masterGain);
      osc.start(nt);
      osc.stop(nt + 0.3);
    });
  }

  // Thumbs Down — descending glitch buzz
  function playThumbsDown() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 0.28;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.linearRampToValueAtTime(90, t + dur);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(masterGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  // Finger Gun — crisp plasma pew
  function playGunShot() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 0.18;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + dur);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(masterGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  // OK Sign — crystalline chime
  function playOkTone() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 0.35;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1320, t + 0.08);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(masterGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  // Ambient background drone
  function playAmbientPulse() {
    ensureContext();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const dur = 2.0;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, t);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.5, t);
    const lfoG = ctx.createGain();
    lfoG.gain.setValueAtTime(10, t);
    lfo.connect(lfoG);
    lfoG.connect(osc.frequency);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.linearRampToValueAtTime(0.12, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(g).connect(masterGain);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + dur);
    lfo.stop(t + dur);
  }

  // Boot-up beep sequence
  function playBootBeep(index) {
    ensureContext();
    if (!ctx) return;
    const freqs = [440, 523, 659, 784, 880, 1047, 1175, 1319];
    const f = freqs[index % freqs.length];
    const t = ctx.currentTime;
    const dur = 0.06;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(f, t);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(g).connect(masterGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  // Boot complete — triumphant chord
  function playBootComplete() {
    ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dur = 0.8;
    const freqs = [261.63, 329.63, 392.00, 523.25]; // C major chord

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(f, t);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(g).connect(masterGain);
      osc.start(t + i * 0.04);
      osc.stop(t + dur);
    });
  }

  return {
    init,
    toggle,
    isEnabled,
    playBlip,
    playEnergyBlast,
    playGravityWell,
    playShield,
    playGlitch,
    playShockwave,
    playPortal,
    playAmbientPulse,
    playBootBeep,
    playBootComplete,
    playHeartArpeggio,
    playPuppetChatter,
    playEnergyClash,
    playFusionShield,
    playDualHorns,
    playThumbsUp,
    playThumbsDown,
    playGunShot,
    playOkTone,
  };
})();
