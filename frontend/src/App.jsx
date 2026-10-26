import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import LeadTable from './components/LeadTable';
import LeadDrawer from './components/LeadDrawer';

const API_BASE = "http://127.0.0.1:8001";

export default function App() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'in_progress' | 'closed'
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState('Все сферы');
  const [selectedService, setSelectedService] = useState('Все услуги');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyWithPhone, setOnlyWithPhone] = useState(false);
  const [isAiHunting, setIsAiHunting] = useState(false);
  const [isHhScanning, setIsHhScanning] = useState(false);
  const [aiProgressMessage, setAiProgressMessage] = useState('');

  // Функция загрузки лидов с бэкенда
  const fetchBackendLeads = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads`);
      if (res.ok) {
        const data = await res.json();
        // Берем строго реальные лиды с hh или tg
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
    // Принудительно очищаем старый кэш браузера от демо-лидов
    try {
      localStorage.removeItem('studioradar_leads');
    } catch (e) {}

    fetchBackendLeads();

    // Подключение WebSocket для моментального реалтайм обновления
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

  // Handle Status Update
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

  // Handle Note Update
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

  // 1. Автономный поиск заказов через ИИ-Ассистента (Gemini + Web)
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

  // 2. Сбор вакансий-проектов с HeadHunter
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

  // Filtered Leads
  const filteredLeads = leads.filter(lead => {
    // Search
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

    // Status filter
    if (filterStatus === 'in_progress') {
      if (lead.status !== 'in_progress' && lead.status !== 'called' && lead.status !== 'negotiation') {
        return false;
      }
    } else if (filterStatus === 'closed') {
      if (lead.status !== 'closed') {
        return false;
      }
    }

    // Industry
    if (selectedIndustry !== "Все сферы" && selectedIndustry !== "Все 7 сфер" && lead.industry !== selectedIndustry) {
      return false;
    }

    // Service
    if (selectedService !== "Все услуги" && lead.service !== selectedService) {
      return false;
    }

    // Phone filter
    if (onlyWithPhone && !lead.phone) {
      return false;
    }

    return true;
  });

  const phoneLeadsCount = leads.filter(l => l.phone).length;
  const inProgressCount = leads.filter(l => l.status === 'in_progress' || l.status === 'called' || l.status === 'negotiation').length;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar 
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onlyWithPhone={onlyWithPhone}
        setOnlyWithPhone={setOnlyWithPhone}
        leadsCount={leads.length}
        phoneLeadsCount={phoneLeadsCount}
        inProgressCount={inProgressCount}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header 
          onAiHunt={handleAiHunt}
          isAiHunting={isAiHunting}
          onHhScan={handleHhScan}
          isHhScanning={isHhScanning}
          leadsCount={leads.length}
          aiProgressMessage={aiProgressMessage}
        />

        <div className="content-body">
          {/* Stats Overview */}
          <StatsCards leads={leads} />

          {/* Table with Leads */}
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
        </div>
      </div>

      {/* Lead Detail Drawer */}
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
