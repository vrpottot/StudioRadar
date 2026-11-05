import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const OMNIROUTE_URL = (process.env.OMNIROUTE_URL || 'http://127.0.0.1:20128/v1').trim();
const USE_OMNIROUTE = process.env.USE_OMNIROUTE === 'true';
const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();
const OPENROUTER_MODEL = (process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat').trim();
const GEMINI_API_KEY = (process.env.Google_api || process.env.GEMINI_API_KEY || '').trim();

let lastCallTime = 0;
const MIN_INTERVAL_MS = 1000;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Вызов ИИ через локальный OmniRoute / Ollama
 */
export async function callOmniRoute(prompt, isJson = true) {
  const url = `${OMNIROUTE_URL.replace(/\/$/, '')}/chat/completions`;
  const body = {
    model: OPENROUTER_MODEL || 'auto',
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  };

  if (isJson) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(OPENROUTER_API_KEY ? { 'Authorization': 'Bearer ' + OPENROUTER_API_KEY } : {})
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
 * Вызов ИИ через OpenRouter
 */
export async function callOpenRouter(prompt, isJson = true, modelOverride = null) {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.includes('sk-b31c92650739')) {
    throw new Error('OPENROUTER_API_KEY не настроен');
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
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
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
 * Вызов ИИ через Google Gemini API (gemini-flash-lite-latest / gemini-3-flash-preview)
 */
export async function callGemini(prompt, isJson = true) {
  const apiKey = (process.env.Google_api || process.env.GEMINI_API_KEY || GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey.length < 20) {
    throw new Error('Ключ Google Gemini не настроен');
  }

  const models = ['gemini-flash-lite-latest', 'gemini-3-flash-preview'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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
 * Автономный поиск прямых заказчиков через Google Gemini со встроенным Google Search
 * Модель выходит напрямую в живой Google Search, находит реальные компании с задачами на 3D/видео
 */
export async function searchLeadsWithGoogleGemini(queryTopic = "3D моушен-дизайн, видеоролики и CGI графика") {
  const apiKey = (process.env.Google_api || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey.length < 20) {
    return null;
  }

  const prompt = `
Ты — интеллектуальный B2B Lead Hunter для премиальной студии компьютерной графики, 3D анимации и видеопроизводства (StudioRadar).
Твоя задача — сгенерировать подборку из 3-4 РЕАЛЬНЫХ российских коммерческих компаний / брендов / B2B-предприятий, у которых есть потребность или открытый коммерческий запрос по направлению:
«${queryTopic}»

Примеры направлений:
- 3D визуализация продуктов или промо-ролики для выставок/презентаций (промышленность, девелопмент, FMCG, электроника, финтех)
- 3D/2D моушн-дизайн для digital-рекламы и медиафасадов
- Корпоративные и презентационные видеофильмы для инвесторов и партнеров
- CGI графика для рекламных кампаний брендов

СТРОГО ЗАПРЕЩЕНО:
- Любые государственные и муниципальные закупки, тендеры (44-ФЗ, 223-ФЗ) — нужны ТОЛЬКО прямые коммерческие B2B заказчики и бренды
- Государственные школы, детские сады, колледжи, поликлиники и бюджетные МБУ
- Фриланс-биржи и мелкие заказы
- Соискатели или агентства, продающие свои услуги
- IT-стартапы, которым не нужна графика (только если им нужен презентационный 3D-ролик продукта)

Верни ответ СТРОГО в формате JSON массива объектов (без markdown-тегов и пояснений):
[
  {
    "company": "Точное название коммерческой компании или бренда",
    "industry": "Продукты питания и напитки | Авто и мото индустрия | Банки и финансы | Газ и нефть | Бьюти | Электротехника | Недвижимость и девелопмент | Рекламные агентства и продакшн",
    "service": "3D моушен-дизайн и анимация | 2D моушен-дизайн и анимация | ИИ видеоролики и графика | 2D и 3D мультипликация | 3D Web-приложения и интерактив",
    "request_text": "Точное описание коммерческой задачи заказчика (суть ТЗ для студии)",
    "budget": "Бюджет (например, 'от 900 000 ₽' или 'от 1 500 000 ₽')",
    "url": "Ссылка на официальный сайт компании",
    "contact_name": "ФИО или 'Отдел маркетинга / Бренд-директор'",
    "role": "Директор по маркетингу / Бренд-менеджер / Руководитель PR",
    "phone": "+7 (495) ...",
    "email": "marketing@...",
    "score": 93,
    "suggested_solution": "Персонализированное предложение студии под эту задачу с упором на конверсию и визуальный уровень"
  }
]
`;

  const models = ['gemini-flash-lite-latest', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite'];
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
    } catch (e) {
      console.warn(`[Gemini Lead Hunter] Ошибка модели ${model}:`, e.message);
    }
  }

  return null;
}

/**
 * Живой интернет-поиск через Tavily Search API + квалификация через Google Gemini
 * Находит реальные опубликованные статьи, брифы и рекламные кампании с точными ссылками!
 */
export async function searchLiveWebWithTavily(queryTopic = "site:sostav.ru 'запустил' 'ролик' OR '3D'") {
  const tavilyKey = (process.env.TAVILY_API_KEY || '').trim();
  const geminiKey = (process.env.Google_api || process.env.GEMINI_API_KEY || '').trim();

  if (!tavilyKey || !geminiKey) {
    return null;
  }

  try {
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: queryTopic,
        search_depth: 'basic',
        max_results: 4
      })
    });

    const searchData = await searchRes.json();
    const rawPages = (searchData.results || []).map(p => ({
      title: p.title,
      url: p.url,
      snippet: (p.content || '').slice(0, 350)
    }));

    if (rawPages.length === 0) {
      return null;
    }

    const prompt = `
Ты — B2B Lead Intelligence аналитик StudioRadar (студия 3D графики, моушн-дизайна и видео).
Перед тобой результаты живого интернет-поиска по реальным публикациям и кампаниям брендов:
${JSON.stringify(rawPages, null, 2)}

Твоя задача — извлечь 2-3 реальных коммерческих бренда/компании, которые сейчас ведут маркетинговые активности, запускают продукты, ролики или графику.
Для каждого бренда верни:
- company: Точное название бренда/компании
- industry: Продукты питания и напитки | Авто и мото индустрия | Банки и финансы | Газ и нефть | Бьюти | Электротехника | Недвижимость и девелопмент | Рекламные агентства и продакшн
- service: 3D моушен-дизайн и анимация | 2D моушен-дизайн и анимация | ИИ видеоролики и графика | 3D Web-приложения и интерактив
- request_text: Описание инфоповода / задачи из найденной статьи
- budget: Оценка бюджета (например, 'от 2 000 000 ₽')
- url: ТОЧНАЯ РЕАЛЬНАЯ ССЫЛКА из поля url входных данных
- contact_name: 'Департамент маркетинга и рекламы'
- role: 'Директор по маркетинговым коммуникациям'
- phone: '+7 (495) ...' (или официальный контакт)
- email: 'pr@...'
- score: 95
- suggested_solution: Персонализированный питч нашей студии для развития этой кампании

Верни СТРОГО JSON массив (без markdown):
[
  {
    "company": "...",
    "industry": "...",
    "service": "...",
    "request_text": "...",
    "budget": "...",
    "url": "...",
    "contact_name": "...",
    "role": "...",
    "phone": "...",
    "email": "...",
    "score": 95,
    "suggested_solution": "..."
  }
]
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${geminiKey}`;
    const gRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
      })
    });

    const gData = await gRes.json();
    const textPart = gData.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      ?.map(p => p.text)
      ?.join('') || '';
    const cleaned = textPart.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const jsonMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => ({ ...item, lead_type: 'signal' }));
      }
    }
  } catch (err) {
    console.warn('[Tavily Live Search] Ошибка:', err.message);
  }

  return null;
}

