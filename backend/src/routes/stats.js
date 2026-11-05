import { Router } from 'express';
import { getStats } from '../services/leadService.js';

const router = Router();

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
