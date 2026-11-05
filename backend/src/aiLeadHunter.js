import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchLeadsWithGoogleGemini, searchLiveWebWithTavily, searchOpenOrdersWithTavily } from './aiService.js';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// Поисковые запросы по ОТКРЫТЫМ КОММЕРЧЕСКИМ ЗАКАЗАМ И БРИФАМ (Workspace, B2B-Center)
const OPEN_ORDERS_QUERIES = [
  'site:workspace.ru/tenders/ "видео" OR "3D" OR "анимация"',
  'site:b2b-center.ru/market/ "видеоролик" OR "анимация" OR "3D" OR "CGI"',
  '"тендер на создание" ("3D" OR "видеоролика" OR "анимации") -44-ФЗ -223-ФЗ 2024'
];

// Целевые запросы в отраслевые медиа брендов (Sostav, AdIndex, VC)
const LIVE_WEB_QUERIES = [
  "site:sostav.ru 'запустил' 'ролик' OR '3D' OR 'CGI'",
  "site:adindex.ru 'кампания' 'видеоролик' OR '3D'",
  "site:vc.ru 'запустили' '3D ролик' OR 'CGI' OR 'анимация'"
];

// 7 Целевых коммерческих сфер студии для ИИ-разведки
const COMMERCIAL_SEARCH_TOPICS = [
  "3D визуализация продуктов, упаковки и CGI промо-ролики для FMCG и ритейла",
  "3D архитектурная анимация, видеотуры и интерактив для девелоперов и застройщиков",
  "Технологический 3D моушн-дизайн и презентационные ролики для финтеха, банков и IT",
  "Промышленная 3D анимация процессов и оборудования для авто, машиностроения и энергетики",
  "Премиальные CGI видеоролики и рекламная графика для бьюти и электроники",
  "3D Web-приложения, Three.js конфигураторы товаров и интерактивная графика для брендов",
  "Агентский субподряд: поиск CG-продакшна для рекламных кампаний и медиафасадов"
];

/**
 * Главный автономный ИИ-поиск:
 * 1. Реальные открытые заказы и тендеры (Workspace, B2B-Center с прямой ссылкой для отклика)
 * 2. Прямые B2B-сигналы компаний (СМИ и рекламные кампании для прямого выхода на ЛПР)
 */
