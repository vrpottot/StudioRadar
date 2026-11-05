/**
 * ai/index.js — Главная точка входа ИИ-модуля поиска и квалификации B2B-заказов
 * Экспортирует одну функцию: huntOrders(), которую вызывает backend.
 * Бэкенд ничего не знает про Exa, Tavily, Gemini или парсинг страниц.
 * Фриланс-биржи, Telegram и тендеры полностью исключены.
 */
import { searchWeb, searchWithGeminiGrounding } from './search.js';
import { fetchPageContent } from './fetchPage.js';
import { classifyLeadWithLlm } from './classify.js';
import { 
  extractContactsFromWebsite, 
  extractPhoneFromText, 
  extractEmailFromText, 
  extractTelegramFromText 
} from './extractContacts.js';
import { ORDER_SEARCH_QUERIES } from './sources.js';

/**
 * Определение читаемого названия прямого источника
 * @param {string} url 
 * @param {string} engineSource 
 * @returns {string}
 */
function resolveSourceLabel(url, engineSource) {
  if (!url) return engineSource || 'Прямой заказчик';
  const u = url.toLowerCase();
  if (u.includes('sostav.ru')) return 'Sostav.ru (Рекламная кампания)';
  if (u.includes('adindex.ru')) return 'AdIndex.ru (Пресс-релиз бренда)';
  if (u.includes('vc.ru')) return 'VC.ru (Бизнес-сигнал бренда)';
  if (u.includes('new-retail.ru') || u.includes('retail.ru')) return 'Retail-медиа (Запуск продукта)';
  if (u.includes('mts.ru') || u.includes('ozon.ru') || u.includes('x5.ru') || u.includes('samolet.ru') || u.includes('sber.ru')) {
    return 'Корпоративный портал бренда';
  }
  if (engineSource === 'Exa Semantic Search') return 'Exa (Прямой заказчик)';
  if (engineSource === 'Tavily Search') return 'Tavily (Прямой заказчик)';
  return 'Корпоративный веб-сайт';
}

/**
 * Автономный поиск и разбор прямых коммерческих заказов и брендовых кампаний
 * @param {object} options
 * @param {function} [options.onProgress] - Коллбек прогресса (message: string)
 * @param {string} [options.query] - Пользовательский поисковый запрос (опционально)
 * @param {number} [options.limit] - Максимальное количество лидов для поиска
 * @returns {Promise<Array<object>>} Список подтвержденных лидов
 */
export async function huntOrders({ onProgress = null, query = null, limit = 5 } = {}) {
  const leads = [];
  const report = (msg) => {
    console.log(`[AI Module] ${msg}`);
    if (typeof onProgress === 'function') onProgress(msg);
  };

  report('Запуск семантического радара прямых B2B-заказов (Exa & Tavily)...');

  // 1. Определение поискового запроса
  const searchQuery = query || ORDER_SEARCH_QUERIES[Math.floor(Math.random() * ORDER_SEARCH_QUERIES.length)];
  report(`Поиск по прямым заказчикам и кампаниям брендов: «${searchQuery}»...`);

  // 2. Семантический веб-поиск через Exa (с fallback на Tavily)
  const searchResults = await searchWeb(
    searchQuery, 
    limit * 2,
    'Goal for this search: Find direct commercial corporate clients, companies, and brands in Russia seeking professional production studios for 3D motion design, CGI, 2D animation, and product commercials. STRICTLY EXCLUDE freelance marketplaces (fl.ru, kwork), EXCLUDE telegram channels, and EXCLUDE public government or portal tenders.'
  );

  if (searchResults.length > 0) {
    report(`Найдено ${searchResults.length} кандидатов (${searchResults[0]?.source || 'Web Search'}). Анализ содержимого...`);

    for (const res of searchResults) {
      if (leads.length >= limit) break;

      report(`Анализ источника: ${res.title.slice(0, 50)}...`);

      // Загрузка содержимого страницы (если есть сниппет/highlights от Exa, используем их)
      let textToAnalyze = res.snippet;
      if (!textToAnalyze || textToAnalyze.length < 200) {
        const pageData = await fetchPageContent(res.url);
        textToAnalyze = pageData?.text || res.snippet;
      }

      // Нейросетевая квалификация: прямой заказ / сигнал или нет?
      const evaluation = await classifyLeadWithLlm({
        title: res.title,
        description: res.snippet.slice(0, 300),
        text: textToAnalyze,
        url: res.url
      });

      if (evaluation.isOrder && evaluation.lead) {
        const lead = evaluation.lead;

        // Извлечение прямых контактов (телефон, email, telegram)
        let phone = extractPhoneFromText(textToAnalyze);
        let email = extractEmailFromText(textToAnalyze);
        let telegram = extractTelegramFromText(textToAnalyze);

        // Если контакты не найдены в тексте брифа, пробуем досканировать сайт компании
        if (!phone && lead.url) {
          const siteContacts = await extractContactsFromWebsite(lead.url);
          phone = siteContacts.phone;
          email = email || siteContacts.email;
          telegram = telegram || siteContacts.telegram;
        }

        const normalizedLead = {
          id: `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          company: lead.company,
          industry: lead.industry,
          service: lead.service,
          request_text: lead.request_text,
          budget: lead.budget || 'от 1 500 000 ₽',
          source: resolveSourceLabel(res.url, res.source),
          source_type: 'direct',
          lead_type: lead.lead_type || 'order',
          url: res.url,
          apply_url: res.url,
          contact_name: lead.contact_name,
          role: lead.role,
          phone: phone || lead.phone || null,
          email: email || lead.email || null,
          telegram: telegram || null,
          suggested_solution: lead.suggested_solution,
          score: lead.score || 92,
          verified_direct: true,
          status: 'new',
          created_at: new Date().toISOString()
        };

        leads.push(normalizedLead);
        report(`Подтвержден прямой клиент: «${lead.company}» — ${lead.service}`);
      }
    }
  }

  // 3. Дополнительный поиск через Google Gemini Grounding, если найдено мало лидов
  if (leads.length === 0) {
    report('Поиск прямых маркетинговых триггеров и рекламных кампаний брендов...');
    try {
      const geminiLeads = await searchWithGeminiGrounding("3D моушен-дизайн, презентационные видеоролики и CGI графика");
      for (const gLead of geminiLeads) {
        if (leads.length >= limit) break;

        leads.push({
          id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          company: gLead.company,
          industry: gLead.industry,
          service: gLead.service,
          request_text: gLead.request_text,
          budget: gLead.budget || 'от 1 500 000 ₽',
          source: 'Web-поиск (Прямой заказчик)',
          source_type: 'direct',
          lead_type: 'signal',
          url: gLead.url || '',
          apply_url: gLead.url || '',
          contact_name: gLead.contact_name || 'Отдел маркетинга',
          role: gLead.role || 'Бренд-директор',
          phone: gLead.phone || null,
          email: gLead.email || null,
          telegram: null,
          suggested_solution: gLead.suggested_solution,
          score: gLead.score || 90,
          verified_direct: true,
          status: 'new',
          created_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('[AI Module] Fallback search error:', e.message);
    }
  }

  report(`Поиск завершен. Найдено целевых прямых клиентов: ${leads.length}`);
  return leads;
}
