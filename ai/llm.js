/** LLM transport: preserve actionable provider errors without exposing credentials. */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directory, '../backend/.env') });
dotenv.config({ path: path.resolve(directory, '../.env') });
dotenv.config();

const geminiKey = () => process.env.GEMINI_API_KEY?.trim() || process.env.Google_api?.trim() || '';
const routerKey = () => (process.env.OPENROUTER_API_KEY || '').trim();

export function safeErrorMessage(value) {
  let message = String(value || 'Неизвестная ошибка');
  for (const key of [geminiKey(), routerKey(), process.env.Google_api, process.env.EXA_API_KEY, process.env.TAVILY_API_KEY]) {
    if (key) message = message.split(key).join('[REDACTED]');
  }
  return message.replace(/([?&](?:key|api_key)=)[^&\s]+/gi, '$1[REDACTED]').slice(0, 800);
}

export class AiProviderError extends Error {
  constructor(provider, status, detail) {
    const hint = status === 429 ? 'Проверьте квоту и баланс провайдера.'
      : [400, 401, 403].includes(status) ? 'Проверьте ключ, доступ к модели и доступность API в вашем регионе.' : '';
    super(safeErrorMessage(`${provider}${status ? ` HTTP ${status}` : ''}: ${detail}. ${hint}`));
    this.name = 'AiProviderError';
    this.provider = provider;
    this.status = status;
    this.code = 'AI_PROVIDER_ERROR';
  }
}

function parseContent(text, isJson) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Провайдер вернул пустой ответ');
  const raw = text.trim();
  return isJson ? JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()) : raw;
}

export async function callGemini(prompt, isJson = true, { request = fetch } = {}) {
  const key = geminiKey();
  if (!key) throw new AiProviderError('Gemini', null, 'GEMINI_API_KEY не настроен');
  const models = [...new Set([process.env.GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-2.5-flash-lite'].filter(Boolean))];
  const failures = [];
  for (const model of models) {
    try {
      const response = await request(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', signal: AbortSignal.timeout(20000),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: {
          temperature: 0.1, maxOutputTokens: 4096,
          ...(isJson ? { responseMimeType: 'application/json' } : {})
        } })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new AiProviderError('Gemini', response.status, `${model}: ${data.error?.message || response.statusText || 'Ошибка API'}`);
        // Invalid credentials and blocked regions are account issues, not model availability.
        if ([400, 401, 403].includes(response.status)) throw error;
        failures.push(error);
        continue;
      }
      const content = data.candidates?.[0]?.content?.parts?.filter(part => part.text && !part.thought).map(part => part.text).join('');
      return parseContent(content, isJson);
    } catch (error) {
      if (error instanceof AiProviderError && [400, 401, 403].includes(error.status)) throw error;
      failures.push(error instanceof AiProviderError ? error : new AiProviderError('Gemini', null, `${model}: ${error.message}`));
    }
  }
  throw new AiProviderError('Gemini', null, failures.map(error => error.message).join('; '));
}

export async function callOpenRouter(prompt, isJson = true, { request = fetch } = {}) {
  const key = routerKey();
  if (!key) throw new AiProviderError('OpenRouter', null, 'OPENROUTER_API_KEY не настроен');
  try {
    const response = await request('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: prompt }], temperature: 0.1,
        ...(isJson ? { response_format: { type: 'json_object' } } : {}) })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) throw new AiProviderError('OpenRouter', response.status, data.error?.message || response.statusText || 'Ошибка API');
    return parseContent(data.choices?.[0]?.message?.content, isJson);
  } catch (error) {
    throw error instanceof AiProviderError ? error : new AiProviderError('OpenRouter', null, error.message);
  }
}

export function applyAiSettings(settings = {}) {
  if (['autonomous', 'auto', 'gemini', 'openrouter'].includes(settings.ai_provider)) process.env.AI_PROVIDER = settings.ai_provider;
  if (settings.gemini_api_key?.trim()) process.env.GEMINI_API_KEY = settings.gemini_api_key.trim();
  if (settings.openrouter_api_key?.trim()) process.env.OPENROUTER_API_KEY = settings.openrouter_api_key.trim();
}

export async function callLlm(prompt, isJson = true, options = {}) {
  const selected = process.env.AI_PROVIDER || 'auto';
  const providers = selected === 'gemini' ? [callGemini] : selected === 'openrouter' ? [callOpenRouter] : [callGemini, callOpenRouter];
  const failures = [];
  for (const provider of providers) {
    try { return await provider(prompt, isJson, options); }
    catch (error) { failures.push(safeErrorMessage(error.message)); }
  }
  const error = new Error(`Квалификация заказов не выполнена. ${failures.join(' | ')}`);
  error.code = 'AI_PROVIDER_ERROR';
  throw error;
}

export async function checkLlm() {
  const result = await callLlm('Return exactly this JSON: {"ok":true}', true);
  if (result?.ok !== true) throw new AiProviderError('AI', null, 'Некорректный ответ проверки подключения');
  return { ok: true, provider: process.env.AI_PROVIDER || 'auto', message: 'Квалификатор доступен' };
}
