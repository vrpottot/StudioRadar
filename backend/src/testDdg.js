import axios from 'axios';
import * as cheerio from 'cheerio';

async function testDDG() {
  const q = 'тендер 3D ролик';
  const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q);
  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9'
    }
  });
  console.log('Status:', res.status, 'HTML length:', res.data.length);
  const $ = cheerio.load(res.data);
  const titles = [];
  $('a.result__url, a.result__snippet, .result__title a').each((i, el) => {
    titles.push($(el).text().trim() + ' -> ' + $(el).attr('href'));
  });
  console.log('Found titles count:', titles.length);
  titles.slice(0, 5).forEach(t => console.log('-', t));
}

testDDG().catch(console.error);
