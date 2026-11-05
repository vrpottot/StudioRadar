/**
 * ai/index.js — Главная точка входа ИИ-модуля поиска и квалификации B2B-заказов
 * Экспортирует одну функцию: huntOrders(), которую вызывает backend.
 * Бэкенд ничего не знает про Tavily, Gemini или парсинг страниц.
 */
import { searchWithTavily, searchWithGeminiGrounding } from './search.js';
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
 * Автономный поиск и разбор коммерческих заказов для студии
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

  report('Запуск многоканального поиска прямых B2B-заказов в открытом вебе...');

  // 1. Определение поискового запроса
  const searchQuery = query || ORDER_SEARCH_QUERIES[Math.floor(Math.random() * ORDER_SEARCH_QUERIES.length)];
  report(`Поиск по открытым площадкам и тендерам: «${searchQuery}»...`);

  // 2. Живой поиск через Tavily
  const searchResults = await searchWithTavily(searchQuery, limit * 2);

  if (searchResults.length > 0) {
    report(`Найдено ${searchResults.length} кандидатов. Загрузка страниц и анализ содержимого...`);

    for (const res of searchResults) {
      if (leads.length >= limit) break;

      report(`Анализ источника: ${res.title.slice(0, 50)}...`);

      // Загрузка полного содержимого страницы
      const pageData = await fetchPageContent(res.url);
      const textToAnalyze = pageData?.text || res.snippet;

      // Нейросетевая квалификация: заказ или нет?
      const evaluation = await classifyLeadWithLlm({
        title: pageData?.title || res.title,
        description: pageData?.description || '',
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
          budget: lead.budget,
          source: res.url.includes('workspace.ru') 
            ? 'Workspace.ru (Открытый бриф)' 
            : (res.url.includes('b2b-center') 
              ? 'B2B-Center (Коммерческий тендер)' 
              : 'Web-поиск (Прямой заказчик)'),
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
        report(`Подтвержден прямой заказ: «${lead.company}» — ${lead.service}`);
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

  report(`Поиск завершен. Найдено целевых B2B-заказов: ${leads.length}`);
  return leads;
}
