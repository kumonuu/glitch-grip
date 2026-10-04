/* ============================================
   GLITCH GRIP — Particle System
   High-performance particle engine with
   cyberpunk aesthetics, multi-hand reactivity,
   and expressive gesture particles.
   ============================================ */

class Particle {
  constructor(x, y, opts = {}) {
    this.pos = createVector(x, y);
    this.vel = opts.vel || p5.Vector.random2D().mult(random(0.3, 1.5));
    this.acc = createVector(0, 0);
    this.size = opts.size || random(1.5, 4);
    this.baseSize = this.size;
    this.life = opts.life || random(200, 500);
    this.maxLife = this.life;
    this.hue = opts.hue || random(170, 210); // cyan default
    this.sat = opts.sat || random(80, 100);
    this.bri = opts.bri || 100;
    this.trail = [];
    this.trailLen = opts.trailLen || floor(random(4, 10));
    this.type = opts.type || 'ambient';
    this.friction = opts.friction || 0.985;
    this.glitchOffset = 0;
    this.rotation = opts.rotation || 0;
    this.rotSpeed = opts.rotSpeed || (random(-0.08, 0.08));
    this.symbol = opts.symbol || null;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.trail.push(this.pos.copy());
    if (this.trail.length > this.trailLen) {
      this.trail.shift();
    }

    this.vel.add(this.acc);
    this.vel.mult(this.friction);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.life--;
    this.rotation += this.rotSpeed;

    if (this.type === 'glitch') {
      this.glitchOffset = random(-3, 3);
    }
  }

  draw(pg) {
    const alpha = map(this.life, 0, this.maxLife, 0, 255);
    const t = this.life / this.maxLife;

    // Trail
    if (this.trail.length > 1 && this.type !== 'heart') {
      const tail = this.trail[0];
      pg.stroke(this.hue, this.sat, this.bri, alpha * 0.25);
      pg.strokeWeight(this.size * 0.4);
      pg.line(tail.x, tail.y, this.pos.x + this.glitchOffset, this.pos.y);
    }

    pg.noStroke();

    // Heart parametric particle
    if (this.type === 'heart') {
      pg.push();
      pg.translate(this.pos.x, this.pos.y);
      pg.rotate(this.rotation);
      const hSize = this.size * t * 1.5;

      // Outer glow
      pg.fill(this.hue, this.sat, this.bri, alpha * 0.3);
      drawParametricHeart(pg, hSize * 2.2);

      // Core
      pg.fill(this.hue, this.sat, this.bri, alpha);
      drawParametricHeart(pg, hSize);

      pg.pop();
      return;
    }

    // Text / Symbol particle (for puppet chatter or thumbs)
    if (this.symbol) {
      pg.push();
      pg.translate(this.pos.x, this.pos.y);
      pg.rotate(this.rotation);
      pg.fill(this.hue, this.sat, this.bri, alpha);
      pg.textFont('Rajdhani');
      pg.textSize(this.size * 3.5);
      pg.textAlign(CENTER, CENTER);
      pg.text(this.symbol, 0, 0);
      pg.pop();
      return;
    }

    // Standard core particle
    const coreSize = this.size * t;
    if (this.type !== 'ambient') {
      pg.fill(this.hue, this.sat, this.bri, alpha * 0.12);
      pg.ellipse(this.pos.x + this.glitchOffset, this.pos.y, coreSize * 3.2, coreSize * 3.2);
    }
    pg.fill(this.hue, this.sat, this.bri, alpha);
    pg.ellipse(this.pos.x + this.glitchOffset, this.pos.y, coreSize, coreSize);
  }

  isDead() {
    return this.life <= 0;
  }
}

// Parametric heart helper
function drawParametricHeart(pg, s) {
  pg.beginShape();
  for (let a = 0; a < TWO_PI; a += 0.25) {
    const x = 16 * Math.pow(Math.sin(a), 3);
    const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    pg.vertex(x * (s * 0.05), y * (s * 0.05));
  }
  pg.endShape(CLOSE);
}


