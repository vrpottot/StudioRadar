import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { NewMessage } from 'telegram/events/index.js';
import { TELEGRAM_API_ID, TELEGRAM_API_HASH, DEFAULT_MONITORED_CHANNELS } from './config.js';
import { checkSpamFilters, classifyIndustry, classifyService, generateSuggestedSolution } from './classifier.js';
import { extractPhoneFromText } from './phoneExtractor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_FILE = path.join(__dirname, '..', 'telegram.session');

class GramjsService {
  constructor() {
    this.apiId = TELEGRAM_API_ID;
    this.apiHash = TELEGRAM_API_HASH;
    this.client = null;
    this.sessionString = '';
    this.isRunning = false;
  }

  isConfigured() {
    return Boolean(this.apiId && this.apiHash);
  }

  async loadSession() {
    try {
      this.sessionString = (await fs.readFile(SESSION_FILE, 'utf-8')).trim();
    } catch (e) {
      this.sessionString = '';
    }
  }

  async saveSession() {
    if (this.client && this.client.session) {
      const saved = this.client.session.save();
      await fs.writeFile(SESSION_FILE, saved, 'utf-8');
    }
  }

  async getClient() {
    if (!this.isConfigured()) return null;

    if (!this.client) {
      await this.loadSession();
      const stringSession = new StringSession(this.sessionString);
      this.client = new TelegramClient(stringSession, this.apiId, this.apiHash, {
        connectionRetries: 5,
      });
    }
    return this.client;
  }

  async isAuthorized() {
    const client = await this.getClient();
    if (!client) return false;
    try {
      if (!client.connected) {
        await client.connect();
      }
      return await client.isUserAuthorized();
    } catch (e) {
      return false;
    }
  }

  async startListening(channels, onNewLead) {
    const client = await this.getClient();
    if (!client) return;

    const isAuth = await this.isAuthorized();
    if (!isAuth) {
      console.log('[GramJS] Сессия не авторизована. Запустите: npm run auth:tg');
      return;
    }

    this.isRunning = true;
    console.log(`[GramJS] Слушатель активен на каналах:`, channels);

    client.addEventHandler(async (event) => {
      const message = event.message;
      if (!message || !message.message) return;

      const text = message.message;
      const [isSpam] = checkSpamFilters(text);
      if (isSpam) return;

      const phone = extractPhoneFromText(text);
      const industry = classifyIndustry(text);
      const service = classifyService(text);
      const solution = generateSuggestedSolution(industry, service);

      const lead = {
        id: `tg-live-${Date.now()}`,
        company: `Заказчик (${text.split('\n')[0].slice(0, 30)})`,
        industry,
        service,
        contact_name: "Менеджер / ЛПР",
        role: "Маркетолог / Бренд-директор",
        phone,
        telegram: null,
        source: "Telegram (Live MTProto)",
        source_type: "telegram",
        budget: "от 450 000 ₽",
        score: phone ? 98 : 92,
        verified_direct: true,
        request_text: text.slice(0, 600),
        suggested_solution: solution,
        status: "new",
        created_at: new Date().toISOString()
      };

      if (onNewLead) {
        await onNewLead(lead);
      }
    }, new NewMessage({ chats: channels }));
  }
}

export const gramjsService = new GramjsService();
