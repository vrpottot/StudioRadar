/** Search engines retrieve evidence; LLMs never invent fallback leads. */
import Exa from 'exa-js';
import { safeErrorMessage } from './llm.js';
import { EXCLUDE_DOMAINS, SEARCH_MAX_AGE_DAYS } from './sources.js';
import { canonicalUrl } from './policy.js';
import { sameLinkedInProfile } from './candidates.js';

const OBJECTIVE = 'Find current explicit requests from companies worldwide, including Russia and CIS, for a production studio or contractor for 3D/2D motion, CGI, AI video, animation or WebGL. Include public HH project vacancies, Telegram orders with explicit project budget >=900000 RUB, LinkedIn and Facebook posts. Exclude employee hiring, freelancer portfolios, freelance marketplaces, tenders and completed campaigns.';

export async function searchWithExa(query, maxResults = 5, objective = OBJECTIVE, options = {}, { client } = {}) {
  if (!process.env.EXA_API_KEY?.trim()) return [];
  const exa = client || new Exa(process.env.EXA_API_KEY.trim());
  const result = await exa.search(query, {
    type: 'auto', objective, numResults: maxResults,
    contents: { text: { maxCharacters: 8000 }, highlights: true },
    includeDomains: options.includeDomains, excludeDomains: EXCLUDE_DOMAINS,
    startPublishedDate: options.since
  }, { timeout: 20000 });
  return (result.results || []).map(r => ({
    title: r.title || '', url: r.url || '',
    snippet: r.text || (r.highlights || []).join('\n'),
    publishedDate: r.publishedDate || null, source: 'Exa'
  }));
}
export async function searchWithTavily(query, maxResults = 5, options = {}) {
  if (!process.env.TAVILY_API_KEY?.trim()) return [];
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST', signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY.trim(), query,
      search_depth: 'advanced', include_answer: false, include_raw_content: true,
      max_results: maxResults, include_domains: options.includeDomains,
      exclude_domains: EXCLUDE_DOMAINS, ...(options.timeRange === null ? {} : options.since ? { start_date: options.since.slice(0, 10) } : { time_range: 'month' })
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(safeErrorMessage(`Tavily HTTP ${res.status}: ${data.detail?.error || data.detail || data.error || res.statusText}`));
  return (data.results || []).map(r => ({
    title: r.title || '', url: r.url || '', snippet: r.raw_content || r.content || '',
    publishedDate: r.published_date || null, source: 'Tavily'
  }));
}

/** Verify only the linked author's exact public profile; never infer nationality from a name. */
export async function fetchAuthorContents(url, { client } = {}) {
  if (!sameLinkedInProfile(url, url) || !process.env.EXA_API_KEY?.trim()) return null;
  const exa = client || new Exa(process.env.EXA_API_KEY.trim());
  const result = await exa.getContents([url], { text: { maxCharacters: 5000 } }, { timeout: 20000 });
  return (result.results || []).find(item => sameLinkedInProfile(item.url, url) && item.text?.trim()) || null;
}

export async function searchAuthorEvidence(author, { search = searchWeb, contents = fetchAuthorContents } = {}) {
  if (!author?.url || !sameLinkedInProfile(author.url, author.url)) return null;
  try {
    const direct = await contents(author.url);
    if (direct && (!author.name || `${direct.title || ''} ${direct.text}`.toLowerCase().includes(author.name.toLowerCase()))) {
      return { url: direct.url, text: `${direct.title || ''}\n${direct.text}`.slice(0, 5000) };
    }
  } catch {}
  const query = [author.name, author.url, 'company location'].filter(Boolean).join(' ');
  const results = await search(query, 2, 'Find the exact linked author profile and their employer and geographic location. Do not use namesakes, comments or unrelated posts.',
    { includeDomains: ['linkedin.com'], since: '2000-01-01T00:00:00.000Z', timeRange: null });
  const exact = results.filter(result => sameLinkedInProfile(result.url, author.url));
  if (!exact.length) return null;
  const preferred = exact.sort((a, b) => (b.snippet || '').length - (a.snippet || '').length)[0];
  return { url: preferred.url, text: `${preferred.title || ''}\n${preferred.snippet || ''}`.slice(0, 5000) };
}
export async function searchWeb(query, maxResults = 5, objective = OBJECTIVE, options = {}, providers = {}) {
  if (!process.env.EXA_API_KEY?.trim() && !process.env.TAVILY_API_KEY?.trim()) {
    throw new Error('Настройте EXA_API_KEY или TAVILY_API_KEY в backend/.env');
  }
  const since = options.since || new Date(Date.now() - SEARCH_MAX_AGE_DAYS * 86400000).toISOString();
  const settled = await Promise.allSettled([
    (providers.exa || searchWithExa)(query, maxResults, objective || OBJECTIVE, { ...options, since }),
    (providers.tavily || searchWithTavily)(options.tavilyQuery || query, maxResults, { ...options, since })
  ]);
  const active = [Boolean(process.env.EXA_API_KEY?.trim()), Boolean(process.env.TAVILY_API_KEY?.trim())];
  if (settled.every((r, i) => !active[i] || r.status === 'rejected')) {
    throw new Error(`Exa и Tavily недоступны: ${settled.map((r, i) => active[i] && r.status === 'rejected' ? `${i === 0 ? 'Exa' : 'Tavily'}: ${safeErrorMessage(r.reason?.message)}` : '').filter(Boolean).join('; ')}`);
  }
  for (let i = 0; i < settled.length; i++) {
    if (settled[i].status === 'rejected') console.warn(`[AI Search] ${i === 0 ? 'Exa' : 'Tavily'}: ${safeErrorMessage(settled[i].reason?.message)}`);
  }
  const unique = new Map();
  for (const result of settled.flatMap(r => r.status === 'fulfilled' ? r.value : [])) {
    const url = canonicalUrl(result.url);
    if (!url) continue;
    const previous = unique.get(url);
    const preferred = !previous || (previous.snippet || '').length < (result.snippet || '').length ? result : previous;
    unique.set(url, { ...preferred, url, publishedDate: preferred.publishedDate || previous?.publishedDate || result.publishedDate || null });
  }
  return [...unique.values()];
}
