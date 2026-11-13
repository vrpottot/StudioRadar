import test from 'node:test';
import assert from 'node:assert/strict';
import { extractRubBudget, sourcePlatform, isExcludedUrl, isBannedLead, canonicalUrl } from './policy.js';
import { classifyLeadWithLlm, QUALIFICATION_RESPONSE_SCHEMA } from './classify.js';
import { huntOrders } from './index.js';
import { buildSearchJobs, TARGET_INDUSTRIES, TARGET_SERVICES, PLATFORM_REGISTRY } from './sources.js';

const now = new Date('2026-11-12T12:00:00Z');
const makeResult = (budget = 'Бюджет проекта: 900 000 ₽') => ({
  is_order: true, is_direct_client: true, is_project_contract: true, is_open: true,
  company: 'Компания Тест', industry: TARGET_INDUSTRIES[0], service: TARGET_SERVICES[0],
  industry_evidence: 'Компания Тест занимается продуктами питания и напитками.',
  country: 'Казахстан', country_evidence: 'Компания Тест, Казахстан, Алматы.',
  published_at: '2026-11-11', date_evidence: 'Дата публикации: 2026-11-11',
  request_evidence: 'Компания Тест ищет студию на производство CGI ролика.',
  budget_evidence: budget, score: 85
});
const page = (result, url = 'https://t.me/testorders/123') => ({
  title: 'Проект CGI', url,
  text: [result.country_evidence, result.industry_evidence, result.date_evidence, result.request_evidence, result.budget_evidence || ''].join('\n')
});
const qualify = (result, input = page(result)) => classifyLeadWithLlm(input, { now, llm: async () => result });

for (const [text, expected] of [
  ['Бюджет 900000 рублей', 900000], ['Бюджет: 900 000 ₽', 900000],
  ['бюджет от 900 тыс. руб.', 900000], ['бюджет 0,9 млн RUB', 900000],
  ['бюджет 900к ₽', 900000], ['бюджет 1–2 млн рублей', 1000000],
  ['бюджет 800–950 тыс рублей', 800000], ['budget 900000 RUB', 900000],
  ['бюджет до 1000000 рублей', null], ['бюджет 1000000 KZT', null],
  ['бюджет 1000000 USD', null], ['Зарплата 1000000 рублей', null],
  ['Бюджет 1000000 рублей в месяц', null], ['Бюджет обсуждается', null]
]) test(`budget: ${text}`, () => assert.equal(extractRubBudget(text)?.rubMin || null, expected));

test('HH/TG allowed; marketplaces excluded by actual hostname, not text mentions', () => {
  assert.equal(sourcePlatform('https://hh.kz/vacancy/123'), 'hh');
  assert.equal(sourcePlatform('https://t.me/s/orders/123'), 'telegram');
  assert.equal(sourcePlatform('https://t.me/orders'), null);
  assert.equal(sourcePlatform('https://linkedin.com/posts/test_activity-123'), 'linkedin');
  assert.equal(sourcePlatform('https://facebook.com/groups/test/posts/123'), 'facebook');
  assert.equal(sourcePlatform('https://hh.ru.evil.org/vacancy/1'), null);
  assert.equal(isExcludedUrl('https://kwork.ru/project/1'), true);
  assert.equal(isExcludedUrl('https://sub.workspace.ru/foo'), true);
  assert.equal(isBannedLead({url:'https://hh.ru/vacancy/1',request_text:'Связь через Telegram'}), false);
});
test('each run searches all industries on each requested platform', () => {
  const jobs = buildSearchJobs({query:'custom_query', now});
  assert.equal(jobs.length, TARGET_INDUSTRIES.length * 4);
  for (const platform of PLATFORM_REGISTRY) {
    assert.deepEqual(jobs.filter(j=>j.platform === platform.id).map(j=>j.industry), TARGET_INDUSTRIES);
  }
  assert.ok(jobs.every(j => j.query.includes('custom_query')));
  assert.ok(jobs.every(j => j.tavilyQuery.includes('custom_query')));
  assert.ok(jobs.every(j => j.query.includes('по всему миру')));
  assert.ok(jobs.every(j => j.query !== j.tavilyQuery));
  assert.ok(jobs.filter(j => j.platform === 'telegram').every(j => !j.query.includes('900000')));
  assert.ok(jobs.every(j => !j.tavilyQuery.includes(' CIS')));
  assert.ok(jobs.filter(j => j.platform === 'hh').every(j => !j.query.includes('проектная работа')));
});

