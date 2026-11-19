// Two joined capsules, with a delayed trailing spring, as observed in the reference.
export function createWaterState() {
  return { a: { x: 0, v: 0 }, b: { x: 0, v: 0 }, sy: { s: 1, v: 0 },
    lead: 0, lagUntil: 0, satellites: [], ripples: [], target: { x: 0, cy: 0, q: 0, r: 21 },
    q: 0, mouse: { x: 0, y: 0, strength: 0, on: false }, moving: false, split: false,
    ready: false, width: 0, height: 0, time: 0, reduced: false };
}

export function targetWater(state, target, now, reset = false) {
  if (!state.ready || reset || state.reduced) {
    state.a.x = state.b.x = target.x;
    state.a.v = state.b.v = state.sy.v = 0;
    state.sy.s = 1;
    state.q = target.q;
    state.satellites = [];
    state.moving = false;
    state.ready = true;
  } else if (Math.abs(target.x - state.target.x) > .5) {
    state.lead = Math.abs(target.x - state.a.x) <= Math.abs(target.x - state.b.x) ? 0 : 1;
    state.lagUntil = now + 70;
    state.moving = true;
    state.split = false;
  }
  state.target = target;
}

export function advanceWater(state, dt, now, random = Math.random) {
  const target = state.target;
  dt = Math.min(dt, 1 / 30);
  state.time += dt;
  state.q += (target.q - state.q) * Math.min(1, 12 * dt);
  const nodes = [state.a, state.b];
  let settled = true;
  if (state.reduced) {
    nodes.forEach(node => { node.x = target.x; node.v = 0; });
    state.sy.s = 1;
    state.satellites = [];
  } else {
    nodes.forEach((node, index) => {
      const leader = index === state.lead;
      const lag = !leader && now < state.lagUntil ? .08 : 1;
      node.v += ((leader ? 210 : 72) * (target.x - node.x) - (leader ? 25 : 13) * node.v) * dt * lag;
      node.x += node.v * dt;
      const min = 17 + state.q + target.r;
      const max = 11 + state.width - state.q - target.r;
      if (node.x < min || node.x > max) {
        state.sy.v -= .0016 * Math.min(Math.abs(node.v), 900);
        node.x = Math.max(min, Math.min(max, node.x));
        node.v *= -.25;
      }
      if (Math.abs(target.x - node.x) > .3 || Math.abs(node.v) > 3) settled = false;
    });
    const squash = 1 - .2 * Math.min(Math.abs(nodes[state.lead].v) / 1500, 1);
    state.sy.v += (280 * (squash - state.sy.s) - 9 * state.sy.v) * dt;
    state.sy.s += state.sy.v * dt;
    if (Math.abs(state.sy.s - 1) > .002 || Math.abs(state.sy.v) > .02) settled = false;
    const distance = Math.abs(state.a.x - state.b.x);
    const radius = target.r * (1 - .3 * Math.min(distance / (2 * (target.q + target.r) || 1), 1));
    if (!state.split && state.moving && distance - 2 * target.q - 2 * radius > -6) {
      state.split = true;
      const tail = nodes[1 - state.lead], head = nodes[state.lead];
      [.3, .5, .72].forEach((position, index) => state.satellites.push({
        x: tail.x + (head.x - tail.x) * position + (random() - .5) * 6,
        y: target.cy + (random() - .5) * 10, vx: (tail.v + head.v) * .45,
        vy: (random() - .5) * 60, r: 5 + 3 * random() - .5 * index, k: 70 + 90 * random(),
      }));
    }
    state.satellites = state.satellites.filter(dot => {
      dot.vx += (dot.k * (target.x - dot.x) - 9 * dot.vx) * dt;
      dot.vy += (90 * (target.cy - dot.y) - 7 * dot.vy) * dt;
      dot.x += dot.vx * dt; dot.y += dot.vy * dt;
      dot.x = Math.max(22 + dot.r, Math.min(6 + state.width - dot.r, dot.x));
      dot.y = Math.max(target.cy - target.r + dot.r, Math.min(target.cy + target.r - dot.r, dot.y));
      if (Math.abs(target.x - dot.x) < target.q + .5 * target.r) dot.r -= 26 * dt;
      return dot.r > .6;
    });
    if (state.satellites.length) settled = false;
  }
  if (state.moving && settled) {
    state.moving = false;
    if (!state.reduced) state.ripples.push({ x: target.x, y: target.cy, age: 0, amp: state.split ? 1.2 : .7 });
  }
  state.ripples.forEach(ripple => { ripple.age += dt; });
  state.ripples = state.ripples.filter(ripple => ripple.age < 2.4).slice(-6);
  state.mouse.strength += (Number(state.mouse.on) - state.mouse.strength) * Math.min(1, 7 * dt);
}

// Keep visual insets separate from the full-size navigation hit areas.
export function getWaterTarget({ left, top, width, height }, inset = 0) {
  const r = Math.max(1, height / 2 - inset);
  return { x: 14 + left + width / 2, cy: 14 + top + height / 2,
    q: Math.max(0, width / 2 - inset - r), r };
}
