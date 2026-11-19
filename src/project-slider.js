export function setupProjectSlider(root, reduced, options, language) {
  const gallery = root.querySelector('#projects-track');
  const cards = [...gallery.querySelectorAll('.project-card')];
  const previous = root.querySelector('[data-project-prev]');
  const next = root.querySelector('[data-project-next]');
  const position = root.querySelector('#projects-position');
  const pagination = root.querySelector('.projects-dots');
  const english = language === 'en';
  const rail = document.createElement('div');
  rail.className = 'projects-rail';
  const slides = cards.map((card, index) => {
    const slide = document.createElement('div');
    slide.className = 'project-slide';
    slide.dataset.projectIndex = index;
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-label', `${index + 1} / ${cards.length}`);
    const label = document.createElement('span');
    label.className = 'project-selection-label';
    label.setAttribute('aria-hidden', 'true');
    label.textContent = card.querySelector('h3').textContent;
    if (card.matches('a,button') && !card.querySelector('.project-arrow')) {
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrow.setAttribute('class', 'project-arrow');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.setAttribute('viewBox', '0 0 24 24');
      arrow.setAttribute('fill', 'none');
      arrow.setAttribute('stroke', 'currentColor');
      arrow.setAttribute('stroke-width', '1.8');
      arrow.innerHTML = '<path d="M7 17 17 7M7 7h10v10"/>';
      card.append(arrow);
    }
    slide.append(card, label);
    for (let corner = 0; corner < 4; corner++) {
      const handle = document.createElement('i');
      handle.className = `project-handle project-handle-${corner}`;
      handle.setAttribute('aria-hidden', 'true');
      slide.append(handle);
    }
    return slide;
  });
  const before = slides.at(-1).cloneNode(true);
  const after = slides[0].cloneNode(true);
  [before, after].forEach(slide => slide.setAttribute('aria-hidden', 'true'));
  const allSlides = [before, ...slides, after];
  rail.append(...allSlides);
  gallery.replaceChildren(rail);
  gallery.dataset.enhanced = '';
  gallery.setAttribute('aria-roledescription', english ? 'carousel' : 'karusel');
  let active = 1;
  let drag;
  let suppressClick = false;
  const dots = cards.map((card, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `${english ? 'Show project' : 'Zobrazit projekt'}: ${card.querySelector('h3').textContent}`);
    dot.addEventListener('click', () => select(index + 1), options);
    pagination.append(dot);
    return dot;
  });
  function offset() {
    return gallery.clientWidth / 2 - allSlides[active].offsetLeft - allSlides[active].offsetWidth / 2;
  }
  function select(index, immediate = false) {
    active = Math.max(0, Math.min(allSlides.length - 1, index));
    const actual = (active - 1 + cards.length) % cards.length;
    rail.style.transition = immediate || reduced ? 'none' : '';
    rail.style.transform = `translate3d(${offset()}px,0,0)`;
    allSlides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === active);
      slide.querySelector('.project-card').inert = i !== active || i === 0 || i === allSlides.length - 1;
    });
    dots.forEach((dot, i) => {
      if (i === actual) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    position.textContent = english ? `Project ${actual + 1} of ${cards.length}` : `Projekt ${actual + 1} z ${cards.length}`;
    if (reduced && (active === 0 || active === allSlides.length - 1)) select(active === 0 ? cards.length : 1, true);
  }
  rail.addEventListener('transitionend', event => {
    if (event.target !== rail || event.propertyName !== 'transform') return;
    if (active === 0) select(cards.length, true);
    else if (active === allSlides.length - 1) select(1, true);
  }, options);
  previous.addEventListener('click', () => select(active - 1), options);
  next.addEventListener('click', () => select(active + 1), options);
  gallery.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    select(event.key === 'Home' ? 1 : event.key === 'End' ? cards.length : active + (event.key === 'ArrowRight' ? 1 : -1));
  }, options);
  gallery.addEventListener('dragstart', event => event.preventDefault(), options);
  gallery.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    drag = { x: event.clientX, y: event.clientY, pointer: event.pointerId, moved: false };
  }, options);
  gallery.addEventListener('pointermove', event => {
    if (drag?.pointer !== event.pointerId) return;
    const delta = event.clientX - drag.x;
    if (!drag.moved && Math.abs(delta) < 8) return;
    if (!drag.moved && Math.abs(event.clientY - drag.y) > Math.abs(delta)) { drag = undefined; return; }
    drag.moved = true;
    gallery.setPointerCapture(event.pointerId);
    gallery.setAttribute('data-dragging', '');
    rail.style.transition = 'none';
    rail.style.transform = `translate3d(${offset() + delta}px,0,0)`;
  }, options);
  const endDrag = event => {
    if (drag?.pointer !== event.pointerId) return;
    const delta = event.clientX - drag.x;
    suppressClick = drag.moved;
    if (drag.moved) select(active + (event.type === 'pointercancel' || Math.abs(delta) < 40 ? 0 : delta < 0 ? 1 : -1));
    drag = undefined;
    gallery.removeAttribute('data-dragging');
  };
  gallery.addEventListener('pointerup', endDrag, options);
  gallery.addEventListener('pointercancel', endDrag, options);
  gallery.addEventListener('lostpointercapture', endDrag, options);
  gallery.addEventListener('click', event => {
    const slide = event.target.closest('.project-slide');
    if (suppressClick || (slide && !slide.classList.contains('is-active'))) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!suppressClick) select(Number(slide.dataset.projectIndex) + 1);
      suppressClick = false;
    }
  }, { ...options, capture: true });
  const resize = new ResizeObserver(() => select(active, true));
  resize.observe(gallery);
  select(active, true);
  return () => resize.disconnect();
}
