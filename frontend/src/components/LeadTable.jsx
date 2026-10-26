import React from 'react';
import { 
  Phone, 
  Send, 
  ExternalLink, 
  Search, 
  Filter, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle,
  Building2,
  User,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { TARGET_INDUSTRIES, TARGET_SERVICES, LEAD_STATUSES } from '../data/leadsData';

export default function LeadTable({ 
  leads, 
  onSelectLead, 
  searchQuery, 
  setSearchQuery, 
  selectedIndustry, 
  setSelectedIndustry, 
  selectedService, 
  setSelectedService,
  onlyWithPhone,
  setOnlyWithPhone,
  onStatusChange
}) {
  const getIndustryBadgeColor = (ind) => {
    switch (ind) {
      case "Продукты питания и напитки": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Военная промышленность": return "bg-red-50 text-red-700 border-red-200";
      case "Авто и мото индустрия": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Банки и финансы": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Газ и нефть": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Бьюти": return "bg-pink-50 text-pink-700 border-pink-200";
      case "Электротехника": return "bg-cyan-50 text-cyan-700 border-cyan-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Search & Filter Bar */}
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid var(--border-subtle)', 
        background: '#ffffff',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input 
            type="text" 
            placeholder="Поиск по компании, ЛПР, задаче или номеру..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-control"
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <select 
            value={selectedIndustry} 
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="input-control"
            style={{ cursor: 'pointer' }}
          >
            {TARGET_INDUSTRIES.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>

          <select 
            value={selectedService} 
            onChange={(e) => setSelectedService(e.target.value)}
            className="input-control"
            style={{ cursor: 'pointer' }}
          >
            {TARGET_SERVICES.map(srv => (
              <option key={srv} value={srv}>{srv}</option>
            ))}
          </select>

          <button
            onClick={() => setOnlyWithPhone(!onlyWithPhone)}
            className="btn"
            style={{
              background: onlyWithPhone ? 'var(--accent-emerald-subtle)' : '#ffffff',
              color: onlyWithPhone ? 'var(--accent-emerald-text)' : 'var(--text-secondary)',
              border: `1px solid ${onlyWithPhone ? 'var(--accent-emerald-border)' : 'var(--border-subtle)'}`
            }}
          >
            <PhoneCall size={14} />
            <span>Только с телефоном</span>
          </button>
        </div>
      </div>

      {/* Table view */}
      <div style={{ overflowX: 'auto' }}>
        <table className="leads-table">
          <thead>
            <tr>
              <th>Компания / Сфера</th>
              <th>Контактное лицо (ЛПР)</th>
              <th>Запрос и услуга</th>
              <th>Источник</th>
              <th>Бюджет</th>
              <th>Статус</th>
              <th style={{ textAlign: 'right' }}>Действие</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  По заданным фильтрам лидов не найдено. Попробуйте сбросить фильтры.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} onClick={() => onSelectLead(lead)}>
                  {/* Company & Industry */}
                  <td style={{ minWidth: '180px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={15} color="#7c3aed" />
                      <span>{lead.company}</span>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <span className={`badge ${getIndustryBadgeColor(lead.industry)}`} style={{ fontSize: '10px' }}>
                        {lead.industry}
                      </span>
                    </div>
                  </td>

                  {/* LPR & Phone / TG */}
                  <td style={{ minWidth: '200px' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} color="#64748b" />
                      <span>{lead.contactName}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {lead.role}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {lead.phone ? (
                        <a 
                          href={`tel:${lead.phone}`} 
                          className="btn btn-call"
                          style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}
                          title="Позвонить прямо сейчас"
                        >
                          <Phone size={11} />
                          <span>{lead.phone}</span>
                        </a>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Телефон в поиске</span>
                      )}

                      {lead.telegram && (
                        <a 
                          href={`https://t.me/${lead.telegram.replace('@', '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-tg"
                          style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}
                          title="Открыть диалог в Telegram"
                        >
                          <Send size={11} />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Request & Service */}
                  <td style={{ minWidth: '260px', maxWidth: '340px' }}>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#7c3aed', 
                      fontWeight: 700, 
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Sparkles size={12} />
                      <span>{lead.service}</span>
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)', 
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      "{lead.requestText}"
                    </div>
                  </td>

                  {/* Source */}
                  <td style={{ minWidth: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        color: lead.sourceType === 'ai_agent' ? '#6d28d9' : (lead.sourceType === 'hh' ? '#b45309' : '#0284c7'), 
                        fontWeight: 600,
                        background: lead.sourceType === 'ai_agent' ? '#ede9fe' : (lead.sourceType === 'hh' ? '#fef3c7' : '#f0f9ff'),
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        {lead.sourceType === 'ai_agent' && <Sparkles size={11} />}
                        {lead.source}
                      </span>
                      {lead.url && (
                        <a 
                          href={lead.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          onClick={(e) => e.stopPropagation()} 
                          style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center' }}
                          title="Открыть карточку заказа на источнике"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {lead.date}
                    </div>
                  </td>

                  {/* Budget */}
                  <td style={{ minWidth: '110px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                      {lead.budget}
                    </span>
                  </td>

                  {/* Status Dropdown */}
                  <td style={{ minWidth: '130px' }} onClick={(e) => e.stopPropagation()}>
                    <select
                      value={lead.status || 'new'}
                      onChange={(e) => onStatusChange(lead.id, e.target.value)}
                      style={{
                        fontSize: '11px', 
                        padding: '4px 8px', 
                        width: '100%', 
                        cursor: 'pointer',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff'
                      }}
                    >
                      {LEAD_STATUSES.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Action */}
                  <td style={{ textAlign: 'right', minWidth: '70px' }}>
                    <button 
                      onClick={() => onSelectLead(lead)}
                      style={{ 
                        background: '#f1f5f9', 
                        border: 'none', 
                        color: 'var(--text-secondary)', 
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '8px'
                      }}
                      title="Подробнее"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer bar */}
      <div style={{ 
        padding: '14px 20px', 
        borderTop: '1px solid #f1f5f9', 
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        <div>
          Отображено: <strong style={{ color: '#0f172a' }}>{leads.length}</strong> лидов из проверенных источников
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 500 }}>
          <ShieldCheck size={14} /> Все лиды прошли проверку на отсутствие субподряда студий
        </div>
      </div>
    </div>
  );
}
