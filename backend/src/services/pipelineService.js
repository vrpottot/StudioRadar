import { db } from '../db/index.js';
import { broadcast } from '../ws/index.js';

export async function getAllPipelines() {
  await db.reload();
  return db.getAllPipelines();
}

export function getPipelineById(id) {
  return db.getPipelineById(id);
}

export async function createPipeline(data) {
  const created = await db.addPipeline(data);
  broadcast({ type: 'pipeline_created', pipeline: created });
  return created;
}

export async function updatePipeline(id, data) {
  const updated = await db.updatePipeline(id, data);
  if (updated) {
    broadcast({ type: 'pipeline_updated', pipeline: updated });
  }
  return updated;
}

export async function togglePipelineStatus(id) {
  const toggled = await db.togglePipelineStatus(id);
  if (toggled) {
    broadcast({ type: 'pipeline_updated', pipeline: toggled });
  }
  return toggled;
}

export async function deletePipeline(id) {
  const deleted = await db.deletePipeline(id);
  if (deleted) {
    broadcast({ type: 'pipeline_deleted', id });
  }
  return deleted;
}

export async function duplicatePipeline(id) {
  const copy = await db.duplicatePipeline(id);
  if (copy) {
    broadcast({ type: 'pipeline_created', pipeline: copy });
  }
  return copy;
}

export async function runPipeline(id) {
  const pipe = db.getPipelineById(id);
  if (!pipe) return null;

  broadcast({ type: 'ai_progress', message: `Запуск мониторинга по стратегии: «${pipe.name}»...` });
  const updated = await db.updatePipeline(id, { 
    lastRunAt: new Date().toISOString().replace('T', ' ').slice(0, 16) 
  });
  broadcast({ type: 'pipeline_updated', pipeline: updated });
  return updated;
}
