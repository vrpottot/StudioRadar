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
  Globe,
  Zap,
  Radio,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { TARGET_INDUSTRIES, TARGET_SERVICES, LEAD_STATUSES, getLeadGrade, LEAD_GRADES } from '../data/leadsData';
import { exportLeadsToCsv } from '../utils/exportCsv';

export default function LeadTable({ 
  leads = [], 
  onSelectLead, 
  searchQuery, 
  setSearchQuery, 
  selectedIndustry, 
  setSelectedIndustry, 
  selectedService, 
  setSelectedService, 
  onlyWithPhone, 
  setOnlyWithPhone,
  leadTypeFilter = 'all',
  setLeadTypeFilter,
  ordersCount = 0,
  signalsCount = 0,
  onStatusChange
}) {
  const getIndustryBadgeColor = (ind) => {
    switch (ind) {
      case "Продукты питания и напитки": return "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]";
      case "Военная промышленность": return "bg-[#fef3c7] text-[#92400e] border-[#fde68a]";
      case "Авто и мото индустрия": return "bg-[#f1f5f9] text-[#334155] border-[#cbd5e1]";
      case "Банки и финансы": return "bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]";
      case "Газ и нефть": return "bg-[#f5f3ff] text-[#5b21b6] border-[#ddd6fe]";
      case "Бьюти": return "bg-[#fdf2f8] text-[#9d174d] border-[#fbcfe8]";
      case "Электротехника": return "bg-[#f8fafc] text-[#0f172a] border-[#e2e8f0]";
      case "Рекламные агентства и продакшн": return "bg-[#eef2ff] text-[#3730a3] border-[#c7d2fe]";
      default: return "bg-[#f8fafc] text-[#475467] border-[#e2e8f0]";
    }
  };

  const handleExport = () => {
    exportLeadsToCsv(leads, `studioradar_leads_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="card" style={{ overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
      {/* Category Segmented Tabs */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #e2e8f0',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div className="segmented-control">
          <button
            onClick={() => setLeadTypeFilter && setLeadTypeFilter('all')}
            className={`segmented-item ${leadTypeFilter === 'all' ? 'active' : ''}`}
            type="button"
          >
            <span>Все записи</span>
            <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              ({leads.length})
            </span>
          </button>

          <button
            onClick={() => setLeadTypeFilter && setLeadTypeFilter('order')}
            className={`segmented-item ${leadTypeFilter === 'order' ? 'active' : ''}`}
            style={{
              color: leadTypeFilter === 'order' ? '#065f46' : undefined
            }}
            type="button"
          >
            <Zap size={13} color={leadTypeFilter === 'order' ? '#059669' : '#64748b'} />
            <span>Прямые заказы и брифы</span>
            <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              ({ordersCount})
            </span>
          </button>

          <button
            onClick={() => setLeadTypeFilter && setLeadTypeFilter('signal')}
            className={`segmented-item ${leadTypeFilter === 'signal' ? 'active' : ''}`}
            style={{
              color: leadTypeFilter === 'signal' ? '#4f46e5' : undefined
            }}
            type="button"
          >
            <Radio size={13} color={leadTypeFilter === 'signal' ? '#4f46e5' : '#64748b'} />
            <span>Сигналы брендов</span>
            <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              ({signalsCount})
            </span>
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
          {leadTypeFilter === 'order' 
            ? 'Прямые брифы и заказы от коммерческих компаний и брендов' 
            : (leadTypeFilter === 'signal' ? 'Корпоративные триггеры спроса для прямого холодного выхода на ЛПР' : 'Единый поток целевых B2B-заказов и спроса')}
        </div>
      </div>

      {/* Search, Filter & Export Toolbar */}
      <div style={{ 
        padding: '14px 20px', 
        borderBottom: '1px solid #e2e8f0', 
        background: '#f8fafc',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input 
            type="text" 
            placeholder="Поиск по компании, ЛПР, задаче или номеру..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-control"
            style={{ width: '100%', paddingLeft: '36px', height: '36px', background: '#ffffff', borderRadius: '8px' }}
          />
        </div>

        {/* Filter Dropdowns & Export */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <select 
            value={selectedIndustry} 
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="input-control"
            style={{ height: '36px', cursor: 'pointer', background: '#ffffff', borderRadius: '8px' }}
          >
            {TARGET_INDUSTRIES.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>

          <select 
            value={selectedService} 
            onChange={(e) => setSelectedService(e.target.value)}
            className="input-control"
            style={{ height: '36px', cursor: 'pointer', background: '#ffffff', borderRadius: '8px' }}
          >
            {TARGET_SERVICES.map(srv => (
              <option key={srv} value={srv}>{srv}</option>
            ))}
          </select>

          <button
            onClick={() => setOnlyWithPhone(!onlyWithPhone)}
            className="btn"
            style={{
              height: '36px',
              padding: '0 12px',
              borderRadius: '8px',
              background: onlyWithPhone ? '#ecfdf5' : '#ffffff',
              color: onlyWithPhone ? '#065f46' : '#475467',
              border: `1px solid ${onlyWithPhone ? '#a7f3d0' : '#d0d5dd'}`
            }}
            type="button"
          >
            <PhoneCall size={14} color={onlyWithPhone ? '#059669' : '#64748b'} />
            <span>Только с телефоном</span>
          </button>

          {/* Export to CSV Button */}
          <button
            onClick={handleExport}
            className="btn btn-outline"
            style={{ height: '36px', padding: '0 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Экспортировать отфильтрованный список лидов в CSV / Excel"
            type="button"
          >
            <Download size={14} color="#4f46e5" />
            <span>Экспорт CSV</span>
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ minWidth: '180px' }}>Компания / Индустрия</th>
              <th style={{ minWidth: '95px' }}>Скоринг</th>
              <th style={{ minWidth: '200px' }}>Контактное лицо (ЛПР)</th>
              <th style={{ minWidth: '260px' }}>Задача и услуга</th>
              <th style={{ minWidth: '180px' }}>Источник</th>
              <th style={{ minWidth: '110px' }}>Бюджет</th>
              <th style={{ minWidth: '130px' }}>Статус</th>
              <th style={{ textAlign: 'right', minWidth: '50px' }}>Досье</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                  По заданным фильтрам лидов не найдено. Попробуйте сбросить фильтры поиска.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const grade = getLeadGrade(lead.score);
                const gradeMeta = LEAD_GRADES[grade] || { badgeBg: '#f1f5f9', badgeText: '#0f172a', badgeBorder: '#cbd5e1' };
                const isOrder = lead.leadType === 'order';

                return (
                  <tr key={lead.id} onClick={() => onSelectLead(lead)}>
                    {/* Company & Industry */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={15} color="#4f46e5" />
                        <span>{lead.company}</span>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span className={`badge ${getIndustryBadgeColor(lead.industry)}`} style={{ fontSize: '10px' }}>
                          {lead.industry}
                        </span>
                      </div>
                    </td>

                    {/* Priority Score */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span 
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: gradeMeta.badgeBg,
                            color: gradeMeta.badgeText,
                            border: `1px solid ${gradeMeta.badgeBorder}`,
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {grade}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748b', fontWeight: 600 }}>
                          {lead.score}%
                        </span>
                      </div>
                    </td>

                    {/* LPR & Phone */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={13} color="#64748b" />
                        <span>{lead.contactName}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                        {lead.role}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {lead.phone ? (
                          <a 
                            href={`tel:${lead.phone}`} 
                            className="btn btn-call"
                            style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}
                            title="Позвонить прямо сейчас"
                          >
                            <Phone size={10} />
                            <span>{lead.phone}</span>
                          </a>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>Телефон в поиске</span>
                        )}

                        {lead.telegram && (
                          <a 
                            href={lead.telegram.startsWith('http') ? lead.telegram : `https://t.me/${lead.telegram.replace('@', '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn"
                            style={{ padding: '3px 7px', fontSize: '11px', borderRadius: '6px', background: '#229ED9', color: '#fff', border: 'none', display: 'flex', alignItems: 'center' }}
                            title={`Открыть Telegram: ${lead.telegram}`}
                          >
                            <Send size={10} />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Request & Service */}
                    <td style={{ maxWidth: '320px' }}>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#4f46e5', 
                        fontWeight: 700, 
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Sparkles size={11} />
                        <span>{lead.service}</span>
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#334155', 
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        "{lead.requestText}"
                      </div>
                    </td>

                    {/* Source & Order Type */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {isOrder ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 700,
                              color: '#065f46', 
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Zap size={11} />
                              <span>Открытый заказ</span>
                            </span>
                            {(lead.applyUrl || lead.url) && (
                              <a 
                                href={lead.applyUrl || lead.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                onClick={(e) => e.stopPropagation()} 
                                style={{ 
                                  color: '#059669', 
                                  fontSize: '11px', 
                                  fontWeight: 700, 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '2px',
                                  textDecoration: 'none'
                                }}
                                title="Перейти на площадку и откликнуться на заказ"
                              >
                                <span>Откликнуться</span>
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ 
                              fontSize: '11px', 
                              fontFamily: 'var(--font-mono)',
                              color: '#4f46e5', 
                              fontWeight: 700,
                              background: '#eef2ff',
                              border: '1px solid #c7d2fe',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Radio size={11} />
                              <span>Сигнал спроса</span>
                            </span>
                            {lead.url && (
                              <a 
                                href={lead.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                onClick={(e) => e.stopPropagation()} 
                                style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center' }}
                                title="Открыть сайт компании / публикацию"
                              >
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#334155', fontWeight: 500 }}>
                          {lead.source || 'Прямой заказчик'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                          {lead.date}
                        </div>
                      </div>
                    </td>

                    {/* Budget */}
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                        {lead.budget}
                      </span>
                    </td>

                    {/* Status Select */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status || 'new'}
                        onChange={(e) => onStatusChange(lead.id, e.target.value)}
                        style={{
                          fontSize: '11px', 
                          padding: '4px 8px', 
                          width: '100%', 
                          cursor: 'pointer',
                          borderRadius: '6px',
                          border: '1px solid #d0d5dd',
                          background: '#ffffff',
                          color: '#0f172a',
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
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => onSelectLead(lead)}
                        style={{ 
                          background: '#f8fafc', 
                          border: '1px solid #e2e8f0', 
                          color: '#475467', 
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px',
                          transition: 'all 0.15s ease'
                        }}
                        title="Открыть полное досье"
                        type="button"
                      >
                        <ChevronRight size={16} />
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
        borderTop: '1px solid #e2e8f0', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <div>
          Отображено: <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{leads.length}</strong> лидов из проверенных источников
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 600 }}>
          <ShieldCheck size={14} color="#059669" /> 
          <span>Все лиды прошли проверку на прямого заказчика (No Broker)</span>
        </div>
      </div>
    </div>
  );
}
