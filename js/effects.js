/* ============================================
   GLITCH GRIP — Visual Effects Layer
   Post-processing effects including glitch,
   scan lines, energy rings, Love Heart matrices,
   plasma arcs, puppet chatter FX, and distortion.
   ============================================ */

const EffectsEngine = (() => {
  // Glitch state
  let glitchIntensity = 0;
  let glitchTargetIntensity = 0;

  // Single-hand effect arrays
  let shockwaves = [];
  let beams = [];
  let portals = [];
  let shields = [];
  let gravityWells = [];

  // Multi-hand & expressive effect arrays
  let hearts = [];
  let clashBeams = [];
  let fusionShields = [];
  let puppetEffects = [];
  let badges = [];

  // Global screen flash
  let flashAlpha = 0;
  let flashHue = 180;

  // Reactive background grid
  let gridOffset = 0;

  function triggerGlitch(intensity = 1) {
    glitchTargetIntensity = intensity;
  }

  function addShockwave(x, y) {
    shockwaves.push({ x, y, radius: 0, maxRadius: 500, alpha: 255, speed: 12 });
  }

  function addBeam(x, y, dirX, dirY) {
    beams.push({
      x, y, dirX, dirY,
      length: 0,
      maxLength: 800,
      alpha: 255,
      life: 20,
    });
  }

  function addPortal(x, y) {
    portals.push({
      x, y,
      radius: 0,
      maxRadius: 80,
      rotation: 0,
      life: 120,
      maxLife: 120,
    });
  }

  function addShield(x, y) {
    shields.push({
      x, y,
      radius: 20,
      maxRadius: 140,
      alpha: 200,
      life: 30,
    });
  }

  function addGravityWell(x, y) {
    gravityWells.push({
      x, y,
      radius: 5,
      maxRadius: 60,
      rotation: 0,
      life: 40,
    });
  }

  // --- NEW EFFECTS ---

  // Love Heart holographic pulse
  function addHeartEffect(x, y) {
    hearts.push({
      x, y,
      size: 15,
      maxSize: 180,
      alpha: 255,
      rotation: 0,
      life: 50,
      maxLife: 50,
    });
  }

  // Energy Clash arc between two hands
  function addClashBeam(x1, y1, x2, y2) {
    clashBeams.push({
      x1, y1, x2, y2,
      midX: (x1 + x2) / 2,
      midY: (y1 + y2) / 2,
      life: 18,
      maxLife: 18,
      radius: random(20, 50),
    });
  }

  // Fusion Shield Matrix across two hands
  function addFusionShield(x1, y1, x2, y2) {
    fusionShields.push({
      x1, y1, x2, y2,
      cx: (x1 + x2) / 2,
      cy: (y1 + y2) / 2,
      dist: Math.hypot(x2 - x1, y2 - y1),
      life: 35,
      maxLife: 35,
    });
  }

  // Puppet chatter waves
  function addPuppetFX(x, y, mouthRatio = 0.5) {
    puppetEffects.push({
      x, y,
      mouthRatio,
      life: 25,
      maxLife: 25,
      scale: 1 + mouthRatio * 0.8,
    });
  }

  // Holographic approval / disapproval badge
  function addBadgeFX(x, y, type = 'UP') {
    badges.push({
      x, y,
      type,
      scale: 0.2,
      maxScale: 1.2,
      alpha: 255,
      life: 45,
    });
  }

  function triggerFlash(hue = 180) {
    flashAlpha = 60;
    flashHue = hue;
  }

  function update() {
    // Ease glitch intensity
    glitchIntensity = lerp(glitchIntensity, glitchTargetIntensity, 0.2);
    glitchTargetIntensity *= 0.9;

    // Shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const s = shockwaves[i];
      s.radius += s.speed;
      s.alpha = map(s.radius, 0, s.maxRadius, 255, 0);
      s.speed *= 0.98;
      if (s.radius > s.maxRadius) shockwaves.splice(i, 1);
    }

    // Beams
    for (let i = beams.length - 1; i >= 0; i--) {
      const b = beams[i];
      b.length = min(b.length + 60, b.maxLength);
      b.life--;
      b.alpha = map(b.life, 0, 20, 0, 255);
      if (b.life <= 0) beams.splice(i, 1);
    }

    // Portals
    for (let i = portals.length - 1; i >= 0; i--) {
      const p = portals[i];
      p.radius = lerp(p.radius, p.maxRadius, 0.1);
      p.rotation += 0.05;
      p.life--;
      if (p.life <= 0) portals.splice(i, 1);
    }

    // Shields
    for (let i = shields.length - 1; i >= 0; i--) {
      const s = shields[i];
      s.radius = lerp(s.radius, s.maxRadius, 0.15);
      s.alpha *= 0.92;
      s.life--;
      if (s.life <= 0) shields.splice(i, 1);
    }

    // Gravity wells
    for (let i = gravityWells.length - 1; i >= 0; i--) {
      const g = gravityWells[i];
      g.radius = lerp(g.radius, g.maxRadius, 0.08);
      g.rotation += 0.03;
      g.life--;
      if (g.life <= 0) gravityWells.splice(i, 1);
    }

    // Hearts
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i];
      h.size = lerp(h.size, h.maxSize, 0.12);
      h.life--;
      h.alpha = map(h.life, 0, h.maxLife, 0, 255);
      if (h.life <= 0) hearts.splice(i, 1);
    }

    // Clash Beams
    for (let i = clashBeams.length - 1; i >= 0; i--) {
      const cb = clashBeams[i];
      cb.life--;
      if (cb.life <= 0) clashBeams.splice(i, 1);
    }

    // Fusion Shields
    for (let i = fusionShields.length - 1; i >= 0; i--) {
      const fs = fusionShields[i];
      fs.life--;
      if (fs.life <= 0) fusionShields.splice(i, 1);
    }

    // Puppet FX
    for (let i = puppetEffects.length - 1; i >= 0; i--) {
      const p = puppetEffects[i];
      p.life--;
      if (p.life <= 0) puppetEffects.splice(i, 1);
    }

    // Badges
    for (let i = badges.length - 1; i >= 0; i--) {
      const b = badges[i];
      b.scale = lerp(b.scale, b.maxScale, 0.15);
      b.life--;
      b.alpha = map(b.life, 0, 45, 0, 255);
      if (b.life <= 0) badges.splice(i, 1);
    }

    // Flash decay
    flashAlpha *= 0.9;

    // Grid drift
    gridOffset += 0.5;
  }

  function drawBackground(pg) {
    pg.stroke(180, 60, 30, 25);
    pg.strokeWeight(0.5);

    const spacing = 50;
    const ox = gridOffset % spacing;
    for (let x = -spacing + ox; x < pg.width + spacing; x += spacing) {
      pg.line(x, 0, x, pg.height);
    }
    for (let y = -spacing + ox; y < pg.height + spacing; y += spacing) {
      pg.line(0, y, pg.width, y);
    }

    pg.noStroke();
    pg.fill(240, 50, 2, 30);
    pg.rect(0, 0, pg.width, pg.height);

    pg.stroke(0, 0, 0, 10);
    pg.strokeWeight(1);
    for (let y = 0; y < pg.height; y += 6) {
      pg.line(0, y, pg.width, y);
    }
  }

  function drawEffects() {
    // Shockwaves
    for (const s of shockwaves) {
      noFill();
      for (let i = 0; i < 3; i++) {
        const r = s.radius - i * 8;
        if (r <= 0) continue;
        stroke(20, 100, 100, s.alpha * (1 - i * 0.3));
        strokeWeight(3 - i);
        ellipse(s.x, s.y, r * 2, r * 2);
      }
    }

    // Energy beams
    for (const b of beams) {
      const endX = b.x + b.dirX * b.length;
      const endY = b.y + b.dirY * b.length;

      stroke(185, 80, 100, b.alpha * 0.3);
      strokeWeight(12);
      line(b.x, b.y, endX, endY);

      stroke(185, 60, 100, b.alpha);
      strokeWeight(3);
      line(b.x, b.y, endX, endY);

      stroke(0, 0, 100, b.alpha * 0.8);
      strokeWeight(1);
      line(b.x, b.y, endX, endY);
    }

    // Portals
    for (const p of portals) {
      const alpha = map(p.life, 0, p.maxLife, 0, 255);
      push();
      translate(p.x, p.y);
      rotate(p.rotation);
      noFill();
      for (let i = 0; i < 5; i++) {
        const r = p.radius * (1 - i * 0.15);
        stroke(280 + i * 10, 80, 100, alpha * (1 - i * 0.2));
        strokeWeight(2 - i * 0.3);
        ellipse(0, 0, r * 2, r * 1.5);
      }
      stroke(300, 90, 100, alpha * 0.5);
      strokeWeight(1);
      noFill();
      beginShape();
      for (let a = 0; a < TWO_PI * 3; a += 0.1) {
        const sr = (a / (TWO_PI * 3)) * p.radius * 0.8;
        vertex(cos(a + p.rotation * 2) * sr, sin(a + p.rotation * 2) * sr);
      }
      endShape();
      pop();
    }

    // Shields
    for (const s of shields) {
      push();
      translate(s.x, s.y);
      noFill();
      for (let i = 0; i < 6; i++) {
        const angle = (TWO_PI / 6) * i + frameCount * 0.02;
        const x1 = cos(angle) * s.radius;
        const y1 = sin(angle) * s.radius;
        const x2 = cos(angle + TWO_PI / 6) * s.radius;
        const y2 = sin(angle + TWO_PI / 6) * s.radius;
        stroke(50, 90, 100, s.alpha);
        strokeWeight(2);
        line(x1, y1, x2, y2);
      }
      stroke(50, 80, 100, s.alpha * 0.4);
      strokeWeight(6);
      ellipse(0, 0, s.radius * 2, s.radius * 2);
      stroke(50, 60, 100, s.alpha * 0.7);
      strokeWeight(1.5);
      ellipse(0, 0, s.radius * 2, s.radius * 2);
      pop();
    }

    // Gravity wells
    for (const g of gravityWells) {
      push();
      translate(g.x, g.y);
      const alpha = map(g.life, 0, 40, 0, 255);
      noFill();
      for (let i = 0; i < 8; i++) {
        const r = g.radius * (1 + i * 0.3);
        const a = alpha * (1 - i * 0.12);
        stroke(310, 80, 100, a * 0.4);
        strokeWeight(1);
        rotate(g.rotation + i * 0.1);
        ellipse(0, 0, r * 2, r * 1.8);
      }
      fill(0, 0, 0, alpha * 0.6);
      noStroke();
      ellipse(0, 0, g.radius, g.radius);
      noFill();
      stroke(310, 100, 100, alpha);
      strokeWeight(2);
      ellipse(0, 0, g.radius * 1.2, g.radius * 1.2);
      pop();
    }

    // --- LOVE HEART EFFECTS ---
    for (const h of hearts) {
      push();
      translate(h.x, h.y);
      noFill();

      // Outer glowing parametric heart
      for (let i = 0; i < 4; i++) {
        const hs = (h.size - i * 18);
        if (hs <= 0) continue;
        stroke(330, 90, 100, h.alpha * (1 - i * 0.22));
        strokeWeight(3.5 - i * 0.8);
        drawParametricHeartDirect(hs);
      }

      // Center glowing heart core
      fill(335, 100, 100, h.alpha * 0.35);
      noStroke();
      drawParametricHeartDirect(h.size * 0.4);

      // Cyber scanlines through heart
      stroke(320, 80, 100, h.alpha * 0.4);
      strokeWeight(1);
      const span = h.size * 0.8;
      for (let y = -span; y <= span; y += 12) {
        line(-span, y, span, y);
      }

      pop();
    }

    // --- ENERGY CLASH ARC ---
    for (const cb of clashBeams) {
      const alpha = map(cb.life, 0, cb.maxLife, 0, 255);
      push();
      // Midpoint plasma singularity
      noFill();
      stroke(185, 90, 100, alpha);
      strokeWeight(3);
      ellipse(cb.midX, cb.midY, cb.radius * 2, cb.radius * 2);
      stroke(310, 90, 100, alpha * 0.6);
      strokeWeight(6);
      ellipse(cb.midX, cb.midY, cb.radius * 1.4, cb.radius * 1.4);

      // Jagged lightning segments
      const segs = 8;
      stroke(0, 0, 100, alpha);
      strokeWeight(2.5);
      let curX = cb.x1, curY = cb.y1;
      for (let s = 1; s <= segs; s++) {
        const targetX = lerp(cb.x1, cb.x2, s / segs);
        const targetY = lerp(cb.y1, cb.y2, s / segs);
        const nxtX = targetX + (s < segs ? random(-25, 25) : 0);
        const nxtY = targetY + (s < segs ? random(-25, 25) : 0);
        line(curX, curY, nxtX, nxtY);
        curX = nxtX;
        curY = nxtY;
      }
      pop();
    }

    // --- FUSION SHIELD MATRIX ---
    for (const fs of fusionShields) {
      const alpha = map(fs.life, 0, fs.maxLife, 0, 255);
      push();
      translate(fs.cx, fs.cy);
      noFill();
      // Honeycomb lattice
      const rad = fs.dist * 0.7;
      stroke(180, 80, 100, alpha * 0.5);
      strokeWeight(2);
      rectMode(CENTER);
      ellipse(0, 0, rad * 2, rad * 1.6);

      // Hexagonal rings
      for (let i = 0; i < 6; i++) {
        const a = (TWO_PI / 6) * i + frameCount * 0.01;
        const hx = cos(a) * (rad * 0.6);
        const hy = sin(a) * (rad * 0.5);
        stroke(190, 90, 100, alpha * 0.7);
        strokeWeight(1.5);
        drawHexagon(hx, hy, rad * 0.35);
      }
      pop();
    }

    // --- PUPPET CHATTER FX ---
    for (const p of puppetEffects) {
      const alpha = map(p.life, 0, p.maxLife, 0, 255);
      push();
      translate(p.x, p.y);
      noFill();

      // Cyber Puppet Eyes above hand
      stroke(50, 100, 100, alpha);
      strokeWeight(2.5);
      ellipse(-18, -35, 14, 14);
      ellipse(18, -35, 14, 14);
      fill(180, 100, 100, alpha);
      ellipse(-18 + sin(frameCount * 0.2) * 2, -35, 6, 6);
      ellipse(18 + sin(frameCount * 0.2) * 2, -35, 6, 6);

      // Chatter Soundwave Arcs radiating from beak
      noFill();
      const openGap = p.mouthRatio * 30;
      stroke(180, 90, 100, alpha * 0.8);
      strokeWeight(2);
      arc(25, -10 - openGap * 0.5, 30, 20, -PI / 4, PI / 4);
      arc(35, -10 - openGap * 0.5, 45, 30, -PI / 4, PI / 4);
      pop();
    }

    // --- BADGES (Thumbs Up/Down / OK) ---
    for (const b of badges) {
      push();
      translate(b.x, b.y);
      scale(b.scale);
      noStroke();
      const isUp = b.type === 'UP';
      fill(isUp ? 130 : 0, 90, 100, b.alpha * 0.3);
      ellipse(0, 0, 70, 70);
      stroke(isUp ? 130 : 0, 100, 100, b.alpha);
      strokeWeight(2.5);
      noFill();
      ellipse(0, 0, 70, 70);

      // Icon
      fill(isUp ? 130 : 0, 100, 100, b.alpha);
      noStroke();
      textFont('Orbitron');
      textSize(28);
      textAlign(CENTER, CENTER);
      text(isUp ? '👍' : '👎', 0, 0);
      pop();
    }

    // Glitch effect
    if (glitchIntensity > 0.05) {
      drawGlitchEffect(glitchIntensity);
    }

    // Screen flash
    if (flashAlpha > 1) {
      noStroke();
      fill(flashHue, 50, 100, flashAlpha);
      rect(0, 0, width, height);
    }
  }

  // Direct parametric heart drawer for effects layer
  function drawParametricHeartDirect(s) {
    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.2) {
      const x = 16 * Math.pow(Math.sin(a), 3);
      const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
      vertex(x * (s * 0.05), y * (s * 0.05));
    }
    endShape(CLOSE);
  }

  function drawHexagon(x, y, radius) {
    beginShape();
    for (let i = 0; i < 6; i++) {
      const a = (TWO_PI / 6) * i;
      vertex(x + cos(a) * radius, y + sin(a) * radius);
    }
    endShape(CLOSE);
  }

  function drawGlitchEffect(intensity) {
    const offset = intensity * 8;
    const numSlices = floor(intensity * 6) + 1;
    for (let i = 0; i < numSlices; i++) {
      const y = random(height);
      const h = random(2, 20) * intensity;
      const xOff = random(-offset, offset);

      noStroke();
      fill(0, 100, 100, 40 * intensity);
      rect(xOff, y, width, h);
      fill(180, 100, 100, 30 * intensity);
      rect(-xOff, y + 2, width, h * 0.5);
    }

    if (random() < intensity * 0.3) {
      const bx = random(width);
      const by = random(height);
      const bw = random(50, 200);
      const bh = random(5, 30);
      fill(random(360), 80, 100, 25 * intensity);
      noStroke();
      rect(bx + random(-10, 10), by, bw, bh);
    }
  }

  // Draw cursor / crosshair at hand position with hand indexing
  function drawCursor(x, y, gesture, handIndex = 0) {
    push();
    translate(x, y);

    const t = frameCount * 0.05;
    const pulseSize = 22 + sin(t) * 5;

    // Theme color based on hand (Hand 1 = Cyan, Hand 2 = Magenta)
    const baseHue = handIndex === 0 ? 180 : 310;

    // Outer rotating segmented ring
    noFill();
    stroke(baseHue, 80, 100, 140);
    strokeWeight(1.2);
    push();
    rotate(t * (handIndex === 0 ? 1 : -1));
    for (let i = 0; i < 4; i++) {
      const a = (TWO_PI / 4) * i;
      const arcLen = PI / 5;
      arc(0, 0, pulseSize * 2, pulseSize * 2, a, a + arcLen);
    }
    pop();

    // Inner crosshair
    stroke(baseHue, 60, 100, 190);
    strokeWeight(1);
    const crossSize = 8;
    line(-crossSize, 0, -4, 0);
    line(4, 0, crossSize, 0);
    line(0, -crossSize, 0, -4);
    line(0, 4, 0, crossSize);

    // Center dot
    fill(baseHue, 80, 100, 220);
    noStroke();
    ellipse(0, 0, 3.5, 3.5);

    // Hand tag
    textFont('Share Tech Mono');
    textSize(10);
    fill(baseHue, 80, 100, 200);
    textAlign(LEFT, TOP);
    text(`H${handIndex + 1}`, 14, 10);

    // Gesture indicator rings
    if (gesture === 'FIST') {
      noFill();
      stroke(310, 80, 100, 160 + sin(t * 3) * 50);
      strokeWeight(1.5);
      ellipse(0, 0, 42 + sin(t * 2) * 10, 42 + sin(t * 2) * 10);
    } else if (gesture === 'POINT' || gesture === 'GUN') {
      stroke(185, 80, 100, 220);
      strokeWeight(2);
      line(0, 0, 0, -32);
      line(0, -32, -5, -24);
      line(0, -32, 5, -24);
    } else if (gesture === 'PUPPET') {
      stroke(50, 100, 100, 200);
      strokeWeight(1.5);
      ellipse(0, -22, 14, 10);
    }

    pop();
  }

  return {
    update,
    drawBackground,
    drawEffects,
    drawCursor,
    triggerGlitch,
    addShockwave,
    addBeam,
    addPortal,
    addShield,
    addGravityWell,
    addHeartEffect,
    addClashBeam,
    addFusionShield,
    addPuppetFX,
    addBadgeFX,
    triggerFlash,
  };
})();
