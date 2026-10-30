export type FloatBody = {
  x: number; y: number; width: number; height: number;
  vx: number; vy: number; phase: number;
};

export function createFloatWorld(
  width: number, height: number, count: number, random: () => number = Math.random,
): FloatBody[] {
  if (width <= 0 || height <= 0 || count <= 0) return [];
  const columns = Math.min(3, count);
  const rows = Math.ceil(count / columns);
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  return Array.from({ length: count }, (_, index) => {
    const w = cellWidth * (0.76 + (index % 3) * 0.04);
    const h = cellHeight * (0.72 + (index % 2) * 0.06);
    const angle = random() * Math.PI * 2 + index * 1.1;
    const speed = 9 + random() * 5;
    return {
      x: (index % columns) * cellWidth + (cellWidth - w) / 2,
      y: Math.floor(index / columns) * cellHeight + (cellHeight - h) * (index % 2 ? 0.3 : 0.7),
      width: w, height: h,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      phase: random() * Math.PI * 2 + index,
    };
  });
}

function confine(body: FloatBody, width: number, height: number) {
  const maxX = Math.max(0, width - body.width);
  const maxY = Math.max(0, height - body.height);
  if (body.x < 0) { body.x = 0; body.vx = Math.abs(body.vx); }
  if (body.x > maxX) { body.x = maxX; body.vx = -Math.abs(body.vx); }
  if (body.y < 0) { body.y = 0; body.vy = Math.abs(body.vy); }
  if (body.y > maxY) { body.y = maxY; body.vy = -Math.abs(body.vy); }
}

function overlaps(a: FloatBody, b: FloatBody) {
  return a.x < b.x + b.width - 0.001 && b.x < a.x + a.width - 0.001 &&
    a.y < b.y + b.height - 0.001 && b.y < a.y + a.height - 0.001;
}

export function stepFloatWorld(
  bodies: FloatBody[], width: number, height: number, delta: number, time: number, pinned = -1,
) {
  // Small bounded steps prevent tab resumption or slow frames from tunnelling.
  const dt = Math.min(Math.max(delta, 0), 1 / 30);
  const steps = Math.max(1, Math.ceil(dt * 120));
  for (let s = 0; s < steps; s++) {
    const previous = bodies.map(b => ({ ...b }));
    const tick = dt / steps;
    bodies.forEach((b, i) => {
      if (i === pinned) return;
      // Gentle, differently phased currents; no random jumps or spring overshoot.
      b.vx += Math.sin(time * 0.32 + b.phase) * 1.4 * tick;
      b.vy += Math.cos(time * 0.27 + b.phase) * 1.4 * tick;
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > 17) { b.vx *= 17 / speed; b.vy *= 17 / speed; }
      b.x += b.vx * tick;
      b.y += b.vy * tick;
      confine(b, width, height);
    });
    const gap = Math.min(14, width * 0.025);
    for (let pass = 0; pass < 12; pass++) {
      let contact = false;
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], b = bodies[j];
          const dx = b.x + b.width / 2 - a.x - a.width / 2;
          const dy = b.y + b.height / 2 - a.y - a.height / 2;
          const ox = (a.width + b.width) / 2 + gap - Math.abs(dx);
          const oy = (a.height + b.height) / 2 + gap - Math.abs(dy);
          if (ox <= 0 || oy <= 0) continue;
          contact = true;
          const axis = ox < oy ? "x" : "y";
          const velocity = axis === "x" ? "vx" : "vy";
          const sign = (axis === "x" ? dx : dy) >= 0 ? 1 : -1;
          const penetration = (axis === "x" ? ox : oy) + 0.001;
          const massA = i === pinned ? 0 : 1;
          const massB = j === pinned ? 0 : 1;
          const total = massA + massB;
          a[axis] -= sign * penetration * massA / total;
          b[axis] += sign * penetration * massB / total;
          const approach = ((massB ? b[velocity] : 0) - (massA ? a[velocity] : 0)) * sign;
          if (approach < 0) {
            const impulse = -1.88 * approach / total;
            if (massA) a[velocity] -= impulse * sign;
            if (massB) b[velocity] += impulse * sign;
          }
        }
      }
      bodies.forEach((b, i) => { if (i !== pinned) confine(b, width, height); });
      if (!contact) break;
    }
    // A tightly packed three-way collision must never render overlapping cards.
    const invalid = bodies.some((a, i) => bodies.slice(i + 1).some(b => overlaps(a, b)));
    const wasValid = !previous.some((a, i) => previous.slice(i + 1).some(b => overlaps(a, b)));
    if (invalid && wasValid) {
      bodies.forEach((b, i) => {
        b.x = previous[i].x; b.y = previous[i].y;
        if (i !== pinned) { b.vx = -previous[i].vx; b.vy = -previous[i].vy; }
      });
    }
  }
}
