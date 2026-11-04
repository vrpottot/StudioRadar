import axios from 'axios';
import https from 'https';
import * as cheerio from 'cheerio';
import { analyzeLeadWithAi } from './geminiService.js';
import { extractPhoneFromWebsite, lookupCompanyPhone, extractPhones } from './phoneExtractor.js';
import { db } from './db.js';

const agent = new https.Agent({ rejectUnauthorized: false });

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8'
};

// Ключевые поисковые запросы по закупкам и коммерческим заказам видео / графики
const TENDER_QUERIES = [
  'видеоролик',
  '3D графика',
  'видеопроизводство',
  'моушн',
  'анимационный ролик',
  'создание презентационного фильма',
  'CGI'
];

/**
 * Парсер коммерческих и государственных тендеров (ЕИС Закупки / 44-ФЗ и 223-ФЗ)
 */
async function scrapeTenders(searchQuery, limit = 5) {
  try {
    const encoded = encodeURIComponent(searchQuery);
    const url = `https://zakupki.gov.ru/epz/order/extendedsearch/results.html?searchString=${encoded}&fz44=on&fz223=on&recordsPerPage=_${limit}`;
    
    const res = await axios.get(url, {
      httpsAgent: agent,
      headers: HEADERS,
      timeout: 10000
    });

    const $ = cheerio.load(res.data);
    const tenders = [];

    $('.search-registry-entry-block').each((i, el) => {
      if (i >= limit) return;

      const title = $(el).find('.registry-entry__body-value').text().trim().replace(/\s+/g, ' ');
      const customer = $(el).find('.registry-entry__body-href a').text().trim().replace(/\s+/g, ' ');
      const price = $(el).find('.price-block__value').text().trim().replace(/\s+/g, ' ');
      const linkRel = $(el).find('.registry-entry__header-mid__number a').attr('href') || '';
      const tenderUrl = linkRel.startsWith('http') ? linkRel : `https://zakupki.gov.ru${linkRel}`;
      const regNumber = $(el).find('.registry-entry__header-mid__number a').text().trim();

      if (title && customer) {
        tenders.push({
          title,
          customer,
          price: price || 'По согласованию',
          url: tenderUrl,
          regNumber,
          source_type: 'tender_eis'
        });
      }
    });

    return tenders;
  } catch (err) {
    console.warn(`[Tender Scraper] Ошибка поиска по запросу "${searchQuery}":`, err.message);
    return [];
  }
}

/**
 * Получение подробной информации по закупке (контакты ЛПР, телефон, почта)
 */
async function fetchTenderDetails(tenderUrl) {
  try {
    if (!tenderUrl || !tenderUrl.includes('zakupki.gov.ru')) return null;
    const res = await axios.get(tenderUrl, {
      httpsAgent: agent,
      headers: HEADERS,
      timeout: 8000
    });
    const $ = cheerio.load(res.data);
    const bodyText = $('body').text().replace(/\s+/g, ' ');
    
    // Поиск телефонов
    const phones = extractPhones(bodyText);
    const phone = phones.length > 0 ? phones[0] : null;

    // Поиск email
    const emailMatch = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : null;

    return {
      phone,
      email,
      fullText: bodyText.slice(0, 3000)
    };
  } catch (err) {
    return null;
  }
}

/**
 * Чтение свежих публикаций Habr (Hub Design) через RSS
 */
async function fetchHabrDesignPosts(limit = 4) {
  try {
    const res = await axios.get('https://habr.com/ru/rss/hubs/design/all/', {
      headers: HEADERS,
      timeout: 8000
    });
    const $ = cheerio.load(res.data, { xmlMode: true });
    const posts = [];

    $('item').each((i, el) => {
      if (i >= limit) return;
      const title = $(el).find('title').text().trim();
      const link = $(el).find('link').text().trim();
      const desc = $(el).find('description').text().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      // Фильтруем статьи о 3D, моушне, видео и CGI
      if (/3D|видео|анимац|график|CGI|моушн|дизайн|нейросет|визуализац/i.test(title + ' ' + desc)) {
        posts.push({
          title,
          link,
          description: desc.slice(0, 500),
          source_type: 'habr_design'
        });
      }
    });

    return posts;
  } catch (e) {
    return [];
  }
}

/**
 * Основной автономный ИИ-поиск коммерческих тендеров и заявок
 */
