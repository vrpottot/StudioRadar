/** LLM transport: preserve actionable provider errors without exposing credentials. */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directory, '../backend/.env') });
dotenv.config({ path: path.resolve(directory, '../.env') });
dotenv.config();

const geminiKey = () => process.env.GEMINI_API_KEY?.trim() || process.env.Google_api?.trim() || '';
const transientStatus = status => [408, 429, 500, 502, 503, 504].includes(status);
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const MAX_ATTEMPTS = 3;
const REQUEST_BUDGET_MS = 60_000;
const quotaCooldowns = new Map();

function dailyQuotaDelay(data) {
  const details = data?.error?.details || [];
  const daily = details.some(detail => detail.violations?.some(item => /per.?day|requestsperday/i.test(`${item.quotaId || ''} ${item.description || ''}`)))
    || /per day limit exceeded|daily quota/i.test(data?.error?.message || '');
  if (!daily) return 0;
  const retry = details.find(item => item['@type']?.endsWith('/google.rpc.RetryInfo'))?.retryDelay;
  return /^\d+(?:\.\d+)?s$/.test(retry || '') ? Math.min(86400000, Number.parseFloat(retry) * 1000) : 3600000;
}

function retryDelay(response, data, attempt, random, now) {
  const header = response?.headers?.get?.('retry-after');
  const seconds = header != null && header.trim() !== '' ? Number(header) : NaN;
  const headerDelay = Number.isFinite(seconds) ? seconds * 1000 : header ? Date.parse(header) - now() : 0;
  const detail = data?.error?.details?.find(item => item['@type']?.endsWith('/google.rpc.RetryInfo'));
  const detailDelay = /^\d+(?:\.\d+)?s$/.test(detail?.retryDelay || '') ? Number.parseFloat(detail.retryDelay) * 1000 : 0;
  return Math.max(1000 * 2 ** attempt, headerDelay || 0, detailDelay) + Math.floor(random() * 500);
}

export function safeErrorMessage(value) {
  let message = String(value || 'Неизвестная ошибка');
  for (const key of [geminiKey(), process.env.Google_api, process.env.EXA_API_KEY, process.env.TAVILY_API_KEY]) {
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
    this.retryable = transientStatus(status);
  }
}

function parseContent(text, isJson) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Провайдер вернул пустой ответ');
  const raw = text.trim();
  return isJson ? JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()) : raw;
}

class AiResponseError extends Error {
  constructor(message, retryable = true) {
    super(message);
    this.name = 'AiResponseError';
    this.retryable = retryable;
  }
}

// Validate the subset used by our extraction and planning schemas as well as
// requesting server-side constrained output. Never coerce a model's values.
function schemaProblems(value, schema, field = '$') {
  const problems = [];
  const types = [schema.type].flat().filter(Boolean);
  const matches = type => type === 'null' ? value === null : type === 'array' ? Array.isArray(value)
    : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value)
      : type === 'integer' ? Number.isInteger(value) : typeof value === type;
  if (types.length && !types.some(matches)) return [`${field}: ожидается ${types.join('|')}`];
  if (schema.enum && !schema.enum.includes(value)) problems.push(`${field}: недопустимое значение`);
  if (typeof value === 'number' && (typeof schema.minimum === 'number' && value < schema.minimum
    || typeof schema.maximum === 'number' && value > schema.maximum)) problems.push(`${field}: число вне диапазона`);
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required || []) if (!Object.hasOwn(value, key)) problems.push(`${field}.${key}: отсутствует`);
    for (const [key, item] of Object.entries(value)) {
      if (schema.properties?.[key]) problems.push(...schemaProblems(item, schema.properties[key], `${field}.${key}`));
      else if (schema.additionalProperties === false) problems.push(`${field}.${key}: неизвестное поле`);
    }
  }
  if (Array.isArray(value)) {
    if (Number.isInteger(schema.minItems) && value.length < schema.minItems || Number.isInteger(schema.maxItems) && value.length > schema.maxItems) problems.push(`${field}: недопустимое число элементов`);
    if (schema.items) value.forEach((item, index) => problems.push(...schemaProblems(item, schema.items, `${field}[${index}]`)));
  }
  return problems;
}

