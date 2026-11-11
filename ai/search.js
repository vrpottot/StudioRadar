/** Search engines retrieve evidence; LLMs never invent fallback leads. */
import Exa from 'exa-js';
import './llm.js';
import { EXCLUDE_DOMAINS, SEARCH_MAX_AGE_DAYS } from './sources.js';
import { canonicalUrl } from './policy.js';

const OBJECTIVE = 'Find current explicit requests from companies for a production studio or contractor for 3D/2D motion, CGI, AI video, animation or WebGL in Russia and CIS. Include public HH project vacancies, Telegram orders with explicit project budget >=900000 RUB, LinkedIn and Facebook posts. Exclude employee hiring, freelancer portfolios, freelance marketplaces, tenders and completed campaigns.';

export async function searchWithExa(query, maxResults = 5, objective = OBJECTIVE, options = {}) {
  if (!process.env.EXA_API_KEY?.trim()) return [];
  const exa = new Exa(process.env.EXA_API_KEY.trim());
  const result = await exa.search(query, {
    type: 'auto', objective, numResults: maxResults,
    contents: { text: { maxCharacters: 8000 }, highlights: true },
    includeDomains: options.includeDomains, excludeDomains: EXCLUDE_DOMAINS,
    startPublishedDate: options.since, timeout: 20000
  });
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
      exclude_domains: EXCLUDE_DOMAINS, time_range: 'month'
    })
  });
  if (!res.ok) throw new Error(`Tavily HTTP ${res.status}`);
  const data = await res.json();
  return (data.results || []).map(r => ({
    title: r.title || '', url: r.url || '', snippet: r.raw_content || r.content || '',
    publishedDate: r.published_date || null, source: 'Tavily'
  }));
}
export async function searchWeb(query, maxResults = 5, objective = OBJECTIVE, options = {}, providers = {}) {
  if (!process.env.EXA_API_KEY?.trim() && !process.env.TAVILY_API_KEY?.trim()) {
    throw new Error('Настройте EXA_API_KEY или TAVILY_API_KEY в backend/.env');
  }
  const since = options.since || new Date(Date.now() - SEARCH_MAX_AGE_DAYS * 86400000).toISOString();
  const settled = await Promise.allSettled([
    (providers.exa || searchWithExa)(query, maxResults, objective || OBJECTIVE, { ...options, since }),
    (providers.tavily || searchWithTavily)(query, maxResults, options)
  ]);
  const active = [Boolean(process.env.EXA_API_KEY?.trim()), Boolean(process.env.TAVILY_API_KEY?.trim())];
  if (settled.every((r, i) => !active[i] || r.status === 'rejected')) {
    throw new Error('Exa и Tavily недоступны: проверьте ключи, квоты и соединение');
  }
  for (let i = 0; i < settled.length; i++) {
    if (settled[i].status === 'rejected') console.warn(`[AI Search] ${i === 0 ? 'Exa' : 'Tavily'}: запрос не выполнен`);
  }
  const unique = new Map();
  for (const result of settled.flatMap(r => r.status === 'fulfilled' ? r.value : [])) {
    const url = canonicalUrl(result.url);
    if (!url) continue;
    const previous = unique.get(url);
    if (!previous || previous.snippet.length < result.snippet.length) unique.set(url, { ...result, url });
  }
  return [...unique.values()];
}