class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 800;
    this.ambientRate = 1;
    this.pg = null;
  }

  init(w, h) {
    this.pg = createGraphics(w, h);
    this.pg.colorMode(HSB, 360, 100, 100, 255);
  }

  resize(w, h) {
    if (this.pg) this.pg.remove();
    this.pg = createGraphics(w, h);
    this.pg.colorMode(HSB, 360, 100, 100, 255);
  }

  // Spawn ambient floating particles
  spawnAmbient(w, h) {
    if (this.particles.length >= this.maxParticles) return;
    for (let i = 0; i < this.ambientRate; i++) {
      const edge = floor(random(4));
      let x, y;
      if (edge === 0) { x = random(w); y = -10; }
      else if (edge === 1) { x = w + 10; y = random(h); }
      else if (edge === 2) { x = random(w); y = h + 10; }
      else { x = -10; y = random(h); }

      this.particles.push(new Particle(x, y, {
        vel: createVector(random(-0.5, 0.5), random(-0.5, 0.5)),
        hue: random() < 0.7 ? random(170, 210) : random(290, 330),
        size: random(1.2, 3),
        life: random(300, 600),
        trailLen: floor(random(3, 7)),
        type: 'ambient',
        friction: 0.998,
      }));
    }
  }

  // Energy blast — directional stream
  emitBlast(x, y, dirX, dirY, count = 25) {
    const dir = createVector(dirX, dirY).normalize();
    for (let i = 0; i < count; i++) {
      const spread = random(-0.4, 0.4);
      const speed = random(6, 18);
      const vel = dir.copy().rotate(spread).mult(speed);
      this.particles.push(new Particle(x, y, {
        vel: vel,
        hue: random(170, 200),
        sat: random(80, 100),
        size: random(2, 5),
        life: random(30, 80),
        trailLen: floor(random(6, 14)),
        type: 'blast',
        friction: 0.96,
      }));
    }
  }

  // Love Heart — floating neon cyber hearts
  emitHearts(cx, cy, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = random(TWO_PI);
      const speed = random(1.5, 5.5);
      const vel = createVector(cos(angle) * speed, sin(angle) * speed - 1.2);
      this.particles.push(new Particle(cx + random(-25, 25), cy + random(-20, 20), {
        vel: vel,
        hue: random(320, 350), // radiant pink/magenta
        sat: random(85, 100),
        bri: 100,
        size: random(6, 14),
        life: random(40, 90),
        rotSpeed: random(-0.05, 0.05),
        type: 'heart',
        friction: 0.96,
      }));
    }
  }

  // Hand Puppet — robotic chatter words and binary sparks
  emitPuppetChatter(x, y, count = 4) {
    const chatterSymbols = ['▲', '■', '✦', '01', 'BEEP', 'SYNTH', '♫', 'SYS'];
    for (let i = 0; i < count; i++) {
      const angle = random(-PI * 0.8, -PI * 0.2); // upward cone
      const speed = random(3, 8);
      this.particles.push(new Particle(x, y, {
        vel: createVector(cos(angle) * speed, sin(angle) * speed),
        hue: random([50, 180, 320]), // yellow, cyan, pink
        sat: 100,
        size: random(4, 7),
        life: random(30, 60),
        symbol: random(chatterSymbols),
        type: 'puppet',
        friction: 0.94,
      }));
    }
  }

  // Energy Clash — electric spark lightning bridging two points
  emitLightning(x1, y1, x2, y2, count = 14) {
    for (let i = 0; i < count; i++) {
      const t = random(0, 1);
      const px = lerp(x1, x2, t) + random(-30, 30);
      const py = lerp(y1, y2, t) + random(-30, 30);
      const vel = p5.Vector.random2D().mult(random(2, 7));
      this.particles.push(new Particle(px, py, {
        vel: vel,
        hue: random([180, 290, 50]),
        sat: 100,
        size: random(2, 5),
        life: random(15, 45),
        trailLen: 5,
        type: 'blast',
        friction: 0.92,
      }));
    }
  }

  // Fusion Shield Matrix
  emitFusionShield(x1, y1, x2, y2) {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    for (let i = 0; i < 8; i++) {
      const a = random(TWO_PI);
      const r = random(60, 220);
      this.particles.push(new Particle(cx + cos(a) * r, cy + sin(a) * r, {
        vel: createVector(cos(a) * 0.8, sin(a) * 0.8),
        hue: random(160, 200),
        sat: 90,
        size: random(2, 4.5),
        life: random(25, 60),
        trailLen: 4,
        type: 'shield',
        friction: 0.98,
      }));
    }
  }

  // Approval / Dislike stream (Thumbs)
  emitApproval(x, y, isUp = true) {
    const sym = isUp ? '▲' : '▼';
    const hue = isUp ? 140 : 0;
    for (let i = 0; i < 4; i++) {
      const dirY = isUp ? -random(2, 5) : random(2, 5);
      this.particles.push(new Particle(x + random(-15, 15), y, {
        vel: createVector(random(-1, 1), dirY),
        hue: hue,
        sat: 100,
        size: random(3, 6),
        life: random(30, 60),
        symbol: sym,
        friction: 0.96,
      }));
    }
  }

  // Gun Shot sparks
  emitGunSpark(x, y, dirX = 1, dirY = 0) {
    for (let i = 0; i < 15; i++) {
      const v = createVector(dirX, dirY).rotate(random(-0.3, 0.3)).mult(random(8, 22));
      this.particles.push(new Particle(x, y, {
        vel: v,
        hue: random(180, 210),
        sat: 90,
        size: random(2, 4),
        life: random(15, 40),
        trailLen: 8,
        type: 'blast',
        friction: 0.93,
      }));
    }
  }

  // Gravity pull — attract nearby particles toward point
  applyGravity(cx, cy, strength = 0.8, radius = 300) {
    for (const p of this.particles) {
      const d = dist(p.pos.x, p.pos.y, cx, cy);
      if (d < radius && d > 5) {
        const force = createVector(cx - p.pos.x, cy - p.pos.y);
        force.normalize();
        force.mult(strength * (1 - d / radius));
        p.applyForce(force);
        p.hue = lerp(p.hue, 310, 0.03);
        p.size = lerp(p.size, p.baseSize * 1.5, 0.05);
      }
    }
    if (this.particles.length < this.maxParticles) {
      for (let i = 0; i < 4; i++) {
        const angle = random(TWO_PI);
        const r = random(radius * 0.3, radius);
        const px = cx + cos(angle) * r;
        const py = cy + sin(angle) * r;
        const vel = createVector(cx - px, cy - py).normalize().rotate(PI / 3).mult(random(1, 3));
        this.particles.push(new Particle(px, py, {
          vel: vel,
          hue: random(280, 330),
          size: random(1.5, 3),
          life: random(40, 100),
          trailLen: floor(random(5, 10)),
          type: 'gravity',
          friction: 0.97,
        }));
      }
    }
  }

  // Shield — radial push
  emitShield(cx, cy, radius = 120) {
    for (const p of this.particles) {
      const d = dist(p.pos.x, p.pos.y, cx, cy);
      if (d < radius * 2) {
        const force = createVector(p.pos.x - cx, p.pos.y - cy);
        force.normalize().mult(2.5 * (1 - d / (radius * 2)));
        p.applyForce(force);
        p.hue = lerp(p.hue, 50, 0.05);
      }
    }
    if (this.particles.length < this.maxParticles) {
      for (let i = 0; i < 6; i++) {
        const angle = random(TWO_PI);
        const px = cx + cos(angle) * radius;
        const py = cy + sin(angle) * radius;
        this.particles.push(new Particle(px, py, {
          vel: createVector(cos(angle), sin(angle)).mult(random(1, 3)),
          hue: random(40, 70),
          sat: 90,
          size: random(2, 4),
          life: random(20, 50),
          trailLen: 4,
          type: 'shield',
          friction: 0.95,
        }));
      }
    }
  }

  // Glitch distortion — chaotic particles
  emitGlitch(cx, cy, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = random(TWO_PI);
      const speed = random(2, 8);
      this.particles.push(new Particle(
        cx + random(-50, 50),
        cy + random(-50, 50),
        {
          vel: createVector(cos(angle) * speed, sin(angle) * speed),
          hue: random([0, 120, 180, 280, 330][floor(random(5))]),
          sat: 100,
          size: random(1, 6),
          life: random(15, 40),
          trailLen: floor(random(2, 6)),
          type: 'glitch',
          friction: 0.92,
        }
      ));
    }
  }

  // Shockwave — circular burst
  emitShockwave(cx, cy, count = 60) {
    for (let i = 0; i < count; i++) {
      const angle = (TWO_PI / count) * i + random(-0.1, 0.1);
      const speed = random(8, 20);
      this.particles.push(new Particle(cx, cy, {
        vel: createVector(cos(angle) * speed, sin(angle) * speed),
        hue: random(10, 40),
        sat: 100,
        size: random(2, 5),
        life: random(30, 70),
        trailLen: floor(random(8, 16)),
        type: 'shockwave',
        friction: 0.94,
      }));
    }
  }

  // Portal — spiraling vortex
  emitPortal(cx, cy) {
    if (this.particles.length >= this.maxParticles) return;
    for (let i = 0; i < 8; i++) {
      const angle = random(TWO_PI);
      const r = random(20, 80);
      const px = cx + cos(angle) * r;
      const py = cy + sin(angle) * r;
      const tangent = createVector(cy - py, px - cx).normalize().mult(random(2, 5));
      const inward = createVector(cx - px, cy - py).normalize().mult(random(0.5, 2));
      const vel = p5.Vector.add(tangent, inward);
      this.particles.push(new Particle(px, py, {
        vel: vel,
        hue: random(260, 300),
        sat: random(70, 100),
        size: random(1.5, 4),
        life: random(40, 100),
        trailLen: floor(random(6, 12)),
        type: 'portal',
        friction: 0.97,
      }));
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    if (!this.pg) return;
    this.pg.clear();
    this.pg.blendMode(ADD);
    for (const p of this.particles) {
      p.draw(this.pg);
    }
    this.pg.blendMode(BLEND);
    image(this.pg, 0, 0);
  }

  getCount() {
    return this.particles.length;
  }
}
