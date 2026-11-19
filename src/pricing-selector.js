export function setupPricingSelector(root, options) {
  const range = root.querySelector('#pricing-selector');
  const choices = [...root.querySelectorAll('[data-pricing-option]')];
  const panels = [...root.querySelectorAll('[data-pricing-panel]')];
  const select = index => {
    range.value = String(index);
    range.setAttribute('aria-valuetext', choices[index].textContent.trim());
    choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    panels.forEach(panel => { panel.hidden = Number(panel.dataset.pricingPanel) !== index; });
  };
  choices.forEach((button, i) => button.addEventListener('click', () => {
    select(i);
    const highlight = root.querySelector(`.pricing-highlight[data-pricing-panel="${i}"]`);
    if (window.matchMedia('(max-width:767px)').matches && highlight.getBoundingClientRect().top < 84) {
      highlight.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth' });
    }
  }, options));
  range.addEventListener('input', () => select(Number(range.value)), options);
  select(0);
}
