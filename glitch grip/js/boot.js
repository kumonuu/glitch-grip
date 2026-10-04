/* ============================================
   GLITCH GRIP — Boot Sequence Controller
   Cinematic system initialization with
   terminal-style logging, dual-hand calibration,
   and interactive AI companion startup.
   ============================================ */

(function () {
  const bootOverlay = document.getElementById('boot-overlay');
  const bootLog = document.getElementById('boot-log');
  const bootProgress = document.getElementById('boot-progress-bar');
  const bootStatus = document.getElementById('boot-status');
  const uiOverlay = document.getElementById('ui-overlay');

  const logMessages = [
    { text: 'LOADING NEURAL INTERFACE CORE v3.0...', type: 'ok', delay: 250 },
    { text: 'CONNECTING TO VISUAL CORTEX...', type: 'ok', delay: 300 },
    { text: 'INITIALIZING p5.js RENDER ENGINE...', type: 'ok', delay: 280 },
    { text: 'LOADING DUAL-HAND PARTICLE SUBSYSTEM...', type: 'ok', delay: 300 },
    { text: 'CALIBRATING MEDIAPIPE DUAL SENSORS [2 HANDS]...', type: 'ok', delay: 400 },
    { text: '> MULTI-HAND LOVE HEART DETECTOR ✓', type: 'ok', delay: 180 },
    { text: '> ROBOTIC PUPPET CHATTER RECOGNIZER ✓', type: 'ok', delay: 180 },
    { text: '> DUAL PLASMA BEAM CLASH MATRIX ✓', type: 'ok', delay: 180 },
    { text: '> FUSION SHIELD AEGIS GRID ✓', type: 'ok', delay: 180 },
    { text: 'COMPILING SHADER EFFECTS & CHROMATIC ABERRATION...', type: 'ok', delay: 250 },
    { text: 'SPAWNING HOLOGRAPHIC AI COMPANION [KIRA-v4.2]...', type: 'ok', delay: 350 },
    { text: 'SYNTHESIZING FM HARMONIC SOUND BANKS...', type: 'ok', delay: 300 },
    { text: 'WARNING: REALITY DISTORTION FIELD ACTIVE', type: 'warn', delay: 250 },
    { text: 'REQUESTING WEBCAM ACCESS FOR DUAL TRACKING...', type: 'ok', delay: 600 },
    { text: 'NEURAL LINK ESTABLISHED — ALL SYSTEMS NOMINAL', type: 'ok', delay: 250 },
  ];

  let currentLine = 0;
  let progress = 0;

  function addLogLine(msg) {
    const line = document.createElement('div');
    line.className = `log-line ${msg.type}`;
    line.innerHTML = `<span class="prefix">[SYS]</span> ${msg.text}`;
    bootLog.appendChild(line);
    bootLog.scrollTop = bootLog.scrollHeight;
  }

  function nextLine() {
    if (currentLine >= logMessages.length) {
      finishBoot();
      return;
    }

    const msg = logMessages[currentLine];
    addLogLine(msg);
    AudioEngine.playBootBeep(currentLine);

    currentLine++;
    progress = (currentLine / logMessages.length) * 100;
    bootProgress.style.width = progress + '%';
    bootStatus.textContent = msg.text.replace(/\.\.\./g, '').replace(/[>✓=]/g, '').trim();

    setTimeout(nextLine, msg.delay);
  }

  async function finishBoot() {
    bootStatus.textContent = 'SYSTEM READY — LAUNCHING DUAL INTERFACE';
    bootProgress.style.width = '100%';

    AudioEngine.playBootComplete();

    // Initialize webcam and gesture engine
    try {
      const video = document.getElementById('input-video');
      const webcamPreview = document.getElementById('webcam');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      video.srcObject = stream;
      webcamPreview.srcObject = stream;
      await video.play();

      // Initialize dual-hand gesture engine
      await GestureEngine.init(video);

      addLogLine({ text: 'DUAL WEBCAM STREAM ACTIVE — 2 HANDS ENGAGED', type: 'ok' });
    } catch (err) {
      console.warn('[BOOT] Webcam access denied or unavailable:', err);
      addLogLine({ text: 'WEBCAM UNAVAILABLE — KEYBOARD/MOUSE FALLBACK MODE', type: 'warn' });
      enableMouseFallback();
    }

    // Transition to main UI
    setTimeout(() => {
      bootOverlay.classList.add('fade-out');
      setTimeout(() => {
        bootOverlay.classList.add('hidden');
        uiOverlay.classList.remove('hidden');
        startSketch();
        AudioEngine.init();
      }, 700);
    }, 800);
  }

  function enableMouseFallback() {
    let mouseXNorm = 0.5;
    let mouseYNorm = 0.5;
    let currentFallbackGesture = 'HEART';

    const testPoses = ['HEART', 'PUPPET', 'FIST', 'POINT', 'PEACE', 'HORNS', 'THUMBS_UP', 'GUN', 'ENERGY_CLASH'];
    let poseIndex = 0;

    document.addEventListener('mousemove', (e) => {
      mouseXNorm = e.clientX / window.innerWidth;
      mouseYNorm = e.clientY / window.innerHeight;
    });

    // Keys 1-9 to quickly test gestures
    document.addEventListener('keydown', (e) => {
      const keyMap = {
        '1': 'HEART',
        '2': 'PUPPET',
        '3': 'HORNS',
        '4': 'POINT',
        '5': 'FIST',
        '6': 'PALM',
        '7': 'PEACE',
        '8': 'ENERGY_CLASH',
        '9': 'THUMBS_UP',
      };
      if (keyMap[e.key]) {
        currentFallbackGesture = keyMap[e.key];
        if (typeof HoloCompanion !== 'undefined') {
          HoloCompanion.reactToGesture(currentFallbackGesture);
        }
      }
    });

    // Provide simulated dual hands
    GestureEngine.getHands = () => {
      const isMulti = ['HEART', 'ENERGY_CLASH', 'FUSION_SHIELD', 'DUAL_HORNS'].includes(currentFallbackGesture);
      if (isMulti) {
        return [
          { index: 0, handedness: 'Left', smoothX: mouseXNorm - 0.08, smoothY: mouseYNorm, gesture: currentFallbackGesture, puppetMouth: 0.5 },
          { index: 1, handedness: 'Right', smoothX: mouseXNorm + 0.08, smoothY: mouseYNorm, gesture: currentFallbackGesture, puppetMouth: 0.5 }
        ];
      }
      return [
        { index: 0, handedness: 'Right', smoothX: mouseXNorm, smoothY: mouseYNorm, gesture: currentFallbackGesture, puppetMouth: 0.6 }
      ];
    };
    GestureEngine.getMultiHandGesture = () => {
      return ['HEART', 'ENERGY_CLASH', 'FUSION_SHIELD', 'DUAL_HORNS'].includes(currentFallbackGesture) ? currentFallbackGesture : 'NONE';
    };
    GestureEngine.getCurrentGesture = () => currentFallbackGesture;
    GestureEngine.isHandDetected = () => true;
  }

  // --- UI Button Handlers ---
  function setupUIHandlers() {
    // Toggle camera preview
    const btnCam = document.getElementById('btn-toggle-cam');
    const camPreview = document.getElementById('cam-preview');
    if (btnCam && camPreview) {
      btnCam.addEventListener('click', () => {
        camPreview.classList.toggle('cam-active');
        btnCam.classList.toggle('active');
      });
    }

    // Toggle AI companion
    const btnComp = document.getElementById('btn-toggle-companion');
    if (btnComp) {
      btnComp.addEventListener('click', () => {
        const comp = document.getElementById('ai-companion');
        if (comp) {
          comp.classList.toggle('hidden');
          btnComp.classList.toggle('active', !comp.classList.contains('hidden'));
        }
      });
    }

    // Toggle sound
    const btnSound = document.getElementById('btn-toggle-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const isOn = AudioEngine.toggle();
        btnSound.classList.toggle('active', !isOn);
        btnSound.querySelector('span').textContent = isOn ? '♫' : '♪';
      });
    }

    // Gesture guide modal
    const btnHelp = document.getElementById('btn-help');
    const guideModal = document.getElementById('gesture-guide');
    const closeGuide = document.getElementById('close-guide');
    if (btnHelp && guideModal) {
      btnHelp.addEventListener('click', () => {
        guideModal.classList.toggle('hidden');
      });
    }
    if (closeGuide && guideModal) {
      closeGuide.addEventListener('click', () => {
        guideModal.classList.add('hidden');
      });
    }
    if (guideModal) {
      guideModal.addEventListener('click', (e) => {
        if (e.target === guideModal) {
          guideModal.classList.add('hidden');
        }
      });
    }
  }

  // Wait for DOM and initial click
  document.addEventListener('DOMContentLoaded', () => {
    setupUIHandlers();

    const startBoot = () => {
      AudioEngine.init();
      setTimeout(nextLine, 400);
      document.removeEventListener('click', startBoot);
      document.removeEventListener('keydown', startBoot);
    };

    bootStatus.textContent = 'CLICK ANYWHERE TO INITIALIZE';
    bootStatus.style.cursor = 'pointer';

    document.addEventListener('click', startBoot);
    document.addEventListener('keydown', startBoot);
  });
})();
