import test from 'node:test';
import assert from 'node:assert/strict';
import { telegramFeedUrl, prioritizeCandidates, samePublication, sameLinkedInProfile, buyerIntentScore } from './candidates.js';
import { extractTelegramPosts, extractLinkedInPost } from './fetchPage.js';
import { huntOrders } from './index.js';

test('only public Telegram channel pages can be used for post discovery', () => {
  assert.equal(telegramFeedUrl('https://t.me/orders'), 'https://t.me/s/orders');
  assert.equal(telegramFeedUrl('https://t.me/s/orders'), 'https://t.me/s/orders');
  for (const url of ['https://t.me/orders/123', 'https://t.me/+invite', 'https://t.me/share', 'https://t.me.evil.org/orders']) assert.equal(telegramFeedUrl(url), null);
});

test('Telegram feed extraction keeps message text and dates separate', () => {
  const posts = extractTelegramPosts(`<div>Channel boilerplate</div>
    <div class="tgme_widget_message" data-post="orders/123"><div class="tgme_widget_message_text">First company request</div><time datetime="2026-11-11T12:00:00Z"></time></div>
    <div class="tgme_widget_message" data-post="orders/124"><div class="tgme_widget_message_text">Second company request</div><time datetime="2026-11-12T12:00:00Z"></time></div>`);
  assert.equal(posts.length, 2);
  assert.equal(posts[0].url, 'https://t.me/orders/123');
  assert.ok(posts[0].snippet.includes('First company request'));
  assert.ok(!posts[0].snippet.includes('Second company request'));
  assert.ok(!posts[0].snippet.includes('Channel boilerplate'));
  assert.equal(posts[1].publishedDate, '2026-11-12T12:00:00Z');
});

test('LinkedIn post extraction never uses commenters countries or dates', () => {
  const json = { '@type':'SocialMediaPosting', articleBody:'We need a CGI production studio', datePublished:'2026-11-11',
    author:{name:'Buyer',url:'https://uz.linkedin.com/in/buyer'},
    comment:[{'@type':'Comment',text:'Our studio in India offers animation',datePublished:'2026-11-12'}] };
  const post = extractLinkedInPost(`<script type="application/ld+json">${JSON.stringify(json)}</script>`);
  assert.equal(post.text, json.articleBody);assert.equal(post.publishedDate,'2026-11-11');
  assert.equal(post.authorProfile,json.author.url);assert.ok(!post.text.includes('India'));
});

test('LinkedIn handle changes preserve the post identity, not a different activity', () => {
  assert.equal(samePublication('https://linkedin.com/posts/old_activity-123-x','https://linkedin.com/posts/new_activity-123-y'),true);
  assert.equal(samePublication('https://linkedin.com/posts/old_activity-123-x','https://linkedin.com/posts/new_activity-124-y'),false);
  assert.equal(samePublication('invalid','also invalid'),false);
  assert.equal(sameLinkedInProfile('https://uz.linkedin.com/in/buyer','https://www.linkedin.com/in/buyer/'),true);
  assert.equal(sameLinkedInProfile('https://linkedin.com/in/buyer','https://linkedin.com/in/namesake'),false);
  assert.equal(sameLinkedInProfile('https://linkedin.com.evil.org/in/buyer','https://linkedin.com/in/buyer'),false);
});

test('buyer requests outrank jobs and sellers while retaining platform coverage', () => {
  const candidates = [
    {url:'https://hh.ru/vacancy/1', snippet:'3D дизайнер полная занятость трудовой договор'},
    {url:'https://hh.ru/vacancy/2', snippet:'Ищем студию для производства CGI ролика'},
    {url:'https://t.me/orders/1', snippet:'Нужен подрядчик для 3D анимации'},
    {url:'https://linkedin.com/posts/test', snippet:'Looking for clients for our CGI studio'}
  ];
  const ordered = prioritizeCandidates(candidates);
  assert.equal(ordered[0].url, candidates[1].url);
  assert.equal(ordered[1].url, candidates[2].url);
  assert.ok(ordered.indexOf(candidates[1]) < ordered.indexOf(candidates[0]));
  assert.equal(ordered.length, 4);
});

test('recommendation requests and both spellings of production have buyer priority', () => {
  for (const snippet of ['Посоветуйте студию для CGI', 'Порекомендуйте продакшн для 3D', 'Ищу студию для анимации', 'Нужен продакшен для CGI']) {
    assert.ok(buyerIntentScore({snippet}) >= 100, snippet);
  }
  assert.ok(buyerIntentScore({snippet:'Предлагаю услуги студии CGI'}) < 100);
});

test('a discovered channel expands to individual posts and is not qualified as an order',async()=>{
  const fetched=[],qualified=[];let diagnostics;
  await huntOrders({onDiagnostics:value=>{diagnostics=value;}},{
    search:async()=>[{url:'https://t.me/s/orders',snippet:'Нужен подрядчик CGI'}],
    fetchPage:async url=>{
      fetched.push(url);
      return url==='https://t.me/s/orders'?{posts:[{url:'https://t.me/orders/123',snippet:'Нужен подрядчик CGI, бюджет проекта 1000000 RUB'}]}:null;
    },
    classify:async data=>{qualified.push(data);return {isOrder:false,reason:'fixture'};}
  });
  assert.equal(fetched.filter(url=>url==='https://t.me/s/orders').length,1);
  assert.equal(qualified.length,1);assert.equal(qualified[0].url,'https://t.me/orders/123');
  assert.equal(diagnostics.telegram_posts_discovered,1);
});