test('search rounds change both service coverage and buyer phrases',()=>{
  const first=buildSearchJobs({now,round:0}),second=buildSearchJobs({now,round:1});
  assert.equal(first.length,second.length);
  assert.ok(first.every((job,index)=>job.query!==second[index].query));
  assert.ok(first.some((job,index)=>job.tavilyQuery!==second[index].tavilyQuery));
});

test('an open request from 60 days ago is eligible but one older than 90 days is not',async()=>{
  const recent={...makeResult(null),published_at:'2026-09-13',date_evidence:'Дата публикации: 2026-09-13'};
  const stale={...makeResult(null),published_at:'2026-08-01',date_evidence:'Дата публикации: 2026-08-01'};
  assert.equal((await qualify(recent,page(recent,'https://hh.ru/vacancy/123'))).isOrder,true);
  assert.equal((await qualify(stale,page(stale,'https://hh.ru/vacancy/123'))).isOrder,false);
});
test('Telegram at threshold accepted; budget enforced in storage too', async () => {
  const result = await qualify(makeResult());
  assert.equal(result.isOrder, true);
  assert.equal(result.lead.budget_rub_min, 900000);
  assert.equal(isBannedLead({...result.lead,url:'https://t.me/testorders/123'}), false);
});
for (const budget of [null, 'Бюджет: 899 999 ₽', 'Бюджет до 1 млн рублей', 'Бюджет 1000000 KZT', 'Бюджет 1000000 рублей в месяц']) {
  test(`Telegram rejects unsupported budget: ${budget}`, async () => assert.equal((await qualify(makeResult(budget))).isOrder, false));
}
test('model-invented budget quote cannot pass', async () => {
  const result = makeResult(); const input = page(result); input.text = input.text.replace('900 000', '100 000');
  assert.equal((await qualify(result, input)).isOrder, false);
});

test('Telegram without the minimum budget consumes no Gemini requests',async()=>{
  const result=await classifyLeadWithLlm(page(makeResult(null)),{now,llm:async()=>assert.fail('ineligible budget must not consume AI quota')});
  assert.equal(result.isOrder,false);assert.match(result.reason,/900 000/);
});

test('industry needs an exact company quote and rejected reviews stay out of the table',async()=>{
  const result=makeResult(null),input=page(result,'https://linkedin.com/posts/customer_activity-123');
  assert.equal((await qualify({...result,industry_evidence:'Invented business activity'},input)).isOrder,false);
  assert.equal(isBannedLead({url:input.url,qualification_status:'rejected'}),true);
});

test('a personal author name cannot substitute for an unknown company',async()=>{
  const result=makeResult(null),input=page(result,'https://linkedin.com/posts/customer_activity-123');
  input.author={name:result.company,url:'https://linkedin.com/in/customer',type:'Person'};
  assert.equal((await qualify(result,input)).isOrder,false);
  input.author.name='Компания-Тест';
  assert.equal((await qualify(result,input)).isOrder,false);
  input.author={name:result.company,url:'https://linkedin.com/company/customer',type:'Organization'};
  assert.equal((await qualify(result,input)).isOrder,true);
});

test('qualification requests a nullable fact schema instead of forcing invented company data',async()=>{
  const result=makeResult(null);
  await classifyLeadWithLlm(page(result,'https://linkedin.com/posts/customer_activity-123'),{now,llm:async(prompt,isJson,options)=>{
    assert.equal(isJson,true);assert.equal(options.responseSchema,QUALIFICATION_RESPONSE_SCHEMA);
    assert.ok(options.responseSchema.properties.company.type.includes('null'));
    assert.ok(options.responseSchema.properties.industry.enum.includes(null));
    assert.ok(options.responseSchema.required.includes('industry_evidence'));
    assert.match(prompt,/IT\/SaaS\/BPO/);return result;
  }});
});

test('missing AI flags and exact missing evidence are visible in diagnostics',async()=>{
  const result=makeResult(null),input=page(result,'https://linkedin.com/posts/customer_activity-123');
  const missing=await qualify({...result,is_open:undefined,is_direct_client:'true'},input);
  assert.deepEqual(missing.invalid_fields,['is_direct_client','is_open']);
  assert.match(missing.reason,/is_direct_client, is_open/);
  const evidence=await qualify({...result,country_evidence:null,request_evidence:null},input);
  assert.deepEqual(evidence.missing_evidence,['request_evidence','country_evidence']);
  const closed=await qualify({...result,is_open:false},input);
  assert.deepEqual(closed.unconfirmed_fields,['is_open']);assert.match(closed.reason,/открытый заказ/);
});

