import { createLiquidNav } from './liquid-nav';

// Recreate the reference's motion locally, without its application scripts.
export function setupMotion(root, reduced, options, language) {
  const animations = new Set();
  function animate(element, frames, timing) {
    if (reduced) return;
    const animation = element.animate(frames, timing);
    animations.add(animation);
    animation.addEventListener('finish', () => animations.delete(animation), { once: true });
    animation.addEventListener('cancel', () => animations.delete(animation), { once: true });
    return animation;
  }

  const navs = [...root.querySelectorAll('.nimbus-nav')];
  const liquidNav = createLiquidNav(navs, reduced, options);
  const effects = ['glow', 'pop', 'spin', 'pop', 'pop', 'wave'];
  function updateNavigation() {
    liquidNav.update();
  }
  navs.forEach(nav => {
    nav.querySelectorAll('.nimbus-item').forEach((link, index) => {
      const icon = link.querySelector('.nv-ico');
      icon.removeAttribute('data-fx');
      const activate = () => {
        if (reduced) return;
        icon.removeAttribute('data-fx');
        void icon.offsetWidth;
        icon.dataset.fx = effects[index];
      };
      link.addEventListener('click', activate, options);
    });
  });

  // Keep panels in layout at zero rows so closing can animate as well as opening.
  root.querySelectorAll('.audience-panel').forEach(panel => {
    panel.style.removeProperty('height');
    const paragraph = panel.querySelector('p');
    const text = paragraph.textContent;
    paragraph.textContent = '';
    paragraph.setAttribute('aria-label', text);
    let index = 0;
    text.split(/(\s+)/).forEach(word => {
      if (/^\s+$/.test(word)) { paragraph.append(word); return; }
      const group = document.createElement('span');
      group.className = 'motion-word';
      group.setAttribute('aria-hidden', 'true');
      for (const char of word) {
        const span = document.createElement('span');
        span.textContent = char;
        span.dataset.char = index++;
        group.append(span);
      }
      paragraph.append(group);
    });
  });
  function revealPanel(panel) {
    panel.querySelectorAll('[data-char]').forEach((span, index) => {
      span.getAnimations().forEach(animation => animation.cancel());
      animate(span, [{ opacity: 0, filter: 'blur(5px)' }, { opacity: 1, filter: 'blur(0)' }],
        { duration: 350, delay: index * 5, fill: 'backwards', easing: 'ease-out' });
    });
  }

  // Native observers trigger the same folder assembly and staggered reveals on entry.
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      if (target.matches('.gf-root')) target.dataset.entered = 'true';
      else if (target.matches('.audience-panel')) revealPanel(target);
      else animate(target, [{ opacity: 0, filter: 'blur(6px)', transform: 'translateY(12px)' },
        { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' }],
      { duration: 600, delay: Number(target.dataset.delay || 0), easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      observer.unobserve(target);
    });
  }, { threshold: 0.12 });
  root.querySelectorAll('.gf-root').forEach(folder => {
    if (reduced) folder.dataset.entered = 'true';
    else { folder.removeAttribute('data-entered'); observer.observe(folder); }
  });
  root.querySelectorAll('.audience-panel').forEach(panel => observer.observe(panel));
  const faqTitle = root.querySelector('#faq-title');
  const faqText = faqTitle.textContent;
  faqTitle.textContent = '';
  faqTitle.setAttribute('aria-label', faqText);
  faqText.split(' ').forEach((word, index) => {
    const span = document.createElement('span');
    span.className = 'motion-word';
    span.textContent = word;
    span.setAttribute('aria-hidden', 'true');
    span.dataset.delay = String(index * 80);
    faqTitle.append(span, ' ');
    observer.observe(span);
  });

  const contactPet = root.querySelector('.contact-pet');
  const loopObserver = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        loopObserver.unobserve(target);
        animate(target, [
          { transform: 'translateX(-95px) rotate(-10deg)', opacity: 0 },
          { transform: 'translate(-70px,-8px) rotate(8deg)', opacity: 1, offset: .2 },
          { transform: 'translate(-46px,0) rotate(-8deg)', offset: .4 },
          { transform: 'translate(-22px,-8px) rotate(6deg)', offset: .6 },
          { transform: 'translate(0,2px) scale(1.08,.9)', offset: .8 },
          { transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1 },
        ], { duration: 1350, easing: 'ease-in-out', fill: 'backwards' });
      }
    });
  }, { threshold: .2 });
  loopObserver.observe(contactPet);

  return { updateNavigation, revealPanel,
    cleanup() { liquidNav.cleanup(); observer.disconnect(); loopObserver.disconnect(); animations.forEach(animation => animation.cancel()); },
  };
}
