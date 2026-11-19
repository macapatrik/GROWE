const serviceHints = {
  'Weby na míru': 'Co má váš web návštěvníkům představit a co na něm mají udělat?',
  'E-shopy': 'Co budete prodávat a komu? Máte už e-shop, nebo začínáte od nuly?',
  'Grafika a branding': 'Tvoříte novou značku, nebo chcete posunout její současný vzhled?',
  'Webové aplikace': 'Jaký proces nebo úkol má aplikace usnadnit a kdo ji bude používat?',
  'Marketing a sítě': 'Koho chcete oslovit a co má vaše propagace přinést?',
  'Video a foto': 'Co potřebujete nafotit nebo natočit a kde budete obsah používat?',
  'Nasazení vašeho webu': 'Jak jste svůj web vytvořili? Pošlete odkaz nebo popište, jaké máte podklady, a zda už máte doménu a hosting.',
};
const branches = [
  { label: 'Web nebo e-shop', choices: [
    { label: 'Představit firmu a získávat poptávky', service: 'Weby na míru' },
    { label: 'Prodávat produkty online', service: 'E-shopy' },
    { label: 'Spustit web vytvořený pomocí AI', service: 'Nasazení vašeho webu' },
  ] },
  { label: 'Značka, propagace a obsah', choices: [
    { label: 'Nový vzhled značky, logo nebo grafika', service: 'Grafika a branding' },
    { label: 'Kampaně a sociální sítě', service: 'Marketing a sítě' },
    { label: 'Fotografie a video', service: 'Video a foto' },
  ] },
  { label: 'Aplikace nebo vlastní nástroj', choices: [
    { label: 'Usnadnit práci uvnitř firmy', service: 'Webové aplikace' },
    { label: 'Vytvořit prostředí pro zákazníky', service: 'Webové aplikace' },
    { label: 'Propojit a automatizovat procesy', service: 'Webové aplikace' },
  ] },
];
const readiness = ['Zatím mám nápad', 'Mám podklady nebo návrh', 'Mám řešení, které chci zlepšit'];

const englishHints = {
  'Custom websites': 'What should visitors learn or do on your website?',
  'Online stores': 'What are you selling and to whom? Do you already have a store?',
  'Graphic design & branding': 'Are you creating a new brand or updating its current look?',
  'Web apps': 'What task should the app make easier, and who will use it?',
  'Marketing & social media': 'Who do you want to reach, and what should your campaign achieve?',
  'Photography & video': 'What do you need photographed or filmed, and where will you use it?',
  'Website deployment': 'How did you build your site? Share a link or describe what you have ready and whether you already have a domain and hosting.',
};
const englishBranches = [
  { label: 'Website or online store', choices: [
    { label: 'Showcase my business and get enquiries', service: 'Custom websites' },
    { label: 'Sell products online', service: 'Online stores' },
    { label: 'Launch an AI-built website', service: 'Website deployment' },
  ] },
  { label: 'Brand, marketing and content', choices: [
    { label: 'A new look, logo or graphics for my brand', service: 'Graphic design & branding' },
    { label: 'Campaigns and social media', service: 'Marketing & social media' },
    { label: 'Photography and video', service: 'Photography & video' },
  ] },
  { label: 'App or custom tool', choices: [
    { label: 'Make work easier for my team', service: 'Web apps' },
    { label: 'Build a space for my customers', service: 'Web apps' },
    { label: 'Connect and automate processes', service: 'Web apps' },
  ] },
];
const englishReadiness = ['I have an idea', 'I have materials or a design', 'I have something I’d like to improve'];

