export function setupTestimonialSlider(root, reduced, options, language) {
  const section = root.querySelector('#ohlasy');
  const viewport = section.querySelector('.quote-grid');
  const cards = [...viewport.querySelectorAll('.quote-card')];
  const controls = section.querySelector('.testimonial-controls');
  const pagination = section.querySelector('.testimonial-dots');
  const pause = section.querySelector('[data-testimonial-pause]');
  const english = language === 'en';
  const rail = document.createElement('div');
  rail.className = 'testimonial-rail';
  const slides = cards.map(card => {
    const slide = document.createElement('div');
    slide.className = 'testimonial-slide';
    slide.append(card);
    return slide;
  });
  const before = slides.at(-1).cloneNode(true);
  const after = slides[0].cloneNode(true);
  [before, after].forEach(slide => { slide.setAttribute('aria-hidden', 'true'); slide.inert = true; });
  const all = [before, ...slides, after];
  rail.append(...all);
  viewport.replaceChildren(rail);
  viewport.dataset.enhanced = '';
  controls.hidden = false;
  viewport.setAttribute('aria-roledescription', english ? 'carousel' : 'karusel');
  let active = 1;
  let timer;
  let visible = false;
  let paused = false;
  let hovered = false;
  let focused = false;
  let drag;
  const dots = cards.map((card, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `${english ? 'Show review' : 'Zobrazit referenci'}: ${card.querySelector('figcaption strong').textContent}`);
    dot.addEventListener('click', () => select(i + 1), options);
    pagination.append(dot);
    return dot;
  });
  function schedule() {
    clearTimeout(timer);
    if (!reduced && visible && !paused && !hovered && !focused && !drag && !document.hidden) {
      timer = setTimeout(() => select(active + 1), 9000);
    }
  }
  function offset() {
    return viewport.clientWidth / 2 - all[active].offsetLeft - all[active].offsetWidth / 2;
  }
  function select(index, immediate = false) {
    active = Math.max(0, Math.min(all.length - 1, index));
    rail.style.transition = immediate || reduced ? 'none' : '';
    rail.style.transform = `translate3d(${offset()}px,0,0)`;
    all.forEach((slide, i) => slide.classList.toggle('is-active', i === active));
    const actual = (active - 1 + cards.length) % cards.length;
    dots.forEach((dot, i) => {
      if (i === actual) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    if ((reduced || immediate) && (active === 0 || active === all.length - 1)) select(active === 0 ? cards.length : 1, true);
    else schedule();
  }
  rail.addEventListener('transitionend', event => {
    if (event.target !== rail || event.propertyName !== 'transform') return;
    if (active === 0) select(cards.length, true);
    else if (active === all.length - 1) select(1, true);
  }, options);
  section.querySelector('[data-testimonial-prev]').addEventListener('click', () => select(active - 1), options);
  section.querySelector('[data-testimonial-next]').addEventListener('click', () => select(active + 1), options);
  pause.hidden = reduced;
  pause.addEventListener('click', () => {
    paused = !paused;
    pause.setAttribute('aria-pressed', String(paused));
    const label = english ? (paused ? 'Play reviews' : 'Pause reviews') : (paused ? 'Spustit reference' : 'Pozastavit reference');
    pause.setAttribute('aria-label', label);
    pause.title = label;
    schedule();
  }, options);
  section.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } }, options);
  section.addEventListener('pointerleave', () => { hovered = false; schedule(); }, options);
  section.addEventListener('focusin', () => { focused = true; schedule(); }, options);
  section.addEventListener('focusout', event => { focused = section.contains(event.relatedTarget); schedule(); }, options);
  viewport.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    select(event.key === 'Home' ? 1 : event.key === 'End' ? cards.length : active + (event.key === 'ArrowRight' ? 1 : -1));
  }, options);
  viewport.addEventListener('dragstart', event => event.preventDefault(), options);
  viewport.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = { x: event.clientX, pointer: event.pointerId };
    viewport.setPointerCapture(event.pointerId);
    schedule();
  }, options);
  viewport.addEventListener('pointermove', event => {
    if (drag?.pointer !== event.pointerId) return;
    rail.style.transition = 'none';
    rail.style.transform = `translate3d(${offset() + event.clientX - drag.x}px,0,0)`;
  }, options);
  const release = event => {
    if (drag?.pointer !== event.pointerId) return;
    const delta = event.clientX - drag.x;
    drag = undefined;
    select(active + (event.type === 'pointercancel' || Math.abs(delta) < 40 ? 0 : delta < 0 ? 1 : -1));
  };
  viewport.addEventListener('pointerup', release, options);
  viewport.addEventListener('pointercancel', release, options);
  viewport.addEventListener('lostpointercapture', release, options);
  document.addEventListener('visibilitychange', schedule, options);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }, { threshold: .3 });
  observer.observe(section);
  const resize = new ResizeObserver(() => select(active, true));
  resize.observe(viewport);
  select(1, true);
  return () => { clearTimeout(timer); observer.disconnect(); resize.disconnect(); };
}
