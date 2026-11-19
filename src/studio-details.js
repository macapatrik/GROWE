import { setupProjectSlider } from './project-slider';
import { setupPricingSelector } from './pricing-selector';
import { setupTestimonialSlider } from './testimonial-slider';

export function setupStudioDetails(root, reduced, options, language) {
  const animations = new Set();
  const animate = (element, keyframes, timing) => {
    if (reduced) return;
    const animation = element.animate(keyframes, timing);
    animations.add(animation);
    animation.addEventListener('finish', () => animations.delete(animation), { once: true });
  };

  const cleanupGallery = setupProjectSlider(root, reduced, options, language);
  setupPricingSelector(root, options);
  const cleanupTestimonials = setupTestimonialSlider(root, reduced, options, language);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      observer.unobserve(target);
      if (target.matches('.why-ownership-panel')) {
        target.setAttribute('data-revealed', '');
      } else if (target.matches('.studio-proof')) {
        target.querySelectorAll('.proof-stroke').forEach((path, index) => animate(path,
          [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1000, delay: index * 350, easing: 'ease-out', fill: 'backwards' }));
      } else if (target.matches('.studio-disciplines')) {
        target.querySelectorAll('.discipline-bars i,.discipline-bars b').forEach((bar, index) => animate(bar,
          [{ transform: 'scaleY(.1)' }, { transform: 'scaleY(1)' }], { duration: 800, delay: index * 45, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
      } else if (target.matches('.project-preview')) {
        animate(target.querySelector('.project-progress i'), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1100, easing: 'ease-out' });
      } else if (target.matches('.growth-line')) {
        animate(target, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1800, easing: 'ease-in-out' });
      }
    });
  }, { threshold: .22 });
  root.querySelectorAll('.why-ownership-panel,.studio-proof,.studio-disciplines,.project-preview,.growth-line').forEach(element => observer.observe(element));

  return () => { cleanupGallery(); cleanupTestimonials(); observer.disconnect(); animations.forEach(animation => animation.cancel()); };
}
