/**
 * classify.js — Квалификация найденных материалов: решение «это заказ или нет»
 */
import { callLlm } from './llm.js';
import { TARGET_SERVICES, TARGET_INDUSTRIES } from './sources.js';

// Стоп-слова: предложения услуг исполнителей и резюме
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

// Стоп-слова: мелкие задачи
const CHEAP_STOP_WORDS = [
  "монтаж shorts", "рилсы по 500", "нарезка видео за отзыв", "копеечный"
];

// Стоп-слова: бюрократия 44-ФЗ
const GOV_STOP_WORDS = [
  "44-фз", "223-фз", "закон 44 фз", "электронный аукцион по 44", "мбу", "гбу", "детский сад", "школа №"
];

/**
 * Быстрый эвристический отсев спама и резюме
 * @param {string} text - Текст для проверки
 * @returns {[boolean, string|null]} - [isSpam, reason]
 */
export function fastSpamFilter(text) {
  if (!text || typeof text !== 'string') return [true, 'Пустой текст'];
  const lower = text.toLowerCase();

  for (const w of RESUME_STOP_WORDS) {
    if (lower.includes(w)) {
      return [true, `Резюме или портфолио фрилансера («${w}»)`];
    }
  }

  for (const w of STAFF_STOP_WORDS) {
    if (lower.includes(w)) {
      return [true, `Рутинный найм сотрудника в штат («${w}»)`];
    }
  }

  for (const w of CHEAP_STOP_WORDS) {
    if (lower.includes(w)) {
      return [true, `Мелкая задача / копеечный чек («${w}»)`];
    }
  }

  for (const w of GOV_STOP_WORDS) {
    if (lower.includes(w)) {
      return [true, `Госзакупка 44/223-ФЗ («${w}»)`];
    }
  }

  return [false, null];
}

/**
 * Глубокая нейросетевая квалификация через LLM
 * Принимает решение: является ли публикация/страница реальным заказом или коммерческим брифом
 * @param {object} pageData - { title, description, text, url }
 * @returns {Promise<{isOrder: boolean, lead: object|null, reason: string}>}
 */
export async function classifyLeadWithLlm(pageData) {
  const { title = '', description = '', text = '', url = '' } = pageData;

  // Быстрый фильтр стоп-слов
  const combinedSample = `${title} ${description} ${text.slice(0, 1500)}`;
  const [isSpam, spamReason] = fastSpamFilter(combinedSample);
  if (isSpam) {
    return { isOrder: false, lead: null, reason: spamReason };
  }

  const prompt = `
Ты — главный эксперт-квалификатор B2B-заказов для студии компьютерной графики, 3D/2D моушн-дизайна и видеопродакшна StudioRadar.

Проанализируй текст найденной страницы и прими СТРОГОЕ решение:
«ЯВЛЯЕТСЯ ЛИ ЭТО РЕАЛЬНЫМ КОММЕРЧЕСКИМ ЗАКАЗОМ / ТЕНДЕРОМ / БРИФОМ / ИНФОПОВОДОМ СПРОСА ОТ ПРЯМОГО КЛИЕНТА?»

Страница:
- Заголовок: "${title}"
- Описание: "${description}"
- URL: "${url}"
- Фрагмент контента:
"${text.slice(0, 2500)}"

КРИТЕРИИ ЗАКАЗА (is_order = true):
1. Компания или бренд открыто ищет студию / продакшн / команду на производство: 3D ролика, презентационного фильма, CGI графики, рекламы, эксплейнера, промо-видео, WebGL.
2. ИЛИ бренд запустил крупную кампанию/продукт/ребрендинг, и у него подтвержден бюджет и потребность в постоянной графике.
3. Это ПРЯМОЙ заказчик (не фрилансер, не соискатель работы, не инфобизнес).

КРИТЕРИИ ОТКЛОНЕНИЯ (is_order = false):
1. Фрилансер предлагает свои услуги, публикует портфолио или резюме.
2. Найм штатного сотрудника на зарплату в офис (HR вакансия, а не контракт для студии).
3. Государственные бюджетные закупки по 44-ФЗ (школы, больницы).
4. Мелкий монтаж видео за 500 рублей.

Верни ответ СТРОГО в формате JSON объекта:
{
  "is_order": true или false,
  "rejection_reason": "Причина отклонения, если false",
  "company": "Официальное название компании или бренда",
  "industry": "Одна из сфер: ${TARGET_INDUSTRIES.join(', ')}",
  "service": "Одна из услуг: ${TARGET_SERVICES.join(', ')}",
  "request_text": "Краткая суть задачи заказчика (2-3 предложения для КП)",
  "budget": "Оценка бюджета, например 'от 1 500 000 ₽' или 'По согласованию / тендер'",
  "contact_name": "ФИО или 'Отдел маркетинга / Заказчик'",
  "role": "Должность контактного лица (например, 'Директор по маркетингу')",
  "lead_type": "order (если это открытый тендер/бриф) или signal (если активность бренда в СМИ)",
  "suggested_solution": "Персонализированное предложение студии под эту задачу",
  "score": число от 60 до 98
}
`;

  try {
    const result = await callLlm(prompt, true);
    if (!result || typeof result !== 'object') {
      return { isOrder: false, lead: null, reason: 'Ошибка формата ответа ИИ' };
    }

    if (!result.is_order) {
      return { isOrder: false, lead: null, reason: result.rejection_reason || 'Не является целевым B2B-заказом' };
    }

    return {
      isOrder: true,
      lead: {
        company: result.company || 'Заказчик на тендерной площадке',
        industry: result.industry || 'Рекламные агентства и продакшн',
        service: result.service || '3D моушен-дизайн и анимация',
        request_text: result.request_text || title,
        budget: result.budget || 'По согласованию / тендер',
        source_type: 'direct',
        lead_type: result.lead_type || (url.includes('workspace') || url.includes('tender') ? 'order' : 'signal'),
        contact_name: result.contact_name || 'Тендерный комитет / Заказчик',
        role: result.role || 'Руководитель закупки',
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
