import React from 'react';
import { 
  Building2, 
  Sparkles, 
  PhoneCall, 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  Search, 
  Activity,
  ArrowUpRight,
  Filter,
  FileText,
  Globe
} from 'lucide-react';
import { TARGET_INDUSTRIES, getLeadGrade, LEAD_GRADES } from '../data/leadsData';

export default function OverviewView({ 
  leads = [], 
  pipelines = [], 
  onNavigateToLeads, 
  onNavigateToPipelines, 
  onSelectLead,
  onCreatePipeline
}) {
  const totalLeads = leads.length;
  const withPhone = leads.filter(l => Boolean(l.phone)).length;
  const highPriorityCount = leads.filter(l => (l.score || 0) >= 75).length;
  const inProgressCount = leads.filter(l => ['in_progress', 'called', 'negotiation'].includes(l.status)).length;
  const activePipelines = pipelines.filter(p => p.status === 'active').length;

  // Распределение лидов по отраслям
  const industryCounts = TARGET_INDUSTRIES.filter(ind => ind !== "Все сферы").map(ind => {
    const count = leads.filter(l => l.industry === ind).length;
    return { industry: ind, count };
  }).sort((a, b) => b.count - a.count);

  // Последние события
  const recentEvents = leads.slice(0, 6);

  // Дневная динамика сигналов (эмуляция за последние 7 дней на основе данных)
  const days = [
    { day: 'Пн', count: Math.max(2, Math.round(totalLeads * 0.12)) },
    { day: 'Вт', count: Math.max(4, Math.round(totalLeads * 0.18)) },
    { day: 'Ср', count: Math.max(3, Math.round(totalLeads * 0.15)) },
    { day: 'Чт', count: Math.max(6, Math.round(totalLeads * 0.22)) },
    { day: 'Пт', count: Math.max(5, Math.round(totalLeads * 0.19)) },
    { day: 'Сб', count: Math.max(1, Math.round(totalLeads * 0.08)) },
    { day: 'Вс', count: Math.max(2, Math.round(totalLeads * 0.06)) }
  ];
  const maxDayCount = Math.max(...days.map(d => d.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Title & Quick Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-black)', letterSpacing: '-0.02em' }}>
            Обзор мониторинга рынка
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-headline)', marginTop: '2px' }}>
            Сводная аналитика спроса на услуги 3D/2D моушн-дизайна и интерактивных решений
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={onCreatePipeline}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={15} />
            <span>Новый пайплайн</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Раздел 13.3 ТЗ) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="card stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-headline)' }}>Всего компаний</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'var(--color-surface-beige-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} color="var(--color-accent-purple)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-black)', marginTop: '6px', letterSpacing: '-0.03em' }}>
            {totalLeads}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-accent-purple)', marginTop: '4px', fontWeight: 600 }}>
            в постоянном мониторинге
          </div>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-headline)' }}>С прямым телефоном</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'var(--accent-emerald-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneCall size={16} color="var(--color-accent-green-text)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-black)', marginTop: '6px', letterSpacing: '-0.03em' }}>
            {withPhone} <span style={{ fontSize: '13px', color: 'var(--color-text-headline)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>({totalLeads ? Math.round((withPhone / totalLeads) * 100) : 0}%)</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-accent-green-text)', marginTop: '4px', fontWeight: 600 }}>
            готовы к звонку
          </div>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-headline)' }}>Высокий приоритет (A/A+)</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#f3effb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} color="var(--color-accent-purple)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-black)', marginTop: '6px', letterSpacing: '-0.03em' }}>
            {highPriorityCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-accent-purple)', marginTop: '4px', fontWeight: 600 }}>
            score ≥ 75%
          </div>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-headline)' }}>В работе менеджера</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'var(--accent-amber-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="var(--accent-amber-text)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-black)', marginTop: '6px', letterSpacing: '-0.03em' }}>
            {inProgressCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-amber-text)', marginTop: '4px', fontWeight: 600 }}>
            переговоры и КП
          </div>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-headline)' }}>Активные пайплайны</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'var(--color-surface-beige-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={16} color="var(--color-accent-purple)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-black)', marginTop: '6px', letterSpacing: '-0.03em' }}>
            {activePipelines} / {pipelines.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-accent-purple)', marginTop: '4px', fontWeight: 600 }}>
            стратегий поиска
          </div>
        </div>
      </div>

      {/* Main Grid: Signals Dynamics & Industry Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Dynamic Signals Activity Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-black)' }}>
                Динамика обнаружения сигналов
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-headline)' }}>
                Количество новых B2B-событий за последние 7 дней
              </div>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent-purple)', background: 'var(--color-surface-beige-3)', padding: '4px 10px', borderRadius: '4px' }}>
              Норма 10–30 / день
            </span>
          </div>

          {/* Simple Clean Bar Chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', paddingTop: '20px', gap: '8px' }}>
            {days.map((item, idx) => {
              const heightPct = Math.round((item.count / maxDayCount) * 100);
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-black)' }}>
                    {item.count}
                  </span>
                  <div style={{ width: '100%', height: '90px', display: 'flex', alignItems: 'flex-end', background: 'var(--color-surface-beige-2)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: '100%', 
                        height: `${Math.max(10, heightPct)}%`, 
                        background: idx === days.length - 1 ? 'var(--color-accent-purple)' : 'var(--color-accent-lavender)',
                        borderRadius: '4px',
                        transition: 'height 0.3s ease'
                      }} 
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-headline)', fontWeight: 600 }}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7 Target Spheres Breakdown */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-black)' }}>
                Распределение по 7 целевым сферам
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-headline)' }}>
                Сферы из таблицы заказчика + B2B-агентства
              </div>
            </div>
            <button 
              onClick={onNavigateToLeads}
              style={{ background: 'none', border: 'none', color: 'var(--color-accent-purple)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              Все лиды <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {industryCounts.slice(0, 5).map((item, idx) => {
              const pct = totalLeads ? Math.round((item.count / totalLeads) * 100) : 0;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-black)' }}>{item.industry}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-headline)' }}>{item.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: 'var(--color-surface-beige-3)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-accent-purple)', borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity Feed & Data Sources Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Recent Signals Live Feed */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent-green)' }} className="pulse" />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-black)' }}>
                Лента последних сигналов
              </div>
            </div>
            <button 
              onClick={onNavigateToLeads}
              style={{ background: 'none', border: 'none', color: 'var(--color-accent-purple)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Смотреть все ({totalLeads})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentEvents.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-headline)', fontSize: '13px' }}>
                Пока нет обнаруженных событий. Запустите сбор данных.
              </div>
            ) : (
              recentEvents.map((lead) => {
                const grade = getLeadGrade(lead.score);
                const gradeMeta = LEAD_GRADES[grade];
                return (
                  <div 
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      background: 'var(--color-surface-beige-1)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface-beige-1)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <span 
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: gradeMeta.badgeBg,
                          color: gradeMeta.badgeText,
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {grade}
                      </span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {lead.company}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-headline)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {lead.service} • {lead.industry}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '90px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-headline)', fontFamily: 'var(--font-mono)' }}>
                        {lead.date ? lead.date.slice(5, 16) : 'Сегодня'}
                      </div>
                      <div style={{ fontSize: '11px', color: lead.phone ? 'var(--color-accent-green-text)' : 'var(--color-text-headline)', fontWeight: 600 }}>
                        {lead.phone ? '📞 С телефоном' : 'В поиске'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Data Sources Health Status (Раздел 5 и 13.3 ТЗ) */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-black)' }}>
              Состояние источников данных
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-headline)', fontFamily: 'var(--font-mono)' }}>
              3 источника подключено
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* ЕИС Закупки */}
            <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--color-surface-beige-1)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#e0e1f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} color="var(--color-accent-purple)" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)' }}>ЕИС Закупки (Тендеры)</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>44-ФЗ и 223-ФЗ коммерческие конкурсы</div>
                </div>
              </div>
              <span className="badge badge-verified" style={{ fontSize: '11px' }}>
                Онлайн
              </span>
            </div>

            {/* ИИ-Хантер (Web Search) */}
            <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--color-surface-beige-1)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--accent-emerald-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} color="var(--color-accent-green-text)" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)' }}>ИИ-Хантер (Web Search)</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>Автономный поиск в сети через LLM</div>
                </div>
              </div>
              <span className="badge badge-verified" style={{ fontSize: '11px' }}>
                Активен
              </span>
            </div>

            {/* Habr Design */}
            <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--color-surface-beige-1)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--color-surface-beige-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={16} color="var(--color-accent-purple)" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)' }}>Habr Design & Медиа</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>Кейсы компаний и анонсы редизайнов</div>
                </div>
              </div>
              <span className="badge badge-verified" style={{ fontSize: '11px' }}>
                Онлайн
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
