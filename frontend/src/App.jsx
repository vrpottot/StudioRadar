import { requestJson } from './utils/api';
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import LeadTable from './components/LeadTable';
import LeadDrawer from './components/LeadDrawer';
import OverviewView from './components/OverviewView';
import PipelinesView from './components/PipelinesView';
import PipelineBuilderModal from './components/PipelineBuilderModal';
import SignalsView from './components/SignalsView';
import SourcesView from './components/SourcesView';
import SettingsView from './components/SettingsView';
import { getLeadGrade } from './data/leadsData';

const API_BASE = (typeof window !== 'undefined' && (window.location.origin.includes(':5173') || window.location.origin.includes(':3000')))
  ? "http://127.0.0.1:8001" 
  : "";

export default function App() {
  const [activeView, setActiveView] = useState('leads'); // 'leads' | 'overview' | 'signals' | 'pipelines' | 'sources' | 'settings'
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Пайплайны
  const [pipelines, setPipelines] = useState([]);
  const [isPipelineBuilderOpen, setIsPipelineBuilderOpen] = useState(false);

  // Фильтры лидов
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'in_progress' | 'closed'
  const [leadTypeFilter, setLeadTypeFilter] = useState('all'); // 'all' | 'order' | 'signal'
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState('Все сферы');
  const [selectedService, setSelectedService] = useState('Все услуги');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyWithPhone, setOnlyWithPhone] = useState(false);

  // Статусы сканеров
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [isAiHunting, setIsAiHunting] = useState(false);
  const [aiProgressMessage, setAiProgressMessage] = useState('');
  const [aiError, setAiError] = useState('');
  const [backendError, setBackendError] = useState('');
  const [storageInfo, setStorageInfo] = useState(null);

  // Загрузка пайплайнов с бэкенда
  const fetchBackendPipelines = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pipelines`);
      if (res.ok) {
        const data = await res.json();
        setPipelines(data);
      }
    } catch (e) {
      console.warn("Ошибка загрузки пайплайнов:", e.message);
    }
  };

  // Загрузка лидов с бэкенда
  const fetchBackendLeads = async () => {
    try {
      const data = await requestJson(`${API_BASE}/api/leads`);
      setBackendError('');
      {
        const formatted = data
          .map(item => ({
            id: item.id,
            company: item.company,
            industry: item.industry,
            service: item.service,
            contactName: item.contact_name,
            role: item.role,
            phone: item.phone,
            telegram: item.telegram,
            email: item.email,
            source: item.source,
            sourceType: item.source_type,
            leadType: item.lead_type || (item.url && (item.url.includes('/tenders/') || item.url.includes('/market/')) ? 'order' : (item.id.startsWith('order-') ? 'order' : 'signal')),
            budget: item.budget,
            score: item.score,
            grade: getLeadGrade(item.score || 70),
            verifiedDirect: item.verified_direct,
            requestText: item.request_text,
            suggestedSolution: item.suggested_solution,
            status: item.status,
            notes: item.notes,
            url: item.url,
            applyUrl: item.apply_url || item.url,
            title: item.title,
            date: item.created_at ? item.created_at.replace('T', ' ').slice(0, 16) : ""
          }));
        setLeads(formatted);
        try { setStorageInfo(await requestJson(`${API_BASE}/api/stats`)); } catch {}
      }
    } catch (e) {
      console.warn("Бэкенд пока не ответил:", e.message);
      setBackendError(`Не удалось загрузить лиды: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem('studioradar_leads');
    } catch (e) {}

    fetchBackendLeads();
    fetchBackendPipelines();

    // WebSocket для моментального реалтайм обновления
    let ws;
    try {
      const isLocalDev = window.location.origin.includes(':5173') || window.location.origin.includes(':3000');
      const wsUrl = isLocalDev 
        ? "ws://127.0.0.1:8001/ws/leads" 
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/leads`;
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "new_lead_detected" || msg.type === "lead_status_updated") {
            fetchBackendLeads();
          }
          if (msg.type === "pipeline_created" || msg.type === "pipeline_updated" || msg.type === "pipeline_deleted") {
            fetchBackendPipelines();
          }
          if (msg.type === "ai_progress" && msg.message) {
            if (msg.message.startsWith('Ошибка ИИ-поиска:')) {
              setAiError(msg.message);
              setAiProgressMessage('');
            } else setAiProgressMessage(msg.message);
          }
        } catch (err) {}
      };
    } catch (err) {}

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Управление статусом лида
  const handleStatusChange = async (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => ({ ...prev, status: newStatus }));
    }

    try {
      await fetch(`${API_BASE}/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {}
  };

  // Управление заметками
  const handleSaveNote = async (leadId, noteText) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: noteText } : l));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => ({ ...prev, notes: noteText }));
    }

    try {
      await fetch(`${API_BASE}/api/leads/${leadId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText })
      });
    } catch (err) {}
  };

  // Сканирование ИИ
  const handleAiHunt = async () => {
    if (isAiHunting) return;
    setAiError('');
    setIsAiHunting(true);
    setAiProgressMessage("ИИ запускает поиск прямых B2B клиентов в интернете...");

    try {
      const data = await requestJson(`${API_BASE}/api/ai/hunt`, { method: "POST" });
      await fetchBackendLeads();
      setAiProgressMessage(data.message || "ИИ-поиск завершен.");
      setTimeout(() => setAiProgressMessage(''), 8000);
    } catch (err) {
      console.warn("Ошибка ИИ-поиска:", err);
      setAiError(err.message);
      setAiProgressMessage('');
    } finally {
      setIsAiHunting(false);
    }
  };

  // Сквозной сбор по всем источникам (ЕИС Закупки + Habr Design + AI Web Hunter)
  const handleFullScan = async () => {
    if (isScanningAll) return;
    setAiError('');
    setIsScanningAll(true);
    setAiProgressMessage("ИИ запускает поиск прямых заказов и кампаний брендов (Exa & Tavily)...");

    try {
      const data = await requestJson(`${API_BASE}/api/scan`, { method: "POST" });
      await fetchBackendLeads();
      setAiProgressMessage(data.message || `Сквозной сбор завершен! Найдено ${data.new_leads_found || 0} новых лидов.`);
      setTimeout(() => setAiProgressMessage(''), 8000);
    } catch (err) {
      console.warn("Ошибка сквозного сканирования:", err);
      setAiError(err.message);
      setAiProgressMessage('');
    } finally {
      setIsScanningAll(false);
    }
  };

  // Управление пайплайнами (синхронизация с бэкенд API)
  const handleTogglePipelineStatus = async (pipeId) => {
    try {
      await requestJson(`${API_BASE}/api/pipelines/${pipeId}/status`, { method: "PATCH" });
      await fetchBackendPipelines();
    } catch (err) { setBackendError(err.message); }
  };

  const handleRunPipeline = async (pipeId) => {
    const pipe = pipelines.find(p => p.id === pipeId);
    setAiProgressMessage(`Запуск пайплайна «${pipe?.name || ''}»...`);
    try {
      await requestJson(`${API_BASE}/api/pipelines/${pipeId}/run`, { method: "POST" });
      await fetchBackendPipelines();
      await handleAiHunt();
    } catch (err) { setBackendError(err.message); }
  };

  const handleDeletePipeline = async (pipeId) => {
    if (confirm("Вы уверены, что хотите удалить эту стратегию поиска?")) {
      try {
        await requestJson(`${API_BASE}/api/pipelines/${pipeId}`, { method: "DELETE" });
        await fetchBackendPipelines();
      } catch (err) { setBackendError(err.message); }
    }
  };

  const handleDuplicatePipeline = async (pipeId) => {
    try {
      await requestJson(`${API_BASE}/api/pipelines/${pipeId}/duplicate`, { method: "POST" });
      await fetchBackendPipelines();
    } catch (err) { setBackendError(err.message); }
  };

  const handleSaveNewPipeline = async (newPipe) => {
    try {
      await requestJson(`${API_BASE}/api/pipelines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPipe)
      });
      await fetchBackendPipelines();
    } catch (err) { setBackendError(err.message); return; }

    setAiProgressMessage(`Пайплайн «${newPipe.name}» успешно создан и сохранен в БД!`);
    setTimeout(() => setAiProgressMessage(''), 6000);
  };

  // Фильтрация лидов для экрана "Лиды"
  const filteredLeads = leads.filter(lead => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        lead.company.toLowerCase().includes(q) ||
        lead.contactName.toLowerCase().includes(q) ||
        lead.requestText.toLowerCase().includes(q) ||
        (lead.phone && lead.phone.includes(q)) ||
        lead.industry.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filterStatus === 'in_progress') {
      if (lead.status !== 'in_progress' && lead.status !== 'called' && lead.status !== 'negotiation') {
        return false;
      }
    } else if (filterStatus === 'closed') {
      if (lead.status !== 'closed') {
        return false;
      }
    }

    if (selectedIndustry !== "Все сферы" && selectedIndustry !== "Все 7 сфер" && lead.industry !== selectedIndustry) {
      return false;
    }

    if (selectedService !== "Все услуги" && lead.service !== selectedService) {
      return false;
    }

    if (onlyWithPhone && !lead.phone) {
      return false;
    }

    if (leadTypeFilter === 'order' && lead.leadType !== 'order') {
      return false;
    }

    if (leadTypeFilter === 'signal' && lead.leadType === 'order') {
      return false;
    }

    return true;
  });

  const phoneLeadsCount = leads.filter(l => Boolean(l.phone)).length;
  const inProgressCount = leads.filter(l => ['in_progress', 'called', 'negotiation'].includes(l.status)).length;
  const ordersCount = leads.filter(l => l.leadType === 'order').length;
  const signalsCount = leads.filter(l => l.leadType !== 'order').length;

  return (
    <div className="app-container">
      {/* Sidebar с полной навигацией по ТЗ */}
      <Sidebar 
        activeView={activeView}
        setActiveView={setActiveView}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onlyWithPhone={onlyWithPhone}
        setOnlyWithPhone={setOnlyWithPhone}
        leadsCount={leads.length}
        phoneLeadsCount={phoneLeadsCount}
        inProgressCount={inProgressCount}
        pipelinesCount={pipelines.length}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header 
          activeView={activeView}
          setActiveView={setActiveView}
          onFullScan={handleFullScan}
          isScanningAll={isScanningAll}
          leadsCount={leads.length}
          aiProgressMessage={aiProgressMessage}
        />

        <div className="content-body">
          {(aiError || backendError) && <div role="alert" style={{ padding: 18, marginBottom: 20, border: '1px solid #fda29b', background: '#fff4f2', color: '#b42318', borderRadius: 8 }}>
            <strong>{aiError ? 'Поиск не завершён — это ошибка, а не нулевая выдача.' : 'Нет связи с данными backend.'}</strong>
            <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{aiError || backendError}</p>
            {aiError && <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => setActiveView('settings')}>Настроить и проверить AI</button>}
          </div>}
          {isLoading && <p role="status">Загрузка базы…</p>}
          {storageInfo?.hidden_by_policy > 0 && <div style={{ padding: 16, marginBottom: 20, background: '#fffaeb', border: '1px solid #fedf89', borderRadius: 8 }}>
            В базе сохранено {storageInfo.stored_total} записей. Из них {storageInfo.hidden_by_policy} не соответствуют текущим источникам или правилам и скрыты; данные не удалены. Показано подходящих записей: {leads.length}.
          </div>}
          {/* 1. ЭКРАН "ОБЗОР" (Раздел 13.3 ТЗ) */}
          {activeView === 'overview' && (
            <OverviewView 
              leads={leads}
              pipelines={pipelines}
              onNavigateToLeads={() => setActiveView('leads')}
              onNavigateToPipelines={() => setActiveView('pipelines')}
              onSelectLead={setSelectedLead}
              onCreatePipeline={() => setIsPipelineBuilderOpen(true)}
            />
          )}

          {/* 2. ЭКРАН "ПАЙПЛАЙНЫ" (Раздел 13.4 ТЗ) */}
          {activeView === 'pipelines' && (
            <PipelinesView 
              pipelines={pipelines}
              onTogglePipelineStatus={handleTogglePipelineStatus}
              onRunPipeline={handleRunPipeline}
              onDeletePipeline={handleDeletePipeline}
              onDuplicatePipeline={handleDuplicatePipeline}
              onCreatePipeline={() => setIsPipelineBuilderOpen(true)}
            />
          )}

          {/* 3. ЭКРАН "ЛИДЫ" (Раздел 9 и 13.7 ТЗ) */}
          {activeView === 'leads' && (
            <>
              <StatsCards leads={leads} />
              <LeadTable 
                leads={filteredLeads}
                totalCount={leads.length}
                onSelectLead={setSelectedLead}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedIndustry={selectedIndustry}
                setSelectedIndustry={setSelectedIndustry}
                selectedService={selectedService}
                setSelectedService={setSelectedService}
                onlyWithPhone={onlyWithPhone}
                setOnlyWithPhone={setOnlyWithPhone}
                leadTypeFilter={leadTypeFilter}
                setLeadTypeFilter={setLeadTypeFilter}
                ordersCount={ordersCount}
                signalsCount={signalsCount}
                onStatusChange={handleStatusChange}
              />
            </>
          )}

          {/* 4. ЭКРАН "КАТАЛОГ СИГНАЛОВ" (Раздел 4 и 13.6 ТЗ) */}
          {activeView === 'signals' && (
            <SignalsView 
              onCreatePipeline={() => setIsPipelineBuilderOpen(true)}
            />
          )}

          {/* 5. ЭКРАН "ИСТОЧНИКИ ДАННЫХ" (Раздел 5 и 13.8 ТЗ) */}
          {activeView === 'sources' && (
            <SourcesView 
              onAiHunt={handleAiHunt}
              isAiHunting={isAiHunting}
              onFullScan={handleFullScan}
              isScanningAll={isScanningAll}
            />
          )}

          {/* 6. ЭКРАН "НАСТРОЙКИ" (Раздел 13.2 и 16 ТЗ) */}
          {activeView === 'settings' && (
            <SettingsView />
          )}
        </div>
      </div>

      {/* Модальное окно создания пайплайна (5 шагов по Разделу 3.1 ТЗ) */}
      <PipelineBuilderModal 
        isOpen={isPipelineBuilderOpen}
        onClose={() => setIsPipelineBuilderOpen(false)}
        onSavePipeline={handleSaveNewPipeline}
      />

      {/* Карточка компании (Lead Drawer, Раздел 8 ТЗ) */}
      {selectedLead && (
        <LeadDrawer 
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
          onSaveNote={handleSaveNote}
        />
      )}
    </div>
  );
}
