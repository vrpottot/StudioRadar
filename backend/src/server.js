import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { PORT, CORS_ORIGINS, DEFAULT_MONITORED_CHANNELS } from './config.js';
import { db } from './db.js';
import { scrapePublicTelegramChannel } from './telegramWebScraper.js';
import { gramjsService } from './gramjsService.js';
import { scrapeAllHhLeads } from './hhScraper.js';
import { runAutonomousAiLeadHunt } from './aiLeadHunter.js';
import { analyzeLeadWithAi } from './geminiService.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors({ origin: '*' }));
app.use(express.json());

// WebSocket broadcast
const broadcast = (data) => {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', message: 'StudioRadar WebSocket Active' }));
});

// REST Endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'StudioRadar Lead Engine (Node.js)',
    version: '2.0.0'
  });
});

// 1. Получение лидов с фильтрацией
app.get('/api/leads', async (req, res) => {
  await db.reload();
  const { industry, service, status, only_with_phone, query } = req.query;
  let leads = db.getAllLeads();

  if (industry && industry !== 'Все 7 сфер' && industry !== 'Все сферы') {
    leads = leads.filter(l => l.industry === industry);
  }

  if (service && service !== 'Все услуги') {
    leads = leads.filter(l => l.service === service);
  }

  if (status && status !== 'all') {
    if (status === 'in_progress') {
      leads = leads.filter(l => ['in_progress', 'called', 'negotiation'].includes(l.status));
    } else if (status === 'closed') {
      leads = leads.filter(l => l.status === 'closed');
    } else {
      leads = leads.filter(l => l.status === status);
    }
  }

  if (only_with_phone === 'true') {
    leads = leads.filter(l => Boolean(l.phone));
  }

  if (query) {
    const q = query.toLowerCase();
    leads = leads.filter(l => 
      l.company.toLowerCase().includes(q) ||
      l.contact_name.toLowerCase().includes(q) ||
      l.request_text.toLowerCase().includes(q) ||
      (l.phone && l.phone.includes(q))
    );
  }

  res.json(leads);
});

// 2. Получение лида по ID
app.get('/api/leads/:id', (req, res) => {
  const lead = db.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Лид не найден' });
  res.json(lead);
});

// 3. Обновление статуса лида
app.patch('/api/leads/:id/status', async (req, res) => {
  const { status } = req.body;
  const updated = await db.updateLeadStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Лид не найден' });

  broadcast({ type: 'lead_status_updated', lead_id: req.params.id, status });
  res.json(updated);
});

// 4. Обновление заметок
app.patch('/api/leads/:id/notes', async (req, res) => {
  const { notes } = req.body;
  const updated = await db.updateLeadNotes(req.params.id, notes);
  if (!updated) return res.status(404).json({ error: 'Лид не найден' });
  res.json(updated);
});

// 5. Статистика дашборда
app.get('/api/stats', async (req, res) => {
  await db.reload();
  res.json(db.getStats());
});

// 6. Статус Telegram
app.get('/api/telegram/status', async (req, res) => {
  const isConfigured = gramjsService.isConfigured();
  const isAuth = isConfigured ? await gramjsService.isAuthorized() : false;

  res.json({
    mtproto_configured: isConfigured,
    mtproto_authorized: isAuth,
    web_scraper_active: true,
    monitored_channels: DEFAULT_MONITORED_CHANNELS,
    instruction: !isAuth ? 'Для подключения GramJS (MTProto) запустите: npm run auth:tg' : 'Слушатель активен'
  });
});

// 7. Сканирование HeadHunter
app.post('/api/scan/hh', async (req, res) => {
  try {
    const hhLeads = await scrapeAllHhLeads(10);
    let addedCount = 0;
    let lastAdded = null;

    for (const lead of hhLeads) {
      const added = await db.addLead(lead);
      if (added) {
        addedCount++;
        lastAdded = added;
        broadcast({
          type: 'new_lead_detected',
          lead: {
            id: added.id,
            company: added.company,
            industry: added.industry,
            phone: added.phone,
            service: added.service,
            source: added.source
          }
        });
      }
    }

    res.json({
      success: true,
      new_leads_found: addedCount,
      message: addedCount > 0 
        ? `Найдено ${addedCount} новых проектных заказов на hh.ru!` 
        : 'Все актуальные заказы с hh.ru уже в базе'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Автономный поиск заказов через ИИ-Агента (Gemini + Web)
app.post('/api/ai/hunt', async (req, res) => {
  try {
    const onProgress = (msg) => {
      broadcast({ type: 'ai_progress', message: msg });
    };

    const leads = await runAutonomousAiLeadHunt(onProgress);
    leads.forEach(lead => {
      broadcast({
        type: 'new_lead_detected',
        lead: {
          id: lead.id,
          company: lead.company,
          industry: lead.industry,
          phone: lead.phone,
          service: lead.service,
          source: lead.source
        }
      });
    });

    res.json({
      success: true,
      found_count: leads.length,
      leads: leads,
      message: leads.length > 0 
        ? `ИИ-ассистент нашел ${leads.length} новых прямых B2B-заказчиков!`
        : 'ИИ завершил поиск. Все уникальные заказы сохранены.'
    });
  } catch (err) {
    console.error('[AI Hunt Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 9. Общее сканирование всех площадок (HeadHunter + Telegram)
app.post('/api/scan', async (req, res) => {
  let totalAdded = 0;

  // 1. Сначала сканируем HeadHunter
  try {
    const hhLeads = await scrapeAllHhLeads(10);
    for (const lead of hhLeads) {
      const added = await db.addLead(lead);
      if (added) {
        totalAdded++;
        broadcast({
          type: 'new_lead_detected',
          lead: {
            id: added.id,
            company: added.company,
            industry: added.industry,
            phone: added.phone,
            service: added.service,
            source: added.source
          }
        });
      }
    }
  } catch (e) {
    console.warn('[Scan] Ошибка сканирования hh:', e.message);
  }

  // 2. Сканируем Telegram каналы
  for (const channel of DEFAULT_MONITORED_CHANNELS) {
    try {
      const leads = await scrapePublicTelegramChannel(channel, 20);
      for (const lead of leads) {
        const added = await db.addLead(lead);
        if (added) {
          totalAdded++;
          broadcast({
            type: 'new_lead_detected',
            lead: {
              id: added.id,
              company: added.company,
              industry: added.industry,
              phone: added.phone,
              service: added.service,
              source: added.source
            }
          });
        }
      }
    } catch (e) {
      // игнорируем ошибку канала
    }
  }

  res.json({
    success: true,
    new_leads_found: totalAdded,
    message: totalAdded > 0 
      ? `Успешно найдено и добавлено ${totalAdded} новых B2B-заказов!` 
      : 'Все актуальные реальные заказы с площадок уже в базе'
  });
});

// Инициализация базы данных и запуск сервера
async function start() {
  await db.init();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[StudioRadar] Backend запущен на http://localhost:${PORT}`);
    console.log(`[StudioRadar] WebSocket доступен на ws://localhost:${PORT}`);
  });
}

start().catch(console.error);