export function setupGrowthFeatures(root, reduced, options, language) {
  const english = language === 'en';
  const hints = english ? englishHints : serviceHints;
  const categories = english ? englishBranches : branches;
  const stages = english ? englishReadiness : readiness;
  const form = root.querySelector('#contact-form');
  const service = form.querySelector('#service');
  const message = form.querySelector('#message');
  const hint = form.querySelector('#service-hint');
  const guide = root.querySelector('#service-guide');
  const caseDialog = root.querySelector('#case-dialog');
  let answers = [];
  const updateHint = () => {
    hint.textContent = hints[service.value] || (english
      ? 'Briefly describe your idea. We’ll help you choose the right approach.'
      : 'Stačí stručně popsat nápad. S výběrem řešení vám pomůžeme.');
    message.placeholder = hints[service.value] || (english
      ? 'What would you like to build or improve?'
      : 'Co chcete vytvořit nebo zlepšit?');
  };
  const requestedSlug = new URLSearchParams(window.location.search).get('sluzba');
  const requestedService = [...service.options].find(item => item.dataset.serviceSlug === requestedSlug);
  if (requestedService) {
    service.value = requestedService.value;
    updateHint();
  }
  service.addEventListener('change', updateHint, options);
  form.addEventListener('reset', () => queueMicrotask(updateHint), options);
  const dialogs = [guide, caseDialog];
  const closeDialogs = () => dialogs.forEach(dialog => { if (dialog.open) dialog.close(); });
  const openDialog = dialog => {
    closeDialogs();
    document.documentElement.classList.add('growe-dialog-open');
    dialog.showModal();
  };
  dialogs.forEach(dialog => {
    dialog.addEventListener('close', () => {
      if (!dialogs.some(item => item.open)) document.documentElement.classList.remove('growe-dialog-open');
    }, options);
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }, options);
  });
  function enquire(value, context = '') {
    service.value = Object.hasOwn(hints, value) ? value : '';
    updateHint();
    if (context && !message.value.includes(context)) message.value = [message.value.trim(), context].filter(Boolean).join('\n\n');
    closeDialogs();
    form.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    form.focus({ preventScroll: true });
  }
  function option(label, action, primary = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = primary ? 'feature-primary' : 'guide-choice';
    button.textContent = label;
    button.addEventListener('click', action, options);
    return button;
  }
  function renderGuide(focus = false) {
    const step = answers.length;
    const content = root.querySelector('#guide-content');
    const progress = root.querySelector('#guide-progress');
    const back = root.querySelector('#guide-back');
    progress.textContent = english
      ? (step < 3 ? `Question ${step + 1} of 3` : 'Recommended service')
      : (step < 3 ? `Otázka ${step + 1} ze 3` : 'Váš směr spolupráce');
    progress.style.setProperty('--guide-progress', `${Math.min(100, step / 3 * 100)}%`);
    back.hidden = step === 0;
    content.replaceChildren();
    const title = document.createElement('h3');
    title.tabIndex = -1;
    if (step < 3) {
      const questions = english
        ? ['What can we help you with?', 'What would you like to achieve?', 'What do you already have?']
        : ['S čím vám můžeme pomoci?', 'Co má být výsledkem?', 'Co už máte připravené?'];
      title.textContent = questions[step];
      content.append(title);
      const choices = step === 0 ? categories : step === 1 ? answers[0].choices : stages;
      choices.forEach(choice => content.append(option(typeof choice === 'string' ? choice : choice.label, () => {
        answers.push(choice);
        renderGuide(true);
      })));
    } else {
      const selected = answers[1].service;
      title.textContent = selected;
      const copy = document.createElement('p');
      copy.className = 'guide-result-copy';
      copy.textContent = english
        ? `Based on your answers, we recommend ${selected.toLowerCase()}. We’ll work out the scope together based on your idea and materials.`
        : `Z vašich odpovědí vychází služba „${selected}“. Konkrétní rozsah společně doladíme podle vašeho nápadu a podkladů.`;
      const summary = english
        ? `Selected with the Growe guide:\nGoal: ${answers[1].label}\nWhat’s ready: ${answers[2]}`
        : `Vybráno s průvodcem Growe:\nZáměr: ${answers[1].label}\nPřipravenost: ${answers[2]}`;
      content.append(title, copy, option(english ? 'Discuss this project' : 'Probrat tento směr', () => enquire(selected, summary), true));
      const note = document.createElement('p');
      note.className = 'guide-result-note';
      note.textContent = english
        ? 'We’ll add your selection to the enquiry form for you to review.'
        : 'Výběr přeneseme do poptávky. Nic se zatím neodesílá.';
      content.append(note);
    }
    if (focus) title.focus();
  }
  root.querySelector('#guide-back').addEventListener('click', () => { answers.pop(); renderGuide(true); }, options);
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-open-guide],[data-close-dialog],[data-enquire-service],[data-case-study]');
    if (!button) return;
    if (button.hasAttribute('data-close-dialog')) button.closest('dialog').close();
    else if (button.hasAttribute('data-open-guide')) {
      answers = [];
      renderGuide();
      openDialog(guide);
    } else if (button.hasAttribute('data-enquire-service')) {
      enquire(button.dataset.enquireService, button.dataset.enquireContext);
    } else {
      const key = button.dataset.caseStudy;
      caseDialog.querySelectorAll('[data-case]').forEach(article => { article.hidden = article.dataset.case !== key; });
      root.querySelector('#case-dialog-title').textContent = key === 'begin' ? 'Begin Reselling' : 'Labara';
      openDialog(caseDialog);
      caseDialog.scrollTop = 0;
    }
  }, options);
  return () => {
    closeDialogs();
    document.documentElement.classList.remove('growe-dialog-open');
  };
}
