import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { callGemini, callOpenRouter, callLlm, applyAiSettings } from './llm.js';
import { requestJson } from '../frontend/src/utils/api.js';

const keys=['GEMINI_API_KEY','Google_api','OPENROUTER_API_KEY','AI_PROVIDER','GEMINI_MODEL'];
const original=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
afterEach(()=>{for(const key of keys){if(original[key]===undefined)delete process.env[key];else process.env[key]=original[key];}});
const setup=()=>{process.env.GEMINI_API_KEY='synthetic-gemini-secret';process.env.Google_api='legacy-secret';process.env.OPENROUTER_API_KEY='synthetic-router-secret';process.env.AI_PROVIDER='auto';delete process.env.GEMINI_MODEL;};
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
test('missing model falls back to next stable model',async()=>{
 setup();let calls=0;
 const result=await callGemini('prompt',true,{request:async()=>++calls===1?response(404,{error:{message:'model not found'}}):response(200,{candidates:[{content:{parts:[{text:'{"ok":true}'}]}}]})});
 assert.equal(calls,2);assert.equal(result.ok,true);
});
test('all-provider error retains BOTH causes and redacts secrets',async()=>{
 setup();
 await assert.rejects(callLlm('prompt',true,{request:async url=>url.includes('googleapis')?response(403,{error:{message:'blocked synthetic-gemini-secret'}}):response(402,{error:{message:'credits exhausted synthetic-router-secret'}})}),error=>{
  assert.match(error.message,/Gemini HTTP 403/);assert.match(error.message,/OpenRouter HTTP 402/);
  assert.ok(!error.message.includes('synthetic-gemini-secret'));assert.ok(!error.message.includes('synthetic-router-secret'));
  assert.equal(error.code,'AI_PROVIDER_ERROR');return true;
 });
});
test('automatic provider fallback works',async()=>{
 setup();const result=await callLlm('prompt',true,{request:async url=>url.includes('googleapis')?response(403,{error:{message:'unavailable'}}):response(200,{choices:[{message:{content:'{"ok":true}'}}]})});
 assert.equal(result.ok,true);
});
test('explicit OpenRouter selection does not call Gemini',async()=>{
 setup();process.env.AI_PROVIDER='openrouter';
 const result=await callLlm('prompt',true,{request:async url=>{assert.ok(url.includes('openrouter'));return response(200,{choices:[{message:{content:'{"ok":true}'}}]});}});
 assert.equal(result.ok,true);
});
test('saved settings restored after process restart and blanks do not erase env keys',()=>{
 setup();applyAiSettings({ai_provider:'gemini',gemini_api_key:'new-test-secret',openrouter_api_key:''});
 assert.equal(process.env.GEMINI_API_KEY,'new-test-secret');assert.equal(process.env.OPENROUTER_API_KEY,'synthetic-router-secret');assert.equal(process.env.AI_PROVIDER,'gemini');
});
test('OpenRouter empty reply is an error, not a qualified result',async()=>{
 setup();await assert.rejects(callOpenRouter('prompt',true,{request:async()=>response(200,{choices:[]})}),/пустой ответ/);
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
 const {db}=await import('../backend/src/db/index.js');const before=db.leads;
 try{db.leads=[{url:'https://sostav.ru/article/old',phone:'test'},{url:'https://hh.ru/vacancy/123',verified_direct:true}];const stats=db.getStats();assert.equal(stats.stored_total,2);assert.equal(stats.total_leads,1);assert.equal(stats.hidden_by_policy,1);}
 finally{db.leads=before;}
});
