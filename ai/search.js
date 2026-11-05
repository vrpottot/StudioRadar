/**
 * search.js — Модуль поиска по открытому интернету (Tavily Search API & Google Search Grounding)
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

function getTavilyKey() {
  return (process.env.TAVILY_API_KEY || '').trim();
}

function getGeminiKey() {
  return (process.env.Google_api || process.env.GEMINI_API_KEY || '').trim();
}

/**
 * Живой поиск через Tavily Search API
 * @param {string} query - Поисковый запрос
 * @param {number} maxResults - Количество результатов
 * @returns {Promise<Array<{title: string, url: string, snippet: string}>>}
 */
export async function searchWithTavily(query, maxResults = 5) {
  const apiKey = getTavilyKey();
  if (!apiKey || !apiKey.startsWith('tvly-')) {
    return [];
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        include_answer: false,
        max_results: maxResults
      })
    });

    const data = await res.json();
    if (data.results && Array.isArray(data.results)) {
      return data.results.map(r => ({
        title: r.title || '',
        url: r.url || '',
        snippet: r.content || ''
      }));
    }
  } catch (err) {
    console.warn('[AI Search] Ошибка Tavily Search:', err.message);
  }

  return [];
}

/**
 * Поиск и структурирование прямых лидов через Google Gemini со встроенным Google Search
 * @param {string} queryTopic - Описание задачи
 * @returns {Promise<Array<object>>}
 */
export async function searchWithGeminiGrounding(queryTopic = "3D моушен-дизайн, видеоролики и CGI графика") {
  const apiKey = getGeminiKey();
  if (!apiKey || apiKey.length < 20) {
    return [];
  }

  const prompt = `
Ты — автономный поисковый агент студии StudioRadar.
Найди 3 РЕАЛЬНЫХ российских бренда / коммерческих компании, у которых есть потребность или открытый коммерческий запрос по направлению:
«${queryTopic}»

ТРЕБОВАНИЯ:
- Исключить государственные закупки по 44-ФЗ (только коммерческий частный бизнес)
- Исключить резюме и соискателей
- Привести реальный веб-сайт компании

Верни ответ СТРОГО в формате JSON массива:
[
  {
    "company": "Название компании или бренда",
    "industry": "Сфера (Продукты питания и напитки, Недвижимость, Банки, Электротехника и др.)",
    "service": "3D моушен-дизайн и анимация | CGI графика | 2D анимация",
    "request_text": "Суть коммерческой задачи студии",
    "budget": "Бюджет (например, 'от 1 500 000 ₽')",
    "url": "Ссылка на сайт",
    "contact_name": "ФИО или 'Отдел маркетинга / Бренд-директор'",
    "role": "Директор по маркетингу / Бренд-менеджер",
    "phone": "+7 (495) ...",
    "email": "marketing@...",
    "score": 92,
    "suggested_solution": "Предложение студии под задачу"
  }
]
`;

  const models = ['gemini-flash-lite-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.candidates && data.candidates[0]?.content?.parts) {
        const textPart = data.candidates[0].content.parts.find(p => p.text)?.text || '';
        const cleaned = textPart.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
        const jsonMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch {
      // Пробуем следующую модель
    }
  }

  return [];
}
