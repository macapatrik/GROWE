import fragment from './nav-water.frag?raw';
import { createWaterState, targetWater, advanceWater, getWaterTarget } from './nav-physics';

// Standalone, reviewed rendering code. No reference application bundle is loaded.
function createRenderer(canvas) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const shaders = [];
  for (const [type, source] of [[gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'], [gl.FRAGMENT_SHADER, fragment]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    shaders.push(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { shaders.forEach(s => gl.deleteShader(s)); return null; }
  }
  const program = gl.createProgram();
  shaders.forEach(shader => gl.attachShader(program, shader)); gl.linkProgram(program);
  shaders.forEach(shader => gl.deleteShader(shader));
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return null; }
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const attribute = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['uRes','uDpr','uTime','uPill','uBlob','uSy','uRip','uMouse','uDark','uAmb'].map(name => [name, gl.getUniformLocation(program, name)]));
  const blobs = new Float32Array(24), scales = new Float32Array(6), ripples = new Float32Array(24);
  return {
    draw(state) {
      const target = state.target, dpr = Math.min(devicePixelRatio || 1, 2);
      const separation = Math.min(Math.abs(state.a.x - state.b.x) / (2 * (state.q + target.r) || 1), 1);
      const head = state.lead === 0 ? state.a : state.b, tail = state.lead === 0 ? state.b : state.a;
      blobs.fill(0); scales.fill(1); ripples.fill(0);
      blobs.set([head.x, target.cy, state.q * (1 - .25 * separation), target.r * (1 - .12 * separation),
        tail.x, target.cy, state.q * (1 - .8 * separation), target.r * (1 - .5 * separation)]);
      scales[0] = scales[1] = state.sy.s;
      state.satellites.slice(0, 4).forEach((dot, index) => blobs.set([dot.x, dot.y, 0, dot.r], 8 + 4 * index));
      state.ripples.slice(-6).forEach((ripple, index) => ripples.set([ripple.x, ripple.y, ripple.age, ripple.amp], 4 * index));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.uRes, state.width + 28, state.height + 28);
      gl.uniform1f(uniforms.uDpr, dpr); gl.uniform1f(uniforms.uTime, state.time);
      gl.uniform4f(uniforms.uPill, 14, 14, state.width, state.height);
      gl.uniform4fv(uniforms.uBlob, blobs); gl.uniform1fv(uniforms.uSy, scales); gl.uniform4fv(uniforms.uRip, ripples);
      gl.uniform3f(uniforms.uMouse, state.mouse.x, state.mouse.y, state.mouse.strength);
      gl.uniform1f(uniforms.uDark, 0); gl.uniform1f(uniforms.uAmb, Number(!state.reduced));
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() { gl.deleteBuffer(buffer); gl.deleteProgram(program); },
  };
}

export function createLiquidNav(navs, reduced, options) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let selectedHash = null, settleTimer;
  const controllers = navs.map(nav => {
    const state = createWaterState(); state.reduced = reduced;
    const drop = nav.querySelector('.nimbus-drop');
    const canvas = document.createElement('canvas');
    canvas.className = 'nimbus-water'; canvas.setAttribute('aria-hidden', 'true');
    drop.before(canvas);
    let renderer = createRenderer(canvas), frame = 0, last = 0, intersecting = false, currentLink;
    nav.dataset.gl = renderer ? 'on' : 'off';
    function draw() {
      if (renderer) renderer.draw(state);
      else {
        const separation = Math.abs(state.a.x - state.b.x);
        const radius = state.target.r * (1 - .3 * Math.min(separation / (2 * (state.q + state.target.r) || 1), 1));
        drop.style.width = `${separation + 2 * (state.q + radius)}px`;
        drop.style.height = `${state.target.r * 2}px`;
        drop.style.top = `${state.target.cy - 14 - state.target.r}px`;
        drop.style.bottom = 'auto';
        drop.style.transform = `translateX(${Math.min(state.a.x, state.b.x) - state.q - radius - 14}px) scaleY(${state.sy.s})`;
      }
    }
    function tick(now) {
      advanceWater(state, Math.min((now - last) / 1000, 1 / 30), now); last = now;
      draw();
      const active = !state.reduced || state.moving || state.ripples.length || state.satellites.length;
      frame = intersecting && !document.hidden && active ? requestAnimationFrame(tick) : 0;
    }
    function wake() {
      if (!frame && state.ready && intersecting && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(tick); }
    }
    function move(link, reset = false) {
      if (!link || !nav.clientWidth) return;
      currentLink = link;
      const resized = state.width !== nav.offsetWidth;
      state.width = nav.offsetWidth; state.height = nav.offsetHeight;
      const inset = nav.closest('.growe-mobile-dock') ? 2 : 0;
      const target = getWaterTarget({ left: link.offsetLeft, top: link.offsetTop,
        width: link.offsetWidth, height: link.offsetHeight }, inset);
      targetWater(state, target, performance.now(), reset || resized);
      const dpr = Math.min(devicePixelRatio || 1, 2), width = state.width + 28, height = state.height + 28;
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      }
      draw(); wake();
    }
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; wake(); }); observer.observe(nav);
    const resize = new ResizeObserver(() => move(currentLink || nav.querySelector('[aria-current]'), true)); resize.observe(nav);
    const point = event => { const rect = nav.getBoundingClientRect(); return { x: event.clientX - rect.left + 14, y: event.clientY - rect.top + 14 }; };
    nav.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || state.reduced) return;
      Object.assign(state.mouse, point(event), { on: true }); wake();
    }, options);
    nav.addEventListener('pointerleave', () => { state.mouse.on = false; wake(); }, options);
    nav.addEventListener('pointerdown', event => {
      if (!state.reduced) state.ripples.push({ ...point(event), age: 0, amp: .8 }); wake();
    }, options);
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); renderer = null; nav.dataset.gl = 'off'; draw(); }, options);
    canvas.addEventListener('webglcontextrestored', () => { renderer = createRenderer(canvas); nav.dataset.gl = renderer ? 'on' : 'off'; draw(); wake(); }, options);
    document.addEventListener('visibilitychange', wake, options);
    media.addEventListener('change', () => {
      state.reduced = media.matches; state.mouse.on = false; state.mouse.strength = 0; state.ripples = [];
      move(currentLink, true);
    }, options);
    return { nav, move, dispose() { cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect(); renderer?.dispose(); canvas.remove(); } };
  });
  function update() {
    controllers.forEach(({ nav, move }) => {
      const selected = selectedHash && [...nav.querySelectorAll('a')].find(link => link.hash === selectedHash);
      move(selected || nav.querySelector('[aria-current]'));
    });
  }
  const release = () => { selectedHash = null; update(); };
  navs.forEach(nav => {
    nav.addEventListener('click', event => {
      const link = event.target.closest('.nimbus-item'); if (!link) return;
      selectedHash = link.hash; clearTimeout(settleTimer); settleTimer = setTimeout(release, 1400); update();
    }, options);
    nav.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const links = [...nav.querySelectorAll('.nimbus-item')], index = links.indexOf(document.activeElement);
      const next = links[(Math.max(0, index) + (event.key === 'ArrowRight' ? 1 : -1) + links.length) % links.length];
      next.click(); next.focus({ preventScroll: true });
    }, options);
  });
  window.addEventListener('scroll', () => {
    if (selectedHash) { clearTimeout(settleTimer); settleTimer = setTimeout(release, 150); }
  }, { ...options, passive: true });
  return { update, cleanup() { clearTimeout(settleTimer); controllers.forEach(controller => controller.dispose()); } };
}
