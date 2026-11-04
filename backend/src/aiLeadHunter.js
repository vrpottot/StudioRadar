import axios from 'axios';
import https from 'https';
import * as cheerio from 'cheerio';
import { analyzeLeadWithAi, searchLeadsWithGoogleGemini } from './aiService.js';
import { extractPhones } from './phoneExtractor.js';
import { db } from './db.js';

const agent = new https.Agent({ rejectUnauthorized: false });

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8'
};

// Целевые запросы строго по услугам студии (3D, моушн, анимация, видео)
const TARGET_TENDER_QUERIES = [
  'моушн-дизайн',
  '3D графика',
  'видеоролик',
  'видеопроизводство',
  'анимационный ролик',
  'создание презентационного фильма',
  'CGI',
  '3D анимация',
  'создание видеофильма',
  'разработка видеоконтента'
];

/**
 * Парсер государственных и коммерческих тендеров ЕИС Закупки (44-ФЗ и 223-ФЗ)
 * Собирает реальные технические задания, бюджеты и контакты заказчиков
 */
async function scrapeDirectTenders(query, limit = 5) {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://zakupki.gov.ru/epz/order/extendedsearch/results.html?searchString=${encoded}&fz44=on&fz223=on&recordsPerPage=_${limit}`;
    
    const res = await axios.get(url, {
      httpsAgent: agent,
      headers: HEADERS,
      timeout: 9000
    });

    const $ = cheerio.load(res.data);
    const rawTenders = [];

    $('.search-registry-entry-block').each((i, el) => {
      if (rawTenders.length >= limit) return;

      const title = $(el).find('.registry-entry__body-value').text().trim().replace(/\s+/g, ' ');
      const customer = $(el).find('.registry-entry__body-href a').text().trim().replace(/\s+/g, ' ');
      const price = $(el).find('.price-block__value').text().trim().replace(/\s+/g, ' ');
      const linkRel = $(el).find('.registry-entry__header-mid__number a').attr('href') || '';
      const tenderUrl = linkRel.startsWith('http') ? linkRel : `https://zakupki.gov.ru${linkRel}`;
      const regNumber = $(el).find('.registry-entry__header-mid__number a').text().trim();

      // Проверяем, что в названии закупки явно указаны ключевые услуги студии
      if (title && customer && /видео|ролик|3d|график|моушн|анимац|фильм|cgi|визуал/i.test(title)) {
        rawTenders.push({ title, customer, price, tenderUrl, regNumber });
      }
    });

    return rawTenders;
  } catch (err) {
    console.warn(`[AI Hunter] Ошибка ЕИС Закупки по запросу «${query}»:`, err.message);
    return [];
  }
}

/**
 * Получение контактов ответственного лица по тендеру (телефон, email)
 */
async function fetchTenderContacts(tenderUrl) {
  try {
    if (!tenderUrl || !tenderUrl.includes('zakupki.gov.ru')) return { phone: null, email: null };
    const res = await axios.get(tenderUrl, { httpsAgent: agent, headers: HEADERS, timeout: 6000 });
    const $ = cheerio.load(res.data);
    const bodyText = $('body').text().replace(/\s+/g, ' ');

    const phones = extractPhones(bodyText);
    const phone = phones.length > 0 ? phones[0] : null;

    const emailMatch = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : null;

    return { phone, email };
  } catch (e) {
    return { phone: null, email: null };
  }
}

/**
 * Главный автономный ИИ-поиск прямых заказов и коммерческих тендеров
 */
