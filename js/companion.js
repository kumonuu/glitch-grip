/* ============================================
   GLITCH GRIP — Holographic AI Companion (KIRA-v4.2)
   Visually responsive AI character companion that
   dances and performs animations inspired by the
   user's single-hand and multi-hand gestures.
   ============================================ */

const HoloCompanion = (() => {
  let container = null;
  let charImage = null;
  let speechBubble = null;
  let speechText = null;
  let statusBadge = null;
  let syncRateEl = null;
  let eqBars = [];
  let currentPose = 'IDLE';
  let isMinimized = false;
  let typewriterTimeout = null;
  let danceInterval = null;

  // Image assets mapped to gestures
  const characterImages = {
    IDLE: 'assets/character/idle_dance.jpg',
    HEART: 'assets/character/heart_dance.jpg',
    PUPPET: 'assets/character/puppet_dance.jpg',
    BLAST: 'assets/character/blast_dance.jpg',
    ROCK: 'assets/character/rock_dance.jpg',
  };

  // Preload character images for zero-lag transitions
  const preloadedImages = {};
  function preloadImages() {
    for (const [key, src] of Object.entries(characterImages)) {
      const img = new Image();
      img.src = src;
      preloadedImages[key] = img;
    }
  }

  // Dance styles & reactions per gesture
  const gestureReactions = {
    IDLE: {
      imageKey: 'IDLE',
      danceClass: 'dance-idle-groove',
      poseName: 'NEURAL IDLE GROOVE',
      lines: [
        'Awaiting neural input, Operator...',
        'Show me a gesture to begin the sync!',
        'Neural link stable. Ready when you are!',
      ],
      color: '#00f0ff',
    },
    HEART: {
      imageKey: 'HEART',
      danceClass: 'dance-heart-pop',
      poseName: 'LOVE SYNC PROTOCOL',
      lines: [
        'Aww! Neural love sync at 100%! <3',
        'Heart resonance detected! Pure cyberpunk bliss!',
        'Dual-hand love wave locked! You’re amazing, Operator!',
      ],
      color: '#ff00aa',
    },
    PUPPET: {
      imageKey: 'PUPPET',
      danceClass: 'dance-puppet-robot',
      poseName: 'ROBOTIC PUPPET DANCE',
      lines: [
        'BEEP BOOP! Hand puppet override engaged!',
        'Chatter detected! Who’s pulling the cyber strings?!',
        'Pop-and-lock subroutine active! Wah-wah!',
      ],
      color: '#ffe600',
    },
    POINT: {
      imageKey: 'BLAST',
      danceClass: 'dance-combat-barrage',
      poseName: 'TACTICAL BLASTER DANCE',
      lines: [
        'Target locked! Firing high-energy plasma beam!',
        'Beam trajectory confirmed! Decimating particles!',
        'Combat rhythm engaged! Fire at will!',
      ],
      color: '#00f0ff',
    },
    GUN: {
      imageKey: 'BLAST',
      danceClass: 'dance-combat-barrage',
      poseName: 'FINGER GUN QUICKDRAW',
      lines: [
        'Pew pew! Cyber gunslinger in the matrix!',
        'Quickdraw detected! Rapid plasma discharge!',
      ],
      color: '#00f0ff',
    },
    DUAL_BLAST: {
      imageKey: 'BLAST',
      danceClass: 'dance-combat-barrage',
      poseName: 'TWIN CANNON BARRAGE',
      lines: [
        'MAXIMUM FIREPOWER! Twin energy cannons online!',
        'Full barrage synchronized! Grid overload!',
      ],
      color: '#00f0ff',
    },
    HORNS: {
      imageKey: 'ROCK',
      danceClass: 'dance-cyber-headbang',
      poseName: 'CYBER RAVE OVERDRIVE',
      lines: [
        'ROCK ON! Headbanging in the sprawl!',
        'Synthesizer lightning overload! Let’s tear the roof off!',
      ],
      color: '#ff6a00',
    },
    DUAL_HORNS: {
      imageKey: 'ROCK',
      danceClass: 'dance-cyber-headbang',
      poseName: 'DUAL MATRIX RAVE',
      lines: [
        'DOUBLE HORNS! UNLEASHING THE CYBERSTORM!',
        'HEAVY SYNTH OVERDRIVE! MAXIMUM VOLUME!',
      ],
      color: '#b400ff',
    },
    ENERGY_CLASH: {
      imageKey: 'BLAST',
      danceClass: 'dance-combat-barrage',
      poseName: 'DUAL BEAM CLASH',
      lines: [
        'ENERGY CLASH! Singularity reaching critical threshold!',
        'KAMEHAMEHA! Channeling massive twin plasma streams!',
      ],
      color: '#00f0ff',
    },
    FUSION_SHIELD: {
      imageKey: 'IDLE',
      danceClass: 'dance-shield-ballet',
      poseName: 'AEGIS MATRIX FUSION',
      lines: [
        'Dual-hand Aegis Barrier online! We are invulnerable!',
        'Harmonic hexagonal defense grid spanning the quadrant!',
      ],
      color: '#ffe600',
    },
    PALM: {
      imageKey: 'IDLE',
      danceClass: 'dance-shield-ballet',
      poseName: 'ENERGY SHIELD MATRIX',
      lines: [
        'Shield deployed! Deflecting spatial disturbances!',
        'Radiant energy barrier holding steady!',
      ],
      color: '#ffe600',
    },
    FIST: {
      imageKey: 'ROCK',
      danceClass: 'dance-gravity-crouch',
      poseName: 'GRAVITY DROP DANCE',
      lines: [
        'Gravity singularity pulling particles into orbit!',
        'High-density gravitational collapse detected!',
      ],
      color: '#ff00aa',
    },
    PEACE: {
      imageKey: 'IDLE',
      danceClass: 'dance-victory-bounce',
      poseName: 'IDOL VICTORY BOUNCE',
      lines: [
        'V-Sign acknowledged! Peace in Neo-Tokyo!',
        'Glitch wave calibrated! Radiant idol vibes!',
      ],
      color: '#39ff14',
    },
    PINCH: {
      imageKey: 'HEART',
      danceClass: 'dance-vortex-twirl',
      poseName: 'QUANTUM RIFT TWIRL',
      lines: [
        'Dimensional portal torn open! Rifting in style!',
        'Subspace vortex spinning up!',
      ],
      color: '#b400ff',
    },
    DUAL_PORTALS: {
      imageKey: 'HEART',
      danceClass: 'dance-vortex-twirl',
      poseName: 'EINSTEIN-ROSEN BRIDGE',
      lines: [
        'Twin portals linked! Wormhole transit established!',
      ],
      color: '#b400ff',
    },
    THUMBS_UP: {
      imageKey: 'IDLE',
      danceClass: 'dance-victory-bounce',
      poseName: 'SYSTEM APPROVAL DANCE',
      lines: [
        'Affirmative! Neural link rated optimal! 👍',
        'Operator approved! Efficiency at peak levels!',
      ],
      color: '#39ff14',
    },
    THUMBS_DOWN: {
      imageKey: 'ROCK',
      danceClass: 'dance-gravity-crouch',
      poseName: 'OVERRIDE RECALIBRATION',
      lines: [
        'Command denied? Recalibrating matrix parameters! 👎',
        'Override logged! Adjusting cybernetic algorithms!',
      ],
      color: '#ff0040',
    },
    OK: {
      imageKey: 'HEART',
      danceClass: 'dance-victory-bounce',
      poseName: 'HARMONIC LOCK-ON',
      lines: [
        'All parameters OK! Harmonic cyber balance reached!',
      ],
      color: '#ffe600',
    },
  };

  function init() {
    preloadImages();
    createDOM();
    setupDraggable();
    startAudioVisualizerLoop();
  }

  function createDOM() {
    // Check if already created
    if (document.getElementById('ai-companion')) return;

    container = document.createElement('aside');
    container.id = 'ai-companion';
    container.className = 'holo-companion-widget';
    container.setAttribute('aria-label', 'AI Holographic Companion');

    container.innerHTML = `
      <div class="holo-header" id="holo-drag-handle">
        <div class="holo-title-group">
          <span class="holo-pulse-dot"></span>
          <span class="holo-name">A.I. COMPANION // KIRA</span>
          <span class="holo-tag" id="holo-sync-tag">99.8% SYNC</span>
        </div>
        <div class="holo-controls">
          <button class="holo-btn-mini" id="holo-toggle-dance" title="Trigger Rave Dance">💃</button>
          <button class="holo-btn-mini" id="holo-btn-min" title="Minimize / Expand">_</button>
        </div>
      </div>

      <div class="holo-body" id="holo-body">
        <!-- Holographic Character Display -->
        <div class="holo-viewport">
          <div class="holo-glitch-layer"></div>
          <img id="holo-char-img" class="holo-char-img dance-idle-groove" src="${characterImages.IDLE}" alt="Cyberpunk AI Companion Dancing" />
          
          <!-- Scanline overlay & HUD rings -->
          <div class="holo-scanlines"></div>
          <div class="holo-hud-circle"></div>
          
          <!-- Holographic Pose Badge -->
          <div class="holo-pose-badge" id="holo-pose-badge">
            <span class="holo-pose-glyph">⟐</span>
            <span class="holo-pose-text" id="holo-pose-text">NEURAL IDLE GROOVE</span>
          </div>

          <!-- Interactive Dance Mode Selector Bar -->
          <div class="holo-dance-presets">
            <button class="preset-btn" data-pose="HEART" title="Love Heart Dance">❤</button>
            <button class="preset-btn" data-pose="PUPPET" title="Puppet Robot Dance">🤖</button>
            <button class="preset-btn" data-pose="HORNS" title="Cyber Rock Rave">🤘</button>
            <button class="preset-btn" data-pose="POINT" title="Blaster Combat">⚡</button>
            <button class="preset-btn" data-pose="PEACE" title="Idol Victory">✌</button>
          </div>
        </div>

        <!-- Speech / Reactive Dialogue Box -->
        <div class="holo-dialogue-box">
          <div class="holo-speaker-name">KIRA // REACTIVE CORTEX</div>
          <p class="holo-dialogue-text" id="holo-speech-text">Awaiting neural input, Operator...</p>
        </div>

        <!-- Equalizer Rhythm Spectrum -->
        <div class="holo-eq-bar" id="holo-eq-bar">
          ${Array.from({ length: 18 }).map(() => '<span class="eq-col"></span>').join('')}
        </div>
      </div>
    `;

    document.body.appendChild(container);

    charImage = document.getElementById('holo-char-img');
    speechText = document.getElementById('holo-speech-text');
    statusBadge = document.getElementById('holo-pose-text');
    syncRateEl = document.getElementById('holo-sync-tag');
    eqBars = Array.from(document.querySelectorAll('.eq-col'));

    // Setup Minimize
    const btnMin = document.getElementById('holo-btn-min');
    const holoBody = document.getElementById('holo-body');
    if (btnMin && holoBody) {
      btnMin.addEventListener('click', () => {
        isMinimized = !isMinimized;
        holoBody.classList.toggle('minimized', isMinimized);
        container.classList.toggle('widget-minimized', isMinimized);
        btnMin.textContent = isMinimized ? '□' : '_';
      });
    }

    // Dance party trigger
    const btnDance = document.getElementById('holo-toggle-dance');
    if (btnDance) {
      btnDance.addEventListener('click', () => {
        const dancePoses = ['HEART', 'PUPPET', 'HORNS', 'POINT', 'PEACE'];
        const next = dancePoses[Math.floor(Math.random() * dancePoses.length)];
        reactToGesture(next, { force: true });
        AudioEngine.playBlip(990, 0.1);
      });
    }

    // Preset buttons
    const presetBtns = container.querySelectorAll('.preset-btn');
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = btn.getAttribute('data-pose');
        reactToGesture(p, { force: true });
      });
    });
  }

  // Typewriter effect for speech bubble
  function typewriteSpeech(text) {
    if (!speechText) return;
    if (typewriterTimeout) clearTimeout(typewriterTimeout);

    speechText.textContent = '';
    let idx = 0;
    function typeChar() {
      if (idx < text.length) {
        speechText.textContent += text[idx];
        idx++;
        typewriterTimeout = setTimeout(typeChar, 18);
      }
    }
    typeChar();
  }

  // Update companion reaction based on gesture
  function reactToGesture(gesture, opts = {}) {
    const config = gestureReactions[gesture] || gestureReactions['IDLE'];

    if (gesture === currentPose && !opts.force) return;
    currentPose = gesture;

    // 1. Update Character Image with smooth crossfade & glitch slice
    if (charImage) {
      const targetSrc = characterImages[config.imageKey] || characterImages.IDLE;
      
      // Add quick transition flash
      charImage.classList.add('switching');
      setTimeout(() => {
        charImage.src = targetSrc;
        // Swap dance animation classes
        charImage.className = `holo-char-img ${config.danceClass}`;
        charImage.classList.remove('switching');
      }, 100);
    }

    // 2. Update Pose Badge
    if (statusBadge) {
      statusBadge.textContent = config.poseName;
      statusBadge.style.color = config.color;
      statusBadge.style.textShadow = `0 0 10px ${config.color}`;
    }

    // 3. Update Sync Rate
    if (syncRateEl) {
      const randSync = (98.5 + Math.random() * 1.4).toFixed(1);
      syncRateEl.textContent = `${randSync}% SYNC`;
    }

    // 4. Update Dialogue
    const randomLine = config.lines[Math.floor(Math.random() * config.lines.length)];
    typewriteSpeech(randomLine);

    // 5. Add dynamic glow pulse to widget border
    if (container) {
      container.style.borderColor = config.color;
      container.style.boxShadow = `0 0 25px ${config.color}33, inset 0 0 15px ${config.color}22`;
    }
  }

  // Simulated rhythmic audio equalizer
  function startAudioVisualizerLoop() {
    function animateEQ() {
      if (!isMinimized && eqBars.length > 0) {
        const isDancing = currentPose !== 'IDLE' && currentPose !== 'NONE';
        const boost = isDancing ? 1.6 : 0.8;
        const time = Date.now() * 0.006;

        eqBars.forEach((bar, i) => {
          const h = Math.abs(Math.sin(time + i * 0.45) * Math.cos(time * 0.7 + i * 0.2)) * 100 * boost;
          bar.style.height = `${Math.min(Math.max(h, 8), 100)}%`;
        });
      }
      requestAnimationFrame(animateEQ);
    }
    requestAnimationFrame(animateEQ);
  }

  // Make widget draggable for ergonomic placement
  function setupDraggable() {
    const handle = document.getElementById('holo-drag-handle');
    if (!handle || !container) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = container.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      container.style.right = 'auto';
      container.style.bottom = 'auto';
      container.style.left = `${initialLeft}px`;
      container.style.top = `${initialTop}px`;
      container.classList.add('dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newX = Math.max(10, Math.min(window.innerWidth - container.offsetWidth - 10, initialLeft + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - container.offsetHeight - 10, initialTop + dy));
      container.style.left = `${newX}px`;
      container.style.top = `${newY}px`;
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        container.classList.remove('dragging');
      }
    });
  }

  return {
    init,
    reactToGesture,
    getCurrentPose: () => currentPose,
  };
})();