test('foreign or unreported budgets remain eligible outside Telegram with all other evidence',async()=>{
  for(const url of ['https://linkedin.com/posts/customer_activity-123','https://facebook.com/customer/posts/123','https://hh.ru/vacancy/123']) {
    const result=makeResult('Project budget: 500 USD');
    assert.equal((await qualify(result,page(result,url))).isOrder,true);
  }
});

test('author context cannot replace the actual publication request or date',async()=>{
  const result=makeResult(null);
  const input=page(result,'https://linkedin.com/posts/author_activity-123');
  input.requestText='The actual publication contains no project request or date.';
  assert.equal((await qualify(result,input)).isOrder,false);
});
test('HH project without budget accepted; staff vacancy rejected', async () => {
  const result = makeResult(null); const input = page(result,'https://hh.ru/vacancy/123');
  assert.equal((await qualify(result,input)).isOrder,true);
  assert.equal((await qualify({...result,is_project_contract:false},input)).isOrder,false);
});
test('non-target industry/country, closed orders, past campaigns and stale posts rejected', async () => {
  for (const changes of [{industry:'Рестораны'}, {country:''}, {is_open:false}, {is_order:false}, {published_at:'2025-01-01'}, {is_order:'true'}]) {
    const result = {...makeResult(),...changes};
    assert.equal((await qualify(result)).isOrder,false);
  }
});

test('foreign customers are eligible with country evidence and the same industry and project rules',async()=>{
  const result={...makeResult(null),country:'Индия',country_evidence:'Компания Тест, Mumbai, India.'};
  const input=page(result,'https://linkedin.com/posts/customer_activity-123');
  assert.equal((await qualify(result,input)).isOrder,true);
  assert.equal((await qualify({...result,country_evidence:'Unverified country evidence'},input)).isOrder,false);
});
test('tender and marketplace cannot bypass LLM filter', async () => {
  const result = makeResult();
  assert.equal((await qualify(result,{...page(result),text:page(result).text+' Тендер на CGI'})).isOrder,false);
  assert.equal((await qualify(result,page(result,'https://fl.ru/projects/123'))).isOrder,false);
});
test('missing evidence rejects, provider failure surfaces', async () => {
  assert.equal((await qualify(makeResult(),{...page(makeResult()),text:'Нет доказательств'})).isOrder,false);
  await assert.rejects(classifyLeadWithLlm(page(makeResult()),{now,llm:async()=>{throw new Error('quota');}}),/quota/);
});
test('orchestrator covers channels, deduplicates and never fabricates fallback leads', async () => {
  const jobs=[]; let classified=0;
  const dependencies={now, search:async (query,n,objective,options)=>{
    jobs.push(options.includeDomains);
    return [{url:'https://t.me/testorders/123',title:'Заказ',snippet:page(makeResult()).text,source:'fixture'}];
  }, fetchPage:async()=>null, classify:async data=>{classified++;return qualify(makeResult(),data);} };
  const leads=await huntOrders({limit:5},dependencies);
  assert.equal(jobs.length,36); assert.equal(classified,1); assert.equal(leads.length,1);
  const repeated=await huntOrders({excludeUrls:[leads[0].url]},dependencies);
  assert.equal(repeated.length,0);
  assert.equal((await huntOrders({}, {...dependencies,search:async()=>[]})).length,0);
  await assert.rejects(huntOrders({}, {...dependencies,search:async()=>{throw new Error('offline');}}),/Поиск не выполнен/);
});
test('canonical URL ignores tracking parameters',()=>assert.equal(canonicalUrl('https://hh.ru/vacancy/123?utm_source=google#x'),'https://hh.ru/vacancy/123'));

test('orders are delivered before a later provider failure and diagnostics retain the count',async()=>{
  const saved=[],checked=[];let diagnostics,calls=0;
  await assert.rejects(huntOrders({onLead:async lead=>saved.push(lead),onCandidate:async candidate=>checked.push(candidate),onDiagnostics:value=>{diagnostics=value;}},{
    now,search:async()=>[123,124].map(id=>({url:`https://t.me/testorders/${id}`,title:'CGI',snippet:page(makeResult()).text})),
    fetchPage:async()=>null,
    classify:async(data,options)=>{
      assert.equal(typeof options.onRetry,'function');
      if(++calls===2)throw new Error('Gemini HTTP 503');
      return qualify(makeResult(),data);
    }
  }),/Gemini HTTP 503/);
  assert.equal(saved.length,1);assert.equal(diagnostics.accepted,1);assert.equal(diagnostics.checked,2);
  assert.equal(checked[0].accepted,true);assert.equal(checked[1].accepted,false);
});

