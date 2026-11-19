import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('dist/client/index.html', root), 'utf8');
const page = readFileSync(new URL('src/page.html', root), 'utf8');
test('the enquiry includes an optional, mobile-friendly callback phone in both languages', () => {
  for (const path of ['index.html', 'en/index.html']) {
    const content = readFileSync(new URL('dist/client/' + path, root), 'utf8');
    const phone = content.match(/<input\b[^>]*id="phone"[^>]*>/)?.[0];
    assert.ok(phone, path);
    for (const attribute of ['name="phone"', 'type="tel"', 'inputmode="tel"', 'autocomplete="tel"', 'maxlength="80"']) assert.ok(phone.includes(attribute), attribute);
    assert.doesNotMatch(phone, /\brequired\b/);
    assert.match(content, /for="phone"/);
    assert.match(content, path.startsWith('en/') ? /for="phone"[^>]*>Phone / : /for="phone"[^>]*>Telefon /);
    assert.ok(content.includes(path.startsWith('en/') ? '(optional)' : '(nepovinné)'));
  }
});
test('home and service pages share versioned icons and complete social cards', () => {
  const services = JSON.parse(readFileSync(new URL('src/services.json', root), 'utf8'));
  const pages = ['index.html', 'en/index.html', ...services.flatMap(s => [`sluzby/${s.slug}/index.html`, `en/services/${s.englishSlug}/index.html`])];
  for (const path of pages) {
    const content = readFileSync(new URL('dist/client/' + path, root), 'utf8');
    assert.match(content, /href="\/icons\/growe-enter.svg"/);
    assert.match(content, /href="\/icons\/growe-enter-180.png"/);
    const image = content.match(/property="og:image" content="([^"]+)"/)[1];
    assert.equal(image, 'https://www.growe.cz/growe-share-v3.jpg');
    assert.ok(content.includes(`name="twitter:image" content="${image}"`));
    assert.match(content, /property="og:image:width" content="1200"/);
    assert.match(content, /property="og:image:height" content="630"/);
  }
  for (const asset of ['favicon.ico','icons/growe-enter.svg','icons/growe-enter-32.png','icons/growe-enter-180.png','growe-share-v3.jpg','404.css']) assert.ok(existsSync(new URL('dist/client/'+asset,root)),asset);
});
test('published form submits directly and never opens an email draft', () => {
  const entry = html.match(/<script[^>]+src="([^"]+\.js)"/)[1];
  const script = readFileSync(new URL('dist/client' + entry, root), 'utf8');
  assert.ok(script.includes('/contact.php'));
  assert.doesNotMatch(script, /mailto:info@growe\.cz\?subject=/);
  assert.doesNotMatch(html, /Připravit poptávku|Otevřeme váš e-mail/);
  assert.match(html, /Odeslat poptávku/);
  const english = readFileSync(new URL('dist/client/en/index.html', root), 'utf8');
  assert.match(english, /Send enquiry/);
  assert.doesNotMatch(english, /Prepare enquiry|open your email app with a draft/);
});
test('mobile price actions preserve the same enquiry service and context as the full offer', () => {
  const quick = [...page.matchAll(/<button class="pricing-start pricing-quick-start"([^>]+)>/g)];
  const full = [...page.matchAll(/<button class="pricing-start"([^>]+)>/g)];
  assert.equal(quick.length, 6);
  assert.equal(full.length, 6);
  quick.forEach((match, index) => assert.equal(match[1], full[index][1]));
});
test('every service detail keeps its selected service when starting an enquiry', () => {
  const services = JSON.parse(readFileSync(new URL('src/services.json', root), 'utf8'));
  for (const service of services) for (const english of [false, true]) {
    const path = english ? `en/services/${service.englishSlug}` : `sluzby/${service.slug}`;
    const detail = readFileSync(new URL(`dist/client/${path}/index.html`, root), 'utf8');
    const finalAction = detail.match(/<section class="service-next-step"[\s\S]*?<a[^>]+href="([^"]+)"/);
    assert.ok(finalAction, path);
    assert.equal(finalAction[1], `${english ? '/en/' : '/'}?sluzba=${service.slug}#konzultace`);
  }
});
test('built HTML contains the content before JavaScript runs', () => {
  assert.match(html, /id="hero-title"/);
  assert.match(html, /id="contact-form"/);
  assert.match(html, /Begin Reselling/);
  assert.equal((html.match(/<h1\b/g)||[]).length, 1);
  assert.doesNotMatch(page, /avelle|helsinki/i);
});
test('English has its own prerendered page and both languages link to each other', () => {
  const english = readFileSync(new URL('dist/client/en/index.html', root), 'utf8');
  assert.match(english, /<html lang="en">/);
  assert.match(english, /rel="canonical" href="https:\/\/www.growe.cz\/en\/"/);
  assert.match(english, /Websites and design that help you grow/);
  assert.match(english, /class="language-switch" href="\/" lang="cs"/);
  assert.match(html, /class="language-switch" href="\/en\/" lang="en"/);
  for (const id of ['reseni', 'prace', 'konzultace']) {
    assert.match(english, new RegExp(`id="${id}"`));
  }
  assert.match(readFileSync(new URL('dist/client/sitemap.xml', root), 'utf8'), /<loc>https:\/\/www.growe.cz\/en\/<\/loc>/);
});
test('canonical, sharing image, sitemap and structured data agree', () => {
  assert.match(html, /rel="canonical" href="https:\/\/www.growe.cz\/"/);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema.url, 'https://www.growe.cz/');
  const imageUrl = html.match(/property="og:image" content="([^"]+)"/)[1];
  const twitterImage = html.match(/name="twitter:image" content="([^"]+)"/)[1];
  assert.equal(imageUrl, twitterImage);
  assert.ok(existsSync(new URL('dist/client' + new URL(imageUrl).pathname, root)));
  for (const file of ['robots.txt','sitemap.xml','growe-social-preview-v2.jpg','favicon.svg','apple-touch-icon.png','404.html','no-script.css']) {
    assert.ok(existsSync(new URL('dist/client/'+file,root)), file);
  }
});
test('all local page assets and fragment targets exist and IDs are unique', () => {
  const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [,src] of page.matchAll(/(?:src|href)="(\/[^"#]+)"/g)) {
    assert.ok(existsSync(new URL('dist/client'+src,root)),src);
  }
  for (const [,id] of page.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id),id);
});
test('web mascot files stay below 100 kB each and originals stay out of build', () => {
  for (const name of ['growe-enter','growe-enter-laugh']) {
    assert.ok(statSync(new URL('dist/client/assets/mascot/'+name+'.webp',root)).size < 100000);
    assert.ok(!existsSync(new URL('dist/client/assets/mascot/'+name+'.png',root)));
  }
});

