/**
 * fetchPage.js — Загрузка и первичный разбор веб-страниц
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { sourcePlatform } from './policy.js';

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8',
  'Cache-Control': 'no-cache'
};

/**
 * Загрузка веб-страницы и извлечение чистого текстового содержимого
 * @param {string} url - URL адрес страницы
 * @param {number} timeoutMs - Таймаут запроса в миллисекундах
 * @returns {Promise<{title: string, description: string, text: string, html: string, url: string}|null>}
 */
export async function fetchPageContent(url, timeoutMs = 6000) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return null;
  }

  try {
    const requestUrl = sourcePlatform(url) === 'telegram'
      ? url.replace('/s/', '/') + '?embed=1&mode=tme' : url;
    const response = await axios.get(requestUrl, {
      timeout: timeoutMs,
      headers: REQUEST_HEADERS,
      maxRedirects: 4,
      validateStatus: (status) => status >= 200 && status < 400
    });

    const html = typeof response.data === 'string' ? response.data : '';
    if (!html) return null;

    const $ = cheerio.load(html);

    // Удаляем технический шум и скрипты
    $('script, style, noscript, svg, iframe, nav, footer, header, form').remove();

    // Заголовок
    const title = $('title').text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('h1').first().text().trim() || '';

    // Описание
    const description = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') || '';

    // Чистый текст контента
    const published = $('time[datetime]').first().attr('datetime') || $('meta[property="article:published_time"]').attr('content');
    const rawText = (published ? `Дата публикации: ${published} ` : '') + ($('body').text() || '');
    const cleanText = rawText
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]+/g, ' ')
      .trim();

    return {
      url: response.request?.res?.responseUrl || url,
      title,
      description,
      text: cleanText.slice(0, 8000), // Ограничение для контекстного окна LLM
      html: html.slice(0, 30000)
    };
  } catch (error) {
    // Не спамим консоль при сетевых таймаутах внешних сайтов
    return null;
  }
}
