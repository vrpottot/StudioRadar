import { safeErrorMessage } from '../../../ai/llm.js';
import { Router } from 'express';
import leadsRouter from './leads.js';
import statsRouter from './stats.js';
import aiRouter from './ai.js';
import pipelinesRouter from './pipelines.js';
import signalsRouter from './signals.js';
import settingsRouter from './settings.js';
import { executeAiHunt } from '../services/hunterService.js';

const router = Router();

// Health check
router.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'StudioRadar Lead Engine (Modular Node.js API)',
    version: '2.5.0'
  });
});

// Mount modules
router.use('/api/leads', leadsRouter);
router.use('/api/stats', statsRouter);
router.use('/api/ai', aiRouter);
router.use('/api/pipelines', pipelinesRouter);
router.use('/api/signals', signalsRouter);
router.use('/api/settings', settingsRouter);

// Alias: POST /api/scan (Сквозной сбор по всем источникам)
router.post('/api/scan', async (req, res) => {
  try {
    const result = await executeAiHunt({ limit: 10 });
    res.json(result);
  } catch (err) {
    res.status(err.code === 'HUNT_RUNNING' ? 409 : err.code === 'AI_PROVIDER_ERROR' ? 503 : 500).json({ success: false, code: err.code || 'HUNT_FAILED', error: safeErrorMessage(err.message), retryable: Boolean(err.retryable), partial_result: err.partial_result });
  }
});

export default router;
