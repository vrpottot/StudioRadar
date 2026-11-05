import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    await db.reload();
    res.json(db.getSettings());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings
router.post('/', async (req, res) => {
  try {
    const updated = await db.updateSettings(req.body);
    if (req.body.gemini_api_key !== undefined) {
      process.env.GEMINI_API_KEY = req.body.gemini_api_key;
      process.env.Google_api = req.body.gemini_api_key;
    }
    if (req.body.openrouter_api_key !== undefined) {
      process.env.OPENROUTER_API_KEY = req.body.openrouter_api_key;
    }
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
