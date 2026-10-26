import axios from 'axios';
import * as cheerio from 'cheerio';
import { analyzeLeadWithAi } from './geminiService.js';
import { extractPhoneFromWebsite, lookupCompanyPhone, extractPhones } from './phoneExtractor.js';
import { db } from './db.js';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8'
};

// Целевые коммерческие поисковые паттерны в интернете
const SEARCH_INTENTS = [
  'тендер видеоролик 3D графика анимация',
  'запрос коммерческих предложений создание промо ролика',
  'ищем продакшн студию 3D презентация продукта',
  'конкурс создание анимационного ролика компания',
  'разработка интерактивного 3D конфигуратора сайт',
  'требуется создание 3D ролика производство оборудование',
  'закупка услуг по созданию видеоролика графика'
];

/**
 * Поиск в интернете через DuckDuckGo HTML (POST запрос для надежного получения результатов)
 */
async function searchWeb(query) {
  try {
    const res = await axios.post(
      'https://html.duckduckgo.com/html/',
      `q=${encodeURIComponent(query)}&b=`,
      { 
        headers: { 
          ...HEADERS, 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://html.duckduckgo.com/'
        }, 
        timeout: 8000 
      }
    );
    const $ = cheerio.load(res.data);
    const results = [];

    $('.result').each((i, el) => {
      const titleEl = $(el).find('.result__title a');
      const title = titleEl.text().trim();
      const snippet = $(el).find('.result__snippet').text().trim();
      let link = titleEl.attr('href') || '';

      // Распаковываем реальный URL из редиректа DuckDuckGo
      const match = link.match(/uddg=([^&]+)/);
      if (match) {
        link = decodeURIComponent(match[1]);
      }

      if (title && snippet && link.startsWith('http')) {
        results.push({ title, snippet, link });
      }
    });

    return results.slice(0, 6);
  } catch (e) {
    console.warn(`[AI Hunter] Ошибка поиска по запросу "${query}":`, e.message);
    return [];
  }
}

/**
 * Чтение текста целевой веб-страницы
 */
async function fetchPageText(pageUrl) {
  try {
    const res = await axios.get(pageUrl, { headers: HEADERS, timeout: 6000 });
    const $ = cheerio.load(res.data);

    // Удаляем скрипты и стили
    $('script, style, nav, footer, header').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return text.slice(0, 4000);
  } catch (e) {
    return null;
  }
}

/**
 * Автономный цикл ИИ-поиска заказов
 */
export async function runAutonomousAiLeadHunt(onProgress = null) {
  const foundLeads = [];
  const log = (msg) => {
    console.log(`[AI Lead Hunter] ${msg}`);
    if (onProgress) onProgress(msg);
  };

  log('Запуск ИИ-ассистента: генерация поисковых матриц по 7 отраслям студии...');

  // Выбираем 2 случайных поисковых интента за раз
  const selectedIntents = SEARCH_INTENTS.sort(() => 0.5 - Math.random()).slice(0, 2);

  for (const intent of selectedIntents) {
    log(`ИИ ищет в интернете: "${intent}"...`);
    const searchResults = await searchWeb(intent);

    log(`Найдено ${searchResults.length} потенциальных источников. Начинаем глубокий ИИ-анализ...`);

    for (const item of searchResults) {
      try {
        log(`ИИ изучает страницу: ${item.title.slice(0, 40)}...`);
        let pageContent = await fetchPageText(item.link);
        if (!pageContent || pageContent.length < 100) {
          pageContent = `${item.title}. ${item.snippet}`;
        }

        // Отправляем текст в Gemini для семантического анализа
        const aiEvaluation = await analyzeLeadWithAi(pageContent, item.link);

        if (aiEvaluation.is_real_client) {
          log(`🔥 ИИ подтвердил заказчика: ${aiEvaluation.company_name} (${aiEvaluation.industry})!`);

          // Ищем телефон компании, если ИИ его не нашел в тексте
          let phone = aiEvaluation.phone;
          if (!phone && aiEvaluation.company_name) {
            phone = await lookupCompanyPhone(aiEvaluation.company_name);
          }

          const leadRecord = {
            id: `ai-hunt-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            company: aiEvaluation.company_name || item.title.slice(0, 35),
            industry: aiEvaluation.industry || "Продукты питания и напитки",
            service: aiEvaluation.service || "3D моушен-дизайн и анимация",
            request_text: aiEvaluation.summary_task || item.snippet,
            budget: aiEvaluation.estimated_budget || "По согласованию",
            source: `ИИ-Агент: ${new URL(item.link).hostname}`,
            source_type: "ai_agent",
            url: item.link,
            contact_name: aiEvaluation.contact_name || "Отдел маркетинга / Заказчик",
            role: aiEvaluation.role || "ЛПР проекта",
            phone: phone || null,
            telegram: aiEvaluation.telegram || null,
            suggested_solution: aiEvaluation.personalized_pitch,
            score: aiEvaluation.score || 90,
            verified_direct: true,
            status: phone ? "new" : "contacts_unconfirmed",
            created_at: new Date().toISOString()
          };

          const saved = await db.addLead(leadRecord);
          if (saved) {
            foundLeads.push(saved);
          }
        } else {
          log(`Отсеяно ИИ: ${aiEvaluation.rejection_reason || 'не является прямым клиентом'}`);
        }
      } catch (err) {
        console.warn(`[AI Hunter] Ошибка обработки страницы ${item.link}:`, err.message);
      }
    }
  }

  log(`ИИ-поиск завершен. Найдено новых подтвержденных прямых клиентов: ${foundLeads.length}`);
  return foundLeads;
}
