import { Router } from 'express';
import { 
  getAllPipelines, 
  getPipelineById, 
  createPipeline, 
  updatePipeline, 
  togglePipelineStatus, 
  deletePipeline, 
  duplicatePipeline, 
  runPipeline 
} from '../services/pipelineService.js';

const router = Router();

// GET /api/pipelines
router.get('/', async (req, res) => {
  try {
    const pipelines = await getAllPipelines();
    res.json(pipelines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pipelines/:id
router.get('/:id', async (req, res) => {
  try {
    const pipe = await getPipelineById(req.params.id);
    if (!pipe) return res.status(404).json({ error: 'Пайплайн не найден' });
    res.json(pipe);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/pipelines
router.post('/', async (req, res) => {
  try {
    const created = await createPipeline(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/pipelines/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await updatePipeline(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Пайплайн не найден' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/pipelines/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const toggled = await togglePipelineStatus(req.params.id);
    if (!toggled) return res.status(404).json({ error: 'Пайплайн не найден' });
    res.json(toggled);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pipelines/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deletePipeline(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Пайплайн не найден' });
    res.json({ success: true, message: 'Пайплайн удален' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pipelines/:id/duplicate
router.post('/:id/duplicate', async (req, res) => {
  try {
    const copy = await duplicatePipeline(req.params.id);
    if (!copy) return res.status(404).json({ error: 'Пайплайн не найден' });
    res.json(copy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pipelines/:id/run
router.post('/:id/run', async (req, res) => {
  try {
    const updated = await runPipeline(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Пайплайн не найден' });
    res.json({ success: true, message: `Пайплайн «${updated.name}» запущен в работу` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
