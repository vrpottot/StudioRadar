import { createHash } from 'node:crypto';
import { searchWeb } from './search.js';
import { fetchPageContent } from './fetchPage.js';
import { classifyLeadWithLlm } from './classify.js';
import { extractPhoneFromText, extractEmailFromText, extractTelegramFromText } from './extractContacts.js';
import { buildSearchJobs, PLATFORM_REGISTRY } from './sources.js';
import { canonicalUrl, sourcePlatform, isExcludedUrl, isBannedLead } from './policy.js';

async function mapConcurrent(items, workers, fn) {
  let next = 0;
  const result = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(workers, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      result[i] = await fn(items[i], i);
    }
  }));
  return result;
}

/** Four public platforms × all configured industries; bounded search and qualification costs. */
export async function huntOrders({ onProgress, query = null, limit = 5, excludeUrls = [] } = {}, dependencies = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('limit должен быть целым числом от 1 до 20');
  if (query !== null && (typeof query !== 'string' || query.length > 500)) throw new Error('query: строка до 500 символов');
  const search = dependencies.search || searchWeb;
  const fetchPage = dependencies.fetchPage || fetchPageContent;
  const classify = dependencies.classify || classifyLeadWithLlm;
  const now = dependencies.now || new Date();
  const report = message => {
    console.log(`[AI Module] ${message}`);
    onProgress?.(message);
  };
  const jobs = buildSearchJobs({ query, now });
  report(`Поиск: HH, Telegram от 900 000 ₽, LinkedIn, Facebook; Россия и СНГ. ${jobs.length} поисковых запросов, до 2 провайдеров на запрос.`);
  let successfulSearches = 0;
  const groups = await mapConcurrent(jobs, 3, async job => {
    try {
      const results = await search(job.query, 3, null, { includeDomains: job.includeDomains });
      successfulSearches++;
      return results.filter(r => !isExcludedUrl(r.url) && sourcePlatform(r.url) === job.platform);
    } catch {
      report(`Источник ${job.platform}: запрос не выполнен (${job.industry}).`);
      return [];
    }
  });
  if (!successfulSearches) throw new Error('Поиск не выполнен. Проверьте EXA_API_KEY/TAVILY_API_KEY, квоты и соединение.');
  const seen = new Set(excludeUrls.map(canonicalUrl).filter(Boolean));
  const candidates = [];
  // Round-robin avoids exhausting the qualification budget on the first platform/industry.
  for (let rank = 0; rank < 6; rank++) {
    for (const group of groups) {
      const candidate = group[rank];
      const url = candidate && canonicalUrl(candidate.url);
      if (url && !seen.has(url)) {
        seen.add(url);
        candidates.push({ ...candidate, url });
      }
    }
  }
  const leads = [];
  for (const res of candidates.slice(0, 48)) {
    if (leads.length >= limit) break;
    report(`Проверка заказа: ${res.title || res.url}`);
    // Prefer full source text; use engine text if the public page cannot be loaded.
    const page = await fetchPage(res.url);
    if (page?.url && sourcePlatform(page.url) !== sourcePlatform(res.url)) continue;
    const text = page?.text || res.snippet || '';
    if (!text.trim()) continue;
    const dateEvidence = res.publishedDate ? `\nДата публикации по данным поискового источника: ${res.publishedDate}` : '';
    const evidenceText = text + dateEvidence;
    const evaluation = await classify({ title: res.title, text: evidenceText, url: res.url });
    if (!evaluation.isOrder) continue;
    const platform = sourcePlatform(res.url);
    const lead = {
      ...evaluation.lead,
      id: `order-${createHash('sha256').update(res.url).digest('hex').slice(0, 24)}`,
      title: res.title || evaluation.lead.request_evidence,
      source: PLATFORM_REGISTRY.find(p => p.id === platform).name,
      source_platform: platform, search_provider: res.source,
      source_type: 'direct', lead_type: 'order', url: res.url, apply_url: res.url,
      phone: extractPhoneFromText(text), email: extractEmailFromText(text),
      telegram: extractTelegramFromText(text), status: 'new',
      created_at: now.toISOString(), evidence_checked_at: now.toISOString()
    };
    if (isBannedLead(lead)) continue;
    leads.push(lead);
    report(`Найден прямой проектный запрос: ${lead.company}`);
  }
  report(`Проверено кандидатов не более 48; найдено подходящих заказов: ${leads.length}.`);
  return leads;
}
