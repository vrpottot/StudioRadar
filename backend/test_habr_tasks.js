import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8'
};

async function testHabrTasks() {
  const queries = ['3D', 'видеоролик', 'моушн', 'анимация'];
  for (const q of queries) {
    try {
      const url = `https://freelance.habr.com/tasks?q=${encodeURIComponent(q)}`;
      const res = await axios.get(url, { headers: HEADERS, timeout: 6000 });
      const $ = cheerio.load(res.data);
      const tasks = [];

      $('.task__title a, article.task').each((i, el) => {
        if (tasks.length >= 3) return;
        const a = $(el).is('a') ? $(el) : $(el).find('.task__title a');
        const title = a.text().trim();
        const link = a.attr('href');
        const price = $(el).find('.task__price, .count').text().trim();
        if (title && link) {
          tasks.push({
            title,
            link: link.startsWith('http') ? link : `https://freelance.habr.com${link}`,
            price: price || 'Договорная'
          });
        }
      });

      console.log(`[Habr Tasks "${q}"] Status: ${res.status}, Found: ${tasks.length}`);
      tasks.forEach(t => console.log(' ->', t.title, '| Price:', t.price, '| URL:', t.link));
    } catch (e) {
      console.log(`[Habr Tasks "${q}"] Error:`, e.message);
    }
  }
}

testHabrTasks();
