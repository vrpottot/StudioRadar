import dotenv from 'dotenv';
dotenv.config();

const OMNIROUTE_URL = (process.env.OMNIROUTE_URL || 'http://127.0.0.1:20128/v1').trim();
const USE_OMNIROUTE = process.env.USE_OMNIROUTE === 'true' || Boolean(process.env.OMNIROUTE_URL);
const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();
const OPENROUTER_MODEL = (process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat').trim();
const GEMINI_API_KEY = (process.env.Google_api || process.env.GEMINI_API_KEY || '').trim();

let lastCallTime = 0;
const MIN_INTERVAL_MS = 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Вызов ИИ через локальный OmniRoute (http://localhost:20128/v1)
 */
export async function callOmniRoute(prompt, isJson = true) {
  const url = `${OMNIROUTE_URL.replace(/\/$/, '')}/chat/completions`;
  const body = {
    model: OPENROUTER_MODEL || 'auto',
    messages: [
      { role: "user", content: prompt }
    ],
    temperature: 0.1
  };

  if (isJson) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + OPENROUTER_API_KEY
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (data.choices && data.choices[0]?.message?.content) {
    const rawContent = data.choices[0].message.content.trim();
    if (isJson) {
      const cleaned = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleaned);
    }
    return rawContent;
  }

  throw new Error(`[OmniRoute Error] ${JSON.stringify(data)}`);
}

/**
 * Вызов ИИ через OpenRouter (100% работает в России без VPN напрямую)
 */
export async function callOpenRouter(prompt, isJson = true, modelOverride = null) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY не найден в .env файле');
  }

  const now = Date.now();
  const diff = now - lastCallTime;
  if (diff < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - diff);
  }
  lastCallTime = Date.now();

  const model = modelOverride || OPENROUTER_MODEL;
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const body = {
    model: model,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1
  };

  if (isJson) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'StudioRadar LeadGen'
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (data.choices && data.choices[0]?.message?.content) {
    const rawContent = data.choices[0].message.content.trim();
    if (isJson) {
      const cleaned = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleaned);
    }
    return rawContent;
  }

  const errMsg = data.error?.message || JSON.stringify(data);
  throw new Error(`[OpenRouter API Error] (${model}): ${errMsg}`);
}

/**
 * Фолбэк на Google Gemini, если OpenRouter не настроен
 */
export async function callGemini(prompt, isJson = true) {
  if (!GEMINI_API_KEY) {
    throw new Error('Ключ Google_api или OPENROUTER_API_KEY не найден в .env');
  }

  const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-lite-latest'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }]
      };
      if (isJson) {
        payload.generationConfig = { responseMimeType: "application/json" };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const text = data.candidates[0].content.parts[0].text.trim();
        return isJson ? JSON.parse(text) : text;
      }
    } catch (err) {
      // пробуем следующую модель
    }
  }

  throw new Error('Все модели Gemini временно недоступны');
}

/**
 * Универсальный вызов ИИ:
 * 1. Локальный OmniRoute (если USE_OMNIROUTE=true или запущен)
 * 2. Облачный OpenRouter (работает в РФ без VPN напрямую)
 * 3. Резервный Gemini
 */
export async function callAi(prompt, isJson = true) {
  if (USE_OMNIROUTE) {
    try {
      return await callOmniRoute(prompt, isJson);
    } catch (e) {
      console.warn('[AI] Локальный OmniRoute недоступен, пробуем OpenRouter/Gemini...');
    }
  }

  if (OPENROUTER_API_KEY) {
    return await callOpenRouter(prompt, isJson);
  }
  return await callGemini(prompt, isJson);
}

/**
 * Глубокий ИИ-анализ лида через OpenRouter / Gemini
 */
export async function analyzeLeadWithAi(rawText, sourceName = "Интернет") {
  const prompt = `
Ты — опытный коммерческий директор дизайн- и CGI-студии (специализация: 3D/2D моушн-дизайн, AI-видео, 3D анимация, интерактивные 3D сайты).
Целевые сферы клиентов студии (7 целевых отраслей + B2B агентства по ТЗ):
1. Продукты питания и напитки
2. Военная промышленность
3. Авто и мото индустрия
4. Банки и финансы
5. Газ и нефть
6. Бьюти
7. Электротехника
8. Рекламные агентства и продакшн

Твоя критически важная задача — точно разделить: кто ПРОДАЕТ свои услуги (фрилансер/соискатель), а кто ИЩЕТ ИСПОЛНИТЕЛЯ (заказчик/клиент):
- ПРОДАВЕЦ УСЛУГ (НЕ КЛИЕНТ): Если автор сообщения САМ ПРЕДЛАГАЕТ свои услуги ("Привет, я дизайнер...", "делаю анимацию", "ищу проекты/заказы/подработку", "мое портфолио"), верни "is_real_client": false.
- СОИСКАТЕЛЬ (НЕ КЛИЕНТ): Если это резюме соискателя или ссылка на шоурил/портфолио, верни "is_real_client": false.
- РУТИННЫЙ НАЙМ В ШТАТ: Если это найм рядового сотрудника на оклад в офис 5/2 (бухгалтер, кассир, оператор, стажер, junior), верни "is_real_client": false.
- МЕЛКИЙ СПАМ: Если это нарезка рилсов/shorts, копеечный монтаж до 5000 руб или курсы/обучение, верни "is_real_client": false.
- РЕАЛЬНЫЙ ЗАКАЗЧИК (КЛИЕНТ!): Если автор сообщения ИЩЕТ ИСПОЛНИТЕЛЯ, СПЕЦИАЛИСТА, ДИЗАЙНЕРА ИЛИ СТУДИЮ ПОД ПРОЕКТ ИЛИ ЗАДАЧУ ("Ищем моушн-дизайнера", "Нужно сделать 3D ролик", "Требуется анимация", "Ищем продакшн", "Задача: отрисовать графику для продукта", "Тендер"), верни СТРОГО "is_real_client": true. Наша студия берет такие проекты на аутсорс!

Текст для анализа:
"""
${rawText.slice(0, 2500)}
"""

Верни ответ СТРОГО в формате JSON:
{
  "is_real_client": true | false,
  "rejection_reason": "Причина отсева, если это не клиент (или null)",
  "company_name": "Точное название компании/бренда заказчика",
  "industry": "Одна из целевых отраслей: Продукты питания и напитки | Военная промышленность | Авто и мото индустрия | Банки и финансы | Газ и нефть | Бьюти | Электротехника | Рекламные агентства и продакшн",
  "service": "3D моушен-дизайн и анимация | 2D моушен-дизайн и анимация | ИИ видеоролики и графика | 2D и 3D мультипликация | 3D Web-приложения и интерактив",
  "contact_name": "ФИО или имя контактного лица (или 'Отдел маркетинга')",
  "role": "Должность контактного лица (напр. 'Директор по маркетингу', 'Бренд-менеджер')",
  "phone": null, // ВНИМАНИЕ: СТРОГО ЗАПРЕЩЕНО выдумывать телефон! Указывай номер ТОЛЬКО если он явно написан в исходном тексте публикации, иначе строго null!
  "estimated_budget": "Оценочный бюджет задачи (напр. 'от 500 000 ₽' или 'По согласованию')",
  "score": 85,
  "summary_task": "Краткая суть задачи клиента в 1-2 предложениях",
  "personalized_pitch": "Персонализированный оффер студии для первого звонка этому клиенту с учетом его задачи"
}
`;

  return await callAi(prompt, true);
}
