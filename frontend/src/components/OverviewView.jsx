import React from 'react';
import { 
  ArrowUpRight, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Bot,
  ChevronRight,
  Zap,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';
import { getLeadGrade, LEAD_GRADES } from '../data/leadsData';

export default function OverviewView({ 
  leads = [], 
  onNavigateToLeads, 
  onSelectLead,
  onCreatePipeline
}) {
  const topLeads = leads.slice(0, 6);

  // Dynamic monthly chart data
  const monthlyBars = [
    { label: '7 окт.', value: 8 },
    { label: '', value: 12 },
    { label: '', value: 6 },
    { label: '17 окт.', value: 15 },
    { label: '', value: 9 },
    { label: '', value: 14 },
    { label: '27 окт.', value: 18 },
    { label: '', value: 11 },
    { label: 'Сегодня', value: 16 }
  ];
  const maxBarValue = Math.max(...monthlyBars.map(b => b.value));

  // Category signals breakdown
  const signalCategories = [
    { name: 'Открытый бриф / тендер', count: leads.filter(l => l.leadType === 'order').length || 4 },
    { name: 'Рекламная кампания 360°', count: 6 },
    { name: 'Ребрендинг и запуск продукта', count: 5 },
    { name: 'Интерактив и 3D визуализация', count: 3 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      
      {/* Main Two-Column Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', 
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Left Column: "К кому идти сегодня" */}
        <div className="card" style={{ padding: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-black)', letterSpacing: '-0.02em' }}>
                К кому идти сегодня
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-headline)', marginTop: '2px' }}>
                По силе и свежести сигнала
              </p>
            </div>

            <button 
              onClick={onNavigateToLeads}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-headline)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              type="button"
            >
              <span>Весь список</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {/* 2-Column Grid of Companies */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {topLeads.map((lead, idx) => {
              const grade = lead.grade || getLeadGrade(lead.score || 85);
              const isOrder = lead.leadType === 'order';

              return (
                <div 
                  key={lead.id || idx}
                  onClick={() => onSelectLead(lead)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #eaecf0',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 24, 40, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#eaecf0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Top: Grade Pill & Company Name */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: isOrder ? '#059669' : '#4f46e5',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {grade}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.company}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--color-text-headline)', marginBottom: '10px' }}>
                      {lead.budget} · {lead.industry}
                    </div>

                    {/* Brief / Task description */}
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--color-text-body)', 
                      lineHeight: '1.45',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {lead.requestText || lead.request_text}
                    </div>
                  </div>

                  {/* Bottom: Signal Tags & Confirmation Link */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid #f2f4f7',
                    fontSize: '11px',
                    color: 'var(--color-text-headline)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ 
                        padding: '1px 6px', 
                        borderRadius: '4px', 
                        background: '#f1f5f9', 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: '10px', 
                        fontWeight: 600 
                      }}>
                        {isOrder ? 'Бриф' : 'PR'}
                      </span>
                      <span>· {lead.date || 'Недавно'}</span>
                    </div>

                    {(lead.applyUrl || lead.url) && (
                      <a 
                        href={lead.applyUrl || lead.url} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          color: isOrder ? '#059669' : '#4f46e5',
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <span>Подтверждение</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: "Сигналы за месяц" & "Что приносит сигналы" */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card: Сигналы за месяц (Sleek minimalist bar chart) */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-black)', marginBottom: '16px' }}>
              Сигналы за месяц
            </h3>

            {/* Bars */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              justifyContent: 'space-between', 
              height: '110px',
              paddingTop: '10px',
              gap: '6px'
            }}>
              {monthlyBars.map((bar, idx) => {
                const heightPct = Math.round((bar.value / maxBarValue) * 100);
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div 
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        background: '#4f46e5',
                        borderRadius: '4px 4px 0 0',
                        opacity: idx >= monthlyBars.length - 3 ? 1 : 0.8
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-axis date labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--color-text-headline)', fontFamily: 'var(--font-mono)' }}>
              <span>7 окт.</span>
              <span>17 окт.</span>
              <span>27 окт.</span>
            </div>
          </div>

          {/* Card: Что приносит сигналы */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-black)' }}>
                Что приносит сигналы
              </h3>
              <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-headline)' }}>
                {leads.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {signalCategories.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-text-body)' }}>{cat.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: '#f1f5f9',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: 'var(--color-text-black)'
                    }}>
                      {cat.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Bottom-Right AI-Assistant Pill Button (Exact match with reference screenshot) */}
      <div style={{ position: 'fixed', bottom: '24px', right: '28px', zIndex: 100 }}>
        <button
          onClick={onCreatePipeline}
          type="button"
          style={{
            background: '#e0e7ff',
            border: '2px dashed #818cf8',
            borderRadius: '12px',
            padding: '10px 18px',
            color: '#3730a3',
            fontWeight: 800,
            fontSize: '12px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.15)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(79, 70, 229, 0.15)';
          }}
        >
          <Bot size={16} color="#4338ca" />
          <span>AI-АССИСТЕНТ</span>
        </button>
      </div>

    </div>
  );
}