export async function callGemini(prompt, isJson = true, { request = fetch, sleep = pause, random = Math.random, now = Date.now, onRetry, responseSchema } = {}) {
  if (responseSchema && !isJson) throw new TypeError('responseSchema требует JSON-ответ');
  const key = geminiKey();
  if (!key) throw new AiProviderError('Gemini', null, 'GEMINI_API_KEY не настроен');
  const models = [...new Set([process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-3.5-flash-lite'].filter(Boolean))];
  const failures = [];
  const deadline = now() + REQUEST_BUDGET_MS;
  for (const model of models) {
    const quotaKey = `${key}:${model}`;
    if ((quotaCooldowns.get(quotaKey) || 0) > now()) {
      failures.push(new AiProviderError('Gemini', 429, `${model}: суточная квота исчерпана; ожидание восстановления квоты`));
      continue;
    }
    let lastError;
    for (let attempt = 0; attempt < MAX_ATTEMPTS && now() < deadline; attempt++) {
      let response;
      let data;
      try {
        response = await request(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST', signal: AbortSignal.timeout(Math.max(1, Math.min(20000, deadline - now()))),
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: {
            temperature: 0.1, maxOutputTokens: responseSchema ? 8192 : 4096,
            ...(isJson ? { responseMimeType: 'application/json' } : {}),
            ...(responseSchema ? { responseJsonSchema: responseSchema } : {})
          } })
        });
        data = await response.json().catch(error => {
          if (error.name === 'SyntaxError' && !response.ok) return {};
          throw error;
        }) || {};
        if (!response.ok) {
          const cooldown = response.status === 429 ? dailyQuotaDelay(data) : 0;
          if (cooldown) quotaCooldowns.set(quotaKey, now() + cooldown);
          throw new AiProviderError('Gemini', response.status, `${model}: ${data.error?.message || response.statusText || 'Ошибка API'}`);
        }
        const candidate = data.candidates?.[0];
        const finish = candidate?.finishReason;
        if (finish && !['STOP', 'FINISH_REASON_UNSPECIFIED'].includes(finish)) {
          throw new AiResponseError(`Ответ модели не завершён: finishReason=${finish}`, finish === 'MAX_TOKENS');
        }
        if (!candidate && data.promptFeedback?.blockReason) throw new AiResponseError(`Запрос заблокирован: ${data.promptFeedback.blockReason}`, false);
        const content = candidate?.content?.parts?.filter(part => part.text && !part.thought).map(part => part.text).join('');
        const result = parseContent(content, isJson);
        const problems = responseSchema ? schemaProblems(result, responseSchema) : [];
        if (problems.length) throw new AiResponseError(`Ответ не соответствует схеме: ${problems.slice(0, 8).join('; ')}`);
        return result;
      } catch (error) {
        // Invalid credentials and blocked regions are account issues, not model availability.
        if (error instanceof AiProviderError && [400, 401, 403].includes(error.status)) throw error;
        lastError = error instanceof AiProviderError ? error : new AiProviderError('Gemini', null, `${model}: ${error.message}`);
        if (!(error instanceof AiProviderError)) lastError.retryable = error instanceof AiResponseError ? error.retryable
          : ['TypeError', 'TimeoutError', 'AbortError', 'SyntaxError'].includes(error.name);
        if ((quotaCooldowns.get(quotaKey) || 0) > now()) break;
        if (!lastError.retryable || attempt === MAX_ATTEMPTS - 1) break;
        const delay = retryDelay(response, data, attempt, random, now);
        // Never retry before the server's requested delay, or wait past the total budget.
        if (delay >= deadline - now()) break;
        onRetry?.(`Gemini (${model}): ${error.name === 'SyntaxError' ? 'некорректный JSON' : error instanceof AiResponseError ? safeErrorMessage(error.message) : `временно недоступен${lastError.status ? `, HTTP ${lastError.status}` : ''}`}. Повтор ${attempt + 2}/${MAX_ATTEMPTS} через ${Math.ceil(delay / 1000)} с.`);
        await sleep(delay);
      }
    }
    if (lastError) failures.push(lastError);
    if (now() >= deadline) break;
  }
  const error = new AiProviderError('Gemini', failures.at(-1)?.status || null, failures.map(error => error.message).join('; ') || 'Истёк лимит времени запроса');
  error.retryable = failures.some(failure => failure.retryable);
  throw error;
}

export function applyAiSettings(settings = {}) {
  process.env.AI_PROVIDER = 'gemini';
  if (settings.gemini_api_key?.trim()) process.env.GEMINI_API_KEY = settings.gemini_api_key.trim();
}

export async function callLlm(prompt, isJson = true, options = {}) {
  try {
    return await callGemini(prompt, isJson, options);
  } catch (cause) {
    const error = new Error(`Квалификация заказов не выполнена. ${safeErrorMessage(cause.message)}`);
    error.code = 'AI_PROVIDER_ERROR';
    error.status = cause.status;
    error.retryable = cause.retryable;
    throw error;
  }
}

export async function checkLlm(options = {}) {
  const result = await callLlm('Return exactly this JSON: {"ok":true}', true, { ...options,
    responseSchema: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false } });
  if (result?.ok !== true) throw new AiProviderError('AI', null, 'Некорректный ответ проверки подключения');
  return { ok: true, provider: 'gemini', message: 'Квалификатор Gemini доступен' };
}
