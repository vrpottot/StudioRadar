import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { callGemini, callLlm, applyAiSettings, checkLlm } from './llm.js';
import { requestJson } from '../frontend/src/utils/api.js';

const keys=['GEMINI_API_KEY','Google_api','AI_PROVIDER','GEMINI_MODEL'];
const original=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
afterEach(()=>{for(const key of keys){if(original[key]===undefined)delete process.env[key];else process.env[key]=original[key];}});
const setup=()=>{process.env.GEMINI_API_KEY='synthetic-gemini-secret';process.env.Google_api='legacy-secret';process.env.AI_PROVIDER='gemini';delete process.env.GEMINI_MODEL;};
const response=(status,data)=>({ok:status>=200&&status<300,status,statusText:'Test',json:async()=>data});

test('Gemini checks HTTP status and does not try every model with an invalid key',async()=>{
 setup();let calls=0;
 await assert.rejects(callGemini('prompt',true,{request:async()=>{calls++;return response(400,{error:{message:'API key not valid'}});}}),/Gemini HTTP 400.*API key not valid/);
 assert.equal(calls,1);
});
test('canonical Gemini key wins over legacy key and travels in header, never URL',async()=>{
 setup();
 const data=await callGemini('prompt',true,{request:async(url,options)=>{
  assert.equal(options.headers['x-goog-api-key'],'synthetic-gemini-secret');
  assert.ok(!url.includes('secret'));
  return response(200,{candidates:[{content:{parts:[{text:'thinking',thought:true},{text:'{"ok":true}'}]}}]});
 }});
 assert.equal(data.ok,true);
});

test('structured responses send the official REST JSON schema and reject missing fields without coercion',async()=>{
 setup();let calls=0;
 const responseSchema={type:'object',properties:{is_order:{type:'boolean'}},required:['is_order'],additionalProperties:false};
 const result=await callGemini('prompt',true,{responseSchema,random:()=>0,sleep:async()=>{},request:async(url,options)=>{
  const config=JSON.parse(options.body).generationConfig;
  assert.deepEqual(config.responseJsonSchema,responseSchema);assert.equal(config.responseSchema,undefined);
  assert.equal(config.responseMimeType,'application/json');
  return response(200,{candidates:[{finishReason:'STOP',content:{parts:[{text:++calls===1?'{}':'{"is_order":false}'}]}}]});
 }});
 assert.deepEqual(result,{is_order:false});assert.equal(calls,2);
});

test('schema violations never become an accepted qualification even when the JSON parses',async()=>{
 setup();let calls=0;
 const responseSchema={type:'object',properties:{is_order:{type:'boolean'}},required:['is_order'],additionalProperties:false};
 await assert.rejects(callLlm('prompt',true,{responseSchema,random:()=>0,sleep:async()=>{},request:async()=>{
  calls++;return response(200,{candidates:[{content:{parts:[{text:'{"is_order":"true"}'}]}}]});
 }}),error=>error.code==='AI_PROVIDER_ERROR'&&/is_order.*boolean/.test(error.message));
 assert.equal(calls,6);
});

test('a token-limited answer is retried even if it happens to contain parseable JSON',async()=>{
 setup();let calls=0;
 const result=await callGemini('prompt',true,{random:()=>0,sleep:async()=>{},request:async()=>response(200,{candidates:[{
  finishReason:++calls===1?'MAX_TOKENS':'STOP',content:{parts:[{text:'{"ok":true}'}]}
 }]})});
 assert.equal(result.ok,true);assert.equal(calls,2);
});

test('planning schemas enforce list size, enumerations and numeric ranges locally',async()=>{
 setup();let calls=0;
 const responseSchema={type:'object',properties:{jobs:{type:'array',minItems:1,maxItems:2,items:{type:'object',properties:{platform:{type:'string',enum:['linkedin']},priority:{type:'integer',minimum:0,maximum:10}},required:['platform','priority'],additionalProperties:false}}},required:['jobs'],additionalProperties:false};
 const answers=[{jobs:[]},{jobs:[{platform:'linkedin',priority:11}]},{jobs:[{platform:'linkedin',priority:5}]}];
 const result=await callGemini('prompt',true,{responseSchema,random:()=>0,sleep:async()=>{},request:async()=>response(200,{candidates:[{content:{parts:[{text:JSON.stringify(answers[calls++])}]}}]})});
 assert.equal(calls,3);assert.equal(result.jobs[0].priority,5);
});
test('missing model falls back to next stable model',async()=>{
 setup();let calls=0;
 const result=await callGemini('prompt',true,{request:async()=>++calls===1?response(404,{error:{message:'model not found'}}):response(200,{candidates:[{content:{parts:[{text:'{"ok":true}'}]}}]})});
 assert.equal(calls,2);assert.equal(result.ok,true);
});
test('retired configured models fall back to the current Gemini model',async()=>{
 setup();process.env.GEMINI_MODEL='retired-model';const urls=[];
 const result=await callGemini('prompt',true,{request:async url=>{
  urls.push(url);
  if(url.includes('retired-model'))return response(404,{error:{message:'model retired'}});
  return response(200,{candidates:[{content:{parts:[{text:JSON.stringify({ok:true})}]}}]});
 }});
 assert.equal(result.ok,true);
 assert.equal(urls.length,2);
 assert.ok(urls[1].includes('gemini-3.8-flash'));
});

