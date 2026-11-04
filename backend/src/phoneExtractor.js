import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8'
};

// Регулярные выражения для российских телефонов
const PHONE_REGEX = /(?:\+7|8)[\s\-\(]*(\d{3})[\s\-\)]*(\d{3})[\s\-]*(\d{2})[\s\-]*(\d{2})/g;

// Заведомо фиктивные номера
const FAKE_PHONES = new Set([
  '+7 (999) 999-99-99',
  '+7 (000) 000-00-00',
  '+7 (111) 111-11-11',
  '+7 (123) 456-78-90',
  '+7 (999) 123-45-67',
  '+7 (800) 000-00-00'
]);

export function formatPhone(code, p1, p2, p3) {
  return `+7 (${code}) ${p1}-${p2}-${p3}`;
}

export function isValidPhone(phone) {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (FAKE_PHONES.has(phone)) return false;
  // Проверка повторяющихся одинаковых цифр (например, 79999999999)
  if (/^(\d)\1{10}$/.test(clean)) return false;
  return true;
}

export function extractPhoneFromText(text) {
  if (!text) return null;
  const matches = [...text.matchAll(PHONE_REGEX)];
  for (const match of matches) {
    const formatted = formatPhone(match[1], match[2], match[3], match[4]);
    if (isValidPhone(formatted)) {
      return formatted;
    }
  }
  return null;
}

export function extractPhones(text) {
  if (!text) return [];
  const matches = [...text.matchAll(PHONE_REGEX)];
  const results = [];
  const seen = new Set();

  for (const match of matches) {
    const formatted = formatPhone(match[1], match[2], match[3], match[4]);
    if (isValidPhone(formatted) && !seen.has(formatted)) {
      seen.add(formatted);
      results.push(formatted);
    }
  }
  return results;
}

export function extractWebsites(text) {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s<>"]+|www\.[^\s<>"]+/gi) || [];
  return matches
    .filter(w => !w.includes('duckduckgo') && !w.includes('google'))
    .map(w => w.startsWith('http') ? w : `https://${w}`);
}

/**
 * Глубокое сканирование сайта компании на телефоны
 */
export async function extractPhoneFromWebsite(domain) {
  if (!domain) return null;
  const baseUrl = domain.startsWith('http') ? domain.replace(/\/$/, '') : `https://${domain.replace(/\/$/, '')}`;

  // Проверяем главную и типовые страницы контактов
  const pathsToCheck = ['', '/contacts', '/kontakty', '/about', '/o-kompanii'];

  for (const path of pathsToCheck) {
    try {
      const url = `${baseUrl}${path}`;
      const resp = await axios.get(url, {
        timeout: 4500,
        headers: HEADERS,
        maxRedirects: 3
      });

      if (resp.status === 200 && typeof resp.data === 'string') {
        // 1. Поиск в HTML разметке tel:
        const telMatches = resp.data.match(/href=["']tel:([^"']+)["']/gi);
        if (telMatches) {
          for (const m of telMatches) {
            const phone = extractPhoneFromText(m);
            if (phone) return phone;
          }
        }

        // 2. Поиск в тексте
        const phone = extractPhoneFromText(resp.data);
        if (phone) return phone;
      }
    } catch (e) {
      // Игнорируем недоступные подстраницы
    }
  }

  return null;
}

/**
 * Поиск корпоративного сайта и телефона компании через поисковую выдачу DuckDuckGo
 */
export async function lookupCompanyPhone(companyName) {
  if (!companyName || companyName === 'Прямой бренд' || companyName.length < 3) return null;

  try {
    const cleanName = companyName.replace(/ООО|АО|ПАО|ЗАО|ТОО|ИП/gi, '').trim();
    const query = `${cleanName} официальный сайт контакты телефон`;

    const res = await axios.post(
      'https://html.duckduckgo.com/html/',
      `q=${encodeURIComponent(query)}&b=`,
      {
        headers: {
          ...HEADERS,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://html.duckduckgo.com/'
        },
        timeout: 6000
      }
    );

    const $ = cheerio.load(res.data);
    const pageText = $('body').text();

    // 1. Проверяем, есть ли телефон прямо в сниппетах поисковой выдачи
    const phoneInSnippets = extractPhoneFromText(pageText);
    if (phoneInSnippets) {
      return phoneInSnippets;
    }

    // 2. Находим первую релевантную ссылку на сайт компании (не агрегаторы)
    const links = [];
    $('.result__url').each((i, el) => {
      let rawHref = $(el).attr('href') || '';
      const match = rawHref.match(/uddg=([^&]+)/);
      if (match) rawHref = decodeURIComponent(match[1]);

      if (rawHref.startsWith('http') && 
          !rawHref.includes('superjob') && 
          !rawHref.includes('spark-interfax') && 
          !rawHref.includes('rusprofile') && 
          !rawHref.includes('checko') && 
          !rawHref.includes('sbis') && 
          !rawHref.includes('vk.com')) {
        links.push(rawHref);
      }
    });

    if (links.length > 0) {
      const sitePhone = await extractPhoneFromWebsite(links[0]);
      if (sitePhone) return sitePhone;
    }
  } catch (e) {
    // Игнорируем сетевые ошибки поиска
  }

  return null;
}
