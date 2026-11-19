function setupLogoContrast(root, options) {
  const header = root.querySelector('.growe-header');
  const logo = header.querySelector('.growe-logo');
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const images = new WeakMap();

  function imagePixel(image, style, x, y) {
    if (!context || !image.naturalWidth) return null;
    let cached = images.get(image);
    if (cached?.source !== image.currentSrc) {
      cached = { source: image.currentSrc, pixels: null };
      try {
        context.clearRect(0, 0, size, size);
        context.drawImage(image, 0, 0, size, size);
        cached.pixels = context.getImageData(0, 0, size, size).data;
      } catch {
        // A remote image can be displayed even when its pixels are unavailable.
        canvas.width = size;
      }
      images.set(image, cached);
    }
    if (!cached.pixels) return null;

    const bounds = image.getBoundingClientRect();
    let width = bounds.width;
    let height = bounds.height;
    if (style.objectFit === 'cover' || style.objectFit === 'contain') {
      const scale = (style.objectFit === 'cover' ? Math.max : Math.min)(
        width / image.naturalWidth, height / image.naturalHeight,
      );
      width = image.naturalWidth * scale;
      height = image.naturalHeight * scale;
    }
    const [horizontal, vertical] = style.objectPosition.split(' ');
    const offset = (position, available) => position.endsWith('%')
      ? available * parseFloat(position) / 100
      : parseFloat(position) || 0;
    const column = Math.floor((x - bounds.left - offset(horizontal, bounds.width - width)) / width * size);
    const row = Math.floor((y - bounds.top - offset(vertical, bounds.height - height)) / height * size);
    if (column < 0 || column >= size || row < 0 || row >= size) return null;
    const index = (row * size + column) * 4;
    const [red, green, blue, alpha] = cached.pixels.subarray(index, index + 4);
    return [red, green, blue, alpha / 255];
  }

  function backdropLightness(x, y) {
    let remaining = 1;
    let lightness = 0;
    for (const element of document.elementsFromPoint(x, y)) {
      if (header.contains(element)) continue;
      const style = getComputedStyle(element);
      const image = element instanceof HTMLImageElement ? imagePixel(element, style, x, y) : null;
      const background = style.backgroundColor.match(/[\d.]+/g)?.map(Number);
      for (const color of [image, background]) {
        if (!color) continue;
        const [red, green, blue, alpha = 1] = color;
        lightness += remaining * alpha * (.2126 * red + .7152 * green + .0722 * blue);
        remaining *= 1 - alpha;
      }
      if (remaining < .01) break;
    }
    return lightness + remaining * 255;
  }

  let frame = 0;
  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const { left, top, width, height } = logo.getBoundingClientRect();
      const total = [.1, .3, .5, .7, .9].reduce(
        (sum, fraction) => sum + backdropLightness(left + width * fraction, top + height / 2), 0,
      );
      // A small gap between thresholds keeps mixed backgrounds from flickering.
      const threshold = header.hasAttribute('data-light-logo') ? 140 : 116;
      header.toggleAttribute('data-light-logo', total / 5 < threshold);
    });
  }
  window.addEventListener('scroll', schedule, { ...options, passive: true, capture: true });
  window.addEventListener('resize', schedule, options);
  root.addEventListener('load', schedule, { ...options, capture: true });
  document.fonts.ready.then(() => { if (!options.signal.aborted) schedule(); });
  schedule();
  return () => cancelAnimationFrame(frame);
}

