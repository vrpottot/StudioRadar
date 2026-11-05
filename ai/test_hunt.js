/**
 * ai/test_hunt.js — Верификационный тест поиска прямых заказов
 * Проверяет работу huntOrders() и строгое отсутствие фриланс-бирж, Telegram и тендеров.
 */
import { huntOrders } from './index.js';
import { EXCLUDE_DOMAINS } from './sources.js';

async function runTest() {
  console.log('=== Запуск верификационного теста huntOrders() ===');
  
  const leads = await huntOrders({
    limit: 3,
    onProgress: (msg) => console.log(`[Progress] ${msg}`)
  });

  console.log(`\n=== Результат теста: найдено ${leads.length} лидов ===`);

  let violations = 0;
  for (const lead of leads) {
    console.log(`\nЛид: ${lead.company} (${lead.service})`);
    console.log(`URL: ${lead.url}`);
    console.log(`Источник: ${lead.source}`);
    console.log(`Контакты: ${lead.contact_name} (${lead.role || 'ЛПР'}) | ${lead.email || lead.phone || 'Сайт'}`);
    console.log(`Суть: ${lead.request_text?.slice(0, 150)}...`);

    // Проверка на запрещенные домены
    const leadUrl = (lead.url || '').toLowerCase();
    for (const badDomain of EXCLUDE_DOMAINS) {
      if (leadUrl.includes(badDomain)) {
        console.error(`[ОШИБКА]: Лид содержит запрещенный домен ${badDomain}!`);
        violations++;
      }
    }
  }

  if (violations === 0) {
    console.log('\n[УСПЕХ]: Все найденные лиды являются прямыми заказчиками! 0 фриланс-бирж, 0 Telegram, 0 тендеров.');
  } else {
    console.error(`\n[ПРОВАЛ]: Обнаружено ${violations} нарушений правил фильтрации!`);
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Ошибка выполнения теста:', err);
  process.exit(1);
});
