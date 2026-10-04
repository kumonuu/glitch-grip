/* ============================================
   GLITCH GRIP — Advanced Gesture Recognition
   MediaPipe Hands dual-hand tracking engine with
   single-hand and multi-hand classification,
   including Love Heart, Hand Puppet, and more.
   ============================================ */

const GestureEngine = (() => {
  let hands = null;
  let camera = null;
  let currentResults = null;
  let onGestureCallback = null;
  let initialized = false;
  let handDetected = false;

  // Tracked hands data (up to 2 hands)
  let trackedHands = [];
  let primaryGesture = 'NONE';
  let multiHandGesture = 'NONE';
  let lastReportedGesture = 'NONE';
  let gestureStartTime = 0;

  // Puppet talking state tracker
  let lastPuppetMouthDist = 0;
  let puppetTalkingSpeed = 0;

  // Smoothing factors
  const smoothFactor = 0.35;

  // Landmark indices
  const WRIST = 0;
  const THUMB_CMC = 1;
  const THUMB_MCP = 2;
  const THUMB_IP = 3;
  const THUMB_TIP = 4;
  const INDEX_MCP = 5;
  const INDEX_PIP = 6;
  const INDEX_DIP = 7;
  const INDEX_TIP = 8;
  const MIDDLE_MCP = 9;
  const MIDDLE_PIP = 10;
  const MIDDLE_DIP = 11;
  const MIDDLE_TIP = 12;
  const RING_MCP = 13;
  const RING_PIP = 14;
  const RING_DIP = 15;
  const RING_TIP = 16;
  const PINKY_MCP = 17;
  const PINKY_PIP = 18;
  const PINKY_DIP = 19;
  const PINKY_TIP = 20;

  async function init(videoElement) {
    if (initialized) return;

    hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
    });

    // Configure for 2 hands simultaneously
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.55,
    });

    hands.onResults(onResults);

    camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });

    await camera.start();
    initialized = true;
    console.log('[GESTURE] MediaPipe Dual-Hand Engine initialized');
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function dist3D(a, b) {
    if (!a || !b) return 999;
    return Math.sqrt(
      (a.x - b.x) ** 2 +
      (a.y - b.y) ** 2 +
      ((a.z || 0) - (b.z || 0)) ** 2
    );
  }

  function dist2D(a, b) {
    if (!a || !b) return 999;
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  function isFingerExtended(lm, tip, pip, mcp) {
    const tipDist = dist3D(lm[tip], lm[WRIST]);
    const pipDist = dist3D(lm[pip], lm[WRIST]);
    const mcpDist = dist3D(lm[mcp], lm[WRIST]);
    // Tip should be further from wrist than PIP and MCP
    return tipDist > pipDist * 1.06 && tipDist > mcpDist * 1.15;
  }

  function isFingerCurled(lm, tip, pip, mcp) {
    const tipDist = dist3D(lm[tip], lm[WRIST]);
    const pipDist = dist3D(lm[pip], lm[WRIST]);
    return tipDist <= pipDist * 1.02;
  }

  function isThumbExtended(lm) {
    const d = dist3D(lm[THUMB_TIP], lm[INDEX_MCP]);
    return d > 0.11;
  }

  // Classify a single hand's pose
  function classifySingleHand(lm) {
    const indexExt = isFingerExtended(lm, INDEX_TIP, INDEX_PIP, INDEX_MCP);
    const middleExt = isFingerExtended(lm, MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP);
    const ringExt = isFingerExtended(lm, RING_TIP, RING_PIP, RING_MCP);
    const pinkyExt = isFingerExtended(lm, PINKY_TIP, PINKY_PIP, PINKY_MCP);
    const thumbExt = isThumbExtended(lm);

    const indexCurled = isFingerCurled(lm, INDEX_TIP, INDEX_PIP, INDEX_MCP);
    const middleCurled = isFingerCurled(lm, MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP);
    const ringCurled = isFingerCurled(lm, RING_TIP, RING_PIP, RING_MCP);
    const pinkyCurled = isFingerCurled(lm, PINKY_TIP, PINKY_PIP, PINKY_MCP);

    const pinchDist = dist3D(lm[THUMB_TIP], lm[INDEX_TIP]);
    const okMiddleDist = dist3D(lm[THUMB_TIP], lm[MIDDLE_TIP]);

    // 1. OK SIGN: Thumb and index touching, but middle, ring, pinky clearly extended
    if (pinchDist < 0.075 && middleExt && ringExt && pinkyExt) {
      return { gesture: 'OK', puppetMouth: 0 };
    }

    // 2. PINCH: Thumb and index touching, other fingers curled
    if (pinchDist < 0.065 && !middleExt && !ringExt && !pinkyExt) {
      return { gesture: 'PINCH', puppetMouth: 0 };
    }

    // 3. HAND PUPPET (Talking hand / Beak):
    // Index, middle, ring, pinky held close together pointing forward/outward,
    // while thumb is below them opening/closing.
    const fingerTipsCluster = (
      dist3D(lm[INDEX_TIP], lm[MIDDLE_TIP]) < 0.08 &&
      dist3D(lm[MIDDLE_TIP], lm[RING_TIP]) < 0.08
    );
    const fingerPipsCluster = (
      dist3D(lm[INDEX_PIP], lm[MIDDLE_PIP]) < 0.08 &&
      dist3D(lm[MIDDLE_PIP], lm[RING_PIP]) < 0.08
    );
    const mouthDist = dist3D(lm[THUMB_TIP], lm[INDEX_TIP]);
    const fingersFlat = (indexExt || lm[INDEX_TIP].y < lm[INDEX_PIP].y + 0.05) &&
                        (middleExt || lm[MIDDLE_TIP].y < lm[MIDDLE_PIP].y + 0.05);

    if (fingerTipsCluster && fingerPipsCluster && fingersFlat) {
      // Check if thumb is below the fingers (greater Y or inward)
      const mouthRatio = Math.min(Math.max((mouthDist - 0.03) / 0.12, 0), 1);
      return { gesture: 'PUPPET', puppetMouth: mouthRatio };
    }

    // 4. THUMBS UP & THUMBS DOWN:
    // Fingers 2-5 are curled tight.
    if (indexCurled && middleCurled && ringCurled && pinkyCurled) {
      const thumbWristDy = lm[THUMB_TIP].y - lm[WRIST].y;
      const thumbMcpDy = lm[THUMB_TIP].y - lm[THUMB_MCP].y;

      // Thumbs Up: thumb points distinctly upward (Y is smaller than wrist)
      if (thumbWristDy < -0.12 && thumbMcpDy < -0.06) {
        return { gesture: 'THUMBS_UP', puppetMouth: 0 };
      }
      // Thumbs Down: thumb points distinctly downward (Y is larger than wrist)
      if (thumbWristDy > 0.08 && thumbMcpDy > 0.04) {
        return { gesture: 'THUMBS_DOWN', puppetMouth: 0 };
      }
      // Fist — all curled including thumb
      if (!thumbExt || (Math.abs(thumbWristDy) < 0.1 && dist3D(lm[THUMB_TIP], lm[MIDDLE_MCP]) < 0.12)) {
        return { gesture: 'FIST', puppetMouth: 0 };
      }
    }

    // 5. FINGER GUN: Index extended forward, thumb up, others curled
    if (indexExt && thumbExt && middleCurled && ringCurled && pinkyCurled) {
      const thumbIndexAngle = dist3D(lm[THUMB_TIP], lm[INDEX_TIP]);
      if (thumbIndexAngle > 0.10) {
        return { gesture: 'GUN', puppetMouth: 0 };
      }
    }

    // 6. HORNS (Rock On): Index and pinky extended, middle and ring curled
    if (indexExt && !middleExt && !ringExt && pinkyExt) {
      return { gesture: 'HORNS', puppetMouth: 0 };
    }

    // 7. PEACE: Index and middle extended, ring and pinky curled
    if (indexExt && middleExt && !ringExt && !pinkyExt) {
      return { gesture: 'PEACE', puppetMouth: 0 };
    }

    // 8. POINT: Only index extended
    if (indexExt && !middleExt && !ringExt && !pinkyExt) {
      return { gesture: 'POINT', puppetMouth: 0 };
    }

    // 9. PALM: All 4 main fingers extended
    if (indexExt && middleExt && ringExt && pinkyExt) {
      return { gesture: 'PALM', puppetMouth: 0 };
    }

    return { gesture: 'NONE', puppetMouth: 0 };
  }

  // Check for multi-hand gestures when 2 hands are detected
  function classifyMultiHand(handA, handB) {
    const lmA = handA.landmarks;
    const lmB = handB.landmarks;

    // Distances between key points on Hand A and Hand B
    const indexTipDist = dist2D(lmA[INDEX_TIP], lmB[INDEX_TIP]);
    const thumbTipDist = dist2D(lmA[THUMB_TIP], lmB[THUMB_TIP]);
    const wristDist = dist2D(lmA[WRIST], lmB[WRIST]);
    const palmDist = dist2D(
      { x: handA.rawX, y: handA.rawY },
      { x: handB.rawX, y: handB.rawY }
    );

    // Center point between the two hands
    const centerX = (handA.rawX + handB.rawX) / 2;
    const centerY = (handA.rawY + handB.rawY) / 2;

    // 1. LOVE HEART GESTURE:
    // - Index tips are touching or close together (< 0.18)
    // - Thumb tips are touching or close together (< 0.18)
    // - Index tips are higher than thumb tips (smaller Y)
    // - Wrists are farther apart than the thumb tips
    const indexAvgY = (lmA[INDEX_TIP].y + lmB[INDEX_TIP].y) / 2;
    const thumbAvgY = (lmA[THUMB_TIP].y + lmB[THUMB_TIP].y) / 2;

    if (
      indexTipDist < 0.18 &&
      thumbTipDist < 0.18 &&
      indexAvgY < thumbAvgY + 0.04 &&
      wristDist > thumbTipDist * 1.3
    ) {
      return {
        gesture: 'HEART',
        center: { x: centerX, y: centerY },
        span: Math.max(palmDist, 0.2),
      };
    }

    // 2. ENERGY CLASH (Two hands pushing/facing each other):
    // Two palms facing each other closely, or both blasting towards the center
    const bothPalms = (handA.gesture === 'PALM' || handA.gesture === 'POINT') &&
                      (handB.gesture === 'PALM' || handB.gesture === 'POINT');
    if (bothPalms && palmDist < 0.38) {
      return {
        gesture: 'ENERGY_CLASH',
        center: { x: centerX, y: centerY },
        span: palmDist,
      };
    }

    // 3. FUSION SHIELD (Two open palms held up together side by side)
    if (handA.gesture === 'PALM' && handB.gesture === 'PALM' && palmDist >= 0.38 && palmDist < 0.75) {
      return {
        gesture: 'FUSION_SHIELD',
        center: { x: centerX, y: centerY },
        span: palmDist,
      };
    }

    // 4. DUAL HORNS (Both hands throwing rock horns)
    if (handA.gesture === 'HORNS' && handB.gesture === 'HORNS') {
      return {
        gesture: 'DUAL_HORNS',
        center: { x: centerX, y: centerY },
        span: palmDist,
      };
    }

    // 5. DUAL PORTALS (Both hands pinching or rift portals)
    if (handA.gesture === 'PINCH' && handB.gesture === 'PINCH') {
      return {
        gesture: 'DUAL_PORTALS',
        center: { x: centerX, y: centerY },
        span: palmDist,
      };
    }

    // 6. DUAL BLAST (Both hands pointing or gun)
    if (
      (handA.gesture === 'POINT' || handA.gesture === 'GUN') &&
      (handB.gesture === 'POINT' || handB.gesture === 'GUN')
    ) {
      return {
        gesture: 'DUAL_BLAST',
        center: { x: centerX, y: centerY },
        span: palmDist,
      };
    }

    return null;
  }

  function onResults(results) {
    currentResults = results;
    const numHands = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
    handDetected = numHands > 0;

    if (handDetected) {
      const newTracked = [];

      for (let i = 0; i < numHands; i++) {
        const lm = results.multiHandLandmarks[i];
        const handedness = (results.multiHandedness && results.multiHandedness[i])
          ? results.multiHandedness[i].label
          : (i === 0 ? 'Right' : 'Left');

        // Mirrored coordinate for natural screen interaction
        const rawX = 1 - lm[WRIST].x;
        const rawY = lm[WRIST].y;

        // Smooth position
        let prev = trackedHands[i];
        let smoothX = prev ? lerp(prev.smoothX, rawX, smoothFactor) : rawX;
        let smoothY = prev ? lerp(prev.smoothY, rawY, smoothFactor) : rawY;

        const classification = classifySingleHand(lm);

        newTracked.push({
          index: i,
          handedness,
          landmarks: lm,
          rawX,
          rawY,
          smoothX,
          smoothY,
          gesture: classification.gesture,
          puppetMouth: classification.puppetMouth || 0,
        });
      }

      trackedHands = newTracked;

      // Check multi-hand gesture if 2 hands present
      if (trackedHands.length >= 2) {
        const multi = classifyMultiHand(trackedHands[0], trackedHands[1]);
        if (multi) {
          multiHandGesture = multi.gesture;
          primaryGesture = multi.gesture;
        } else {
          multiHandGesture = 'NONE';
          // If no combined gesture, primary is Hand 0's gesture or combo
          primaryGesture = trackedHands[0].gesture !== 'NONE'
            ? trackedHands[0].gesture
            : trackedHands[1].gesture;
        }
      } else {
        multiHandGesture = 'NONE';
        primaryGesture = trackedHands[0].gesture;
      }

      if (primaryGesture !== lastReportedGesture) {
        lastReportedGesture = primaryGesture;
        gestureStartTime = Date.now();
        if (onGestureCallback) onGestureCallback(primaryGesture, trackedHands);
      }
    } else {
      trackedHands = [];
      multiHandGesture = 'NONE';
      if (lastReportedGesture !== 'NONE') {
        lastReportedGesture = 'NONE';
        primaryGesture = 'NONE';
        if (onGestureCallback) onGestureCallback('NONE', []);
      }
    }
  }

  function onGesture(cb) {
    onGestureCallback = cb;
  }

  // Primary hand position for single-hand fallback
  function getHandPosition() {
    if (trackedHands.length > 0) {
      return { x: trackedHands[0].smoothX, y: trackedHands[0].smoothY };
    }
    return { x: 0.5, y: 0.5 };
  }

  // All tracked hands
  function getHands() {
    return trackedHands;
  }

  function getLandmarks(handIdx = 0) {
    if (!trackedHands[handIdx]) return null;
    return trackedHands[handIdx].landmarks;
  }

  function isHandDetected() {
    return handDetected;
  }

  function getCurrentGesture() {
    return primaryGesture;
  }

  function getMultiHandGesture() {
    return multiHandGesture;
  }

  function getGestureDuration() {
    return Date.now() - gestureStartTime;
  }

  // Draw hand skeleton overlay on webcam preview canvas
  function drawHandOverlay(canvasEl) {
    const ctx = canvasEl.getContext('2d');
    canvasEl.width = canvasEl.offsetWidth;
    canvasEl.height = canvasEl.offsetHeight;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    if (trackedHands.length === 0) return;

    const w = canvasEl.width;
    const h = canvasEl.height;

    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];

    // Color palette per hand
    const handThemes = [
      { stroke: '#00f0ffaa', dot: '#00f0ff', tip: '#ff00aa', glow: '#00f0ff44' }, // Hand 1 (Cyan)
      { stroke: '#ff00aaaa', dot: '#ff00aa', tip: '#ffe600', glow: '#ff00aa44' }, // Hand 2 (Magenta)
    ];

    for (let hi = 0; hi < trackedHands.length; hi++) {
      const hand = trackedHands[hi];
      const lm = hand.landmarks;
      const theme = handThemes[hi % handThemes.length];

      // Connections
      ctx.strokeStyle = theme.stroke;
      ctx.lineWidth = 1.8;
      for (const [a, b] of connections) {
        ctx.beginPath();
        ctx.moveTo(lm[a].x * w, lm[a].y * h);
        ctx.lineTo(lm[b].x * w, lm[b].y * h);
        ctx.stroke();
      }

      // Landmark Dots
      for (let i = 0; i < lm.length; i++) {
        const x = lm[i].x * w;
        const y = lm[i].y * h;
        const isTip = [4, 8, 12, 16, 20].includes(i);

        ctx.beginPath();
        ctx.arc(x, y, isTip ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isTip ? theme.tip : theme.dot;
        ctx.fill();

        if (isTip) {
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.strokeStyle = theme.glow;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Hand label badge
      const wristX = lm[0].x * w;
      const wristY = lm[0].y * h;
      ctx.font = '9px "Share Tech Mono", monospace';
      ctx.fillStyle = theme.dot;
      ctx.fillText(`H${hi + 1}: ${hand.gesture}`, wristX - 20, wristY + 16);
    }

    // Draw connection between hands if Love Heart is detected
    if (multiHandGesture === 'HEART' && trackedHands.length >= 2) {
      const lmA = trackedHands[0].landmarks;
      const lmB = trackedHands[1].landmarks;

      const midIndexX = ((lmA[8].x + lmB[8].x) / 2) * w;
      const midIndexY = ((lmA[8].y + lmB[8].y) / 2) * h;
      const midThumbX = ((lmA[4].x + lmB[4].x) / 2) * w;
      const midThumbY = ((lmA[4].y + lmB[4].y) / 2) * h;

      ctx.save();
      ctx.strokeStyle = '#ff00aa';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ff00aa';
      ctx.shadowBlur = 10;

      // Glowing heart symbol
      ctx.beginPath();
      const hx = (midIndexX + midThumbX) / 2;
      const hy = (midIndexY + midThumbY) / 2;
      const r = 18;
      ctx.moveTo(hx, hy + r * 0.4);
      ctx.bezierCurveTo(hx - r, hy - r * 0.5, hx - r, hy - r * 1.2, hx, hy - r * 0.6);
      ctx.bezierCurveTo(hx + r, hy - r * 1.2, hx + r, hy - r * 0.5, hx, hy + r * 0.4);
      ctx.fillStyle = '#ff00aa55';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  return {
    init,
    onGesture,
    getHandPosition,
    getHands,
    getLandmarks,
    isHandDetected,
    getCurrentGesture,
    getMultiHandGesture,
    getGestureDuration,
    drawHandOverlay,
  };
})();
