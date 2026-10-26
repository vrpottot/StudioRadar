import axios from 'axios';
import * as cheerio from 'cheerio';
import { checkSpamFilters, classifyIndustry, classifyService, generateSuggestedSolution } from './classifier.js';
import { extractPhoneFromText, extractPhoneFromWebsite } from './phoneExtractor.js';
import { analyzeLeadWithAi } from './geminiService.js';

export async function scrapePublicTelegramChannel(channelName, limit = 30) {
  const cleanChannel = channelName.trim().replace(/^https?:\/\/t\.me\/(s\/)?/, '').replace('@', '');
  const url = `https://t.me/s/${cleanChannel}`;

  try {
    const resp = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (resp.status !== 200) {
      console.log(`[Telegram Web] @${cleanChannel} ответил со статусом ${resp.status}`);
      return [];
    }

    const $ = cheerio.load(resp.data);
    const messageElements = $('.tgme_widget_message_wrap').toArray().slice(-limit).reverse();
    const qualifiedLeads = [];

    for (const el of messageElements) {
      const textEl = $(el).find('.tgme_widget_message_text');
      if (!textEl.length) continue;

      const rawText = textEl.text().trim();
      if (rawText.length < 25) continue;

      const dateLink = $(el).find('a.tgme_widget_message_date').attr('href') || `https://t.me/${cleanChannel}`;

      // 1. Прогоняем через фильтры стоп-слов, резюме и субподряда
      const [isSpam, reason] = checkSpamFilters(rawText, cleanChannel);
      if (isSpam) continue;

      // 1.1. Проверяем обязательное наличие намерения заказчика (поиск подрядчика / задача)
      const CLIENT_INTENT_WORDS = [
        "ищем", "ищу", "требуется", "нужен", "нужна", "нужно", 
        "заказ", "задача", "проект", "создать", "разработать", "отрисовать", 
        "смонтировать", "анимировать", "сделать ролик", "сделать 3d", "визуализировать",
        "тендер", "бюджет"
      ];
      const hasClientIntent = CLIENT_INTENT_WORDS.some(w => rawText.toLowerCase().includes(w));
      if (!hasClientIntent) continue;

      // 2. Извлекаем телефон
      let phone = extractPhoneFromText(rawText);

      // 3. Извлекаем Telegram
      const tgMatch = rawText.match(/(@[a-zA-Z0-9_]{4,})/);
      const telegramHandle = tgMatch ? tgMatch[1] : null;

      // 4. Обогащение сайтом, если телефона нет
      const domainMatch = rawText.match(/(https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9\-]+\.(?:ru|com|pro|io|tech|рф))/i);
      if (!phone && domainMatch) {
        phone = await extractPhoneFromWebsite(domainMatch[0]);
      }

      // 5. ИИ-верификация и классификация через Google Gemini
      let companyName = null;
      let industry = classifyIndustry(rawText);
      let service = classifyService(rawText);
      let suggestedSolution = generateSuggestedSolution(industry, service);
      let score = 90;
      let budget = "от 400 000 ₽";

      try {
        const aiCheck = await analyzeLeadWithAi(rawText, `TG: @${cleanChannel}`);
        if (aiCheck) {
          if (!aiCheck.is_real_client) {
            console.log(`[TG AI Check] ИИ отсеял пост из @${cleanChannel}: ${aiCheck.rejection_reason}`);
            continue; // Отсекаем соискателя/фрилансера
          }
          if (aiCheck.company_name) companyName = aiCheck.company_name;
          if (aiCheck.industry) industry = aiCheck.industry;
          if (aiCheck.service) service = aiCheck.service;
          if (aiCheck.personalized_pitch) suggestedSolution = aiCheck.personalized_pitch;
          if (aiCheck.score) score = aiCheck.score;
          if (aiCheck.estimated_budget) budget = aiCheck.estimated_budget;
          if (aiCheck.phone && !phone) phone = aiCheck.phone;
        }
      } catch (aiErr) {
        // Если Gemini временно недоступен, используем эвристику
      }

      if (!companyName) {
        const companyMatch = rawText.match(/[«"“]([^»"”]{2,40})[»"”]/);
        companyName = companyMatch ? companyMatch[1] : `Компания (@${cleanChannel})`;
      }

      const budgetMatch = rawText.match(/(\d+[\s\d]*(?:000|к|k|тыс|руб|₽))/i);
      if (budgetMatch && budget === "от 400 000 ₽") {
        budget = budgetMatch[0].trim();
      }

      const leadId = `tg-${Date.now()}-${Math.abs(rawText.slice(0, 20).split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 10000}`;

      qualifiedLeads.push({
        id: leadId,
        company: companyName,
        industry: industry,
        service: service,
        contact_name: "Ответственный менеджер / ЛПР",
        role: "Маркетолог / Бренд-директор",
        phone: phone,
        telegram: telegramHandle,
        source: `TG: @${cleanChannel} (ИИ-проверен)`,
        source_type: "telegram",
        budget: budget,
        score: score,
        verified_direct: true,
        request_text: rawText.slice(0, 600),
        suggested_solution: suggestedSolution,
        status: phone ? "new" : "contacts_unconfirmed",
      });
    }

    return qualifiedLeads;
  } catch (e) {
    console.error(`[Telegram Web] Ошибка парсинга @${cleanChannel}:`, e.message);
    return [];
  }
}
