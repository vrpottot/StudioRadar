/**
 * fetchPage.js — Загрузка и первичный разбор веб-страниц
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { sourcePlatform } from './policy.js';

export function extractLinkedInPost(html) {
  const $ = cheerio.load(html);
  const entries = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const data = JSON.parse($(element).text());
      entries.push(...(Array.isArray(data) ? data : data['@graph'] || [data]));
    } catch {}
  });
  // Do not recurse into Comment objects: their authors, countries and dates
  // describe respondents, not the company buying production services.
  const post = entries.find(item => item && [item['@type']].flat().includes('SocialMediaPosting') && typeof item.articleBody === 'string');
  if (!post?.articleBody?.trim()) return null;
  const author = [post.author].flat()[0];
  return { text: post.articleBody.trim(), publishedDate: post.datePublished || null,
    title: post.headline || '', authorName: author?.name || null,
    authorProfile: author?.url || null, authorType: author?.['@type'] || null };
}

export function extractTelegramPosts(html) {
  const $ = cheerio.load(html);
  const posts = [];
  $('.tgme_widget_message[data-post]').each((_, element) => {
    const message = $(element);
    const post = message.attr('data-post');
    const text = message.find('.tgme_widget_message_text').text().replace(/\s+/g, ' ').trim();
    const publishedDate = message.find('time[datetime]').first().attr('datetime') || null;
    if (!/^[\w]+\/\d+$/.test(post || '') || !text) return;
    posts.push({ url: `https://t.me/${post}`, title: text.slice(0, 160),
      snippet: `${publishedDate ? `Дата публикации: ${publishedDate}\n` : ''}${text}`, publishedDate });
  });
  return posts;
}

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
    const linkedInPost = sourcePlatform(url) === 'linkedin' ? extractLinkedInPost(html) : null;

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
    const published = linkedInPost?.publishedDate || $('time[datetime]').first().attr('datetime') || $('meta[property="article:published_time"]').attr('content');
    const telegramPosts = new URL(url).hostname === 't.me' ? extractTelegramPosts(html) : [];
    const selectedText = sourcePlatform(url) === 'telegram'
      ? telegramPosts.find(post => new URL(post.url).pathname === new URL(url).pathname.replace(/^\/s\//, '/'))?.snippet : null;
    const rawText = selectedText || (published ? `Дата публикации: ${published} ` : '')
      + (linkedInPost ? `${linkedInPost.authorName ? `Автор: ${linkedInPost.authorName}. ` : ''}${linkedInPost.text}` : $('body').text() || '');
    const cleanText = rawText
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]+/g, ' ')
      .trim();

    return {
      url: response.request?.res?.responseUrl || url,
      posts: telegramPosts,
      isolated_post: Boolean(linkedInPost || selectedText),
      author: linkedInPost ? { name: linkedInPost.authorName, url: linkedInPost.authorProfile, type: linkedInPost.authorType } : null,
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