export function setupVisualPolish(root, reduced, options, contact) {
  const cleanupLogo = setupLogoContrast(root, options);
  const opening = root.querySelector('.hero-opening');
  const scenes = [...opening.querySelectorAll('.hero-scene')];
  const guideToggle = opening.querySelector('.hero-guide-toggle');
  const pause = opening.querySelector('.hero-pause');
  const english = document.documentElement.lang === 'en';
  pause.hidden = reduced;
  pause.addEventListener('click', () => {
    const paused = opening.toggleAttribute('data-paused');
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', english
      ? (paused ? 'Resume intro animation' : 'Pause intro animation')
      : (paused ? 'Spustit úvodní animaci' : 'Pozastavit úvodní animaci'));
  }, options);
  let activeScene = 0;

  guideToggle.hidden = false;
  guideToggle.addEventListener('click', () => {
    const showGuides = opening.toggleAttribute('data-design-guides');
    guideToggle.setAttribute('aria-checked', String(showGuides));
  }, options);

  function selectScene(index) {
    if (index === activeScene) return;
    scenes[activeScene].hidden = true;
    scenes[activeScene].removeAttribute('data-active');
    activeScene = index;
    scenes[index].hidden = false;
    scenes[index].setAttribute('data-active', '');
    opening.dataset.scene = String(index);
  }

  const openingObserver = new IntersectionObserver(([entry]) => {
    opening.toggleAttribute('data-offscreen', !entry.isIntersecting);
  });
  if (!reduced) {
    opening.setAttribute('data-animated', '');
    let drag;
    opening.addEventListener('pointerdown', event => {
      const wordmark = event.target.closest('.hero-wordmark');
      if (!wordmark || event.pointerType !== 'mouse' || event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, pointer: event.pointerId };
      wordmark.setPointerCapture(event.pointerId);
      opening.setAttribute('data-dragging', '');
    }, options);
    opening.addEventListener('pointermove', event => {
      if (drag?.pointer !== event.pointerId) return;
      const x = Math.max(-100, Math.min(100, event.clientX - drag.x));
      const y = Math.max(-70, Math.min(70, event.clientY - drag.y));
      opening.style.setProperty('--hero-drag-x', `${x}px`);
      opening.style.setProperty('--hero-drag-y', `${y}px`);
    }, options);
    opening.addEventListener('lostpointercapture', event => {
      if (drag?.pointer !== event.pointerId) return;
      drag = undefined;
      opening.removeAttribute('data-dragging');
      opening.style.removeProperty('--hero-drag-x');
      opening.style.removeProperty('--hero-drag-y');
    }, options);
    opening.addEventListener('animationend', event => {
      if (event.animationName !== 'hero-scene-cycle' || event.target !== scenes[activeScene]) return;
      selectScene((activeScene + 1) % scenes.length);
    }, options);
    const updateVisibility = () => opening.toggleAttribute('data-background', document.hidden);
    document.addEventListener('visibilitychange', updateVisibility, options);
    updateVisibility();
    openingObserver.observe(opening);
  }
  const animations = new Set();
  const animate = (element, frames, timing) => {
    if (reduced) return;
    const animation = element.animate(frames, timing);
    animations.add(animation);
    animation.addEventListener('finish', () => animations.delete(animation), { once: true });
  };
  const contactPet = root.querySelector('.contact-pet');
  contactPet.addEventListener('click', () => {
    contactPet.classList.add('is-cuddling');
  }, options);

  const form = root.querySelector('#contact-form');
  const success = root.querySelector('.contact-success');
  form.addEventListener('growe:inquiry-sent', event => {
    const { email, service, message } = event.detail;
    form.hidden = true;
    success.hidden = false;
    success.querySelector('.contact-success-message').textContent = `${message}\n\n${contact.contactEmail}: ${email}${service ? `\n${contact.selectedService}: ${service}` : ''}`;
    success.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' });
    success.focus({ preventScroll: true });
    contactPet.classList.remove('is-cuddling');
    animate(contactPet.querySelector('.contact-pet-figure'), [
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(2px) scale(1.05,.93)', offset: .2 },
      { transform: 'translateY(-15px) rotate(-4deg)', offset: .5 },
      { transform: 'translateY(1px) scale(1.03,.96)', offset: .8 },
      { transform: 'translateY(0) scale(1)' },
    ], { duration: 800, easing: 'ease-in-out' });
    animate(contactPet.querySelector('.pet-face-normal'), [{ opacity: 1 }, { opacity: 0, offset: .2 }, { opacity: 0, offset: .8 }, { opacity: 1 }], { duration: 1300 });
    animate(contactPet.querySelector('.pet-face-laugh'), [{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .8 }, { opacity: 0 }], { duration: 1300 });
  }, options);
  success.querySelector('[data-new-inquiry]').addEventListener('click', () => {
    success.hidden = true;
    form.hidden = false;
    form.querySelector('#service').focus({ preventScroll: true });
  }, options);
  return () => {
    cleanupLogo();
    openingObserver.disconnect();
    animations.forEach(animation => animation.cancel());
  };
}
