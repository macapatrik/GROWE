import { readFileSync } from 'node:fs';

const readJson = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const services = readJson('../src/services.json');
const projects = readJson('../design-inputs/projects.json');
const englishCopy = '../src/content.en.json';
const origin = 'https://www.growe.cz';
const siteImage = origin + '/growe-share-v3.jpg';
const pathFor = (service, english) => english
  ? `/en/services/${service.englishSlug}/`
  : `/sluzby/${service.slug}/`;

const escapeHtml = value => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

function renderDetail(service, english) {
  const copy = english ? readJson(englishCopy) : {};
  const t = text => escapeHtml(copy[text] ?? text);
  const home = english ? '/en/' : '/';
  const canonical = origin + pathFor(service, english);
  const title = t(service.title) + (english ? ' | Growe digital studio' : ' | Digitální studio Growe');
  const description = t(service.description);
  const consult = `${home}?sluzba=${service.slug}#konzultace`;
  const gallery = (service.projects ?? []).map(name => {
    const project = name === 'BRKYS’ CRIB'
      ? { name, category: 'Rezervační aplikace', image: '/assets/hero-brkys-iphone-scene.webp', url: 'https://brkyscrib.cz/' }
      : projects.find(item => item.name === name);
    const href = name === 'Labara' ? 'https://www.labara.cz/cs/' : project.url;
    const label = href
      ? `<a href="${href}">${t(name)}<span aria-hidden="true">↗</span></a>`
      : t(name);
    return `<article class="service-project">
      <img src="${project.image}" alt="" loading="lazy" decoding="async">
      <div><h3>${label}</h3><p>${t(project.category)}</p></div>
    </article>`;
  }).join('\n');
  return `<!doctype html>
<html lang="${english ? 'en' : 'cs'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#fafafa">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="cs" href="${origin + pathFor(service, false)}">
  <link rel="alternate" hreflang="en" href="${origin + pathFor(service, true)}">
  <link rel="icon" href="/favicon.ico?v=3" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/growe-enter-32.png">
    <link rel="icon" type="image/svg+xml" href="/icons/growe-enter.svg">
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/growe-enter-180.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Growe">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${siteImage}">
  <meta property="og:image:secure_url" content="${siteImage}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${t('Growe — weby, e-shopy a design na míru')}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${siteImage}">
  <meta name="twitter:image:alt" content="${t('Growe — weby, e-shopy a design na míru')}">
  <link rel="stylesheet" href="/service-detail.css">
  <link rel="stylesheet" href="/consultation-cta.css">
</head>
<body>
  <header class="service-header">
    <a class="service-logo" href="${home}" aria-label="Growe · ${t('Úvod')}"><img src="/assets/mascot/growe-enter.webp" width="42" height="42" alt="">growe™</a>
    <div class="service-header-actions">
      <a class="service-lang" href="${pathFor(service, !english)}" lang="${english ? 'cs' : 'en'}" hreflang="${english ? 'cs' : 'en'}" aria-label="${english ? 'Čeština' : 'English'}">${english ? 'CZ' : 'EN'}</a>
      <a class="consultation-cta consultation-cta-header" href="${consult}"><span>${t('Konzultace')}</span><span class="consultation-cta-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2v-9.5A8.5 8.5 0 0 1 10.5 4H13a8 8 0 0 1 8 7.5Z"/><path d="M7 10h9M7 14h6"/></svg></span></a>
    </div>
  </header>
  <main class="service-main">
    <a class="service-back" href="${home}#reseni"><span aria-hidden="true">←</span> ${t('Všechny služby')}</a>
    <div class="service-intro">
      <div>
        <h1>${t(service.title)}</h1>
        <p>${description}</p>
        <div class="service-actions">
          <a class="consultation-cta" href="${consult}"><span>${t('Domluvit konzultaci')}</span><span class="consultation-cta-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2v-9.5A8.5 8.5 0 0 1 10.5 4H13a8 8 0 0 1 8 7.5Z"/><path d="M7 10h9M7 14h6"/></svg></span></a>
          <a class="service-price" href="${home}#cenik">${t('Orientační rozpočty')}</a>
        </div>
      </div>
      <section class="service-scope" aria-labelledby="service-scope-title">
        <h2 id="service-scope-title">${t('Co služba zahrnuje')}</h2>
        <ul>${service.scope.map(item => `<li>${t(item)}</li>`).join('')}</ul>
      </section>
    </div>
    ${gallery ? `<section class="service-work">
      <h2>${t('Vybrané projekty')}</h2>
      <div class="service-projects">${gallery}</div>
    </section>` : ''}
    <section class="service-next-step" aria-labelledby="service-next-title">
      <h2 id="service-next-title">${t('Pojďme probrat váš projekt.')}</h2>
      <p>${t('Ozveme se zpravidla do jednoho pracovního dne.')}</p>
      <a class="consultation-cta" href="${consult}"><span>${t('Probrat můj nápad')}</span></a>
    </section>
    <nav class="service-related" aria-labelledby="service-related-title">
      <h2 id="service-related-title">${t('Další služby')}</h2>
      <ul>${services.filter(item => item !== service).map(item => `<li><a href="${pathFor(item, english)}">${t(item.title)}</a></li>`).join('')}</ul>
    </nav>
  </main>
  <footer class="service-footer"><span>Patrik Máca · ${english ? 'Business ID' : 'IČO'} 17738750</span><a href="mailto:info@growe.cz">info@growe.cz</a><nav class="service-legal" aria-label="${english ? 'Legal information' : 'Právní informace'}"><a href="${english ? '/en/privacy/' : '/ochrana-osobnich-udaju/'}">${english ? 'Privacy policy' : 'Ochrana osobních údajů'}</a><a href="${english ? '/en/cookies/' : '/cookies/'}">Cookies</a><a href="${english ? '/en/legal-notice/' : '/provozovatel/'}">${english ? 'Legal notice' : 'Provozovatel webu'}</a></nav></footer>
</body>
</html>`;
}