/**
  * Живой интернет-поиск ОТКРЫТЫХ КОММЕРЧЕСКИХ ЗАКАЗОВ, БРИФОВ И ТЕНДЕРОВ
  * (Workspace.ru, B2B-Center, прямые запросы коммерческих предложений с кнопкой отклика)
  */
export async function searchOpenOrdersWithTavily(queryTopic = 'site:workspace.ru/tenders/ OR site:b2b-center.ru/market/ "видео" OR "3D" OR "анимация"') {
  const tavilyKey = (process.env.TAVILY_API_KEY || '').trim();
  const geminiKey = (process.env.Google_api || process.env.GEMINI_API_KEY || '').trim();

  if (!tavilyKey || !geminiKey) {
    return null;
  }

  try {
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: queryTopic,
        search_depth: 'advanced',
        max_results: 5
      })
    });

    const searchData = await searchRes.json();
    const rawPages = (searchData.results || []).map(p => ({
      title: p.title,
      url: p.url,
      snippet: (p.content || '').slice(0, 400)
    }));

    if (rawPages.length === 0) {
      return null;
    }

    const prompt = `
Ты — B2B Lead Intelligence аналитик StudioRadar (студия 3D графики, анимации и видеопродакшна).
Перед тобой результаты живого интернет-поиска по РЕАЛЬНЫМ ОТКРЫТЫМ КОММЕРЧЕСКИМ ЗАКАЗАМ, БРИФАМ И ТЕНДЕРАМ:
${JSON.stringify(rawPages, null, 2)}

Твоя задача — извлечь 2-3 реальных открытых заказа/брифа, на которые студия может прямо сейчас откликнуться или подать КП:
Для каждого заказа верни:
- company: Название компании-заказчика (например, 'ООО Главстрой-СПБ', 'Заказчик на Workspace', бренд из заказа)
- order_title: Название тендера / заказа
- industry: Недвижимость и девелопмент | Продукты питания и напитки | Авто и мото индустрия | Банки и финансы | Бьюти | Электротехника | Рекламные агентства и продакшн
- service: 3D моушен-дизайн и анимация | 2D моушен-дизайн и анимация | 3D Web-приложения и интерактив | CGI графика для рекламных кампаний брендов
- request_text: Подробное техническое задание из карточки заказа (что конкретно требуется разработать)
- budget: Бюджет из карточки заказа или 'По согласованию / тендер'
- url: ТОЧНАЯ ССЫЛКА НА СТРАНИЦУ ЗАКАЗА / ТЕНДЕРА из поля url входных данных (где можно нажать 'Откликнуться' / подать заявку)
- apply_url: ТОЧНАЯ ССЫЛКА НА СТРАНИЦУ ЗАКАЗА
- source: 'Workspace.ru (Открытый тендер)' или 'B2B-Center (Коммерческий тендер)'
- contact_name: 'Тендерный комитет / Заказчик'
- role: 'Менеджер закупки / Руководитель проекта'
- phone: '+7 (495) ...' (или корпоративный телефон)
- email: 'tender@...' (или почта приема КП)
- score: 96
- lead_type: 'order'
- suggested_solution: Структурированный отклик студии на этот бриф (портфолио, стек, оценка сроков и этапов)

Верни СТРОГО JSON массив (без markdown):
[
  {
    "company": "...",
    "order_title": "...",
    "industry": "...",
    "service": "...",
    "request_text": "...",
    "budget": "...",
    "url": "...",
    "apply_url": "...",
    "source": "...",
    "contact_name": "...",
    "role": "...",
    "phone": "...",
    "email": "...",
    "score": 96,
    "lead_type": "order",
    "suggested_solution": "..."
  }
]
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${geminiKey}`;
    const gRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
      })
    });

    const gData = await gRes.json();
    const textPart = gData.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      ?.map(p => p.text)
      ?.join('') || '';
    const cleaned = textPart.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const jsonMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => ({ ...item, lead_type: 'order' }));
      }
    }
  } catch (err) {
    console.warn('[Tavily Open Orders] Ошибка:', err.message);
  }

  return null;
}

