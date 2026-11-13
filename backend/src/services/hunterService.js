import { applyAiSettings, checkLlm, safeErrorMessage } from '../../../ai/llm.js';
import { huntOrders } from '../../../ai/index.js';
import { publicationKey } from '../../../ai/candidates.js';
import { isBannedLead } from '../../../ai/policy.js';
import { SEARCH_MAX_AGE_DAYS } from '../../../ai/sources.js';
import { db } from '../db/index.js';
import { broadcast } from '../ws/index.js';

let huntRunning = false;
const companyKey = value => String(value || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');

/** UI, scheduler and CLI use the same bounded, resumable search. */
export async function executeAiHunt({ query = null, limit = 10, searchRound, maxRounds = 3 } = {}, {
  database = db, hunt = huntOrders, check = checkLlm, notify = broadcast, schedule = setTimeout
} = {}) {
  if (huntRunning) {
    const error = new Error('Поиск уже выполняется. Дождитесь завершения текущего запуска.');
    error.code = 'HUNT_RUNNING';
    throw error;
  }
  huntRunning = true;
  const onProgress = message => notify({type:'ai_progress',message});
  let runId, diagnostics;
  let foundCount = 0;
  const addedLeads = [], passes = [];
  const checkedUrls = new Set(), discoveredUrls = new Set(), savedUrls = new Set(), companies = new Set();
  let deferred = [];
  const refreshDiagnostics = () => {
    const totals = {target:limit,rounds:passes,completed_rounds:passes.length,rejected:{},platforms:{},search_errors:[]};
    for (const pass of passes) {
      for (const field of ['searches','successful_searches','retrieved','candidates','checked','llm_checks','accepted','author_checks','telegram_feeds_checked','telegram_posts_discovered']) {
        totals[field] = (totals[field] || 0) + (pass[field] || 0);
      }
      for (const field of ['rejected','platforms']) for (const [key,count] of Object.entries(pass[field] || {})) totals[field][key] = (totals[field][key] || 0) + count;
      totals.search_errors.push(...(pass.search_errors || []));
    }
    if (discoveredUrls.size) totals.candidates=discoveredUrls.size;
    totals.unchecked=Math.max(0,(totals.candidates || 0)-(totals.checked || 0));
    totals.target_reached=addedLeads.length>=limit;
    totals.geography='worldwide';
    totals.max_age_days=SEARCH_MAX_AGE_DAYS;
    diagnostics=totals;
  };
  const saveLead = async lead => {
    const url=publicationKey(lead.url),company=companyKey(lead.company);
    if (savedUrls.has(url) || companies.has(company)) return false;
    foundCount++;
    const added=await database.addLead(lead);
    if (!added) return false;
    savedUrls.add(url);companies.add(company);addedLeads.push(added);
    notify({type:'new_lead_detected',lead:{id:added.id,company:added.company,industry:added.industry,phone:added.phone,service:added.service,source:added.source}});
    return true;
  };
  try {
    if (!Number.isInteger(limit) || limit<1 || limit>20) throw new Error('limit: целое число от 1 до 20');
    if (!Number.isInteger(maxRounds) || maxRounds<1 || maxRounds>3) throw new Error('maxRounds: целое число от 1 до 3');
    if (searchRound!==undefined && (!Number.isInteger(searchRound) || searchRound<0 || searchRound>97)) throw new Error('searchRound: целое число от 0 до 97');
    if (query!==null && (typeof query!=='string' || query.length>500)) throw new Error('query: строка до 500 символов');
    runId=await database.startSearchRun({query,limit});
    const firstRound=searchRound ?? ((Number.parseInt(runId,16) || 0)%20);
    applyAiSettings(await database.getSettings());
    onProgress('Проверка подключения к AI-квалификатору…');
    await check({onRetry:onProgress});
    const stored=await database.getStoredLeads();
    stored.forEach(lead=>{savedUrls.add(publicationKey(lead.url));if (!isBannedLead(lead)) companies.add(companyKey(lead.company));});
    deferred=await database.getPendingCandidates?.() || [];
    const previousRun=await database.getLatestSearchFeedback?.() || {};
    for (let pass=0;pass<maxRounds && addedLeads.length<limit;pass++) {
      onProgress(`Поиск заказчиков: ${addedLeads.length}/${limit}. Проход ${pass+1}/${maxRounds}.`);
      const previous=diagnostics || previousRun,seeds=deferred;
      deferred=[];
      await hunt({query,limit:limit-addedLeads.length,searchRound:firstRound+pass,feedback:previous,
        onProgress,excludeUrls:[...stored.map(lead=>lead.url),...checkedUrls],excludeCompanies:[...companies],seedCandidates:seeds,
        onDiagnostics:value=>{passes[pass]=value;refreshDiagnostics();},
        onDiscovered:async candidates=>{
          candidates.forEach(item=>discoveredUrls.add(publicationKey(item.url)));
          await database.saveDiscoveredCandidates?.(runId,candidates);
        },
        onDeferred:items=>{deferred=items;},
        onCandidate:async candidate=>{
          await database.saveCandidate(runId,candidate);
          if (typeof candidate.evaluation?.isOrder==='boolean') checkedUrls.add(candidate.url);
        },onLead:saveLead
      });
      refreshDiagnostics();
    }
    const targetReached=addedLeads.length>=limit;
    const finalMessage=`Добавлено ${addedLeads.length} новых прямых заказчиков из цели ${limit}. Проверено публикаций: ${diagnostics?.checked || 0}.`
      +(targetReached?' Цель достигнута.':` Цель пока не достигнута.${deferred.length?` В очереди осталось ${deferred.length} публикаций; они сохранены для следующего запуска.`:''}`)
      +(diagnostics?.search_errors.length?` Не выполнено поисковых запросов: ${diagnostics.search_errors.length}.`:'');
    await database.finishSearchRun(runId,{status:'completed',diagnostics,found:foundCount,added:addedLeads.length});
    onProgress(finalMessage);
    schedule(()=>onProgress(''),7000);
    return {success:true,target:limit,target_reached:targetReached,found_count:foundCount,new_leads_found:addedLeads.length,leads:addedLeads,diagnostics,run_id:runId,message:finalMessage};
  } catch (error) {
    refreshDiagnostics();
    if (addedLeads.length) error.message=`${safeErrorMessage(error.message)} Уже сохранено новых заказов: ${addedLeads.length}.`;
    error.partial_result={run_id:runId,found_count:foundCount,new_leads_found:addedLeads.length};
    if (runId) {
      try {await database.finishSearchRun(runId,{status:'failed',diagnostics,found:foundCount,added:addedLeads.length,error:safeErrorMessage(error.message)});}
      catch (saveError) {console.error('[SearchRun]',safeErrorMessage(saveError.message));}
    }
    console.error('[HunterService Error]',error);
    onProgress(`Ошибка ИИ-поиска: ${safeErrorMessage(error.message)}`);
    throw error;
  } finally {huntRunning=false;}
}
