import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractPhones, extractWebsites, lookupCompanyPhone, extractPhoneFromWebsite } from './phoneExtractor.js';
import { 
  checkSpamFilters, 
  classifyIndustryAndService, 
  calculateLeadScore 
} from './classifier.js';
import { analyzeLeadWithAi } from './geminiService.js';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

// Поисковые проектные запросы для моушн/3D студии
export const HH_SEARCH_QUERIES = [
  '3D motion',
  'моушн дизайн ролик',
  '3D визуализация',
  'CGI видеоролик',
  '3D анимация',
  'создание промо ролика',
  'CG generalist'
];

/**
 * Обогащение контактами конкретной вакансии (прямой телефон, контакты, сайт)
 */
export async function enrichHhVacancyDetails(vacancyUrl) {
  if (!vacancyUrl) return null;
  try {
    const response = await axios.get(vacancyUrl, { headers: HEADERS, timeout: 7000 });
    const $ = cheerio.load(response.data);

    const description = $('[data-qa="vacancy-description"]').text().trim();
    const contactName = $('[data-qa="vacancy-contacts__fio"]').text().trim();
    const contactEmail = $('[data-qa="vacancy-contacts__email"]').text().trim();
    const contactPhoneRaw = $('[data-qa="vacancy-contacts__phone"]').text().trim();

    // Извлечение телефонов из описания и блока контактов
    const phones = extractPhones(description + ' ' + contactPhoneRaw);
    const websites = extractWebsites(description);
    let phone = contactPhoneRaw || (phones.length > 0 ? phones[0] : null);
    const website = websites.length > 0 ? websites[0] : null;

    if (!phone && website) {
      phone = await extractPhoneFromWebsite(website);
    }

    return {
      full_description: description,
      contact_name: contactName || null,
      email: contactEmail || null,
      phone: phone,
      website: website
    };
  } catch (error) {
    return null;
  }
}

/**
 * Парсинг страницы результатов поиска hh.ru по конкретному запросу
 */
export async function scrapeHhVacancies(query = '3D motion', maxItems = 15) {
  const leads = [];
  const encodedQuery = encodeURIComponent(query);
  const url = `https://hh.ru/search/vacancy?text=${encodedQuery}&employment=project&order_by=publication_time`;

  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data);

    // Карточки вакансий
    const cards = $('[data-qa="vacancy-serp__vacancy"], .vacancy-card--H8woOUfdapibjh7DFAaC, [data-qa="vacancy-card"]');

    for (let i = 0; i < cards.length && leads.length < maxItems; i++) {
      const el = cards[i];
      try {
        const titleEl = $(el).find('[data-qa="vacancy-serp__vacancy-title"], a[data-qa="serp-item__title"]');
        const title = titleEl.text().trim();
        const vacancyUrl = titleEl.attr('href') || '';

        const companyEl = $(el).find('[data-qa="vacancy-serp__vacancy-employer"], a[data-qa="serp-item__employer"]');
        const companyName = companyEl.text().trim() || 'Прямой бренд';

        const compensationEl = $(el).find('[data-qa="vacancy-serp__vacancy-compensation"], [data-qa="serp-item__compensation"]');
        const budget = compensationEl.text().trim() || 'По договоренности';

        const requirement = $(el).find('[data-qa="vacancy-serp__vacancy_snippet_requirement"]').text().trim();
        const responsibility = $(el).find('[data-qa="vacancy-serp__vacancy_snippet_responsibility"]').text().trim();
        const fullSnippet = `${title}. Компания: ${companyName}. ${responsibility} ${requirement}`;

        if (!title) continue;

        // Фильтрация спама, курсов, резюме и непрофильных вакансий
        const [isSpam, reason] = checkSpamFilters(`${title} ${responsibility} ${requirement}`);
        if (isSpam) {
          continue;
        }

        // Извлекаем id вакансии
        const idMatch = vacancyUrl.match(/\/vacancy\/(\d+)/);
        const vacancyId = idMatch ? idMatch[1] : `hh-${Date.now()}-${i}`;
        const cleanUrl = vacancyUrl.startsWith('http') ? vacancyUrl : `https://hh.ru${vacancyUrl}`;

        // Классифицируем базово
        let classification = classifyIndustryAndService(fullSnippet);
        let score = calculateLeadScore(fullSnippet, classification.industry, budget);
        let pitch = classification.pitch;
        let clientCompany = companyName;

        // Применяем глубокий ИИ-анализ через Google Gemini
        try {
          const aiResult = await analyzeLeadWithAi(fullSnippet, cleanUrl);
          if (aiResult) {
            if (!aiResult.is_real_client) {
              console.log(`[HH AI Check] ИИ отсеял: ${title} (${aiResult.rejection_reason})`);
              continue;
            }
            if (aiResult.company_name) clientCompany = aiResult.company_name;
            if (aiResult.industry) classification.industry = aiResult.industry;
            if (aiResult.service) classification.service = aiResult.service;
            if (aiResult.personalized_pitch) pitch = aiResult.personalized_pitch;
            if (aiResult.score) score = aiResult.score;
          }
        } catch (aiErr) {
          // Если Gemini временно недоступен, продолжаем с локальным классификатором
        }

        leads.push({
          id: `hh-${vacancyId}`,
          external_id: vacancyId,
          company: clientCompany,
          title: title,
          industry: classification.industry,
          service: classification.service,
          request_text: fullSnippet,
          budget: budget,
          source: 'HeadHunter (ИИ-проверен)',
          source_type: 'hh',
          url: cleanUrl,
          contact_name: 'Отдел маркетинга / Заказчик',
          role: 'Заказчик проекта',
          phone: null,
          telegram: null,
          suggested_solution: pitch,
          score: score,
          verified_direct: true,
          status: 'contacts_unconfirmed',
          created_at: new Date().toISOString()
        });
      } catch (err) {
        // Пропускаем ошибочные элементы
      }
    }
  } catch (error) {
    console.error(`[HH Scraper] Ошибка запроса к hh.ru (${query}):`, error.message);
  }

  return leads;
}

/**
 * Комплексный сбор лидов со всех целевых поисковых запросов hh.ru
 */
export async function scrapeAllHhLeads(limit = 20) {
  const allLeads = [];
  const seenIds = new Set();

  for (const query of HH_SEARCH_QUERIES) {
    if (allLeads.length >= limit) break;
    const items = await scrapeHhVacancies(query, 10);
    
    for (const item of items) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allLeads.push(item);
      }
      if (allLeads.length >= limit) break;
    }
  }

  // Обогащаем лиды детальными контактами
  for (let i = 0; i < allLeads.length; i++) {
    const lead = allLeads[i];
    try {
      const details = await enrichHhVacancyDetails(lead.url);
      if (details) {
        if (details.phone) lead.phone = details.phone;
        if (details.contact_name) lead.contact_name = details.contact_name;
        if (details.email) lead.email = details.email;
        if (details.website) lead.website = details.website;
        if (details.full_description) {
          lead.request_text = details.full_description.slice(0, 350) + '...';
        }
      }

      // Если в тексте вакансии телефона не было, ищем корпоративный телефон компании
      if (!lead.phone && lead.company) {
        const companyPhone = await lookupCompanyPhone(lead.company);
        if (companyPhone) {
          lead.phone = companyPhone;
        }
      }
      
      // По ТЗ: статус зависит от наличия подтвержденного телефона
      lead.status = lead.phone ? 'new' : 'contacts_unconfirmed';
    } catch (e) {
      lead.status = lead.phone ? 'new' : 'contacts_unconfirmed';
    }
  }

  return allLeads;
}
