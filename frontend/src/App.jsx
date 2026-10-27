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
import { getSavedPipelines, savePipelines } from './data/pipelinesData';

const API_BASE = "http://127.0.0.1:8001";

export default function App() {
  const [activeView, setActiveView] = useState('leads'); // 'overview' | 'pipelines' | 'leads' | 'signals' | 'sources' | 'settings'
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Пайплайны
  const [pipelines, setPipelines] = useState(() => getSavedPipelines());
  const [isPipelineBuilderOpen, setIsPipelineBuilderOpen] = useState(false);

  // Фильтры лидов
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'in_progress' | 'closed'
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState('Все сферы');
  const [selectedService, setSelectedService] = useState('Все услуги');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyWithPhone, setOnlyWithPhone] = useState(false);

  // Статусы сканеров
  const [isAiHunting, setIsAiHunting] = useState(false);
  const [isHhScanning, setIsHhScanning] = useState(false);
  const [isTgScanning, setIsTgScanning] = useState(false);
  const [aiProgressMessage, setAiProgressMessage] = useState('');

  // Загрузка лидов с бэкенда
  const fetchBackendLeads = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads`);
      if (res.ok) {
        const data = await res.json();
        const formatted = data
          .filter(item => !item.id.startsWith('lead-'))
          .map(item => ({
            id: item.id,
            company: item.company,
            industry: item.industry,
            service: item.service,
            contactName: item.contact_name,
            role: item.role,
            phone: item.phone,
            telegram: item.telegram,
            source: item.source,
            sourceType: item.source_type,
            budget: item.budget,
            score: item.score,
            verifiedDirect: item.verified_direct,
            requestText: item.request_text,
            suggestedSolution: item.suggested_solution,
            status: item.status,
            notes: item.notes,
            url: item.url,
            title: item.title,
            date: item.created_at ? item.created_at.replace('T', ' ').slice(0, 16) : ""
          }));
        setLeads(formatted);
      }
    } catch (e) {
      console.warn("Бэкенд пока не ответил:", e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem('studioradar_leads');
    } catch (e) {}

    fetchBackendLeads();

    // WebSocket для моментального реалтайм обновления
    let ws;
    try {
      ws = new WebSocket("ws://127.0.0.1:8001/ws/leads");
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "new_lead_detected" || msg.type === "lead_status_updated") {
            fetchBackendLeads();
          }
          if (msg.type === "ai_progress" && msg.message) {
            setAiProgressMessage(msg.message);
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
    setIsAiHunting(true);
    setAiProgressMessage("ИИ запускает поиск прямых B2B клиентов в интернете...");

    try {
      const res = await fetch(`${API_BASE}/api/ai/hunt`, { method: "POST" });
      const data = await res.json();
      await fetchBackendLeads();
      setAiProgressMessage(data.message || "ИИ-поиск завершен.");
      setTimeout(() => setAiProgressMessage(''), 8000);
    } catch (err) {
      console.warn("Ошибка ИИ-поиска:", err);
      setAiProgressMessage("Сбой связи при ИИ-поиске");
      setTimeout(() => setAiProgressMessage(''), 5000);
    } finally {
      setIsAiHunting(false);
    }
  };

  // Сканирование HeadHunter
  const handleHhScan = async () => {
    if (isHhScanning) return;
    setIsHhScanning(true);
    setAiProgressMessage("Сканирование проектных заказов на hh.ru...");

    try {
      const res = await fetch(`${API_BASE}/api/scan/hh`, { method: "POST" });
      const data = await res.json();
      await fetchBackendLeads();
      setAiProgressMessage(data.message || "Сбор с HH.ru завершен.");
      setTimeout(() => setAiProgressMessage(''), 6000);
    } catch (err) {
      console.warn("Ошибка сканирования HH:", err);
      setAiProgressMessage("Ошибка при сборе с hh.ru");
      setTimeout(() => setAiProgressMessage(''), 5000);
    } finally {
      setIsHhScanning(false);
    }
  };

  // Сканирование Telegram
  const handleTgScan = async () => {
    if (isTgScanning) return;
    setIsTgScanning(true);
    setAiProgressMessage("Сканирование CG и дизайн Telegram каналов...");

    try {
      const res = await fetch(`${API_BASE}/api/scan/telegram`, { method: "POST" });
      const data = await res.json();
      await fetchBackendLeads();
      setAiProgressMessage(data.message || "Сбор из Telegram завершен.");
      setTimeout(() => setAiProgressMessage(''), 6000);
    } catch (err) {
      console.warn("Ошибка сканирования TG:", err);
      setAiProgressMessage("Ошибка при сборе из Telegram");
      setTimeout(() => setAiProgressMessage(''), 5000);
    } finally {
      setIsTgScanning(false);
    }
  };

  // Управление пайплайнами
  const handleTogglePipelineStatus = (pipeId) => {
    setPipelines(prev => {
      const updated = prev.map(p => {
        if (p.id === pipeId) {
          const nextStatus = p.status === 'active' ? 'paused' : 'active';
          return { ...p, status: nextStatus };
        }
        return p;
      });
      savePipelines(updated);
      return updated;
    });
  };

  const handleRunPipeline = (pipeId) => {
    const pipe = pipelines.find(p => p.id === pipeId);
    setAiProgressMessage(`Запущен пайплайн «${pipe?.name || ''}»...`);
    handleAiHunt();
  };

  const handleDeletePipeline = (pipeId) => {
    if (confirm("Вы уверены, что хотите удалить эту стратегию поиска?")) {
      setPipelines(prev => {
        const updated = prev.filter(p => p.id !== pipeId);
        savePipelines(updated);
        return updated;
      });
    }
  };

  const handleDuplicatePipeline = (pipeId) => {
    const pipe = pipelines.find(p => p.id === pipeId);
    if (!pipe) return;
    const duplicated = {
      ...pipe,
      id: `pipe_${Date.now()}`,
      name: `${pipe.name} (Копия)`,
      lastRunAt: "Еще не запускался"
    };
    setPipelines(prev => {
      const updated = [duplicated, ...prev];
      savePipelines(updated);
      return updated;
    });
  };

  const handleSaveNewPipeline = (newPipe) => {
    setPipelines(prev => {
      const updated = [newPipe, ...prev];
      savePipelines(updated);
      return updated;
    });
    setAiProgressMessage(`Пайплайн «${newPipe.name}» успешно создан и активирован!`);
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

    return true;
  });

  const phoneLeadsCount = leads.filter(l => Boolean(l.phone)).length;
  const inProgressCount = leads.filter(l => ['in_progress', 'called', 'negotiation'].includes(l.status)).length;

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
          onAiHunt={handleAiHunt}
          isAiHunting={isAiHunting}
          onHhScan={handleHhScan}
          isHhScanning={isHhScanning}
          onTgScan={handleTgScan}
          isTgScanning={isTgScanning}
          leadsCount={leads.length}
          aiProgressMessage={aiProgressMessage}
        />

        <div className="content-body">
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
                onSelectLead={setSelectedLead}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedIndustry={selectedIndustry}
                setSelectedIndustry={setSelectedIndustry}
                selectedService={selectedService}
                setSelectedService={setSelectedService}
                onlyWithPhone={onlyWithPhone}
                setOnlyWithPhone={setOnlyWithPhone}
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
              onHhScan={handleHhScan}
              isHhScanning={isHhScanning}
              onTgScan={handleTgScan}
              isTgScanning={isTgScanning}
              onAiHunt={handleAiHunt}
              isAiHunting={isAiHunting}
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
