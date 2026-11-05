import { Router } from 'express';
import { SIGNALS_CATALOG } from '../db/signalsCatalog.js';

const router = Router();

// GET /api/signals
router.get('/', (req, res) => {
  res.json(SIGNALS_CATALOG);
});

export default router;