test('qualification retains Gemini error and redacts credentials',async()=>{
 setup();
 await assert.rejects(callLlm('prompt',true,{request:async()=>response(403,{error:{message:'blocked synthetic-gemini-secret'}})}),error=>{
  assert.match(error.message,/Gemini HTTP 403/);
  assert.ok(!error.message.includes('synthetic-gemini-secret'));
  assert.equal(error.code,'AI_PROVIDER_ERROR');return true;
 });
});

test('qualification always uses Gemini despite obsolete provider settings',async()=>{
 setup();process.env.AI_PROVIDER='obsolete-provider';
 const result=await callLlm('prompt',true,{request:async url=>{
  assert.ok(url.startsWith('https://generativelanguage.googleapis.com/'));
  return response(200,{candidates:[{content:{parts:[{text:JSON.stringify({ok:true})}]}}]});
 }});
 assert.equal(result.ok,true);
});

test('invalid Gemini credentials stop after one request',async()=>{
 setup();let calls=0;
 await assert.rejects(callLlm('prompt',true,{request:async()=>{calls++;return response(401,{error:{message:'invalid key'}});}}),/Gemini HTTP 401/);
 assert.equal(calls,1);
});

test('saved key is restored and blank settings retain it',()=>{
 setup();applyAiSettings({ai_provider:'obsolete-provider',gemini_api_key:'new-test-secret'});
 applyAiSettings({gemini_api_key:''});
 assert.equal(process.env.GEMINI_API_KEY,'new-test-secret');assert.equal(process.env.AI_PROVIDER,'gemini');
});

test('empty Gemini reply fails qualification',async()=>{
 setup();await assert.rejects(callLlm('prompt',true,{request:async()=>response(200,{candidates:[]})}),error=>error.code==='AI_PROVIDER_ERROR');
});

test('connectivity probe identifies Gemini',async()=>{
 setup();const saved=globalThis.fetch;
 try {
  globalThis.fetch=async()=>response(200,{candidates:[{content:{parts:[{text:JSON.stringify({ok:true})}]}}]});
  const result=await checkLlm();assert.equal(result.ok,true);assert.equal(result.provider,'gemini');
 } finally {globalThis.fetch=saved;}
});

test('temporary overload retries with increasing delays and progress',async()=>{
 setup();let calls=0;const waits=[],progress=[];
 const result=await callGemini('prompt',true,{random:()=>0,sleep:async ms=>{waits.push(ms);},onRetry:message=>progress.push(message),request:async()=>{
  calls++;return calls<3?response(503,{error:{message:'high demand'}}):response(200,{candidates:[{content:{parts:[{text:JSON.stringify({ok:true})}]}}]});
 }});
 assert.equal(result.ok,true);assert.equal(calls,3);assert.deepEqual(waits,[1000,2000]);assert.equal(progress.length,2);
});

test('exhausted primary model falls back after a bounded number of retries',async()=>{
 setup();const urls=[],waits=[];
 const result=await callGemini('prompt',true,{random:()=>0,sleep:async ms=>{waits.push(ms);},request:async url=>{
  urls.push(url);
  return url.includes('gemini-3.8-flash')?response(503,{error:{message:'busy'}}):response(200,{candidates:[{content:{parts:[{text:JSON.stringify({ok:true})}]}}]});
 }});
 assert.equal(result.ok,true);assert.equal(urls.length,4);assert.ok(urls[3].includes('gemini-3.5-flash-lite'));assert.deepEqual(waits,[1000,2000]);
});

test('persistent overload retains retryable status after both model budgets',async()=>{
 setup();let calls=0;const waits=[];
 await assert.rejects(callLlm('prompt',true,{random:()=>0,sleep:async ms=>{waits.push(ms);},request:async()=>{calls++;return response(503,{error:{message:'high demand'}});}}),error=>{
  assert.equal(error.status,503);assert.equal(error.retryable,true);assert.match(error.message,/gemini-3.8-flash/);assert.match(error.message,/gemini-3.5-flash-lite/);return true;
 });
 assert.equal(calls,6);assert.deepEqual(waits,[1000,2000,1000,2000]);
});

test('Retry-After and Google RetryInfo are respected',async()=>{
 setup();let calls=0;const waits=[];
 await callGemini('prompt',true,{random:()=>0,sleep:async ms=>{waits.push(ms);},request:async()=>{
  if(++calls===1)return {...response(429,{error:{message:'rate limit',details:[{'@type':'type.googleapis.com/google.rpc.RetryInfo',retryDelay:'7s'}]}}),headers:{get:()=> '5'}};
  return response(200,{candidates:[{content:{parts:[{text:JSON.stringify({ok:true})}]}}]});
 }});
 assert.deepEqual(waits,[7000]);
});

