/** Explicit opt-in live smoke test; normal `npm test` never uses paid providers. */
import assert from 'node:assert/strict';
import { huntOrders } from './index.js';
import { isBannedLead, sourcePlatform } from './policy.js';
if (process.env.RUN_LIVE_HUNT !== '1') {
  throw new Error('Для платного live-теста установите RUN_LIVE_HUNT=1');
}
const leads = await huntOrders({ limit: 3 });
for (const lead of leads) {
  assert.ok(sourcePlatform(lead.url));
  assert.equal(isBannedLead(lead), false);
  assert.ok(lead.request_evidence);
  console.log(lead.company, lead.source, lead.budget, lead.url);
}
console.log(`Найдено подходящих заказов: ${leads.length}. Ноль результатов не подтверждает полноту поиска.`);
