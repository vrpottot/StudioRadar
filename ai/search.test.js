import test from 'node:test';
import assert from 'node:assert/strict';
import { searchWeb, searchWithExa, searchWithTavily, searchAuthorEvidence } from './search.js';

test('author enrichment excludes namesakes and preserves evidence from the exact profile',async()=>{
  const author={name:'Author',url:'https://uz.linkedin.com/in/original'};
  const evidence=await searchAuthorEvidence(author,{contents:async()=>null,search:async()=>[
    {url:'https://linkedin.com/in/namesake',title:'Author',snippet:'Different person and country'},
    {url:'https://www.linkedin.com/in/original',title:'Author - Buyer Studio',snippet:'Tashkent, Uzbekistan'}
  ]});
  assert.ok(evidence.text.includes('Tashkent, Uzbekistan'));assert.ok(!evidence.text.includes('Different person'));
  assert.equal(await searchAuthorEvidence(author,{contents:async()=>null,search:async()=>[{url:'https://linkedin.com/in/namesake',snippet:'Wrong person'}]}),null);
});

test('Exa timeout is a transport option and does not leak into the API body', async () => {
  const original = process.env.EXA_API_KEY;
  process.env.EXA_API_KEY = 'fixture';
  try {
    await searchWithExa('CGI', 3, 'direct orders', {includeDomains:['hh.ru']}, {client:{
      search:async (query, body, transport) => {
        assert.equal(query,'CGI');
        assert.equal(body.timeout,undefined);
        assert.equal(transport.timeout,20000);
        assert.deepEqual(body.includeDomains,['hh.ru']);
        return {results:[]};
      }
    }});
  } finally {
    if (original === undefined) delete process.env.EXA_API_KEY; else process.env.EXA_API_KEY=original;
  }
});

test('engines use distinct queries and retain publication dates when deduplicating', async () => {
  const original = process.env.EXA_API_KEY;
  process.env.EXA_API_KEY='fixture';
  try {
    const results=await searchWeb('Russian query',3,null,{tavilyQuery:'English query'}, {
      exa:async query=>{assert.equal(query,'Russian query');return [{url:'https://hh.ru/vacancy/123',snippet:'short',publishedDate:'2026-11-11'}];},
      tavily:async query=>{assert.equal(query,'English query');return [{url:'https://hh.ru/vacancy/123',snippet:'longer content'}];}
    });
    assert.equal(results.length,1);
    assert.equal(results[0].publishedDate,'2026-11-11');
    assert.equal(results[0].snippet,'longer content');
  } finally {
    if(original === undefined) delete process.env.EXA_API_KEY; else process.env.EXA_API_KEY=original;
  }
});

test('Tavily uses the same explicit ninety-day boundary and leaves author lookup undated',async()=>{
  const originalKey=process.env.TAVILY_API_KEY, originalFetch=globalThis.fetch;
  process.env.TAVILY_API_KEY='fixture';const bodies=[];
  try {
    globalThis.fetch=async(url,options)=>{bodies.push(JSON.parse(options.body));return {ok:true,json:async()=>({results:[]})};};
    await searchWithTavily('orders',3,{since:'2026-08-14T00:00:00.000Z'});
    await searchWithTavily('author',2,{since:'2000-01-01T00:00:00.000Z',timeRange:null});
    assert.equal(bodies[0].start_date,'2026-08-14');assert.equal(bodies[0].time_range,undefined);
    assert.equal(bodies[1].start_date,undefined);assert.equal(bodies[1].time_range,undefined);
  } finally {
    globalThis.fetch=originalFetch;
    if(originalKey===undefined)delete process.env.TAVILY_API_KEY;else process.env.TAVILY_API_KEY=originalKey;
  }
});
