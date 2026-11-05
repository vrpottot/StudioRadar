/**
 * classify.js — Квалификация найденных материалов: решение «это прямой заказ / сигнал бренда или нет»
 * Исключает фриланс-биржи, Telegram-посты, тендерные площадки и конкурентов.
 */
import { callLlm } from './llm.js';
import { TARGET_SERVICES, TARGET_INDUSTRIES, EXCLUDE_DOMAINS } from './sources.js';

// Стоп-слова: предложения услуг частных исполнителей и резюме
const RESUME_STOP_WORDS = [
  "привет, я", "здравствуйте, я", "всем привет, я",
  "я motion", "я моушн", "я 2d", "я 3d", "я дизайнер", "я аниматор", 
  "меня зовут", "обо мне:", "навыки:",
  "в поиске новых проектов", "в поиске проектов", "ищу работу", "ищу заказы",
  "готов к работе", "готов сотрудничать", "открыт к предложениям",
  "мой стек", "мое портфолио", "моё портфолио", "шоурил", "showreel", "behance.net", "artstation",
  "гемблинг", "gambling", "слотовые", "казино", "арбитраж"
];

// Стоп-слова: рутинный найм в штат
const STAFF_STOP_WORDS = [
  "оформление по тк рф", "испытательный срок 3 месяца", "график работы 5/2 в офисе",
  "оплачиваемый отпуск 28 дней", "дмс со стоматологией"
];

// Стоп-слова: биржи фриланса и Telegram
const FREELANCE_AND_TG_STOP_WORDS = [
  "kwork", "fl.ru", "freelance.ru", "freelancehunt", "weblancer",
  "work-zilla", "youdo", "dtf.ru/findteam", "t.me/", "telegram.org"
];

// Стоп-слова: государственные закупки, аукционы и тендерные агрегаторы
const GOV_AND_TENDER_STOP_WORDS = [
  "44-фз", "223-фз", "закон 44 фз", "электронный аукцион по 44", 
  "мбу", "гбу", "детский сад", "школа №", "госзакупка", "zakupki.gov.ru", 
  "b2b-center", "rostender", "sberbank-ast", "тендерная документация",
  "протокол подведения итогов", "обеспечение заявки"
];

// Стоп-слова: студии-конкуренты, рекламирующие свои услуги
const COMPETITOR_STOP_WORDS = [
  "наша студия создает", "закажите ролик у нас", "наш продакшн предлагает",
  "мы создаем 3d ролики", "заказать 3d анимацию у нас", "стоимость наших услуг",
  "заказать видеоролик в студии", "наш прайс-лист на 3d"
];

/**
 * Быстрый эвристический отсев спама, фриланса, тендеров и резюме
 * @param {string} text - Текст для проверки
 * @param {string} [url] - URL страницы
 * @returns {[boolean, string|null]} - [isSpam, reason]
 */
export function fastSpamFilter(text, url = '') {
  if (!text || typeof text !== 'string') return [true, 'Пустой текст'];
  const lower = (text + ' ' + url).toLowerCase();

  // 1. Проверка доменов исключений
  for (const domain of EXCLUDE_DOMAINS) {
    if (lower.includes(domain)) {
      return [true, `Заблокированный источник фриланса / тендеров (${domain})`];
    }
  }

  // 2. Фриланс и телеграм
  for (const w of FREELANCE_AND_TG_STOP_WORDS) {
    if (lower.includes(w)) {
      return [true, `Биржа фриланса или Telegram («${w}»)`];
    }
  }

  // 3. Госзакупки и тендеры
  for (const w of GOV_AND_TENDER_STOP_WORDS) {
    if (lower.includes(w)) {
      return [true, `Госзакупка / тендерная площадка («${w}»)`];
    }
  }

  // 4. Резюме и частные фрилансеры
  for (const w of RESUME_STOP_WORDS) {
    if (lower.includes(w)) {
      return [true, `Резюме или портфолио фрилансера («${w}»)`];
    }
  }

  // 5. Найм в штат
  for (const w of STAFF_STOP_WORDS) {
    if (lower.includes(w)) {
      return [true, `Рутинный найм сотрудника в штат («${w}»)`];
    }
  }

  // 6. Конкуренты (самореклама других студий)
  for (const w of COMPETITOR_STOP_WORDS) {
    if (lower.includes(w)) {
      return [true, `Страница студии-конкурента («${w}»)`];
    }
  }

  return [false, null];
}

/**
 * Глубокая нейросетевая квалификация через LLM
 * Принимает решение: является ли публикация/страница реальным прямым заказом или маркетинговым сигналом бренда
 * @param {object} pageData - { title, description, text, url }
 * @returns {Promise<{isOrder: boolean, lead: object|null, reason: string}>}
 */