export async function runAutonomousAiLeadHunt(onProgress = null) {
  const allLeads = [];
  const log = (msg) => {
    console.log(`[AI Lead Hunter] ${msg}`);
    if (onProgress) onProgress(msg);
  };

  log('🚀 ИИ запускает поиск прямых заказов, тендеров и заявок на видеопроизводство и 3D графику...');

  // 1. Поиск прямых коммерческих заказчиков через Google Gemini со встроенным поиском Google
  const apiKey = (process.env.Google_api || process.env.GEMINI_API_KEY || '').trim();
  if (apiKey && apiKey.startsWith('AIzaSy')) {
    log('🌐 Запуск чистого поиска в интернете через Google Gemini (Google Search Grounding)...');
    try {
      const geminiLeads = await searchLeadsWithGoogleGemini();
      if (geminiLeads && geminiLeads.length > 0) {
        log(`✨ Google Gemini нашел в интернете ${geminiLeads.length} актуальных коммерческих запросов!`);
        for (const gl of geminiLeads) {
          const leadRecord = {
            id: `google-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            company: gl.company,
            industry: gl.industry || "Рекламные агентства и продакшн",
            service: gl.service || "3D моушен-дизайн и анимация",
            request_text: gl.request_text,
            budget: gl.budget || "По согласованию",
            source: "Google Поиск (ИИ Gemini)",
            source_type: "web",
            url: gl.url || "",
            contact_name: gl.contact_name || "Отдел маркетинга / Закупок",
            role: gl.role || "ЛПР проекта",
            phone: gl.phone || null,
            telegram: null,
            email: gl.email || null,
            suggested_solution: gl.suggested_solution || `Подготовка коммерческого предложения по направлению «${gl.service}».`,
            score: gl.score || 92,
            verified_direct: true,
            status: gl.phone ? "new" : (gl.email ? "in_review" : "contacts_unconfirmed"),
            created_at: new Date().toISOString()
          };
          const saved = await db.addLead(leadRecord);
          if (saved) {
            allLeads.push(saved);
            log(`🔥 Добавлен коммерческий заказчик из Google: ${gl.company}`);
          }
        }
      }
    } catch (e) {
      console.warn('[AI Hunter] Ошибка поиска Google Gemini:', e.message);
    }
  }

  // 2. Поиск официальных коммерческих и государственных тендеров ЕИС
  const shuffledQueries = [...TARGET_TENDER_QUERIES].sort(() => 0.5 - Math.random());
  const selectedQueries = shuffledQueries.slice(0, 2);

  for (const query of selectedQueries) {
    log(`🔍 Поиск активных коммерческих заказов по направлению: «${query}»...`);
    const tenders = await scrapeDirectTenders(query, 4);
    log(`Найдено ${tenders.length} прямых заказов по «${query}». Анализ требований заказчиков...`);

    for (const tender of tenders) {
      try {
        log(`Анализ закупки: ${tender.customer.slice(0, 45)}...`);
        const contacts = await fetchTenderContacts(tender.tenderUrl);

        // ИИ-анализ и определение параметров услуги и отрасли
        const aiAnalysis = await analyzeLeadWithAi(`${tender.title}. Заказчик: ${tender.customer}`, tender.customer);

        // Определение точной услуги студии по тексту запроса
        let service = "3D моушен-дизайн и анимация";
        const titleLower = tender.title.toLowerCase();
        if (/3d|cgi|трехмерн|визуализац/i.test(titleLower)) {
          service = "3D моушен-дизайн и анимация";
        } else if (/анимац|мульт|персонаж/i.test(titleLower)) {
          service = "2D и 3D мультипликация";
        } else if (/нейросет|ии|ai/i.test(titleLower)) {
          service = "ИИ видеоролики и графика";
        } else if (/моушн|видеоролик|фильм|видеопроизводств|видеосъемк|ролик/i.test(titleLower)) {
          service = "2D моушен-дизайн и анимация";
        }

        const phone = contacts.phone;
        const email = contacts.email;
        if (phone) log(`📞 Найден телефон контрактного управляющего: ${phone}`);
        if (email) log(`✉️ Найден email отдела закупок: ${email}`);

        const leadId = `tender-${tender.regNumber || Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const leadRecord = {
          id: leadId,
          company: tender.customer,
          industry: aiAnalysis.industry || "Рекламные агентства и продакшн",
          service: service,
          request_text: `${tender.title}. ${email ? 'Email: ' + email : ''}`,
          budget: tender.price || "По согласованию",
          source: "ЕИС Закупки (Гос/Комм тендер)",
          source_type: "tender",
          url: tender.tenderUrl,
          contact_name: "Отдел закупок / Тендерный комитет",
          role: "Ответственный за закупку",
          phone: phone || null,
          telegram: null,
          email: email || null,
          suggested_solution: `Подготовка коммерческого предложения и портфолио студии по направлению «${service}» под техническое задание: ${tender.title}.`,
          score: phone ? 94 : (email ? 90 : 86),
          verified_direct: true,
          status: phone ? "new" : (email ? "in_review" : "contacts_unconfirmed"),
          created_at: new Date().toISOString()
        };

        const saved = await db.addLead(leadRecord);
        if (saved) {
          allLeads.push(saved);
          log(`🔥 В базу добавлен подтвержденный заказ: ${tender.customer.slice(0, 35)} (${tender.price})`);
        }
      } catch (err) {
        console.warn('[AI Hunter] Ошибка обработки заказа:', err.message);
      }
    }
  }

  log(`✅ Поиск завершен. Найдено и сохранено целевых прямых заказов: ${allLeads.length}`);
  return allLeads;
}
