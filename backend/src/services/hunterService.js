import { applyAiSettings, checkLlm } from '../../../ai/llm.js';
import { huntOrders } from '../../../ai/index.js';
import { db } from '../db/index.js';
import { broadcast } from '../ws/index.js';

/**
 * Запуск поиска заказов через внешний ИИ-модуль
 * Бэкенд делегирует поиск модулю ai/ и сохраняет подтвержденные заказы в БД
 * @param {object} options
 * @param {string} [options.query] - Поисковый запрос
 * @param {number} [options.limit] - Максимальное количество лидов
 */
export async function executeAiHunt({ query = null, limit = 5 } = {}) {
  const onProgress = (msg) => {
    broadcast({ type: 'ai_progress', message: msg });
  };

  try {
    await db.reload();
    applyAiSettings(db.getSettings());
    onProgress('Проверка подключения к AI-квалификатору…');
    await checkLlm();
    const foundLeads = await huntOrders({ onProgress, query, limit, excludeUrls: db.getAllLeads().map(lead => lead.url) });
    const addedLeads = [];

    for (const leadData of foundLeads) {
      const added = await db.addLead(leadData);
      if (added) {
        addedLeads.push(added);
        broadcast({
          type: 'new_lead_detected',
          lead: {
            id: added.id,
            company: added.company,
            industry: added.industry,
            phone: added.phone,
            service: added.service,
            source: added.source
          }
        });
      }
    }

    const finalMessage = addedLeads.length > 0
      ? `ИИ нашел и добавил ${addedLeads.length} новых прямых B2B-заказчиков!`
      : foundLeads.length ? 'Найденные заказы уже сохранены в базе.' : 'Подходящих прямых заказов по заданным условиям не найдено.';

    broadcast({ type: 'ai_progress', message: finalMessage });
    setTimeout(() => broadcast({ type: 'ai_progress', message: '' }), 7000);

    return {
      success: true,
      found_count: foundLeads.length,
      new_leads_found: addedLeads.length,
      leads: addedLeads,
      message: finalMessage
    };
  } catch (err) {
    console.error('[HunterService Error]', err);
    broadcast({ type: 'ai_progress', message: `Ошибка ИИ-поиска: ${err.message}` });
    throw err;
  }
}
