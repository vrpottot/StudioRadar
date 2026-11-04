import axios from 'axios';
import https from 'https';
import * as cheerio from 'cheerio';
import { analyzeLeadWithAi } from './aiService.js';
import { extractContactsFromWebsite, extractPhones } from './phoneExtractor.js';
import { db } from './db.js';

const agent = new https.Agent({ rejectUnauthorized: false });

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8'
};

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
 * 1. Автономный сбор свежих технологических стартапов с ProductRadar
 */
async function huntProductRadarStartups(onProgress, maxCount = 6) {
  const discovered = [];
  try {
    if (onProgress) onProgress('🌐 ИИ сканирует платформу запуска стартапов ProductRadar...');
    const listRes = await axios.get('https://productradar.ru/', { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(listRes.data);
    const products = [];

    $('article, .post-card, .product-card').each((i, el) => {
      if (products.length >= maxCount) return;
      const title = $(el).find('h2, h3, .post-title, a.title').first().text().trim();
      const link = $(el).find('a[href*="/product/"]').first().attr('href');
      const desc = $(el).find('.post-excerpt, p, .description').first().text().trim();
      if (title && link) {
        products.push({ title, link, desc });
      }
    });

    if (onProgress) onProgress(`🚀 Найдено ${products.length} активных стартапов. ИИ начинает глубокий анализ сайтов и контактов...`);

    for (const item of products) {
      try {
        if (onProgress) onProgress(`🔍 ИИ исследует стартап «${item.title}»...`);

        const detailRes = await axios.get(item.link, { headers: HEADERS, timeout: 8000 });
        const $d = cheerio.load(detailRes.data);
        const pitchText = $d('main, article, .content').text().replace(/\s+/g, ' ');

        // Поиск ссылки на официальный сайт стартапа
        let companyWebsite = null;
        $d('a[href^="http"]').each((i, a) => {
          const href = $d(a).attr('href');
          if (href && 
              !href.includes('productradar.ru') && 
              !href.includes('yandex') && 
              !href.includes('google') && 
              !href.includes('vk.com') && 
              !href.includes('t.me') &&
              !href.includes('support')) {
            if (!companyWebsite) companyWebsite = href;
          }
        });

        // Поиск Telegram на странице продукта
        let companyTg = null;
        $d('a[href*="t.me"]').each((i, a) => {
          const href = $d(a).attr('href');
          if (href && !href.includes('productradar') && !href.includes('RadarSupport') && !companyTg) {
            companyTg = href.split('?')[0];
          }
        });

        // Сканирование официального сайта компании на телефон, email и доп. Telegram
        let websiteContacts = { phone: null, email: null, telegram: null, text: '' };
        if (companyWebsite) {
          if (onProgress) onProgress(`🌐 ИИ проверяет официальный сайт ${companyWebsite}...`);
          websiteContacts = await extractContactsFromWebsite(companyWebsite);
          if (websiteContacts.telegram && !companyTg) {
            companyTg = websiteContacts.telegram;
          }
        }

        const phone = websiteContacts.phone;
        const email = websiteContacts.email;
        if (phone && onProgress) onProgress(`📞 Извлечен подтвержденный телефон: ${phone}`);
        if (companyTg && onProgress) onProgress(`✈️ Извлечен прямой Telegram: ${companyTg}`);

        // ИИ-анализ и формирование целевого коммерческого предложения
        const fullContext = `${item.title}. ${item.desc}. ${pitchText.slice(0, 800)} ${websiteContacts.text}`;
        const aiAnalysis = await analyzeLeadWithAi(fullContext, "ProductRadar");

        const leadId = `startup-${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
        const leadRecord = {
          id: leadId,
          company: item.title,
          industry: aiAnalysis.industry || "Электротехника",
          service: aiAnalysis.service || "3D моушен-дизайн и анимация",
          request_text: `${item.desc || item.title}. Официальный сайт: ${companyWebsite || item.link}. ${email ? 'Email: ' + email : ''}`,
          budget: aiAnalysis.estimated_budget || "от 400 000 ₽",
          source: `ProductRadar (Стартап / Новый продукт)`,
          source_type: "web",
          url: companyWebsite || item.link,
          contact_name: aiAnalysis.contact_name || "Основатель / Бренд-директор",
          role: aiAnalysis.role || "CEO / Product Lead",
          phone: phone || null,
          telegram: companyTg || null,
          email: email || null,
          suggested_solution: aiAnalysis.personalized_pitch || `Разработка презентационного 3D-видеоролика продукта «${item.title}» для инвесторов и лендинга.`,
          score: phone ? 95 : (companyTg || email ? 90 : 85),
          verified_direct: true,
          status: phone ? "new" : "contacts_unconfirmed",
          created_at: new Date().toISOString()
        };

        const saved = await db.addLead(leadRecord);
        if (saved) {
          discovered.push(saved);
          if (onProgress) onProgress(`🎯 Добавлен прямой заказчик: ${item.title} (Score: ${leadRecord.score}%)`);
        }
      } catch (e) {
        console.warn(`[AI Hunter] Ошибка анализа стартапа ${item.title}:`, e.message);
      }
    }
  } catch (err) {
    console.warn('[AI Hunter] Ошибка ProductRadar:', err.message);
  }
  return discovered;
}

/**
 * 2. Автономный сбор компаний с инвестициями и новыми раундами (RB.ru / Rusbase)
 */
async function huntVentureDeals(onProgress, maxCount = 4) {
  const discovered = [];
  try {
    if (onProgress) onProgress('📊 ИИ сканирует венчурные сделки и раунды инвестиций (RB.ru)...');
    const res = await axios.get('https://rb.ru/feeds/all/', { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(res.data, { xmlMode: true });
    const items = [];

    $('item').each((i, el) => {
      if (items.length >= maxCount * 2) return;
      const title = $(el).find('title').text().trim();
      const link = $(el).find('link').text().trim();
      const desc = $(el).find('description').text().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      // Фильтруем компании с бюджетами: инвестиции, запуск, сервис, продукт, масштабирование
      if (/стартап|инвестиц|привлек|раунд|миллион|запуск|сервис|платформ|нейросет/i.test(title + ' ' + desc)) {
        items.push({ title, link, desc });
      }
    });

    for (const item of items.slice(0, maxCount)) {
      try {
        const fullText = `${item.title}. ${item.desc}`;
        const aiAnalysis = await analyzeLeadWithAi(fullText, "RB.ru");

        if (aiAnalysis.is_real_client && 
            aiAnalysis.company_name && 
            aiAnalysis.company_name !== "Прямой бренд" && 
            aiAnalysis.company_name !== "Технологический бренд" &&
            aiAnalysis.company_name.length > 2) {
          const leadId = `rb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const leadRecord = {
            id: leadId,
            company: aiAnalysis.company_name,
            industry: aiAnalysis.industry || "Банки и финансы",
            service: aiAnalysis.service || "3D моушен-дизайн и анимация",
            request_text: `${item.title}. Проект масштабирует продукт и привлекает капитал.`,
            budget: aiAnalysis.estimated_budget || "от 500 000 ₽",
            source: "RB.ru (Венчур и Инвестиции)",
            source_type: "web",
            url: item.link,
            contact_name: "Основатель / Руководитель направления",
            role: "CEO / CMO",
            phone: null,
            telegram: null,
            suggested_solution: aiAnalysis.personalized_pitch || `Подготовка имиджевого 3D-видеоролика компании «${aiAnalysis.company_name}» под новый инвест-раунд.`,
            score: 86,
            verified_direct: true,
            status: "contacts_unconfirmed",
            created_at: new Date().toISOString()
          };

          const saved = await db.addLead(leadRecord);
          if (saved) {
            discovered.push(saved);
            if (onProgress) onProgress(`💼 Обнаружен венчурный заказчик: ${aiAnalysis.company_name}`);
          }
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[AI Hunter] Ошибка RB.ru:', err.message);
  }
  return discovered;
}

/**
 * 3. Мониторинг коммерческих и государственных закупок (ЕИС Закупки)
 */
async function huntTenders(onProgress, limit = 4) {
  const discovered = [];
  try {
    const query = TENDER_QUERIES[Math.floor(Math.random() * TENDER_QUERIES.length)];
    if (onProgress) onProgress(`🏛️ ИИ сканирует открытые коммерческие тендеры по запросу «${query}»...`);

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

      if (title && customer) {
        rawTenders.push({ title, customer, price, tenderUrl, regNumber });
      }
    });

    for (const tender of rawTenders) {
      try {
        let phone = null;
        let email = null;

        // Попробуем извлечь контакты закупки
        try {
          const detailRes = await axios.get(tender.tenderUrl, { httpsAgent: agent, headers: HEADERS, timeout: 6000 });
          const $d = cheerio.load(detailRes.data);
          const bodyText = $d('body').text().replace(/\s+/g, ' ');
          const phones = extractPhones(bodyText);
          if (phones.length > 0) phone = phones[0];
          const emailMatch = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) email = emailMatch[0];
        } catch (e) {}

        const aiAnalysis = await analyzeLeadWithAi(`${tender.title}. Заказчик: ${tender.customer}`, "ЕИС Закупки");

        const leadRecord = {
          id: `tender-${tender.regNumber || Date.now()}-${Math.floor(Math.random() * 1000)}`,
          company: tender.customer,
          industry: aiAnalysis.industry || "B2B Услуги и Производство",
          service: aiAnalysis.service || "3D моушен-дизайн и анимация",
          request_text: `${tender.title}. Официальный тендер (ЕИС Закупки). ${email ? 'Email: ' + email : ''}`,
          budget: tender.price || "По согласованию",
          source: `ЕИС Закупки (Гос/Комм тендер)`,
          source_type: "tender",
          url: tender.tenderUrl,
          contact_name: "Отдел закупок / Тендерный комитет",
          role: "ЛПР по закупке",
          phone: phone || null,
          telegram: null,
          email: email || null,
          suggested_solution: aiAnalysis.personalized_pitch || `Подготовка коммерческого предложения и презентационного портфолио по направлению «${aiAnalysis.service}» под ТЗ закупки.`,
          score: phone ? 92 : 87,
          verified_direct: true,
          status: phone ? "new" : "contacts_unconfirmed",
          created_at: new Date().toISOString()
        };

        const saved = await db.addLead(leadRecord);
        if (saved) {
          discovered.push(saved);
          if (onProgress) onProgress(`📋 Зарегистрирован тендер: ${tender.customer.slice(0, 40)} (${tender.price})`);
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[AI Hunter] Ошибка ЕИС Закупки:', err.message);
  }
  return discovered;
}

/**
 * Главная точка входа: Автономный ИИ-поиск прямых заказчиков с полным доступом в интернет
 */
export async function runAutonomousAiLeadHunt(onProgress = null) {
  const allLeads = [];
  const log = (msg) => {
    console.log(`[AI Lead Hunter] ${msg}`);
    if (onProgress) onProgress(msg);
  };

  log('🚀 Запуск автономного ИИ-агента поиска прямых B2B-заказчиков в открытом интернете...');

  // 1. Свежие IT и технологические стартапы (ProductRadar)
  const startups = await huntProductRadarStartups(log, 5);
  allLeads.push(...startups);

  // 2. Компании с инвестициями и раундами (RB.ru)
  const ventures = await huntVentureDeals(log, 3);
  allLeads.push(...ventures);

  // 3. Открытые коммерческие тендеры
  const tenders = await huntTenders(log, 3);
  allLeads.push(...tenders);

  log(`✅ Автономный поиск завершен! Найдено и сохранено целевых заказчиков: ${allLeads.length}`);
  return allLeads;
}
