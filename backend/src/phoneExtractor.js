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
    .filter(w => !w.includes('duckduckgo') && !w.includes('google') && !w.includes('yandex'))
    .map(w => w.startsWith('http') ? w : `https://${w}`);
}

/**
 * Глубокое сканирование сайта компании на все контакты: телефон, email, Telegram
 */
export async function extractContactsFromWebsite(domain) {
  if (!domain) return { phone: null, email: null, telegram: null, text: '' };
  
  let baseUrl = domain.trim();
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  baseUrl = baseUrl.replace(/\/$/, '');

  const pathsToCheck = ['', '/contacts', '/kontakty', '/about', '/o-kompanii'];
  let foundPhone = null;
  let foundEmail = null;
  let foundTg = null;
  let accumulatedText = '';

  for (const path of pathsToCheck) {
    if (foundPhone && foundEmail && foundTg) break;

    try {
      const url = `${baseUrl}${path}`;
      const resp = await axios.get(url, {
        timeout: 4500,
        headers: HEADERS,
        maxRedirects: 3
      });

      if (resp.status === 200 && typeof resp.data === 'string') {
        const $ = cheerio.load(resp.data);
        const pageText = $('body').text().replace(/\s+/g, ' ');
        accumulatedText += ' ' + pageText.slice(0, 1500);

        // 1. Поиск в HTML разметке tel:
        if (!foundPhone) {
          const telMatches = resp.data.match(/href=["']tel:([^"']+)["']/gi);
          if (telMatches) {
            for (const m of telMatches) {
              const p = extractPhoneFromText(m);
              if (p) { foundPhone = p; break; }
            }
          }
        }

        // 2. Поиск телефона в тексте
        if (!foundPhone) {
          foundPhone = extractPhoneFromText(pageText);
        }

        // 3. Поиск Telegram
        if (!foundTg) {
          $('a[href*="t.me"]').each((i, a) => {
            const href = $(a).attr('href');
            if (href && !href.includes('share') && !href.includes('productradar') && !foundTg) {
              foundTg = href.split('?')[0];
            }
          });
        }

        // 4. Поиск Email
        if (!foundEmail) {
          const mailtoMatches = resp.data.match(/href=["']mailto:([^"']+)["']/i);
          if (mailtoMatches && mailtoMatches[1]) {
            const candidate = mailtoMatches[1].split('?')[0].trim();
            if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(candidate)) {
              foundEmail = candidate;
            }
          }
          if (!foundEmail) {
            const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) {
              foundEmail = emailMatch[0];
            }
          }
        }
      }
    } catch (e) {
      // Игнорируем недоступные подстраницы
    }
  }

  return {
    phone: foundPhone,
    email: foundEmail,
    telegram: foundTg,
    text: accumulatedText.slice(0, 3000)
  };
}

/**
 * Совместимость для extractPhoneFromWebsite
 */
export async function extractPhoneFromWebsite(domain) {
  const contacts = await extractContactsFromWebsite(domain);
  return contacts.phone;
}

/**
 * Поиск корпоративного сайта и телефона компании
 */
export async function lookupCompanyPhone(companyName, domain = null) {
  if (domain) {
    const contacts = await extractContactsFromWebsite(domain);
    if (contacts.phone) return contacts.phone;
  }
  return null;
}
