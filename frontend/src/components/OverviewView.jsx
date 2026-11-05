import React from 'react';
import { 
  ArrowUpRight, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  Zap,
  Building2,
  Calendar,
  Layers,
  BarChart3,
  TrendingUp,
  Target,
  User,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { getLeadGrade, LEAD_GRADES } from '../data/leadsData';

export default function OverviewView({ 
  leads = [], 
  onNavigateToLeads, 
  onSelectLead,
  onCreatePipeline
}) {
  const topLeads = leads.slice(0, 6);

  // Dynamic weekly/monthly trend
  const weeklyTrends = [
    { label: 'Пн', value: 8 },
    { label: 'Вт', value: 14 },
    { label: 'Ср', value: 11 },
    { label: 'Чт', value: 19 },
    { label: 'Пт', value: 16 },
    { label: 'Сб', value: 7 },
    { label: 'Вс', value: 12 }
  ];
  const maxTrendValue = Math.max(...weeklyTrends.map(b => b.value));

  // Service demand structure
  const serviceDistribution = [
    { name: '3D моушн-дизайн и анимация', share: '45%', count: 9 },
    { name: 'CGI графика для рекламных кампаний', share: '30%', count: 6 },
    { name: 'Презентационные 3D фильмы девелоперов', share: '15%', count: 3 },
    { name: '2D эксплейнеры и моушн-графика', share: '10%', count: 2 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 2-Column Market Intelligence Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', 
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Left: Recommended High-Priority Outreach Targets */}
        <div className="card" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} color="#4f46e5" />
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
                  Рекомендованные цели для первого контакта
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Компании с подтвержденным бюджетом и высокой вероятностью контракта
              </p>
            </div>

            <button 
              onClick={onNavigateToLeads}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#4f46e5',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              type="button"
            >
              <span>Все лиды ({leads.length})</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          {/* 2-Column Grid of Target Cards */}
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
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.16s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 23, 42, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Top: Grade Pill & Company Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: isOrder ? '#ecfdf5' : '#eef2ff',
                          color: isOrder ? '#065f46' : '#4f46e5',
                          border: `1px solid ${isOrder ? '#a7f3d0' : '#c7d2fe'}`,
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {grade}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                          {lead.company}
                        </span>
                      </div>

                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                        {lead.budget}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                      {lead.industry}
                    </div>

                    {/* Brief snippet */}
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#334155', 
                      lineHeight: '1.45',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      "{lead.requestText || lead.request_text}"
                    </div>
                  </div>

                  {/* Bottom: Contact LPR & Action */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid #f1f5f9',
                    fontSize: '11px',
                    color: '#64748b'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} color="#64748b" />
                      <span>{lead.contactName}</span>
                    </div>

                    <span style={{ 
                      color: '#4f46e5', 
                      fontWeight: 600, 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '2px' 
                    }}>
                      <span>В досье</span>
                      <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Analytics & Market Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card: Динамика появления заказов */}
          <div className="card" style={{ padding: '22px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={16} color="#4f46e5" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Динамика спроса за 7 дней
                </h3>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
                +24% приток
              </span>
            </div>

            {/* Bars */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              justifyContent: 'space-between', 
              height: '110px',
              paddingTop: '10px',
              gap: '8px'
            }}>
              {weeklyTrends.map((bar, idx) => {
                const heightPct = Math.round((bar.value / maxTrendValue) * 100);
                const isToday = idx === weeklyTrends.length - 1;

                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '6px' }}>
                    <div 
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        background: isToday ? '#4f46e5' : '#e2e8f0',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease'
                      }}
                      title={`${bar.label}: ${bar.value} лидов`}
                    />
                    <span style={{ fontSize: '10px', color: isToday ? '#4f46e5' : '#94a3b8', fontWeight: isToday ? 700 : 500, fontFamily: 'var(--font-mono)' }}>
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Структура спроса по услугам студии */}
          <div className="card" style={{ padding: '22px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="#4f46e5" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Спрос по направлениям
                </h3>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                Всего: {leads.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {serviceDistribution.map((serv, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#334155', fontWeight: 500 }}>{serv.name}</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                      {serv.share}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: serv.share, height: '100%', background: '#4f46e5', borderRadius: '9999px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Quick Launch Pipeline Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
        border: '1px solid #e0e7ff',
        borderRadius: '12px',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)'
          }}>
            <Sparkles size={18} color="#4f46e5" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Автоматизируйте поток лидов через персональный пайплайн
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Настройте фильтры по бюджету, нишам и триггерам, и ИИ будет мониторить сеть 24/7.
            </div>
          </div>
        </div>

        <button
          onClick={onCreatePipeline}
          className="btn btn-primary"
          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
          type="button"
        >
          <Sparkles size={14} />
          <span>Создать пайплайн</span>
        </button>
      </div>

    </div>
  );
}
