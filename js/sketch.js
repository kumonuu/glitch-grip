/* ============================================
   GLITCH GRIP — Main p5.js Sketch
   Orchestrates dual-hand rendering pipeline,
   multi-hand gesture mapping, AI companion sync,
   and visual feedback.
   ============================================ */

// --- Global State ---
let particleSystem;
let bgBuffer;
let smoothedHandPositions = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
let currentGesture = 'NONE';
let energy = 100;
const MAX_ENERGY = 100;
let gestureActive = false;
let soundCooldowns = {};
let ambientTimer = 0;
let started = false;

// --- p5.js Lifecycle ---

function setup() {
  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent(document.body);
  cnv.style('position', 'fixed');
  cnv.style('top', '0');
  cnv.style('left', '0');
  cnv.style('z-index', '0');

  colorMode(HSB, 360, 100, 100, 255);
  frameRate(60);

  // Initialize particle system
  particleSystem = new ParticleSystem();
  particleSystem.init(width, height);

  // Background buffer for grid
  bgBuffer = createGraphics(width, height);
  bgBuffer.colorMode(HSB, 360, 100, 100, 255);

  // Listen for gesture changes to sync audio & AI companion
  GestureEngine.onGesture(onGestureChange);

  console.log('[SKETCH] Dual-hand p5.js initialized');
}