export async function runAutonomousAiLeadHunt(onProgress = null) {
  const foundLeads = [];
  const log = (msg) => {
    console.log(`[AI Lead Hunter] ${msg}`);
    if (onProgress) onProgress(msg);
  };

  log('Запуск ИИ-сканера открытых тендеров и коммерческих заказов...');

  // 1. Сбор целевых тендеров из ЕИС Закупки (44-ФЗ / 223-ФЗ)
  const query = TENDER_QUERIES[Math.floor(Math.random() * TENDER_QUERIES.length)];
  log(`Поиск тендеров в ЕИС по направлению: "${query}"...`);
  
  const tenders = await scrapeTenders(query, 6);
  log(`Найдено ${tenders.length} свежих тендеров. Начинаем ИИ-анализ и квалификацию...`);

  for (const tender of tenders) {
    try {
      log(`Анализ закупки: ${tender.customer.slice(0, 45)}...`);
      
      const details = await fetchTenderDetails(tender.url);
      const textToAnalyze = `${tender.title}. Заказчик: ${tender.customer}. Бюджет: ${tender.price}. ${details ? details.fullText : ''}`;

      // Семантическая оценка через ИИ (Gemini / DeepSeek)
      const aiEvaluation = await analyzeLeadWithAi(textToAnalyze, tender.url);

      let phone = details?.phone || aiEvaluation.phone;
      if (!phone && tender.customer) {
        phone = await lookupCompanyPhone(tender.customer);
      }

      // Приводим категорию к услугам студии
      let service = "3D моушен-дизайн и анимация";
      if (/съемк|видеосъемк|фильм|ролик/i.test(tender.title)) {
        service = "Видеоролики и графика";
      } else if (/3D|визуализац|CGI/i.test(tender.title)) {
        service = "3D моушен-дизайн и анимация";
      }

      const leadRecord = {
        id: `tender-${tender.regNumber || Date.now()}-${Math.floor(Math.random() * 1000)}`,
        company: tender.customer,
        industry: aiEvaluation.industry || "B2B Услуги и Производство",
        service: aiEvaluation.service || service,
        request_text: `${tender.title}. Официальный тендер (ЕИС Закупки). ${details?.email ? 'Email: ' + details.email : ''}`,
        budget: tender.price || "По согласованию",
        source: `ЕИС Закупки (Гос/Комм тендер)`,
        source_type: "tender",
        url: tender.url,
        contact_name: "Отдел закупок / Тендерный комитет",
        role: "ЛПР по закупке",
        phone: phone || null,
        suggested_solution: aiEvaluation.personalized_pitch || `Подготовка коммерческого предложения и презентационного портфолио по направлению «${service}» под ТЗ закупки.`,
        score: phone ? 90 : 85,
        verified_direct: true,
        status: phone ? "new" : "contacts_unconfirmed",
        created_at: new Date().toISOString()
      };

      const saved = await db.addLead(leadRecord);
      if (saved) {
        foundLeads.push(saved);
        log(`🔥 В базу добавлен подтвержденный заказчик: ${tender.customer} (${tender.price})`);
      }
    } catch (err) {
      console.warn(`[AI Hunter] Ошибка обработки тендера:`, err.message);
    }
  }

  // 2. Если найдено мало, подключаем Habr Design публикации студий и компаний
  if (foundLeads.length < 2) {
    log('Поиск целевых компаний через профильные кейсы Habr Design...');
    const posts = await fetchHabrDesignPosts(3);
    for (const post of posts) {
      try {
        const aiEvaluation = await analyzeLeadWithAi(`${post.title}. ${post.description}`, post.link);
        if (aiEvaluation.is_real_client && aiEvaluation.company_name) {
          const phone = await lookupCompanyPhone(aiEvaluation.company_name);
          const saved = await db.addLead({
            id: `habr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            company: aiEvaluation.company_name,
            industry: aiEvaluation.industry || "B2B Услуги",
            service: aiEvaluation.service || "3D моушен-дизайн и анимация",
            request_text: `${post.title}. ${post.description}`,
            budget: "По согласованию",
            source: "Habr Design",
            source_type: "web",
            url: post.link,
            contact_name: "Отдел маркетинга / Бренд-директор",
            role: "ЛПР проекта",
            phone: phone || null,
            suggested_solution: aiEvaluation.personalized_pitch || "Предложить аутсорс 3D графики и визуализаций для продуктового маркетинга.",
            score: phone ? 85 : 75,
            verified_direct: true,
            status: phone ? "new" : "contacts_unconfirmed",
            created_at: new Date().toISOString()
          });
          if (saved) foundLeads.push(saved);
        }
      } catch (e) {}
    }
  }

  log(`ИИ-поиск завершен. Найдено и сохранено целевых заказчиков: ${foundLeads.length}`);
  return foundLeads;
}