test('search evidence survives a login wall and records actual rejection reasons', async () => {
  const result = makeResult(); let diagnostics;
  const dependencies = {
    now,
    search: async () => [{url:'https://t.me/testorders/123',title:'CGI',snippet:page(result).text}],
    fetchPage: async () => ({url:'https://t.me/testorders/123?embed=1&mode=tme',text:'Log in to continue'}),
    classify: async data => qualify(result, data)
  };
  const leads = await huntOrders({onDiagnostics: value => {diagnostics=value;}}, dependencies);
  assert.equal(leads.length,1);
  assert.equal(diagnostics.checked,1);
  assert.equal(diagnostics.accepted,1);
  await huntOrders({onDiagnostics: value => {diagnostics=value;}}, {...dependencies,classify:async()=>({isOrder:false,reason:'Нет подтверждающих цитат'})});
  assert.equal(diagnostics.rejected['Нет подтверждающих цитат'],1);
});

test('redirect to another post cannot supply evidence for the original URL', async () => {
  let checkedText;
  await huntOrders({}, {now, search:async()=>[{url:'https://linkedin.com/posts/buyer_activity-123',snippet:'Original post'}],
    fetchPage:async()=>({url:'https://linkedin.com/posts/other_activity-456',text:'Different company and budget'}),
    classify:async data=>{checkedText=data.text;return {isOrder:false,reason:'fixture'};}});
  assert.equal(checkedText,'Original post');
});

test('cannot cherry-pick budget quote from a monthly salary', async () => {
  const result=makeResult('Бюджет 1000000 рублей');
  const input=page(result); input.text += ' в месяц';
  assert.equal((await qualify(result,input)).isOrder,false);
});
test('model cannot relabel an old date or invent company', async () => {
  const result=makeResult();
  assert.equal((await qualify({...result,published_at:'2026-11-10'})).isOrder,false);
  assert.equal((await qualify({...result,company:'Вымышленная Компания'},page(result))).isOrder,false);
});
test('both engines contribute, deduplicate and tolerate one provider outage', async () => {
  const {searchWeb}=await import('./search.js');
  const oldExa=process.env.EXA_API_KEY, oldTavily=process.env.TAVILY_API_KEY;
  process.env.EXA_API_KEY='test-placeholder'; process.env.TAVILY_API_KEY='test-placeholder';
  try {
    const providers={
      exa:async(q,n,o,opts)=>{ assert.deepEqual(opts.includeDomains,['hh.ru']); return [{url:'https://hh.ru/vacancy/1',snippet:'short'}]; },
      tavily:async()=>[{url:'https://hh.ru/vacancy/1?utm_source=test',snippet:'longer text'}, {url:'https://hh.ru/vacancy/2',snippet:'other'}]
    };
    const results=await searchWeb('query',3,null,{includeDomains:['hh.ru']},providers);
    assert.equal(results.length,2); assert.equal(results[0].snippet,'longer text');
    assert.equal((await searchWeb('query',3,null,{}, {...providers,exa:async()=>{throw new Error('offline');}})).length,2);
    await assert.rejects(searchWeb('query',3,null,{}, {exa:async()=>{throw new Error('offline');},tavily:async()=>{throw new Error('offline');}}),/недоступны/);
  } finally {
    if(oldExa===undefined) delete process.env.EXA_API_KEY; else process.env.EXA_API_KEY=oldExa;
    if(oldTavily===undefined) delete process.env.TAVILY_API_KEY; else process.env.TAVILY_API_KEY=oldTavily;
  }
});
test('database allows qualifying TG and HH and deduplicates URLs', async () => {
  const {Database,isBannedLead:dbPolicy}=await import('../backend/src/db/index.js');
  let inserted = false;
  const db = new Database({query:async(sql,values)=>{
    assert.match(sql,/on conflict do nothing/);
    assert.equal(values[1],'https://t.me/testorders/123');
    if(inserted)return {rows:[]};
    inserted=true;return {rows:[{data:JSON.parse(values[2])}]};
  }});
  const lead={...makeResult(),url:'https://t.me/testorders/123',request_text:'CGI проект'};
  assert.equal(dbPolicy(lead),false);
  assert.ok(await db.addLead({...lead,id:'one'}));
  assert.equal(await db.addLead({...lead,id:'two'}),null);
  assert.equal(dbPolicy({...lead,budget_evidence:null}),true);
});
