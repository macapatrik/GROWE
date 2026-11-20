import { useEffect, useRef } from 'react';
import { contactCopy } from './contact-copy';
import './source.css';
import { setupMotion } from './motion';
import './motion.css';
import { setupStudioDetails } from './studio-details';
import { setupGrowthFeatures } from './growth-features';
import { setupVisualPolish } from './visual-polish';
import './project-slider.css';
import './studio-intro.css';
import './pricing-selector.css';
import './difference.css';
import './testimonial-slider.css';

export function App({ page, language }) {
  const host = useRef(null);
  useEffect(() => {
    const root = host.current;
    const contact = contactCopy[language];
    root.innerHTML = page;
    const abort = new AbortController();
    const options = { signal: abort.signal };
    document.addEventListener('pointerdown', () => {
      root.dataset.inputMode = 'pointer';
    }, { ...options, capture: true });
    document.addEventListener('keydown', event => {
      const navigationKey = ['Tab', 'Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key);
      if (navigationKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
        root.dataset.inputMode = 'keyboard';
      }
    }, { ...options, capture: true });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motion = setupMotion(root, reduced, options, language);
    const cleanupStudio = setupStudioDetails(root, reduced, options, language);
    const cleanupGrowth = setupGrowthFeatures(root, reduced, options, language);
    const cleanupPolish = setupVisualPolish(root, reduced, options, contact);
    const mascot = root.querySelector('.growe-mascot');
    mascot.addEventListener('pointerdown', () => mascot.setAttribute('data-pointer-focus', ''), options);
    mascot.addEventListener('keydown', () => mascot.removeAttribute('data-pointer-focus'), options);
    mascot.addEventListener('blur', () => mascot.removeAttribute('data-pointer-focus'), options);
    mascot.addEventListener('click', () => {
      // Let each landing finish, even when someone clicks repeatedly.
      mascot.classList.add('is-jumping');
    }, options);
    mascot.querySelector('img').addEventListener('animationend', () => {
      mascot.classList.remove('is-jumping');
    }, options);
    const contactMascot = root.querySelector('.contact-pet');
    contactMascot.addEventListener('pointerdown', () => contactMascot.setAttribute('data-pointer-focus', ''), options);
    contactMascot.addEventListener('keydown', () => contactMascot.removeAttribute('data-pointer-focus'), options);
    contactMascot.addEventListener('blur', () => contactMascot.removeAttribute('data-pointer-focus'), options);
    contactMascot.querySelector('.contact-pet-figure').addEventListener('animationend', event => {
      if (event.target.matches('.contact-pet-figure')) contactMascot.classList.remove('is-cuddling');
    }, options);
    function setPanel(button, open) {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      if (!panel) return;
      const wasOpen = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(open));
      button.toggleAttribute('data-panel-open', open);
      panel.hidden = false;
      panel.classList.add('motion-panel');
      panel.toggleAttribute('inert', !open);
      panel.setAttribute('aria-hidden', String(!open));
      panel.style.gridTemplateRows = open ? '1fr' : '0fr';
      panel.style.opacity = open ? '1' : '0';
      const icon = button.querySelector('svg');
      icon?.classList.toggle('rotate-180', open);
      if (open && !wasOpen) motion.revealPanel(panel);
    }
    root.querySelectorAll('button[aria-controls]').forEach(button => {
      setPanel(button, button.getAttribute('aria-expanded') === 'true');
      button.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') !== 'true';
        const section = button.closest('section');
        section.querySelectorAll('button[aria-controls]').forEach(other => setPanel(other, other === button && open));
      }, options);
    });

    const navLinks = [...root.querySelectorAll('.nimbus-item')];
    const navTargets = new Set(navLinks.map(link => link.hash.slice(1)));
    const featuredWork = 'vybrane-realizace';
    const sections = [...root.querySelectorAll('section[id]')]
      .filter(section => navTargets.has(section.id) || section.id === 'prace');
    const dock = root.querySelector('.growe-mobile-dock');
    const form = root.querySelector('#contact-form');
    let frame;
    function update() {
      let id = 'top';
      for (const sec of sections) {
        if (sec.getBoundingClientRect().top < window.innerHeight * .4) id = sec.id;
      }
      const activeTarget = id === 'prace' ? featuredWork : id;
      navLinks.forEach(a => {
        if (a.hash === '#' + activeTarget) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      const formBounds = form.getBoundingClientRect();
      const dockTop = dock.getBoundingClientRect().top;
      dock.toggleAttribute('data-contact-overlap', formBounds.top < window.innerHeight && formBounds.bottom > dockTop);
      motion.updateNavigation();
    }
    function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); }
    window.addEventListener('scroll', schedule, { ...options, passive:true });
    window.addEventListener('resize', schedule, options);
    update();
    const contactEndpoint = import.meta.env.VITE_CONTACT_ENDPOINT || '/contact.php';
    form.querySelector('button[type=submit]').textContent = contact.submit;
    root.querySelector('#form-status').textContent = contact.responseTime;
    let submitting = false;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (submitting) return;
      const data = new FormData(form);
      const button = form.querySelector('button[type=submit]');
      const status = root.querySelector('#form-status');
      submitting = true;
      button.disabled = true;
      button.textContent = contact.sending;
      status.textContent = contact.sendingStatus;
      data.set('lang', language);
      try {
        const response = await fetch(contactEndpoint, {
          method: 'POST', body: new URLSearchParams(data), signal: abort.signal,
          headers: { Accept: 'application/json' },
        });
        const result = await response.json();
        if (!response.ok || result.ok !== true) throw new Error(result.message || contact.failed);
        status.textContent = result.message;
        form.reset();
        form.dispatchEvent(new CustomEvent('growe:inquiry-sent', { detail: {
          email: data.get('email'), service: data.get('service'), message: result.message,
        } }));
      } catch (error) {
        if (error.name !== 'AbortError') status.textContent = (error instanceof SyntaxError || error instanceof TypeError)
          ? contact.unavailable
          : error.message;
      } finally {
        submitting = false;
        button.disabled = false;
        button.textContent = contact.submit;
      }
    }, options);
    return () => { abort.abort(); cancelAnimationFrame(frame); motion.cleanup(); cleanupStudio(); cleanupGrowth(); cleanupPolish(); };
  }, [page, language, setupMotion, setupStudioDetails, setupGrowthFeatures, setupVisualPolish]);
  return <div ref={host} dangerouslySetInnerHTML={{ __html: page }} />;
}
