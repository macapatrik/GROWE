const translatedAttributes = new Set([
  'alt', 'title', 'aria-label', 'placeholder', 'data-enquire-service', 'data-enquire-context',
]);
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export function localizePage(page, translations) {
  function translate(value) {
    const text = value.trim();
    const key = text.replace(/&(amp|lt|gt|quot|apos);/g, (_, name) => entities[name]);
    return Object.hasOwn(translations, key)
      ? value.replace(text, () => escapeHtml(translations[key]))
      : value;
  }

  // Only translate copy and text attributes. Keep markup, CSS and SVG data intact.
  return page.replace(/<!--[\s\S]*?-->|<(style|script)\b[^>]*>[\s\S]*?<\/\1>|<(?:[^<>"']|"[^"]*"|'[^']*')+>|[^<]+/gi, token => {
    if (/^<(?:!--|style\b|script\b)/i.test(token)) return token;
    if (!token.startsWith('<')) return translate(token);
    return token.replace(/(\s[\w:-]+)(\s*=\s*)(["'])(.*?)\3/gs, (attribute, name, equals, quote, value) => (
      translatedAttributes.has(name.trim()) ? name + equals + quote + translate(value) + quote : attribute
    ));
  });
}
