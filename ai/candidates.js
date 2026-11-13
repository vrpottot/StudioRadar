import { sourcePlatform, canonicalUrl, hostMatches } from './policy.js';

export function publicationKey(value) {
  const url = canonicalUrl(value);
  if (url && sourcePlatform(url) === 'linkedin') {
    const activity = url.match(/(?:activity-|activity:)(\d+)/)?.[1];
    if (activity) return `linkedin:${activity}`;
  }
  return url;
}

export function samePublication(first, second) {
  const canonical = canonicalUrl(first);
  if (canonical && canonical === canonicalUrl(second)) return true;
  if (sourcePlatform(first) !== 'linkedin' || sourcePlatform(second) !== 'linkedin') return false;
  const activity = value => value.match(/(?:activity-|activity:)(\d+)/)?.[1];
  return Boolean(activity(first) && activity(first) === activity(second));
}

export function sameLinkedInProfile(first, second) {
  try {
    const a = new URL(first), b = new URL(second);
    return [a, b].every(url => url.protocol === 'https:' && hostMatches(url.hostname, 'linkedin.com') && /^\/(in|company)\/[^/]+\/?$/.test(url.pathname))
      && a.pathname.replace(/\/$/, '').toLowerCase() === b.pathname.replace(/\/$/, '').toLowerCase();
  } catch { return false; }
}

/** Telegram channel pages are discovery sources, never qualified as orders. */
export function telegramFeedUrl(value) {
  try {
    const url = new URL(value);
    if (url.hostname !== 't.me' || !['http:', 'https:'].includes(url.protocol)) return null;
    const match = url.pathname.match(/^\/(?:s\/)?([a-zA-Z][\w]*)\/?$/);
    if (!match || ['share', 'joinchat', 'addstickers', 'proxy', 'login', 's'].includes(match[1].toLowerCase())) return null;
    return `https://t.me/s/${match[1]}`;
  } catch { return null; }
}

export function buyerIntentScore(candidate) {
  const text = `${candidate.title || ''} ${candidate.snippet || ''}`.toLowerCase();
  const buyer = /(?:ищем|ищу|посоветуйте|порекомендуйте|нуж(?:ен|на|ны)|ищет|требуется|в поиске|looking for|looking to (?:collaborate|partner|work)|seeking|need(?:ed)?|recommend|calling)[\s\S]{0,110}(?:студи[юяи]|подрядчик|команд[ауы]|продакш[её]?н|production (?:partner|house|team|company)|agenc(?:y|ies)|studio)/i.test(text);
  const service = /\b3d\b|\b2d\b|cgi|моуш|анимац|мульт|webgl|ai.video|ии.ролик|motion|animation/i.test(text);
  const seller = /ищу работу|предлагаю услуги|looking for clients|open to work|market report|market size/i.test(text);
  const staff = /трудовой договор|полная занятость|за месяц на руки|в штат|full.time employee/i.test(text);
  return (buyer ? 100 : 0) + (service ? 10 : 0) - (seller ? 80 : 0) - (staff ? 60 : 0);
}

/** Rank within each platform, then alternate platforms to avoid starving Telegram. */
export function prioritizeCandidates(candidates) {
  const strongest = candidates.filter(candidate => buyerIntentScore(candidate) >= 100)
    .sort((a, b) => buyerIntentScore(b) - buyerIntentScore(a));
  const queues = new Map();
  for (const candidate of candidates) {
    if (buyerIntentScore(candidate) >= 100) continue;
    const platform = sourcePlatform(candidate.url);
    if (!queues.has(platform)) queues.set(platform, []);
    queues.get(platform).push(candidate);
  }
  for (const queue of queues.values()) queue.sort((a, b) => buyerIntentScore(b) - buyerIntentScore(a));
  const ordered = [...strongest];
  while ([...queues.values()].some(queue => queue.length)) {
    const active = [...queues.values()].filter(queue => queue.length).sort((a, b) => buyerIntentScore(b[0]) - buyerIntentScore(a[0]));
    for (const queue of active) ordered.push(queue.shift());
  }
  return ordered;
}
