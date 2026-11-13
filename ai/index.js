import { createHash } from 'node:crypto';
import { searchWeb, searchAuthorEvidence } from './search.js';
import { fetchPageContent } from './fetchPage.js';
import { classifyLeadWithLlm, fastSpamFilter } from './classify.js';
import { extractPhoneFromText, extractEmailFromText, extractTelegramFromText } from './extractContacts.js';
import { buildSearchJobs, PLATFORM_REGISTRY, SEARCH_MAX_AGE_DAYS } from './sources.js';
import { canonicalUrl, sourcePlatform, isExcludedUrl, isBannedLead } from './policy.js';
import { safeErrorMessage } from './llm.js';
import { telegramFeedUrl, prioritizeCandidates, buyerIntentScore, samePublication, publicationKey } from './candidates.js';
import { planSearchJobs } from './planner.js';

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
export async function huntOrders({ onProgress, onDiagnostics, onCandidate, onDiscovered, onDeferred, onLead, query = null, limit = 10, excludeUrls = [], excludeCompanies = [], seedCandidates = [], searchRound = 0, feedback } = {}, dependencies = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('limit должен быть целым числом от 1 до 20');
  if (query !== null && (typeof query !== 'string' || query.length > 500)) throw new Error('query: строка до 500 символов');
  if (!Number.isInteger(searchRound) || searchRound < 0 || searchRound > 100) throw new Error('searchRound: целое число от 0 до 100');
  const search = dependencies.search || searchWeb;
  const fetchPage = dependencies.fetchPage || fetchPageContent;
  const classify = dependencies.classify || classifyLeadWithLlm;
  const authorEvidence = dependencies.authorEvidence || searchAuthorEvidence;
  const now = dependencies.now || new Date();
  const report = message => {
    console.log(`[AI Module] ${message}`);
    onProgress?.(message);
  };
  const replay = Array.isArray(dependencies.candidates) ? dependencies.candidates : null;
  let jobs = replay ? [] : buildSearchJobs({ query, now, round: searchRound });
  let plannedJobs = 0, planningError = null;
  const plan = dependencies.plan || (!dependencies.search && !replay ? planSearchJobs : null);
  if (plan && !replay) {
    report('ИИ уточняет поисковые формулировки по результатам предыдущего прохода…');
    try {
      const replacements = await plan({round:searchRound,query,now,feedback});
      const replacementsByTarget = new Map(replacements.map(job => [`${job.platform}:${job.industry}`,job]));
      jobs = jobs.map(job => replacementsByTarget.get(`${job.platform}:${job.industry}`) || job);
      plannedJobs = replacementsByTarget.size;
    } catch (error) {
      planningError = safeErrorMessage(error.message);
      report(`Планировщик не завершил план; используются подготовленные запросы. ${planningError}`);
    }
  }
  report(replay ? `Повторная проверка ${replay.length} сохранённых публикаций без повторных поисковых запросов.`
    : `Поиск: HH, Telegram от 900 000 ₽, LinkedIn, Facebook; весь мир, включая Россию и СНГ. ${jobs.length} поисковых запросов, до 2 провайдеров на запрос.`);
  let successfulSearches = 0;
  const diagnostics = { geography: 'worldwide', replay: Boolean(replay), planned_jobs:plannedJobs, planning_error:planningError, search_round: searchRound, max_age_days: SEARCH_MAX_AGE_DAYS, searches: jobs.length, successful_searches: 0, retrieved: replay?.length || 0, candidates: 0, checked: 0, llm_checks: 0, unchecked: 0, accepted: 0, rejected: {}, platforms: {}, search_errors: [], telegram_feeds_checked: 0, telegram_posts_discovered: 0, author_checks: 0 };
  onDiagnostics?.(diagnostics);
  const reject = reason => { diagnostics.rejected[reason] = (diagnostics.rejected[reason] || 0) + 1; };
  const groups = replay ? [replay.filter(result => !isExcludedUrl(result.url) && sourcePlatform(result.url))] : await mapConcurrent(jobs, 3, async job => {
    try {
      const results = await search(job.query, 3, null, { includeDomains: job.includeDomains, tavilyQuery: job.tavilyQuery });
      successfulSearches++;
      diagnostics.successful_searches = successfulSearches;
      diagnostics.retrieved += results.length;
      return results.filter(r => {
        const allowed = !isExcludedUrl(r.url) && (sourcePlatform(r.url) === job.platform || (job.platform === 'telegram' && telegramFeedUrl(r.url)));
        if (!allowed) reject('Нецелевой источник или не отдельная публикация');
        return allowed;
      });
    } catch (error) {
      const detail = safeErrorMessage(error.message);
      diagnostics.search_errors.push({ platform: job.platform, industry: job.industry, error: detail });
      report(`Источник ${job.platform}: запрос не выполнен (${job.industry}): ${detail}`);
      return [];
    }
  });
  const eligibleSeeds=seedCandidates.filter(item => !isExcludedUrl(item.url) && sourcePlatform(item.url));
  if (!successfulSearches && !replay && !eligibleSeeds.length) throw new Error('Поиск не выполнен. Проверьте EXA_API_KEY/TAVILY_API_KEY, квоты и соединение.');
  if (!successfulSearches && !replay) report('Поисковые API недоступны; продолжаю проверку сохранённой очереди.');
  if (!replay && eligibleSeeds.length) groups.push(eligibleSeeds);
  const feeds = new Map();
  for (const result of groups.flat()) {
    const url = telegramFeedUrl(result.url);
    if (url && (!feeds.has(url) || buyerIntentScore(result) > buyerIntentScore(feeds.get(url)))) feeds.set(url, result);
  }
  const discovered = new Map();
  await mapConcurrent([...feeds.entries()].sort((a, b) => buyerIntentScore(b[1]) - buyerIntentScore(a[1])).slice(0, 8), 3, async ([url, result]) => {
    report(`Telegram: поиск отдельных публикаций в ${url}`);
    diagnostics.telegram_feeds_checked++;
    try {
      const page = await fetchPage(url);
      const posts = (page?.posts || []).filter(post => sourcePlatform(post.url) === 'telegram' && !isExcludedUrl(post.url));
      discovered.set(url, posts.map(post => ({ ...post, source: result.source, discovery_url: url })));
      diagnostics.telegram_posts_discovered += posts.length;
    } catch {
      discovered.set(url, []);
    }
  });
  for (let i = 0; i < groups.length; i++) groups[i] = groups[i].flatMap(result => {
    const url = telegramFeedUrl(result.url);
    return url ? discovered.get(url) || [] : [result];
  });
  const seen = new Set(excludeUrls.map(publicationKey).filter(Boolean));
  const candidates = [];
  const candidateByKey = new Map();
  // Round-robin avoids exhausting the qualification budget on the first platform/industry.
  for (let rank = 0; rank < Math.max(0, ...groups.map(group => group.length)); rank++) {
    for (const group of groups) {
      const candidate = group[rank];
      const url = candidate && canonicalUrl(candidate.url);
      const key = url && publicationKey(url);
      if (key && !seen.has(key)) {
        seen.add(key);
        const item={...candidate,url};
        candidates.push(item);candidateByKey.set(key,item);
      } else if (candidateByKey.has(key)) {
        const previous=candidateByKey.get(key);
        previous.publishedDate ||= candidate.publishedDate || null;
        if ((candidate.snippet || '').length>(previous.snippet || '').length) previous.snippet=candidate.snippet;
      }
    }
  }
  const leads = [];
  diagnostics.successful_searches = successfulSearches;
  diagnostics.candidates = candidates.length;
  diagnostics.unchecked = candidates.length;
  await onDiscovered?.(candidates);
  const checkedKeys = new Set();
  const companyKey = value => String(value || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
  const companies = new Set(excludeCompanies.map(companyKey).filter(Boolean));
  for (const res of prioritizeCandidates(candidates).slice(0, 96)) {
    if (leads.length >= limit || diagnostics.llm_checks >= 48) break;
    report(`Проверка заказа: ${res.title || res.url}`);
    diagnostics.checked++;
    diagnostics.unchecked--;
    checkedKeys.add(publicationKey(res.url));
    const platform = sourcePlatform(res.url);
    diagnostics.platforms[platform] = (diagnostics.platforms[platform] || 0) + 1;
    // Login walls must not discard evidence already extracted by a search engine.
    const page = await fetchPage(res.url);
    const validPage = page && (!page.url || samePublication(page.url, res.url));
    const pageText = validPage ? page.text || '' : '';
    let text = [...new Set([pageText, validPage && page.isolated_post ? '' : res.snippet || ''].filter(t => t.trim()))].join('\n\n');
    const publicationText = text.split('\n\nИсточник профиля автора:')[0];
    if (platform === 'linkedin' && validPage && page.author?.url && buyerIntentScore({ snippet: text }) >= 100 && diagnostics.author_checks < 12) {
      diagnostics.author_checks++;
      report(`Проверка компании и страны автора: ${page.author.name || page.author.url}`);
      try {
        const context = await authorEvidence(page.author);
        if (context?.text) text += `\n\nИсточник профиля автора: ${context.url}\n${context.text}`;
      } catch { report('Публичные данные профиля автора не получены; страна не будет предполагаться.'); }
    }
    const dateEvidence = res.publishedDate ? `\nДата публикации по данным поискового источника: ${res.publishedDate}` : '';
    const evidenceText = text + dateEvidence;
    const recordCandidate = async (evaluation, reason) => onCandidate?.({ url: res.url, platform,
      search_provider: res.source || null, title: res.title || null, text: evidenceText,
      accepted: evaluation?.isOrder === true && !reason, reason: reason || evaluation?.reason || null,
      evaluation:evaluation?{...evaluation,publishedDate:res.publishedDate || null}:null });
    if (!text.trim()) { reject('Нет текста публикации'); await recordCandidate(null, 'Нет текста публикации'); continue; }
    const [spam, reason] = fastSpamFilter(`${res.title || ''} ${evidenceText}`, res.url);
    if (spam) { reject(reason); await recordCandidate({isOrder:false, lead:null, reason}); continue; }
    let evaluation;
    diagnostics.llm_checks++;
    try { evaluation = await classify({ title: res.title, text: evidenceText, requestText: publicationText + dateEvidence, url: res.url, author: validPage ? page.author : null }, { onRetry: report }); }
    catch (error) { await recordCandidate({isOrder:null,code:error.code || 'AI_PROVIDER_ERROR'}, safeErrorMessage(error.message)); throw error; }
    if (!evaluation.isOrder) { reject(evaluation.reason || 'Не подтверждён прямой заказ'); await recordCandidate(evaluation); continue; }
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
    if (isBannedLead(lead)) { reject('Источник или бюджет не соответствует политике'); await recordCandidate(evaluation, 'Источник или бюджет не соответствует политике'); continue; }
    const company = companyKey(lead.company);
    if (companies.has(company)) { reject('Повторный заказчик'); await recordCandidate(evaluation, 'Повторный заказчик'); continue; }
    let saved;
    try { saved=await onLead?.(lead); }
    catch (error) {
      await recordCandidate({isOrder:null,code:'LEAD_PERSIST_ERROR'},safeErrorMessage(error.message));
      throw error;
    }
    if (saved===false) { await recordCandidate(evaluation,'Повторная запись'); continue; }
    await recordCandidate(evaluation);
    companies.add(company);
    leads.push(lead);
    diagnostics.accepted = leads.length;
    report(`Найден прямой проектный запрос: ${lead.company}`);
  }
  diagnostics.accepted = leads.length;
  await onDeferred?.(candidates.filter(item => !checkedKeys.has(publicationKey(item.url))));
  onDiagnostics?.(diagnostics);
  const reasons = Object.entries(diagnostics.rejected).map(([reason, count]) => `${reason}: ${count}`).join('; ');
  report(`Получено результатов: ${diagnostics.retrieved}; уникальных новых публикаций: ${candidates.length}; проверено: ${diagnostics.checked}; не проверено: ${diagnostics.unchecked}; найдено заказов: ${leads.length}.${reasons ? ` Причины отсева: ${reasons}.` : ''}`);
  return leads;
}