test('a saved LinkedIn activity is excluded despite a different slug or regional domain',async()=>{
  let checks=0;
  const leads=await huntOrders({excludeUrls:['https://uz.linkedin.com/posts/buyer_activity-123-old']},{
    search:async()=>[{url:'https://www.linkedin.com/posts/new-name_activity-123-new',snippet:'Ищем студию CGI'}],
    fetchPage:async()=>null,classify:async()=>{checks++;return {isOrder:false};}
  });
  assert.equal(checks,0);assert.deepEqual(leads,[]);
});

test('cached candidates are requalified without search API calls and with accurate counters',async()=>{
  let diagnostics,checks=0;
  await huntOrders({onDiagnostics:value=>{diagnostics=value;}},{
    candidates:[{url:'https://linkedin.com/posts/buyer_activity-123',snippet:'Looking for a CGI studio'}],
    search:async()=>assert.fail('cached replay must not call search'),fetchPage:async()=>null,
    classify:async()=>{checks++;return {isOrder:false,reason:'fixture'};}
  });
  assert.equal(checks,1);assert.equal(diagnostics.searches,0);assert.equal(diagnostics.retrieved,1);
  assert.equal(diagnostics.replay,true);assert.equal(diagnostics.geography,'worldwide');
});

test('ineligible Telegram budgets do not displace forty-eight actual AI checks',async()=>{
  let diagnostics,checks=0;
  await huntOrders({onDiagnostics:value=>{diagnostics=value;}},{
    candidates:[...Array.from({length:12},(_,i)=>({url:`https://t.me/orders/${i+1}`,snippet:'Ищем студию для CGI, бюджет обсуждается'})),
      ...Array.from({length:55},(_,i)=>({url:`https://linkedin.com/posts/buyer_activity-${i+1}`,snippet:'Looking for a CGI studio'}))],
    fetchPage:async()=>null,classify:async()=>{checks++;return {isOrder:false,reason:'fixture'};}
  });
  assert.equal(checks,48);assert.equal(diagnostics.llm_checks,48);
  assert.equal(diagnostics.checked,60);assert.equal(diagnostics.unchecked,7);
});

test('AI query planning replaces only matching source/industry jobs and keeps coverage',async()=>{
  const queries=[];
  await huntOrders({feedback:{checked:48}},{
    plan:async({feedback})=>{assert.equal(feedback.checked,48);return [{platform:'linkedin',industry:'Бьюти',query:'planned semantic',tavilyQuery:'planned literal',includeDomains:['linkedin.com']}];},
    search:async(query)=>{queries.push(query);return [];}
  });
  assert.equal(queries.length,36);assert.equal(queries.filter(x=>x==='planned semantic').length,1);
});

test('confirmed evidence stays resumable if persisting the lead fails',async()=>{
  const audits=[];
  await assert.rejects(huntOrders({onCandidate:item=>audits.push(item),onLead:async()=>{throw new Error('database unavailable');}},{
    candidates:[{url:'https://linkedin.com/posts/buyer_activity-123',snippet:'Looking for a CGI studio'}],
    fetchPage:async()=>null,classify:async()=>({isOrder:true,lead:{company:'Studio Buyer'}})
  }),/database unavailable/);
  assert.equal(audits.length,1);assert.equal(audits[0].accepted,false);
  assert.equal(audits[0].evaluation.code,'LEAD_PERSIST_ERROR');
});

test('a search provider outage does not prevent qualifying saved evidence',async()=>{
  let checks=0,diagnostics;
  await huntOrders({seedCandidates:[{url:'https://linkedin.com/posts/buyer_activity-123',snippet:'Looking for a CGI studio'}],onDiagnostics:x=>{diagnostics=x;}},{
    search:async()=>{throw new Error('search quota');},fetchPage:async()=>null,
    classify:async()=>{checks++;return {isOrder:false,reason:'fixture'};}
  });
  assert.equal(checks,1);assert.equal(diagnostics.search_errors.length,36);
});

test('fresh search does not discard a queued date or trust profile text as the original request',async()=>{
  let classified;
  const url='https://linkedin.com/posts/buyer_activity-123';
  await huntOrders({seedCandidates:[{url,snippet:'Original post\n\nИсточник профиля автора:\nProfile contains unrelated project requests',publishedDate:'2026-11-03'}]},{
    search:async()=>[{url,snippet:'Original post'}],fetchPage:async()=>null,
    classify:async data=>{classified=data;return {isOrder:false,reason:'fixture'};}
  });
  assert.ok(classified.text.includes('2026-11-03'));
  assert.ok(!classified.requestText.includes('unrelated project requests'));
});

test('qualification cap reports unchecked publications explicitly',async()=>{
  let diagnostics;
  await huntOrders({onDiagnostics:value=>{diagnostics=value;}},{
    search:async()=>Array.from({length:60},(_,i)=>({url:`https://hh.ru/vacancy/${i+1}`,snippet:'Публикация'})),
    fetchPage:async()=>null,classify:async()=>({isOrder:false,reason:'fixture'})
  });
  assert.equal(diagnostics.candidates,60);assert.equal(diagnostics.checked,48);assert.equal(diagnostics.unchecked,12);
});
