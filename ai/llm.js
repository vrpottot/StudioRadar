/**
 * llm.js — Клиент обращения к нейросетям (Google Gemini, OpenRouter, OmniRoute)
 * Вся работа с ключами и провайдерами изолирована внутри модуля ai/
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загрузка .env из текущей папки ai, папки backend или корня проекта
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

function getGeminiKey() {
  return (process.env.Google_api || process.env.GEMINI_API_KEY || '').trim();
}

function getOpenRouterKey() {
  return (process.env.OPENROUTER_API_KEY || '').trim();
}

/**
 * Вызов Google Gemini (gemini-flash-lite-latest / gemini-3-flash-preview)
 */
export async function callGemini(prompt, isJson = true) {
  const apiKey = getGeminiKey();
  if (!apiKey || apiKey.length < 20) {
    throw new Error('Ключ Google Gemini не найден в переменных окружения');
  }


  const models = ['gemini-flash-lite-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2
        }
      };
      if (isJson) {
        payload.generationConfig.responseMimeType = "application/json";
      }

      const res = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(20000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const raw = data.candidates[0].content.parts[0].text.trim();
        if (isJson) {
          const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
          return JSON.parse(cleaned);
        }
        return raw;
      }
    } catch {
      // Пробуем следующую модель
    }
  }

  throw new Error('Модели Gemini временно недоступны');
}

/**
 * Вызов через OpenRouter (DeepSeek / Llama)
 */
export async function callOpenRouter(prompt, isJson = true) {
  const apiKey = getOpenRouterKey();
  if (!apiKey || apiKey.includes('sk-b31c92650739')) {
    throw new Error('Ключ OpenRouter не настроен');
  }

  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const body = {
    model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  };
  if (isJson) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(url, {
    method: 'POST',
        signal: AbortSignal.timeout(20000),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (data.choices && data.choices[0]?.message?.content) {
    const raw = data.choices[0].message.content.trim();
    if (isJson) {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleaned);
    }
    return raw;
  }

  throw new Error(`OpenRouter вернул ошибку: ${JSON.stringify(data.error || data)}`);
}

/**
 * Универсальный вызов LLM с каскадным переключением (Gemini -> OpenRouter)
 */
export async function callLlm(prompt, isJson = true) {
  try {
    return await callGemini(prompt, isJson);
  } catch (err) {
    try {
      return await callOpenRouter(prompt, isJson);
    } catch {
      throw new Error(`Сбой всех доступных нейросетевых провайдеров: ${err.message}`);
    }
  }
}