function draw() {
  if (!started) {
    background(7, 8, 12);
    return;
  }

  // Clear with fade trail for glowing neon particles
  background(240, 40, 5, 40);

  // Reactive grid background (throttled for high FPS)
  if (frameCount % 3 === 0) {
    EffectsEngine.drawBackground(bgBuffer);
  }
  image(bgBuffer, 0, 0);

  // Get all tracked hands
  const hands = GestureEngine.getHands();
  const isHand = hands.length > 0;
  const multiGesture = GestureEngine.getMultiHandGesture();
  currentGesture = GestureEngine.getCurrentGesture();

  // Smooth screen coordinates for each hand
  hands.forEach((h, idx) => {
    if (!smoothedHandPositions[idx]) smoothedHandPositions[idx] = { x: 0, y: 0 };
    smoothedHandPositions[idx].x = lerp(smoothedHandPositions[idx].x, h.smoothX * width, 0.25);
    smoothedHandPositions[idx].y = lerp(smoothedHandPositions[idx].y, h.smoothY * height, 0.25);
  });

  // --- Gesture Effect Pipeline ---
  if (isHand && energy > 0) {
    if (multiGesture !== 'NONE' && hands.length >= 2) {
      // Coordinated Multi-Hand Gesture
      applyMultiHandEffect(multiGesture, smoothedHandPositions[0], smoothedHandPositions[1], hands);
    } else {
      // Simultaneous Single-Hand Gestures for each active hand
      hands.forEach((h, idx) => {
        const pos = smoothedHandPositions[idx];
        applySingleHandEffect(h.gesture, pos.x, pos.y, h.landmarks, h.puppetMouth);
      });
    }
  }

  // Energy regeneration
  if (!gestureActive || currentGesture === 'NONE') {
    energy = min(energy + 0.35, MAX_ENERGY);
    gestureActive = false;
  }

  // Spawn ambient floating particles
  particleSystem.spawnAmbient(width, height);

  // Update & render particle engine
  particleSystem.update();
  particleSystem.draw();

  // Update & render visual effects layer
  EffectsEngine.update();
  EffectsEngine.drawEffects();

  // Draw futuristic cursors for each detected hand
  if (isHand) {
    hands.forEach((h, idx) => {
      const pos = smoothedHandPositions[idx];
      EffectsEngine.drawCursor(pos.x, pos.y, h.gesture, idx);
    });
  }

  // Update HUD
  updateHUD(hands, multiGesture);

  // Draw hand skeleton overlay on webcam preview
  const overlayCanvas = document.getElementById('hand-overlay');
  if (overlayCanvas) {
    GestureEngine.drawHandOverlay(overlayCanvas);
  }

  // Ambient sound pulse
  ambientTimer++;
  if (ambientTimer > 320) {
    ambientTimer = 0;
    AudioEngine.playAmbientPulse();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  particleSystem.resize(width, height);
  if (bgBuffer) bgBuffer.remove();
  bgBuffer = createGraphics(width, height);
  bgBuffer.colorMode(HSB, 360, 100, 100, 255);
}

// --- Multi-Hand Gestures ---

function applyMultiHandEffect(gesture, pos1, pos2, hands) {
  gestureActive = true;
  const midX = (pos1.x + pos2.x) / 2;
  const midY = (pos1.y + pos2.y) / 2;

  switch (gesture) {
    case 'HEART':
      // Love Heart: Floating neon hearts, parametric pulse, romantic chime
      energy -= 0.35;
      if (frameCount % 4 === 0) {
        particleSystem.emitHearts(midX, midY, 8);
      }
      if (frameCount % 10 === 0) {
        EffectsEngine.addHeartEffect(midX, midY);
      }
      playSoundThrottled('heart', () => AudioEngine.playHeartArpeggio(), 350);
      break;

    case 'ENERGY_CLASH':
      // Energy Clash: Plasma lightning bridging hands
      energy -= 0.7;
      particleSystem.emitLightning(pos1.x, pos1.y, pos2.x, pos2.y, 10);
      if (frameCount % 4 === 0) {
        EffectsEngine.addClashBeam(pos1.x, pos1.y, pos2.x, pos2.y);
      }
      if (frameCount % 20 === 0) {
        EffectsEngine.triggerFlash(180);
      }
      playSoundThrottled('clash', () => AudioEngine.playEnergyClash(), 300);
      break;

    case 'FUSION_SHIELD':
      // Fusion Shield: Massive dual honeycomb matrix
      energy -= 0.4;
      particleSystem.emitFusionShield(pos1.x, pos1.y, pos2.x, pos2.y);
      if (frameCount % 8 === 0) {
        EffectsEngine.addFusionShield(pos1.x, pos1.y, pos2.x, pos2.y);
      }
      playSoundThrottled('fusionshield', () => AudioEngine.playFusionShield(), 450);
      break;

    case 'DUAL_HORNS':
      // Dual Horns: Rave storm & concussive blast
      energy -= 1.2;
      if (frameCount % 6 === 0) {
        particleSystem.emitShockwave(midX, midY, 35);
        EffectsEngine.addShockwave(midX, midY);
        EffectsEngine.triggerGlitch(1.0);
        EffectsEngine.triggerFlash(300);
      }
      playSoundThrottled('dualhorns', () => AudioEngine.playDualHorns(), 450);
      break;

    case 'DUAL_PORTALS':
      // Dual Portals: Wormhole pair
      energy -= 0.6;
      particleSystem.emitPortal(pos1.x, pos1.y);
      particleSystem.emitPortal(pos2.x, pos2.y);
      if (frameCount % 12 === 0) {
        EffectsEngine.addPortal(pos1.x, pos1.y);
        EffectsEngine.addPortal(pos2.x, pos2.y);
      }
      playSoundThrottled('portal', () => AudioEngine.playPortal(), 400);
      break;

    case 'DUAL_BLAST':
      // Dual Blast: Twin cannons
      energy -= 0.8;
      if (frameCount % 3 === 0) {
        particleSystem.emitBlast(pos1.x, pos1.y, 0, -1, 15);
        particleSystem.emitBlast(pos2.x, pos2.y, 0, -1, 15);
        EffectsEngine.addBeam(pos1.x, pos1.y, 0, -1);
        EffectsEngine.addBeam(pos2.x, pos2.y, 0, -1);
      }
      playSoundThrottled('blast', () => AudioEngine.playEnergyBlast(), 250);
      break;
  }
}

// --- Single-Hand Gestures ---

function applySingleHandEffect(gesture, x, y, lm, puppetMouth = 0) {
  switch (gesture) {
    case 'FIST':
      // Gravity Well
      gestureActive = true;
      energy -= 0.35;
      particleSystem.applyGravity(x, y, 0.6, 250);
      if (frameCount % 10 === 0) {
        EffectsEngine.addGravityWell(x, y);
      }
      playSoundThrottled('gravity', () => AudioEngine.playGravityWell(), 500);
      break;

    case 'PALM':
      // Energy Shield
      gestureActive = true;
      energy -= 0.2;
      particleSystem.emitShield(x, y, 130);
      if (frameCount % 8 === 0) {
        EffectsEngine.addShield(x, y);
      }
      playSoundThrottled('shield', () => AudioEngine.playShield(), 350);
      break;

    case 'POINT':
      // Energy Blast
      gestureActive = true;
      energy -= 0.55;
      let dirX = 0, dirY = -1;
      if (lm) {
        dirX = -(lm[8].x - lm[0].x);
        dirY = lm[8].y - lm[0].y;
        const mag = Math.sqrt(dirX * dirX + dirY * dirY);
        if (mag > 0) { dirX /= mag; dirY /= mag; }
      }
      if (frameCount % 3 === 0) {
        particleSystem.emitBlast(x, y, dirX, dirY, 15);
        EffectsEngine.addBeam(x, y, dirX, dirY);
      }
      playSoundThrottled('blast', () => AudioEngine.playEnergyBlast(), 300);
      break;

    case 'PEACE':
      // Digital Distortion
      gestureActive = true;
      energy -= 0.35;
      EffectsEngine.triggerGlitch(0.85);
      if (frameCount % 5 === 0) {
        particleSystem.emitGlitch(x, y, 12);
      }
      playSoundThrottled('glitch', () => AudioEngine.playGlitch(), 200);
      break;

    case 'HORNS':
      // Concussive Shockwave
      gestureActive = true;
      energy -= 1.2;
      if (GestureEngine.getGestureDuration() < 180) {
        particleSystem.emitShockwave(x, y, 50);
        EffectsEngine.addShockwave(x, y);
        EffectsEngine.triggerFlash(20);
        AudioEngine.playShockwave();
      }
      break;

    case 'PINCH':
      // Portal Rift
      gestureActive = true;
      energy -= 0.45;
      particleSystem.emitPortal(x, y);
      if (frameCount % 12 === 0) {
        EffectsEngine.addPortal(x, y);
      }
      playSoundThrottled('portal', () => AudioEngine.playPortal(), 450);
      break;

    case 'PUPPET':
      // Hand Puppet Talking Chatter
      gestureActive = true;
      energy -= 0.15;
      if (frameCount % 6 === 0) {
        particleSystem.emitPuppetChatter(x, y, 3);
        EffectsEngine.addPuppetFX(x, y, puppetMouth);
      }
      playSoundThrottled('puppet', () => AudioEngine.playPuppetChatter(puppetMouth), 160);
      break;

    case 'THUMBS_UP':
      // Approval Badge
      gestureActive = true;
      energy -= 0.2;
      if (frameCount % 12 === 0) {
        particleSystem.emitApproval(x, y, true);
        EffectsEngine.addBadgeFX(x, y, 'UP');
      }
      playSoundThrottled('thumbsup', () => AudioEngine.playThumbsUp(), 400);
      break;

    case 'THUMBS_DOWN':
      // Disapproval Override
      gestureActive = true;
      energy -= 0.2;
      if (frameCount % 12 === 0) {
        particleSystem.emitApproval(x, y, false);
        EffectsEngine.addBadgeFX(x, y, 'DOWN');
      }
      playSoundThrottled('thumbsdown', () => AudioEngine.playThumbsDown(), 400);
      break;

    case 'GUN':
      // Finger Gun Quickdraw
      gestureActive = true;
      energy -= 0.35;
      if (frameCount % 5 === 0) {
        particleSystem.emitGunSpark(x, y, 1, 0);
        EffectsEngine.addBeam(x, y, 1, 0);
      }
      playSoundThrottled('gun', () => AudioEngine.playGunShot(), 220);
      break;

    case 'OK':
      // Harmonic Lock-On
      gestureActive = true;
      energy -= 0.2;
      if (frameCount % 15 === 0) {
        EffectsEngine.addShield(x, y);
      }
      playSoundThrottled('ok', () => AudioEngine.playOkTone(), 500);
      break;

    default:
      break;
  }
}

function onGestureChange(newGesture) {
  if (newGesture !== 'NONE') {
    AudioEngine.playBlip(720, 0.05);
    // Notify AI Companion
    if (typeof HoloCompanion !== 'undefined') {
      HoloCompanion.reactToGesture(newGesture);
    }
  } else {
    if (typeof HoloCompanion !== 'undefined') {
      HoloCompanion.reactToGesture('IDLE');
    }
  }
}

function playSoundThrottled(id, fn, cooldownMs) {
  const now = Date.now();
  if (!soundCooldowns[id] || now - soundCooldowns[id] > cooldownMs) {
    fn();
    soundCooldowns[id] = now;
  }
}

// --- HUD Updates ---

const gestureInfo = {
  'NONE':          { icon: '✋', name: 'AWAITING INPUT',     color: '#888' },
  'HEART':         { icon: '💖', name: 'LOVE HEART SYNC',     color: '#ff00aa' },
  'ENERGY_CLASH':  { icon: '⚡', name: 'DUAL BEAM CLASH',     color: '#00f0ff' },
  'FUSION_SHIELD': { icon: '🛡️', name: 'AEGIS MATRIX FUSION', color: '#ffe600' },
  'DUAL_HORNS':    { icon: '🤘', name: 'DUAL MATRIX RAVE',    color: '#b400ff' },
  'DUAL_PORTALS':  { icon: '🌀', name: 'WORMHOLE BRIDGE',     color: '#b400ff' },
  'DUAL_BLAST':    { icon: '💥', name: 'TWIN CANNON BARRAGE', color: '#00f0ff' },
  'PUPPET':        { icon: '🤖', name: 'ROBOTIC PUPPET',      color: '#ffe600' },
  'THUMBS_UP':     { icon: '👍', name: 'SYSTEM APPROVED',     color: '#39ff14' },
  'THUMBS_DOWN':   { icon: '👎', name: 'OVERRIDE LOGGED',     color: '#ff0040' },
  'GUN':           { icon: '👉', name: 'PLASMA QUICKDRAW',    color: '#00f0ff' },
  'OK':            { icon: '👌', name: 'HARMONIC LOCK',       color: '#ffe600' },
  'FIST':          { icon: '✊', name: 'GRAVITY WELL',        color: '#ff00aa' },
  'PALM':          { icon: '🖐️', name: 'ENERGY SHIELD',       color: '#ffe600' },
  'POINT':         { icon: '👆', name: 'ENERGY BLAST',        color: '#00f0ff' },
  'PEACE':         { icon: '✌️', name: 'GLITCH DISTORT',      color: '#39ff14' },
  'HORNS':         { icon: '🤘', name: 'SHOCKWAVE',           color: '#ff6a00' },
  'PINCH':         { icon: '👌', name: 'PORTAL RIFT',         color: '#b400ff' },
};

function updateHUD(hands, multiGesture) {
  // FPS
  const fpsEl = document.getElementById('fps-value');
  if (fpsEl && frameCount % 10 === 0) {
    fpsEl.textContent = floor(frameRate());
  }

  // Energy bar
  const energyFill = document.getElementById('energy-fill');
  if (energyFill) {
    energyFill.style.width = (energy / MAX_ENERGY * 100) + '%';
    if (energy < 20) {
      energyFill.style.background = 'linear-gradient(90deg, #ff0040, #ff6a00)';
    } else {
      energyFill.style.background = 'linear-gradient(90deg, #00f0ff, #ff00aa)';
    }
  }

  // Gesture display
  let activeKey = multiGesture !== 'NONE' ? multiGesture : currentGesture;
  const info = gestureInfo[activeKey] || gestureInfo['NONE'];
  const gIcon = document.getElementById('gesture-icon');
  const gName = document.getElementById('gesture-name');
  if (gIcon) gIcon.textContent = info.icon;
  if (gName) {
    if (multiGesture !== 'NONE') {
      gName.textContent = `[DUAL] ${info.name}`;
    } else if (hands.length === 2 && hands[0].gesture !== hands[1].gesture) {
      gName.textContent = `H1: ${hands[0].gesture} | H2: ${hands[1].gesture}`;
    } else {
      gName.textContent = info.name;
    }
    gName.style.color = info.color;
    gName.style.textShadow = `0 0 10px ${info.color}66`;
  }

  // Hand coordinates (shows coordinates of tracked hands)
  const coordsEl = document.getElementById('hand-coords');
  if (coordsEl) {
    if (hands.length >= 2) {
      const p1 = smoothedHandPositions[0];
      const p2 = smoothedHandPositions[1];
      coordsEl.textContent = `H1:[${floor(p1.x)},${floor(p1.y)}] H2:[${floor(p2.x)},${floor(p2.y)}]`;
    } else if (hands.length === 1) {
      const p1 = smoothedHandPositions[0];
      coordsEl.textContent = `H1:[${floor(p1.x)},${floor(p1.y)}]`;
    } else {
      coordsEl.textContent = 'NEURAL SENSORS IDLE';
    }
  }

  // Timestamp
  const timeEl = document.getElementById('hud-time');
  if (timeEl && frameCount % 30 === 0) {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  }
}

// Start rendering (called after boot sequence)
function startSketch() {
  started = true;
  if (typeof HoloCompanion !== 'undefined') {
    HoloCompanion.init();
  }
}
