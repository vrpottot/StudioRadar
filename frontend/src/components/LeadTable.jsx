import React from 'react';
import { 
  Phone, 
  ExternalLink, 
  Search, 
  Filter, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle,
  Building2,
  User,
  Sparkles,
  PhoneCall,
  Download,
  Send,
  Globe
} from 'lucide-react';
import { TARGET_INDUSTRIES, TARGET_SERVICES, LEAD_STATUSES, getLeadGrade, LEAD_GRADES } from '../data/leadsData';
import { exportLeadsToCsv } from '../utils/exportCsv';

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
      case "Продукты питания и напитки": return "bg-[#dceda9] text-[#243c10] border-[#c9dda0]";
      case "Военная промышленность": return "bg-[#fdf0e6] text-[#7b3306] border-[#f4e6d7]";
      case "Авто и мото индустрия": return "bg-[#f8f7f4] text-[#3b2a60] border-[#e8e5dc]";
      case "Банки и финансы": return "bg-[#e7eef6] text-[#1e3a5f] border-[#cde0f1]";
      case "Газ и нефть": return "bg-[#e0e1f7] text-[#3b2a60] border-[#d4c5f6]";
      case "Бьюти": return "bg-[#f6c9c0] text-[#6b0c26] border-[#f1b3a7]";
      case "Электротехника": return "bg-[#f3f1ec] text-[#131313] border-[#e5e2db]";
      case "Рекламные агентства и продакшн": return "bg-[#f3effb] text-[#3b2a60] border-[#d4c5f6]";
      default: return "bg-[#f8f7f4] text-[#4a4a4a] border-[#e5e2db]";
    }
  };

  const handleExport = () => {
    exportLeadsToCsv(leads, `studioradar_leads_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Search, Filter & Export Bar (Раздел 9 и 13.7 ТЗ) */}
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid var(--border-subtle)', 
        background: 'var(--color-surface-white)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
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

        {/* Filter Dropdowns & Export */}
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
            <span>С телефоном</span>
          </button>

          {/* Export to CSV Button (Раздел 9 и 17 ТЗ) */}
          <button
            onClick={handleExport}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            title="Экспортировать отфильтрованный список лидов в CSV / Excel"
          >
            <Download size={14} color="var(--color-accent-purple)" />
            <span>Экспорт CSV</span>
          </button>
        </div>
      </div>

      {/* Table view */}
      <div style={{ overflowX: 'auto' }}>
        <table className="leads-table">
          <thead>
            <tr>
              <th>Компания / Сфера</th>
              <th>Приоритет</th>
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
                <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  По заданным фильтрам лидов не найдено. Попробуйте сбросить фильтры.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const grade = getLeadGrade(lead.score);
                const gradeMeta = LEAD_GRADES[grade];

                return (
                  <tr key={lead.id} onClick={() => onSelectLead(lead)}>
                    {/* Company & Industry */}
                    <td style={{ minWidth: '170px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-black)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={15} color="var(--color-accent-purple)" />
                        <span>{lead.company}</span>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span className={`badge ${getIndustryBadgeColor(lead.industry)}`} style={{ fontSize: '10px' }}>
                          {lead.industry}
                        </span>
                      </div>
                    </td>

                    {/* Priority Grade (Раздел 7.4 ТЗ) */}
                    <td style={{ minWidth: '95px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span 
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: gradeMeta.badgeBg,
                            color: gradeMeta.badgeText,
                            border: `1px solid ${gradeMeta.badgeBorder}`,
                            fontFamily: 'var(--font-mono)'
                          }}
                          title={`Грейд ${grade}: ${gradeMeta.name}`}
                        >
                          {grade}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-headline)', fontWeight: 600 }}>
                          {lead.score}%
                        </span>
                      </div>
                    </td>

                    {/* LPR & Phone */}
                    <td style={{ minWidth: '190px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-black)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} color="var(--color-text-headline)" />
                        <span>{lead.contactName}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-headline)', marginBottom: '6px' }}>
                        {lead.role}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {lead.phone ? (
                          <a 
                            href={`tel:${lead.phone}`} 
                            className="btn btn-call"
                            style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
                            title="Позвонить прямо сейчас"
                          >
                            <Phone size={11} />
                            <span>{lead.phone}</span>
                          </a>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-headline)', fontFamily: 'var(--font-mono)' }}>Телефон в поиске</span>
                        )}

                        {lead.telegram && (
                          <a 
                            href={lead.telegram.startsWith('http') ? lead.telegram : `https://t.me/${lead.telegram.replace('@', '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn"
                            style={{ padding: '4px 7px', fontSize: '11px', borderRadius: '4px', background: '#229ED9', color: '#fff', border: 'none', display: 'flex', alignItems: 'center' }}
                            title={`Открыть Telegram: ${lead.telegram}`}
                          >
                            <Send size={11} />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Request & Service */}
                    <td style={{ minWidth: '240px', maxWidth: '320px' }}>
                      <div style={{ 
                        fontSize: '11px', 
                        color: 'var(--color-accent-purple)', 
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
                        color: 'var(--color-text-body)', 
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
                        {(() => {
                          const isDirect = lead.sourceType === 'direct' || (lead.source && (lead.source.includes('Web-поиск') || lead.source.includes('Google') || lead.source.includes('Прямой')));
                          const isCorp = lead.source && lead.source.includes('223-ФЗ');
                          const bg = isDirect ? '#dcfce7' : (isCorp ? '#e0f2fe' : '#f1f5f9');
                          const textCol = isDirect ? '#15803d' : (isCorp ? '#0369a1' : '#334155');
                          const borderCol = isDirect ? '#bbf7d0' : (isCorp ? '#bae6fd' : '#e2e8f0');

                          return (
                            <span style={{ 
                              fontSize: '11px', 
                              fontFamily: 'var(--font-mono)',
                              color: textCol, 
                              fontWeight: 600,
                              background: bg,
                              border: `1px solid ${borderCol}`,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {isDirect ? <Globe size={11} /> : (isCorp ? <Building2 size={11} /> : <Sparkles size={11} />)}
                              {lead.source}
                            </span>
                          );
                        })()}
                        {lead.url && (
                          <a 
                            href={lead.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={(e) => e.stopPropagation()} 
                            style={{ color: 'var(--color-text-headline)', display: 'inline-flex', alignItems: 'center' }}
                            title="Открыть первоисточник заказа"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-headline)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                        {lead.date}
                      </div>
                    </td>

                    {/* Budget */}
                    <td style={{ minWidth: '100px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-black)', fontFamily: 'var(--font-mono)' }}>
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
                          borderRadius: '4px',
                          border: '1px solid var(--border-medium)',
                          background: 'var(--color-surface-white)',
                          color: 'var(--color-text-black)',
                          fontFamily: 'inherit'
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
                    <td style={{ textAlign: 'right', minWidth: '50px' }}>
                      <button 
                        onClick={() => onSelectLead(lead)}
                        style={{ 
                          background: 'var(--color-surface-beige-3)', 
                          border: '1px solid var(--border-subtle)', 
                          color: 'var(--color-text-headline)', 
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        title="Подробнее"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer bar */}
      <div style={{ 
        padding: '14px 20px', 
        borderTop: '1px solid var(--border-subtle)', 
        background: 'var(--color-surface-beige-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--color-text-headline)'
      }}>
        <div>
          Отображено: <strong style={{ color: 'var(--color-text-black)', fontFamily: 'var(--font-mono)' }}>{leads.length}</strong> лидов из проверенных источников
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent-purple)', fontWeight: 600 }}>
          <ShieldCheck size={14} color="var(--color-accent-purple)" /> Все лиды прошли проверку на прямого заказчика (No Broker)
        </div>
      </div>
    </div>
  );
}
