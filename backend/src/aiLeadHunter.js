import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchLeadsWithGoogleGemini } from './aiService.js';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// 7 Целевых коммерческих сфер студии (FMCG, Авто, Банки, Нефть/Газ, Бьюти, Электроника, Девелопмент, Агентства)
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

  log('🚀 Запуск чистого поиска прямых коммерческих B2B-заказчиков и брендов (без тендеров)...');

  const apiKey = (process.env.Google_api || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey.length < 20) {
    log('⚠️ API-ключ Google Gemini не настроен или некорректен.');
    return [];
  }

  // Выбираем 2 случайных направления для глубокого сканирования
  const shuffled = [...COMMERCIAL_SEARCH_TOPICS].sort(() => 0.5 - Math.random());
  const selectedTopics = shuffled.slice(0, 2);

  for (const topic of selectedTopics) {
    log(`🔎 ИИ анализирует открытый веб по направлению: «${topic}»...`);
    try {
      const geminiLeads = await searchLeadsWithGoogleGemini(topic);
      if (geminiLeads && geminiLeads.length > 0) {
        log(`✨ Найдено ${geminiLeads.length} прямых коммерческих запросов по направлению «${topic}»!`);
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
      console.warn('[AI Hunter] Ошибка поиска:', e.message);
    }
  }

  log(`✅ Поиск завершен. Найдено и сохранено прямых B2B-заказчиков: ${allLeads.length}`);
  return allLeads;
}