test('every service link opens a localised detail included in the build and sitemap', () => {
  const sitemap = readFileSync(new URL('dist/client/sitemap.xml', root), 'utf8');
  for (const [home, lang, prefix] of [['/', 'cs', '/sluzby/'], ['/en/', 'en', '/en/services/']]) {
    const homepage = readFileSync(new URL(`dist/client${home}index.html`, root), 'utf8');
    const cards = [...homepage.matchAll(/class="gf-hit" href="([^"]+)"/g)].map(match => match[1]);
    const internalLinks = [...homepage.matchAll(/href="(\/(?:en\/services|sluzby)\/[^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(cards).size, 7);
    assert.equal(internalLinks.length, 22);
    assert.ok(internalLinks.every(path => cards.includes(path)));
    assert.doesNotMatch(homepage, /href="https:\/\/www\.growe\.cz\/sluzby\//);
    for (const route of cards) {
      assert.ok(route.startsWith(prefix), route);
      const detail = readFileSync(new URL(`dist/client${route}index.html`, root), 'utf8');
      assert.ok(detail.includes(`<html lang="${lang}">`));
      assert.ok(detail.includes(`rel="canonical" href="https://www.growe.cz${route}"`));
      assert.ok(sitemap.includes(`<loc>https://www.growe.cz${route}</loc>`));
      assert.match(detail, /id="service-scope-title"/);
      const [, slug] = detail.match(/\?sluzba=([^#]+)#konzultace/);
      assert.ok(homepage.includes(`data-service-slug="${slug}"`));
      for (const [, asset] of detail.matchAll(/<img src="(\/[^"]+)"/g)) {
        assert.ok(existsSync(new URL('dist/client' + asset, root)), asset);
      }
    }
  }
});

test('desktop and mobile menu links follow section order in both languages', () => {
  const english = readFileSync(new URL('dist/client/en/index.html', root), 'utf8');
  for (const document of [html, english]) {
    const menus = [...document.matchAll(/<nav aria-label="(?:Hlavní navigace|Main navigation)"[\s\S]*?<\/nav>/g)];
    assert.equal(menus.length, 2);
    for (const [menu] of menus) {
      const targets = [...menu.matchAll(/<a\b[^>]*class="nimbus-item"[^>]*href="#([^"]+)"/g)].map(match => match[1]);
      assert.equal(targets.length, 6);
      const positions = targets.map(id => document.indexOf(`id="${id}"`));
      assert.ok(positions.every(position => position >= 0));
      assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
      assert.equal(new Set(targets).size, targets.length);
    }
  }
});

test('privacy information is readable without scripts and reachable from both language enquiries', () => {
  for (const english of [false, true]) {
    const home = readFileSync(new URL(`dist/client/${english ? 'en/' : ''}index.html`, root), 'utf8');
    const routes = english ? ['/en/privacy/', '/en/cookies/', '/en/legal-notice/'] : ['/ochrana-osobnich-udaju/', '/cookies/', '/provozovatel/'];
    const form = home.match(/<form\b[\s\S]*?<\/form>/)[0];
    assert.ok(form.includes(`href="${routes[0]}"`));
    assert.doesNotMatch(form, /type="checkbox"/);
    for (const route of routes) {
      assert.ok(home.includes(`href="${route}"`));
      const legal = readFileSync(new URL(`dist/client${route}index.html`, root), 'utf8');
      assert.ok(legal.includes(`<html lang="${english ? 'en' : 'cs'}">`));
      assert.equal((legal.match(/<h1\b/g) || []).length, 1);
      assert.match(legal, /Patrik Máca/);
      assert.match(legal, /17738750/);
      assert.doesNotMatch(legal, /<script\b/);
      for (const [, href] of legal.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
        const target = href.split('?')[0];
        assert.ok(existsSync(new URL(`dist/client${target}`, root)), target);
      }
    }
    const privacy = readFileSync(new URL(`dist/client${routes[0]}index.html`, root), 'utf8');
    assert.ok(privacy.includes(english ? '12 months after the last communication' : '12 měsíců od poslední komunikace'));
    assert.match(privacy, /INTERNET CZ/);
    assert.match(privacy, /https:\/\/uoou.gov.cz\//);
  }
});