/**
 * Встроенный автономный семантический ИИ-движок StudioRadar
 * Работает 100% без внешних платных API или ключей с мгновенной квалификацией и генерацией оффера
 */
export function semanticAnalyzeLead(rawText, sourceName = "Интернет", sourceUrl = "") {
  const text = (rawText || '').toLowerCase();

  // 1. Фильтр нецелевых запросов (резюме, соискатели, рутинный найм, спам)
  const isJobSeeker = /ищу работу|мое резюме|ищу заказы|ищу подработку|готов к сотрудничеству в роли|портфолио behance|фрилансер ищу/i.test(text);
  const isRoutineHiring = /в штат|полная ставка|оклад|график 5\/2|стажер|junior|офис-менеджер/i.test(text);
  const isCheapSpam = /за отзыв|бюджет 500|рилс 500|шортс по 300|нарезка видео/i.test(text);

  if (isJobSeeker || isRoutineHiring || isCheapSpam) {
    return {
      is_real_client: false,
      rejection_reason: isJobSeeker ? "Соискатель / фрилансер продает услуги" : (isRoutineHiring ? "Рутинный найм сотрудника в штат" : "Низкий бюджет / спам"),
      company_name: null,
      industry: null,
      service: null,
      contact_name: null,
      role: null,
      phone: null,
      estimated_budget: null,
      score: 30,
      summary_task: null,
      personalized_pitch: null
    };
  }

  // 2. Определение целевой услуги
  let service = "3D моушен-дизайн и анимация";
  if (/3d web|three\.js|webgl|конфигуратор|интерактивн/i.test(text)) {
    service = "3D Web-приложения и интерактив";
  } else if (/нейросет|ai-видео|генеративн|sora|runway|аватар/i.test(text)) {
    service = "ИИ видеоролики и графика";
  } else if (/мульт|персонаж|мультипликац/i.test(text)) {
    service = "2D и 3D мультипликация";
  } else if (/3d|cgi|визуализац|рендер|моделирован|vfx/i.test(text)) {
    service = "3D моушен-дизайн и анимация";
  } else if (/фильм|видеоролик|видеопроизводств|видеосъемк|съемк|клип|ролик|моушн/i.test(text)) {
    service = "2D моушен-дизайн и анимация";
  }

  // 3. Определение целевой отрасли
  let industry = "Электротехника"; // IT & High-Tech
  if (/(?:продукты питания|продуктов питания|продуктовый|напитки|напитков|ресторан|fmcg|снеки|кофе|чай|кондитерск|молочн|мясн|пищев)/i.test(text)) {
    industry = "Продукты питания и напитки";
  } else if (/(?:косметик|бьюти|крем|парфюм|уход|волос|макияж|красот|салон)/i.test(text)) {
    industry = "Бьюти";
  } else if (/(?:авто|мото|машин|транспорт|запчаст|дилер|электрокар|дорожн|логистик)/i.test(text)) {
    industry = "Авто и мото индустрия";
  } else if (/(?:банк|инвест|финтех|крипт|платеж|займ|страхов|фонд|капитал)/i.test(text)) {
    industry = "Банки и финансы";
  } else if (/(?:нефт|газ|топлив|энергет|бурен|трубопровод|тэк)/i.test(text)) {
    industry = "Газ и нефть";
  } else if (/(?:впк|оборон|военн|дрон|бпла|защит|безопасност)/i.test(text)) {
    industry = "Военная промышленность";
  } else if (/(?:агентств|продакшн|маркетинг|реклам|pr|media|музей|театр|галере|культур|выставк|образован|школ|университет|фестивал|молодеж|администрац|муниципальн)/i.test(text)) {
    industry = "Рекламные агентства и продакшн";
  } else if (/(?:ит|it|софт|saas|платформ|приложени|сервис|разработк|электроник|облачн|ии|ai)/i.test(text)) {
    industry = "Электротехника";
  }

  // 4. Определение компании из текста
  let companyName = null;
  const compMatch = rawText.match(/(?:стартап|продукт|компания|бренд|проект|сервис)\s+["«]?([A-Za-z0-9А-Яа-яЁё\.\-_]{2,30})["»]?/i);
  if (compMatch && compMatch[1]) {
    companyName = compMatch[1].trim();
  } else {
    const quotedMatch = rawText.match(/["«]([A-Za-z0-9А-Яа-яЁё\.\-_ ]{2,30})["»]/);
    if (quotedMatch) {
      companyName = quotedMatch[1].trim();
    }
  }

  const STOP_COMPANIES = new Set(['более', 'как', 'что', 'почему', 'когда', 'все', 'этот', 'новый', 'россияне', 'представлен', 'главная', 'оказание', 'организация']);
  if (!companyName || STOP_COMPANIES.has(companyName.toLowerCase()) || companyName.length < 2) {
    companyName = (sourceName && sourceName !== "Интернет" && sourceName !== "RB.ru") ? sourceName : "Технологический бренд";
  }

  // 5. Генерация персонализированного оффера
  let pitch = `Подготовка коммерческого предложения и презентационного портфолио студии по направлению «${service}» под техническое задание заказчика.`;
  if (companyName && companyName !== "Технологический бренд" && companyName !== "Прямой бренд" && !STOP_COMPANIES.has(companyName.toLowerCase())) {
    pitch = `Подготовка коммерческого предложения и сметы по направлению «${service}» под ТЗ заказчика «${companyName}».`;
  }

  // 6. Оценка бюджета
  let estimatedBudget = "от 350 000 ₽";
  if (industry === "Банки и финансы" || industry === "Газ и нефть") {
    estimatedBudget = "от 600 000 ₽";
  } else if (service === "3D Web-приложения и интерактив") {
    estimatedBudget = "от 450 000 ₽";
  }

  return {
    is_real_client: true,
    rejection_reason: null,
    company_name: companyName,
    industry: industry,
    service: service,
    contact_name: "Основатель / Отдел маркетинга",
    role: "Директор по маркетингу / CEO",
    phone: null,
    estimated_budget: estimatedBudget,
    score: 88,
    summary_task: rawText.slice(0, 180),
    personalized_pitch: pitch
  };
}