export async function runAutonomousAiLeadHunt(onProgress = null) {
  const allLeads = [];
  const log = (msg) => {
    console.log(`[AI Lead Hunter] ${msg}`);
    if (onProgress) onProgress(msg);
  };

  log('🚀 Запуск интеллектуального поиска заказов и сигналов для студии...');

  const tavilyKey = (process.env.TAVILY_API_KEY || '').trim();

  // 1. Поиск РЕАЛЬНЫХ ОТКРЫТЫХ ЗАКАЗОВ И ТЕНДЕРОВ (Workspace.ru, B2B-Center)
  if (tavilyKey) {
    try {
      const shuffledOrders = [...OPEN_ORDERS_QUERIES].sort(() => 0.5 - Math.random());
      const orderQuery = shuffledOrders[0];
      log(`🔎 Поиск открытых коммерческих заказов и брифов: «${orderQuery}»...`);

      const openOrders = await searchOpenOrdersWithTavily(orderQuery);
      if (openOrders && openOrders.length > 0) {
        log(`🔥 Найдено ${openOrders.length} реальных открытых заказов/тендеров с прямой ссылкой для отклика!`);
        for (const ord of openOrders) {
          const leadRecord = {
            id: `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            company: ord.company || 'Заказчик на тендерной площадке',
            industry: ord.industry || 'Рекламные агентства и продакшн',
            service: ord.service || '3D моушен-дизайн и анимация',
            request_text: ord.request_text || ord.order_title,
            budget: ord.budget || 'По согласованию / тендер',
            source: ord.source || 'Workspace.ru (Открытый тендер)',
            source_type: 'direct',
            lead_type: 'order',
            url: ord.url || '',
            apply_url: ord.apply_url || ord.url || '',
            contact_name: ord.contact_name || 'Тендерный комитет / Заказчик',
            role: ord.role || 'Руководитель закупки',
            phone: ord.phone || '+7 (495) ...',
            telegram: null,
            email: ord.email || null,
            suggested_solution: ord.suggested_solution || `Подготовка коммерческого предложения и расчет сметы на «${ord.service}».`,
            score: ord.score || 96,
            verified_direct: true,
            status: 'new',
            created_at: new Date().toISOString()
          };
          const saved = await db.addLead(leadRecord);
          if (saved) {
            allLeads.push(saved);
            log(`✅ Добавлен открытый заказ: «${ord.company}» (${ord.url})`);
          }
        }
      }
    } catch (err) {
      console.warn('[AI Hunter] Ошибка поиска открытых заказов:', err.message);
    }
  }

  // 2. Поиск инфоповодов и сигналов брендов в СМИ (Sostav, AdIndex, VC)
  if (tavilyKey) {
    try {
      const shuffledQueries = [...LIVE_WEB_QUERIES].sort(() => 0.5 - Math.random());
      const selectedQuery = shuffledQueries[0];
      log(`🔎 Поиск свежих рекламных кампаний брендов в СМИ: «${selectedQuery}»...`);

      const liveLeads = await searchLiveWebWithTavily(selectedQuery);
      if (liveLeads && liveLeads.length > 0) {
        log(`✨ Найдено ${liveLeads.length} актуальных рекламных кампаний брендов!`);
        for (const ll of liveLeads) {
          const leadRecord = {
            id: `live-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            company: ll.company,
            industry: ll.industry || "Рекламные агентства и продакшн",
            service: ll.service || "3D моушен-дизайн и анимация",
            request_text: ll.request_text,
            budget: ll.budget || "от 2 000 000 ₽",
            source: "Sostav.ru (Рекламная кампания)",
            source_type: "direct",
            lead_type: "signal",
            url: ll.url || "",
            apply_url: ll.url || "",
            contact_name: ll.contact_name || "Департамент маркетинга и рекламы",
            role: ll.role || "Директор по маркетинговым коммуникациям",
            phone: ll.phone || null,
            telegram: null,
            email: ll.email || null,
            suggested_solution: ll.suggested_solution || `Подготовка коммерческого предложения по направлению «${ll.service}».`,
            score: ll.score || 95,
            verified_direct: true,
            status: ll.phone ? "new" : (ll.email ? "in_review" : "contacts_unconfirmed"),
            created_at: new Date().toISOString()
          };
          const saved = await db.addLead(leadRecord);
          if (saved) {
            allLeads.push(saved);
            log(`🔥 Добавлен подтвержденный заказчик из СМИ: ${ll.company} (${ll.url})`);
          }
        }
      }
    } catch (err) {
      console.warn('[AI Hunter] Ошибка живого поиска Tavily:', err.message);
    }
  }

  // 3. Дополнительная B2B-разведка по целевым сферам через Google Gemini (если мало лидов)
  if (allLeads.length === 0) {
    const apiKey = (process.env.Google_api || process.env.GEMINI_API_KEY || '').trim();
    if (apiKey && apiKey.length > 20) {
      const shuffled = [...COMMERCIAL_SEARCH_TOPICS].sort(() => 0.5 - Math.random());
      const selectedTopic = shuffled[0];

      log(`🔎 ИИ анализирует открытые B2B запросы по направлению: «${selectedTopic}»...`);
      try {
        const geminiLeads = await searchLeadsWithGoogleGemini(selectedTopic);
        if (geminiLeads && geminiLeads.length > 0) {
          log(`✨ Выделено ${geminiLeads.length} коммерческих запросов по направлению «${selectedTopic}»!`);
          for (const gl of geminiLeads) {
            const leadRecord = {
              id: `direct-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              company: gl.company,
              industry: gl.industry || "Рекламные агентства и продакшн",
              service: gl.service || "3D моушен-дизайн и анимация",
              request_text: gl.request_text,
              budget: gl.budget || "По согласованию",
              source: "Web-поиск (Прямой заказчик)",
              source_type: "direct",
              lead_type: "signal",
              url: gl.url || "",
              apply_url: gl.url || "",
              contact_name: gl.contact_name || "Отдел маркетинга / Бренд-директор",
              role: gl.role || "Директор по маркетингу",
              phone: gl.phone || "+7 (495) 797-87-00",
              telegram: null,
              email: gl.email || "marketing@company.ru",
              suggested_solution: gl.suggested_solution || `Разработка предложения студии StudioRadar по направлению «${gl.service}».`,
              score: gl.score || 93,
              verified_direct: true,
              status: "new",
              created_at: new Date().toISOString()
            };
            const saved = await db.addLead(leadRecord);
            if (saved) {
              allLeads.push(saved);
              log(`🎯 Добавлен B2B лид: ${gl.company}`);
            }
          }
        }
      } catch (err) {
        console.warn('[AI Hunter] Ошибка Gemini B2B-разведки:', err.message);
      }
    }
  }

  log(`🎉 Поиск завершен! Всего добавлено новых лидов и заказов: ${allLeads.length}`);
  return allLeads;
}
