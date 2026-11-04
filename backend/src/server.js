import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { PORT, CORS_ORIGINS } from './config.js';
import { db } from './db.js';
import { runAutonomousAiLeadHunt } from './aiLeadHunter.js';
import { analyzeLeadWithAi } from './geminiService.js';
import { SIGNALS_CATALOG } from './signalsCatalog.js';

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

// 6. Автономный поиск заказов через ИИ-Агента (Gemini / DeepSeek + Web)
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

// 7. Сквозной ИИ-поиск коммерческих тендеров и заявок в открытом вебе (Web Search + LLM)
app.post('/api/scan', async (req, res) => {
  let totalAdded = 0;

  try {
    broadcast({ type: 'ai_progress', message: 'Автономный поиск прямых коммерческих тендеров и заявок в открытом вебе...' });
    try {
      const aiLeads = await runAutonomousAiLeadHunt((msg) => {
        broadcast({ type: 'ai_progress', message: msg });
      });
      for (const lead of aiLeads) {
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
      console.warn('[Scan] Ошибка ИИ-хантинга:', e.message);
    }

    const finalMsg = totalAdded > 0
      ? `ИИ-поиск завершен! Найдено и добавлено ${totalAdded} новых B2B-заказчиков.`
      : 'ИИ-поиск завершен. Все найденные заказы уже сохранены в базе.';

    broadcast({ type: 'ai_progress', message: finalMsg });
    setTimeout(() => broadcast({ type: 'ai_progress', message: '' }), 7000);

    res.json({
      success: true,
      new_leads_found: totalAdded,
      message: finalMsg
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 8. ПАЙПЛАЙНЫ (Раздел 3 и 13.4 ТЗ) ---
app.get('/api/pipelines', async (req, res) => {
  await db.reload();
  res.json(db.getAllPipelines());
});

app.get('/api/pipelines/:id', (req, res) => {
  const pipe = db.getPipelineById(req.params.id);
  if (!pipe) return res.status(404).json({ error: 'Пайплайн не найден' });
  res.json(pipe);
});

app.post('/api/pipelines', async (req, res) => {
  try {
    const created = await db.addPipeline(req.body);
    broadcast({ type: 'pipeline_created', pipeline: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/pipelines/:id', async (req, res) => {
  const updated = await db.updatePipeline(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Пайплайн не найден' });
  broadcast({ type: 'pipeline_updated', pipeline: updated });
  res.json(updated);
});

app.patch('/api/pipelines/:id/status', async (req, res) => {
  const toggled = await db.togglePipelineStatus(req.params.id);
  if (!toggled) return res.status(404).json({ error: 'Пайплайн не найден' });
  broadcast({ type: 'pipeline_updated', pipeline: toggled });
  res.json(toggled);
});

app.delete('/api/pipelines/:id', async (req, res) => {
  const deleted = await db.deletePipeline(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Пайплайн не найден' });
  broadcast({ type: 'pipeline_deleted', id: req.params.id });
  res.json({ success: true, message: 'Пайплайн удален' });
});

app.post('/api/pipelines/:id/duplicate', async (req, res) => {
  const copy = await db.duplicatePipeline(req.params.id);
  if (!copy) return res.status(404).json({ error: 'Пайплайн не найден' });
  broadcast({ type: 'pipeline_created', pipeline: copy });
  res.json(copy);
});

app.post('/api/pipelines/:id/run', async (req, res) => {
  const pipe = db.getPipelineById(req.params.id);
  if (!pipe) return res.status(404).json({ error: 'Пайплайн не найден' });

  broadcast({ type: 'ai_progress', message: `Запуск мониторинга по стратегии: «${pipe.name}»...` });
  const updated = await db.updatePipeline(req.params.id, { 
    lastRunAt: new Date().toISOString().replace('T', ' ').slice(0, 16) 
  });
  broadcast({ type: 'pipeline_updated', pipeline: updated });

  res.json({ success: true, message: `Пайплайн «${pipe.name}» запущен в работу` });
});

// --- 9. КАТАЛОГ СИГНАЛОВ (Раздел 4 и 13.6 ТЗ) ---
app.get('/api/signals', (req, res) => {
  res.json(SIGNALS_CATALOG);
});

// --- 10. НАСТРОЙКИ (Раздел 11 и 16 ТЗ) ---
app.get('/api/settings', async (req, res) => {
  await db.reload();
  res.json(db.getSettings());
});

app.post('/api/settings', async (req, res) => {
  const updated = await db.updateSettings(req.body);
  if (req.body.gemini_api_key !== undefined) {
    process.env.GEMINI_API_KEY = req.body.gemini_api_key;
    process.env.Google_api = req.body.gemini_api_key;
  }
  if (req.body.openrouter_api_key !== undefined) {
    process.env.OPENROUTER_API_KEY = req.body.openrouter_api_key;
  }
  res.json({ success: true, settings: updated });
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