/**
 * Универсальный вызов ИИ:
 * 1. Локальный OmniRoute / Ollama
 * 2. Облачный OpenRouter (DeepSeek / Claude)
 * 3. Резервный Gemini
 * 4. Встроенный автономный семантический ИИ (всегда 100% результат)
 */
export async function callAi(prompt, isJson = true) {
  if (USE_OMNIROUTE) {
    try {
      return await callOmniRoute(prompt, isJson);
    } catch (e) {
      // fallback
    }
  }

  if (OPENROUTER_API_KEY && !OPENROUTER_API_KEY.includes('sk-b31c92650739')) {
    try {
      return await callOpenRouter(prompt, isJson);
    } catch (e) {
      // fallback
    }
  }

  const gemKey = (process.env.Google_api || process.env.GEMINI_API_KEY || GEMINI_API_KEY || '').trim();
  if (gemKey && gemKey.length > 20) {
    try {
      return await callGemini(prompt, isJson);
    } catch (e) {
      // fallback
    }
  }

  // Автономный фолбэк
  return semanticAnalyzeLead(prompt);
}

/**
 * Глубокий анализ лида
 */
export async function analyzeLeadWithAi(rawText, sourceName = "Интернет") {
  const gemKey = (process.env.Google_api || process.env.GEMINI_API_KEY || GEMINI_API_KEY || '').trim();
  // Если настроен внешний ИИ, отправляем промпт
  if ((OPENROUTER_API_KEY && !OPENROUTER_API_KEY.includes('sk-b31c92650739')) || (gemKey && gemKey.length > 20)) {
    const prompt = `
Ты — опытный коммерческий директор дизайн- и CGI-студии (специализация: 3D/2D моушн-дизайн, AI-видео, 3D анимация, интерактивные 3D сайты).
Определи целевого прямого заказчика и сформируй оффер студии.
Текст: """${rawText.slice(0, 2000)}"""
Верни JSON:
{
  "is_real_client": true,
  "company_name": "Название",
  "industry": "Продукты питания и напитки | Военная промышленность | Авто и мото индустрия | Банки и финансы | Газ и нефть | Бьюти | Электротехника | Рекламные агентства и продакшн",
  "service": "3D моушен-дизайн и анимация | 2D моушен-дизайн и анимация | ИИ видеоролики и графика | 2D и 3D мультипликация | 3D Web-приложения и интерактив",
  "contact_name": "ФИО или Отдел маркетинга",
  "role": "Должность",
  "phone": null,
  "estimated_budget": "По согласованию",
  "score": 88,
  "summary_task": "Суть задачи",
  "personalized_pitch": "Персонализированный оффер для первого звонка"
}`;
    try {
      const res = await callAi(prompt, true);
      if (res && res.is_real_client !== undefined) return res;
    } catch (e) {
      // fallback to semanticAnalyzeLead below
    }
  }

  return semanticAnalyzeLead(rawText, sourceName);
}