test('server delays beyond the retry budget do not trigger early retries',async()=>{
 setup();let calls=0;
 await assert.rejects(callGemini('prompt',true,{sleep:async()=>assert.fail('must not sleep or retry early'),request:async()=>{
  calls++;return {...response(429,{error:{message:'quota'}}),headers:{get:()=> '120'}};
 }}),error=>error.status===429);
 assert.equal(calls,2);
});

test('minute quota waits over thirty seconds when the total budget allows it',async()=>{
 setup();let calls=0;const waits=[];
 const result=await callGemini('prompt',true,{random:()=>0,sleep:async ms=>waits.push(ms),request:async()=>{
  if(++calls===1)return response(429,{error:{message:'requests per minute limit exceeded',details:[{'@type':'type.googleapis.com/google.rpc.RetryInfo',retryDelay:'34s'}]}});
  return response(200,{candidates:[{content:{parts:[{text:'{"ok":true}'}]}}]});
 }});
 assert.equal(result.ok,true);assert.deepEqual(waits,[34000]);assert.equal(calls,2);
});

test('network errors retry without treating malformed model output as overload',async()=>{
 setup();let calls=0;const waits=[];
 const result=await callGemini('prompt',true,{random:()=>0,sleep:async ms=>{waits.push(ms);},request:async()=>{
  if(++calls===1)throw new TypeError('fetch failed');
  return response(200,{candidates:[{content:{parts:[{text:JSON.stringify({ok:true})}]}}]});
 }});
 assert.equal(result.ok,true);assert.equal(calls,2);assert.deepEqual(waits,[1000]);
});

test('malformed model JSON is retried, never repaired into an accepted order',async()=>{
 setup();let calls=0;const progress=[];
 const result=await callGemini('prompt',true,{random:()=>0,sleep:async()=>{},onRetry:message=>progress.push(message),request:async()=>{
  calls++;
  return response(200,{candidates:[{content:{parts:[{text:calls===1?'{"country":"\\uZZZZ"}':'{"ok":true}'}]}}]});
 }});
 assert.equal(result.ok,true);assert.equal(calls,2);assert.match(progress[0],/некорректный JSON/);
});

test('daily quota switches model immediately and remembers cooldown for the same key',async()=>{
 setup();process.env.GEMINI_API_KEY='daily-quota-test-key';let primary=0,secondary=0;
 const options={now:()=>1000,sleep:async()=>assert.fail('daily quota must not be retried'),request:async url=>{
  if(url.includes('gemini-3.8-flash')){primary++;return response(429,{error:{message:'Generate content requests per day limit exceeded',details:[{'@type':'type.googleapis.com/google.rpc.RetryInfo',retryDelay:'3600s'}]}});}
  secondary++;return response(200,{candidates:[{content:{parts:[{text:'{"ok":true}'}]}}]});
 }};
 assert.equal((await callGemini('prompt',true,options)).ok,true);
 assert.equal((await callGemini('prompt',true,options)).ok,true);
 assert.equal(primary,1);assert.equal(secondary,2);
 assert.equal((await callGemini('prompt',true,{...options,now:()=>3601001})).ok,true);
 assert.equal(primary,2);
});

test('HTML 503 gateway responses are retried using their HTTP status',async()=>{
 setup();let calls=0;
 const result=await callGemini('prompt',true,{random:()=>0,sleep:async()=>{},request:async()=>{
  if(++calls===1)return {...response(503,{}),json:async()=>{throw new SyntaxError('HTML gateway response');}};
  return response(200,{candidates:[{content:{parts:[{text:JSON.stringify({ok:true})}]}}]});
 }});
 assert.equal(result.ok,true);assert.equal(calls,2);
});

test('the total retry deadline also bounds attempts across models',async()=>{
 setup();let time=0,calls=0;
 await assert.rejects(callGemini('prompt',true,{now:()=>time,random:()=>0,sleep:async ms=>{time+=ms;},request:async()=>{
  calls++;time+=Math.min(20000,60000-time);return response(503,{error:{message:'busy'}});
 }}),error=>error.status===503);
 assert.equal(time,60000);assert.equal(calls,3);
});

test('HTTP 503 API error is never interpreted as zero leads',async()=>{
 const saved=globalThis.fetch;
 try{globalThis.fetch=async()=>response(503,{error:'Gemini HTTP 400: invalid key'});await assert.rejects(requestJson('/api/scan'),/Gemini HTTP 400/);}
 finally{globalThis.fetch=saved;}
});
test('HTML gateway failure yields HTTP error instead of JSON parsing noise',async()=>{
 const saved=globalThis.fetch;
 try{globalThis.fetch=async()=>({ok:false,status:504,json:async()=>{throw new Error('HTML');}});await assert.rejects(requestJson('/api/scan'),/HTTP 504/);}
 finally{globalThis.fetch=saved;}
});
test('stats explain stored records hidden by source policy',async()=>{
 const {statsForLeads}=await import('../backend/src/db/index.js');
 const stats=statsForLeads([{url:'https://sostav.ru/article/old',phone:'test'},{url:'https://hh.ru/vacancy/123',verified_direct:true}]);
 assert.equal(stats.stored_total,2);assert.equal(stats.total_leads,1);assert.equal(stats.hidden_by_policy,1);
});
