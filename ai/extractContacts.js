/**
 * extractContacts.js — Извлечение и валидация контактных данных ЛПР (телефон, email, telegram, должность)
 */
import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8'
};

const PHONE_REGEX = /(?:\+7|8)[\s\-\(]*(\d{3})[\s\-\)]*(\d{3})[\s\-]*(\d{2})[\s\-]*(\d{2})/g;

const DUMMY_PHONES = new Set([
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
  if (DUMMY_PHONES.has(phone)) return false;
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

export function extractEmailFromText(text) {
  if (!text) return null;
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (match) {
    const email = match[0].trim();
    if (!email.endsWith('.png') && !email.endsWith('.jpg') && !email.endsWith('.svg') && !email.includes('example.com')) {
      return email;
    }
  }
  return null;
}

export function extractTelegramFromText(text) {
  if (!text) return null;
  const tgMatch = text.match(/(?:https?:\/\/)?t\.me\/([a-zA-Z0-9_]{4,})/i) || text.match(/(?<![a-zA-Z0-9_.+-])@([a-zA-Z0-9_]{4,})/);
  if (tgMatch) {
    const username = tgMatch[1];
    if (!['share', 'joinchat', 'channel', 'bot', 'all', 'everyone'].includes(username.toLowerCase())) {
      return `https://t.me/${username}`;
    }
  }
  return null;
}

/**
 * Глубокое сканирование сайта компании на прямые контакты (главная, /contacts, /about)
 */
export async function extractContactsFromWebsite(domainUrl) {
  if (!domainUrl || typeof domainUrl !== 'string') {
    return { phone: null, email: null, telegram: null };
  }

  let baseUrl = domainUrl.trim();
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  baseUrl = baseUrl.replace(/\/$/, '');

  const paths = ['', '/contacts', '/kontakty', '/about', '/o-kompanii'];
  let phone = null;
  let email = null;
  let telegram = null;

  for (const path of paths) {
    if (phone && email && telegram) break;

    try {
      const resp = await axios.get(`${baseUrl}${path}`, {
        timeout: 4000,
        headers: HEADERS,
        maxRedirects: 3
      });

      if (resp.status === 200 && typeof resp.data === 'string') {
        const html = resp.data;
        const $ = cheerio.load(html);
        const text = $('body').text().replace(/\s+/g, ' ');

        // Поиск tel:
        if (!phone) {
          const telHref = $('a[href^="tel:"]').first().attr('href');
          if (telHref) {
            phone = extractPhoneFromText(telHref);
          }
          if (!phone) {
            phone = extractPhoneFromText(text);
          }
        }

        // Поиск mailto:
        if (!email) {
          const mailHref = $('a[href^="mailto:"]').first().attr('href');
          if (mailHref) {
            const candidate = mailHref.replace(/^mailto:/i, '').split('?')[0].trim();
            if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(candidate)) {
              email = candidate;
            }
          }
          if (!email) {
            email = extractEmailFromText(text);
          }
        }

        // Поиск telegram:
        if (!telegram) {
          $('a[href*="t.me"]').each((_, el) => {
            const href = $(el).attr('href');
            if (href && !href.includes('share') && !telegram) {
              telegram = href.split('?')[0];
            }
          });
        }
      }
    } catch {
      // Игнорируем ошибки недоступных подстраниц
    }
  }

  return { phone, email, telegram };
}
