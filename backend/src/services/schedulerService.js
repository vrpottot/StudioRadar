import { db } from '../db/index.js';
import { executeAiHunt } from './hunterService.js';
import { broadcast } from '../ws/index.js';

let schedulerInterval = null;

/**
 * Инициализация планировщика периодического мониторинга
 * Запускается каждые 60 минут (или по настроенному интервалу) для активных пайплайнов
 */
export function startScheduler(intervalMs = 60 * 60 * 1000) {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  schedulerInterval = setInterval(async () => {
    try {
      const pipelines = await db.getAllPipelines();
      const activePipelines = pipelines.filter(p => p.status === 'active');

      if (activePipelines.length > 0) {
        broadcast({ 
          type: 'ai_progress', 
          message: `Плановый автозапуск мониторинга для ${activePipelines.length} активных пайплайнов...` 
        });

        // Запуск поиска заказов в фоне
        await executeAiHunt({ limit: 3, maxRounds: 1 });

        // Обновление даты последнего запуска пайплайнов
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
        for (const pipe of activePipelines) {
          await db.updatePipeline(pipe.id, { lastRunAt: now });
        }
      }
    } catch (e) {
      console.warn('[Scheduler Error]', e.message);
    }
  }, intervalMs);

  console.log(`[Scheduler] Планировщик фонового поиска активен (интервал: ${Math.round(intervalMs / 60000)} мин)`);
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}
