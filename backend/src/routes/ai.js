import { checkLlm, applyAiSettings, safeErrorMessage } from '../../../ai/llm.js';
import { db } from '../db/index.js';
import { Router } from 'express';
import { executeAiHunt } from '../services/hunterService.js';

const router = Router();

// Small real connectivity probe; no search-engine calls or lead writes.
router.post('/check', async (req, res) => {
  try {
    await db.reload();
    applyAiSettings(db.getSettings());
    res.json(await checkLlm());
  } catch (err) {
    res.status(503).json({ success: false, code: 'AI_PROVIDER_ERROR', error: safeErrorMessage(err.message) });
  }
});

// POST /api/ai/hunt
router.post('/hunt', async (req, res) => {
  try {
    const result = await executeAiHunt({
      query: req.body?.query,
      limit: req.body?.limit || 5
    });
    res.json(result);
  } catch (err) {
    res.status(err.code === 'AI_PROVIDER_ERROR' ? 503 : 500).json({ success: false, code: err.code || 'HUNT_FAILED', error: safeErrorMessage(err.message) });
  }
});

// POST /api/ai/scan (Сквозной сбор по всем каналам)
router.post('/scan', async (req, res) => {
  try {
    const result = await executeAiHunt({ limit: 5 });
    res.json(result);
  } catch (err) {
    res.status(err.code === 'AI_PROVIDER_ERROR' ? 503 : 500).json({ success: false, code: err.code || 'HUNT_FAILED', error: safeErrorMessage(err.message) });
  }
});

export default router;