export function localizeServiceLinks(page) {
  for (const [czech, english] of [['/ochrana-osobnich-udaju/', '/en/privacy/'], ['/cookies/', '/en/cookies/'], ['/provozovatel/', '/en/legal-notice/']]) {
    page = page.replaceAll(`href="${czech}"`, `href="${english}"`);
  }
  for (const service of services) {
    page = page.replaceAll(`href="${pathFor(service, false)}"`, `href="${pathFor(service, true)}"`);
  }
  return page;
}

export function servicePages() {
  const routes = new Map(services.flatMap(service =>
    [false, true].map(english => [pathFor(service, english), { service, english }]),
  ));
  const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['/', '/en/', '/ochrana-osobnich-udaju/', '/cookies/', '/provozovatel/', '/en/privacy/', '/en/cookies/', '/en/legal-notice/', ...routes.keys()].map(path => `  <url><loc>${origin + path}</loc></url>`).join('\n')}
</urlset>
`;

  return {
    name: 'growe-service-pages',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.method !== 'GET' && request.method !== 'HEAD') return next();
        const path = new URL(request.url, 'http://localhost').pathname;
        const route = routes.get(path.replace(/\/?$/, '/'));
        if (!route && path !== '/sitemap.xml') return next();
        response.setHeader('Content-Type', route ? 'text/html; charset=utf-8' : 'application/xml; charset=utf-8');
        response.end(request.method === 'HEAD' ? undefined : route ? renderDetail(route.service, route.english) : sitemap());
      });
    },
    generateBundle() {
      for (const [path, { service, english }] of routes) {
        this.emitFile({ type: 'asset', fileName: path.slice(1) + 'index.html', source: renderDetail(service, english) });
      }
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap() });
    },
  };
}
