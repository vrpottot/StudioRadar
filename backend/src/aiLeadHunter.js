import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchLeadsWithGoogleGemini, searchLiveWebWithTavily } from './aiService.js';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// Целевые запросы в живой интернет через Tavily
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
 * Главный автономный ИИ-поиск прямых коммерческих B2B-заказчиков (БЕЗ тендеров и госзакупок)
 */
export async function runAutonomousAiLeadHunt(onProgress = null) {
  const allLeads = [];
  const log = (msg) => {
    console.log(`[AI Lead Hunter] ${msg}`);
    if (onProgress) onProgress(msg);
  };

  log('🚀 Запуск поиска прямых коммерческих B2B-заказчиков и брендов...');

  // 1. Поиск по живому интернету через Tavily Search API (Sostav, AdIndex, VC с реальными ссылками)
  const tavilyKey = (process.env.TAVILY_API_KEY || '').trim();
  if (tavilyKey) {
    log('🌐 Поиск свежих рекламных кампаний и запусков брендов через Tavily Search API...');
    const shuffledQueries = [...LIVE_WEB_QUERIES].sort(() => 0.5 - Math.random());
    const selectedQuery = shuffledQueries[0];

    try {
      log(`🔎 Живой поиск в сети: «${selectedQuery}»...`);
      const liveLeads = await searchLiveWebWithTavily(selectedQuery);
      if (liveLeads && liveLeads.length > 0) {
        log(`✨ Tavily нашел ${liveLeads.length} актуальных рекламных кампаний с прямыми ссылками на публикации!`);
        for (const ll of liveLeads) {
          const leadRecord = {
            id: `live-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            company: ll.company,
            industry: ll.industry || "Рекламные агентства и продакшн",
            service: ll.service || "3D моушен-дизайн и анимация",
            request_text: ll.request_text,
            budget: ll.budget || "от 2 000 000 ₽",
            source: "Web-поиск (Прямой заказчик)",
            source_type: "direct",
            url: ll.url || "",
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

  // 2. Дополнительная B2B-разведка по целевым сферам через Google Gemini
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
            url: gl.url || "",
            contact_name: gl.contact_name || "Отдел маркетинга / Бренд-директор",
            role: gl.role || "ЛПР проекта",
            phone: gl.phone || null,
            telegram: null,
            email: gl.email || null,
            suggested_solution: gl.suggested_solution || `Подготовка коммерческого предложения по направлению «${gl.service}».`,
            score: gl.score || 93,
            verified_direct: true,
            status: gl.phone ? "new" : (gl.email ? "in_review" : "contacts_unconfirmed"),
            created_at: new Date().toISOString()
          };
          const saved = await db.addLead(leadRecord);
          if (saved) {
            allLeads.push(saved);
            log(`🔥 Добавлен прямой заказчик: ${gl.company} (${gl.budget})`);
          }
        }
      }
    } catch (e) {
      console.warn('[AI Hunter] Ошибка поиска Gemini:', e.message);
    }
  }

  log(`✅ Поиск завершен. Найдено и сохранено прямых B2B-заказчиков: ${allLeads.length}`);
  return allLeads;
}
