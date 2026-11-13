import { EXCLUDE_DOMAINS, PLATFORM_REGISTRY, TELEGRAM_MIN_BUDGET_RUB } from './sources.js';

export function hostMatches(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}
export function canonicalUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    if (url.hostname === 't.me') {
      url.pathname = url.pathname.replace(/^\/s\//, '/');
      url.search = '';
    }
    if (PLATFORM_REGISTRY.find(p => p.id === 'hh').domains.some(d => hostMatches(url.hostname, d))) url.search = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return url.toString().replace(/\/$/, '');
  } catch { return null; }
}
export function sourcePlatform(value) {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const platform = PLATFORM_REGISTRY.find(p => p.domains.some(d => hostMatches(url.hostname, d)));
    if (platform?.id === 'telegram' && !/^\/(?:s\/)?[\w]+\/\d+\/?$/.test(url.pathname)) return null;
    if (platform?.id === 'hh' && !/^\/vacancy\/\d+/.test(url.pathname)) return null;
    if (platform?.id === 'linkedin' && !/\/(posts|feed\/update|pulse)\//.test(url.pathname)) return null;
    if (platform?.id === 'facebook' && !/(\/posts\/|\/permalink\/|\/story\.php|\/permalink\.php)/.test(url.pathname)) return null;
    return platform?.id || null;
  } catch { return null; }
}
export function isExcludedUrl(value) {
  try {
    const url = new URL(value);
    return !['http:', 'https:'].includes(url.protocol) || EXCLUDE_DOMAINS.some(d => hostMatches(url.hostname, d));
  } catch { return true; }
}
export function hasTenderIntent(text = '') {
  const cleaned = text.toLowerCase().replace(/без\s+тендер[а-яё]*/g, '').replace(/no\s+tenders?/g, '');
  return /тендер|госзакуп|44[ -]?фз|223[ -]?фз|\btender\b|\brfp\b|электронный аукцион|конкурсный отбор/.test(cleaned);
}
/** Conservative: total project budget in RUB, never monthly salary or a ceiling. */
export function extractRubBudget(text = '') {
  const normalized = text.replace(/[\u00a0\u202f]/g, ' ');
  const amount = '(\\d+(?:[ ]\\d{3})*(?:[.,]\\d+)?)\\s*(млн|миллион[а-я]*|тыс\\.?|тысяч[а-я]*|[kк])?';
  const pattern = new RegExp(`(?:бюджет(?:\\s+проекта)?|стоимость\\s+проекта|project\\s+budget|budget)\\s*[:=—-]?\\s*(от\\s+|до\\s+|up to\\s+)?${amount}(?:\\s*[-–—]\\s*${amount})?\\s*(₽|руб(?:лей|ля|ль|\\.)?|RUB)`, 'gi');
  for (const match of normalized.matchAll(pattern)) {
    if (/до|up to/i.test(match[1] || '')) continue;
    if (/в\s+месяц|\/\s*(мес|month)|ежемесяч|зарплат|оклад/i.test(normalized.slice(Math.max(0, match.index - 35), match.index + match[0].length + 35))) continue;
    const multiplier = unit => /млн|миллион/i.test(unit || '') ? 1_000_000 : unit ? 1_000 : 1;
    const unit = match[3] || match[5];
    const min = Number(match[2].replace(/ /g, '').replace(',', '.')) * multiplier(unit);
    const max = match[4] ? Number(match[4].replace(/ /g, '').replace(',', '.')) * multiplier(match[5] || unit) : min;
    if (min > 0 && min <= max) return { rubMin: min, quote: match[0] };
  }
  return null;
}
export function isBannedLead(lead) {
  if (lead?.qualification_status === 'rejected') return true;
  if (!lead || !sourcePlatform(lead.url) || isExcludedUrl(lead.url) || (lead.apply_url && isExcludedUrl(lead.apply_url))) return true;
  if (hasTenderIntent(`${lead.title || ''} ${lead.request_text || ''}`)) return true;
  if (sourcePlatform(lead.url) === 'telegram') {
    const budget = extractRubBudget(lead.budget_evidence || '');
    return !budget || budget.rubMin < TELEGRAM_MIN_BUDGET_RUB;
  }
  return false;
}
