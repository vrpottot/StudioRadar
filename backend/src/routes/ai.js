import { Router } from 'express';
import { executeAiHunt } from '../services/hunterService.js';

const router = Router();

// POST /api/ai/hunt
router.post('/hunt', async (req, res) => {
  try {
    const result = await executeAiHunt({
      query: req.body?.query,
      limit: req.body?.limit || 5
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/scan (Сквозной сбор по всем каналам)
router.post('/scan', async (req, res) => {
  try {
    const result = await executeAiHunt({ limit: 5 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