export async function classifyLeadWithLlm(pageData) {
  const { title = '', description = '', text = '', url = '' } = pageData;

  // Быстрый фильтр стоп-слов
  const combinedSample = `${title} ${description} ${text.slice(0, 1500)}`;
  const [isSpam, spamReason] = fastSpamFilter(combinedSample, url);
  if (isSpam) {
    return { isOrder: false, lead: null, reason: spamReason };
  }

  const prompt = `
Ты — главный эксперт-квалификатор B2B-заказов для студии компьютерной графики, 3D/2D моушн-дизайна и видеопродакшна StudioRadar.

Проанализируй текст найденной страницы и прими СТРОГОЕ решение:
«ЯВЛЯЕТСЯ ЛИ ЭТО ПРЯМЫМ КОММЕРЧЕСКИМ ЗАКАЗОМ ИЛИ МАРКЕТИНГОВЫМ СИГНАЛОМ БРЕНДА?»

Страница:
- Заголовок: "${title}"
- Описание: "${description}"
- URL: "${url}"
- Фрагмент контента:
"${text.slice(0, 2500)}"

КРИТЕРИИ ЗАКАЗА / СИГНАЛА БРЕНДА (is_order = true):
1. ПРЯМОЙ БРИФ / ЗАКАЗ (lead_type = 'order'): Компания или бренд открыто ищет студию / продакшн / команду на производство: 3D ролика, презентационного фильма, CGI графики, рекламы, эксплейнера, промо-видео, WebGL.
2. МАРКЕТИНГОВЫЙ СИГНАЛ БРЕНДА (lead_type = 'signal'): Бренд запустил крупную рекламную кампанию, презентовал новый продукт, проводит ребрендинг с использованием 3D/CGI/анимации. Есть подтвержденный коммерческий бюджет и потребность в качественном визуальном контенте, а также понятный ЛПР (Директор по маркетингу, Бренд-директор, Руководитель коммуникаций).
3. Это ПРЯМОЙ коммерческий клиент или бренд (не биржа фриланса, не телеграм-чат, не соискатель, не инфобизнес).

КРИТЕРИИ СТРОГОГО ОТКЛОНЕНИЯ (is_order = false):
1. Биржи фриланса (fl.ru, kwork, freelancehunt и др.) или частный исполнитель предлагает свои услуги/портфолио.
2. Государственные или бюджетные закупки по 44-ФЗ / 223-ФЗ, электронные аукционы, закупки для школ/больниц.
3. Telegram-каналы или чаты.
4. Другая студия или агентство просто рекламирует свои услуги ("мы снимем вам ролик от 100 000 руб").
5. Вакансия штатного сотрудника с оформлением по ТК в офис.

Верни ответ СТРОГО в формате JSON объекта:
{
  "is_order": true или false,
  "rejection_reason": "Причина отклонения, если false",
  "company": "Официальное название компании или бренда (например: Самокат, Сбер, Роллтон, ПИК)",
  "industry": "Одна из сфер: ${TARGET_INDUSTRIES.join(', ')}",
  "service": "Одна из услуг: ${TARGET_SERVICES.join(', ')}",
  "request_text": "Краткая суть коммерческой задачи или рекламной кампании бренда (2-3 емких предложения для подготовки КП)",
  "budget": "Оценка бюджета, например 'от 1 500 000 ₽' или 'Бюджет коммерческой кампании'",
  "contact_name": "ФИО ЛПР или 'Директор по маркетингу / Бренд-директор'",
  "role": "Должность контактного лица (например, 'Директор по бренду и коммуникациям')",
  "lead_type": "order (если это прямой бриф/запрос) или signal (если это рекламная кампания/запуск продукта в СМИ)",
  "suggested_solution": "Персонализированное предложение студии StudioRadar под эту задачу",
  "score": число от 75 до 98
}
`;

  try {
    const result = await callLlm(prompt, true);
    if (!result || typeof result !== 'object') {
      return { isOrder: false, lead: null, reason: 'Ошибка формата ответа ИИ' };
    }

    if (!result.is_order) {
      return { isOrder: false, lead: null, reason: result.rejection_reason || 'Не является целевым B2B-заказом или брендом' };
    }

    return {
      isOrder: true,
      lead: {
        company: result.company || 'Коммерческий заказчик',
        industry: result.industry || 'Рекламные агентства и продакшн',
        service: result.service || '3D моушен-дизайн и анимация',
        request_text: result.request_text || title,
        budget: result.budget || 'от 1 500 000 ₽',
        source_type: 'direct',
        lead_type: result.lead_type || 'order',
        contact_name: result.contact_name || 'Директор по маркетингу',
        role: result.role || 'Руководитель направления маркетинга',
        suggested_solution: result.suggested_solution || `Разработка концепции и производство «${result.service || '3D графики'}».`,
        score: typeof result.score === 'number' ? result.score : 88,
        verified_direct: true
      },
      reason: 'Квалифицировано как прямой целевой заказ'
    };
  } catch (err) {
    return { isOrder: false, lead: null, reason: `Ошибка вызова ИИ-квалификатора: ${err.message}` };
  }
}
