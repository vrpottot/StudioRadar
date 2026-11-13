import { Router } from 'express';
import { getLeads, getLeadById, updateLeadStatus, updateLeadNotes } from '../services/leadService.js';

const router = Router();

// GET /api/leads
router.get('/', async (req, res) => {
  try {
    const leads = await getLeads(req.query);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads/:id
router.get('/:id', async (req, res) => {
  try {
    const lead = await getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Лид не найден' });
    res.json(lead);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/leads/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await updateLeadStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Лид не найден' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/leads/:id/notes
router.patch('/:id/notes', async (req, res) => {
  try {
    const { notes } = req.body;
    const updated = await updateLeadNotes(req.params.id, notes);
    if (!updated) return res.status(404).json({ error: 'Лид не найден' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
