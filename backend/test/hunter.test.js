import test from 'node:test';
import assert from 'node:assert/strict';
import { executeAiHunt } from '../src/services/hunterService.js';

function fixture(hunt) {
  const writes=[],runs=[],events=[];
  return {writes,runs,events,dependencies:{hunt,check:async()=>({ok:true}),notify:event=>events.push(event),schedule:()=>{},database:{
    startSearchRun:async()=> 'fixture-run',getSettings:async()=>({}),getStoredLeads:async()=>[],
    saveCandidate:async()=>{},addLead:async lead=>{writes.push(lead);return lead;},
    finishSearchRun:async(id,result)=>{runs.push({id,...result});}
  }}};
}

test('confirmed orders persist when a later qualification fails',async()=>{
  const lead={id:'one',company:'Fixture',url:'https://hh.ru/vacancy/123'};
  const f=fixture(async({onLead,onDiagnostics})=>{
    onDiagnostics({checked:2,accepted:1});
    await onLead(lead);
    const error=new Error('Gemini HTTP 503: overloaded');error.code='AI_PROVIDER_ERROR';throw error;
  });
  await assert.rejects(executeAiHunt({},f.dependencies),error=>{
    assert.equal(error.partial_result.new_leads_found,1);assert.equal(error.partial_result.found_count,1);return true;
  });
  assert.deepEqual(f.writes,[lead]);assert.equal(f.runs[0].status,'failed');assert.equal(f.runs[0].added,1);
  assert.equal(f.events.filter(event=>event.type==='new_lead_detected').length,1);
});

test('streamed orders are not inserted a second time after successful completion',async()=>{
  const lead={id:'one',company:'Fixture',url:'https://hh.ru/vacancy/123'};
  const f=fixture(async({onLead,onDiagnostics})=>{
    onDiagnostics({retrieved:1,candidates:1,checked:1,accepted:1,rejected:{},search_errors:[]});
    await onLead(lead);return [lead];
  });
  const result=await executeAiHunt({},f.dependencies);
  assert.equal(f.writes.length,1);assert.equal(result.new_leads_found,1);assert.equal(f.runs[0].status,'completed');
});

test('a failed database write is never reported as a saved order',async()=>{
  const f=fixture(async({onLead})=>{await onLead({id:'one'});return [];});
  f.dependencies.database.addLead=async()=>{throw new Error('database unavailable');};
  await assert.rejects(executeAiHunt({},f.dependencies),error=>error.partial_result.new_leads_found===0);
  assert.equal(f.runs[0].added,0);assert.equal(f.runs[0].status,'failed');
  assert.equal(f.events.filter(event=>event.type==='new_lead_detected').length,0);
});

test('the normal hunt continues with a changed query round and stops at the company target',async()=>{
  const calls=[];
  const f=fixture(async options=>{
    calls.push(options);
    const index=calls.length;
    const lead={id:`lead-${index}`,company:`Customer ${index}`,url:`https://hh.ru/vacancy/${index}`};
    options.onDiagnostics({checked:1,candidates:1,retrieved:1,rejected:{},search_errors:[]});
    await options.onCandidate({url:lead.url,evaluation:{isOrder:true}});
    await options.onLead(lead);
    return [lead];
  });
  f.dependencies.database.getLatestSearchFeedback=async()=>({checked:8,rejected:{staff:8}});
  const result=await executeAiHunt({limit:2,searchRound:0},f.dependencies);
  assert.equal(calls.length,2);assert.deepEqual(calls.map(x=>x.searchRound),[0,1]);
  assert.deepEqual(calls.map(x=>x.limit),[2,1]);
  assert.ok(calls[1].excludeUrls.includes('https://hh.ru/vacancy/1'));
  assert.ok(calls[1].excludeCompanies.includes('customer 1'));
  assert.equal(calls[1].feedback.checked,1);
  assert.equal(calls[0].feedback.checked,8);
  assert.equal(result.target_reached,true);assert.equal(result.new_leads_found,2);
});

test('pending evidence is saved before qualification, carried forward and never reported as ten leads',async()=>{
  const pending={url:'https://hh.ru/vacancy/99',snippet:'pending request'};
  const batches=[],calls=[];
  const f=fixture(async options=>{
    calls.push(options);
    options.onDiagnostics({checked:0,candidates:1,retrieved:1,rejected:{},search_errors:[]});
    await options.onDiscovered([pending]);
    options.onDeferred([pending]);
    return [];
  });
  f.dependencies.database.getPendingCandidates=async()=>[pending];
  f.dependencies.database.saveDiscoveredCandidates=async(run,items)=>batches.push(items);
  const result=await executeAiHunt({limit:10},f.dependencies);
  assert.equal(calls.length,3);assert.equal(batches.length,3);
  assert.ok(calls.every(x=>x.seedCandidates[0]===pending));
  assert.equal(result.target_reached,false);assert.equal(result.new_leads_found,0);
  assert.equal(result.diagnostics.candidates,1);assert.match(result.message,/Цель пока не достигнута/);
});
